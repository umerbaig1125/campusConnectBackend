const express = require('express');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const router = express.Router();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const upload = require('../middleware/upload');

const otpStore = {};

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) =>
        cb(null, Date.now() + path.extname(file.originalname)),
});
// const upload = multer({ storage });

// Signup Route
router.post('/signup', async (req, res) => {
    const { name, email, password, role } = req.body;
    console.log('Received data:', req.body);  // Add this to see the data
    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = new User({ name, email, password, role });
        await user.save();
        console.log('User created:', user);  // Add this to log user creation
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Don't include password or sensitive info
        res.status(200).json({
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                imageUrl: user.imageUrl || null // include this field
            },
            token
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Forgot Password Route
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Email address does not exist' });
        }

        // Generate 4-digit OTP
        const otp = Math.floor(1000 + Math.random() * 9000);
        const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

        // Store in-memory
        otpStore[email] = { otp, expiresAt };

        // Setup transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: `"Support Team" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'CampusConnect OTP Code',
            text: `Your OTP code for CampusConnect is ${otp}. It is valid for 10 minutes.`,
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: 'OTP sent successfully', otp }); // include OTP to use in app if needed
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Confirm Password Route
router.post('/confirm-password', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        // Hash the new password (same as signup)
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update the password in the database
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update Profile
router.put('/update-profile/:id', upload.single('image'), async (req, res) => {
    try {
        const { name, email } = req.body;
        const updateData = { name, email };

        if (req.file) {
            updateData.imageUrl = `/uploads/${req.file.filename}`;
        }

        const updatedUser = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });

        res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/auth/update-role
router.put('/update-role', async (req, res) => {
    const { email, role } = req.body;

    if (!email || !role) {
        return res.status(400).json({ message: 'Email and role are required' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.role = role;
        await user.save();

        res.status(200).json({ message: 'User role updated successfully', user });
    } catch (error) {
        console.error('Error updating role:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/members-by-leader-role', async (req, res) => {
    const { role } = req.query;

    const roleMap = {
        'Sports Society Leader': 'Sports Society Member',
        'Music Society Leader': 'Music Society Member',
        'Arts Society Leader': 'Arts Society Member',
        'Robotics Society Leader': 'Robotics Society Member'
    };

    const memberRole = roleMap[role];
    if (!memberRole) {
        return res.status(400).json({ message: 'Invalid leader role' });
    }

    try {
        const members = await User.find({ role: memberRole }, 'name email imageUrl');
        res.status(200).json({ members });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/delete-member/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await User.findByIdAndDelete(id);
        res.status(200).json({ message: 'Member deleted successfully.' });
    } catch (error) {
        console.error('Delete member error:', error);
        res.status(500).json({ message: 'Error deleting member.' });
    }
});

// GET /api/users/by-society-role/:role
router.get('/users/by-society-role/:role', async (req, res) => {
    const role = req.params.role;

    const roleMap = {
        'Sports Society Member': ['Sports Society Member', 'Sports Society Leader'],
        'Music Society Member': ['Music Society Member', 'Music Society Leader'],
        'Arts Society Member': ['Arts Society Member', 'Arts Society Leader'],
        'Robotics Society Member': ['Robotics Society Member', 'Robotics Society Leader'],
    };

    const allowedRoles = roleMap[role];

    if (!allowedRoles) {
        return res.status(400).json({ message: 'Invalid member role' });
    }

    try {
        const users = await User.find({ role: { $in: allowedRoles } }).select('name email imageUrl role');
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching users by role:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

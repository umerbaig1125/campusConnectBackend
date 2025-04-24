const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Feedback = require('../models/Feedback');
const EventRegistration = require('../models/EventRegistration');

// Create a new event
router.post('/', async (req, res) => {
    const { name, venue, description, date, time, image, societyName, createdBy, role } = req.body;

    if (!name || !venue || !description || !date || !time || !image || !societyName || !createdBy || !role) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        const event = new Event({
            name,
            venue,
            description,
            date,
            time,
            image,
            societyName,
            createdBy,  // Save the username who created the event
            role,  // Save the user's role who created the event
        });
        await event.save();
        res.status(201).json({ message: 'Event created successfully', event });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to create event' });
    }
});

// Get all events
router.get('/', async (req, res) => {
    try {
        const events = await Event.find().sort({ date: 1 });
        res.status(200).json(events);
    } catch (err) {
        console.error('Error fetching events:', err);
        res.status(500).json({ message: 'Failed to fetch events' });
    }
});

// Get today's events
router.get('/today', async (req, res) => {
    try {
        const start = new Date();
        start.setHours(0, 0, 0, 0);

        const end = new Date();
        end.setHours(23, 59, 59, 999);

        const todayEvents = await Event.find({
            date: { $gte: start, $lte: end }
        });

        res.status(200).json(todayEvents);
    } catch (err) {
        console.error('Error fetching today’s events:', err);
        res.status(500).json({ message: 'Failed to fetch today’s events' });
    }
});

// Update existing event
router.put('/:id', async (req, res) => {
    const { name, venue, description, date, time, image, societyName } = req.body;

    if (!name || !venue || !description || !date || !time || !image || !societyName) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        const updatedEvent = await Event.findByIdAndUpdate(
            req.params.id,
            { name, venue, description, date, time, image },
            { new: true }
        );

        if (!updatedEvent) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.status(200).json({ message: 'Event updated successfully', updatedEvent });
    } catch (err) {
        console.error('Error updating event:', err);
        res.status(500).json({ message: 'Failed to update event' });
    }
});

// Get past events
router.get('/past', async (req, res) => {
    const userEmail = req.query.email;

    try {
        // Get all feedbacks submitted by this user
        const userFeedbacks = await Feedback.find({ email: userEmail });
        const feedbackEventIds = userFeedbacks.map(fb => fb.eventId.toString());

        // Fetch past events (before current date)
        const today = new Date();
        const pastEvents = await Event.find({ date: { $lt: today } });

        // Filter out the ones the user has already submitted feedback on
        const filteredEvents = pastEvents.filter(
            event => !feedbackEventIds.includes(event._id.toString())
        );

        res.json(filteredEvents);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// POST /api/events/register
router.post('/register', async (req, res) => {
    const { userId, event } = req.body;

    try {
        // Check if the user is already registered for this event
        const existingRegistration = await EventRegistration.findOne({ userId, event });

        if (existingRegistration) {
            return res.status(400).json({ message: "You are already registered for this event" });
        }

        // Proceed with registration
        const registration = new EventRegistration({
            userId,
            userName: req.body.userName,
            email: req.body.email,
            imageUri: req.body.imageUri,
            event
        });

        await registration.save();
        res.status(201).json({ message: "Registered successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

router.get('/registration-status/:userId/:eventId', async (req, res) => {
    const { userId, eventId } = req.params;

    try {
        const registration = await EventRegistration.findOne({ userId, event: eventId });

        if (registration) {
            return res.json({ isRegistered: true });
        } else {
            return res.json({ isRegistered: false });
        }
    } catch (err) {
        console.error('Error checking registration status:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/events/:eventId/registrations
router.get('/:eventId/registrations', async (req, res) => {
    const { eventId } = req.params;

    try {
        const registrations = await EventRegistration.find({ event: eventId });
        res.status(200).json(registrations);
    } catch (error) {
        console.error('Error fetching registrations:', error);
        res.status(500).json({ message: 'Failed to fetch registrations' });
    }
});

// DELETE /api/events/:eventId/registrations/:registrationId
router.delete('/:eventId/registrations/:registrationId', async (req, res) => {
    const { registrationId } = req.params;

    try {
        const deleted = await EventRegistration.findByIdAndDelete(registrationId);
        if (!deleted) {
            return res.status(404).json({ message: 'Registration not found' });
        }
        res.status(200).json({ message: 'Player removed successfully' });
    } catch (err) {
        console.error('Error deleting registration:', err);
        res.status(500).json({ message: 'Server error' });
    }
});




module.exports = router;

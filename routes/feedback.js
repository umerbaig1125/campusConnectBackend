const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');

router.post('/', async (req, res) => {
    const {
        eventId,
        eventName,
        eventDate,
        eventTime,
        eventVenue,
        name,
        email,
        role,
        rating
    } = req.body;

    if (!eventId || !eventName || !eventDate || !eventTime || !eventVenue || !name || !email || !role || !rating) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        const feedback = new Feedback({
            eventId,
            eventName,
            eventDate,
            eventTime,
            eventVenue,
            name,
            email,
            role,
            rating
        });

        await feedback.save();
        res.status(201).json({ message: 'Feedback submitted successfully', feedback });
    } catch (err) {
        console.error('Error saving feedback:', err);
        res.status(500).json({ message: 'Failed to submit feedback' });
    }
});

// GET all feedbacks
router.get('/', async (req, res) => {
    try {
        const feedbacks = await Feedback.find().sort({ submittedAt: -1 }); // newest first
        res.status(200).json(feedbacks);
    } catch (error) {
        console.error('Error fetching feedbacks:', error);
        res.status(500).json({ message: 'Failed to fetch feedbacks' });
    }
});

module.exports = router;
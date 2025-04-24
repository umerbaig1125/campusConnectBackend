const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    eventName: String,
    eventDate: String,
    eventTime: String,
    eventVenue: String,
    name: String,
    email: String,
    role: String,
    rating: String,
    submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Feedback', feedbackSchema);
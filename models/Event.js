const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    name: String,
    venue: String,
    description: String,
    date: Date,
    time: String,
    image: String,
    societyName: String,
    createdBy: String,  // User's name who created the event
    role: String,  // User's role who created the event
});

module.exports = mongoose.model('Event', eventSchema);
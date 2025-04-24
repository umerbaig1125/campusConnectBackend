// models/EventRegistration.js
const mongoose = require('mongoose');

const eventRegistrationSchema = new mongoose.Schema({
    userId: String,
    userName: String,
    email: String,
    imageUri: String,
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event'
    }
}, { timestamps: true });

module.exports = mongoose.model('EventRegistration', eventRegistrationSchema);

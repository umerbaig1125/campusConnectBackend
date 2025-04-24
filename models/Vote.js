const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
    votedBy: { type: String, required: true }, // voter's email
    votedFor: {
        name: { type: String, required: true },
        email: { type: String, required: true }
    },
    society: { type: String, required: true }, // NEW
    createdAt: { type: Date, default: Date.now }
});

// Prevent duplicate votes in same society by same user
voteSchema.index({ votedBy: 1, society: 1 }, { unique: true });

const Vote = mongoose.model('Vote', voteSchema);
module.exports = Vote;
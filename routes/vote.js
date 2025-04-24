const express = require('express');
const router = express.Router();
const Vote = require('../models/Vote');
const User = require('../models/User');

// POST /api/vote
router.post('/', async (req, res) => {
    const { votedBy, votedFor, society } = req.body;

    if (!votedBy || !votedFor?.email || !votedFor?.name || !society) {
        return res.status(400).json({ message: 'Invalid vote data' });
    }

    try {
        // Check if the user has already voted in this society
        const alreadyVoted = await Vote.findOne({ votedBy, society });

        if (alreadyVoted) {
            return res.status(409).json({ message: 'You have already cast your vote in this society.' });
        }

        const vote = new Vote({ votedBy, votedFor, society });
        await vote.save();
        res.status(201).json({ message: 'Vote recorded successfully' });
    } catch (error) {
        console.error('Error saving vote:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/status/:email/:society', async (req, res) => {
    const { email, society } = req.params;

    try {
        const vote = await Vote.findOne({ votedBy: email, society });
        res.status(200).json({ hasVoted: !!vote });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get users by role
router.get('/users/by-society-role/:role', async (req, res) => {
    const { role } = req.params;

    try {
        const candidates = await User.find({ role });

        if (!candidates || candidates.length === 0) {
            return res.status(404).json({ message: 'No candidates found for this role' });
        }

        res.status(200).json(candidates);
    } catch (error) {
        console.error('Error fetching candidates:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/check', async (req, res) => {
    const { voter, society } = req.query;

    try {
        const existing = await Vote.findOne({ votedBy: voter, society });
        res.json({ voted: !!existing });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/vote/counts
router.get('/counts', async (req, res) => {
    try {
        const results = await Vote.aggregate([
            {
                $group: {
                    _id: { society: "$society", candidate: "$votedFor.name" },
                    votes: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: "$_id.society",
                    candidates: {
                        $push: {
                            name: "$_id.candidate",
                            votes: "$votes"
                        }
                    }
                }
            },
            {
                $project: {
                    society: "$_id",
                    _id: 0,
                    candidates: 1
                }
            }
        ]);

        res.status(200).json(results);
    } catch (error) {
        console.error("Error fetching vote counts:", error);
        res.status(500).json({ message: 'Server error' });
    }
});


module.exports = router;
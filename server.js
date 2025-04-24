const express = require('express');
const connectDB = require('./db');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const feedbackRoutes = require('./routes/feedback');
const voteRoutes = require('./routes/vote');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Log all incoming requests (debugging)
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// DB connect
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/uploads', express.static('uploads'));
app.use('/api/feedback', feedbackRoutes);
app.use('/api/vote', voteRoutes);

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});
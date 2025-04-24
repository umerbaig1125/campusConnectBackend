// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// const UserSchema = new mongoose.Schema({
//     name: { type: String, required: true },
//     email: { type: String, required: true, unique: true },
//     password: { type: String, required: true },
// });

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'user', 'Sports Society Leader', 'Music Society Leader', 'Arts Society Leader', 'Robotics Society Leader', 'Sports Society Member', 'Music Society Member', 'Arts Society Member', 'Robotics Society Member'], default: 'user' }, // auto-set
    imageUrl: { type: String, default: '' }, // auto-set
});

// Hash the password before saving the user
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Compare password
UserSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

const User = mongoose.model('User', UserSchema);

module.exports = User;

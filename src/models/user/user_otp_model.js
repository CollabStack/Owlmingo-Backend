const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    user_id: {
        type: String,
        required: true,
        ref: 'User'
    },
    otp: {
        type: String,
        required: true
    },
    expires: {
        type: Date,
        required: true
    },
    attempts: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('UserOtp', otpSchema);

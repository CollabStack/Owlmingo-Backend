const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const jwtUtil = require('../utils/jwt.util');
const OtpService = require('./user/opt.service');

const MAX_OTP_ATTEMPTS = 5;
const OTP_EXPIRE_MINUTES = 3;

// register with email 
register = async (username, email, password, role) => {
    try {
        // Check if email exists before creating user
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new Error('Email already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        // Pass `role` only if it is defined
        const userData = { username, email, password: hashedPassword};
        if (role) {
            userData.role = role;
        }

        const user = await User.create(userData);
        if (email) {
            try {
                await OtpService.createOtp(user.global_id, email);
            } catch (error) {
                // If OTP sending fails, still create the user but log the error
                console.error('OTP sending failed:', error);
                throw new Error('User created but verification email failed. Please try resending OTP.');
            }
        }
        return user;
    } catch (error) {
        throw error;
    }
};

login = async (email, password) => {
    try {
        const user = await User.findOne({ email });
        if (!user) {
            throw 'User not found';
        }

        // Add verification check
        if (!user.isVerified) {
            throw 'Please verify your email before logging in';
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            throw 'Invalid password';
        }
        const token = jwtUtil.generateToken({ global_id: user.global_id, role: user.role });
        return token;
    } catch (error) {
        throw error; // Pass the error up to the controller
    }
}

async function verifyOtp(email, enteredOtp) {
    const user = await User.findOne({ email });
    if (!user) {
        throw 'User not found';
    }

    if (user.isVerified) {
        throw 'Email already verified';
    }

    await OtpService.verifyOtp(user.global_id, enteredOtp);
    
    user.isVerified = true;
    await user.save();
    return user;
}

async function resendOtp(email) {
    const user = await User.findOne({ email });
    if (!user) {
        throw 'User not found';
    }

    if (user.isVerified) {
        throw 'Email already verified';
    }

    await OtpService.resendOtp(user.global_id, email);
    return { message: 'New OTP sent successfully' };
}

module.exports = {
    register,
    login,
    verifyOtp,
    resendOtp
};
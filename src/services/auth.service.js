const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const jwtUtil = require('../utils/jwt.util');
const { sendOtpEmail } = require('../utils/email.util');

const MAX_OTP_ATTEMPTS = 3;
const OTP_EXPIRE_MINUTES = 10;

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

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        userData.otp = otp;
        userData.otpExpires = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60000);
        userData.otpAttempts = 0;

        const user = await User.create(userData);
        if (email) {
            await sendOtpEmail(email, otp);
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

    if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
        throw 'Too many attempts. Please request a new OTP';
    }

    if (Date.now() > user.otpExpires) {
        throw 'OTP has expired. Please request a new one';
    }

    user.otpAttempts += 1;
    await user.save();

    if (user.otp !== enteredOtp) {
        throw `Invalid OTP. ${MAX_OTP_ATTEMPTS - user.otpAttempts} attempts remaining`;
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    user.otpAttempts = 0;
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

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + OTP_EXPIRE_MINUTES * 60000);
    user.otpAttempts = 0;
    await user.save();
    
    await sendOtpEmail(email, otp);
    return { message: 'New OTP sent successfully' };
}

module.exports = {
    register,
    login,
    verifyOtp,
    resendOtp
};
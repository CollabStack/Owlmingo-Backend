const User = require('../../models/user.model');
const UserOtp = require('../../models/user/user_otp_model');
const { sendResetPasswordEmail } = require('../../utils/email.util');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString();
};

exports.initiatePasswordReset = async (email) => {
    console.log('Searching for user with email:', email);
    
   const user = await User.findOne({ 
        email: email,
        isVerified: true
    });

    if (!user) {
        console.log('User not found or not verified:', email);
        throw new Error('User not found or not verified');
    }

    console.log('User found:', user.email);
    
    const otp = generateOTP();
    const expiryTime = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes

    const otpDoc = await UserOtp.findOneAndUpdate(
        { user_id: user.global_id },
        {
            otp: otp,
            expires: expiryTime,
            attempts: 0
        },
        { upsert: true, new: true }
    );

    console.log('OTP created:', otpDoc);

    await sendResetPasswordEmail(email, otp);
    return { message: 'Password reset OTP sent successfully' };
};

exports.verifyAndResetPassword = async (email, otp, newPassword) => {
    // Changed to MongoDB query syntax
    const user = await User.findOne({ 
        email: email,
        isVerified: true
    });

    if (!user) {
        throw new Error('User not found or not verified');
    }

    const otpRecord = await UserOtp.findOne({ 
        user_id: user.global_id 
    });

    if (!otpRecord || otpRecord.otp !== otp) {
        await UserOtp.updateOne(
            { user_id: user.global_id },
            { $inc: { attempts: 1 } }
        );
        throw new Error('Invalid OTP');
    }

    if (otpRecord.expires < new Date()) {
        throw new Error('OTP has expired');
    }

    if (otpRecord.attempts >= 3) {
        throw new Error('Too many attempts. Please request a new OTP');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    

    await User.updateOne(
        { _id: user._id },
        { $set: { password: hashedPassword } }
    );

    await UserOtp.deleteOne({ user_id: user.global_id });
    return { message: 'Password reset successful' };
};

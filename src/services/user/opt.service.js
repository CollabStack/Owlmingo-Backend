const UserOtp = require('../../models/user/user_otp_model');
const { sendOtpEmail } = require('../../utils/email.util');

const MAX_OTP_ATTEMPTS = 5;
const OTP_EXPIRE_MINUTES = 3;

class OtpService {
    static generateOtp() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    static async createOtp(userId, email) {
        const otp = this.generateOtp();
        await UserOtp.create({
            user_id: userId,
            otp,
            expires: new Date(Date.now() + OTP_EXPIRE_MINUTES * 60000),
            attempts: 0
        });

        await sendOtpEmail(email, otp);
        return otp;
    }

    static async verifyOtp(userId, enteredOtp) {
        const otpRecord = await UserOtp.findOne({ user_id: userId });
        
        if (!otpRecord) {
            throw new Error('No OTP record found');
        }

        if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
            throw new Error('Too many attempts. Please request a new OTP');
        }

        if (Date.now() > otpRecord.expires) {
            throw new Error('OTP has expired. Please request a new one');
        }

        otpRecord.attempts += 1;
        await otpRecord.save();

        if (otpRecord.otp !== enteredOtp) {
            throw new Error(`Invalid OTP. ${MAX_OTP_ATTEMPTS - otpRecord.attempts} attempts remaining`);
        }

        await otpRecord.deleteOne();
        return true;
    }

    static async resendOtp(userId, email) {
        await UserOtp.deleteOne({ user_id: userId });
        return await this.createOtp(userId, email);
    }
}

module.exports = OtpService;

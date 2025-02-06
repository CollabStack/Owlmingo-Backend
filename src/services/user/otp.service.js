const authService = require('../auth.service');

class OtpService {
    static async verifyOtp(email, otp) {
        try {
            const user = await authService.verifyOtp(email, otp);
            return {
                status: 'success',
                statusCode: 200,
                message: 'Email verified successfully',
                data: {
                    username: user.username,
                    email: user.email,
                    isVerified: user.isVerified
                }
            };
        } catch (err) {
            const errorMessage = err.message || err;
            return {
                status: 'error',
                statusCode: errorMessage.includes('Invalid OTP') ? 401 : 400,
                message: errorMessage,
                errorCode: errorMessage.includes('Invalid OTP') ? 'INVALID_OTP' : 
                          errorMessage.includes('expired') ? 'OTP_EXPIRED' : 
                          errorMessage.includes('Too many attempts') ? 'MAX_ATTEMPTS_REACHED' : 
                          'VERIFICATION_FAILED',
                data: {
                    remainingAttempts: err.remainingAttempts,
                    isLocked: errorMessage.includes('Too many attempts'),
                    canResend: errorMessage.includes('expired') || errorMessage.includes('Too many attempts')
                }
            };
        }
    }

    static async resendOtp(email) {
        try {
            await authService.resendOtp(email);
            return {
                status: 'success',
                statusCode: 200,
                message: 'New OTP has been sent',
                data: {
                    email: email,
                    expiresIn: '3 minutes',
                    maxAttempts: 5
                }
            };
        } catch (err) {
            return {
                status: 'error',
                statusCode: 400,
                message: err.message || err,
                errorCode: err.message.includes('verified') ? 'ALREADY_VERIFIED' :
                          err.message.includes('not found') ? 'USER_NOT_FOUND' : 'OTP_SEND_FAILED'
            };
        }
    }
}

module.exports = OtpService;

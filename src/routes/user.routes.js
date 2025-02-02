const express = require('express');
const multer = require('multer');
const router = express.Router();
const authController = require('../controllers/Api/v1/user/auth.controller');
const userController = require('../controllers/Api/v1/user/change_password.controller');
const {userAuth} = require('../middlewares/auth.middleware');
const OcrController = require('../controllers/Api/v1/user/ocr.controller');
const { uploadMiddleware } = require('../middlewares/file_upload.middleware');
const { getPlans, getPlan } = require('../controllers/Api/v1/user/plan.controller');
// Public Routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ 
                status: 'error',
                message: 'Email and OTP are required',
                errorCode: 'MISSING_FIELDS'
            });
        }

        const user = await require('../services/auth.service').verifyOtp(email, otp);
        res.status(200).json({
            status: 'success',
            message: 'Email verified successfully',
            data: {
                username: user.username,
                email: user.email,
                isVerified: user.isVerified
            }
        });
    } catch (err) {
        const errorMessage = err.message || err;
        const statusCode = errorMessage.includes('Invalid OTP') ? 401 : 400;
        
        // Extract remaining attempts from error message if available
        const remainingAttempts = errorMessage.match(/(\d+) attempts remaining/);
        
        res.status(statusCode).json({ 
            status: 'error',
            message: errorMessage,
            errorCode: errorMessage.includes('Invalid OTP') ? 'INVALID_OTP' : 
                      errorMessage.includes('expired') ? 'OTP_EXPIRED' : 
                      errorMessage.includes('Too many attempts') ? 'MAX_ATTEMPTS_REACHED' : 
                      'VERIFICATION_FAILED',
            data: {
                remainingAttempts: remainingAttempts ? parseInt(remainingAttempts[1]) : undefined,
                isLocked: errorMessage.includes('Too many attempts'),
                canResend: errorMessage.includes('expired') || errorMessage.includes('Too many attempts')
            }
        });
    }
});

router.post('/resend-otp', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ 
                status: 'error',
                message: 'Email is required',
                errorCode: 'MISSING_EMAIL'
            });
        }
        const result = await require('../services/auth.service').resendOtp(email);
        res.status(200).json({
            status: 'success',
            message: 'New OTP has been sent',
            data: {
                email: email,
                expiresIn: '3 minutes',
                maxAttempts: 5
            }
        });
    } catch (err) {
        res.status(400).json({ 
            status: 'error',
            message: err.message || err,
            errorCode: err.includes('verified') ? 'ALREADY_VERIFIED' :
                      err.includes('not found') ? 'USER_NOT_FOUND' : 'OTP_SEND_FAILED'
        });
    }
});

// Public Routes for password reset 
router.post('/forget-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                status: 'error',
                message: 'Email is required'
            });
        }
        const result = await require('../services/user/opt_reset_pass.service').initiatePasswordReset(email);
        res.status(200).json({
            status: 'success',
            message: result.message
        });
    } catch (err) {
        res.status(400).json({
            status: 'error',
            message: err.message
        });
    }
});

router.post('/reset-password', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) {
            return res.status(400).json({
                status: 'error',
                message: 'Email, OTP, and new password are required',
                errorCode: 'MISSING_FIELDS'
            });
        }
        const result = await require('../services/user/opt_reset_pass.service').verifyAndResetPassword(email, otp, newPassword);
        res.status(200).json({
            status: 'success',
            message: result.message
        });
    } catch (err) {
        const statusCode = err.message.includes('Invalid OTP') ? 401 : 400;
        res.status(statusCode).json({
            status: 'error',
            message: err.message,
            errorCode: err.message.includes('Maximum attempts exceeded') ? 'MAX_ATTEMPTS_REACHED' :
                      err.message.includes('Invalid OTP') ? 'INVALID_OTP' :
                      err.message.includes('expired') ? 'OTP_EXPIRED' : 'RESET_FAILED',
            data: {
                remainingAttempts: err.remainingAttempts,
                isLocked: err.message.includes('Maximum attempts exceeded'),
                canResend: err.message.includes('Maximum attempts exceeded') || 
                          err.message.includes('expired') ||
                          err.message.includes('No OTP request found')
            }
        });
    }
});

router.get('/plans', getPlans);
router.get('/plans/:id', getPlan);

// Private Routes (need auth)
const privateRouter = express.Router();
privateRouter.use(userAuth); // Correct middleware usage for user authentication

privateRouter.post('/refresh-token', authController.refreshUserToken);
privateRouter.post('/change-password', userController.changePassword);

privateRouter.post('/process-file', uploadMiddleware, OcrController.processFile);
privateRouter.post('/process-text', OcrController.processText);

// Set prefix for private routes
router.use('/auth', privateRouter);

module.exports = router;

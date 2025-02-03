const express = require('express');
const multer = require('multer');
const router = express.Router();
const authController = require('../controllers/Api/v1/user/auth.controller');
const userController = require('../controllers/Api/v1/user/change_password.controller');
const {userAuth} = require('../middlewares/auth.middleware');
const OcrController = require('../controllers/Api/v1/user/ocr.controller');
const authService = require('../services/auth.service');
const resetPasswordService = require('../services/user/opt_reset_pass.service');

// Configure multer for image uploads
const upload = multer({
    limits: {
        fileSize: 150 * 1024 * 1024, // 150MB max file size
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only images (JPEG/PNG), PDF, DOCX, and PPTX files are allowed'));
        }
    }
});

// Public Routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await authService.verifyOtp(email, otp);
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
        
        res.status(statusCode).json({ 
            status: 'error',
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
        });
    }
});

router.post('/resend-otp', async (req, res) => {
    try {
        const result = await authService.resendOtp(req.body.email);
        res.status(200).json({
            status: 'success',
            message: 'New OTP has been sent',
            data: {
                email: req.body.email,
                expiresIn: '3 minutes',
                maxAttempts: 5
            }
        });
    } catch (err) {
        res.status(400).json({ 
            status: 'error',
            message: err.message || err,
            errorCode: err.message.includes('verified') ? 'ALREADY_VERIFIED' :
                      err.message.includes('not found') ? 'USER_NOT_FOUND' : 'OTP_SEND_FAILED'
        });
    }
});

router.post('/forget-password', async (req, res) => {
    try {
        const result = await resetPasswordService.initiatePasswordReset(req.body.email);
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
        const result = await resetPasswordService.verifyAndResetPassword(email, otp, newPassword);
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

// Private Routes (need auth)
const privateRouter = express.Router();
privateRouter.use(userAuth); // Correct middleware usage for user authentication

privateRouter.post('/refresh-token', authController.refreshUserToken);
privateRouter.post('/change-password', userController.changePassword);
privateRouter.post('/process-file', upload.single('file'), OcrController.processFile);
privateRouter.post('/process-text', OcrController.processText);

// Set prefix for private routes
router.use('/auth', privateRouter);

module.exports = router;

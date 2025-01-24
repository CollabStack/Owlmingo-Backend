const express = require('express');
const router = express.Router();
const authController = require('../controllers/Api/v1/user/auth.controller');
const {userAuth} = require('../middlewares/auth.middleware');

// Public Routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ 
                status: 'error',
                message: 'Email and OTP are required' 
            });
        }
        const user = await require('../services/auth.service').verifyOtp(email, otp);
        res.status(200).json({
            status: 'success',
            message: 'Email verified successfully',
            user: {
                username: user.username,
                email: user.email,
                isVerified: user.isVerified
            }
        });
    } catch (err) {
        res.status(400).json({ 
            status: 'error',
            message: err 
        });
    }
});

router.post('/resend-otp', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ 
                status: 'error',
                message: 'Email is required' 
            });
        }
        const result = await require('../services/auth.service').resendOtp(email);
        res.status(200).json({
            status: 'success',
            message: result.message
        });
    } catch (err) {
        res.status(400).json({ 
            status: 'error',
            message: err 
        });
    }
});

// Public Routes for password reset (no auth needed)
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
                message: 'Email, OTP, and new password are required'
            });
        }
        const result = await require('../services/user/opt_reset_pass.service').verifyAndResetPassword(email, otp, newPassword);
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

// Private Routes (need auth)
const privateRouter = express.Router();
privateRouter.use(userAuth); // Correct middleware usage for user authentication

privateRouter.post('/refresh-token', authController.refreshUserToken);

// Set prefix for private routes
router.use('/auth', privateRouter);

module.exports = router;

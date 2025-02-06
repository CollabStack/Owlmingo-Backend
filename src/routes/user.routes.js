const express = require('express');
const multer = require('multer');
const router = express.Router();
const authController = require('../controllers/Api/v1/user/auth.controller');
const userController = require('../controllers/Api/v1/user/change_password.controller');
const {userAuth} = require('../middlewares/auth.middleware');
const OcrController = require('../controllers/Api/v1/user/ocr.controller');
const authService = require('../services/auth.service');
const resetPasswordService = require('../services/user/opt_reset_pass.service');
const OtpService = require('../services/user/otp.service');
const quizController = require('../controllers/quiz.controller');

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
    const { email, otp } = req.body;
    const result = await OtpService.verifyOtp(email, otp);
    res.status(result.statusCode).json(result);
});

router.post('/resend-otp', async (req, res) => {
    const result = await OtpService.resendOtp(req.body.email);
    res.status(result.statusCode).json(result);
});

router.post('/forget-password', async (req, res) => {
    const result = await resetPasswordService.initiatePasswordReset(req.body.email);
    res.status(result.statusCode).json(result);
});

router.post('/reset-password', async (req, res) => {
    const { email, otp, newPassword } = req.body;
    const result = await resetPasswordService.verifyAndResetPassword(email, otp, newPassword);
    res.status(result.statusCode).json(result);
});

// Private Routes (need auth)
const privateRouter = express.Router();
privateRouter.use(userAuth); // Correct middleware usage for user authentication

privateRouter.post('/refresh-token', authController.refreshUserToken);
privateRouter.post('/change-password', userController.changePassword);
privateRouter.post('/process-file', upload.single('file'), OcrController.processFile);
privateRouter.post('/process-text', OcrController.processText);

// Quiz Routes
privateRouter.post('/quiz/generate', quizController.generateQuiz);
privateRouter.get('/quiz/:quizId/questions', quizController.getQuestionsByQuizId);
privateRouter.post('/quiz/questions', quizController.createQuestion);
privateRouter.get('/quiz/questions', quizController.getQuestions);
privateRouter.post('/quiz/answers', quizController.createAnswer);
privateRouter.get('/quiz/answers', quizController.getAnswers);

// Set prefix for private routes
router.use('/auth', privateRouter);

module.exports = router;

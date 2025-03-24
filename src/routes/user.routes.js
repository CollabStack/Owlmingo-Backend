const express = require('express');
const multer = require('multer');
const router = express.Router();
const authController = require('../controllers/Api/v1/user/auth.controller');
const userController = require('../controllers/Api/v1/user/change_password.controller');
const githubController = require('../controllers/Api/v1/user/github.controller'); // Add this import
const {userAuth} = require('../middlewares/auth.middleware');
const { telegramOAuth } = require('../controllers/Api/v1/user/telegram.controller');
const OcrController = require('../controllers/Api/v1/user/ocr.controller');
const resetPasswordService = require('../services/user/opt_reset_pass.service');
const OtpService = require('../services/user/otp.service');
const quizController = require('../controllers/quiz.controller');
const { uploadMiddleware } = require('../middlewares/file_upload.middleware');
const { getPlans, getPlan } = require('../controllers/Api/v1/user/plan.controller');
const { googleLogin, googleCallback, googleSuccess } = require('../controllers/Api/v1/user/google.controller');
const SummaryController = require('../controllers/Api/v1/user/summary.controller');
const FlashCardController = require('../controllers/Api/v1/user/flash_card.controller');
const FlashCardSessionController = require('../controllers/Api/v1/user/flash_card_session.controller');
const {payment, capture} = require('../controllers/Api/v1/user/paypal.controller');

// Public Routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/telegram-oauth', telegramOAuth);
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

// Google OAuth
router.get('/google', googleLogin);
router.get('/google/callback', googleCallback, googleSuccess);

// Github OAuth - Fixed: Use the correct controller
router.get('/github', githubController.githubLogin);
router.get('/github/callback', githubController.githubCallback, githubController.githubSuccess);

router.get('/plans', getPlans);
router.get('/plans/:id', getPlan);

// Public route for shared flashcards
router.get('/shared/flashcards/:globalId', FlashCardController.getSharedFlashCard);

// Private Routes (need auth)
const privateRouter = express.Router();
privateRouter.use(userAuth); // Correct middleware usage for user authentication

privateRouter.post('/refresh-token', authController.refreshUserToken);
privateRouter.post('/change-password', userController.changePassword);

privateRouter.post('/process-file', uploadMiddleware, OcrController.processFile);
privateRouter.post('/process-text', OcrController.processText);
privateRouter.post('/process-youtube', OcrController.processYoutube);

// Quiz Routes
privateRouter.post('/quiz/generate', quizController.generateQuiz);
privateRouter.get('/quiz/sessions/:sessionId', quizController.getQuizSession);
privateRouter.get('/quiz/sessions', quizController.getUserQuizSessions);
privateRouter.get('/quiz/:quizId/questions', quizController.getQuestionsByQuizId);
privateRouter.post('/quiz/questions', quizController.createQuestion);
privateRouter.post('/quiz/submit-answer', quizController.submitAnswer);
privateRouter.get('/quiz/:quizId/answers', quizController.getQuizAnswers);
privateRouter.put('/quiz/:quizId/questions/:questionIndex', quizController.updateQuestion);
privateRouter.put('/quiz/:quizId/title', quizController.updateQuizTitle);
privateRouter.get('/quiz/:quizId/review', quizController.getQuizReview);
privateRouter.get('/quiz/:quizId/with-answers', quizController.getQuizWithAnswers);
privateRouter.get('/quiz/:quizId/with-answer', quizController.getQuizWithAnswers); // For compatibility
// Add new route to get all quizzes
privateRouter.get('/quizzes', quizController.getAllQuizzes);

// Summary Routes
privateRouter.post('/summaries', SummaryController.createSummary);
privateRouter.get('/summaries/:globalId', SummaryController.getSummary);
privateRouter.get('/summaries', SummaryController.getAllSummaries);
privateRouter.get('/summariesTitle', SummaryController.getSummariesTitle); 
privateRouter.put('/summaries/:globalId', SummaryController.updateSummary);
privateRouter.delete('/summaries/:globalId', SummaryController.deleteSummary);

// Flash Card Session Routes 
privateRouter.get('/flashcards/sessions/:globalId', FlashCardSessionController.getSession);
privateRouter.get('/flashcards/:flashCardId/sessions', FlashCardSessionController.getSessionsByFlashCard);
privateRouter.post('/flashcards/sessions/:sessionId/cards/:cardId/review', FlashCardSessionController.updateCardReview);
privateRouter.get('/flashcards/sessions', FlashCardSessionController.getSessions);

// Flash Card Routes 
privateRouter.post('/flashcards/generate', FlashCardController.generateFromText);
privateRouter.post('/flashcards/:flashCardId/cards', FlashCardController.createFlashCard);  
privateRouter.get('/flashcards/:globalId', FlashCardController.getAllFlashCard);
privateRouter.get('/flashcards/:flashCardId/cards/:cardId', FlashCardController.getSpecificCard); 
privateRouter.get('/flashcards', FlashCardController.getAllFlashCards);
privateRouter.put('/flashcards/:globalId', FlashCardController.updateFlashCard);
privateRouter.delete('/flashcards/:globalId', FlashCardController.deleteFlashCard);
privateRouter.delete('/flashcards/:globalId/cards/:cardId', FlashCardController.deleteSpecificCard); 

privateRouter.post('/flashcards/:globalId/cards/:cardId/exam', FlashCardController.examCard);

// Remove the multipleUpload configuration and use single file upload
privateRouter.post(
    '/flashcards/:globalId/cards/:cardId/images/front',
    uploadMiddleware,
    FlashCardController.uploadFrontImage
);

privateRouter.post(
    '/flashcards/:globalId/cards/:cardId/images/back',
    uploadMiddleware,
    FlashCardController.uploadBackImage
);

// Add route for sharing flash cards
privateRouter.put('/flashcards/:globalId/share', FlashCardController.toggleShareFlashCard);

privateRouter.post('/create-order', payment);
privateRouter.post('/capture-order', capture);
// Set prefix for private routes
router.use('/auth', privateRouter);
module.exports = router;

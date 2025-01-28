const express = require('express');
const router = express.Router();
const authController = require('../controllers/Api/v1/user/auth.controller');
const {uploadFile} = require('../controllers/Api/v1/user/file.controller');
const {userAuth} = require('../middlewares/auth.middleware');
const { uploadMiddleware } = require('../middlewares/file_upload.middleware');

// Public Routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Private Routes
const privateRouter = express.Router();
privateRouter.use(userAuth); // Correct middleware usage for user authentication

privateRouter.post('/refresh-token', authController.refreshUserToken);
privateRouter.post('/upload-file/:id', uploadMiddleware, uploadFile);

// Set prefix for private routes
router.use('/auth', privateRouter);

module.exports = router;

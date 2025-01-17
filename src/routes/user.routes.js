const express = require('express');
const router = express.Router();
const authController = require('../controllers/Api/v1/auth.controller');
const userAuth = require('../middlewares/auth.middleware');

// Public Routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Private Routes
const privateRouter = express.Router();
privateRouter.use(userAuth.userAuth); // Correct middleware usage for user authentication

privateRouter.post('/refresh-token', authController.refreshUserToken);

// Set prefix for private routes
router.use('/auth/v1', privateRouter);

module.exports = router;

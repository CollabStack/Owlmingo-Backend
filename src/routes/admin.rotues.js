const express = require('express');
const router = express.Router();
const authController = require('../controllers/Api/v1/auth.controller');
const auth = require('../middlewares/auth.middleware');

// Public Routes
router.post('/register', authController.register);
router.post('/login', authController.login);


// Private Routes
const privateRouter = express.Router();
privateRouter.use(auth.adminAuth); // Correct middleware usage for admin authentication

privateRouter.post('/refresh-token', authController.refreshUserToken);

// Set prefix for private routes
router.use('/auth/v1', privateRouter);

module.exports = router;
const express = require('express');
const router = express.Router();
const authController = require('../controllers/Api/v1/user/auth.controller');
const {userAuth} = require('../middlewares/auth.middleware');
const {githubLogin, githubCallback, githubSuccess} = require('../controllers/Api/v1/user/github.controller');
// Public Routes
router.post('/register', authController.register);
router.post('/login', authController.login);
// GitHub login route
router.get('/github', githubLogin);

// GitHub callback route
router.get('/github/callback', githubCallback, githubSuccess);
// Private Routes
const privateRouter = express.Router();
privateRouter.use(userAuth); // Correct middleware usage for user authentication

privateRouter.post('/refresh-token', authController.refreshUserToken);

// Set prefix for private routes
router.use('/auth', privateRouter);

module.exports = router;

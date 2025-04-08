const express = require('express');
const router = express.Router();
const authController = require('../controllers/Api/v1/admin/auth.controller');
const auth = require('../middlewares/auth.middleware');
const { getPlans, getPlan, createPlan, updatePlan, togglePlanActivation } = require('../controllers/Api/v1/admin/plan.controller');
const { getAllPayments } = require('../controllers/Api/v1/admin/payment.controller');
const { getAllUsers, updateUser, activationUser } = require('../controllers/Api/v1/admin/user.controller'); // Assuming you have a user controller for admin

// Public Routes
router.post('/register', authController.register);
router.post('/login', authController.login);


// Private Routes
const privateRouter = express.Router();
privateRouter.use(auth.adminAuth); // Correct middleware usage for admin authentication

privateRouter.post('/refresh-token', authController.refreshUserToken);
// Plan routes
privateRouter.get('/plans', getPlans);
privateRouter.get('/plans/:id', getPlan);
privateRouter.post('/plans', createPlan);
privateRouter.put('/plans/:id', updatePlan);
privateRouter.put('/plans/:id/toggle-activation', togglePlanActivation);

privateRouter.get('/payments', getAllPayments); // Assuming this is the correct route for payments
privateRouter.get('/users', getAllUsers); // Assuming this is the correct route for payments
privateRouter.put('/users/:id', updateUser); // Assuming this is the correct route for payments
privateRouter.patch('/users/:id', activationUser); // Assuming this is the correct route for payments


// Set prefix for private routes
router.use('/auth', privateRouter);

module.exports = router;
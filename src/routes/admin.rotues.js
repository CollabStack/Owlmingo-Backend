const express = require('express');
const router = express.Router();
const adminController = require('../controllers/Api/v1/admin.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.get('/admin/auth/v1/profile/:id', authMiddleware, adminController.getAdminProfile);
module.exports = router;
const jwtUtil = require('../utils/jwt.util');
const User = require('../models/user.model');
const { successResponse, errorResponse } = require('../controllers/Api/baseAPI.controller');

const authMiddleware = (role) => {
    return async (req, res, next) => {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');

            if (!token) {
                errorResponse(res, 'Token not provided');
            }

            const decoded = jwtUtil.verifyToken(token);  // verify the token
            const user = await User.findOne({ where: { global_id: decoded.global_id } });

            if (!user) {
                errorResponse(res, 'User not found');
            }

            if (user.role !== role) {
                errorResponse(res, 'Forbidden');
            }

            next();
        } catch (error) {
            errorResponse(res, error.message);
        }
    };
};

module.exports = {
    userAuth: authMiddleware('user'),
    adminAuth: authMiddleware('admin'),
};

const jwtUtil = require('../utils/jwt.util');
const User = require('../models/user.model');
const { errorResponse } = require('../controllers/Api/baseAPI.controller');

const authMiddleware = (role) => {
    return async (req, res, next) => {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (!token) {
                return errorResponse(res, 'Token not provided', 401);
            }

            const decoded = jwtUtil.verifyToken(token);
            const global_id = decoded.global_id;
            const user = await User.findOne({ global_id });

            if (!user) {
                return errorResponse(res, 'User not found', 401);
            }

            if (user.role !== role) {
                return errorResponse(res, 'Forbidden', 403);
            }

            // Attach the user object to the request
            req.user = user;
            next();
        } catch (error) {
            return errorResponse(res, error.message, 401);
        }
    };
};

module.exports = {
    userAuth: authMiddleware('user'),
    adminAuth: authMiddleware('admin'),
};

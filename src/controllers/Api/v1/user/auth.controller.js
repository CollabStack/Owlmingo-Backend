const { successResponse, errorResponse } = require('../../baseAPI.controller');
const authService = require('../../../../services/auth.service');
const User = require('../../../../models/user.model');
const { refreshToken } = require('../../../../utils/jwt.util');

register = async (req, res) => {
    try {
        const { username, email, password, role ='user'} = req.body;
        const user = await authService.register(username, email, password, role);
        successResponse(res, {
            username: user.username,
            email: user.email,
            isVerified: user.isVerified
        }, 'Registration successful. Please check your email for OTP.');
    } catch (error) {
        errorResponse(res, error.message || 'Registration failed');
    }
};

login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const {token, user} = await authService.login(email, password);
        successResponse(res, {token, user}, 'User logged in successfully');
    } catch (error) {
        if (error === 'Please verify your email before logging in') {
            errorResponse(res, error, 403); // Using 403 Forbidden for unverified users
        } else if (error.name === "SequelizeUniqueConstraintError") {
            const message = error.errors.map((e) => e.message);
            errorResponse(res, message);
        } else {
            errorResponse(res, error);
        }
    }
};

const refreshUserToken = async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return errorResponse(res, 'Token not provided');
        }
        const newToken = refreshToken(token);
        
        const user = await User.findById(req.user.id);

        if (!user) {
            return errorResponse(res, 'User not found');
        }
        // Remove the password field before sending the user object in the response
        const safeUser = user.toObject ? user.toObject() : { ...user };
        delete safeUser.password;

        successResponse(res, { token: newToken, user: safeUser }, 'Token refreshed successfully');
    } catch (error) {
        errorResponse(res, error);
    }
};

module.exports = {
    register,
    login, 
    refreshUserToken
};
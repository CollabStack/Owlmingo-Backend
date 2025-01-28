const { successResponse, errorResponse } = require('../../baseAPI.controller');
const authService = require('../../../../services/auth.service');
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
        const token = await authService.login(email, password);
        successResponse(res, { token }, 'User logged in successfully');
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

refreshUserToken = async (req, res) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        if (!token) {
            return errorResponse(res, 'Token not provided');
        }
        const newToken = await refreshToken(token);
        successResponse(res, { token: newToken }, 'Token refreshed successfully');
    } catch (error) {
        errorResponse(res, error);
    }
};

module.exports = {
    register,
    login, 
    refreshUserToken
};
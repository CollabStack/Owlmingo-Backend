const { successResponse, errorResponse } = require('../../baseAPI.controller');
const authService = require('../../../../services/auth.service');
const { refreshToken } = require('../../../../utils/jwt.util');
const User = require('../../../../models/user.model');

register = async (req, res) => {
    try {
        const { username, email, password, role ='admin' } = req.body;
        const user = await authService.register(username, email, password, role);
        successResponse(res, user, 'User registered successfully');
    } catch (error) {
        if (error.name === "ValidationError") {
            const errors = Object.values(error.errors).map((e) => e.message);
            errorResponse(res, errors);
        }
        else {
            errorResponse(res, error);
        }
    }
};

login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const token = await authService.login(email, password, 'admin');
        successResponse(res, token , 'User logged in successfully');
    } catch (error) {
        if (error.name === "SequelizeUniqueConstraintError") {
            message = error.errors.map((e) => e.message);
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
        const user = await User.findById(req.user.id);
        if(!user) {
            return errorResponse(res, 'User not found');
        }

        // Remove the password field before sending the user object in the response
        const safeUser = user.toObject ? user.toObject() : { ...user };
        delete safeUser.password;
        
        successResponse(res, { token: newToken , user: safeUser}, 'Token refreshed successfully');
    } catch (error) {
        errorResponse(res, error);
    }
};

module.exports = {
    register,
    login, 
    refreshUserToken
};
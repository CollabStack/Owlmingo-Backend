const e = require('express');
const userService = require('../../../../services/user/change_password.service');
const { successResponse, errorResponse } = require('../../baseAPI.controller');
 
changePassword = async (req, res) => {
    try {
        const { userId, oldPassword, newPassword } = req.body;
        if (!userId || !oldPassword || !newPassword) {
            return errorResponse(res, 'All fields are required', 400);
        }

        const result = await userService.changePassword(userId, oldPassword, newPassword);
        successResponse(res, result, 'Password changed successfully');
    } catch (error) {
        errorResponse(res, error.message || 'Password change failed', 400);
    }
};

module.exports = {
    changePassword
};
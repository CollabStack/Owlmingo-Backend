const { successResponse, errorResponse } = require('../../baseAPI.controller');
const telegramAuthService = require('../../../../services/telegram_auth.service');
const { refreshToken } = require('../../../../utils/jwt.util');

telegramOAuth = async (req, res) => {
    try {
        const { first_name, last_name, username, telegram_id } = req.body;
        const { token, user } = await telegramAuthService.telegramOAuth(first_name, last_name, username, telegram_id);
        console.log("===================== Telegram OAuth ======================");
        console.log("User: ", user);
        console.log("Token: ", token);
        console.log("===========================================================");
        successResponse(res, { token, user }, 'User logged in successfully');
    } catch (error) {
        errorResponse(res, error);
    }
};

module.exports = {
    telegramOAuth
};
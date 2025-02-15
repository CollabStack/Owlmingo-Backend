const jwtUtil = require('../utils/jwt.util');
const User = require('../models/user.model');

telegramOAuth = async (first_name, last_name, username, telegram_id, ) => {
    try{
        const existingUser = await User.findOne({ telegram_id: telegram_id });
        if (existingUser) {
        }
        const username_format = first_name + " " + last_name || username;
        if (!existingUser && username_format && telegram_id) {
            const user = await User.create({ 
                username: username_format, 
                telegram_id 
            });
        }
        if(!username_format || !telegram_id){
            throw new Error('Invalid data for Registration!!!');
        }
        const userData = existingUser || user;
        const token = jwtUtil.generateToken({ global_id: userData.global_id, role: userData.role });
        return { token, user: userData };
    } catch (error) {
        throw error;
    }
};

module.exports = {
    telegramOAuth
}
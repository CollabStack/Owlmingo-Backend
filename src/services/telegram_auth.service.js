const jwtUtil = require('../utils/jwt.util');
const User = require('../models/user.model');

telegramOAuth = async (first_name, last_name, username, telegram_id, ) => {
    try{
        const existingUser = await User.findOne({ telegram_id: telegram_id });
        if (existingUser) {
        }
        const username_format = first_name + " " + last_name || username;
        let user = null;
        if (!existingUser && username_format && telegram_id) {
            user = await User.create({ 
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
        console.log("====================== Telegram OAuth Error ======================");
        console.log("Error: ", error);
        console.log("===========================================================");
        throw error;
    }
};

module.exports = {
    telegramOAuth
}
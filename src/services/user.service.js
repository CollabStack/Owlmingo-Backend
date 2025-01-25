const bcrypt = require('bcrypt');
const User = require('../models/user.model');

exports.getUserProfile = async (global_id) => {
    try{
        const user = await User.findOne({ where: { global_id } });
        if (!user) {
            throw 'User not found';
        }
        return user;
    } catch(error){
        throw error;
    }

};

exports.getAllUsers = async () => {
    try{
        const users = await User.findAll();
        return users;
    } catch(error){
        throw error;
    }

};

module.exports = {
};
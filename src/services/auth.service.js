const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const jwtUtil = require('../utils/jwt.util');

exports.register = async (username, email, password, role = null) => {
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ username, email, password: hashedPassword, role });
        return user;
    } catch (error) {
        throw error; // Pass the error up to the controller
    }
};

exports.login = async (email, password) => {
    try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            throw 'User not found';
        }
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            throw 'Invalid password';
        }
        const token = jwtUtil.generateToken({ global_id: user.global_id, role: user.role });
        return token;
    } catch (error) {
        throw error; // Pass the error up to the controller
    }
}
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const jwtUtil = require('../utils/jwt.util');

register = async (username, email, password, role) => {
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        // Pass `role` only if it is defined
        const userData = { username, email, password: hashedPassword };
        if (role) {
            userData.role = role;
        }

        const user = await User.create(userData);
        return user;
    } catch (error) {
        throw error;
    }
};

login = async (email, password) => {
    try {
        const user = await User.findOne({ email });
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

module.exports = {
    register,
    login
};
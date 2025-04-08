const { successResponse, errorResponse } = require('../../baseAPI.controller');
const User = require('../../../../models/user.model');
const bcrypt = require('bcryptjs');

const getAllUsers = async (req, res) => {
    try {
        const offset = parseInt(req.query.offset) || 0;
        const limit = parseInt(req.query.limit) || 10;

        const users = await User.find({})
            .sort({ createdAt: -1 })
            .skip(offset)
            .limit(limit)
            .select('-password'); // Exclude the password field

        const total = await User.countDocuments();

        successResponse(res, { users, total }, 'Users retrieved successfully');
    } catch (error) {
        console.error(error);
        errorResponse(res, 'Failed to retrieve users', 500);
    }
};

const updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const { username, email , password} = req.body;

        const user = await User.findById(userId);

        if (!user) {
            return errorResponse(res, 'User not found', 404);
        }

        if (username) {
            user.username = username;
        }

        if (email) {
            user.email = email;
        }

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            user.password = hashedPassword;
        }

        await user.save();

        successResponse(res, user, 'User updated successfully');
    } catch (error) {
        console.error(error);
        errorResponse(res, 'Failed to update user', 500);
    }
}

const activationUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);

        if (!user) {
            return errorResponse(res, 'User not found', 404);
        }

        user.isActive = !user.isActive; // Toggle the isActive status
        await user.save();

        const message = user.isActive ? 'User activated successfully' : 'User deactivated successfully';

        successResponse(res, user, message);
    } catch (error) {
        console.error(error);
        errorResponse(res, 'Failed to update user activation status', 500);
    }
    
}

module.exports = {
    getAllUsers,
    updateUser, 
    activationUser
};

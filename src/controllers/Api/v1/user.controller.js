const userService = require('../../../services/user.service');
const { successResponse } = require('../baseAPI.controller');

getUserProfile = async (req, res) => {
    try {
        const global_id = req.params.global_id;
        const user = await userService.getUserProfile(global_id);
        successResponse(user, 'User profile retrieved successfully', res);
    } catch (error) {
        if (error.name === "SequelizeUniqueConstraintError") {
            message = error.errors.map((e) => e.message);
            errorResponse(res, message);
        } else {
            errorResponse(res, error);
        }
    }
}

getAllUsers = async (req, res) => {
    try {
        const users = await userService.getAllUsers();
        res.status(200).json(users);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }

};

module.exports = {
    getUserProfile,
    getAllUsers
};
const { successResponse, errorResponse } = require('../../baseAPI.controller');
const { uploadFile } = require('../../../../services/upload_file.service');
const User = require('../../../../models/user.model');
const bcrypt = require('bcryptjs');

const updateUserInfo = async (req, res) => {
    try {
        const username = req.body.username;
        const userId = req.user.id || req.user._id; 
        const user = await User.findById(userId);

        if (!user) {
            return errorResponse(res, 'User not found', 404);
        }

        if (req.file) {
            const file = req.file;
            const fileName = `owlmingo/${userId}/profiles/${Date.now()}-${file.originalname}`;
            const fileUrl = await uploadFile(file.buffer, fileName);
            if (!fileUrl) {
                return errorResponse(res, 'File upload failed', 500);
            }
            user.profile_url = fileUrl;
        }

        if (username) {
            user.username = username;
        }

        await user.save();

        successResponse(res, user, 'User information updated successfully.');
    } catch (error) {
        errorResponse(res, error.message || 'Failed to update user information');
    }
};

const settingChangePassword = async (req, res) => {

    try{
        const { old_password, new_password } = req.body;
        const userId = req.user.id || req.user._id; 
        const user = await User.findById(userId);

        if (!user) {
            return errorResponse(res, 'User not found', 404);
        }

        const isValid = await bcrypt.compare(old_password, user.password);

        if (!isValid) {
            return errorResponse(res, 'Old password is incorrect', 400);
        }
        const hashedPassword = await bcrypt.hash(new_password, 10);
        
        user.password = hashedPassword;
        await user.save();

        successResponse(res, null, 'Password changed successfully.');
    } catch (error) {
        errorResponse(res, error.message || 'Failed to change password');
    }
}


module.exports = {
    updateUserInfo, 
    settingChangePassword
};
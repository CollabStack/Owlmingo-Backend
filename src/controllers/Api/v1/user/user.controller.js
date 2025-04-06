const { successResponse, errorResponse } = require('../../baseAPI.controller');
const { uploadFile } = require('../../../../services/upload_file.service');
const User = require('../../../../models/user.model');

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
            console.log('fileUrl', fileUrl);
            user.profile_url = fileUrl;
        }

        if (username) {
            console.log("username", username);
            user.username = username;
        }

        await user.save();

        successResponse(res, user, 'User information updated successfully.');
    } catch (error) {
        errorResponse(res, error.message || 'Failed to update user information');
    }
};




module.exports = {
    updateUserInfo
};
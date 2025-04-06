const { successResponse, errorResponse } = require('../../baseAPI.controller');
const { uploadFile } = require('../../../../services/upload_file.service');
const User = require('../../../../models/user.model');
const bcrypt = require('bcryptjs');
const { getPlansSV } = require('../../../../services/plan.service');
const Payment = require('../../../../models/payment.model');

const updateUserInfo = async (req, res) => {
    try {
        const username = req.body.username;
        const userId = req.user.id || req.user._id; 
        const user = await User.findById(userId);

        if (!user) {
            return errorResponse(res, 'User not found', 400);
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
            return errorResponse(res, 'User not found', 400);
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
};

const getCurrentPlan = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const user = await User.findById(userId); // ⚠️ await was missing
        if (!user) {
            return errorResponse(res, "User not found", 400);
        }

        const plans = await getPlansSV(); // Should return an array of all available plans
        // const payment = await Payment.findOne({ userId: userId });
        const currentDate = new Date();
        const payment = await Payment.findOne({
              userId,
              status: "COMPLETED",
              expiration: { $gt: currentDate }
            }).sort({ createdAt: -1 });
           
        if (!payment) {
            return errorResponse(res, "No active payment found for the user", 400);
        }

        // Match current plan based on plan_id or something in your Payment model
        // const currentPlan = plans.find(plan => plan._id === payment.planIid); // adjust key names
        const currentPlan = plans.find(plan => plan._id.toString() === payment.planId.toString());


        if (!currentPlan) {
            return errorResponse(res, "Current plan data not found", 400);
        }

        // Filter and suggest upgrade plans
        const suggestedPlans = plans.filter(plan => plan.total_price > currentPlan.total_price);

        successResponse(res, {
            currentPlan,
            suggestedPlans
        }, "Current plan retrieved successfully.");
    } catch (error) {
        errorResponse(res, error.message || "Failed to get current plan.");
    }
};


module.exports = {
    updateUserInfo, 
    settingChangePassword, 
    getCurrentPlan
};
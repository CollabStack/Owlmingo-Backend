const { successResponse, errorResponse } = require('../../baseAPI.controller');
const Payment = require("../../../../models/payment.model");

const getAllPayments = async (req, res) => {
    try {
        const offset = parseInt(req.query.offset) || 0;
        const limit = parseInt(req.query.limit) || 10;

        const payments = await Payment.find({})
            .sort({ updatedAt: -1 }) // <- sort by updatedAt descending
            .skip(offset)
            .limit(limit)
            .populate('userId', 'email username profile_url');

        const total = await Payment.countDocuments();

        successResponse(res, { payments, total }, 'Payments retrieved successfully');
    } catch (error) {
        console.error(error);
        errorResponse(res, 'Failed to retrieve payments', 500);
    }
};

module.exports = {
    getAllPayments,
};

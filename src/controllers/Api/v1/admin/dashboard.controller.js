const { successResponse, errorResponse } = require('../../baseAPI.controller');
const User = require('../../../../models/user.model');
const Plan = require('../../../../models/plan.model');
const Payment = require('../../../../models/payment.model');
const { File } = require('../../../../models/file.model');
const Flashcard = require('../../../../models/flash_card.model');
const Summary = require('../../../../models/summary.model');
const Quiz = require('../../../../models/quiz.model');

const getDashboardData = async (req, res) => {
    try {
        const { mode = 'all', startDate, endDate } = req.query;
        let filter = {};

        if (mode === 'today') {
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999);
            filter.createdAt = { $gte: todayStart, $lte: todayEnd };
        } else if (mode === 'range') {
            if (!startDate || !endDate) {
                return errorResponse(res, 'Start and end dates are required for range mode', 400);
            }
            filter.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const totalUsers = await User.countDocuments(mode === 'all' ? {} : filter);
        const totalActiveUsers = await User.countDocuments({ ...filter, isActive: true });
        const totalInactiveUsers = await User.countDocuments({ ...filter, isActive: false });

        const totalPlans = await Plan.countDocuments(mode === 'all' ? {} : filter);
        const totalActivePlans = await Plan.countDocuments({ ...filter, is_active: true });
        const totalInactivePlans = await Plan.countDocuments({ ...filter, is_active: false });

        const totalPayments = await Payment.countDocuments(mode === 'all' ? {} : filter);
        const totalCompletedPayments = await Payment.countDocuments({ ...filter, status: 'COMPLETED' });
        const totalPendingPayments = await Payment.countDocuments({ ...filter, status: 'PENDING' });

        const totalFiles = await File.countDocuments(mode === 'all' ? {} : filter);
        const totalFlashcards = await Flashcard.countDocuments(mode === 'all' ? {} : filter);
        const totalSummaries = await Summary.countDocuments(mode === 'all' ? {} : filter);
        const totalQuizzes = await Quiz.countDocuments(mode === 'all' ? {} : filter);

        // ✅ Calculate total revenue using aggregation
        const revenueAggregation = await Payment.aggregate([
            { $match: { ...filter, status: 'COMPLETED' } },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' }
                }
            }
        ]);
        const totalRevenue = revenueAggregation[0]?.total || 0;

        return successResponse(res, {
            totalUsers,
            totalActiveUsers,
            totalInactiveUsers,
            totalPlans,
            totalActivePlans,
            totalInactivePlans,
            totalPayments,
            totalCompletedPayments,
            totalPendingPayments,
            totalRevenue,
            totalFiles,
            totalFlashcards,
            totalSummaries,
            totalQuizzes
        }, 'Dashboard data retrieved successfully.');
    } catch (error) {
        console.error(error);
        return errorResponse(res, 'Failed to retrieve dashboard data', 500);
    }
};

module.exports = {
    getDashboardData,
};

const { successResponse, errorResponse } = require("../../baseAPI.controller");
const User = require("../../../../models/user.model");
const Plan = require("../../../../models/plan.model");
const Payment = require("../../../../models/payment.model");
const { File } = require("../../../../models/file.model");
const Flashcard = require("../../../../models/flash_card.model");
const Summary = require("../../../../models/summary.model");
const Quiz = require("../../../../models/quiz.model");

const getDashboardData = async (req, res) => {
  try {
    const { mode = "all", startDate, endDate } = req.query;
    let filter = {};

    if (mode === "today") {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: todayStart, $lte: todayEnd };
    } else if (mode === "range") {
      if (!startDate || !endDate) {
        return errorResponse(
          res,
          "Start and end dates are required for range mode",
          400
        );
      }
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const totalUsers = await User.countDocuments(mode === "all" ? {} : filter);
    const totalActiveUsers = await User.countDocuments({
      ...filter,
      isActive: true,
    });
    const totalInactiveUsers = await User.countDocuments({
      ...filter,
      isActive: false,
    });

    const totalPlans = await Plan.countDocuments(mode === "all" ? {} : filter);
    const totalActivePlans = await Plan.countDocuments({
      ...filter,
      is_active: true,
    });
    const totalInactivePlans = await Plan.countDocuments({
      ...filter,
      is_active: false,
    });

    const totalPayments = await Payment.countDocuments(
      mode === "all" ? {} : filter
    );
    const totalCompletedPayments = await Payment.countDocuments({
      ...filter,
      status: "COMPLETED",
    });
    const totalPendingPayments = await Payment.countDocuments({
      ...filter,
      status: "PENDING",
    });

    const totalFiles = await File.countDocuments(mode === "all" ? {} : filter);
    const totalFlashcards = await Flashcard.countDocuments(
      mode === "all" ? {} : filter
    );
    const totalSummaries = await Summary.countDocuments(
      mode === "all" ? {} : filter
    );
    const totalQuizzes = await Quiz.countDocuments(
      mode === "all" ? {} : filter
    );

    // ✅ Calculate total revenue using aggregation
    const revenueAggregation = await Payment.aggregate([
      { $match: { ...filter, status: "COMPLETED" } },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);
    const totalRevenue = revenueAggregation[0]?.total || 0;

    return successResponse(
      res,
      {
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
        totalQuizzes,
      },
      "Dashboard data retrieved successfully."
    );
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Failed to retrieve dashboard data", 500);
  }
};

const getPaymentTrend = async (req, res) => {
    try {
      const { interval = "daily", startDate, endDate } = req.query;
  
      if (!startDate || !endDate) {
        return res
          .status(400)
          .json({ error: "startDate and endDate are required" });
      }
  
      const start = new Date(startDate);
      const end = new Date(endDate);
  
      const matchStage = {
        $match: {
          status: "COMPLETED",
          createdAt: { $gte: start, $lte: end },
        },
      };
  
      let groupStage;
      let dateFormatter;
  
      if (interval === "monthly") {
        groupStage = {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
            count: { $sum: 1 },
            total: { $sum: "$amount" },
          },
        };
        dateFormatter = (d) => d.toISOString().slice(0, 7);
      } else if (interval === "weekly") {
        groupStage = {
          $group: {
            _id: {
              $concat: [
                { $toString: { $isoWeekYear: "$createdAt" } },
                "-W",
                {
                  $cond: [
                    { $lte: [ { $isoWeek: "$createdAt" }, 9 ] },
                    { $concat: ["0", { $toString: { $isoWeek: "$createdAt" } }] },
                    { $toString: { $isoWeek: "$createdAt" } }
                  ]
                }
              ],
            },
            count: { $sum: 1 },
            total: { $sum: "$amount" },
          },
        };
        dateFormatter = (date) => {
          const temp = new Date(date);
          const firstDay = new Date(temp.getFullYear(), 0, 1);
          const dayOfYear = ((temp - firstDay + 86400000) / 86400000);
          const week = Math.ceil(dayOfYear / 7);
          return `${temp.getFullYear()}-W${week.toString().padStart(2, "0")}`;
        };
      } else {
        // Daily
        groupStage = {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
            total: { $sum: "$amount" },
          },
        };
        dateFormatter = (d) => d.toISOString().slice(0, 10);
      }
  
      const trendData = await Payment.aggregate([
        matchStage,
        groupStage,
        { $sort: { _id: 1 } },
      ]);
  
      const map = {};
      trendData.forEach((item) => {
        map[item._id] = { count: item.count, total: item.total };
      });
  
      const filled = [];
      let current = new Date(start);
      while (current <= end) {
        const label = dateFormatter(current);
        filled.push({
          label,
          count: map[label]?.count || 0,
          total: map[label]?.total || 0,
        });
  
        if (interval === "monthly") {
          current.setMonth(current.getMonth() + 1);
        } else if (interval === "weekly") {
          current.setDate(current.getDate() + 7);
        } else {
          current.setDate(current.getDate() + 1);
        }
      }
  
      return res.status(200).json(filled);
    } catch (err) {
      console.error("Payment trend error:", err);
      return res.status(500).json({ error: "Failed to fetch payment trend" });
    }
  };
  
module.exports = {
  getDashboardData,
  getPaymentTrend,
};

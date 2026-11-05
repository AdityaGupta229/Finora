const express = require("express");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const Habit = require("../models/Habit");
const Goal = require("../models/Goal");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

// Dashboard statistics
router.get("/stats", async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalUsers,
      totalTransactions,
      transactionTotals,
      activeTransactionUsers,
      activeHabitUsers,
      activeGoalUsers,
      habits,
      goals,
    ] = await Promise.all([
      User.countDocuments(),
      Transaction.countDocuments(),

      Transaction.aggregate([
        {
          $group: {
            _id: "$type",
            total: { $sum: "$amount" },
          },
        },
      ]),

      Transaction.distinct("user", {
        createdAt: { $gte: thirtyDaysAgo },
      }),

      Habit.distinct("user", {
        updatedAt: { $gte: thirtyDaysAgo },
      }),

      Goal.distinct("user", {
        updatedAt: { $gte: thirtyDaysAgo },
      }),

      Habit.find().select("completedDates"),

      Goal.find().select("targetAmount savedAmount"),
    ]);

    const totals = { Income: 0, Expense: 0 };

    transactionTotals.forEach((item) => {
      if (item._id in totals) {
        totals[item._id] = item.total;
      }
    });

    const activeUsers = new Set([
      ...activeTransactionUsers.map(String),
      ...activeHabitUsers.map(String),
      ...activeGoalUsers.map(String),
    ]).size;

    const totalCompletions = habits.reduce(
      (sum, habit) => sum + habit.completedDates.length,
      0
    );

    const totalHabitCompletions = totalCompletions;

    const goalCompletionValues = goals.map((goal) =>
      Math.min(
        100,
        (Number(goal.savedAmount || 0) /
          Number(goal.targetAmount || 1)) *
          100
      )
    );

    const averageGoalCompletion =
      goalCompletionValues.length > 0
        ? Math.round(
            goalCompletionValues.reduce((sum, value) => sum + value, 0) /
              goalCompletionValues.length
          )
        : 0;

    return res.json({
      success: true,
      stats: {
        totalUsers,
        totalTransactions,
        totalIncome: totals.Income,
        totalExpenses: totals.Expense,
        activeUsers,
        totalHabitCompletions,
        averageGoalCompletion,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load admin statistics.",
    });
  }
});

// List users without exposing passwords
router.get("/users", async (req, res) => {
  try {
    const users = await User.find()
      .select("name email role createdAt")
      .sort({ createdAt: -1 })
      .limit(100);

    return res.json({ success: true, users });
  } catch (error) {
    console.error("Admin users error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load users.",
    });
  }
});

module.exports = router;
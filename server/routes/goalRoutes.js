const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Goal = require("../models/Goal");
const authMiddleware = require("../middleware/authMiddleware");

// GET: Logged-in user's goals
router.get("/", authMiddleware, async (req, res) => {
  try {
    const goals = await Goal.find({ user: req.userId }).sort({
      createdAt: -1,
    });

    res.json({ success: true, data: goals });
  } catch (error) {
    console.error("Fetch goals error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch goals",
    });
  }
});

// POST: Create a goal
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, targetAmount, savedAmount, deadline, category } = req.body;

    const target = Number(targetAmount);
    const saved = savedAmount === undefined ? 0 : Number(savedAmount);

    if (
      typeof title !== "string" ||
      !title.trim() ||
      !Number.isFinite(target) ||
      target < 1 ||
      !Number.isFinite(saved) ||
      saved < 0 ||
      saved > target ||
      (deadline && Number.isNaN(new Date(deadline).getTime())) ||
      (category !== undefined && typeof category !== "string")
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid goal details",
      });
    }

    const goal = await Goal.create({
      user: req.userId,
      title: title.trim(),
      targetAmount: target,
      savedAmount: saved,
      deadline: deadline || null,
      category: typeof category === "string" && category.trim()
        ? category.trim()
        : "General",
    });

    res.status(201).json({
      success: true,
      message: "Savings goal created",
      data: goal,
    });
  } catch (error) {
    console.error("Create goal error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to create goal",
    });
  }
});

// PUT: Update only the logged-in user's goal
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid goal ID",
      });
    }

    const { title, targetAmount, savedAmount, deadline, category } = req.body;
    const updates = {};

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Goal title is required",
        });
      }
      updates.title = title.trim();
    }

    if (targetAmount !== undefined) {
      const target = Number(targetAmount);
      if (!Number.isFinite(target) || target < 1) {
        return res.status(400).json({
          success: false,
          message: "Target amount must be at least 1",
        });
      }
      updates.targetAmount = target;
    }

    if (savedAmount !== undefined) {
      const saved = Number(savedAmount);
      if (!Number.isFinite(saved) || saved < 0) {
        return res.status(400).json({
          success: false,
          message: "Saved amount cannot be negative",
        });
      }
      updates.savedAmount = saved;
    }

    if (deadline !== undefined) {
      if (deadline && Number.isNaN(new Date(deadline).getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid deadline",
        });
      }
      updates.deadline = deadline || null;
    }

    if (category !== undefined) {
      if (typeof category !== "string") {
        return res.status(400).json({
          success: false,
          message: "Invalid category",
        });
      }
      updates.category = category.trim() || "General";
    }

    const currentGoal = await Goal.findOne({
      _id: id,
      user: req.userId,
    });

    if (!currentGoal) {
      return res.status(404).json({
        success: false,
        message: "Goal not found",
      });
    }

    const finalTarget = updates.targetAmount ?? currentGoal.targetAmount;
    const finalSaved = updates.savedAmount ?? currentGoal.savedAmount;

    if (finalSaved > finalTarget) {
      return res.status(400).json({
        success: false,
        message: "Saved amount cannot exceed target amount",
      });
    }

    const goal = await Goal.findOneAndUpdate(
      { _id: id, user: req.userId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "Goal updated",
      data: goal,
    });
  } catch (error) {
    console.error("Update goal error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to update goal",
    });
  }
});

// DELETE: Delete only the logged-in user's goal
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid goal ID",
      });
    }

    const goal = await Goal.findOneAndDelete({
      _id: id,
      user: req.userId,
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: "Goal not found",
      });
    }

    res.json({
      success: true,
      message: "Goal deleted",
      data: goal,
    });
  } catch (error) {
    console.error("Delete goal error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete goal",
    });
  }
});

module.exports = router;
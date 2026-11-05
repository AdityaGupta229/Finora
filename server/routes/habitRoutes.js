const express = require("express");
const mongoose = require("mongoose");
const Habit = require("../models/Habit");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

// GET: Current user's habits
router.get("/", async (req, res) => {
  try {
    const habits = await Habit.find({ user: req.userId })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: habits });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Could not fetch habits.",
    });
  }
});

// POST: Create a habit
router.post("/", async (req, res) => {
  try {
    const { title, frequency, reminderTime } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Habit title is required.",
      });
    }

    if (
      frequency &&
      !["Daily", "Weekly", "Monthly"].includes(frequency)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid habit frequency.",
      });
    }

    if (
      reminderTime &&
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(reminderTime)
    ) {
      return res.status(400).json({
        success: false,
        message: "Reminder time must be in HH:MM format.",
      });
    }

    const habit = await Habit.create({
      user: req.userId,
      title: title.trim(),
      frequency: frequency || "Daily",
      reminderTime: reminderTime || "",
    });

    res.status(201).json({
      success: true,
      data: habit,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Could not create habit.",
    });
  }
});

// PATCH: Mark/unmark today's habit
router.patch("/:id/toggle", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid habit ID.",
      });
    }

    const habit = await Habit.findOne({
      _id: id,
      user: req.userId,
    });

    if (!habit) {
      return res.status(404).json({
        success: false,
        message: "Habit not found.",
      });
    }

    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    });

    const index = habit.completedDates.indexOf(today);

    if (index >= 0) {
      habit.completedDates.splice(index, 1);
    } else {
      habit.completedDates.push(today);
    }

    await habit.save();

    res.json({ success: true, data: habit });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Could not update habit.",
    });
  }
});

// DELETE: Delete current user's habit
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid habit ID.",
      });
    }

    const habit = await Habit.findOneAndDelete({
      _id: id,
      user: req.userId,
    });

    if (!habit) {
      return res.status(404).json({
        success: false,
        message: "Habit not found.",
      });
    }

    res.json({
      success: true,
      message: "Habit deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Could not delete habit.",
    });
  }
});

module.exports = router;
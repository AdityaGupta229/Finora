const express = require("express");
const router = express.Router();

const Feedback = require("../models/Feedback");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// User submits feedback or complaint
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { subject, message, type } = req.body;

    if (!subject?.trim() || !message?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Subject and message are required.",
      });
    }

    const feedback = await Feedback.create({
      user: req.userId,
      subject: subject.trim(),
      message: message.trim(),
      type: type || "Feedback",
    });

    res.status(201).json({
      success: true,
      message: "Feedback submitted successfully.",
      feedback,
    });
  } catch (error) {
    console.error("Feedback submit error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to submit feedback.",
    });
  }
});

// User views their own submissions
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const feedback = await Feedback.find({
      user: req.userId,
    }).sort({ createdAt: -1 });

    res.json({ success: true, feedback });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to fetch your feedback.",
    });
  }
});

// Admin views all submissions
router.get("/admin", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const feedback = await Feedback.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, feedback });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to fetch feedback.",
    });
  }
});

// Admin updates feedback status
router.patch(
  "/admin/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { status } = req.body;

      if (!["Pending", "In Progress", "Resolved"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid feedback status.",
        });
      }

      const feedback = await Feedback.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true, runValidators: true }
      );

      if (!feedback) {
        return res.status(404).json({
          success: false,
          message: "Feedback not found.",
        });
      }

      res.json({
        success: true,
        message: "Feedback status updated.",
        feedback,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Unable to update feedback status.",
      });
    }
  }
);

module.exports = router;
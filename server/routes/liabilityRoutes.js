const express = require("express");
const router = express.Router();

const Liability = require("../models/Liability");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

// Get all liabilities of logged-in user
router.get("/", async (req, res) => {
  try {
    const liabilities = await Liability.find({
      user: req.userId,
    }).sort({ createdAt: -1 });

    res.json({ success: true, liabilities });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch liabilities",
    });
  }
});

// Add a liability
router.post("/", async (req, res) => {
  try {
    const {
      name,
      type,
      outstandingAmount,
      originalAmount,
      dueDate,
      notes,
    } = req.body;

    if (
      !name?.trim() ||
      !type ||
      outstandingAmount === undefined ||
      !Number.isFinite(Number(outstandingAmount)) ||
      Number(outstandingAmount) < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid liability details",
      });
    }
    const outstanding = Number(outstandingAmount);
const original =
  originalAmount === undefined ? 0 : Number(originalAmount);

if (
  !Number.isFinite(original) ||
  original < 0 ||
  (original > 0 && outstanding > original)
) {
  return res.status(400).json({
    success: false,
    message: "Outstanding amount cannot exceed original amount.",
  });
}

    const liability = await Liability.create({
      user: req.userId,
      name: name.trim(),
      type,
      dueDate: dueDate || null,
      notes: notes || "",
      outstandingAmount: outstanding,
      originalAmount: original,
    });

    res.status(201).json({
      success: true,
      message: "Liability added successfully",
      liability,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to add liability",
    });
  }
});

// Update a liability
router.put("/:id", async (req, res) => {
  try {
    const allowedFields = [
      "name",
      "type",
      "outstandingAmount",
      "originalAmount",
      "dueDate",
      "notes",
    ];

    const updates = {};
    const currentLiability = await Liability.findOne({
  _id: req.params.id,
  user: req.userId,
});

if (!currentLiability) {
  return res.status(404).json({
    success: false,
    message: "Liability not found",
  });
}

const outstanding = Number(
  req.body.outstandingAmount ?? currentLiability.outstandingAmount
);

const original = Number(
  req.body.originalAmount ?? currentLiability.originalAmount
);

if (
  !Number.isFinite(outstanding) ||
  outstanding < 0 ||
  !Number.isFinite(original) ||
  original < 0 ||
  (original > 0 && outstanding > original)
) {
  return res.status(400).json({
    success: false,
    message: "Outstanding amount cannot exceed original amount.",
  });
}

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const liability = await Liability.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      updates,
      { new: true, runValidators: true }
    );

    if (!liability) {
      return res.status(404).json({
        success: false,
        message: "Liability not found",
      });
    }

    res.json({
      success: true,
      message: "Liability updated successfully",
      liability,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to update liability",
    });
  }
});

// Delete a liability
router.delete("/:id", async (req, res) => {
  try {
    const result = await Liability.deleteOne({
      _id: req.params.id,
      user: req.userId,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Liability not found",
      });
    }

    res.json({
      success: true,
      message: "Liability deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to delete liability",
    });
  }
});

module.exports = router;
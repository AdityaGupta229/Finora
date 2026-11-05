const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const authMiddleware = require("../middleware/authMiddleware");

// GET: Fetch only the logged-in user's transactions
router.get("/", authMiddleware, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      user: req.userId,
    }).sort({
      date: -1,
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    console.error("Fetch transactions error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch transactions",
    });
  }
});

// POST: Create a transaction for the logged-in user
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, type, amount, category, date } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      !["Income", "Expense"].includes(type) ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) <= 0 ||
      typeof category !== "string" ||
      !category.trim() ||
      !date ||
      Number.isNaN(new Date(date).getTime())
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid transaction details",
      });
    }

    const transaction = await Transaction.create({
      user: req.userId,
      title: title.trim(),
      type,
      amount: Number(amount),
      category: category.trim(),
      date: new Date(date),
    });

    res.status(201).json({
      success: true,
      message: "Transaction created successfully",
      data: transaction,
    });
  } catch (error) {
    console.error("Create transaction error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to create transaction",
    });
  }
});

// PUT: Update only the logged-in user's transaction
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction ID",
      });
    }

    const { title, type, amount, category, date } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      !["Income", "Expense"].includes(type) ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) <= 0 ||
      typeof category !== "string" ||
      !category.trim() ||
      !date ||
      Number.isNaN(new Date(date).getTime())
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid transaction details",
      });
    }

    const transaction = await Transaction.findOneAndUpdate(
      { _id: id, user: req.userId },
      {
        title: title.trim(),
        type,
        amount: Number(amount),
        category: category.trim(),
        date: new Date(date),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Transaction updated successfully",
      data: transaction,
    });
  } catch (error) {
    console.error("Update transaction error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to update transaction",
    });
  }
});

// DELETE: Delete only the logged-in user's transaction
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction ID",
      });
    }

    const transaction = await Transaction.findOneAndDelete({
      _id: id,
      user: req.userId,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Transaction deleted successfully",
      data: transaction,
    });
  } catch (error) {
    console.error("Delete transaction error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete transaction",
    });
  }
});

module.exports = router;
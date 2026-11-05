const express = require("express");
const router = express.Router();

const Asset = require("../models/Asset");
const authMiddleware = require("../middleware/authMiddleware");

// GET all assets of logged-in user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const assets = await Asset.find({ user: req.userId }).sort({
      createdAt: -1,
    });

    res.status(200).json(assets);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch assets" });
  }
});

// ADD new asset
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name, type, currentValue, investedAmount, purchaseDate, notes } =
      req.body;

    if (!name || !type || currentValue === undefined) {
      return res.status(400).json({
        message: "Name, type and current value are required",
      });
    }

    const asset = await Asset.create({
      user: req.userId,
      name,
      type,
      currentValue,
      investedAmount,
      purchaseDate,
      notes,
    });

    res.status(201).json(asset);
  } catch (error) {
    res.status(500).json({ message: "Failed to create asset" });
  }
});

// UPDATE asset
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const asset = await Asset.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    res.status(200).json(asset);
  } catch (error) {
    res.status(500).json({ message: "Failed to update asset" });
  }
});

// DELETE asset
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const asset = await Asset.findOneAndDelete({
      _id: req.params.id,
      user: req.userId,
    });

    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    res.status(200).json({ message: "Asset deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete asset" });
  }
});

module.exports = router;
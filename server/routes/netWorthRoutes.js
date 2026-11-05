const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const Asset = require("../models/Asset");
const Liability = require("../models/Liability");
const NetWorthSnapshot = require("../models/NetWorthSnapshot");

router.use(authMiddleware);

// Save current net worth snapshot
router.post("/snapshot", async (req, res) => {
  try {
    const [assets, liabilities] = await Promise.all([
      Asset.find({ user: req.userId }),
      Liability.find({ user: req.userId }),
    ]);

    const totalAssets = assets.reduce(
      (sum, asset) => sum + Number(asset.currentValue || 0),
      0
    );

    const totalInvested = assets.reduce(
      (sum, asset) => sum + Number(asset.investedAmount || 0),
      0
    );

    const totalLiabilities = liabilities.reduce(
      (sum, liability) =>
        sum + Number(liability.outstandingAmount || 0),
      0
    );

    const netWorth = totalAssets - totalLiabilities;

    const today = new Date();
today.setHours(0, 0, 0, 0);

const snapshot = await NetWorthSnapshot.findOneAndUpdate(
  {
    user: req.userId,
    snapshotDate: {
      $gte: today,
      $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
    },
  },
  {
    $set: {
      totalAssets,
      totalInvested,
      totalLiabilities,
      netWorth,
    },
    $setOnInsert: {
      user: req.userId,
      snapshotDate: today,
    },
  },
  {
    new: true,
    upsert: true,
    runValidators: true,
  }
);

    res.status(201).json({
      success: true,
      message: "Net worth snapshot saved",
      snapshot,
    });
  } catch (error) {
    console.error("Net worth snapshot error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save net worth snapshot",
    });
  }
});

// Get net worth growth history
router.get("/history", async (req, res) => {
  try {
    const history = await NetWorthSnapshot.find({
      user: req.userId,
    }).sort({ snapshotDate: 1 });

    res.json({
      success: true,
      history,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch net worth history",
    });
  }
});

module.exports = router;
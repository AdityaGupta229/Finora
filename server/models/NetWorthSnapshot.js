const mongoose = require("mongoose");

const netWorthSnapshotSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  totalAssets: {
    type: Number,
    default: 0,
  },
  totalInvested: {
    type: Number,
    default: 0,
  },
  totalLiabilities: {
    type: Number,
    default: 0,
    },
  netWorth: {
    type: Number,
    default: 0,
  },
  snapshotDate: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model(
  "NetWorthSnapshot",
  netWorthSnapshotSchema
);
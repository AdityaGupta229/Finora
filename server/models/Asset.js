const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: [
        "Savings",
        "Fixed Deposit",
        "Stocks",
        "Mutual Funds",
        "Gold",
        "Real Estate",
        "Other",
      ],
      required: true,
    },

    currentValue: {
      type: Number,
      required: true,
      min: 0,
    },

    investedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    purchaseDate: {
      type: Date,
      default: Date.now,
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Asset", assetSchema);
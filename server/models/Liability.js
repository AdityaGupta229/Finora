const mongoose = require("mongoose");

const liabilitySchema = new mongoose.Schema(
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
        "Personal Loan",
        "Home Loan",
        "Car Loan",
        "Education Loan",
        "Credit Card",
        "Other",
      ],
      required: true,
    },

    outstandingAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    originalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    dueDate: {
      type: Date,
      default: null,
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Liability", liabilitySchema);
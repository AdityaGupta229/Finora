const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const transactionRoutes = require("./routes/transactionRoutes");
const authRoutes = require("./routes/authRoutes");
const goalRoutes = require("./routes/goalRoutes");
const habitRoutes = require("./routes/habitRoutes");
const adminRoutes = require("./routes/adminRoutes");
const assetRoutes = require("./routes/assetRoutes");
const netWorthRoutes = require("./routes/netWorthRoutes");
const liabilityRoutes = require("./routes/liabilityRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");

require("dotenv").config();
if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI is missing in .env");
}

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is missing in .env");
}

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://finora-frontend-dw1b.onrender.com"
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);
app.use(express.json({limit: "10kb"}));
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many requests. Please try again after 15 minutes."
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/signup", authLimiter);
app.use("/api/transactions",transactionRoutes);
app.use("/api/auth",authRoutes);
app.use("/api/goals",goalRoutes);
app.use("/api/habits",habitRoutes);
app.use("/api/admin",adminRoutes);
app.use("/api/assets",assetRoutes);
app.use("/api/net-worth",netWorthRoutes);
app.use("/api/liabilities",liabilityRoutes);
app.use("/api/feedback",feedbackRoutes);
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Finora API is running 🚀",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Finora backend is healthy",
  });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected successfully!");

    app.listen(PORT, () => {
      console.log(`Finora server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

startServer();
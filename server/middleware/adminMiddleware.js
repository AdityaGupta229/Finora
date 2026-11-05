const User = require("../models/User");

module.exports = async function adminMiddleware(req, res, next) {
  try {
    // authMiddleware must run before this middleware
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // Check the user's current role in MongoDB
    const user = await User.findById(req.userId).select("role");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account not found.",
      });
    }

    if (user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access only.",
      });
    }

    next();
  } catch (error) {
    console.error("Admin middleware error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to verify admin access.",
    });
  }
};
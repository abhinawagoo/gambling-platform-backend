// middlewares/authMiddleware.js
const jwt = require("jsonwebtoken");
const { User } = require("../models");
const env = require("../config/env");

exports.protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    // Verify token
    const decoded = jwt.verify(token, env.JWT_SECRET);

    // Check if user exists
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res
        .status(401)
        .json({ message: "Not authorized, user not found" });
    }

    // Add user ID to request
    req.userId = decoded.id;
    req.userRole = decoded.role;

    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};

exports.admin = (req, res, next) => {
  if (req.userRole === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Not authorized as admin" });
  }
};

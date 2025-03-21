// routes/userRoutes.js
const express = require("express");
const userController = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

// Public routes
router.post("/register", userController.register);
router.post("/login", userController.login);

// Protected routes
router.get("/profile", protect, userController.getProfile);
router.put("/profile", protect, userController.updateProfile);

module.exports = router;

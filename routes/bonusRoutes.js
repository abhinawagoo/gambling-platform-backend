// routes/bonusRoutes.js
const express = require("express");
const bonusController = require("../controllers/bonusController");
const { protect, admin } = require("../middlewares/authMiddleware");

const router = express.Router();

// Protected routes for users
router.get("/my-bonuses", protect, bonusController.getUserBonuses);

// Admin routes
router.post("/create", protect, admin, bonusController.createBonus);

module.exports = router;

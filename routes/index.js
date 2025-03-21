// routes/index.js
const express = require("express");
const userRoutes = require("./userRoutes");
const betRoutes = require("./betRoutes");
const transactionRoutes = require("./transactionRoutes");
const bonusRoutes = require("./bonusRoutes");

const router = express.Router();

router.use("/users", userRoutes);
router.use("/bets", betRoutes);
router.use("/transactions", transactionRoutes);
router.use("/bonuses", bonusRoutes);

// Base route
router.get("/", (req, res) => {
  res.json({ message: "Welcome to the Gambling Platform API" });
});

module.exports = router;

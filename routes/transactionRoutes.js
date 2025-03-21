// routes/transactionRoutes.js
const express = require("express");
const transactionController = require("../controllers/transactionController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

// All routes are protected
router.use(protect);

router.post("/deposit/create", transactionController.createDepositOrder);
router.post("/deposit/verify", transactionController.verifyDeposit);
router.post("/withdrawal", transactionController.requestWithdrawal);
router.get("/", transactionController.getUserTransactions);

module.exports = router;

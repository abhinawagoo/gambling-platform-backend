// controllers/transactionController.js
require("dotenv").config();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { sequelize, User, Transaction } = require("../models");
const env = require("../config/env");
const bonusController = require("./bonusController");

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

console.log("Razorpay Key ID:", env.RAZORPAY_KEY_ID);
console.log("Razorpay Key Secret:", env.RAZORPAY_KEY_SECRET);
// Create a deposit order
exports.createDepositOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.userId;
    console.log("Amount:", amount);
    console.log("🔹 Razorpay Key:", process.env.RAZORPAY_KEY_ID);
    if (!amount || amount < 100) {
      return res.status(400).json({ message: "Minimum deposit amount is 100" });
    }
    console.log("🔹 Creating Razorpay Order...");
    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount * 100, // Razorpay uses smallest currency unit (paise)
      currency: "INR",
      receipt: `dep_${userId.substring(0, 8)}_${Date.now()
        .toString()
        .slice(-6)}`,
    });

    console.log("Razorpay Order Created:", order); // Log the full response

    res.status(200).json({
      message: "Deposit order created",
      order: {
        id: order.id,
        amount: order.amount / 100,
        currency: order.currency,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Verify and complete deposit
exports.verifyDeposit = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount,
    } = req.body;

    const userId = req.userId;

    // Verify signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generated_signature = crypto
      .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      await t.rollback();
      return res.status(400).json({ message: "Invalid payment" });
    }

    // Find user
    const user = await User.findByPk(userId, { transaction: t });

    if (!user) {
      await t.rollback();
      return res.status(404).json({ message: "User not found" });
    }

    // Create transaction record
    const transaction = await Transaction.create(
      {
        userId,
        amount,
        type: "deposit",
        status: "completed",
        paymentMethod: "razorpay",
        paymentId: razorpay_payment_id,
        description: `Deposit via Razorpay`,
      },
      { transaction: t }
    );

    // Update user balance
    user.balance = sequelize.literal(`balance + ${amount}`);
    await user.save({ transaction: t });

    await t.commit();

    // Get updated user for response
    const updatedUser = await User.findByPk(userId, {
      attributes: ["id", "username", "balance"],
    });

    // Add deposit bonus (non-blocking)
    bonusController.createDepositBonus(userId, amount);

    res.status(200).json({
      message: "Deposit successful",
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        status: transaction.status,
        createdAt: transaction.createdAt,
      },
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        balance: updatedUser.balance,
      },
    });
  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Request withdrawal
exports.requestWithdrawal = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { amount, accountDetails } = req.body;
    const userId = req.userId;

    if (!amount || amount < 100) {
      await t.rollback();
      return res
        .status(400)
        .json({ message: "Minimum withdrawal amount is 100" });
    }

    // Find user and check balance
    const user = await User.findByPk(userId, { transaction: t });

    if (!user) {
      await t.rollback();
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user has enough balance
    if (user.balance < amount) {
      await t.rollback();
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // Create transaction record (pending status)
    const transaction = await Transaction.create(
      {
        userId,
        amount: -amount,
        type: "withdrawal",
        status: "pending",
        description: `Withdrawal request`,
        paymentMethod: accountDetails.method,
        paymentId: null,
      },
      { transaction: t }
    );

    // Deduct amount from user balance
    user.balance = sequelize.literal(`balance - ${amount}`);
    await user.save({ transaction: t });

    await t.commit();

    // In a real system, you would now process the withdrawal through your payment processor
    // For demo purposes, we'll just mark it as completed
    // In production, this would be handled by an admin or automated process

    // Get updated user for response
    const updatedUser = await User.findByPk(userId, {
      attributes: ["id", "username", "balance"],
    });

    res.status(200).json({
      message: "Withdrawal request submitted",
      transaction: {
        id: transaction.id,
        amount: Math.abs(transaction.amount),
        status: transaction.status,
        createdAt: transaction.createdAt,
      },
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        balance: updatedUser.balance,
      },
    });
  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get user transactions
exports.getUserTransactions = async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 10, offset = 0, type } = req.query;

    const whereClause = { userId };
    if (type) {
      whereClause.type = type;
    }

    const transactions = await Transaction.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      total: transactions.count,
      transactions: transactions.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

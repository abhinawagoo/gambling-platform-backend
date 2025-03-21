// controllers/betController.js
const { sequelize, User, Bet, Transaction } = require("../models");
const gameLogic = require("../utils/gameLogic");
const bonusController = require("./bonusController");

// Place a new bet
exports.placeBet = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { amount, gameType, betDetails } = req.body;
    const userId = req.userId;

    // Validate amount
    if (!amount || amount <= 0) {
      await t.rollback();
      return res.status(400).json({ message: "Invalid bet amount" });
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

    // Process the game
    let gameResult;
    try {
      gameResult = gameLogic.processBet(gameType, betDetails, amount);
    } catch (error) {
      await t.rollback();
      return res.status(400).json({ message: error.message });
    }

    // Create bet record
    const bet = await Bet.create(
      {
        userId,
        amount,
        gameType,
        betDetails,
        outcome: gameResult.outcome,
        payout: gameResult.payout,
        status: gameResult.won ? "won" : "lost",
      },
      { transaction: t }
    );

    // Deduct amount from user balance
    user.balance = sequelize.literal(`balance - ${amount}`);
    await user.save({ transaction: t });

    // Create bet transaction record
    await Transaction.create(
      {
        userId,
        amount: -amount,
        type: "bet",
        status: "completed",
        description: `Bet on ${gameType}`,
      },
      { transaction: t }
    );

    // If user won, add winnings to balance
    if (gameResult.payout > 0) {
      user.balance = sequelize.literal(`balance + ${gameResult.payout}`);
      await user.save({ transaction: t });

      // Create win transaction
      await Transaction.create(
        {
          userId,
          amount: gameResult.payout,
          type: "win",
          status: "completed",
          description: `Win from ${gameType}`,
        },
        { transaction: t }
      );
    }

    await t.commit();

    // Get updated user for response
    const updatedUser = await User.findByPk(userId, {
      attributes: ["id", "username", "balance"],
    });

    setTimeout(() => {
      bonusController.updateWageringProgress(userId, amount);
    }, 0);

    res.status(201).json({
      message: "Bet placed successfully",
      bet: {
        id: bet.id,
        amount,
        gameType,
        outcome: gameResult.outcome,
        payout: gameResult.payout,
        status: bet.status,
        timestamp: bet.createdAt,
      },
      gameDetails: gameResult,
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

// Get available games
exports.getGames = async (req, res) => {
  try {
    const games = gameLogic.getAvailableGames();
    res.status(200).json({ games });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get user bets
exports.getUserBets = async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 10, offset = 0, status, gameType } = req.query;

    const whereClause = { userId };

    if (status) {
      whereClause.status = status;
    }

    if (gameType) {
      whereClause.gameType = gameType;
    }

    const bets = await Bet.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      total: bets.count,
      bets: bets.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

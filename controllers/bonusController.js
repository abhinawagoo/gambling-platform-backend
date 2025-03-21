// controllers/bonusController.js
const { sequelize, User, Bonus, Transaction } = require("../models");
const { Op } = require("sequelize");
// Create a bonus for a user
exports.createBonus = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { userId, amount, type, description, wagering, expiresAt } = req.body;

    // Admin check happens in middleware

    // Find user
    const user = await User.findByPk(userId, { transaction: t });

    if (!user) {
      await t.rollback();
      return res.status(404).json({ message: "User not found" });
    }

    // Calculate wagering requirement (typically 10-30x the bonus amount)
    const wageringRequirement = wagering ? amount * wagering : amount * 10;

    // Create bonus
    const bonus = await Bonus.create(
      {
        userId,
        amount,
        type,
        description:
          description ||
          `${type.charAt(0).toUpperCase() + type.slice(1)} bonus`,
        wagering: wageringRequirement,
        wageringRemaining: wageringRequirement,
        expiresAt: expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
      },
      { transaction: t }
    );

    // Add to user balance
    user.balance = sequelize.literal(`balance + ${amount}`);
    await user.save({ transaction: t });

    // Create transaction
    await Transaction.create(
      {
        userId,
        amount,
        type: "bonus",
        status: "completed",
        description: `${
          type.charAt(0).toUpperCase() + type.slice(1)
        } bonus credited`,
      },
      { transaction: t }
    );

    await t.commit();

    res.status(201).json({
      message: "Bonus created successfully",
      bonus,
    });
  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get active bonuses for current user
exports.getUserBonuses = async (req, res) => {
  try {
    const userId = req.userId;

    const bonuses = await Bonus.findAll({
      where: {
        userId,
        status: "active",
        expiresAt: {
          [Op.gt]: new Date(), // Use Op directly instead of sequelize.Op
        },
      },
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({ bonuses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Create signup bonus (automatically called after registration)
exports.createSignupBonus = async (userId) => {
  const t = await sequelize.transaction();

  try {
    const signupBonusAmount = 10.0; // $10 signup bonus

    // Find user
    const user = await User.findByPk(userId, { transaction: t });

    if (!user) {
      await t.rollback();
      return null;
    }

    // Calculate wagering requirement (10x the bonus amount)
    const wageringRequirement = signupBonusAmount * 10;

    // Create bonus
    const bonus = await Bonus.create(
      {
        userId,
        amount: signupBonusAmount,
        type: "signup",
        description: "Welcome bonus",
        wagering: wageringRequirement,
        wageringRemaining: wageringRequirement,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
      { transaction: t }
    );

    // Add to user balance
    user.balance = sequelize.literal(`balance + ${signupBonusAmount}`);
    await user.save({ transaction: t });

    // Create transaction
    await Transaction.create(
      {
        userId,
        amount: signupBonusAmount,
        type: "bonus",
        status: "completed",
        description: "Welcome bonus credited",
      },
      { transaction: t }
    );

    await t.commit();

    return bonus;
  } catch (error) {
    await t.rollback();
    console.error("Error creating signup bonus:", error);
    return null;
  }
};

// Create deposit bonus (called after deposit verification)
exports.createDepositBonus = async (userId, depositAmount) => {
  const t = await sequelize.transaction();

  try {
    // 50% bonus on deposits, capped at $100
    let bonusAmount = depositAmount * 0.5;
    if (bonusAmount > 100) bonusAmount = 100;

    bonusAmount = parseFloat(bonusAmount.toFixed(2));

    // Find user
    const user = await User.findByPk(userId, { transaction: t });

    if (!user) {
      await t.rollback();
      return null;
    }

    // Calculate wagering requirement (15x the bonus amount)
    const wageringRequirement = bonusAmount * 15;

    // Create bonus
    const bonus = await Bonus.create(
      {
        userId,
        amount: bonusAmount,
        type: "deposit",
        description: "50% deposit bonus",
        wagering: wageringRequirement,
        wageringRemaining: wageringRequirement,
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      },
      { transaction: t }
    );

    // Add to user balance
    user.balance = sequelize.literal(`balance + ${bonusAmount}`);
    await user.save({ transaction: t });

    // Create transaction
    await Transaction.create(
      {
        userId,
        amount: bonusAmount,
        type: "bonus",
        status: "completed",
        description: "50% deposit bonus credited",
      },
      { transaction: t }
    );

    await t.commit();

    return bonus;
  } catch (error) {
    await t.rollback();
    console.error("Error creating deposit bonus:", error);
    return null;
  }
};

// Update wagering progress when bets are placed
exports.updateWageringProgress = async (userId, betAmount) => {
  const t = await sequelize.transaction();

  try {
    // Get active bonuses
    const activeBonuses = await Bonus.findAll({
      where: {
        userId,
        status: "active",
        wageringRemaining: {
          [sequelize.Op.gt]: 0,
        },
        expiresAt: {
          [sequelize.Op.gt]: new Date(),
        },
      },
      order: [["createdAt", "ASC"]], // Process oldest bonuses first
      transaction: t,
    });

    if (activeBonuses.length === 0) {
      await t.rollback();
      return;
    }

    let remainingBetAmount = betAmount;

    // Update wagering for each bonus
    for (const bonus of activeBonuses) {
      if (remainingBetAmount <= 0) break;

      const amountToDeduct = Math.min(
        remainingBetAmount,
        bonus.wageringRemaining
      );
      bonus.wageringRemaining = sequelize.literal(
        `wagering_remaining - ${amountToDeduct}`
      );
      await bonus.save({ transaction: t });

      // Check if wagering is now complete
      const updatedBonus = await Bonus.findByPk(bonus.id, { transaction: t });
      if (updatedBonus.wageringRemaining <= 0) {
        updatedBonus.status = "used";
        await updatedBonus.save({ transaction: t });
      }

      remainingBetAmount -= amountToDeduct;
    }

    await t.commit();
  } catch (error) {
    await t.rollback();
    console.error("Error updating wagering progress:", error);
  }
};

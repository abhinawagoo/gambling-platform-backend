// models/index.js
const { sequelize } = require("../config/db");
const userModel = require("./user");
const betModel = require("./bet");
const transactionModel = require("./transaction");
const bonusModel = require("./bonus");

// Initialize models
const User = userModel(sequelize);
const Bet = betModel(sequelize);
const Transaction = transactionModel(sequelize);
const Bonus = bonusModel(sequelize);

// Define associations
User.hasMany(Bet, { foreignKey: "userId" });
Bet.belongsTo(User, { foreignKey: "userId" });

User.hasMany(Transaction, { foreignKey: "userId" });
Transaction.belongsTo(User, { foreignKey: "userId" });

User.hasMany(Bonus, { foreignKey: "userId" });
Bonus.belongsTo(User, { foreignKey: "userId" });

// Sync models with database
const syncModels = async () => {
  try {
    if (process.env.NODE_ENV === "development") {
      // Use { force: true } only in development to drop and recreate tables
      await sequelize.sync({ alter: true });
      console.log("Database synchronized");
    } else {
      await sequelize.sync({ alter: false });

      // In production, don't auto-sync (use migrations instead)
      console.log("Database sync skipped in production");
    }
  } catch (error) {
    console.error("Error syncing database:", error);
  }
};

module.exports = {
  sequelize,
  User,
  Bet,
  Transaction,
  Bonus,
  syncModels,
};

// models/bet.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Bet = sequelize.define(
    "Bet",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
      },
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: {
          min: 1.0,
        },
      },
      gameType: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      betDetails: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      outcome: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      payout: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("pending", "won", "lost", "cancelled"),
        defaultValue: "pending",
      },
    },
    {
      timestamps: true,
    }
  );

  return Bet;
};

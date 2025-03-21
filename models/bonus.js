// models/bonus.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Bonus = sequelize.define(
    "Bonus",
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
      },
      type: {
        type: DataTypes.ENUM("signup", "deposit", "referral", "loyalty"),
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("active", "used", "expired"),
        defaultValue: "active",
      },
      wagering: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        comment: "Amount user needs to wager before bonus can be withdrawn",
      },
      wageringRemaining: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      timestamps: true,
    }
  );

  return Bonus;
};

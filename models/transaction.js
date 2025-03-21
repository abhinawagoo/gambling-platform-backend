// models/transaction.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Transaction = sequelize.define(
    "Transaction",
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
        type: DataTypes.ENUM("deposit", "withdrawal", "bet", "win"),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("pending", "completed", "failed", "cancelled"),
        defaultValue: "pending",
      },
      paymentMethod: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      paymentId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      timestamps: true,
    }
  );

  return Transaction;
};

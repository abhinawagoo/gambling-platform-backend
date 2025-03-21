const sequelize = require("./config/db");
const Bet = require("./models/bet");

sequelize
  .sync({ alter: true }) // `alter: true` updates the table structure if needed
  .then(() => console.log("Database synchronized"))
  .catch((err) => console.error("Error syncing database:", err));

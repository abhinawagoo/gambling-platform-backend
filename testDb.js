require("dotenv").config();
const { Sequelize } = require("sequelize");

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("❌ DATABASE_URL is not defined. Check your .env file.");
  process.exit(1); // Stop execution if DATABASE_URL is missing
}

const sequelize = new Sequelize(databaseUrl, {
  dialect: "postgres",
  logging: false, // Disable SQL logs in console
});

sequelize
  .authenticate()
  .then(() => console.log("✅ Database connection successful!"))
  .catch((error) => console.error("❌ Database connection error:", error));

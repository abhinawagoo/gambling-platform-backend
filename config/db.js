// config/db.js
const { Sequelize } = require("sequelize");
const env = require("./env");

let sequelize;

// Check if using connection string or individual components
if (env.DATABASE_URL) {
  // Use connection string for production (Supabase)
  sequelize = new Sequelize(env.DATABASE_URL, {
    dialect: "postgres",
    logging: env.NODE_ENV === "development" ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  });
} else {
  // Use individual components for local development
  sequelize = new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASSWORD, {
    host: env.DB_HOST,
    dialect: "postgres",
    logging: env.NODE_ENV === "development" ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });
}

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

module.exports = {
  sequelize,
  testConnection,
};

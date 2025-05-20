import { Sequelize } from "sequelize";
import { config } from "./config";

export const database = {
  HOST: config.database.host || "localhost",
  PORT: config.database.port || 5433,
  USER: config.database.user || "postgres",
  PASSWORD: config.database.password || "password",
  DB: config.database.name || "coesco_dev",
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};

export const sequelize = new Sequelize(
  database.DB,
  database.USER,
  database.PASSWORD,
  {
    host: database.HOST,
    dialect: "postgres",
    port: database.PORT,
    pool: {
      max: database.pool.max,
      min: database.pool.min,
      acquire: database.pool.acquire,
      idle: database.pool.idle,
    },
    logging: false,
  }
);

import { Sequelize } from "sequelize";
import { config } from "./config";

export const database = {
  host: config.database.host || "localhost",
  port: config.database.port || 5432,
  user: config.database.user || "postgres",
  password: config.database.password || "password",
  db: config.database.name || "coesco_dev",
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  logging: false,
};

export const sequelize = new Sequelize(
  database.db,
  database.user,
  database.password,
  {
    host: database.host,
    dialect: "postgres",
    port: database.port,
    pool: {
      max: database.pool.max,
      min: database.pool.min,
      acquire: database.pool.acquire,
      idle: database.pool.idle,
    },
    logging: false,
  }
);

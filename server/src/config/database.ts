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

const quoteDatabase = {
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "password",
  db: "quote_copy",
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
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

export const quoteSequelize = new Sequelize(
  quoteDatabase.db,
  quoteDatabase.user,
  quoteDatabase.password,
  {
    host: quoteDatabase.host,
    dialect: "postgres",
    port: quoteDatabase.port,
    pool: {
      max: quoteDatabase.pool.max,
      min: quoteDatabase.pool.min,
      acquire: quoteDatabase.pool.acquire,
      idle: quoteDatabase.pool.idle,
    },
    logging: false,
  }
);

import { Sequelize } from "sequelize";
import { config } from "./config";

export const database = {
  HOST: config.database.host || "localhost",
  PORT: config.database.port || 5433,
  USER: config.database.user || "postgres",
  PASSWORD: config.database.password || "password",
  DB: config.database.name || "machining_dev",
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

export const machineSeed = [
  {
    name: "Mazak 200",
    slug: "mazak-200",
    type: "LATHE",
    controller: "MAZAK",
    controllerModel: "MAZAK",
  },
  {
    name: "Mazak 350",
    slug: "mazak-350",
    type: "LATHE",
    controller: "MAZAK",
    controllerModel: "MAZAK",
  },
  {
    name: "Mazak 450",
    slug: "mazak-450",
    type: "LATHE",
    controller: "MAZAK",
    controllerModel: "MAZAK",
  },
  {
    name: "Doosan 3100LS",
    slug: "doosan",
    type: "LATHE",
    controller: "FANUC",
    controllerModel: "31i",
  },
  {
    name: "Kuraki Boring Mill",
    slug: "kuraki",
    type: "MILL",
    controller: "FANUC",
    controllerModel: "16i",
  },
  {
    name: "OKK",
    slug: "okk",
    type: "MILL",
    controller: "FANUC",
    controllerModel: "160is",
  },
  {
    name: "Niigata HN80",
    slug: "niigata-hn80",
    type: "MILL",
    controller: "FANUC",
    controllerModel: "16i",
  },
  {
    name: "Niigata SPN63",
    slug: "niigata-spn63",
    type: "MILL",
    controller: "FANUC",
    controllerModel: "16i",
  },
];

export const connectionSeed = [
  {
    machineSlug: "mazak-200",
    protocol: "MTCONNECT",
    host: "192.231.64.83",
    port: 5000,
    status: "DISCONNECTED",
  },
  {
    machineSlug: "mazak-350",
    protocol: "MTCONNECT",
    host: "192.231.64.53",
    port: 5000,
    status: "DISCONNECTED",
  },
  {
    machineSlug: "mazak-450",
    protocol: "MTCONNECT",
    host: "192.231.64.45",
    port: 5000,
    status: "DISCONNECTED",
  },
  {
    machineSlug: "doosan",
    protocol: "CUSTOM",
    host: "192.231.64.127",
    port: 8193,
    status: "DISCONNECTED",
  },
  {
    machineSlug: "kuraki",
    protocol: "CUSTOM",
    host: "192.231.64.x",
    port: 8193,
    status: "DISCONNECTED",
  },
  {
    machineSlug: "okk",
    protocol: "CUSTOM",
    host: "192.231.64.203",
    port: 8193,
    status: "DISCONNECTED",
  },
  {
    machineSlug: "niigata-hn80",
    protocol: "CUSTOM",
    host: "192.231.64.202",
    port: 8193,
    status: "DISCONNECTED",
  },
  {
    machineSlug: "niigata-spn63",
    protocol: "CUSTOM",
    host: "192.231.64.201",
    port: 8193,
    status: "DISCONNECTED",
  },
];

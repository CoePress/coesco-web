import fs from "fs";
import path from "path";
import { Sequelize } from "sequelize";

const basename = path.basename(__filename);
const db: { [key: string]: any } = {};

export const initializeModels = async (sequelize: Sequelize) => {
  fs.readdirSync(__dirname)
    .filter(
      (file) =>
        file.indexOf(".") !== 0 &&
        file !== basename &&
        (file.slice(-3) === ".ts" || file.slice(-3) === ".js")
    )
    .forEach((file) => {
      const modelPath = path.join(__dirname, file);
      const modelModule = require(modelPath).default;
      modelModule.initialize(sequelize);
      db[modelModule.name] = modelModule;
    });

  Object.keys(db).forEach((modelName) => {
    if (typeof db[modelName].associate === "function") {
      db[modelName].associate(db);
    }
  });

  db.sequelize = sequelize;
  db.Sequelize = Sequelize;

  return db;
};

export default db;

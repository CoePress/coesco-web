import { DataTypes, Model, Sequelize, UUIDV4 } from "sequelize";
import { IApiKey } from "@/types/api.types";

class ApiKey extends Model<IApiKey> implements IApiKey {
  declare id: string;
  declare key: string;
  declare ownerId: string;
  declare name: string;
  declare createdAt: Date;
  declare expiresAt?: Date;
  declare scopes: string[];

  public static initialize(sequelize: Sequelize): void {
    ApiKey.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: UUIDV4,
          primaryKey: true,
        },
        key: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        ownerId: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn("NOW"),
        },
        expiresAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        scopes: {
          type: DataTypes.ARRAY(DataTypes.STRING),
          allowNull: false,
        },
      },
      {
        sequelize,
        modelName: "ApiKey",
        tableName: "api_keys",
        indexes: [
          {
            unique: true,
            fields: ["key"],
          },
        ],
      }
    );
  }
}

export default ApiKey;

import { DataTypes, Model, Sequelize, UUIDV4 } from "sequelize";

import { ConfigValueType, IConfigValue } from "@/utils/types";

type ConfigValueAttributes = Omit<IConfigValue, "createdAt" | "updatedAt">;

class ConfigValue
  extends Model<ConfigValueAttributes, IConfigValue>
  implements ConfigValueAttributes
{
  declare id: string;
  declare key: string;
  declare type: string;
  declare value: ConfigValueType;
  declare parentId?: string | number;
  declare description?: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  public static initialize(sequelize: Sequelize): void {
    ConfigValue.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: UUIDV4,
          primaryKey: true,
        },
        key: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        type: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        value: {
          type: DataTypes.JSONB,
          allowNull: false,
        },
        parentId: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: "config_values",
        timestamps: true,
        underscored: true,
        indexes: [
          {
            fields: ["key"],
          },
          {
            fields: ["parent_id"],
          },
        ],
      }
    );
  }

  public static associate(models: any): void {
    ConfigValue.belongsTo(models.ConfigValue, {
      foreignKey: "parentId",
      as: "parent",
    });
  }
}

export default ConfigValue;

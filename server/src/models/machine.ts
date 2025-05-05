import { DataTypes, Model, Sequelize, UUIDV4 } from "sequelize";

import { IMachine, MachineType, MachineController } from "@/utils/types";

type MachineAttributes = Omit<IMachine, "createdAt" | "updatedAt">;

class Machine
  extends Model<MachineAttributes, IMachine>
  implements MachineAttributes
{
  declare id: string;
  declare slug: string;
  declare name: string;
  declare type: MachineType;
  declare controller: MachineController;
  declare controllerModel: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  public static initialize(sequelize: Sequelize): void {
    Machine.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: UUIDV4,
          primaryKey: true,
        },
        slug: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        type: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        controller: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        controllerModel: {
          type: DataTypes.STRING,
          allowNull: false,
        },
      },
      {
        sequelize,
        tableName: "machines",
        timestamps: true,
        underscored: true,
        indexes: [{ fields: ["name"] }, { fields: ["type"] }],
      }
    );
  }

  public static associate(models: any): void {
    Machine.hasMany(models.MachineConnection, {
      foreignKey: "machineId",
      as: "connections",
      onDelete: "CASCADE",
    });

    Machine.hasMany(models.MachineState, {
      foreignKey: "machineId",
      as: "states",
      onDelete: "CASCADE",
    });
  }
}

export default Machine;

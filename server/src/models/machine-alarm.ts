import { DataTypes, Model, Sequelize, UUIDV4 } from "sequelize";

import { IMachineAlarm } from "@/utils/types";

type MachineAlarmAttributes = Omit<IMachineAlarm, "createdAt" | "updatedAt">;

class MachineAlarm
  extends Model<MachineAlarmAttributes, IMachineAlarm>
  implements MachineAlarmAttributes
{
  declare id: string;
  declare machineId: string;
  declare timestamp: Date;
  declare type: string;
  declare severity: string;
  declare message?: string;
  declare resolved: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  public static initialize(sequelize: Sequelize): void {
    MachineAlarm.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: UUIDV4,
          primaryKey: true,
        },
        machineId: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        timestamp: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        type: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        severity: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        message: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        resolved: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
      },
      {
        sequelize,
        tableName: "machine_alarms",
        timestamps: true,
        underscored: true,
        indexes: [{ fields: ["machine_id"] }],
      }
    );
  }

  public static associate(models: any): void {
    MachineAlarm.belongsTo(models.Machine, {
      foreignKey: "machineId",
      as: "machine",
    });
  }
}

export default MachineAlarm;

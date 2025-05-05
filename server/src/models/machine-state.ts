import { DataTypes, Model, Sequelize, UUIDV4 } from "sequelize";

import { IMachineState, MachineAxis } from "@/utils/types";

type MachineStateAttributes = Omit<IMachineState, "createdAt" | "updatedAt">;

class MachineState
  extends Model<MachineStateAttributes, IMachineState>
  implements MachineStateAttributes
{
  declare id: string;
  declare machineId: string;
  declare timestamp: Date;
  declare state: string;
  declare execution: string;
  declare controller: string;
  declare program: string;
  declare tool: string;
  declare position: Record<MachineAxis, number>;
  declare feedRate: number;
  declare spindleSpeed: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  public static initialize(sequelize: Sequelize): void {
    MachineState.init(
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
        state: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        execution: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        controller: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        program: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        tool: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        position: {
          type: DataTypes.JSONB,
          allowNull: false,
        },
        feedRate: {
          type: DataTypes.FLOAT,
          allowNull: false,
        },
        spindleSpeed: {
          type: DataTypes.FLOAT,
          allowNull: false,
        },
      },
      {
        sequelize,
        tableName: "machine_states",
        timestamps: true,
        underscored: true,
        indexes: [{ fields: ["machine_id"] }, { fields: ["timestamp"] }],
      }
    );
  }

  public static associate(models: any): void {
    MachineState.belongsTo(models.Machine, {
      foreignKey: "machineId",
      as: "machine",
    });
  }
}

export default MachineState;

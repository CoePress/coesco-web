import { DataTypes, Model, Sequelize, UUIDV4 } from "sequelize";
import { IMachineStatus } from "@/types/schema.types";
import { MachineState } from "@/types/enum.types";

type MachineStatusAttributes = Omit<IMachineStatus, "createdAt" | "updatedAt">;

class MachineStatus
  extends Model<MachineStatusAttributes, IMachineStatus>
  implements MachineStatusAttributes
{
  declare id: string;
  declare machineId: string;
  declare state: MachineState;
  declare execution: string;
  declare controller: string;
  declare program: string;
  declare tool: string;
  declare metrics: Record<string, number>;
  declare alarmCode: string;
  declare alarmMessage: string;
  declare startTime: Date;
  declare endTime: Date | null;
  declare duration: number;

  public static initialize(sequelize: Sequelize): void {
    MachineStatus.init(
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
        state: {
          type: DataTypes.ENUM(...Object.values(MachineState)),
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
          allowNull: true,
        },
        tool: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        metrics: {
          type: DataTypes.JSONB,
          allowNull: true,
        },
        alarmCode: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        alarmMessage: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        startTime: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        endTime: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        duration: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: "machine_statuses",
        timestamps: true,
        underscored: true,
      }
    );
  }

  public static associate(models: any): void {
    MachineStatus.belongsTo(models.Machine, {
      foreignKey: "machineId",
      as: "machine",
    });
  }
}

export default MachineStatus;

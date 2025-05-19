import { DataTypes, Model, Sequelize, UUIDV4 } from "sequelize";
import { IMachine, ICreateMachineDto } from "@/types/schema.types";
import {
  MachineConnectionType,
  MachineControllerType,
  MachineType,
} from "@/types/enum.types";

type MachineAttributes = Omit<IMachine, "createdAt" | "updatedAt">;

class Machine
  extends Model<MachineAttributes, ICreateMachineDto>
  implements MachineAttributes
{
  declare id: string;
  declare slug: string;
  declare name: string;
  declare type: MachineType;
  declare controllerType: MachineControllerType;
  declare controllerModel: string;
  declare connectionType: MachineConnectionType;
  declare connectionHost: string;
  declare connectionPort: number;
  declare connectionUrl: string;

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
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        type: {
          type: DataTypes.ENUM(...Object.values(MachineType)),
          allowNull: false,
        },
        controllerType: {
          type: DataTypes.ENUM(...Object.values(MachineControllerType)),
          allowNull: false,
        },
        controllerModel: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        connectionType: {
          type: DataTypes.ENUM(...Object.values(MachineConnectionType)),
          allowNull: false,
        },
        connectionHost: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        connectionPort: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        connectionUrl: {
          type: DataTypes.STRING,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: "machines",
        timestamps: true,
        underscored: true,
      }
    );
  }

  public static associate(models: any): void {
    Machine.hasMany(models.MachineStatus, {
      foreignKey: "machineId",
      as: "status",
    });
  }
}

export default Machine;

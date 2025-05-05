import { DataTypes, Model, Sequelize, UUIDV4 } from "sequelize";

import {
  IMachineConnection,
  MachineConnectionProtocol,
  MachineConnectionStatus,
} from "@/utils/types";

type MachineConnectionAttributes = Omit<
  IMachineConnection,
  "createdAt" | "updatedAt"
>;

class MachineConnection
  extends Model<MachineConnectionAttributes, IMachineConnection>
  implements MachineConnectionAttributes
{
  declare id: string;
  declare machineId: string;
  declare machineSlug: string;
  declare protocol: MachineConnectionProtocol;
  declare host: string;
  declare port: number;
  declare path?: string;
  declare status: MachineConnectionStatus;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  public static initialize(sequelize: Sequelize): void {
    MachineConnection.init(
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
        machineSlug: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        protocol: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        host: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        port: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        path: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        status: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: "DISCONNECTED",
        },
      },
      {
        sequelize,
        tableName: "machine_connections",
        timestamps: true,
        underscored: true,
        indexes: [{ fields: ["machine_id"] }],
      }
    );
  }

  public static associate(models: any): void {
    MachineConnection.belongsTo(models.Machine, {
      foreignKey: "machineId",
      as: "machine",
    });
  }
}

export default MachineConnection;

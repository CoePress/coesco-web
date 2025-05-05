import { DataTypes, Model, Sequelize, UUIDV4 } from "sequelize";

import { IUser } from "@/utils/types";

type UserAttributes = Omit<IUser, "createdAt" | "updatedAt">;

class User extends Model<UserAttributes, IUser> implements UserAttributes {
  declare id: string;
  declare microsoftId: string;
  declare name: string;
  declare email: string;
  declare department: string;
  declare role: string;
  declare isActive: boolean;
  declare receivesReports: boolean;
  declare lastLogin?: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  public static initialize(sequelize: Sequelize): void {
    User.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: UUIDV4,
          primaryKey: true,
        },
        microsoftId: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        email: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
          validate: {
            isEmail: true,
          },
        },
        department: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        role: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        receivesReports: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        lastLogin: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: "users",
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ["microsoft_id"] },
          { fields: ["email"] },
          { fields: ["role"] },
          { fields: ["is_active"] },
          { fields: ["receives_reports"] },
        ],
      }
    );
  }
}

export default User;

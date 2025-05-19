import { DataTypes, Model, Sequelize, UUIDV4 } from "sequelize";
import { IAuthAttributes } from "@/types/auth.types";
import { UserType } from "@/types/enum.types";

class Auth extends Model<IAuthAttributes> implements IAuthAttributes {
  declare id: string;
  declare email: string;
  declare password: string;
  declare microsoftId: string;
  declare userId: string;
  declare userType: UserType;
  declare isActive: boolean;
  declare isVerified: boolean;
  declare createdAt: Date;
  declare updatedAt: Date;

  public static initialize(sequelize: Sequelize): void {
    Auth.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: UUIDV4,
          primaryKey: true,
        },
        email: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        password: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        microsoftId: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        userId: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        userType: {
          type: DataTypes.ENUM(...Object.values(UserType)),
          allowNull: false,
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        isVerified: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
      },
      {
        sequelize,
        tableName: "auth",
        timestamps: true,
        underscored: true,
      }
    );
  }

  public static associate(models: any): void {
    Auth.belongsTo(models.Employee, {
      foreignKey: "userId",
      as: "employee",
    });
  }
}

export default Auth;

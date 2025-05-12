import { DataTypes, Model, Sequelize, UUIDV4 } from "sequelize";
import { IAuth, UserType } from "@/types/schema.types";

type AuthAttributes = Omit<IAuth, "createdAt" | "updatedAt">;

class Auth extends Model<AuthAttributes, IAuth> implements AuthAttributes {
  declare id: string;
  declare email: string;
  declare password: string;
  declare microsoftId: string;
  declare userId: string;
  declare userType: UserType;
  declare isActive: boolean;
  declare isVerified: boolean;
  declare lastLogin: Date;

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
        },
        password: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        microsoftId: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        userId: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        userType: {
          type: DataTypes.ENUM(...Object.values(UserType)),
          allowNull: false,
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
        },
        isVerified: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
        },
        lastLogin: {
          type: DataTypes.DATE,
          allowNull: true,
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

    // Auth.belongsTo(models.Customer, {
    //   foreignKey: "userId",
    //   as: "customer",
    // });
  }
}

export default Auth;

import { DataTypes, Model, Sequelize, UUIDV4 } from "sequelize";
import { EmployeeRole, IEmployeeAttributes } from "@/types/schema.types";

class Employee
  extends Model<IEmployeeAttributes>
  implements IEmployeeAttributes
{
  declare id: string;
  declare firstName: string;
  declare lastName: string;
  declare email: string;
  declare phone: string;
  declare jobTitle: string;
  declare departmentId: string;
  declare microsoftId: string;
  declare role: EmployeeRole;
  declare lastLogin: Date;

  public static initialize(sequelize: Sequelize): void {
    Employee.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: UUIDV4,
          primaryKey: true,
        },
        firstName: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        lastName: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        email: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        phone: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        jobTitle: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        departmentId: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        microsoftId: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        role: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        lastLogin: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: "employees",
        timestamps: true,
        underscored: true,
      }
    );
  }

  public static associate(models: any): void {
    Employee.hasOne(models.Auth, {
      foreignKey: "userId",
      as: "auth",
    });
  }
}

export default Employee;

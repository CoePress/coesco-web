import { DataTypes, Model, Sequelize, UUIDV4 } from "sequelize";
import { EmployeeStatus, IEmployee } from "@/types/schema.types";

type EmployeeAttributes = Omit<IEmployee, "createdAt" | "updatedAt">;

class Employee
  extends Model<EmployeeAttributes, IEmployee>
  implements EmployeeAttributes
{
  declare id: string;
  declare firstName: string;
  declare lastName: string;
  declare email: string;
  declare phone: string;
  declare role: string;
  declare departmentIds: string[];
  declare primaryDepartmentId: string;
  declare reportsToId: string;
  declare status: EmployeeStatus;
  declare microsoftId: string;
  declare hiredAt: Date;
  declare terminatedAt: Date;

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
          allowNull: false,
        },
        phone: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        role: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        departmentIds: {
          type: DataTypes.ARRAY(DataTypes.UUID),
          allowNull: false,
        },
        primaryDepartmentId: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        reportsToId: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        status: {
          type: DataTypes.ENUM(...Object.values(EmployeeStatus)),
          allowNull: false,
        },
        microsoftId: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        hiredAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        terminatedAt: {
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
    Employee.belongsTo(models.Employee, {
      foreignKey: "reportsToId",
      as: "reportsTo",
    });

    Employee.hasMany(models.Employee, {
      foreignKey: "reportsToId",
      as: "reports",
    });

    Employee.belongsTo(models.Auth, {
      foreignKey: "userId",
      as: "auth",
    });
  }
}

export default Employee;

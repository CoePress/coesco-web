import bcrypt from "bcrypt";

import type { Migration, MigrationContext } from "./migrator";

import { runMigration } from "./migrator";

export const migrateDepartments: Migration = {
  name: "Departments",
  run: async (ctx) => {
    return runMigration({
      sourceDatabase: "std",
      sourceTable: "Employee",
      targetTable: "department",
      fieldMappings: [
        { from: "DeptCode", to: "code", transform: v => v?.trim(), required: true },
      ],
      beforeSave: async (data, original, ctx) => {
        const code = original.DeptCode?.trim();
        if (!code)
          return null;

        const existing = await ctx.findRecord("department", { code });
        if (existing)
          return null;

        return { ...data, name: code, description: code, createdById: "system", updatedById: "system" };
      },
    }, ctx);
  },
};

export const migrateUsers: Migration = {
  name: "Users",
  run: async (ctx) => {
    const hash = await bcrypt.hash("Password123!", 10);
    ctx.cache.set("passwordHash", hash);

    return runMigration({
      sourceDatabase: "std",
      sourceTable: "Employee",
      targetTable: "user",
      fieldMappings: [],
      beforeSave: async (data, original, ctx) => {
        const initials = original.EmpInitials?.trim();
        if (!initials)
          return null;

        const username = initials.toLowerCase();
        const existing = await ctx.findRecord("user", { username });
        if (existing)
          return null;

        return {
          username,
          password: ctx.cache.get("passwordHash"),
          microsoftId: null,
          role: "USER",
          isActive: true,
        };
      },
    }, ctx);
  },
};

export const migrateEmployees: Migration = {
  name: "Employees",
  run: async (ctx) => {
    const result = await runMigration({
      sourceDatabase: "std",
      sourceTable: "Employee",
      targetTable: "employee",
      fieldMappings: [
        { from: "EmpNum", to: "number", transform: v => v?.trim(), required: true },
        { from: "EmpFirstName", to: "firstName", transform: v => v?.trim(), required: true },
        { from: "EmpLastName", to: "lastName", transform: v => v?.trim(), required: true },
        { from: "EmpInitials", to: "initials", transform: v => v?.trim(), required: true },
        { from: "Emptitle", to: "title", transform: v => v?.trim() },
        { from: "HireDate", to: "hireDate", transform: v => v ? new Date(v) : null },
        { from: "StartDate", to: "startDate", transform: v => v ? new Date(v) : null },
        { from: "TermDate", to: "terminationDate", transform: v => v ? new Date(v) : null },
        { from: "Salaried", to: "isSalaried", transform: v => v === true || v === "1" || v === 1 },
      ],
      beforeSave: async (data, original, ctx) => {
        const initials = original.EmpInitials?.trim();
        if (!initials)
          return null;

        const user = await ctx.findRecord<{ id: string }>("user", { username: initials.toLowerCase() });
        if (!user)
          return null;

        const dept = original.DeptCode?.trim();
        const department = dept ? await ctx.findRecord<{ id: string }>("department", { code: dept }) : null;

        return {
          ...data,
          userId: user.id,
          email: `${initials}@cpec.com`,
          departmentId: department?.id || null,
          createdAt: new Date(original.CreateDate || original.ModifyDate || Date.now()),
          updatedAt: new Date(original.ModifyDate || original.CreateDate || Date.now()),
          createdById: original.CreateInit?.toLowerCase() || "system",
          updatedById: original.ModifyInit?.toLowerCase() || "system",
        };
      },
    }, ctx);

    // Update employee references (createdById/updatedById from initials to IDs)
    if (result.created > 0) {
      const employees = await ctx.db.employee.findMany({
        select: { id: true, initials: true, createdById: true, updatedById: true },
      });

      const initialsMap = new Map(employees.map(e => [e.initials?.toLowerCase(), e.id]));

      for (const emp of employees) {
        const updates: any = {};
        if (emp.createdById && initialsMap.has(emp.createdById)) {
          updates.createdById = initialsMap.get(emp.createdById);
        }
        if (emp.updatedById && initialsMap.has(emp.updatedById)) {
          updates.updatedById = initialsMap.get(emp.updatedById);
        }
        if (Object.keys(updates).length) {
          await ctx.db.employee.update({ where: { id: emp.id }, data: updates });
        }
      }
    }

    return result;
  },
};

export const migrateManagers: Migration = {
  name: "Employee Managers",
  run: async (ctx) => {
    return runMigration({
      sourceDatabase: "std",
      sourceTable: "EmpMgr",
      targetTable: "employee",
      fieldMappings: [],
      beforeSave: async (data, original, ctx) => {
        const empNum = original.EmpNum?.trim();
        const mgrNum = original.MgrNum?.trim();
        if (!empNum || !mgrNum)
          return null;

        const employee = await ctx.findRecord<{ id: string }>("employee", { number: empNum });
        const manager = await ctx.findRecord<{ id: string }>("employee", { number: mgrNum });
        if (!employee || !manager)
          return null;

        await ctx.db.employee.update({
          where: { id: employee.id },
          data: { managerId: manager.id },
        });

        return null; // Don't create, just update
      },
    }, ctx);
  },
};

export const employeeMigrations: Migration[] = [
  migrateDepartments,
  migrateUsers,
  migrateEmployees,
  migrateManagers,
];

/* eslint-disable node/prefer-global/process */
import { MachineControllerType, MachineType } from "@prisma/client";

import { _migrateEmployees, closeDatabaseConnections } from "@/scripts/data-pipeline";
import { seedFiles } from "@/scripts/seed-files";
import { MicrosoftService } from "@/services/business/microsoft.service";
import { ALL_PERMISSIONS } from "@/services/core/permission.service";
import { logger } from "@/utils/logger";
import { prisma } from "@/utils/prisma";

// contextStorage.enterWith(SYSTEM_CONTEXT);

const microsoftService = new MicrosoftService();

const machines = [
  {
    slug: "mazak-200",
    name: "Mazak 200",
    type: MachineType.LATHE,
    controllerType: MachineControllerType.MAZAK,
    connectionUrl: "http://192.231.64.71:5000/current",
    enabled: true,
  },
  {
    slug: "mazak-350",
    name: "Mazak 350",
    type: MachineType.LATHE,
    controllerType: MachineControllerType.MAZAK,
    connectionUrl: "http://192.231.64.81:5000/current",
    enabled: true,
  },
  {
    slug: "mazak-450",
    name: "Mazak 450",
    type: MachineType.LATHE,
    controllerType: MachineControllerType.MAZAK,
    connectionUrl: "http://192.231.64.49:5000/current",
    enabled: true,
  },
  {
    slug: "doosan",
    name: "Doosan 3100LS",
    type: MachineType.LATHE,
    controllerType: MachineControllerType.FANUC,
    connectionUrl: "http://10.231.200.81:5000/api/v1/doosan/current",
    enabled: true,
  },
  {
    slug: "kuraki",
    name: "Kuraki Boring Mill",
    type: MachineType.MILL,
    controllerType: MachineControllerType.FANUC,
    connectionUrl: "http://10.231.200.81:5000/api/v1/kuraki/current",
    enabled: false,
  },
  {
    slug: "okk",
    name: "OKK",
    type: MachineType.MILL,
    controllerType: MachineControllerType.FANUC,
    connectionUrl: "http://10.231.200.81:5000/api/v1/okk/current",
    enabled: true,
  },
  {
    slug: "hn80",
    name: "Niigata HN80",
    type: MachineType.MILL,
    controllerType: MachineControllerType.FANUC,
    connectionUrl: "http://10.231.200.81:5000/api/v1/hn80/current",
    enabled: true,
  },
  {
    slug: "spn630",
    name: "Niigata SPN630",
    type: MachineType.MILL,
    controllerType: MachineControllerType.FANUC,
    connectionUrl: "http://10.231.200.81:5000/api/v1/spn630/current",
    enabled: false,
  },
];

async function seedEmployees() {
  try {
    const employeeCount = await prisma.employee.count();

    if (employeeCount === 0) {
      await _migrateEmployees();
      await closeDatabaseConnections();
      await microsoftService.sync();
    }
    else {
      const usersWithoutEmployees = await prisma.user.findMany({
        where: {
          employee: null,
          microsoftId: { not: null },
        },
      });

      if (usersWithoutEmployees.length > 0) {
        await microsoftService.sync();
      }
    }
  }
  catch (error) {
    logger.error("Error during employee seeding:", error);
  }
}

async function seedMachines() {
  try {
    for (const machine of machines) {
      const existing = await prisma.machine.findUnique({
        where: { slug: machine.slug },
      });

      if (!existing) {
        await prisma.machine.create({
          data: {
            ...machine,
            createdById: "system",
            updatedById: "system",
          },
        });
      }
    }
  }
  catch (error) {
    logger.error("Error during machine seeding:", error);
  }
}

async function seedPermissions() {
  try {
    const existingPermissions = await prisma.permission.count();
    
    if (existingPermissions === 0) {
      logger.info("Seeding permissions...");
      
      for (const permission of ALL_PERMISSIONS) {
        const [resource, ...actionParts] = permission.split(".");
        const action = actionParts.join(".");
        
        await prisma.permission.create({
          data: {
            resource,
            action,
            description: `Permission for ${permission}`,
          },
        });
      }
      
      logger.info(`Seeded ${ALL_PERMISSIONS.length} permissions`);
    }
  }
  catch (error) {
    logger.error("Error during permission seeding:", error);
  }
}

async function seedRoles() {
  try {
    const adminRole = await prisma.role.findUnique({
      where: { name: "ADMIN" },
    });
    
    if (!adminRole) {
      logger.info("Seeding roles...");
      
      const adminRoleData = await prisma.role.create({
        data: {
          name: "ADMIN",
          description: "Full system administrator with all permissions",
          isSystem: true,
        },
      });
      
      const userRole = await prisma.role.create({
        data: {
          name: "USER",
          description: "Standard user with basic permissions",
          isSystem: true,
        },
      });
      
      // Get all permissions for ADMIN role
      const allPermissions = await prisma.permission.findMany();
      
      // Admin gets all permissions
      for (const permission of allPermissions) {
        await prisma.rolePermission.create({
          data: {
            roleId: adminRoleData.id,
            permissionId: permission.id,
          },
        });
      }
      
      // User gets basic permissions
      const userPermissions = [
        "employees.read",
        "legacy.read", 
        "pipeline.read",
        "quotes.create",
        "quotes.read", 
        "quotes.update",
        "reports.view",
        "reports.generate",
      ];
      
      for (const permissionName of userPermissions) {
        const [resource, action] = permissionName.split(".");
        const permission = await prisma.permission.findFirst({
          where: { resource, action },
        });
        
        if (permission) {
          await prisma.rolePermission.create({
            data: {
              roleId: userRole.id,
              permissionId: permission.id,
            },
          });
        }
      }
      
      logger.info("Seeded ADMIN and USER roles with permissions");
    }
  }
  catch (error) {
    logger.error("Error during role seeding:", error);
  }
}

export async function seedDatabase() {
  await seedPermissions();
  await seedRoles();
  await seedEmployees();
  await seedMachines();
  await seedFiles();

  logger.info("All seeding completed successfully");
}

// Only exit process if running as standalone script
if (require.main === module) {
  seedDatabase()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      logger.error("Fatal error during seeding:", error);
      process.exit(1);
    });
}

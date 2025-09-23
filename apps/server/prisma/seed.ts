/* eslint-disable node/prefer-global/process */
import { FormFieldControlType, FormFieldDataType, MachineControllerType, MachineType } from "@prisma/client";

import { _migrateEmployees, closeDatabaseConnections } from "@/scripts/data-pipeline";
import { MicrosoftService } from "@/services/business/microsoft.service";
import { ALL_PERMISSIONS } from "@/services/core/permission.service";
import serviceTechDailyTemplate from "@/templates/service-tech-daily.json";
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

    if (employeeCount === 2) {
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

function mapControlType(controlType: string): FormFieldControlType {
  const mapping: Record<string, FormFieldControlType> = {
    "dropdown": FormFieldControlType.DROPDOWN,
    "date selector": FormFieldControlType.DATE_SELECTOR,
    "stamp": FormFieldControlType.STAMP,
    "textbox": FormFieldControlType.TEXTBOX,
    "text area": FormFieldControlType.TEXT_AREA,
    "sketch pad": FormFieldControlType.SKETCH_PAD,
    "camera": FormFieldControlType.CAMERA,
    "time selector": FormFieldControlType.TIME_SELECTOR,
    "signature pad": FormFieldControlType.SIGNATURE_PAD,
  };
  return mapping[controlType] || FormFieldControlType.INPUT;
}

function mapDataType(dataType: string): FormFieldDataType {
  const mapping: Record<string, FormFieldDataType> = {
    "text": FormFieldDataType.TEXT,
    "date": FormFieldDataType.DATE,
    "geo location": FormFieldDataType.GEO_LOCATION,
    "email": FormFieldDataType.EMAIL,
    "phone number": FormFieldDataType.PHONE_NUMBER,
    "time": FormFieldDataType.TIME,
    "image": FormFieldDataType.IMAGE,
    "signature": FormFieldDataType.SIGNATURE,
    "date/time": FormFieldDataType.DATE_TIME,
  };
  return mapping[dataType] || FormFieldDataType.TEXT;
}

async function seedServiceTechDailyForm() {
  try {
    const existingForm = await prisma.form.findFirst({
      where: { name: serviceTechDailyTemplate.title },
    });

    if (!existingForm) {
      logger.info("Seeding Service Tech Daily form...");

      const form = await prisma.form.create({
        data: {
          name: serviceTechDailyTemplate.title,
          description: "Service Technician Daily Report Form",
          status: "published",
          createdById: "system",
          updatedById: "system",
        },
      });

      for (const page of serviceTechDailyTemplate.pages) {
        const formPage = await prisma.formPage.create({
          data: {
            formId: form.id,
            title: page.label,
            sequence: page.sequence,
            createdById: "system",
            updatedById: "system",
          },
        });

        for (const section of page.sections) {
          const formSection = await prisma.formSection.create({
            data: {
              pageId: formPage.id,
              title: section.label,
              sequence: section.sequence,
              createdById: "system",
              updatedById: "system",
            },
          });

          for (const field of section.fields) {
            await prisma.formField.create({
              data: {
                sectionId: formSection.id,
                label: field.label,
                variable: field.variable,
                controlType: mapControlType(field.controlType),
                dataType: mapDataType(field.dataType),
                options: field.options ? field.options : undefined,
                isRequired: field.isRequired,
                isReadOnly: field.isReadOnly,
                isHiddenOnDevice: field.isHiddenOnDevice,
                isHiddenOnReport: field.isHiddenOnReport,
                sequence: field.sequence,
                createdById: "system",
                updatedById: "system",
              },
            });
          }
        }
      }

      logger.info(`Seeded Service Tech Daily form with ${serviceTechDailyTemplate.pages.length} pages`);
    }
  }
  catch (error) {
    logger.error("Error during Service Tech Daily form seeding:", error);
  }
}

export async function seedDatabase() {
  await seedEmployees();
  await seedPermissions();
  await seedRoles();
  await seedMachines();
  await seedServiceTechDailyForm();

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

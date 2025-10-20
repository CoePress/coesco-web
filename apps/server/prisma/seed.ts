/* eslint-disable node/prefer-global/process */
import { FormFieldControlType, FormFieldDataType, FormStatus, ItemType, MachineControllerType, MachineType } from "@prisma/client";

import { _migrateEmployees, _migrateDepartments, _migrateEmployeeManagers, closeDatabaseConnections } from "@/scripts/data-pipeline";
import { legacyService } from "@/services";
import { MicrosoftService } from "@/services/admin/microsoft.service";
import {
  formConditionalRuleRepository,
  formFieldRepository,
  formPageRepository,
  formSectionRepository,
  formRepository,
  machineRepository,
  performanceSheetVersionRepository,
  permissionRepository,
  rolePermissionRepository,
  roleRepository,
  productClassRepository,
  optionCategoryRepository,
  optionHeaderRepository,
  optionDetailsRepository,
  optionRuleRepository,
  optionRuleTriggerRepository,
  optionRuleTargetRepository,
  productClassOptionCategoryRepository,
  itemRepository,
} from "@/repositories";
import serviceTechDailyTemplate from "@/templates/service-tech-daily.json";
import defaultUsers from "@/config/default-users.json";
import { RFQ_PERFORMANCE_SHEET_SEED, TDDBHD_PERFORMANCE_SHEET_SEED } from "@/templates/performance-sheet";
import { logger } from "@/utils/logger";
import { prisma } from "@/utils/prisma";

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
    connectionUrl: "http://10.231.200.38:5000/api/v1/doosan/current",
    enabled: true,
  },
  {
    slug: "kuraki",
    name: "Kuraki Boring Mill",
    type: MachineType.MILL,
    controllerType: MachineControllerType.FANUC,
    connectionUrl: "http://10.231.200.38:5000/api/v1/kuraki/current",
    enabled: false,
  },
  {
    slug: "okk",
    name: "OKK",
    type: MachineType.MILL,
    controllerType: MachineControllerType.FANUC,
    connectionUrl: "http://10.231.200.38:5000/api/v1/okk/current",
    enabled: true,
  },
  {
    slug: "hn80",
    name: "Niigata HN80",
    type: MachineType.MILL,
    controllerType: MachineControllerType.FANUC,
    connectionUrl: "http://10.231.200.38:5000/api/v1/hn80/current",
    enabled: true,
  },
  {
    slug: "spn630",
    name: "Niigata SPN630",
    type: MachineType.MILL,
    controllerType: MachineControllerType.FANUC,
    connectionUrl: "http://10.231.200.38:5000/api/v1/spn630/current",
    enabled: false,
  },
];

async function seedEmployees() {
  try {
    const employeeCount = await prisma.employee.count();
    const defaultUserCount = defaultUsers.length;

    if (employeeCount <= defaultUserCount) {
      await _migrateDepartments(legacyService);
      await _migrateEmployees(legacyService);
      await _migrateEmployeeManagers(legacyService);
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
        await machineRepository.create({
          slug: machine.slug,
          name: machine.name,
          type: machine.type,
          controllerType: machine.controllerType,
          connectionUrl: machine.connectionUrl,
          enabled: machine.enabled,
          deletedAt: null,
          createdById: "system",
          updatedById: "system",
          deletedById: null,
        }, undefined, true);
      }
    }
  }
  catch (error) {
    logger.error("Error during machine seeding:", error);
  }
}

// async function seedPermissions() {
//   try {
//     const existingPermissions = await prisma.permission.count();

//     if (existingPermissions === 0) {
//       logger.info("Seeding permissions...");

//       for (const permission of ALL_PERMISSIONS) {
//         const [resource, ...actionParts] = permission.split(".");
//         const action = actionParts.join(".");

//         await permissionRepository.create({
//           resource,
//           action,
//           description: `Permission for ${permission}`,
//           condition: null,
//         });
//       }

//       logger.info(`Seeded ${ALL_PERMISSIONS.length} permissions`);
//     }
//   }
//   catch (error) {
//     logger.error("Error during permission seeding:", error);
//   }
// }

async function seedRoles() {
  try {
    const adminRole = await prisma.role.findUnique({
      where: { name: "ADMIN" },
    });

    if (!adminRole) {
      logger.info("Seeding roles...");

      const adminRoleData = await roleRepository.create({
        name: "ADMIN",
        description: "Full system administrator with all permissions",
        isSystem: true,
      });

      const userRole = await roleRepository.create({
        name: "USER",
        description: "Standard user with basic permissions",
        isSystem: true,
      });

      // Get all permissions for ADMIN role
      const allPermissions = await prisma.permission.findMany();

      // Admin gets all permissions
      for (const permission of allPermissions) {
        await rolePermissionRepository.create({
          roleId: adminRoleData.data.id,
          permissionId: permission.id,
          condition: null,
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
          await rolePermissionRepository.create({
            roleId: userRole.data.id,
            permissionId: permission.id,
            condition: null,
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

async function seedPerformanceSheetVersions() {
  try {
    const existingVersions = await prisma.performanceSheetVersion.count();

    if (existingVersions === 0) {
      logger.info("Seeding performance sheet versions...");

      await performanceSheetVersionRepository.create({
        sections: [RFQ_PERFORMANCE_SHEET_SEED, TDDBHD_PERFORMANCE_SHEET_SEED],
        createdById: "system",
        updatedById: "system",
      }, undefined, true);

      logger.info("Seeded performance sheet version with 2 tabs (RFQ and TDDBHD)");
    }
  }
  catch (error) {
    logger.error("Error during performance sheet version seeding:", error);
  }
}

async function seedServiceTechDailyForm() {
  try {
    const existingForm = await prisma.form.findFirst({
      where: { name: serviceTechDailyTemplate.title },
    });

    if (!existingForm) {
      logger.info("Seeding Service Tech Daily form...");

      const form = await formRepository.create({
        name: serviceTechDailyTemplate.title,
        description: "Service Technician Daily Report Form",
        status: FormStatus.PUBLISHED,
        createdById: "system",
        updatedById: "system",
      });

      const pageLabelMap = new Map<string, string>();

      for (const page of serviceTechDailyTemplate.pages) {
        const formPage = await formPageRepository.create({
          formId: form.data.id,
          title: page.label,
          sequence: page.sequence,
          createdById: "system",
          updatedById: "system",
        });

        pageLabelMap.set(page.label, formPage.data.id);

        for (const section of page.sections) {
          const formSection = await formSectionRepository.create({
            pageId: formPage.data.id,
            title: section.label,
            description: null,
            sequence: section.sequence,
            createdById: "system",
            updatedById: "system",
          });

          for (const field of section.fields) {
            await formFieldRepository.create({
              sectionId: formSection.data.id,
              label: field.label,
              variable: field.variable,
              controlType: mapControlType(field.controlType),
              dataType: mapDataType(field.dataType),
              options: field.options || {},
              isRequired: field.isRequired,
              isReadOnly: field.isReadOnly,
              isHiddenOnDevice: field.isHiddenOnDevice,
              isHiddenOnReport: field.isHiddenOnReport,
              sequence: field.sequence,
              createdById: "system",
              updatedById: "system",
            }, undefined, true);
          }
        }
      }

      const conditionalRules = (serviceTechDailyTemplate as any).conditionalRules;
      if (conditionalRules) {
        for (const ruleTemplate of conditionalRules) {
          const targetId = pageLabelMap.get(ruleTemplate.targetLabel);

          if (!targetId) {
            logger.error(`Could not find page with label: "${ruleTemplate.targetLabel}"`);
            continue;
          }

          try {
            await formConditionalRuleRepository.create({
              formId: form.data.id,
              name: ruleTemplate.name,
              targetType: ruleTemplate.targetType,
              targetId,
              action: ruleTemplate.action,
              conditions: ruleTemplate.conditions,
              operator: ruleTemplate.operator,
              priority: ruleTemplate.priority,
              isActive: true,
              createdById: "system",
              updatedById: "system",
            });
          } catch (error) {
            logger.error(`Error creating conditional rule "${ruleTemplate.name}":`, error);
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

async function seedCatalog() {
  try {
    const existingProductClasses = await prisma.productClass.count();

    if (existingProductClasses === 0) {
      logger.info("Seeding catalog data...");

      // Create Product Classes (hierarchy)
      const stampingPress = await productClassRepository.create({
        code: "SP",
        name: "Stamping Press",
        description: "High-speed stamping press machines",
        parentId: null,
        depth: 0,
        isActive: true,
      }, undefined, true);

      const sp100 = await productClassRepository.create({
        code: "SP-100",
        name: "SP-100 Series",
        description: "Entry-level stamping press",
        parentId: stampingPress.data.id,
        depth: 1,
        isActive: true,
      }, undefined, true);

      const sp200 = await productClassRepository.create({
        code: "SP-200",
        name: "SP-200 Series",
        description: "Mid-range stamping press",
        parentId: stampingPress.data.id,
        depth: 1,
        isActive: true,
      }, undefined, true);

      // Create Option Categories
      const speedCategory = await optionCategoryRepository.create({
        name: "Speed Control",
        description: "Speed and feed rate options",
        multiple: false,
        mandatory: true,
        standard: false,
        displayOrder: 1,
        legacyId: null,
      }, undefined, true);

      const powerCategory = await optionCategoryRepository.create({
        name: "Power System",
        description: "Motor and power options",
        multiple: false,
        mandatory: true,
        standard: false,
        displayOrder: 2,
        legacyId: null,
      }, undefined, true);

      const safetyCategory = await optionCategoryRepository.create({
        name: "Safety Features",
        description: "Safety and guarding options",
        multiple: true,
        mandatory: false,
        standard: true,
        displayOrder: 3,
        legacyId: null,
      }, undefined, true);

      // Link categories to product classes
      await productClassOptionCategoryRepository.create({
        productClassId: sp100.data.id,
        optionCategoryId: speedCategory.data.id,
        displayOrder: 1,
        isRequired: true,
        createdById: "system",
        updatedById: "system",
      }, undefined, true);

      await productClassOptionCategoryRepository.create({
        productClassId: sp100.data.id,
        optionCategoryId: powerCategory.data.id,
        displayOrder: 2,
        isRequired: true,
        createdById: "system",
        updatedById: "system",
      }, undefined, true);

      await productClassOptionCategoryRepository.create({
        productClassId: sp100.data.id,
        optionCategoryId: safetyCategory.data.id,
        displayOrder: 3,
        isRequired: false,
        createdById: "system",
        updatedById: "system",
      }, undefined, true);

      // Create Option Headers
      const standardSpeed = await optionHeaderRepository.create({
        optionCategoryId: speedCategory.data.id,
        name: "Standard Speed (60 SPM)",
        description: "Standard speed control up to 60 strokes per minute",
        legacyId: null,
        displayOrder: 1,
        isActive: true,
        createdById: "system",
        updatedById: "system",
      }, undefined, true);

      const highSpeed = await optionHeaderRepository.create({
        optionCategoryId: speedCategory.data.id,
        name: "High Speed (120 SPM)",
        description: "High-speed control up to 120 strokes per minute",
        legacyId: null,
        displayOrder: 2,
        isActive: true,
        createdById: "system",
        updatedById: "system",
      }, undefined, true);

      const motor10hp = await optionHeaderRepository.create({
        optionCategoryId: powerCategory.data.id,
        name: "10 HP Motor",
        description: "10 horsepower motor",
        legacyId: null,
        displayOrder: 1,
        isActive: true,
        createdById: "system",
        updatedById: "system",
      }, undefined, true);

      const motor15hp = await optionHeaderRepository.create({
        optionCategoryId: powerCategory.data.id,
        name: "15 HP Motor",
        description: "15 horsepower motor - required for high speed",
        legacyId: null,
        displayOrder: 2,
        isActive: true,
        createdById: "system",
        updatedById: "system",
      }, undefined, true);

      const lightCurtain = await optionHeaderRepository.create({
        optionCategoryId: safetyCategory.data.id,
        name: "Light Curtain Safety System",
        description: "Optical safety system",
        legacyId: null,
        displayOrder: 1,
        isActive: true,
        createdById: "system",
        updatedById: "system",
      }, undefined, true);

      const twoHandControl = await optionHeaderRepository.create({
        optionCategoryId: safetyCategory.data.id,
        name: "Two-Hand Control",
        description: "Standard two-hand control system",
        legacyId: null,
        displayOrder: 2,
        isActive: true,
        createdById: "system",
        updatedById: "system",
      }, undefined, true);

      // Create Option Details (pricing per product class)
      await optionDetailsRepository.create({
        optionHeaderId: standardSpeed.data.id,
        productClassId: sp100.data.id,
        itemId: null,
        price: 0,
        isActive: true,
        createdById: "system",
        updatedById: "system",
      }, undefined, true);

      await optionDetailsRepository.create({
        optionHeaderId: highSpeed.data.id,
        productClassId: sp100.data.id,
        itemId: null,
        price: 5000,
        isActive: true,
        createdById: "system",
        updatedById: "system",
      }, undefined, true);

      await optionDetailsRepository.create({
        optionHeaderId: motor10hp.data.id,
        productClassId: sp100.data.id,
        itemId: null,
        price: 2000,
        isActive: true,
        createdById: "system",
        updatedById: "system",
      }, undefined, true);

      await optionDetailsRepository.create({
        optionHeaderId: motor15hp.data.id,
        productClassId: sp100.data.id,
        itemId: null,
        price: 3500,
        isActive: true,
        createdById: "system",
        updatedById: "system",
      }, undefined, true);

      await optionDetailsRepository.create({
        optionHeaderId: lightCurtain.data.id,
        productClassId: sp100.data.id,
        itemId: null,
        price: 1200,
        isActive: true,
        createdById: "system",
        updatedById: "system",
      }, undefined, true);

      await optionDetailsRepository.create({
        optionHeaderId: twoHandControl.data.id,
        productClassId: sp100.data.id,
        itemId: null,
        price: 0,
        isActive: true,
        createdById: "system",
        updatedById: "system",
      }, undefined, true);

      // Create Option Rule: High Speed requires 15HP Motor
      const highSpeedRule = await optionRuleRepository.create({
        name: "High Speed requires 15HP Motor",
        description: "When high speed is selected, 15HP motor is required",
        action: "REQUIRE",
        priority: 10,
        isActive: true,
        condition: {},
        createdById: "system",
        updatedById: "system",
      }, undefined, true);

      await optionRuleTriggerRepository.create({
        ruleId: highSpeedRule.data.id,
        optionId: highSpeed.data.id,
        createdById: "system",
        updatedById: "system",
      }, undefined, true);

      await optionRuleTargetRepository.create({
        ruleId: highSpeedRule.data.id,
        optionId: motor15hp.data.id,
        createdById: "system",
        updatedById: "system",
      }, undefined, true);

      // Create Option Rule: High Speed disables 10HP Motor
      const highSpeedDisableRule = await optionRuleRepository.create({
        name: "High Speed disables 10HP Motor",
        description: "When high speed is selected, 10HP motor cannot be selected",
        action: "DISABLE",
        priority: 9,
        isActive: true,
        condition: {},
        createdById: "system",
        updatedById: "system",
      }, undefined, true);

      await optionRuleTriggerRepository.create({
        ruleId: highSpeedDisableRule.data.id,
        optionId: highSpeed.data.id,
        createdById: "system",
        updatedById: "system",
      }, undefined, true);

      await optionRuleTargetRepository.create({
        ruleId: highSpeedDisableRule.data.id,
        optionId: motor10hp.data.id,
        createdById: "system",
        updatedById: "system",
      }, undefined, true);

      const items = [
        {
          productClassId: sp100.data.id,
          modelNumber: "SP-100-BASE",
          name: "SP-100 Base Press",
          description: "Entry-level stamping press with standard configuration",
          specifications: {
            maxTonnage: 100,
            bedSize: "24x36",
            stroke: "6 inches",
            SPM: 60,
            motor: "10HP",
            price: 45000,
          },
          unitPrice: 45000,
          leadTime: 90,
          type: ItemType.Equipment,
          isActive: true,
        },
        {
          productClassId: sp200.data.id,
          modelNumber: "SP-200-BASE",
          name: "SP-200 Base Press",
          description: "Mid-range stamping press with enhanced capabilities",
          specifications: {
            maxTonnage: 200,
            bedSize: "30x48",
            stroke: "8 inches",
            SPM: 80,
            motor: "15HP",
            price: 75000,
          },
          unitPrice: 75000,
          leadTime: 120,
          type: ItemType.Equipment,
          isActive: true,
        },
        {
          productClassId: null,
          modelNumber: "DIE-KIT-001",
          name: "Standard Die Set",
          description: "Standard die set for stamping operations",
          specifications: {
            material: "Tool Steel",
            compatibility: ["SP-100", "SP-200"],
            price: 2500,
          },
          unitPrice: 2500,
          leadTime: 30,
          type: ItemType.Parts,
          isActive: true,
        },
        {
          productClassId: null,
          modelNumber: "SVC-INSTALL",
          name: "Installation Service",
          description: "Professional installation and setup service",
          specifications: {
            duration: "2-3 days",
            includes: ["Assembly", "Calibration", "Training"],
            price: 5000,
          },
          unitPrice: 5000,
          leadTime: null,
          type: ItemType.Service,
          isActive: true,
        },
        {
          productClassId: null,
          modelNumber: "SVC-MAINTENANCE",
          name: "Annual Maintenance Contract",
          description: "Yearly maintenance and inspection service",
          specifications: {
            visits: 4,
            coverage: ["Preventive maintenance", "Priority support", "Parts discount"],
            price: 3500,
          },
          unitPrice: 3500,
          leadTime: null,
          type: ItemType.Service,
          isActive: true,
        },
      ];

      const createdItems: { [key: string]: string } = {};

      for (const item of items) {
        const existing = await prisma.item.findFirst({
          where: { modelNumber: item.modelNumber },
        });

        if (!existing) {
          const created = await itemRepository.create({
            ...item,
            createdById: "system",
            updatedById: "system",
          }, undefined, true);

          if (item.modelNumber) {
            createdItems[item.modelNumber] = created.data.id;
          }
        }
      }

      if (createdItems["SP-100-BASE"]) {
        await optionDetailsRepository.create({
          optionHeaderId: standardSpeed.data.id,
          productClassId: null,
          itemId: createdItems["SP-100-BASE"],
          price: 0,
          isActive: true,
          createdById: "system",
          updatedById: "system",
        }, undefined, true);

        await optionDetailsRepository.create({
          optionHeaderId: motor10hp.data.id,
          productClassId: null,
          itemId: createdItems["SP-100-BASE"],
          price: 0,
          isActive: true,
          createdById: "system",
          updatedById: "system",
        }, undefined, true);
      }

      logger.info("Seeded catalog data with product classes, options, items, and rules");
    }
  }
  catch (error) {
    logger.error("Error during catalog seeding:", error);
  }
}

export async function seedDatabase() {
  await seedEmployees();
  // await seedPermissions();
  await seedRoles();
  await seedMachines();
  await seedServiceTechDailyForm();
  await seedPerformanceSheetVersions();
  await seedCatalog();

  logger.info("All seeding completed successfully");
}

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
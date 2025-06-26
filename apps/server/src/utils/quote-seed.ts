import { prisma } from "./prisma";
import { logger } from "./logger";

export const sampleProductClasses = [
  {
    code: "CNC_MILL",
    name: "CNC Milling Machine",
    description: "High-precision CNC milling machines for metal fabrication",
    parentId: null,
    depth: 0,
    isActive: true,
  },
  {
    code: "CNC_LATHE",
    name: "CNC Lathe",
    description: "Computer numerical control lathes for turning operations",
    parentId: null,
    depth: 0,
    isActive: true,
  },
  {
    code: "LASER_CUTTER",
    name: "Laser Cutting System",
    description: "Fiber laser cutting machines for sheet metal",
    parentId: null,
    depth: 0,
    isActive: true,
  },
  {
    code: "CNC_MILL_PRO",
    name: "CNC Milling Machine - Professional",
    description: "Advanced CNC milling with enhanced features",
    parentId: "CNC_MILL",
    depth: 1,
    isActive: true,
  },
  {
    code: "CNC_MILL_ENTRY",
    name: "CNC Milling Machine - Entry Level",
    description: "Basic CNC milling for small shops",
    parentId: "CNC_MILL",
    depth: 1,
    isActive: true,
  },
  {
    code: "CNC_LATHE_PRO",
    name: "CNC Lathe - Professional",
    description: "High-end CNC lathe with advanced features",
    parentId: "CNC_LATHE",
    depth: 1,
    isActive: true,
  },
  {
    code: "CNC_MILL_PRO_5AXIS",
    name: "5-Axis CNC Milling - Professional",
    description: "5-axis professional milling with advanced automation",
    parentId: "CNC_MILL_PRO",
    depth: 2,
    isActive: true,
  },
];

export const sampleOptionCategories = [
  {
    name: "Control System",
    description: "Machine control and automation options",
    isRequired: true,
    allowMultiple: false,
    displayOrder: 1,
    isActive: true,
  },
  {
    name: "Spindle Options",
    description: "Spindle configuration and power options",
    isRequired: true,
    allowMultiple: false,
    displayOrder: 2,
    isActive: true,
  },
  {
    name: "Tooling Package",
    description: "Tool holders and cutting tools",
    isRequired: false,
    allowMultiple: true,
    displayOrder: 3,
    isActive: true,
  },
  {
    name: "Safety Features",
    description: "Safety systems and protective equipment",
    isRequired: false,
    allowMultiple: true,
    displayOrder: 4,
    isActive: true,
  },
];

export const sampleOptions = [
  {
    name: "Fanuc Control",
    code: "FANUC_CNC",
    description: "Industry standard Fanuc CNC control system",
    price: 15000.0,
    displayOrder: 1,
    isDefault: true,
    isActive: true,
    categoryName: "Control System",
  },
  {
    name: "Siemens Control",
    code: "SIEMENS_CNC",
    description: "Advanced Siemens CNC control with touch interface",
    price: 25000.0,
    displayOrder: 2,
    isDefault: false,
    isActive: true,
    categoryName: "Control System",
  },
  {
    name: "10HP Spindle",
    code: "SPINDLE_10HP",
    description: "10 horsepower spindle motor",
    price: 8000.0,
    displayOrder: 1,
    isDefault: true,
    isActive: true,
    categoryName: "Spindle Options",
  },
  {
    name: "20HP Spindle",
    code: "SPINDLE_20HP",
    description: "20 horsepower high-performance spindle",
    price: 15000.0,
    displayOrder: 2,
    isDefault: false,
    isActive: true,
    categoryName: "Spindle Options",
  },
  {
    name: "Basic Tool Package",
    code: "TOOLS_BASIC",
    description: "Essential cutting tools and holders",
    price: 3000.0,
    displayOrder: 1,
    isDefault: true,
    isActive: true,
    categoryName: "Tooling Package",
  },
  {
    name: "Premium Tool Package",
    code: "TOOLS_PREMIUM",
    description: "Complete tooling package with premium tools",
    price: 8000.0,
    displayOrder: 2,
    isDefault: false,
    isActive: true,
    categoryName: "Tooling Package",
  },
  {
    name: "Safety Enclosure",
    code: "SAFETY_ENCLOSURE",
    description: "Full safety enclosure with interlock system",
    price: 5000.0,
    displayOrder: 1,
    isDefault: false,
    isActive: true,
    categoryName: "Safety Features",
  },
  {
    name: "Emergency Stop System",
    code: "E_STOP_SYSTEM",
    description: "Emergency stop system with multiple stations",
    price: 2000.0,
    displayOrder: 2,
    isDefault: true,
    isActive: true,
    categoryName: "Safety Features",
  },
];

export const sampleOptionRules = [
  {
    ruleType: "REQUIRES",
    triggerOptionCode: "SIEMENS_CNC",
    targetOptionCode: "SAFETY_ENCLOSURE",
  },
  {
    ruleType: "EXCLUDES",
    triggerOptionCode: "FANUC_CNC",
    targetOptionCode: "SIEMENS_CNC",
  },
];

export const sampleConfigurations = [
  {
    name: "Standard CNC Mill",
    description: "Standard CNC milling machine configuration",
    isTemplate: true,
    isActive: true,
    productClassCode: "CNC_MILL",
    selectedOptionCodes: [
      "FANUC_CNC",
      "SPINDLE_10HP",
      "TOOLS_BASIC",
      "E_STOP_SYSTEM",
    ],
  },
  {
    name: "Professional CNC Mill",
    description: "Professional CNC milling machine configuration",
    isTemplate: true,
    isActive: true,
    productClassCode: "CNC_MILL_PRO",
    selectedOptionCodes: [
      "SIEMENS_CNC",
      "SPINDLE_20HP",
      "TOOLS_PREMIUM",
      "SAFETY_ENCLOSURE",
    ],
  },
];

// Product Class -> Option Category mappings
export const productClassOptionCategories = [
  {
    productClassCode: "CNC_MILL",
    categoryNames: [
      "Control System",
      "Spindle Options",
      "Tooling Package",
      "Safety Features",
    ],
  },
  {
    productClassCode: "CNC_LATHE",
    categoryNames: [
      "Control System",
      "Spindle Options",
      "Tooling Package",
      "Safety Features",
    ],
  },
  {
    productClassCode: "LASER_CUTTER",
    categoryNames: ["Control System", "Safety Features"],
  },
  {
    productClassCode: "CNC_MILL_PRO",
    categoryNames: [
      "Control System",
      "Spindle Options",
      "Tooling Package",
      "Safety Features",
    ],
  },
  {
    productClassCode: "CNC_MILL_ENTRY",
    categoryNames: ["Control System", "Spindle Options", "Tooling Package"],
  },
  {
    productClassCode: "CNC_LATHE_PRO",
    categoryNames: [
      "Control System",
      "Spindle Options",
      "Tooling Package",
      "Safety Features",
    ],
  },
  {
    productClassCode: "CNC_MILL_PRO_5AXIS",
    categoryNames: [
      "Control System",
      "Spindle Options",
      "Tooling Package",
      "Safety Features",
    ],
  },
];

const seedQuoteData = async () => {
  try {
    // Seed product classes in order (parents first)
    const createdProductClasses = new Map();

    for (const productClass of sampleProductClasses) {
      const existing = await prisma.productClass.findUnique({
        where: { code: productClass.code },
      });

      if (!existing) {
        // If this has a parent, get the actual parent ID
        let parentId = null;
        if (productClass.parentId) {
          const parent = await prisma.productClass.findUnique({
            where: { code: productClass.parentId },
          });
          parentId = parent?.id || null;
        }

        const created = await prisma.productClass.create({
          data: { ...productClass, parentId },
        });
        createdProductClasses.set(productClass.code, created.id);
        logger.info(`Product class ${productClass.code} created`);
      } else {
        createdProductClasses.set(productClass.code, existing.id);
      }
    }

    // Seed option categories
    const createdCategories = new Map();
    for (const category of sampleOptionCategories) {
      const existing = await prisma.optionCategory.findFirst({
        where: { name: category.name },
      });

      if (!existing) {
        const created = await prisma.optionCategory.create({ data: category });
        createdCategories.set(category.name, created.id);
        logger.info(`Option category ${category.name} created`);
      } else {
        createdCategories.set(category.name, existing.id);
      }
    }

    // Create ProductClassOptionCategory relationships
    for (const mapping of productClassOptionCategories) {
      const productClass = await prisma.productClass.findUnique({
        where: { code: mapping.productClassCode },
      });

      if (productClass) {
        for (const categoryName of mapping.categoryNames) {
          const category = await prisma.optionCategory.findFirst({
            where: { name: categoryName },
          });

          if (category) {
            const existing = await prisma.productClassOptionCategory.findUnique(
              {
                where: {
                  productClassId_optionCategoryId: {
                    productClassId: productClass.id,
                    optionCategoryId: category.id,
                  },
                },
              }
            );

            if (!existing) {
              await prisma.productClassOptionCategory.create({
                data: {
                  productClassId: productClass.id,
                  optionCategoryId: category.id,
                },
              });
              logger.info(
                `ProductClassOptionCategory ${mapping.productClassCode} -> ${categoryName} created`
              );
            }
          }
        }
      }
    }

    // Seed options
    const createdOptions = new Map();
    for (const option of sampleOptions) {
      const existing = await prisma.option.findFirst({
        where: { code: option.code },
      });

      if (!existing) {
        const category = await prisma.optionCategory.findFirst({
          where: { name: option.categoryName },
        });

        if (category) {
          const { categoryName, ...optionData } = option;
          const created = await prisma.option.create({
            data: { ...optionData, categoryId: category.id },
          });
          createdOptions.set(option.code, created.id);
          logger.info(`Option ${option.code} created`);
        }
      } else {
        createdOptions.set(option.code, existing.id);
      }
    }

    // Seed option rules
    for (const rule of sampleOptionRules) {
      const triggerOption = await prisma.option.findFirst({
        where: { code: rule.triggerOptionCode },
      });
      const targetOption = await prisma.option.findFirst({
        where: { code: rule.targetOptionCode },
      });

      if (triggerOption && targetOption) {
        const existing = await prisma.optionRule.findFirst({
          where: {
            triggerOptionId: triggerOption.id,
            targetOptionId: targetOption.id,
          },
        });

        if (!existing) {
          await prisma.optionRule.create({
            data: {
              ruleType: rule.ruleType,
              triggerOptionId: triggerOption.id,
              targetOptionId: targetOption.id,
            },
          });
          logger.info(
            `Option rule ${rule.triggerOptionCode} -> ${rule.targetOptionCode} created`
          );
        }
      }
    }

    // Seed configurations
    for (const config of sampleConfigurations) {
      const productClass = await prisma.productClass.findUnique({
        where: { code: config.productClassCode },
      });

      if (productClass) {
        const existing = await prisma.configuration.findFirst({
          where: {
            name: config.name,
            productClassId: productClass.id,
          },
        });

        if (!existing) {
          const created = await prisma.configuration.create({
            data: {
              name: config.name,
              description: config.description,
              isTemplate: config.isTemplate,
              isActive: config.isActive,
              productClassId: productClass.id,
            },
          });

          // Add selected options to configuration
          for (const optionCode of config.selectedOptionCodes) {
            const option = await prisma.option.findFirst({
              where: { code: optionCode },
            });

            if (option) {
              await prisma.configurationOption.create({
                data: {
                  configurationId: created.id,
                  optionId: option.id,
                },
              });
            }
          }

          logger.info(`Configuration ${config.name} created`);
        }
      }
    }
  } catch (error) {
    logger.error("Error during quote data seeding:", error);
  }
};

seedQuoteData();

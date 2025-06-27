import { prisma } from "@/utils/prisma";

export class ConfigBuilderService {
  async getProductClasses() {
    const productClasses = await prisma.productClass.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        depth: "asc",
      },
    });

    return productClasses;
  }

  async getOptionCategoriesByProductClass(productClassId: string) {
    const productClassCategories =
      await prisma.productClassOptionCategory.findMany({
        where: {
          productClassId,
        },
        include: {
          optionCategory: true,
        },
        orderBy: {
          displayOrder: "asc",
        },
      });

    return productClassCategories.map((pcc) => ({
      ...pcc.optionCategory,
      displayOrder: pcc.displayOrder,
      isRequired: pcc.isRequired,
    }));
  }

  async getOptionsByOptionCategory(
    optionCategoryId: string,
    productClassId?: string
  ) {
    const optionHeaders = await prisma.optionHeader.findMany({
      where: {
        categoryId: optionCategoryId,
      },
      include: {
        optionDetails: productClassId
          ? {
              where: {
                productClassId,
                isActive: true,
              },
            }
          : true,
      },
    });

    // If productClassId provided, only return options available for that product class
    if (productClassId) {
      return optionHeaders
        .filter((oh) => oh.optionDetails.length > 0)
        .map((oh) => ({
          ...oh,
          price: oh.optionDetails[0].price,
          displayOrder: oh.optionDetails[0].displayOrder,
          isDefault: oh.optionDetails[0].isDefault,
          optionDetails: undefined, // Remove raw details from response
        }))
        .sort((a, b) => a.displayOrder - b.displayOrder);
    }

    return optionHeaders;
  }

  async getOptionsByProductClass(productClassId: string) {
    const optionDetails = await prisma.optionDetails.findMany({
      where: {
        productClassId,
        isActive: true,
      },
      include: {
        optionHeader: {
          include: {
            category: true,
          },
        },
      },
      orderBy: {
        displayOrder: "asc",
      },
    });

    return optionDetails.map((od) => ({
      id: od.optionHeader.id,
      code: od.optionHeader.code,
      name: od.optionHeader.name,
      description: od.optionHeader.description,
      categoryId: od.optionHeader.categoryId,
      categoryName: od.optionHeader.category.name,
      price: od.price,
      displayOrder: od.displayOrder,
      isDefault: od.isDefault,
      isActive: od.isActive,
    }));
  }

  async getOptionRules() {
    const optionRules = await prisma.optionRule.findMany({
      where: {
        isActive: true,
      },
      include: {
        targetOptions: {
          include: {
            option: true,
          },
        },
        triggerOptions: {
          include: {
            option: true,
          },
        },
      },
      orderBy: {
        priority: "desc",
      },
    });

    return optionRules.map((rule) => ({
      id: rule.id,
      name: rule.name,
      description: rule.description,
      action: rule.action,
      priority: rule.priority,
      condition: rule.condition,
      triggerOptions: rule.triggerOptions.map((triggerOption) => ({
        id: triggerOption.option.id,
        code: triggerOption.option.code,
        name: triggerOption.option.name,
        description: triggerOption.option.description,
      })),
      targetOptions: rule.targetOptions.map((targetOption) => ({
        id: targetOption.option.id,
        code: targetOption.option.code,
        name: targetOption.option.name,
        description: targetOption.option.description,
      })),
    }));
  }

  async getConfigurations(productClassId?: string) {
    const configurations = await prisma.configuration.findMany({
      where: {
        isActive: true,
        ...(productClassId && { productClassId }),
      },
      include: {
        productClass: true,
        selectedOptions: {
          include: {
            option: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    return configurations.map((config) => ({
      id: config.id,
      name: config.name,
      description: config.description,
      isTemplate: config.isTemplate,
      productClass: {
        id: config.productClass.id,
        code: config.productClass.code,
        name: config.productClass.name,
      },
      selectedOptions: config.selectedOptions.map((so) => ({
        id: so.option.id,
        code: so.option.code,
        name: so.option.name,
        categoryName: so.option.category.name,
      })),
    }));
  }

  // Helper method to get available options for a specific product class with category grouping
  async getAvailableOptionsGroupedByCategory(productClassId: string) {
    const categories =
      await this.getOptionCategoriesByProductClass(productClassId);

    const result = await Promise.all(
      categories.map(async (category) => {
        const options = await this.getOptionsByOptionCategory(
          category.id,
          productClassId
        );
        return {
          ...category,
          options,
        };
      })
    );

    return result;
  }

  // Helper method to validate a configuration against rules
  async validateConfiguration(selectedOptionIds: string[]) {
    const rules = await this.getOptionRules();
    const violations = [];

    for (const rule of rules) {
      const triggerSelected = rule.triggerOptions.some((trigger) =>
        selectedOptionIds.includes(trigger.id)
      );

      if (triggerSelected) {
        if (rule.action === "REQUIRE") {
          const requiredSelected = rule.targetOptions.every((target) =>
            selectedOptionIds.includes(target.id)
          );
          if (!requiredSelected) {
            violations.push({
              rule: rule.name,
              type: "MISSING_REQUIRED",
              message: `${rule.name}: Required options not selected`,
              targetOptions: rule.targetOptions,
            });
          }
        } else if (rule.action === "DISABLE") {
          const disabledSelected = rule.targetOptions.some((target) =>
            selectedOptionIds.includes(target.id)
          );
          if (disabledSelected) {
            violations.push({
              rule: rule.name,
              type: "DISABLED_SELECTED",
              message: `${rule.name}: Incompatible options selected`,
              targetOptions: rule.targetOptions,
            });
          }
        }
      }
    }

    return {
      isValid: violations.length === 0,
      violations,
    };
  }
}

import { prisma } from "@/utils/prisma";

export class ConfigService {
  async getProductClasses() {
    const productClasses = await prisma.productClass.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        depth: "asc",
      },
    });

    // Deduplicate by id
    return productClasses.filter(
      (pc, idx, arr) => arr.findIndex((p) => p.id === pc.id) === idx
    );
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

    const result = productClassCategories.map((pcc) => ({
      ...pcc.optionCategory,
      displayOrder: pcc.displayOrder,
      isRequired: pcc.isRequired,
    }));

    // Deduplicate by id
    return result.filter(
      (cat, idx, arr) => arr.findIndex((c) => c.id === cat.id) === idx
    );
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
      const result = optionHeaders
        .filter((oh) => oh.optionDetails.length > 0)
        .map((oh) => ({
          ...oh,
          price: oh.optionDetails[0].price,
          displayOrder: oh.optionDetails[0].displayOrder,
          isDefault: oh.optionDetails[0].isDefault,
          optionDetails: undefined, // Remove raw details from response
        }))
        .sort((a, b) => a.displayOrder - b.displayOrder);

      // Deduplicate by id
      return result.filter(
        (opt, idx, arr) => arr.findIndex((o) => o.id === opt.id) === idx
      );
    }

    // Deduplicate by id
    return optionHeaders.filter(
      (oh, idx, arr) => arr.findIndex((o) => o.id === oh.id) === idx
    );
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

    const result = optionDetails.map((od) => ({
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

    // Deduplicate by id
    return result.filter(
      (opt, idx, arr) => arr.findIndex((o) => o.id === opt.id) === idx
    );
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

    const result = optionRules.map((rule) => ({
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

    // Deduplicate rules by id and deduplicate options within each rule
    return result
      .map((rule) => ({
        ...rule,
        triggerOptions: rule.triggerOptions.filter(
          (opt, idx, arr) => arr.findIndex((o) => o.id === opt.id) === idx
        ),
        targetOptions: rule.targetOptions.filter(
          (opt, idx, arr) => arr.findIndex((o) => o.id === opt.id) === idx
        ),
      }))
      .filter(
        (rule, idx, arr) => arr.findIndex((r) => r.id === rule.id) === idx
      );
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

    const result = configurations.map((config) => ({
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

    // Deduplicate configurations by id and deduplicate options within each config
    return result
      .map((config) => ({
        ...config,
        selectedOptions: config.selectedOptions.filter(
          (opt, idx, arr) => arr.findIndex((o) => o.id === opt.id) === idx
        ),
      }))
      .filter(
        (config, idx, arr) => arr.findIndex((c) => c.id === config.id) === idx
      );
  }

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

    // Deduplicate categories and options within each category
    return result
      .map((category) => ({
        ...category,
        options: category.options.filter(
          (opt, idx, arr) => arr.findIndex((o) => o.id === opt.id) === idx
        ),
      }))
      .filter(
        (category, idx, arr) =>
          arr.findIndex((c) => c.id === category.id) === idx
      );
  }

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

  async saveConfiguration(configuration: any) {
    const newConfiguration = await prisma.configuration.create({
      data: {
        name: configuration.name,
        description: configuration.description,
        isTemplate: configuration.isTemplate,
        productClassId: configuration.productClassId,
        isActive: true,
        productClass: {
          connect: {
            id: configuration.productClassId,
          },
        },
      },
    });

    for (const option of configuration.selectedOptions) {
      await prisma.configurationOption.create({
        data: {
          configurationId: newConfiguration.id,
          optionId: option.optionId,
        },
      });
    }
  }

  async configurationExists(configuration: any) {
    let exists = true;
    for (const option of configuration.selectedOptions) {
      const existingOption = await prisma.configurationOption.findFirst({
        where: {
          configurationId: configuration.id,
          optionId: option.optionId,
        },
      });

      if (!existingOption) {
        exists = false;
        break;
      }
    }

    return exists;
  }
}

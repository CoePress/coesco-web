import { prisma } from "@/utils/prisma";

export class ConfigBuilderService {
  async getProductClasses() {
    const productClasses = await prisma.productClass.findMany({
      where: {
        isActive: true,
      },
    });

    return productClasses;
  }

  async getOptionCategoriesByProductClass(productClassId: string) {
    const optionCategories = await prisma.optionCategory.findMany({
      where: {
        productClassOptionCategories: { some: { productClassId } },
      },
    });

    return optionCategories;
  }

  async getOptionsByOptionCategory(optionCategoryId: string) {
    const options = await prisma.option.findMany({
      where: { categoryId: optionCategoryId, isActive: true },
    });

    return options;
  }

  async getOptionsByProductClass(productClassId: string) {
    const optionCategories = await prisma.optionCategory.findMany({
      where: {
        productClassOptionCategories: { some: { productClassId } },
        isActive: true,
      },
      include: {
        options: {
          where: {
            isActive: true,
          },
          orderBy: { displayOrder: "asc" },
        },
      },
      orderBy: { displayOrder: "asc" },
    });

    return optionCategories;
  }
}

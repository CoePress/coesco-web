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

  async getOptionsByProductClass(productClassId: string) {
    const options = await prisma.option.findMany({
      where: {
        category: {
          productClassOptionCategories: {
            some: {
              productClassId: productClassId,
            },
          },
        },
        isActive: true,
      },
      include: {
        category: true,
      },
      orderBy: [{ category: { displayOrder: "asc" } }, { displayOrder: "asc" }],
    });

    return options;
  }

  async getOptionsByProductClassAndCategory(
    productClassId: string,
    categoryId: string
  ) {
    const options = await prisma.option.findMany({
      where: {
        categoryId: categoryId,
        category: {
          productClassOptionCategories: {
            some: {
              productClassId: productClassId,
            },
          },
        },
        isActive: true,
      },
      include: {
        category: true,
      },
      orderBy: { displayOrder: "asc" },
    });

    return options;
  }
}

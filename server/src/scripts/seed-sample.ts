import { __dev__ } from "@/config/config";
import { logger } from "@/utils/logger";
import { prisma } from "@/utils/prisma";

const sampleCompanies = [];

const sampleJourneys = [];

const sampleQuotes = [];

// Catalog
const sampleProductClasses = [
  {
    code: "foo",
    name: "Foo",
    description: "Foo product line",
    parentCode: null,
    depth: 0,
  },
  {
    code: "foo-basic",
    name: "Foo Basic",
    description: "Basic variant of Foo",
    parentCode: "foo",
    depth: 1,
  },
  {
    code: "foo-basic-12",
    name: "Foo Basic 12",
    description: "Foo Basic 12-inch model",
    parentCode: "foo-basic",
    depth: 2,
  },
  {
    code: "foo-basic-24",
    name: "Foo Basic 24",
    description: "Foo Basic 24-inch model",
    parentCode: "foo-basic",
    depth: 2,
  },
  {
    code: "foo-supreme",
    name: "Foo Supreme",
    description: "Premium variant of Foo",
    parentCode: "foo",
    depth: 1,
  },
  {
    code: "foo-supreme-12",
    name: "Foo Supreme 12",
    description: "Foo Supreme 12-inch model",
    parentCode: "foo-supreme",
    depth: 2,
  },
  {
    code: "foo-supreme-24",
    name: "Foo Supreme 24",
    description: "Foo Supreme 24-inch model",
    parentCode: "foo-supreme",
    depth: 2,
  },
];

const sampleItems = [
  {
    name: "Item 1",
    description: "Item 1 description",
    unitPrice: 100,
  },
  {
    name: "Item 2",
    description: "Item 2 description",
    unitPrice: 200,
  },
  {
    name: "Item 3",
    description: "Item 3 description",
    unitPrice: 300,
  },
  {
    name: "Item 4",
    description: "Item 4 description",
    unitPrice: 400,
  },
  {
    name: "Item 5",
    description: "Item 5 description",
    unitPrice: 500,
  },
];

const sampleConfigurations = [{}];

const seedSample = async () => {
  if (!__dev__) {
    return;
  }

  for (const productClass of sampleProductClasses) {
    logger.info(`Seeding product class ${productClass.code}`);
    const exists = await prisma.productClass.findUnique({
      where: {
        code: productClass.code,
      },
    });

    if (exists) {
      logger.info(`Product class ${productClass.code} already exists`);
      continue;
    }

    const parent = await prisma.productClass.findUnique({
      where: {
        code: productClass.parentCode ?? undefined,
      },
    });

    if (parent) {
      await prisma.productClass.create({
        data: {
          ...productClass,
          parentId: parent.id,
        },
      });
    } else {
      logger.error(`Parent product class ${productClass.parentCode} not found`);
    }
  }

  for (const item of sampleItems) {
    logger.info(`Seeding item ${item.name}`);
    const exists = await prisma.item.findFirst({
      where: {
        name: item.name ?? undefined,
      },
    });

    if (exists) {
      logger.info(`Item ${item.name} already exists`);
      continue;
    }

    await prisma.item.create({
      data: {
        ...item,
        createdById: "system",
      },
    });
  }

  for (const configuration of sampleConfigurations) {
  }
};

seedSample().catch((error) => {
  logger.error("Fatal error during sample seeding:", error);
  process.exit(1);
});

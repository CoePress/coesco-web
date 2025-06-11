import { __dev__ } from "@/config/config";
import { employeeService, machineService } from "@/services";
import { logger } from "@/utils/logger";
import { prisma } from "@/utils/prisma";
import {
  MachineConnectionType,
  MachineControllerType,
  MachineType,
} from "@prisma/client";

// Production seed data
const machines = [
  {
    slug: "mazak-200",
    name: "Mazak 200",
    type: MachineType.LATHE,
    controllerType: MachineControllerType.MAZAK,
    connectionType: MachineConnectionType.MTCONNECT,
    connectionHost: "192.231.64.83",
    connectionPort: 5000,
  },
  {
    slug: "mazak-350",
    name: "Mazak 350",
    type: MachineType.LATHE,
    controllerType: MachineControllerType.MAZAK,
    connectionType: MachineConnectionType.MTCONNECT,
    connectionHost: "192.231.64.53",
    connectionPort: 5000,
  },
  {
    slug: "mazak-450",
    name: "Mazak 450",
    type: MachineType.LATHE,
    controllerType: MachineControllerType.MAZAK,
    connectionType: MachineConnectionType.MTCONNECT,
    connectionHost: "192.231.64.45",
    connectionPort: 5000,
  },
  {
    slug: "doosan",
    name: "Doosan 3100LS",
    type: MachineType.LATHE,
    controllerType: MachineControllerType.FANUC,
    connectionType: MachineConnectionType.FOCAS,
    connectionHost: "192.231.64.127",
    connectionPort: 8193,
  },
  {
    slug: "kuraki",
    name: "Kuraki Boring Mill",
    type: MachineType.MILL,
    controllerType: MachineControllerType.FANUC,
    connectionType: MachineConnectionType.FOCAS,
    connectionHost: "x.x.x.x",
    connectionPort: 8193,
  },
  {
    slug: "okk",
    name: "OKK",
    type: MachineType.MILL,
    controllerType: MachineControllerType.FANUC,
    connectionType: MachineConnectionType.FOCAS,
    connectionHost: "192.231.64.203",
    connectionPort: 8193,
  },
  {
    slug: "niigata-hn80",
    name: "Niigata HN80",
    type: MachineType.MILL,
    controllerType: MachineControllerType.FANUC,
    connectionType: MachineConnectionType.FOCAS,
    connectionHost: "192.231.64.202",
    connectionPort: 8193,
  },
  {
    slug: "niigata-spn63",
    name: "Niigata SPN63",
    type: MachineType.MILL,
    controllerType: MachineControllerType.FANUC,
    connectionType: MachineConnectionType.FOCAS,
    connectionHost: "192.231.64.201",
    connectionPort: 8193,
  },
];

// Catalog
const sampleProductClasses = [
  {
    code: "foo",
    name: "Foo",
    description: "Foo product line",
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

const seed = async () => {
  try {
    await employeeService.sync();

    // Seed production data
    for (const machine of machines) {
      try {
        const m = await machineService.create(machine);

        if (!m.success || !m.data) {
          throw new Error("Failed to create machine");
        }

        logger.info(`Machine ${m.data.slug} created`);
      } catch (error) {
        logger.error(`Error creating machine ${machine.slug}: ${error}`);
      }
    }

    // Seed development data if in dev mode
    if (__dev__) {
      // Sort product classes by depth to ensure parents are created first
      const sortedProductClasses = [...sampleProductClasses].sort(
        (a, b) => a.depth - b.depth
      );

      for (const productClass of sortedProductClasses) {
        logger.info(`Seeding product class ${productClass.code}`);
        const exists = await prisma.productClass.findFirst({
          where: {
            code: productClass.code,
          },
        });

        if (exists) {
          logger.info(`Product class ${productClass.code} already exists`);
          continue;
        }

        if (productClass.parentCode) {
          const parent = await prisma.productClass.findFirst({
            where: {
              code: productClass.parentCode,
            },
          });

          if (parent) {
            await prisma.productClass.create({
              data: {
                code: productClass.code,
                name: productClass.name,
                description: productClass.description,
                depth: productClass.depth,
                parentId: parent.id,
              },
            });
          } else {
            logger.error(
              `Parent product class ${productClass.parentCode} not found`
            );
          }
        } else {
          await prisma.productClass.create({
            data: productClass,
          });
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
    }
  } catch (error) {
    logger.error("Error during seeding:", error);
  } finally {
    process.exit(0);
  }
};

seed().catch((error) => {
  logger.error("Fatal error during seeding:", error);
  process.exit(1);
});

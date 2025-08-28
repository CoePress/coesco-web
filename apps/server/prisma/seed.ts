/* eslint-disable node/prefer-global/process */
import { MachineControllerType, MachineType } from "@prisma/client";

import { microsoftService } from "@/services";
import { logger } from "@/utils/logger";
import { prisma } from "@/utils/prisma";

// contextStorage.enterWith(SYSTEM_CONTEXT);

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
        logger.info(`Machine ${machine.slug} created`);
      }
    }
  }
  catch (error) {
    logger.error("Error during machine seeding:", error);
  }
}

async function seed() {
  await microsoftService.sync();
  await seedMachines();

  logger.info("All seeding completed successfully");
  process.exit(0);
}

seed().catch((error) => {
  logger.error("Fatal error during seeding:", error);
  process.exit(1);
});

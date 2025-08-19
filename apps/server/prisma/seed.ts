/* eslint-disable node/prefer-global/process */
import { MachineConnectionType, MachineControllerType, MachineType } from "@prisma/client";

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

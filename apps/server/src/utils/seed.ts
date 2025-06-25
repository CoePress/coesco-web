import { __dev__ } from "@/config/config";
import { machineService } from "@/services";
import { logger } from "@/utils/logger";
import {
  MachineConnectionType,
  MachineControllerType,
  MachineType,
} from "@prisma/client";

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

const seed = async () => {
  try {
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

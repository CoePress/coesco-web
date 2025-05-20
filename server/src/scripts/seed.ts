import { employeeService, machineService } from "@/services";
import { initializeModels } from "@/models";
import { sequelize } from "@/config/database";
import { logger } from "@/utils/logger";
import { ICreateMachineDto } from "@/types/schema.types";
import {
  MachineConnectionType,
  MachineControllerType,
  MachineType,
} from "@/types/enum.types";

const seedMachines: ICreateMachineDto[] = [
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
    connectionType: MachineConnectionType.CUSTOM,
    connectionHost: "192.231.64.127",
    connectionPort: 8193,
  },
  {
    slug: "kuraki",
    name: "Kuraki Boring Mill",
    type: MachineType.MILL,
    controllerType: MachineControllerType.FANUC,
    connectionType: MachineConnectionType.CUSTOM,
    connectionHost: "x.x.x.x",
    connectionPort: 8193,
  },
  {
    slug: "okk",
    name: "OKK",
    type: MachineType.MILL,
    controllerType: MachineControllerType.FANUC,
    connectionType: MachineConnectionType.CUSTOM,
    connectionHost: "192.231.64.203",
    connectionPort: 8193,
  },
  {
    slug: "niigata-hn80",
    name: "Niigata HN80",
    type: MachineType.MILL,
    controllerType: MachineControllerType.FANUC,
    connectionType: MachineConnectionType.CUSTOM,
    connectionHost: "192.231.64.202",
    connectionPort: 8193,
  },
  {
    slug: "niigata-spn63",
    name: "Niigata SPN63",
    type: MachineType.MILL,
    controllerType: MachineControllerType.FANUC,
    connectionType: MachineConnectionType.CUSTOM,
    connectionHost: "192.231.64.201",
    connectionPort: 8193,
  },
];

const seed = async () => {
  try {
    await initializeModels(sequelize);
    await sequelize.sync();

    await employeeService.syncEmployees();

    for (const machine of seedMachines) {
      try {
        const m = await machineService.createMachine(machine);
        logger.info(`Machine ${m.slug} created`);
      } catch (error) {
        logger.error(`Error creating machine ${machine.slug}: ${error}`);
      }
    }
  } catch (error) {
    logger.error("Error during seeding:", error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
};

seed().catch((error) => {
  logger.error("Fatal error during seeding:", error);
  process.exit(1);
});

import Services from "./index";
import { hasThisChanged } from "@/utils";
import { IDataCollectorService } from "@/utils/types";

class DataCollectorService implements IDataCollectorService {
  private readonly POLLING_INTERVAL = 1000;
  private interval: NodeJS.Timeout | null = null;

  constructor(private services: Services) {}

  startBroadcastingMachineStates(): void {
    const sendSampleData = async () => {
      const machines = await this.services.machineService.getMachines();
      const data = machines.map((machine: any) => ({
        machineId: machine.id,
        machineName: machine.name,
        currentState: this.getRandomState(),
        currentProgram: this.getRandomProgramName(),
        estimatedCompletion: this.getRandomEstimatedCompletion(),
        spindleLoad: this.getRandomSpindleLoad(),
      }));
      this.services.socketService.broadcastMachineStates(data);
    };

    sendSampleData();

    if (!this.interval) {
      this.interval = setInterval(sendSampleData, this.POLLING_INTERVAL);
    }
  }

  private getRandomState(): string {
    const states = ["OFFLINE", "IDLE", "ACTIVE", "ALARM"];
    return states[Math.floor(Math.random() * states.length)];
  }

  private getRandomProgramName(): string {
    const programs = ["Program 1", "Program 2", "Program 3", "Program 4"];
    return programs[Math.floor(Math.random() * programs.length)];
  }

  private getRandomEstimatedCompletion(): string {
    const completion = ["10m", "20m", "30m", "40m"];
    return completion[Math.floor(Math.random() * completion.length)];
  }

  private getRandomSpindleLoad(): number {
    return Math.floor(Math.random() * 100);
  }

  async pollMazakData(machineId: string) {
    const machine = await this.services.machineService.getMachine(machineId);
    if (!machine) {
      throw new Error("Machine not found");
    }

    const machineConnection =
      await this.services.connectionService.getConnectionByMachineId(machineId);

    if (!machineConnection) {
      throw new Error("Machine connection not found");
    }

    const url = `${machineConnection.host}:${machineConnection.port}${machineConnection.path}`;

    const response = await fetch(url);
    const data = await response.text();

    await this.processMazakData(data);
  }

  async pollAllMazakData() {
    const machines = await this.services.machineService.getMachines();
    const mazakMachines = machines.filter(
      (machine) => machine.controller === "MAZAK"
    );
    for (const machine of mazakMachines) {
      await this.pollMazakData(machine.id);
    }
  }

  async processMazakData(data: any) {
    // format the data

    // process the data
    return this.processData(data);
  }

  async processFanucData(data: any) {
    // format the data

    // process the data
    return this.processData(data);
  }

  async processData(data: any) {
    // fetch cached data from redis
    const cachedData = await this.services.redisService.get(data.machineId);

    // determine if the data has changed
    const hasChanged = await hasThisChanged(data, cachedData);

    // if it has, update the cached data & saved to database
    if (hasChanged) {
      await this.services.redisService.set(data.machineId, data);
      await this.services.stateService.createState(data);
    } else {
      return cachedData;
    }

    return data;
  }
}

export default DataCollectorService;

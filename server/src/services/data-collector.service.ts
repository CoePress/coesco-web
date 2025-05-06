import { IDataCollectorService } from "@/utils/types";
import Services from "./index";

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
      console.log("Starting machine state broadcasting");
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

  async processMTConnectData(
    machineId: string,
    xmlData: string
  ): Promise<void> {}

  async processFanucData(machineId: string, data: any): Promise<void> {}
}

export default DataCollectorService;

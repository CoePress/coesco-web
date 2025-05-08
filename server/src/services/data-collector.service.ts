import Services from "./index";
import { hasThisChanged } from "@/utils";
import { IDataCollectorService, ICurrentState, IAxis } from "@/utils/types";
import { xml2json } from "xml-js";

class DataCollectorService implements IDataCollectorService {
  private readonly POLLING_INTERVAL = 1000;
  private readonly REQUEST_TIMEOUT = 2000;
  private readonly STATE_HISTORY_TTL = 300; // 5 minutes TTL for state history
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

  async pollMazakData(machineId: string): Promise<ICurrentState> {
    const machine = await this.services.machineService.getMachine(machineId);
    if (!machine) {
      throw new Error("Machine not found");
    }

    const machineConnection =
      await this.services.connectionService.getConnectionByMachineId(machineId);
    if (!machineConnection) {
      throw new Error("Machine connection not found");
    }

    const url = `http://${machineConnection.host}:${machineConnection.port}/current`;
    const data = await this.fetchMachineData(url);
    const newState = await this.processMazakData(data, machineId);

    // Get cached state from Redis
    const cachedState = await this.services.redisService.get(
      `machine:${machineId}:current_state`
    );

    // Check if state has changed
    const hasChanged = await hasThisChanged(newState, cachedState);

    if (hasChanged) {
      // Update Redis cache
      await this.services.redisService.set(
        `machine:${machineId}:current_state`,
        newState,
        this.STATE_HISTORY_TTL
      );

      // Save to database
      await this.services.stateService.createState({
        ...newState,
        startTime: new Date(),
        endTime: null,
      });
    }

    return newState;
  }

  private async fetchMachineData(url: string): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.REQUEST_TIMEOUT
    );

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
      const xml = await response.text();
      return this.parseXmlToJson(xml);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private parseXmlToJson(xml: string): any {
    return JSON.parse(xml2json(xml, { compact: true, spaces: 2 }));
  }

  async processMazakData(data: any, machineId: string): Promise<ICurrentState> {
    const machine = await this.services.machineService.getMachine(machineId);

    const streams = data.MTConnectStreams?.Streams?.DeviceStream;
    if (!streams) {
      return {
        machineId: machine.id,
        machineName: machine.name,
        state: "OFFLINE",
        controller: machine.controller,
        execution: "",
        program: "",
        tool: "",
        spindle: { speed: 0, load: 0 },
        axes: [],
      };
    }

    const path = this.findComponent(streams, "Path");
    if (!path) {
      return {
        machineId: machine.id,
        machineName: machine.name,
        state: "OFFLINE",
        controller: machine.controller,
        execution: "",
        program: "",
        tool: "",
        spindle: { speed: 0, load: 0 },
        axes: [],
      };
    }

    return {
      machineId,
      machineName: machine?.name || "",
      state: path.Events?.Execution?._text || "UNKNOWN",
      controller: "MAZAK",
      execution: path.Events?.Execution?._text || "",
      program: path.Events?.Program?._text || "",
      tool: path.Events?.ToolNumber?._text || "",
      spindle: {
        speed: parseFloat(path.Samples?.SpindleSpeed?._text) || 0,
        load: parseFloat(path.Samples?.SpindleLoad?._text) || 0,
      },
      axes: this.extractAxesData(streams),
    };
  }

  private extractAxesData(streams: any): IAxis[] {
    const axes: IAxis[] = [];
    const linear = this.findComponent(streams, "Linear");

    if (Array.isArray(linear)) {
      linear.forEach((axis) => {
        if (axis._attributes?.name) {
          axes.push({
            label: axis._attributes.name,
            position: parseFloat(axis.Samples?.Position?._text) || 0,
          });
        }
      });
    }

    return axes;
  }

  private findComponent(streams: any, type: string) {
    return Array.isArray(streams.ComponentStream)
      ? streams.ComponentStream.find((s) => s._attributes?.component === type)
      : streams.ComponentStream;
  }

  async pollAllMazakData(): Promise<void> {
    const machines = await this.services.machineService.getMachines();
    const mazakMachines = machines.filter(
      (machine) => machine.controller === "MAZAK"
    );

    const states = await Promise.all(
      mazakMachines.map((machine) => this.pollMazakData(machine.id))
    );

    // Broadcast updated states to all clients
    this.services.socketService.broadcastMachineStates(states);
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

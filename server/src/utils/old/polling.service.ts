import { Services } from ".";
import { error } from "@/utils/logger";
import { IMachineConnection } from "@/utils/types";
import { IMachine, IMachineState } from "@machining/types";
import { xml2json } from "xml-js";

type MachineStateWithoutId = Omit<IMachineState, "id">;

export class PollingService {
  private machines: Map<string, IMachine> = new Map();
  private connections: Map<string, IMachineConnection> = new Map();
  private pollInterval: NodeJS.Timeout | null = null;

  private readonly POLL_FREQUENCY = 1000;
  private readonly REQUEST_TIMEOUT = 2000;
  private readonly MOVEMENT_THRESHOLD = 0.001;
  private readonly FEED_THRESHOLD = 0.1;
  private readonly SPINDLE_THRESHOLD = 1;
  private readonly STATE_HISTORY_TTL = 10;

  constructor(private services: Services) {}

  async initialize() {
    try {
      await this.refreshMachines();
      await this.initializeStates();
      this.startPolling();
    } catch (err) {
      error(`Failed to initialize polling: ${err}`);
      setTimeout(() => this.initialize(), 1000);
    }
  }

  async refreshMachines() {
    try {
      const machines = await this.services.machine.getMachines();
      this.machines.clear();

      for (const machine of machines) {
        this.machines.set(machine.id, machine);
        const connections = await this.services.machine.getConnections(
          machine.id
        );
        connections.forEach((conn) => this.connections.set(conn.id, conn));
      }
    } catch (err) {
      error(`Failed to refresh machines: ${err}`);
    }
  }

  private async initializeStates() {
    for (const connection of Array.from(this.connections.values())) {
      const currentState = await this.services.machine.getCurrentMachineState(
        connection.machineId
      );
      if (!currentState || currentState.endedAt) {
        await this.services.machine.createMachineState(
          connection.machineId,
          this.createOfflineState(connection.machineId)
        );
      }
    }
  }

  private async pollMachine(
    connection: IMachineConnection
  ): Promise<MachineStateWithoutId> {
    try {
      const data = await this.fetchMachineData(connection);
      return await this.processMachineData(data, connection);
    } catch (err) {
      return this.createOfflineState(connection.machineId);
    }
  }

  private async fetchMachineData(connection: IMachineConnection): Promise<any> {
    const url = this.getMachineUrl(connection);
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

  private getMachineUrl(connection: IMachineConnection): string {
    const machine = this.machines.get(connection.machineId);
    return connection.protocol === "MTCONNECT"
      ? `http://${connection.host}:${connection.port}/current`
      : `http://${connection.host}:${connection.port}/${machine?.slug}`;
  }

  private parseXmlToJson(xml: string): any {
    return JSON.parse(xml2json(xml, { compact: true, spaces: 2 }));
  }

  private async processMachineData(
    data: any,
    connection: IMachineConnection
  ): Promise<MachineStateWithoutId> {
    return connection.protocol === "MTCONNECT"
      ? await this.processMTConnectData(data, connection.machineId)
      : await this.processFanucData(data, connection.machineId);
  }

  private async checkAxisActivity(streams: any): Promise<boolean> {
    const machineId = streams._attributes?.deviceUuid;
    const currentPositions = {};
    const currentLoads = {};

    ["X", "Y", "Z"].forEach((axis) => {
      const axisData = this.findComponent(streams, "Linear")?.find(
        (c: any) => c._attributes?.name === axis
      );
      if (axisData) {
        currentPositions[axis] =
          parseFloat(axisData.Samples?.Position?._text) || 0;
        currentLoads[axis] = parseFloat(axisData.Samples?.Load?._text) || 0;
      }
    });

    const previousKey = `machine:${machineId}:axis_state`;
    const previousState = await this.services.redis.get<{
      positions: Record<string, number>;
      loads: Record<string, number>;
    }>(previousKey);

    await this.services.redis.set(
      previousKey,
      { positions: currentPositions, loads: currentLoads },
      this.STATE_HISTORY_TTL
    );

    if (!previousState) return false;

    return ["X", "Y", "Z"].some((axis) => {
      const positionDelta = Math.abs(
        currentPositions[axis] - previousState.positions[axis]
      );
      const hasLoad = currentLoads[axis] > 5;
      return positionDelta > this.MOVEMENT_THRESHOLD || hasLoad;
    });
  }

  private async checkFeedActivity(streams: any): Promise<boolean> {
    const machineId = streams._attributes?.deviceUuid;
    const path = this.findComponent(streams, "Path");
    const currentFeed = parseFloat(path?.Samples?.PathFeedrate?._text) || 0;

    const previousKey = `machine:${machineId}:feed_state`;
    const previousFeed = await this.services.redis.get<{ feedrate: number }>(
      previousKey
    );

    await this.services.redis.set(
      previousKey,
      { feedrate: currentFeed },
      this.STATE_HISTORY_TTL
    );

    if (!previousFeed) return false;

    const feedDelta = Math.abs(currentFeed - previousFeed.feedrate);
    return feedDelta > this.FEED_THRESHOLD || currentFeed > 0;
  }

  private async checkSpindleActivity(streams: any): Promise<boolean> {
    const machineId = streams._attributes?.deviceUuid;
    const spindle = this.findComponent(streams, "Rotary");
    if (!spindle) return false;

    const currentSpeed =
      parseFloat(
        spindle.Samples?.SpindleSpeed?._text ||
          spindle.Samples?.RotaryVelocity?._text
      ) || 0;

    const previousKey = `machine:${machineId}:spindle_state`;
    const previousSpeed = await this.services.redis.get<{ speed: number }>(
      previousKey
    );

    await this.services.redis.set(
      previousKey,
      { speed: currentSpeed },
      this.STATE_HISTORY_TTL
    );

    if (!previousSpeed) return false;

    const speedDelta = Math.abs(currentSpeed - previousSpeed.speed);
    return speedDelta > this.SPINDLE_THRESHOLD || currentSpeed > 0;
  }

  private async checkFanucAxisActivity(machine: any): Promise<boolean> {
    const machineId = machine.id || machine._attributes?.deviceUuid;
    const currentPositions = {};
    const currentLoads = {};

    ["X", "Y", "Z"].forEach((axis) => {
      currentPositions[axis] = parseFloat(machine[`${axis}abs`]?._text) || 0;
      currentLoads[axis] = parseFloat(machine[`${axis}load`]?._text) || 0;
    });

    const previousKey = `machine:${machineId}:axis_state`;
    const previousState = await this.services.redis.get<{
      positions: Record<string, number>;
      loads: Record<string, number>;
    }>(previousKey);

    await this.services.redis.set(
      previousKey,
      { positions: currentPositions, loads: currentLoads },
      this.STATE_HISTORY_TTL
    );

    if (!previousState) return false;

    return ["X", "Y", "Z"].some((axis) => {
      const positionDelta = Math.abs(
        currentPositions[axis] - previousState.positions[axis]
      );
      const hasLoad = currentLoads[axis] > 5;
      return positionDelta > this.MOVEMENT_THRESHOLD || hasLoad;
    });
  }

  private createOfflineState(machineId: string): MachineStateWithoutId {
    return {
      machineId,
      state: "OFFLINE",
      controllerMode: "",
      executionStatus: "",
      isAxisActive: false,
      isFeedActive: false,
      isSpindleActive: false,
      startedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private async startPolling() {
    this.pollInterval = setInterval(async () => {
      const states = await Promise.all(
        Array.from(this.connections.values()).map(async (conn) => {
          const newState = await this.pollMachine(conn);
          const currentState =
            await this.services.machine.getCurrentMachineState(conn.machineId);

          await this.services.redis.set(
            `machine:${conn.machineId}:current_state`,
            newState,
            300 // 5 minute TTL
          );

          if (
            !currentState ||
            this.hasSignificantStateChange(currentState, newState)
          ) {
            return this.services.machine.createMachineState(
              conn.machineId,
              newState
            );
          }
          return currentState;
        })
      );

      this.services.socket.broadcastToClients("machine_states", states);
    }, this.POLL_FREQUENCY);
  }

  private hasSignificantStateChange(
    currentState: IMachineState,
    newState: MachineStateWithoutId
  ): boolean {
    const significantFields = [
      "state",
      "controllerMode",
      "executionStatus",
      "program",
      "tool",
    ];

    return significantFields.some(
      (field) => currentState[field] !== newState[field]
    );
  }

  public stop() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  private findComponent(streams: any, type: string) {
    return Array.isArray(streams.ComponentStream)
      ? streams.ComponentStream.find((s) => s._attributes?.component === type)
      : streams.ComponentStream;
  }
}

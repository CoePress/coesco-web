import MachineState from "@/models/machine-state";
import {
  IStateService,
  ICreateMachineStateDTO,
  IMachineState,
  ValidationError,
  IQueryParams,
  IStateOverview,
  StateWithDuration,
} from "@/utils/types";
import {
  buildOrderClause,
  buildPaginationOptions,
  buildWhereClause,
} from "@/utils";
import Services from ".";
import { Op } from "sequelize";

class StateService implements IStateService {
  constructor(private services: Services) {}

  async createState(state: ICreateMachineStateDTO): Promise<IMachineState> {
    if (!state.machineId) throw new ValidationError("Machine ID is required");
    if (!state.timestamp) throw new ValidationError("Timestamp is required");
    if (!state.state) throw new ValidationError("State is required");
    if (!state.execution) throw new ValidationError("Execution is required");
    if (!state.controller) throw new ValidationError("Controller is required");
    if (!state.program) throw new ValidationError("Program is required");
    if (!state.tool) throw new ValidationError("Tool is required");

    const machineState = await MachineState.create(state);
    return machineState;
  }

  async getStates(params?: IQueryParams): Promise<IMachineState[]> {
    const queryOptions: any = {};

    if (params?.sortBy) {
      queryOptions.order = [[params.sortBy, params?.sortOrder || "ASC"]];
    }

    if (params?.page && params?.limit) {
      queryOptions.offset = (params.page - 1) * params.limit;
      queryOptions.limit = params.limit;
    }

    if (params?.search) {
      queryOptions.where = {
        [Op.or]: [
          { name: { [Op.like]: `%${params.search}%` } },
          { description: { [Op.like]: `%${params.search}%` } },
        ],
      };
    }

    if (params?.startDate || params?.endDate) {
      queryOptions.where = queryOptions.where || {};
      queryOptions.where.timestamp = {};

      if (params.startDate) {
        queryOptions.where.timestamp[Op.gte] = params.startDate;
      }

      if (params.endDate) {
        queryOptions.where.timestamp[Op.lte] = params.endDate;
      }
    }

    const states = await MachineState.findAll(queryOptions);
    return states;
  }

  async getStatesByMachineId(
    machineId: string,
    params?: IQueryParams
  ): Promise<IMachineState[]> {
    const searchableFields = ["state", "name", "description"];

    const whereClause = buildWhereClause(params, searchableFields, {
      machineId,
    });

    const states = await MachineState.findAll({
      where: whereClause,
      order: buildOrderClause(params),
      ...buildPaginationOptions(params),
    });

    return states;
  }

  async getCurrentStates(): Promise<IMachineState[]> {
    return;
  }

  async getStatesByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<IMachineState[]> {
    return this.getStates({
      startDate,
      endDate,
      sortBy: "timestamp",
      sortOrder: "ASC",
    });
  }

  async getNextState(
    machineId: string,
    timestamp: Date
  ): Promise<IMachineState | null> {
    return await MachineState.findOne({
      where: {
        machineId,
        timestamp: { $gt: timestamp },
      },
      order: [["timestamp", "ASC"]],
    });
  }

  async getStateOverview(
    startDate: Date,
    endDate: Date
  ): Promise<IStateOverview> {
    if (startDate > endDate) {
      throw new ValidationError("Start date must be before end date");
    }

    // Convert to EST from UTC (ADD 4 hours to adjust timezone)
    const startDateEST = new Date(startDate.getTime() + 4 * 60 * 60 * 1000);
    const endDateEST = new Date(endDate.getTime() + 4 * 60 * 60 * 1000);

    // If a single day was requested, set end date to end of that day
    if (startDateEST.getTime() === endDateEST.getTime()) {
      // Set endDateEST to end of the day
      endDateEST.setTime(startDateEST.getTime() + 24 * 60 * 60 * 1000 - 1);
    } else {
      // If a range was requested, set end date to end of the day
      endDateEST.setTime(endDateEST.getTime() - 1);
    }

    // Convert back to UTC for processing (SUBTRACT 4 hours)
    // const startDateUTC = new Date(startDateEST.getTime() - 4 * 60 * 60 * 1000);
    // const endDateUTC = new Date(endDateEST.getTime() - 4 * 60 * 60 * 1000);

    const states = await this.getStatesByDateRange(startDateEST, endDateEST);

    // Group states by machineId and sort by timestamp
    const statesByMachine = {};

    for (const state of states) {
      if (!statesByMachine[state.machineId]) {
        statesByMachine[state.machineId] = [];
      }
      statesByMachine[state.machineId].push(state);
    }

    for (const machineId in statesByMachine) {
      statesByMachine[machineId].sort(
        (a: IMachineState, b: IMachineState) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    }

    // Flatten and calculate durations
    const processedStates: any[] = [];
    for (const machineId in statesByMachine) {
      const machineStates = statesByMachine[machineId];
      for (let i = 0; i < machineStates.length; i++) {
        const current = machineStates[i];
        const next = machineStates[i + 1];
        const end = next ? new Date(next.timestamp) : endDateEST;
        processedStates.push({
          ...current,
          durationMs:
            new Date(end).getTime() - new Date(current.timestamp).getTime(),
        });
      }
    }

    const statesWithDuration = this.calculateStateDurations(
      processedStates,
      endDateEST
    );

    const stateOverview = await this.buildStateOverview(
      statesWithDuration,
      startDateEST,
      endDateEST
    );

    return {
      kpis: stateOverview.kpis,
      utilization: stateOverview.utilization,
      states: stateOverview.states,
      machines: stateOverview.machines,
      alarms: stateOverview.alarms,
    };
  }

  async getStateTimeline(startDate: Date, endDate: Date): Promise<any[]> {
    if (startDate > endDate) {
      throw new ValidationError("Start date must be before end date");
    }

    const startDateEST = new Date(startDate.getTime() + 4 * 60 * 60 * 1000);
    let endDateEST = new Date(endDate.getTime() + 4 * 60 * 60 * 1000);

    if (startDateEST.getTime() === endDateEST.getTime()) {
      endDateEST.setTime(startDateEST.getTime() + 24 * 60 * 60 * 1000 - 1);
    } else {
      endDateEST.setTime(endDateEST.getTime() - 1);
    }

    // Cap at now (in EST)
    const now = new Date();
    const nowEST = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    if (endDateEST > nowEST) {
      endDateEST = nowEST;
    }

    const states = await this.getStatesByDateRange(startDateEST, endDateEST);

    // Get all machines
    const machines = await this.services.machineService.getMachines();

    // Group states by machineId
    const statesByMachine: { [machineId: string]: any[] } = {};
    for (const state of states) {
      if (!statesByMachine[state.machineId]) {
        statesByMachine[state.machineId] = [];
      }
      statesByMachine[state.machineId].push(state);
    }

    const timelines: {
      machineId: string;
      machineName: string;
      timeline: any[];
    }[] = [];

    for (const machine of machines) {
      const machineId = machine.id;
      const machineName = machine.name;
      const machineStates = (statesByMachine[machineId] || []).sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      const timeline: any[] = [];
      let cursor = new Date(startDateEST);

      if (machineStates.length === 0) {
        // No states at all: fill the whole range with OFFLINE (up to endDateEST)
        if (cursor < endDateEST) {
          timeline.push({
            state: "OFFLINE",
            timestamp: cursor.toISOString(),
            durationMs: endDateEST.getTime() - cursor.getTime(),
          });
        }
      } else {
        for (let i = 0; i < machineStates.length; i++) {
          const state = machineStates[i];
          const stateStart = new Date(state.timestamp);
          const nextStateTime =
            i < machineStates.length - 1
              ? new Date(machineStates[i + 1].timestamp)
              : new Date(endDateEST);

          // Fill gap before this state with OFFLINE
          if (stateStart > cursor) {
            const offlineEnd =
              stateStart < endDateEST ? stateStart : endDateEST;
            if (cursor < offlineEnd) {
              timeline.push({
                state: "OFFLINE",
                timestamp: cursor.toISOString(),
                durationMs: offlineEnd.getTime() - cursor.getTime(),
              });
            }
            cursor = new Date(offlineEnd);
          }

          // State duration is until next state or endDateEST, but not past endDateEST
          const stateEnd =
            nextStateTime < endDateEST ? nextStateTime : endDateEST;
          if (stateStart < stateEnd) {
            timeline.push({
              state: state.state,
              timestamp: state.timestamp,
              durationMs: stateEnd.getTime() - stateStart.getTime(),
            });
            cursor = new Date(stateEnd);
          }
        }

        // Fill gap after last state with OFFLINE (up to endDateEST)
        if (cursor < endDateEST) {
          timeline.push({
            state: "OFFLINE",
            timestamp: cursor.toISOString(),
            durationMs: endDateEST.getTime() - cursor.getTime(),
          });
        }
      }

      timelines.push({ machineId, machineName, timeline });
    }

    return timelines;
  }

  private calculateStateDurations(
    states: any[],
    endDate: Date
  ): StateWithDuration[] {
    const statesWithDuration: StateWithDuration[] = [];

    for (let i = 0; i < states.length; i++) {
      const currentState = states[i];
      const nextState = states[i + 1];
      const end = nextState ? new Date(nextState.timestamp) : endDate;
      const stateWithDuration: StateWithDuration = {
        ...currentState,
        durationMs:
          new Date(end).getTime() - new Date(currentState.timestamp).getTime(),
      };
      statesWithDuration.push(stateWithDuration);
    }

    return statesWithDuration;
  }

  private async buildStateOverview(
    states: any[],
    startDate: Date,
    endDate: Date
  ): Promise<IStateOverview> {
    // 1. Group by machineId and sort by timestamp
    const statesByMachine: { [machineId: string]: any[] } = {};
    for (const s of states) {
      const state =
        typeof (s as any).toJSON === "function" ? (s as any).toJSON() : s;
      if (!statesByMachine[state.machineId])
        statesByMachine[state.machineId] = [];
      statesByMachine[state.machineId].push(state);
    }
    for (const machineId in statesByMachine) {
      statesByMachine[machineId].sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    }

    // 2. Flatten and calculate durations
    const processedStates: any[] = [];
    for (const machineId in statesByMachine) {
      const machineStates = statesByMachine[machineId];
      for (let i = 0; i < machineStates.length; i++) {
        const current = machineStates[i];
        const next = machineStates[i + 1];
        const end = next ? new Date(next.timestamp) : endDate;
        processedStates.push({
          ...current,
          durationMs:
            new Date(end).getTime() - new Date(current.timestamp).getTime(),
        });
      }
    }

    // 3. Use processedStates for all further calculations
    let activeDuration = 0;
    let alertCount = 0;
    const stateDurations: Record<string, number> = {};
    const stateTypeCounts: Record<string, number> = {};

    console.log("Total states:", processedStates.length);

    for (const state of processedStates) {
      const duration = state.durationMs || 0;
      if (typeof state.state === "string") {
        stateDurations[state.state] =
          (stateDurations[state.state] || 0) + duration;
        stateTypeCounts[state.state] = (stateTypeCounts[state.state] || 0) + 1;
        if (state.state.toLowerCase() === "active") {
          activeDuration += duration;
        }
      }
    }

    console.log("State counts per type:", stateTypeCounts);

    const overviewDuration = endDate.getTime() - startDate.getTime() + 1;
    const utilizationValue =
      overviewDuration > 0 ? (activeDuration / overviewDuration) * 100 : 0;
    const averageRuntimeValue =
      processedStates.length > 0 ? activeDuration / processedStates.length : 0;

    const formatDuration = (ms: number): string => {
      const totalSeconds = Math.floor(ms / 1000);

      const days = Math.floor(totalSeconds / (24 * 60 * 60));
      const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
      const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
      const seconds = totalSeconds % 60;

      const parts: string[] = [];

      if (days > 0) parts.push(`${days}d`);
      if (hours > 0) parts.push(`${hours}h`);
      if (minutes > 0) parts.push(`${minutes}m`);
      if (seconds > 0) parts.push(`${seconds}s`);

      if (parts.length === 0) {
        return "0s";
      }

      return parts.join(" ");
    };

    console.log("Overview duration:", formatDuration(overviewDuration));
    console.log("Average runtime:", formatDuration(averageRuntimeValue));
    console.log("Active duration:", formatDuration(activeDuration));

    const kpis = {
      utilization: {
        value: utilizationValue,
        change: 0,
      },
      averageRuntime: {
        value: averageRuntimeValue,
        change: 0,
      },
      alertCount: {
        value: alertCount,
        change: 0,
      },
    };

    const { scale, divisionCount } = this.getOverviewScale(startDate, endDate);
    const divisions = [];
    for (let i = 0; i < divisionCount; i++) {
      const divisionStart = this.calculateDivisionStart(startDate, scale, i);
      const divisionEnd = this.calculateDivisionEnd(
        startDate,
        scale,
        i,
        endDate
      );
      const divisionLabel = this.formatDivisionLabel(divisionStart, scale);
      divisions.push({
        start: divisionStart,
        end: divisionEnd,
        label: divisionLabel,
      });
    }

    const utilizationOverTime = divisions.map((division) => {
      // If the division is in the future, utilization should be null
      if (division.start > new Date()) {
        return {
          label: division.label,
          start: division.start,
          end: division.end,
          utilization: null,
        };
      }
      let divisionTotal = 0;
      let divisionActive = 0;
      for (let i = 0; i < processedStates.length; i++) {
        const state = processedStates[i];
        if (
          !(state.timestamp instanceof Date) ||
          isNaN(state.timestamp.getTime())
        ) {
          continue;
        }
        const stateStart = state.timestamp;
        const stateEnd = new Date(
          state.timestamp.getTime() + (state.durationMs || 0)
        );
        const overlapStart =
          stateStart > division.start ? stateStart : division.start;
        const overlapEnd = stateEnd < division.end ? stateEnd : division.end;
        const overlap = Math.max(
          0,
          overlapEnd.getTime() - overlapStart.getTime()
        );
        if (overlap > 0) {
          divisionTotal += overlap;
          if (
            typeof state.state === "string" &&
            state.state.toLowerCase() === "active"
          ) {
            divisionActive += overlap;
          }
        }
      }
      return {
        label: division.label,
        start: division.start,
        end: division.end,
        utilization:
          divisionTotal > 0 ? (divisionActive / divisionTotal) * 100 : 0,
      };
    });

    const stateDistribution = Object.entries(stateDurations).map(
      ([label, duration]) => ({
        label,
        duration,
        percentage: overviewDuration > 0 ? duration / overviewDuration : 0,
      })
    );

    const machines = (await this.services.machineService.getMachines()).map(
      (m) => ({
        id: m.id,
        name: m.name,
        type: m.type,
      })
    );

    const alarms = await this.services.alarmService.getAlarms({
      startDate,
      endDate,
    });

    return {
      kpis,
      utilization: utilizationOverTime,
      states: stateDistribution,
      machines,
      alarms,
    };
  }

  private getOverviewScale(startDate: Date, endDate: Date) {
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays <= 3)
      return { scale: "hourly", divisionCount: Math.ceil(diffDays * 24) };
    if (diffDays <= 20)
      return { scale: "daily", divisionCount: Math.ceil(diffDays) };
    if (diffDays <= 84)
      return { scale: "weekly", divisionCount: Math.ceil(diffDays / 7) };
    if (diffDays <= 548)
      return { scale: "monthly", divisionCount: Math.ceil(diffDays / 30.4375) };
    return { scale: "quarterly", divisionCount: Math.ceil(diffDays / 91.3125) };
  }

  private calculateDivisionStart(
    startDate: Date,
    scale: string,
    index: number
  ): Date {
    const start = new Date(startDate);
    switch (scale) {
      case "hourly":
        start.setHours(start.getHours() + index);
        break;
      case "daily":
        start.setDate(start.getDate() + index);
        break;
      case "weekly":
        start.setDate(start.getDate() + index * 7);
        break;
      case "monthly":
        start.setMonth(start.getMonth() + index);
        break;
      case "quarterly":
        start.setMonth(start.getMonth() + index * 3);
        break;
    }
    return start;
  }

  private calculateDivisionEnd(
    startDate: Date,
    scale: string,
    index: number,
    limit: Date
  ): Date {
    const end = new Date(startDate);
    switch (scale) {
      case "hourly":
        end.setHours(end.getHours() + index + 1);
        break;
      case "daily":
        end.setDate(end.getDate() + index + 1);
        break;
      case "weekly":
        end.setDate(end.getDate() + (index + 1) * 7);
        break;
      case "monthly":
        end.setMonth(end.getMonth() + index + 1);
        break;
      case "quarterly":
        end.setMonth(end.getMonth() + (index + 1) * 3);
        break;
    }
    return end > limit ? limit : end;
  }

  private formatDivisionLabel(date: Date, scale: string): string {
    const formatters = {
      hourly: (d: Date) => {
        const hours = (d.getUTCHours() - 4 + 24) % 12 || 12;
        const ampm = (d.getUTCHours() - 4 + 24) % 24 < 12 ? "AM" : "PM";
        return `${hours}:00 ${ampm}`;
      },
      daily: (d: Date) =>
        d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      weekly: (d: Date) =>
        `Week of ${d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}`,
      monthly: (d: Date) =>
        d.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      quarterly: (d: Date) =>
        `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`,
    };

    return formatters[scale]?.(date) || "";
  }
}

export default StateService;

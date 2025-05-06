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
    const searchableFields = [
      "state",
      "execution",
      "controller",
      "program",
      "tool",
    ];

    const queryOptions = {
      where: buildWhereClause(params, searchableFields),
      order: buildOrderClause(params),
      ...buildPaginationOptions(params),
    };

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

    const statesByMachine = this.groupStatesByMachine(states);

    const statesWithDuration = this.calculateStateDurations(
      statesByMachine,
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

  async getStateTimeline(
    machineId: string,
    startDate: Date,
    endDate: Date
  ): Promise<IMachineState[]> {
    const states = await this.getStates({
      startDate,
      endDate,
    });

    return states;
  }

  private groupStatesByMachine(states: IMachineState[]): {
    [machineId: string]: IMachineState[];
  } {
    const statesByMachine: { [machineId: string]: IMachineState[] } = {};

    for (const state of states) {
      if (!statesByMachine[state.machineId]) {
        statesByMachine[state.machineId] = [];
      }
      statesByMachine[state.machineId].push(state);
    }

    return statesByMachine;
  }

  private calculateStateDurations(
    statesByMachine: { [machineId: string]: IMachineState[] },
    endDate: Date
  ): StateWithDuration[] {
    const statesWithDuration: StateWithDuration[] = [];

    Object.values(statesByMachine).forEach((machineStates) => {
      for (let i = 0; i < machineStates.length; i++) {
        const currentState = machineStates[i];

        const stateWithDuration: StateWithDuration = {
          ...currentState,
        };

        if (i < machineStates.length - 1) {
          const nextState = machineStates[i + 1];
          stateWithDuration.durationMs =
            nextState.timestamp.getTime() - currentState.timestamp.getTime();
        } else {
          stateWithDuration.durationMs =
            endDate.getTime() - currentState.timestamp.getTime();
        }

        statesWithDuration.push(stateWithDuration);
      }
    });

    return statesWithDuration;
  }

  private async buildStateOverview(
    states: StateWithDuration[],
    startDate: Date,
    endDate: Date
  ): Promise<IStateOverview> {
    const kpis = {
      utilization: {
        value: 0,
        change: 0,
      },
      averageRuntime: {
        value: 0,
        change: 0,
      },
      alertCount: {
        value: 0,
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
      console.log(divisionStart, divisionEnd, divisionLabel);
    }

    const utilizationOverTime = [];

    const stateDistribution = {};

    const machines = await this.services.machineService.getMachines();

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

  private isStateInDivision(
    stateTimestamp: Date,
    nextStateTimestamp: Date | null,
    divisionStart: Date,
    divisionEnd: Date
  ): boolean {
    const stateStart = new Date(stateTimestamp);
    const stateEnd = nextStateTimestamp
      ? new Date(nextStateTimestamp)
      : new Date();
    return stateStart < divisionEnd && stateEnd > divisionStart;
  }
}

export default StateService;

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

  async getStateOverview(
    startDate: Date,
    endDate: Date
  ): Promise<IStateOverview> {
    const states = await this.getStatesByDateRange(startDate, endDate);

    const statesByMachine = this.groupStatesByMachine(states);

    const statesWithDuration = this.calculateStateDurations(
      statesByMachine,
      endDate
    );

    const stateOverview = await this.buildStateOverview(
      statesWithDuration,
      startDate,
      endDate
    );

    return {
      kpis: stateOverview.kpis,
      utilization: stateOverview.utilization,
      states: stateOverview.states,
      machines: stateOverview.machines,
      alerts: stateOverview.alerts,
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

  private async getStatesByDateRange(
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

    const utilization = [];

    const stateDistribution = {};

    const machines = await this.services.machineService.getMachines();

    const alerts = [];

    return {
      kpis,
      utilization,
      states: stateDistribution,
      machines,
      alerts,
    };
  }
}

export default StateService;

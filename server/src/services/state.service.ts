import MachineState from "@/models/machine-state";
import {
  IStateService,
  ICreateMachineStateDTO,
  IMachineState,
  ValidationError,
  IQueryParams,
  IStateOverview,
  NotFoundError,
  IPaginatedResponse,
  IStateTimeline,
} from "@/utils/types";
import { buildStateQuery, createDateRange } from "@/utils";
import Services from ".";
import { Op } from "sequelize";
import { sequelize } from "@/config/database";

class StateService implements IStateService {
  constructor(private services: Services) {}

  async getStates(
    params?: IQueryParams
  ): Promise<IPaginatedResponse<IMachineState>> {
    const { whereClause, orderClause, offset, limit, page } =
      buildStateQuery(params);

    const [states, total] = await Promise.all([
      MachineState.findAll({
        where: whereClause,
        order: orderClause.length ? orderClause : [["timestamp", "DESC"]],
        offset,
        limit,
      }),
      MachineState.count({ where: whereClause }),
    ]);

    return {
      items: states,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getState(id: string): Promise<MachineState> {
    if (!id) throw new ValidationError("ID is required");

    const trimmedId = typeof id === "string" ? id.trim() : id;

    const state = await MachineState.findByPk(trimmedId);
    if (!state) throw new NotFoundError(`State with ID ${trimmedId} not found`);

    return state;
  }

  async getStateOverview(
    startDate: string,
    endDate: string
  ): Promise<IStateOverview> {
    const now = new Date();

    const dateRange = createDateRange(startDate, endDate);
    console.log(`Start date: ${dateRange.startDate}`);
    console.log(`End date: ${dateRange.endDate}`);
    console.log(`Total duration: ${dateRange.totalDuration}`);
    console.log(`Total days: ${dateRange.totalDays}`);
    console.log(`Previous start: ${dateRange.previousStart}`);
    console.log(`Previous end: ${dateRange.previousEnd}`);

    const machineDurationPerMachinePerDay = 1000 * 60 * 60 * 7.5;
    console.log(
      `Machine duration per machine per day: ${machineDurationPerMachinePerDay}`
    );

    const machineDurationPerMachinePerDateRange =
      machineDurationPerMachinePerDay * dateRange.totalDays;
    console.log(
      `Machine duration per machine per date range: ${machineDurationPerMachinePerDateRange}`
    );

    const machines = await this.services.machineService.getMachines();
    const machineCount = machines.length;
    console.log(`Machine count: ${machineCount}`);

    const totalMachineDuration =
      machineDurationPerMachinePerDateRange * machineCount;
    console.log(`Total machine duration: ${totalMachineDuration}`);

    const states = await this.getStates({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    });

    console.log(`State count: ${states.items.length}`);

    const previousStates = await this.getStates({
      startDate: dateRange.previousStart,
      endDate: dateRange.previousEnd,
    });

    const totalsByState = states.items.reduce((acc, state) => {
      if (!acc[state.state]) {
        acc[state.state] = 0;
      }

      if (state.durationMs) {
        acc[state.state] += Number(state.durationMs);
      } else {
        acc[state.state] += Number(now.getTime() - state.timestamp.getTime());
      }

      return acc;
    }, {} as Record<string, number>);

    const stateTotal = Object.values(totalsByState).reduce(
      (acc, total) => acc + total,
      0
    );

    const percentsByState = Object.entries(totalsByState).map(
      ([state, total]) => {
        return {
          state,
          total: total,
          percentage: (total / stateTotal) * 100,
        };
      }
    );

    console.log(`Totals by state: ${JSON.stringify(totalsByState)}`);

    console.log(`Percents by state: ${JSON.stringify(percentsByState)}`);

    const totalStateDuration = Object.values(totalsByState).reduce(
      (acc, total) => acc + total,
      0
    );

    console.log(`Total state duration: ${totalStateDuration}`);

    const previousTotalsByState = previousStates.items.reduce((acc, state) => {
      if (!acc[state.state]) {
        acc[state.state] = 0;
      }
      acc[state.state] += this.getStateDuration(state, now);
      return acc;
    }, {} as Record<string, number>);

    const utilization =
      (totalsByState["ACTIVE"] / dateRange.totalDuration) * machineCount;

    const previousUtilization =
      (previousTotalsByState["ACTIVE"] / dateRange.totalDuration) *
      machineCount;

    const utilizationChange =
      ((utilization - previousUtilization) / previousUtilization) * 100;

    const alarmCount = 0;
    const previousAlarmCount = 0;

    const alarmChange =
      ((alarmCount - previousAlarmCount) / previousAlarmCount) * 100;

    const { scale, divisionCount } = this.getOverviewScale(
      dateRange.startDate,
      dateRange.endDate
    );

    const divisions = [];
    for (let i = 0; i < divisionCount; i++) {
      const divisionStart = this.calculateDivisionStart(
        dateRange.startDate,
        scale,
        i
      );
      const divisionEnd = this.calculateDivisionEnd(
        dateRange.startDate,
        scale,
        i,
        dateRange.endDate
      );
      const divisionLabel = this.formatDivisionLabel(divisionStart, scale);
      divisions.push({
        start: divisionStart,
        end: divisionEnd,
        label: divisionLabel,
      });
    }

    const activePercentagesWithinEachDivisionTime = divisions.map(
      (division) => {
        const statesInDivision = states.items.filter((state) => {
          const stateEnd = state.durationMs
            ? new Date(state.timestamp.getTime() + state.durationMs)
            : now;
          return state.timestamp <= division.end && stateEnd >= division.start;
        });

        const divisionDuration =
          division.end.getTime() - division.start.getTime();

        const totalsByState = statesInDivision.reduce((acc, state) => {
          if (!acc[state.state]) {
            acc[state.state] = 0;
          }

          const stateStart = state.timestamp;
          const stateEnd = new Date(
            stateStart.getTime() + this.getStateDuration(state, now)
          );

          const overlapStart = Math.max(
            stateStart.getTime(),
            division.start.getTime()
          );
          const overlapEnd = Math.min(
            stateEnd.getTime(),
            division.end.getTime()
          );
          const overlapDuration = (overlapEnd - overlapStart) * machineCount;

          acc[state.state] += overlapDuration;
          return acc;
        }, {} as Record<string, number>);

        const activeDuration = totalsByState["ACTIVE"] || 0;
        const utilization =
          (activeDuration / (divisionDuration * machineCount)) * 100;

        return {
          label: division.label,
          start: division.start,
          end: division.end,
          utilization: Number(utilization.toFixed(2)) || 0,
          stateTotals: totalsByState,
        };
      }
    );

    return {
      kpis: {
        utilization: {
          value: Number(utilization.toFixed(2)) || 0,
          change: Number(utilizationChange.toFixed(2)) || 0,
        },
        averageRuntime: {
          value: 0,
          change: 0,
        },
        alarmCount: {
          value: Number(alarmCount.toFixed(2)) || 0,
          change: Number(alarmChange.toFixed(2)) || 0,
        },
      },
      utilization: activePercentagesWithinEachDivisionTime,
      states: percentsByState,
      machines: [],
      alarms: [],
    };
  }

  async getStateTimeline(
    startDate: string,
    endDate: string
  ): Promise<IStateTimeline> {
    const dateRange = createDateRange(startDate, endDate);
    console.log(`Start date: ${dateRange.startDate}`);
    console.log(`End date: ${dateRange.endDate}`);
    console.log(`Total duration: ${dateRange.totalDuration}`);
    console.log(`Total days: ${dateRange.totalDays}`);
    console.log(`Previous start: ${dateRange.previousStart}`);
    console.log(`Previous end: ${dateRange.previousEnd}`);

    return {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      machines: [],
    };
  }

  async createState(stateData: ICreateMachineStateDTO): Promise<MachineState> {
    this.validateState(stateData);

    try {
      return await sequelize.transaction(async (t) => {
        await this.closePreviousState(
          stateData.machineId,
          stateData.timestamp,
          t
        );
        return await MachineState.create(stateData, { transaction: t });
      });
    } catch (error) {
      if (error.name === "SequelizeUniqueConstraintError") {
        throw new ValidationError(
          `A state already exists for this machine at this timestamp`
        );
      }
      throw error;
    }
  }

  async updateState(
    id: string,
    stateData: Partial<ICreateMachineStateDTO>
  ): Promise<MachineState> {
    if (stateData.timestamp !== undefined) {
      throw new ValidationError("Timestamp cannot be updated");
    }

    const existingState = await this.getState(id);

    const allowedFields = [
      "machineId",
      "state",
      "execution",
      "controller",
      "program",
      "durationMs",
    ];

    let isUpdated = false;

    allowedFields.forEach((field) => {
      if (
        stateData[field] !== undefined &&
        stateData[field] !== existingState[field]
      ) {
        existingState[field] = stateData[field];
        isUpdated = true;
      }
    });

    if (isUpdated) {
      return await existingState.save();
    }

    return existingState;
  }

  async deleteState(id: string): Promise<boolean> {
    if (!id) throw new ValidationError("ID is required");

    try {
      await this.getState(id);

      const deletedCount = await MachineState.destroy({ where: { id } });

      return deletedCount > 0;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Error deleting state: ${error.message}`);
    }
  }

  private validateState(state: ICreateMachineStateDTO): void {
    if (!state) throw new ValidationError("State data is required");

    const requiredFields = {
      machineId: "Machine ID is required",
      timestamp: "Timestamp is required",
      state: "State is required",
      execution: "Execution is required",
      controller: "Controller is required",
      program: "Program is required",
    };

    for (const [field, message] of Object.entries(requiredFields)) {
      if (!state[field]) throw new ValidationError(message);
    }

    if (
      state.timestamp &&
      !(state.timestamp instanceof Date) &&
      isNaN(new Date(state.timestamp).getTime())
    ) {
      throw new ValidationError("Invalid timestamp format");
    }

    if (
      state.durationMs !== null &&
      state.durationMs !== undefined &&
      state.durationMs <= 0
    ) {
      throw new ValidationError("Duration must be positive if provided");
    }
  }

  private async closePreviousState(
    machineId: string,
    timestamp: Date,
    transaction?: any
  ): Promise<void> {
    const previousState = await MachineState.findOne({
      where: {
        machineId,
        timestamp: { [Op.lt]: timestamp },
        durationMs: null,
      },
      order: [["timestamp", "DESC"]],
      transaction,
    });

    if (previousState) {
      previousState.durationMs =
        timestamp.getTime() - previousState.timestamp.getTime();
      await previousState.save({ transaction });
    }
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

  private getStateDuration(state: IMachineState, now: Date): number {
    return state.durationMs || now.getTime() - state.timestamp.getTime();
  }

  async createSampleStates(): Promise<void> {
    const now = new Date();
    const states = ["ACTIVE", "IDLE", "ALARM", "OFFLINE"];
    const executions = [
      "RUNNING",
      "STOPPED",
      "READY",
      "FEED_HOLD",
      "INTERRUPTED",
    ];
    const controllerModes = [
      "JOB",
      "EDIT",
      "MDI",
      "HANDLE",
      "JOG",
      "ZERO_RETURN",
      "REF",
      "TEACH",
    ];

    // Get all machines
    const machines = await this.services.machineService.getMachines();
    if (machines.length === 0) {
      throw new ValidationError("No machines found to create sample states");
    }

    // Generate states for each machine separately
    for (const machine of machines) {
      // First create the current state (most recent) with NO duration
      const currentState: ICreateMachineStateDTO = {
        machineId: machine.id,
        timestamp: now, // Current time
        state: states[Math.floor(Math.random() * states.length)],
        execution: executions[Math.floor(Math.random() * executions.length)],
        controller:
          controllerModes[Math.floor(Math.random() * controllerModes.length)],
        program: "P1000",
        // No durationMs for current state
      };

      await this.createState(currentState);

      // Start the historical data from now
      let endTimestamp = now.getTime();

      // Generate historical states going backwards in time
      for (let i = 1; i < 5000; i++) {
        const randomDuration = Math.floor(
          Math.random() * (120000 - 30000) + 30000
        ); // 30s to 2min
        const startTimestamp = endTimestamp - randomDuration;

        const state: ICreateMachineStateDTO = {
          machineId: machine.id,
          timestamp: new Date(startTimestamp),
          state: states[Math.floor(Math.random() * states.length)],
          execution: executions[Math.floor(Math.random() * executions.length)],
          controller:
            controllerModes[Math.floor(Math.random() * controllerModes.length)],
          program: `P${1000 + i}`,
          durationMs: randomDuration,
        };

        await this.createState(state);

        // Next state starts where this one ended
        endTimestamp = startTimestamp;
      }
    }
  }
}

export default StateService;

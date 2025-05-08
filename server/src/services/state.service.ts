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
import { sequelize } from "@/config/database";
import { Op } from "sequelize";

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
        order: orderClause.length ? orderClause : [["endDate", "DESC"]],
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
    console.log(`Starting with now: ${now.toISOString()}`);

    const dateRange = createDateRange(startDate, endDate);
    console.log(`Date range details:`);
    console.log(`  Start date: ${dateRange.startDate}`);
    console.log(`  End date: ${dateRange.endDate}`);
    console.log(`  Total duration: ${dateRange.totalDuration}`);
    console.log(`  Total days: ${dateRange.totalDays}`);
    console.log(`  Previous start: ${dateRange.previousStart}`);
    console.log(`  Previous end: ${dateRange.previousEnd}`);

    const machineDurationPerMachinePerDay = 1000 * 60 * 60 * 7.5; // 7.5 hours in milliseconds
    console.log(
      `Machine duration per machine per day: ${machineDurationPerMachinePerDay}`
    );

    const machineDurationPerMachinePerDateRange =
      machineDurationPerMachinePerDay * dateRange.totalDays;
    console.log(
      `Machine duration per machine per date range: ${machineDurationPerMachinePerDateRange}`
    );

    // Get all machines and states for the date range
    console.log(`Fetching machines and states...`);
    const [machines, states, previousStates] = await Promise.all([
      this.services.machineService.getMachines(),
      this.getStates({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      }),
      this.getStates({
        startDate: dateRange.previousStart,
        endDate: dateRange.previousEnd,
      }),
    ]);

    const machineCount = machines.length;
    console.log(`Machine count: ${machineCount}`);
    console.log(`Current states count: ${states.items.length}`);
    console.log(`Previous states count: ${previousStates.items.length}`);

    if (machineCount === 0) {
      console.log(`ERROR: No machines found`);
      throw new ValidationError("No machines found");
    }

    const totalMachineDuration =
      machineDurationPerMachinePerDateRange * machineCount;
    console.log(`Total machine duration: ${totalMachineDuration}`);

    // Calculate total available time (7.5h per machine per day)
    const hoursPerDay = 7.5;
    const msPerHour = 60 * 60 * 1000;
    const totalAvailableTime =
      hoursPerDay * msPerHour * dateRange.totalDays * machineCount;

    // Calculate active time
    const { totalsByState, activeTime } = this.calculateStateTotals(
      states.items,
      dateRange.startDate,
      dateRange.endDate,
      now
    );

    // Calculate utilization
    const utilization = (activeTime / totalAvailableTime) * 100;

    console.log(`Metrics:`);
    console.log(`  Total available time: ${totalAvailableTime}ms`);
    console.log(`  Total active time: ${activeTime}ms`);
    console.log(`  Utilization: ${utilization.toFixed(2)}%`);

    // Calculate state percentages
    const stateTotal = Object.values(totalsByState).reduce(
      (acc, total) => acc + total,
      0
    );
    console.log(`Total state duration: ${stateTotal}`);

    const percentsByState = Object.entries(totalsByState).map(
      ([state, total]) => ({
        state,
        total,
        percentage: stateTotal === 0 ? 0 : (total / stateTotal) * 100,
      })
    );
    console.log(`State percentages:`, JSON.stringify(percentsByState, null, 2));

    // Calculate time divisions
    console.log(`Calculating time divisions...`);
    const { scale, divisionCount } = this.getOverviewScale(
      dateRange.startDate,
      dateRange.endDate
    );
    console.log(`Scale: ${scale}, Division count: ${divisionCount}`);

    const divisions = Array.from({ length: divisionCount }, (_, i) => {
      const start = this.calculateDivisionStart(dateRange.startDate, scale, i);
      const end = this.calculateDivisionEnd(
        dateRange.startDate,
        scale,
        i,
        dateRange.endDate
      );
      return {
        start,
        end,
        label: this.formatDivisionLabel(start, scale),
      };
    });
    console.log(`Created ${divisions.length} divisions`);

    // Calculate utilization for each division
    console.log(`Calculating division utilizations...`);
    const activePercentagesWithinEachDivisionTime = divisions.map(
      (division) => {
        console.log(`Processing division: ${division.label}`);
        const { activeTime: divisionActiveTime } = this.calculateStateTotals(
          states.items,
          division.start,
          division.end,
          now
        );

        const divisionDuration =
          division.end.getTime() - division.start.getTime();
        const divisionTotalTime = divisionDuration * machineCount;
        const divisionUtilization =
          divisionTotalTime === 0
            ? 0
            : (divisionActiveTime / divisionTotalTime) * 100;

        console.log(`Division ${division.label} metrics:`);
        console.log(`  Duration: ${divisionDuration}`);
        console.log(`  Total time: ${divisionTotalTime}`);
        console.log(`  Active time: ${divisionActiveTime}`);
        console.log(`  Utilization: ${divisionUtilization.toFixed(2)}%`);

        return {
          label: division.label,
          start: division.start,
          end: division.end,
          utilization: Number(divisionUtilization.toFixed(2)),
          stateTotals: this.calculateStateTotals(
            states.items,
            division.start,
            division.end,
            now
          ).totalsByState,
        };
      }
    );

    // Add this before the alarm metrics calculation
    const { totalsByState: previousTotalsByState } = this.calculateStateTotals(
      previousStates.items,
      dateRange.previousStart,
      dateRange.previousEnd,
      now
    );

    // Then the existing alarm metrics code will work
    const alarmCount = totalsByState["ALARM"] || 0;
    const previousAlarmCount = previousTotalsByState["ALARM"] || 0;
    const alarmChange =
      previousAlarmCount === 0
        ? 0
        : ((alarmCount - previousAlarmCount) / previousAlarmCount) * 100;

    console.log(`Alarm metrics:`);
    console.log(`  Current alarms: ${alarmCount}`);
    console.log(`  Previous alarms: ${previousAlarmCount}`);
    console.log(`  Alarm change: ${alarmChange.toFixed(2)}%`);

    console.log(`Returning final overview`);
    return {
      kpis: {
        utilization: {
          value: Number(utilization.toFixed(2)),
          change: 0,
        },
        averageRuntime: {
          value: 0, // TODO: Implement average runtime calculation
          change: 0,
        },
        alarmCount: {
          value: Number(alarmCount.toFixed(2)),
          change: Number(alarmChange.toFixed(2)),
        },
      },
      utilization: activePercentagesWithinEachDivisionTime,
      states: percentsByState,
      machines: machines.map((machine) => ({
        id: machine.id,
        name: machine.name,
        type: machine.type,
      })),
      alarms: [],
    };
  }

  private calculateStateTotals(
    states: IMachineState[],
    startDate: Date,
    endDate: Date,
    now: Date
  ): { totalsByState: Record<string, number>; activeTime: number } {
    const totalsByState: Record<string, number> = {};
    let activeTime = 0;

    // Group states by machine
    const statesByMachine = states.reduce((acc, state) => {
      if (!acc[state.machineId]) {
        acc[state.machineId] = [];
      }
      acc[state.machineId].push(state);
      return acc;
    }, {} as Record<string, IMachineState[]>);

    // Calculate for each machine
    Object.values(statesByMachine).forEach((machineStates) => {
      // Filter states within the date range
      const relevantStates = machineStates.filter((state) => {
        const stateEnd = state.endTime || now;
        return state.startTime <= endDate && stateEnd >= startDate;
      });

      // Calculate totals for each state
      relevantStates.forEach((state) => {
        if (!totalsByState[state.state]) {
          totalsByState[state.state] = 0;
        }

        const stateStart = state.startTime;
        const stateEnd = state.endTime || now;

        // Calculate overlap with the date range
        const overlapStart = Math.max(
          stateStart.getTime(),
          startDate.getTime()
        );
        const overlapEnd = Math.min(stateEnd.getTime(), endDate.getTime());
        const overlapDuration = overlapEnd - overlapStart;

        totalsByState[state.state] += overlapDuration;

        // Track active time separately
        if (state.state === "ACTIVE") {
          activeTime += overlapDuration;
        }
      });
    });

    return { totalsByState, activeTime };
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

    const machines = await this.services.machineService.getMachines();

    const timeline = await MachineState.findAll({
      where: {
        startTime: { [Op.gte]: dateRange.startDate },
        endTime: { [Op.lte]: dateRange.endDate },
      },
    });

    return {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      machines: machines.map((machine) => ({
        id: machine.id,
        name: machine.name,
        type: machine.type,
        timeline: timeline.filter((state) => state.machineId === machine.id),
      })),
    };
  }

  async createState(stateData: ICreateMachineStateDTO): Promise<MachineState> {
    this.validateState(stateData);

    try {
      return await sequelize.transaction(async (t) => {
        await this.closePreviousState(
          stateData.machineId,
          stateData.startTime,
          t
        );
        return await MachineState.create(
          {
            ...stateData,
            startTime: stateData.startTime,
            endTime: null,
          },
          { transaction: t }
        );
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
    if (stateData.endTime !== undefined) {
      throw new ValidationError("End time cannot be updated");
    }

    const existingState = await this.getState(id);

    const allowedFields = [
      "machineId",
      "state",
      "execution",
      "controller",
      "program",
      "endTime",
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
      startTime: "Start time is required",
      state: "State is required",
      execution: "Execution is required",
      controller: "Controller is required",
      program: "Program is required",
    };

    for (const [field, message] of Object.entries(requiredFields)) {
      if (!state[field]) throw new ValidationError(message);
    }

    if (
      state.startTime &&
      !(state.startTime instanceof Date) &&
      isNaN(new Date(state.startTime).getTime())
    ) {
      throw new ValidationError("Invalid start time format");
    }

    if (
      state.endTime !== null &&
      state.endTime !== undefined &&
      state.endTime <= state.startTime
    ) {
      throw new ValidationError("End time must be greater than start time");
    }
  }

  private async closePreviousState(
    machineId: string,
    startTime: Date,
    transaction?: any
  ): Promise<void> {
    const previousState = await MachineState.findOne({
      where: {
        machineId,
        endTime: null,
      },
      order: [["startTime", "DESC"]],
      transaction,
    });

    if (previousState) {
      previousState.endTime = startTime;
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

  async createSampleStates(): Promise<void> {
    const now = new Date();
    const states = ["ACTIVE"]; // Only ACTIVE states
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

    const machines = await this.services.machineService.getMachines();
    if (machines.length === 0) {
      throw new ValidationError("No machines found to create sample states");
    }

    for (const machine of machines) {
      // Current state (only one with null endTime)
      const currentState: ICreateMachineStateDTO = {
        machineId: machine.id,
        startTime: now,
        endTime: null, // Only current state should have null endTime
        state: "ACTIVE", // Always ACTIVE
        execution: executions[Math.floor(Math.random() * executions.length)],
        controller:
          controllerModes[Math.floor(Math.random() * controllerModes.length)],
        program: "P1000",
      };

      await this.createState(currentState);

      // Historical states
      let endTime = now;

      for (let i = 1; i < 2000; i++) {
        const randomDuration = Math.floor(
          Math.random() * (120000 - 30000) + 30000
        );
        const startTime = new Date(endTime.getTime() - randomDuration);

        const state: ICreateMachineStateDTO = {
          machineId: machine.id,
          startTime,
          endTime, // Set the endTime to the previous state's start time
          state: "ACTIVE", // Always ACTIVE
          execution: executions[Math.floor(Math.random() * executions.length)],
          controller:
            controllerModes[Math.floor(Math.random() * controllerModes.length)],
          program: `P${1000 + i}`,
        };

        await this.createState(state);
        endTime = startTime;
      }
    }
  }

  async createTestStates(): Promise<void> {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

    const machines = await this.services.machineService.getMachines();
    if (machines.length === 0) {
      throw new ValidationError("No machines found to create test states");
    }

    for (const machine of machines) {
      // Create a single ACTIVE state that started a week ago and is still active
      const state: ICreateMachineStateDTO = {
        machineId: machine.id,
        startTime: oneWeekAgo,
        endTime: null, // Still active
        state: "ACTIVE",
        execution: "RUNNING",
        controller: "JOB",
        program: "P1000",
      };

      await this.createState(state);
    }
  }
}

export default StateService;

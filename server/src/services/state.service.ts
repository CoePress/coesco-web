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

// class Test {
//   constructor(private services: Services) {}

//   async getStateTimeline(startDate: Date, endDate: Date): Promise<any[]> {
//     if (startDate > endDate) {
//       throw new ValidationError("Start date must be before end date");
//     }

//     const startDateEST = new Date(startDate.getTime() + 4 * 60 * 60 * 1000);
//     const endDateEST = new Date(endDate.getTime() + 4 * 60 * 60 * 1000);

//     if (startDateEST.getTime() === endDateEST.getTime()) {
//       endDateEST.setTime(startDateEST.getTime() + 24 * 60 * 60 * 1000 - 1);
//     } else {
//       endDateEST.setTime(endDateEST.getTime() - 1);
//     }

//     const states = await this.getStatesByDateRange(startDateEST, endDateEST);

//     // Get all machines
//     const machines = await this.services.machineService.getMachines();

//     // Group states by machineId
//     const statesByMachine: { [machineId: string]: any[] } = {};
//     for (const state of states) {
//       if (!statesByMachine[state.machineId]) {
//         statesByMachine[state.machineId] = [];
//       }
//       statesByMachine[state.machineId].push(state);
//     }

//     const timelines: {
//       machineId: string;
//       machineName: string;
//       timeline: any[];
//     }[] = [];

//     for (const machine of machines) {
//       const machineId = machine.id;
//       const machineName = machine.name;
//       const machineStates = (statesByMachine[machineId] || []).sort(
//         (a, b) =>
//           new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
//       );

//       const timeline: any[] = [];
//       let cursor = new Date(startDateEST);

//       if (machineStates.length === 0) {
//         // No states at all: fill the whole range with OFFLINE
//         timeline.push({
//           state: "OFFLINE",
//           timestamp: cursor.toISOString(),
//           durationMs: endDateEST.getTime() - cursor.getTime(),
//         });
//       } else {
//         for (let i = 0; i < machineStates.length; i++) {
//           const state = machineStates[i];
//           const stateStart = new Date(state.timestamp);
//           const stateEnd =
//             i < machineStates.length - 1
//               ? new Date(machineStates[i + 1].timestamp)
//               : new Date(endDateEST);

//           // Fill gap before this state with OFFLINE
//           if (stateStart > cursor) {
//             timeline.push({
//               state: "OFFLINE",
//               timestamp: cursor.toISOString(),
//               durationMs: stateStart.getTime() - cursor.getTime(),
//             });
//             cursor = new Date(stateStart);
//           }

//           // State duration is until next state or endDateEST
//           const durationMs =
//             (i < machineStates.length - 1
//               ? new Date(machineStates[i + 1].timestamp)
//               : endDateEST
//             ).getTime() - stateStart.getTime();

//           timeline.push({
//             state: state.state,
//             timestamp: state.timestamp,
//             durationMs,
//           });

//           cursor = new Date(stateStart.getTime() + durationMs);
//         }

//         // Fill gap after last state with OFFLINE
//         if (cursor < endDateEST) {
//           timeline.push({
//             state: "OFFLINE",
//             timestamp: cursor.toISOString(),
//             durationMs: endDateEST.getTime() - cursor.getTime(),
//           });
//         }
//       }

//       timelines.push({ machineId, machineName, timeline });
//     }

//     return timelines;
//   }

//   private async buildStateOverview(
//     states: any[],
//     startDate: Date,
//     endDate: Date
//   ): Promise<IStateOverview> {
//     // 1. Group by machineId and sort by timestamp
//     const statesByMachine: { [machineId: string]: any[] } = {};
//     for (const s of states) {
//       const state =
//         typeof (s as any).toJSON === "function" ? (s as any).toJSON() : s;
//       if (!statesByMachine[state.machineId])
//         statesByMachine[state.machineId] = [];
//       statesByMachine[state.machineId].push(state);
//     }
//     for (const machineId in statesByMachine) {
//       statesByMachine[machineId].sort(
//         (a, b) =>
//           new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
//       );
//     }

//     // 2. Flatten and calculate durations
//     const processedStates: any[] = [];
//     for (const machineId in statesByMachine) {
//       const machineStates = statesByMachine[machineId];
//       for (let i = 0; i < machineStates.length; i++) {
//         const current = machineStates[i];
//         const next = machineStates[i + 1];
//         const end = next ? new Date(next.timestamp) : endDate;
//         processedStates.push({
//           ...current,
//           durationMs:
//             new Date(end).getTime() - new Date(current.timestamp).getTime(),
//         });
//       }
//     }

//     // 3. Use processedStates for all further calculations
//     let activeDuration = 0;
//     let alarmCount = 0;
//     const stateDurations: Record<string, number> = {};
//     const stateTypeCounts: Record<string, number> = {};

//     console.log("Total states:", processedStates.length);

//     for (const state of processedStates) {
//       const duration = state.durationMs || 0;
//       if (typeof state.state === "string") {
//         stateDurations[state.state] =
//           (stateDurations[state.state] || 0) + duration;
//         stateTypeCounts[state.state] = (stateTypeCounts[state.state] || 0) + 1;
//         if (state.state.toLowerCase() === "active") {
//           activeDuration += duration;
//         }
//       }
//     }

//     console.log("State counts per type:", stateTypeCounts);

//     const overviewDuration = endDate.getTime() - startDate.getTime() + 1;
//     const utilizationValue =
//       overviewDuration > 0 ? (activeDuration / overviewDuration) * 100 : 0;
//     const averageRuntimeValue =
//       processedStates.length > 0 ? activeDuration / processedStates.length : 0;

//     const formatDuration = (ms: number): string => {
//       const totalSeconds = Math.floor(ms / 1000);

//       const days = Math.floor(totalSeconds / (24 * 60 * 60));
//       const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
//       const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
//       const seconds = totalSeconds % 60;

//       const parts: string[] = [];

//       if (days > 0) parts.push(`${days}d`);
//       if (hours > 0) parts.push(`${hours}h`);
//       if (minutes > 0) parts.push(`${minutes}m`);
//       if (seconds > 0) parts.push(`${seconds}s`);

//       if (parts.length === 0) {
//         return "0s";
//       }

//       return parts.join(" ");
//     };

//     console.log("Overview duration:", formatDuration(overviewDuration));
//     console.log("Average runtime:", formatDuration(averageRuntimeValue));
//     console.log("Active duration:", formatDuration(activeDuration));

//     const kpis = {
//       utilization: {
//         value: utilizationValue,
//         change: 0,
//       },
//       averageRuntime: {
//         value: averageRuntimeValue,
//         change: 0,
//       },
//       alarmCount: {
//         value: alarmCount,
//         change: 0,
//       },
//     };

//     const { scale, divisionCount } = this.getOverviewScale(startDate, endDate);
//     const divisions = [];
//     for (let i = 0; i < divisionCount; i++) {
//       const divisionStart = this.calculateDivisionStart(startDate, scale, i);
//       const divisionEnd = this.calculateDivisionEnd(
//         startDate,
//         scale,
//         i,
//         endDate
//       );
//       const divisionLabel = this.formatDivisionLabel(divisionStart, scale);
//       divisions.push({
//         start: divisionStart,
//         end: divisionEnd,
//         label: divisionLabel,
//       });
//     }

//     const utilizationOverTime = divisions.map((division) => {
//       // If the division is in the future, utilization should be null
//       if (division.start > new Date()) {
//         return {
//           label: division.label,
//           start: division.start,
//           end: division.end,
//           utilization: null,
//         };
//       }
//       let divisionTotal = 0;
//       let divisionActive = 0;
//       for (let i = 0; i < processedStates.length; i++) {
//         const state = processedStates[i];
//         if (
//           !(state.timestamp instanceof Date) ||
//           isNaN(state.timestamp.getTime())
//         ) {
//           continue;
//         }
//         const stateStart = state.timestamp;
//         const stateEnd = new Date(
//           state.timestamp.getTime() + (state.durationMs || 0)
//         );
//         const overlapStart =
//           stateStart > division.start ? stateStart : division.start;
//         const overlapEnd = stateEnd < division.end ? stateEnd : division.end;
//         const overlap = Math.max(
//           0,
//           overlapEnd.getTime() - overlapStart.getTime()
//         );
//         if (overlap > 0) {
//           divisionTotal += overlap;
//           if (
//             typeof state.state === "string" &&
//             state.state.toLowerCase() === "active"
//           ) {
//             divisionActive += overlap;
//           }
//         }
//       }
//       return {
//         label: division.label,
//         start: division.start,
//         end: division.end,
//         utilization:
//           divisionTotal > 0 ? (divisionActive / divisionTotal) * 100 : 0,
//       };
//     });

//     const stateDistribution = Object.entries(stateDurations).map(
//       ([label, duration]) => ({
//         label,
//         duration,
//         percentage: overviewDuration > 0 ? duration / overviewDuration : 0,
//       })
//     );

//     const machines = (await this.services.machineService.getMachines()).map(
//       (m) => ({
//         id: m.id,
//         name: m.name,
//         type: m.type,
//       })
//     );

//     const alarms = await this.services.alarmService.getAlarms({
//       startDate,
//       endDate,
//     });

//     return {
//       kpis,
//       utilization: utilizationOverTime,
//       states: stateDistribution,
//       machines,
//       alarms,
//     };
//   }
// }

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

    const machines = await this.services.machineService.getMachines();
    const machineCount = machines.length;

    console.log(`Machine count: ${machineCount}`);

    const states = await this.getStates({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    });

    console.log(`State count: ${states.items.length}`);

    const previousStates = await this.getStates({
      startDate: dateRange.previousStart,
      endDate: dateRange.previousEnd,
    });

    console.log(`Previous state count: ${previousStates.items.length}`);

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
    }, {});

    const percentsByState = Object.entries(totalsByState).map(
      ([state, total]) => {
        return {
          state,
          total: Number(total),
          percentage:
            (Number(total) / (dateRange.totalDuration * machineCount)) * 100,
        };
      }
    );

    console.log(`Totals by state: ${JSON.stringify(totalsByState)}`);

    console.log(`Percents by state: ${JSON.stringify(percentsByState)}`);

    const previousTotalsByState = previousStates.items.reduce((acc, state) => {
      if (!acc[state.state]) {
        acc[state.state] = 0;
      }
      acc[state.state] += Number(state.durationMs);
      return acc;
    }, {});

    const previousPercentsByState = Object.entries(previousTotalsByState).map(
      ([state, total]) => {
        return {
          state,
          total: Number(total),
          percentage:
            (Number(total) / (dateRange.totalDuration * machineCount)) * 100,
        };
      }
    );

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
      utilization: [],
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

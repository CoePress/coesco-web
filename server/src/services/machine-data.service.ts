import { buildQuery, createDateRange, hasThisChanged } from "@/utils";
import { IQueryParams } from "@/types/api.types";
import MachineStatus from "@/models/machine-status";
import { cacheService, getSocketService, machineService } from ".";
import { BadRequestError, NotFoundError } from "@/middleware/error.middleware";
import { Op } from "sequelize";
import { IMachineStatus, MachineState } from "@/types/schema.types";
import { MachineConnectionType } from "@/types/schema.types";

export class MachineDataService {
  private pollInterval: NodeJS.Timeout | null = null;
  private readonly offlineState = {
    state: MachineState.OFFLINE,
    execution: null,
    controller: null,
    program: null,
    tool: null,
    metrics: {
      spindleSpeed: null,
      feedRate: null,
      axisPositions: {
        X: null,
        Y: null,
        Z: null,
      },
    },
  };

  constructor() {
    this.startPolling();
  }

  async initialize() {
    await this.initializeMachineStates();
  }

  private async initializeMachineStates() {
    try {
      const machines = await machineService.getMachines({});

      if (!machines?.data) {
        console.error("No machines found or invalid response");
        return;
      }

      for (const machine of machines.data) {
        if (!machine?.id) {
          console.error("Invalid machine data:", machine);
          continue;
        }

        const cachedState = await cacheService.get(
          `machine:${machine.id}:current_state`
        );

        if (!cachedState) {
          const initialState = {
            execution: null,
            controller: null,
            program: null,
            tool: null,
            metrics: {
              spindleSpeed: 0,
              feedRate: 0,
              axisPositions: {
                X: 0,
                Y: 0,
                Z: 0,
              },
            },
            state: MachineState.IDLE,
          };

          await cacheService.set(
            `machine:${machine.id}:current_state`,
            initialState
          );
        }
      }
    } catch (error) {
      console.error("Error initializing machine states:", error);
    }
  }

  async getMachineStatuses(params: IQueryParams) {
    const { whereClause, orderClause, page, limit, offset } = buildQuery(
      params,
      ["status"]
    );

    const machineStatuses = await MachineStatus.findAll({
      where: whereClause,
      order: Object.entries(orderClause).map(([key, value]) => [key, value]),
      limit,
      offset,
    });

    const total = await MachineStatus.count({ where: whereClause });
    const totalPages = limit ? Math.ceil(total / limit) : 1;

    return {
      success: true,
      data: machineStatuses.map(
        (machineStatus) => machineStatus.toJSON() as IMachineStatus
      ),
      total,
      totalPages,
      page,
      limit,
    };
  }

  async getMachineStatusesByDateRange(
    params: IQueryParams & { startDate: string; endDate: string }
  ) {
    const { whereClause, orderClause, page, limit, offset } = buildQuery(
      params,
      ["status"]
    );

    const machineStatuses = await MachineStatus.findAll({
      where: {
        ...whereClause,
        [Op.or]: [
          {
            startTime: {
              [Op.between]: [params.startDate, params.endDate],
            },
          },
          {
            endTime: {
              [Op.between]: [params.startDate, params.endDate],
            },
          },
          {
            startTime: {
              [Op.lte]: params.startDate,
            },
            endTime: {
              [Op.gte]: params.endDate,
            },
          },
        ],
      },
      order: Object.entries(orderClause).map(([key, value]) => [key, value]),
      limit,
      offset,
    });

    const processedStatuses = machineStatuses.map((status) => {
      const statusStart = new Date(status.startTime);
      const statusEnd = status.endTime ? new Date(status.endTime) : new Date();
      const rangeStart = new Date(params.startDate);
      const rangeEnd = new Date(params.endDate);

      const overlapStart = new Date(
        Math.max(statusStart.getTime(), rangeStart.getTime())
      );
      const overlapEnd = new Date(
        Math.min(statusEnd.getTime(), rangeEnd.getTime())
      );

      return {
        ...status.toJSON(),
        startTime: overlapStart,
        endTime: overlapEnd,
        duration: overlapEnd.getTime() - overlapStart.getTime(),
      };
    });

    return {
      success: true,
      data: processedStatuses.map((status) => ({
        ...status,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    };
  }

  async getMachineOverview(startDate: string, endDate: string) {
    const now = new Date();

    const dateRange = createDateRange(startDate, endDate);
    console.log(`Current Range: ${dateRange.startDate} - ${dateRange.endDate}`);
    console.log(
      `Previous Range: ${dateRange.previousStartDate} - ${dateRange.previousEndDate}`
    );

    const machineDurationPerMachinePerDay = 1000 * 60 * 60 * 7.5;
    console.log(
      `Machine duration per machine per day: ${machineDurationPerMachinePerDay}`
    );

    const machineDurationPerMachinePerDateRange =
      machineDurationPerMachinePerDay * dateRange.totalDays;
    console.log(
      `Machine duration per machine per date range: ${machineDurationPerMachinePerDateRange}`
    );

    console.log(`Fetching machines and states...`);
    const [machines, states, previousStates] = await Promise.all([
      machineService.getMachines({}),
      this.getMachineStatusesByDateRange({
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
      }),
      this.getMachineStatusesByDateRange({
        startDate: dateRange.previousStartDate.toISOString(),
        endDate: dateRange.previousEndDate.toISOString(),
      }),
    ]);

    const machineCount = machines.data.length;
    console.log(`Machine count: ${machineCount}`);
    console.log(`Current states count: ${states.data.length}`);
    console.log(`Previous states count: ${previousStates.data.length}`);

    if (machineCount === 0) {
      console.log(`ERROR: No machines found`);
      throw new BadRequestError("No machines found");
    }

    const totalMachineDuration =
      machineDurationPerMachinePerDateRange * machineCount;
    console.log(`Total machine duration: ${totalMachineDuration}`);

    const hoursPerDay = 7.5;
    const msPerHour = 60 * 60 * 1000;
    const totalAvailableTime =
      hoursPerDay * msPerHour * dateRange.totalDays * machineCount;

    const { totalsByState, activeTime } = this.calculateStatusTotals(
      states.data,
      dateRange.startDate,
      dateRange.endDate,
      now
    );

    const utilization = (activeTime / totalAvailableTime) * 100;

    console.log(`Metrics:`);
    console.log(`  Total available time: ${totalAvailableTime}ms`);
    console.log(`  Total active time: ${activeTime}ms`);
    console.log(`  Utilization: ${utilization.toFixed(2)}%`);

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

    console.log(`Calculating division utilizations...`);
    const activePercentagesWithinEachDivisionTime = divisions.map(
      (division) => {
        console.log(`Processing division: ${division.label}`);
        const { activeTime: divisionActiveTime } = this.calculateStatusTotals(
          states.data,
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
          stateTotals: this.calculateStatusTotals(
            states.data,
            division.start,
            division.end,
            now
          ).totalsByState,
        };
      }
    );

    const { totalsByState: previousTotalsByState } = this.calculateStatusTotals(
      previousStates.data,
      dateRange.previousStartDate,
      dateRange.previousEndDate,
      now
    );

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
      success: true,
      data: {
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
        machines: machines.data.map((machine) => ({
          id: machine.id,
          name: machine.name,
          type: machine.type,
        })),
        alarms: [],
      },
    };
  }

  async getMachineTimeline(startDate: string, endDate: string) {
    return {
      success: true,
      data: [],
    };
  }

  async createMachineStatus(machineStatus: IMachineStatus) {
    this.validateMachineStatus(machineStatus);

    await MachineStatus.update(
      { endTime: new Date() },
      { where: { machineId: machineStatus.machineId } }
    );

    await MachineStatus.create(machineStatus);
  }

  async pollMachines() {
    const machines = await machineService.getMachines({});
    const current = [];

    for (const machine of machines.data) {
      if (machine.connectionType === MachineConnectionType.MTCONNECT) {
        try {
          const data = await this.pollMazakData(machine.id);
          current.push({
            machineId: machine.id,
            machineName: machine.name,
            machineType: machine.type,
            ...data,
          });
        } catch (error) {
          // logger.error(`Error polling machine ${machine.id}:`, error);
          current.push({
            machineId: machine.id,
            machineName: machine.name,
            machineType: machine.type,
            ...this.offlineState,
          });
        }
      }
    }

    const socketService = getSocketService();
    socketService.broadcastMachineStates(current);
    return current;
  }

  startPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    this.pollInterval = setInterval(() => this.pollMachines(), 1000);
  }

  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  async pollMazakData(machineId: string) {
    const machine = await machineService.getMachine(machineId);

    if (!machine) {
      throw new NotFoundError("Machine not found");
    }

    if (!machine.connectionHost || !machine.connectionPort) {
      throw new BadRequestError("Machine is missing connection information");
    }

    const url = `http://${machine.connectionHost}:${machine.connectionPort}/current`;
    const data = await this.fetchMachineData(url);
    const newState = await this.processMazakData(data);

    const cachedState = await cacheService.get(
      `machine:${machineId}:current_state`
    );

    // Always determine state based on the data we have
    const state = await this.determineMachineState(newState, cachedState);
    newState.state = state;

    const hasChanged = await hasThisChanged(newState, cachedState);

    if (hasChanged) {
      await cacheService.set(`machine:${machineId}:current_state`, newState);
    }

    return newState;
  }

  private async fetchMachineData(url: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000);

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok)
        throw new BadRequestError(`HTTP error: ${response.status}`);
      return await response.text();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async processMazakData(xml: string): Promise<any> {
    const extractValue = (xml: string, dataItemId: string): string | null => {
      const regex = new RegExp(
        `<[^>]*dataItemId="${dataItemId}"[^>]*>([^<]*)</[^>]*>`
      );
      const match = xml.match(regex);
      return match ? match[1] : null;
    };

    const cleanProgramComment = (comment: string): string => {
      return comment
        .replace(/&quot;/g, '"')
        .replace(/[&<>]/g, "")
        .replace(/\s+/g, " ")
        .trim();
    };

    // Get program info
    const program = extractValue(xml, "pgm");
    const programComment = cleanProgramComment(extractValue(xml, "pcmt") || "");
    const tool = extractValue(xml, "tid");

    // Get execution state
    const execution = extractValue(xml, "exec");
    const controller = extractValue(xml, "mode");

    // Get feed rate
    const feedRate = extractValue(xml, "pf");

    // Get spindle speeds
    const spindleSpeeds = [
      extractValue(xml, "cs"), // C axis
      extractValue(xml, "cs2"), // C2 axis
      extractValue(xml, "cs3"), // C3 axis
      extractValue(xml, "cs4"), // C4 axis
    ].filter((speed) => speed !== null);

    const spindleSpeed =
      spindleSpeeds.length > 0
        ? Math.max(...spindleSpeeds.map((s) => parseFloat(s || "0")))
        : 0;

    // Get axis positions
    const xPos = extractValue(xml, "xp");
    const yPos = extractValue(xml, "yp");
    const zPos = extractValue(xml, "zp");

    return {
      execution,
      controller,
      program: `${program} - ${programComment}`,
      tool,
      metrics: {
        spindleSpeed,
        feedRate: parseFloat(feedRate || "0"),
        axisPositions: {
          X: parseFloat(xPos || "0"),
          Y: parseFloat(yPos || "0"),
          Z: parseFloat(zPos || "0"),
        },
      },
    };
  }

  async processFanucData(data: any, machineId: string) {
    return data;
  }

  private async determineMachineState(current: any, previous: any) {
    if (!current) return MachineState.OFFLINE;

    if (current.execution === "ACTIVE") return MachineState.ACTIVE;

    if (current.execution === "STOPPED") return MachineState.IDLE;

    if (this.hasMovement(current, previous)) {
      return MachineState.SETUP;
    }

    return MachineState.IDLE;
  }

  private hasMovement(current: any, previous: any): boolean {
    if (!previous) return false;

    if (current.metrics.spindleSpeed !== previous.metrics.spindleSpeed) {
      return true;
    }

    if (current.metrics.feedRate !== previous.metrics.feedRate) {
      return true;
    }

    const axes = ["X", "Y", "Z"];
    for (const axis of axes) {
      if (
        current.metrics.axisPositions[axis] !==
        previous.metrics.axisPositions[axis]
      ) {
        return true;
      }
    }

    if (current.tool !== previous.tool) {
      return true;
    }

    return false;
  }

  private calculateStatusTotals(
    statuses: IMachineStatus[],
    startDate: Date,
    endDate: Date,
    now: Date
  ): { totalsByState: Record<string, number>; activeTime: number } {
    const totalsByState: Record<string, number> = {};
    let activeTime = 0;

    // Group states by machine
    const statusesByMachine = statuses.reduce((acc, status) => {
      if (!acc[status.machineId]) {
        acc[status.machineId] = [];
      }
      acc[status.machineId].push(status);
      return acc;
    }, {} as Record<string, IMachineStatus[]>);

    // Calculate for each machine
    Object.values(statusesByMachine).forEach((machineStatuses) => {
      // Filter states within the date range
      const relevantStatuses = machineStatuses.filter((status) => {
        const statusEnd = status.endTime || now;
        return status.startTime <= endDate && statusEnd >= startDate;
      });

      // Calculate totals for each state
      relevantStatuses.forEach((status) => {
        if (!totalsByState[status.state]) {
          totalsByState[status.state] = 0;
        }

        const statusStart = status.startTime;
        const statusEnd = status.endTime || now;

        // Calculate overlap with the date range
        const overlapStart = Math.max(
          statusStart.getTime(),
          startDate.getTime()
        );
        const overlapEnd = Math.min(statusEnd.getTime(), endDate.getTime());
        const overlapDuration = overlapEnd - overlapStart;

        totalsByState[status.state] += overlapDuration;

        // Track active time separately
        if (status.state === "ACTIVE") {
          activeTime += overlapDuration;
        }
      });
    });

    return { totalsByState, activeTime };
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

    return formatters[scale as keyof typeof formatters]?.(date) || "";
  }

  private validateMachineStatus(machineStatus: IMachineStatus) {
    if (!machineStatus.machineId)
      throw new BadRequestError("Machine ID is required");

    if (!machineStatus.startTime)
      throw new BadRequestError("Start time is required");

    if (!machineStatus.state) throw new BadRequestError("State is required");

    if (
      machineStatus.endTime &&
      machineStatus.endTime < machineStatus.startTime
    )
      throw new BadRequestError("End time cannot be before start time");
  }
}

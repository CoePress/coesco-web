import { buildQuery, createDateRange } from "@/utils";
import { IQueryParams } from "@/types/api.types";
import MachineStatus from "@/models/machine-status";
import { cacheService, getSocketService, machineService } from ".";
import {
  BadRequestError,
  InternalServerError,
} from "@/middleware/error.middleware";
import { Op } from "sequelize";
import { IMachineStatus } from "@/types/schema.types";
import { MachineState, MachineConnectionType } from "@/types/enum.types";
import { config } from "@/config/config";
import { logger } from "@/utils/logger";

interface CachedMachineState {
  state: MachineState;
  execution: string | null;
  controller: string | null;
  program: string | null;
  tool: string | null;
  metrics: {
    spindleSpeed: number;
    feedRate: number;
    axisPositions: {
      X: number;
      Y: number;
      Z: number;
    };
  };
  alarm: string | null;
  timestamp: string;
}

export class MachineDataService {
  private pollInterval: NodeJS.Timeout | null = null;
  private readonly POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
  private machines: any[] = [];
  private lastFetchTime: number = 0;
  private readonly MACHINES_CACHE_KEY = "machines:list";
  private readonly MACHINES_CACHE_TTL = 5 * 60; // 5 minutes in seconds
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
    await this.fetchAndCacheMachines(); // Initial fetch
  }

  private async initializeMachineStates() {
    try {
      const machines = await machineService.getMachines({});

      if (!machines?.data) {
        logger.error("No machines found or invalid response");
        return;
      }

      for (const machine of machines.data) {
        if (!machine?.id) {
          logger.error("Invalid machine data:", machine);
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
      logger.error("Error initializing machine states:", error);
    }
  }

  private async fetchAndCacheMachines() {
    logger.info(`Fetching and caching machines...`);
    try {
      const machines = await machineService.getMachines({});
      if (machines?.data) {
        this.machines = machines.data;
        this.lastFetchTime = Date.now();
        await cacheService.set(
          this.MACHINES_CACHE_KEY,
          machines.data,
          this.MACHINES_CACHE_TTL
        );
      }
    } catch (error) {
      logger.error("Error fetching machines:", error);
    }
  }

  async refreshMachines() {
    await this.fetchAndCacheMachines();
    return this.machines;
  }

  // Machine Statuses
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

  async createMachineStatus(data: any) {
    await this.validateMachineStatus(data);
  }

  async updateMachineStatus(id: string, data: any) {
    await this.validateMachineStatus(data);
  }

  async deleteMachineStatus(id: string) {}

  // Polling methods
  async pollMachines() {
    const current = [];

    const cachedMachines = await cacheService.get(this.MACHINES_CACHE_KEY);
    if (
      !cachedMachines ||
      Date.now() - this.lastFetchTime >= this.POLL_INTERVAL_MS
    ) {
      await this.fetchAndCacheMachines();
    }

    for (const machine of this.machines) {
      try {
        if (!machine.connectionHost || !machine.connectionPort) {
          throw new BadRequestError(
            "Machine is missing connection information"
          );
        }

        const cachedState = await cacheService.get<CachedMachineState>(
          `machine:${machine.id}:current_state`
        );

        let data;
        let state;
        switch (machine.connectionType) {
          case MachineConnectionType.MTCONNECT:
            const xmlData = await this.pollMTConnect(machine);
            data = await this.processMTConnectData(xmlData);
            if (!data) {
              throw new BadRequestError("Failed to process MTConnect data");
            }
            state = await this.determineMTConnectState(data, cachedState);
            break;
          case MachineConnectionType.CUSTOM:
            const fanucData = await this.pollFanuc(machine);
            data = await this.processFanucData(fanucData, machine.id);
            if (!data) {
              throw new BadRequestError("Failed to process Fanuc data");
            }
            state = await this.determineFanucState(data, cachedState);
            break;
          default:
            throw new BadRequestError("Invalid machine connection type");
        }

        if (!data || !state) {
          throw new BadRequestError("Invalid machine data or state");
        }

        const positionChanged = await this.hasMoved(data, cachedState);
        const stateChanged = cachedState?.state !== state;
        const programChanged = cachedState?.program !== data.program;
        const alarmChanged = cachedState?.alarm !== data.alarm;

        const changed =
          stateChanged || positionChanged || programChanged || alarmChanged;

        if (changed) {
          await cacheService.set(`machine:${machine.id}:current_state`, {
            ...data,
            state,
          });
        }

        if (stateChanged || programChanged || alarmChanged) {
          logger.info(
            `Machine ${machine.id} has changed: ${
              stateChanged ? "state" : ""
            } ${programChanged ? "program" : ""} ${alarmChanged ? "alarm" : ""}`
          );
        }

        logger.info(`Machine ${machine.id} state: ${state}`);

        current.push({
          machineId: machine.id,
          machineName: machine.name,
          machineType: machine.type,
          ...data,
          state,
        });
      } catch (error) {
        logger.error(`Machine ${machine.id} ${error}`);
        current.push({
          machineId: machine.id,
          machineName: machine.name,
          machineType: machine.type,
          ...this.offlineState,
        });
      }
    }
    const socketService = getSocketService();
    socketService.broadcastMachineStates(current);
    return current;
  }

  async pollMTConnect(machine: any) {
    const mtconnectUrl = `http://${machine.connectionHost}:${machine.connectionPort}/current`;
    const response = await this.fetchData(mtconnectUrl);
    if (!response) return null;

    const xmlText = await response.text();
    return xmlText;
  }

  async pollFanuc(machine: any) {
    const fanucAdapterUrl = `http://${config.fanucAdapter.host}:${config.fanucAdapter.port}/api/machines/${machine.slug}`;
    const response = await this.fetchData(fanucAdapterUrl);
    if (!response) return null;

    const { data } = await response.json();
    return data;
  }

  async processMTConnectData(xml: string | null) {
    if (!xml) return null;

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

    const program = extractValue(xml, "pgm");
    const programComment = cleanProgramComment(extractValue(xml, "pcmt") || "");
    const programFull = `${program} ${
      programComment ? `- ${programComment}` : ""
    }`;
    const tool = extractValue(xml, "tid");
    const execution = extractValue(xml, "exec");
    const controller = extractValue(xml, "mode");
    const spindleSpeed = parseFloat(extractValue(xml, "cs") || "0");
    const feedRate = parseFloat(extractValue(xml, "pf") || "0");
    const axisPositions = {
      X: parseFloat(extractValue(xml, "xp") || "0"),
      Y: parseFloat(extractValue(xml, "yp") || "0"),
      Z: parseFloat(extractValue(xml, "zp") || "0"),
    };

    return {
      execution,
      controller,
      program: programFull,
      tool,
      metrics: {
        spindleSpeed,
        feedRate,
        axisPositions,
      },
      alarm: extractValue(xml, "alarm"),
      timestamp: new Date().toISOString(),
    };
  }

  async processFanucData(data: any, machineId: string) {
    if (!data) return null;

    return {
      execution: data.execution || null,
      controller: data.controller || null,
      program: data.program || null,
      tool: data.tool || null,
      metrics: {
        spindleSpeed: data.spindleSpeed || 0,
        feedRate: data.feedRate || 0,
        axisPositions: {
          X: data.axisX || 0,
          Y: data.axisY || 0,
          Z: data.axisZ || 0,
        },
      },
      alarm: data.alarm || null,
      timestamp: new Date().toISOString(),
    };
  }

  private async fetchData(url: string, timeoutMs: number = 500) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });

      if (!response.ok) {
        logger.warn(`HTTP error! status: ${response.status} for ${url}`);
        return null;
      }

      return response;
    } catch (error: any) {
      if (error.name === "AbortError") {
        logger.debug(`Request timeout after ${timeoutMs}ms for ${url}`);
        return null;
      }
      logger.warn(`Error fetching ${url}: ${error.message}`);
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async determineMTConnectState(current: any, previous: any) {
    if (!current || !current.execution) return MachineState.OFFLINE;
    if (current.execution === "ALARM") return MachineState.ALARM;
    if (current.execution === "ACTIVE") return MachineState.ACTIVE;
    if (current.execution === "STOPPED") return MachineState.IDLE;

    const hasMoved = await this.hasMoved(current, previous);

    if (previous?.state === MachineState.SETUP && !hasMoved) {
      return MachineState.IDLE;
    }

    if (previous?.state !== MachineState.ACTIVE && hasMoved) {
      return MachineState.SETUP;
    }

    return MachineState.IDLE;
  }

  private async determineFanucState(current: any, previous: any) {
    if (!current || !current.execution) return MachineState.OFFLINE;
    if (current.execution === "ACTIVE") return MachineState.ACTIVE;
    if (current.execution === "STOPPED") return MachineState.IDLE;

    return MachineState.IDLE;
  }

  private async hasMoved(current: any, previous: any): Promise<boolean> {
    if (!current || !previous || !current?.metrics || !previous?.metrics)
      return false;

    const EPSILON = 0.0001;

    const currentSpindleSpeed = Number(current.metrics.spindleSpeed);
    const previousSpindleSpeed = Number(previous.metrics.spindleSpeed);

    if (
      !isNaN(currentSpindleSpeed) &&
      !isNaN(previousSpindleSpeed) &&
      Math.abs(currentSpindleSpeed - previousSpindleSpeed) > EPSILON
    ) {
      return true;
    }

    if (
      Math.abs(current.metrics.feedRate - previous.metrics.feedRate) > EPSILON
    ) {
      return true;
    }

    const axes = ["X", "Y", "Z"];
    for (const axis of axes) {
      if (
        Math.abs(
          current.metrics.axisPositions[axis] -
            previous.metrics.axisPositions[axis]
        ) > EPSILON
      ) {
        return true;
      }
    }

    if (current.tool !== previous.tool) {
      return true;
    }

    return false;
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

  // Helper methods
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

  private async validateMachineStatus(data: any) {
    if (!data.machineId) throw new BadRequestError("Machine ID is required");
    if (!data.startTime) throw new BadRequestError("Start time is required");
    if (!data.state) throw new BadRequestError("State is required");
    if (data.endTime && data.endTime < data.startTime)
      throw new BadRequestError("End time cannot be before start time");
  }
}

// {
//   success: true,
//   message: null,
//   data: {
//     machineId: "c36ce3f1-059b-47a6-86fe-9ba3d43cd43b",
//     execution: "****",
//     controller: "EDIT",
//     program: "C10566-48-UPPER",
//     tool: null,
//     spindleSpeed: 0,
//     feedRate: 0,
//     axisX: 0,
//     axisY: 0,
//     axisZ: 0,
//     axisA: 0,
//     axisB: 0,
//     axisC: 0,
//     alarm: "",
//     timestamp: "2025-05-16T18:22:58.6886247Z",
//   },
//   error: null,
// };

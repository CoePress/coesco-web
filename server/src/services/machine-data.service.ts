import { BadRequestError } from "@/middleware/error.middleware";
import MachineStatus from "@/models/machine-status";
import { IMachineStatus } from "@/types/schema.types";
import { buildQuery, createDateRange } from "@/utils";
import { logger } from "@/utils/logger";
import { IQueryParams } from "@/types/api.types";
import {
  MachineState,
  MachineConnectionType,
  TimeScale,
} from "@/types/enum.types";
import { cacheService, machineService, socketService } from ".";
import { Agent as HttpAgent } from "http";
import { Agent as HttpsAgent } from "https";
import fetch from "node-fetch";
import { Op } from "sequelize";

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
  private readonly FETCH_INTERVAL = 1 * 60 * 1000; // 1 minute
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
      spindleSpeed: 0,
      feedRate: 0,
      axisPositions: {
        X: 0,
        Y: 0,
        Z: 0,
      },
    },
    alarm: null,
    timestamp: new Date().toISOString(),
  };
  private activeRequests: Set<AbortController> = new Set();

  constructor() {
    this.start();
  }

  async initialize() {
    await this.initializeMachineStates();
    await this.fetchAndCacheMachines();
  }

  start() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    this.pollInterval = setInterval(() => this.pollMachines(), 1000);
  }

  async stop() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    await this.closeAllMachineStatuses();

    for (const controller of this.activeRequests) {
      controller.abort();
    }
    this.activeRequests.clear();
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
            state: MachineState.OFFLINE,
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

    console.log(`Machine statuses: ${machineStatuses.length}`);

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

    const machineDurationPerMachinePerDay = 1000 * 60 * 60 * 7.5;

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

    if (machineCount === 0) {
      throw new BadRequestError("No machines found");
    }

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

    const stateTotal = Object.values(totalsByState).reduce(
      (acc, total) => acc + total,
      0
    );

    const percentsByState = Object.entries(totalsByState).map(
      ([state, total]) => ({
        state,
        total,
        percentage: stateTotal === 0 ? 0 : (total / stateTotal) * 100,
      })
    );

    const { scale, divisionCount } = this.getOverviewScale(
      dateRange.startDate,
      dateRange.endDate
    );

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

    const utilizationByDivision = divisions.map((division) => {
      const { activeTime: divisionActiveTime } = this.calculateStatusTotals(
        states.data,
        division.start,
        division.end,
        now
      );

      const divisionDuration =
        division.end.getTime() - division.start.getTime();
      const divisionTotalTime = divisionDuration * machineCount;

      // Check if the division is in the future
      const isFuture = division.start > now;

      const divisionUtilization = isFuture
        ? null
        : divisionTotalTime === 0
        ? 0
        : (divisionActiveTime / divisionTotalTime) * 100;

      return {
        label: division.label,
        start: division.start,
        end: division.end,
        utilization:
          divisionUtilization === null
            ? null
            : Number(divisionUtilization.toFixed(2)),
        stateTotals: this.calculateStatusTotals(
          states.data,
          division.start,
          division.end,
          now
        ).totalsByState,
      };
    });

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
        utilization: utilizationByDivision,
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
    const machines = await machineService.getMachines({});

    const m = machines.data.map((machine) => {
      return {
        id: machine.id,
        name: machine.name,
        type: machine.type,
      };
    });

    if (machines.data.length === 0) {
      throw new BadRequestError("No machines found");
    }

    return {
      success: true,
      data: {
        machines: m,
      },
    };
  }

  async createMachineStatus(data: any) {
    await this.validateMachineStatus(data);

    const transaction = await MachineStatus.sequelize!.transaction();

    try {
      await MachineStatus.update(
        {
          endTime: new Date(),
          duration: new Date().getTime() - new Date(data.startTime).getTime(),
        },
        {
          where: {
            machineId: data.machineId,
            endTime: null,
          },
          transaction,
        }
      );

      const machineStatus = await MachineStatus.create(
        {
          ...data,
          startTime: new Date(),
          endTime: null,
        },
        { transaction }
      );

      await transaction.commit();
      return machineStatus;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async updateMachineStatus(id: string, data: any) {
    await this.validateMachineStatus(data);
  }

  // Polling methods
  async pollMachines() {
    const current = [];

    const cachedMachines = await cacheService.get(this.MACHINES_CACHE_KEY);
    if (
      !cachedMachines ||
      Date.now() - this.lastFetchTime >= this.FETCH_INTERVAL
    ) {
      await this.fetchAndCacheMachines();
    }

    for (const machine of this.machines) {
      let cachedState: CachedMachineState | null = null;
      try {
        if (!machine.connectionHost || !machine.connectionPort) {
          throw new BadRequestError(
            "Machine is missing connection information"
          );
        }

        cachedState = await cacheService.get<CachedMachineState>(
          `machine:${machine.id}:current_state`
        );

        let data;
        let state;

        const machineData = await this.pollMachine(machine);

        if (!machineData) {
          throw new BadRequestError("Failed to poll machine data");
        }

        switch (machine.connectionType) {
          case MachineConnectionType.MTCONNECT:
            data = await this.processMTConnectData(machineData);
            if (!data) {
              throw new BadRequestError("Failed to process MTConnect data");
            }
            state = await this.determineMTConnectState(data, cachedState);
            break;
          case MachineConnectionType.CUSTOM:
            data = await this.processFanucData(machineData);
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

        const openStatus = await MachineStatus.findOne({
          where: {
            machineId: machine.id,
            endTime: null,
          },
        });

        if (!openStatus || openStatus.state !== state) {
          try {
            if (openStatus) {
              openStatus.endTime = new Date();
              openStatus.duration =
                new Date().getTime() - new Date(openStatus.startTime).getTime();
              await openStatus.save();
            }

            await MachineStatus.create({
              machineId: machine.id,
              state,
              execution: data.execution,
              controller: data.controller,
              program: data.program,
              tool: data.tool,
              metrics: data.metrics,
              alarmCode: data.alarm,
              startTime: new Date(),
              endTime: null,
              duration: 0,
            } as any);
          } catch (error) {
            logger.error(
              `Failed to create new state record for machine ${machine.id}:`,
              error
            );
          }
        }

        await cacheService.set(`machine:${machine.id}:current_state`, {
          ...data,
          state,
        });

        current.push({
          machineId: machine.id,
          machineName: machine.name,
          machineType: machine.type,
          ...data,
          state,
        });
      } catch (error) {
        const openStatus = await MachineStatus.findOne({
          where: {
            machineId: machine.id,
            endTime: null,
          },
        });

        if (!openStatus || openStatus.state !== MachineState.OFFLINE) {
          try {
            if (openStatus) {
              openStatus.endTime = new Date();
              openStatus.duration =
                new Date().getTime() - new Date(openStatus.startTime).getTime();
              await openStatus.save();
            }

            await MachineStatus.create({
              machineId: machine.id,
              state: MachineState.OFFLINE,
              execution: "OFFLINE",
              controller: "OFFLINE",
              program: "",
              tool: "",
              metrics: this.offlineState.metrics,
              startTime: new Date(),
              endTime: null,
              duration: 0,
            } as any);
          } catch (error) {
            logger.error(
              `Failed to create offline state for machine ${machine.id}:`,
              error
            );
          }
        }

        await cacheService.set(`machine:${machine.id}:current_state`, {
          ...this.offlineState,
        });

        current.push({
          machineId: machine.id,
          machineName: machine.name,
          machineType: machine.type,
          ...this.offlineState,
        });
      }
    }
    socketService.broadcastMachineStates(current);
    return current;
  }

  async pollMachine(machine: any) {
    const isMTConnect =
      machine.connectionType === MachineConnectionType.MTCONNECT;

    const url = isMTConnect
      ? `http://${machine.connectionHost}:${machine.connectionPort}/current`
      : `https://localhost:7043/api/machines/${machine.slug}`;

    const response = await this.fetchData(url);
    if (!response) {
      return null;
    }

    if (isMTConnect) {
      return await response.text();
    } else {
      const { data } = await response.json();
      return data;
    }
  }

  async processMTConnectData(xml: string | null) {
    if (!xml) {
      return null;
    }

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

  async processFanucData(data: any) {
    if (!data) {
      return null;
    }

    return {
      execution: data.execution,
      controller: data.controller,
      program: data.program,
      tool: data.tool,
      metrics: {
        spindleSpeed: data.spindleSpeed,
        feedRate: data.feedRate,
        axisPositions: {
          X: data.axisX,
          Y: data.axisY,
          Z: data.axisZ,
        },
      },
      alarm: data.alarm,
      timestamp: new Date().toISOString(),
    };
  }

  private async fetchData(url: string, timeoutMs: number = 500) {
    const controller = new AbortController();
    this.activeRequests.add(controller);
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const isHttps = url.startsWith("https://");
      const agent = isHttps
        ? new HttpsAgent({ rejectUnauthorized: false })
        : new HttpAgent();

      const response = await fetch(url, {
        agent,
        signal: controller.signal as any,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });

      if (!response.ok) {
        return null;
      }

      return response;
    } catch (error: any) {
      return null;
    } finally {
      clearTimeout(timeout);
      this.activeRequests.delete(controller);
    }
  }

  private async determineMTConnectState(current: any, previous: any) {
    if (!current || !current.execution) {
      return MachineState.OFFLINE;
    }

    if (current.execution === "ALARM") {
      return MachineState.ALARM;
    }

    if (current.execution === "ACTIVE" || current.execution === "FEED_HOLD") {
      return MachineState.ACTIVE;
    }

    if (current.execution === "STOPPED") {
      return MachineState.IDLE;
    }

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
    if (!current || !current.execution) {
      return MachineState.OFFLINE;
    }

    return current.execution.toUpperCase();
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

  private calculateStatusTotals(
    statuses: IMachineStatus[],
    startDate: Date,
    endDate: Date,
    now: Date
  ): { totalsByState: Record<string, number>; activeTime: number } {
    const totalsByState: Record<string, number> = {};
    let activeTime = 0;

    const statusesByMachine = statuses.reduce((acc, status) => {
      if (!acc[status.machineId]) {
        acc[status.machineId] = [];
      }
      acc[status.machineId].push(status);
      return acc;
    }, {} as Record<string, IMachineStatus[]>);

    Object.values(statusesByMachine).forEach((machineStatuses) => {
      const relevantStatuses = machineStatuses.filter((status) => {
        const statusEnd = status.endTime || now;
        return status.startTime <= endDate && statusEnd >= startDate;
      });

      relevantStatuses.forEach((status) => {
        if (!totalsByState[status.state]) {
          totalsByState[status.state] = 0;
        }

        const statusStart = status.startTime;
        const statusEnd = status.endTime || now;

        const overlapStart = Math.max(
          statusStart.getTime(),
          startDate.getTime()
        );
        const overlapEnd = Math.min(statusEnd.getTime(), endDate.getTime());
        const overlapDuration = overlapEnd - overlapStart;

        totalsByState[status.state] += overlapDuration;

        if (status.state === MachineState.ACTIVE) {
          activeTime += overlapDuration;
        }
      });
    });

    return { totalsByState, activeTime };
  }

  private getOverviewScale(startDate: Date, endDate: Date) {
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays <= 3) {
      return { scale: TimeScale.HOUR, divisionCount: Math.ceil(diffDays * 24) };
    } else if (diffDays <= 20) {
      return { scale: TimeScale.DAY, divisionCount: Math.ceil(diffDays) };
    } else if (diffDays <= 84) {
      return { scale: TimeScale.WEEK, divisionCount: Math.ceil(diffDays / 7) };
    } else if (diffDays <= 548) {
      return {
        scale: TimeScale.MONTH,
        divisionCount: Math.ceil(diffDays / 30.4375),
      };
    } else if (diffDays <= 548) {
      return {
        scale: TimeScale.QUARTER,
        divisionCount: Math.ceil(diffDays / 91.3125),
      };
    } else {
      return {
        scale: TimeScale.YEAR,
        divisionCount: Math.ceil(diffDays / 365.25),
      };
    }
  }

  private calculateDivisionStart(
    startDate: Date,
    scale: string,
    index: number
  ): Date {
    const start = new Date(startDate);
    switch (scale) {
      case TimeScale.HOUR:
        start.setHours(start.getHours() + index);
        break;
      case TimeScale.DAY:
        start.setDate(start.getDate() + index);
        break;
      case TimeScale.WEEK:
        start.setDate(start.getDate() + index * 7);
        break;
      case TimeScale.MONTH:
        start.setMonth(start.getMonth() + index);
        break;
      case TimeScale.QUARTER:
        start.setMonth(start.getMonth() + index * 3);
        break;
      case TimeScale.YEAR:
        start.setFullYear(start.getFullYear() + index);
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
      case TimeScale.HOUR:
        end.setHours(end.getHours() + index + 1);
        break;
      case TimeScale.DAY:
        end.setDate(end.getDate() + index + 1);
        break;
      case TimeScale.WEEK:
        end.setDate(end.getDate() + (index + 1) * 7);
        break;
      case TimeScale.MONTH:
        end.setMonth(end.getMonth() + index + 1);
        break;
      case TimeScale.QUARTER:
        end.setMonth(end.getMonth() + (index + 1) * 3);
        break;
      case TimeScale.YEAR:
        end.setFullYear(end.getFullYear() + index + 1);
        break;
    }
    return end > limit ? limit : end;
  }

  private formatDivisionLabel(date: Date, scale: string): string {
    const formatters = {
      [TimeScale.HOUR]: (d: Date) => {
        const hours = (d.getUTCHours() - 4 + 24) % 12 || 12;
        const ampm = (d.getUTCHours() - 4 + 24) % 24 < 12 ? "AM" : "PM";
        return `${hours}:00 ${ampm}`;
      },
      [TimeScale.DAY]: (d: Date) =>
        d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      [TimeScale.WEEK]: (d: Date) =>
        `Week of ${d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}`,
      [TimeScale.MONTH]: (d: Date) =>
        d.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      [TimeScale.QUARTER]: (d: Date) =>
        `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`,
      [TimeScale.YEAR]: (d: Date) => d.getFullYear().toString(),
    };

    return formatters[scale as keyof typeof formatters]?.(date) || "";
  }

  private async validateMachineStatus(data: any) {
    if (!data.machineId) {
      throw new BadRequestError("Machine ID is required");
    }
    if (!data.startTime) {
      throw new BadRequestError("Start time is required");
    }
    if (!data.state) {
      throw new BadRequestError("State is required");
    }
    if (data.endTime && data.endTime < data.startTime) {
      throw new BadRequestError("End time cannot be before start time");
    }
  }

  async closeMachineStatus(machineId: string) {
    const machineStatus = await MachineStatus.findOne({
      where: {
        machineId,
        endTime: null,
      },
    });

    if (!machineStatus) {
      throw new BadRequestError("Machine status not found");
    }

    machineStatus.endTime = new Date();
    await machineStatus.save();

    return machineStatus;
  }

  async closeAllMachineStatuses() {
    const transaction = await MachineStatus.sequelize!.transaction();

    try {
      const now = new Date();
      const openStatuses = await MachineStatus.findAll({
        where: {
          endTime: null,
        },
        transaction,
      });

      for (const status of openStatuses) {
        status.endTime = now;
        status.duration = now.getTime() - new Date(status.startTime).getTime();
        await status.save({ transaction });

        await cacheService.delete(`machine:${status.machineId}:current_state`);
      }

      await transaction.commit();
      return openStatuses;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

import type { Machine, Prisma } from "@prisma/client";

import { MachineControllerType, MachineState } from "@prisma/client";
import axios from "axios";
import { Agent as HttpAgent } from "node:http";
import { Agent as HttpsAgent } from "node:https";

import { env } from "@/config/env";
import { BadRequestError } from "@/middleware/error.middleware";
import { machineRepository, machineStatusRepository } from "@/repositories";
import { TimeScale } from "@/types/enums";
import { buildDateRangeFilter, createDateRange } from "@/utils";
import { logger } from "@/utils/logger";
import { prisma } from "@/utils/prisma";

import { cacheService, socketService } from "..";

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

export class MachineMonitorService {
  private pollInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;
  private isStarted = false;
  private readonly offlineState = {
    state: MachineState.OFFLINE,
    execution: "OFFLINE",
    controller: "OFFLINE",
    program: "",
    tool: "",
    metrics: {
      spindleSpeed: 0,
      feedRate: 0,
      axisPositions: {
        X: 0,
        Y: 0,
        Z: 0,
      },
    },
    alarm: "",
    timestamp: new Date().toISOString(),
  };

  private activeRequests: Set<AbortController> = new Set();

  async initialize() {
    if (this.isInitialized && this.isStarted) {
      logger.debug("Machine monitor initialized");
      return;
    }

    try {
      const machines = await machineRepository.getAll();

      if (!machines?.data) {
        throw new Error("No machines found or invalid response");
      }

      for (const machine of machines.data) {
        if (!machine?.id) {
          logger.error("Invalid machine data:", machine);
          continue;
        }

        const cachedState = await cacheService.get(
          `machine:${machine.id}:current_state`,
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
            initialState,
          );
        }
      }

      if (this.pollInterval) {
        clearInterval(this.pollInterval);
      }
      this.pollInterval = setInterval(() => this.pollMachines(), 1000);

      this.isInitialized = true;
      this.isStarted = true;
      logger.info("Machine monitor initialized");
    }
    catch (error) {
      logger.error("Failed to initialize machine monitor:", error);
      throw error;
    }
  }

  async stop() {
    if (!this.isStarted) {
      logger.debug("Machine monitor is not started");
      return;
    }

    try {
      logger.info("Stopping machine monitor");

      if (this.pollInterval) {
        clearInterval(this.pollInterval);
        this.pollInterval = null;
      }

      await this.closeAllMachineStatuses();

      for (const controller of this.activeRequests) {
        controller.abort();
      }
      this.activeRequests.clear();

      this.isStarted = false;
      logger.info("Machine monitor stopped successfully");
    }
    catch (error) {
      logger.error("Error stopping machine monitor:", error);
      throw error;
    }
  }

  async getMachineOverview(startDate: string, endDate: string, view: string, timezoneOffset?: number) {
    view = view || "all";
    const now = new Date();
    const dateRange = createDateRange(startDate, endDate, timezoneOffset);

    const { scale, divisionCount } = this.getOverviewScale(
      dateRange.startDate,
      dateRange.endDate,
    );

    const currentDateFilter = buildDateRangeFilter(
      dateRange.startDate.toISOString(),
      dateRange.endDate.toISOString(),
    );

    const previousDateFilter = buildDateRangeFilter(
      dateRange.previousStartDate.toISOString(),
      dateRange.previousEndDate.toISOString(),
    );

    type MachineStatusWithMachine = Prisma.MachineStatusGetPayload<{
      include: { machine: true };
    }>;

    const [machines, statesResponse, previousStatesResponse] = await Promise.all([
      machineRepository.getAll(),
      machineStatusRepository.getAll({
        filter: JSON.stringify(currentDateFilter),
        include: { machine: true },
      }),
      machineStatusRepository.getAll({
        filter: JSON.stringify(previousDateFilter),
        include: { machine: true },
      }),
    ]);

    const states = statesResponse as { data: MachineStatusWithMachine[] };
    const previousStates = previousStatesResponse as { data: MachineStatusWithMachine[] };

    if (!machines.data || !states.data || !previousStates.data) {
      throw new BadRequestError("No machines found");
    }

    const machineCount = machines.data.filter((machine: any) => machine.enabled).length;
    const dailyMachineTarget = 1000 * 60 * 60 * 7.5;
    const dailyFleetTarget = dailyMachineTarget * machineCount;
    const timeframeFleetTarget = dailyFleetTarget * dateRange.totalDays;
    const totalFleetDuration = dateRange.duration * machineCount;

    const futureDuration = Math.max(
      0,
      dateRange.endDate.getTime() - now.getTime(),
    );
    const futureFleetDuration = futureDuration * machineCount;

    const totalsByState = this.calculateStatusTotals(
      states.data,
      dateRange.startDate,
      dateRange.endDate,
      now,
    );

    const _totalStateDuration = Object.values(totalsByState).reduce(
      (acc, total) => acc + total,
      0,
    );

    const activeTime = totalsByState.ACTIVE;
    const totalRecordedTime = Object.values(totalsByState).reduce(
      (acc, total) => acc + total,
      0,
    );
    const totalAvailableFleetTime = totalFleetDuration - futureFleetDuration;
    const unrecordedTime = totalAvailableFleetTime - totalRecordedTime;

    if (unrecordedTime > 0) {
      totalsByState[MachineState.UNKNOWN] = unrecordedTime;
    }

    const divisions = Array.from({ length: divisionCount }, (_, i) => {
      const divisionStart = this.calculateDivisionStart(dateRange.startDate, scale, i);
      const divisionEnd = this.calculateDivisionEnd(
        dateRange.startDate,
        scale,
        i,
        dateRange.endDate,
      );

      // Format label based on CLIENT time (what hour it is for them)
      let label: string;
      if (scale === TimeScale.HOUR) {
        // For hours, use the index as the client hour (0 = midnight, 1 = 1am, etc)
        const clientHour = i % 12 || 12;
        const clientAmPm = i < 12 ? "AM" : "PM";
        label = `${clientHour}:00 ${clientAmPm}`;
      }
      else {
        label = this.formatDivisionLabel(divisionStart, scale);
      }

      return {
        start: divisionStart,
        end: divisionEnd,
        label,
      };
    });

    const previousTotalsByState = this.calculateStatusTotals(
      previousStates.data,
      dateRange.previousStartDate,
      dateRange.previousEndDate,
      now,
    );

    const kpis = this.calculateKPIs(
      activeTime,
      timeframeFleetTarget,
      machineCount,
      states.data,
      previousTotalsByState,
    );

    const utilization = this.calculateUtilizationOverTime(
      divisions,
      states.data,
      machineCount,
      now,
      view,
      machines.data,
      scale,
      timezoneOffset,
    );

    const _totalAvailableTime
      = dateRange.duration * machineCount - futureFleetDuration;

    const stateDistribution = this.calculateStateDistribution(
      totalsByState,
      totalAvailableFleetTime,
    );

    return {
      success: true,
      data: {
        kpis,
        utilization,
        states: stateDistribution,
        machines: this.transformMachineData(machines.data),
        alarms: [],
      },
    };
  }

  async getMachineTimeline(_startDate: string, _endDate: string) {
    const machines = await machineRepository.getAll();

    if (!machines.data) {
      throw new BadRequestError("No machines found");
    }

    const m = machines.data.map((machine: Machine) => {
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
    return await prisma.$transaction(async (tx) => {
      const openStatuses = await tx.machineStatus.findMany({
        where: {
          machineId: data.machineId,
          endTime: null,
        },
      });

      for (const openStatus of openStatuses) {
        await tx.machineStatus.update({
          where: { id: openStatus.id },
          data: {
            endTime: new Date(),
            duration:
              new Date().getTime() - new Date(openStatus.startTime).getTime(),
          },
        });
      }

      return await tx.machineStatus.create({
        data: {
          state: data.state,
          execution: data.execution,
          controller: data.controller,
          program: data.program,
          tool: data.tool,
          metrics: data.metrics,
          alarmCode: data.alarm || "",
          alarmMessage: "",
          startTime: new Date(),
          endTime: null,
          duration: 0,
          machine: {
            connect: {
              id: data.machineId,
            },
          },
        },
      });
    });
  }

  async pollMachines() {
    const current = [];
    const machines = await machineRepository.getAll({
      filter: {
        enabled: true,
      },
    });

    if (!machines.data) {
      throw new BadRequestError("No machines found");
    }

    for (const machine of machines.data) {
      let cachedState: CachedMachineState | null = null;
      try {
        if (!machine.connectionUrl) {
          throw new BadRequestError(
            "Machine is missing connection URL",
          );
        }

        cachedState = await cacheService.get<CachedMachineState>(
          `machine:${machine.id}:current_state`,
        );

        let state;

        const machineData = await this.pollMachine(machine);

        if (!machineData) {
          throw new BadRequestError("Failed to poll machine data");
        }

        const data = await this.processMTConnectData(machineData);
        if (!data) {
          throw new BadRequestError("Failed to process MTConnect data");
        }

        if (data.availability === "UNAVAILABLE") {
          state = MachineState.OFFLINE;
          data.execution = "OFFLINE";
          data.controller = "OFFLINE";
          data.program = "";
          data.tool = "";
          data.metrics = this.offlineState.metrics;
          data.alarm = "";
        }
        else {
          switch (machine.controllerType) {
            case MachineControllerType.MAZAK:
              state = await this.determineMTConnectState(data, cachedState);
              break;
            case MachineControllerType.FANUC:
              state = await this.determineFanucState(data, cachedState);
              break;
            default:
              throw new BadRequestError("Invalid machine connection type");
          }
        }

        if (!data || !state) {
          throw new BadRequestError("Invalid machine data or state");
        }

        const openStatuses = await machineStatusRepository.getAll({
          filter: {
            machineId: machine.id,
            endTime: null,
          },
        });

        const openStatus = openStatuses.data[0];
        const needsNewState = !openStatus || openStatus.state !== state;

        if (needsNewState) {
          try {
            for (const status of openStatuses.data) {
              await machineStatusRepository.update(status.id, {
                endTime: new Date(),
                duration:
                  new Date().getTime() - new Date(status.startTime).getTime(),
              });
            }

            await machineStatusRepository.create({
              state,
              execution: data.execution,
              controller: data.controller,
              program: data.program,
              tool: data.tool,
              metrics: data.metrics,
              alarmCode: data.alarm || "",
              alarmMessage: "",
              startTime: new Date(),
              endTime: null,
              duration: 0,
              machineId: machine.id,
            });
          }
          catch (error) {
            logger.error(
              `Failed to create new state record for machine ${machine.id}: ${
                error instanceof Error ? error.message : error
              }\nData: ${JSON.stringify(
                {
                  state,
                  execution: data.execution,
                  controller: data.controller,
                  program: data.program,
                  tool: data.tool,
                  metrics: data.metrics,
                  alarmCode: data.alarm || "",
                  alarmMessage: "",
                  startTime: new Date(),
                  endTime: null,
                  duration: 0,
                  machine: {
                    connect: {
                      id: machine.id,
                    },
                  },
                },
                null,
                2,
              )}`,
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
      }
      catch {
        const openStatuses = await machineStatusRepository.getAll({
          filter: {
            machineId: machine.id,
            endTime: null,
          },
        });
        const openStatus = openStatuses.data[0];
        const needsOfflineState
          = !openStatus || openStatus.state !== MachineState.OFFLINE;

        if (needsOfflineState) {
          try {
            for (const status of openStatuses.data) {
              await machineStatusRepository.update(status.id, {
                endTime: new Date(),
                duration:
                  new Date().getTime() - new Date(status.startTime).getTime(),
              });
            }

            await machineStatusRepository.create({
              state: MachineState.OFFLINE,
              execution: "OFFLINE",
              controller: "OFFLINE",
              program: "",
              tool: "",
              metrics: this.offlineState.metrics,
              alarmCode: "",
              alarmMessage: "",
              startTime: new Date(),
              endTime: null,
              duration: 0,
              machineId: machine.id,
            });
          }
          catch (error) {
            logger.error(
              `Failed to create offline state for machine ${machine.id}: ${
                error instanceof Error ? error.message : error
              }\nData: ${JSON.stringify(
                {
                  state: MachineState.OFFLINE,
                  execution: "OFFLINE",
                  controller: "OFFLINE",
                  program: "",
                  tool: "",
                  metrics: this.offlineState.metrics,
                  alarmCode: "",
                  alarmMessage: "",
                  startTime: new Date(),
                  endTime: null,
                  duration: 0,
                  machine: {
                    connect: {
                      id: machine.id,
                    },
                  },
                },
                null,
                2,
              )}`,
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

  async processMTConnectData(xml: string | null) {
    if (!xml) {
      return null;
    }

    const extractValue = (xml: string, dataItemId: string): string => {
      const regex = new RegExp(
        `<[^>]*dataItemId="${dataItemId}"[^>]*>([^<]*)</[^>]*>`,
      );
      const match = xml.match(regex);
      return match ? match[1] : "";
    };

    const cleanProgramComment = (comment: string): string => {
      return comment
        .replace(/&quot;/g, "\"")
        .replace(/[&<>]/g, "")
        .replace(/\s+/g, " ")
        .trim();
    };

    const availability = extractValue(xml, "avail") || "";
    const program = extractValue(xml, "pgm") || "";
    const programComment = cleanProgramComment(extractValue(xml, "pcmt") || "");
    const programFull = `${program} ${
      programComment ? `- ${programComment}` : ""
    }`;
    const tool = extractValue(xml, "tid") || "";
    const execution = extractValue(xml, "exec") || "";
    const controller = extractValue(xml, "mode") || "";
    const spindleSpeed = Number.parseFloat(extractValue(xml, "cs") || "0");
    const feedRate = Number.parseFloat(extractValue(xml, "pf") || "0");
    const axisPositions = {
      X: Number.parseFloat(extractValue(xml, "xp") || "0"),
      Y: Number.parseFloat(extractValue(xml, "yp") || "0"),
      Z: Number.parseFloat(extractValue(xml, "zp") || "0"),
    };

    return {
      availability,
      execution,
      controller,
      program: programFull,
      tool,
      metrics: {
        spindleSpeed,
        feedRate,
        axisPositions,
      },
      alarm: extractValue(xml, "alarm") || "",
      timestamp: new Date().toISOString(),
    };
  }

  async pollMachine(machine: Machine) {
    if (!machine.connectionUrl) {
      throw new BadRequestError("Machine connection url is required");
    }

    let apiKey;
    if (machine.controllerType === "FANUC") {
      apiKey = "my-secret-key";
    }

    const response = await this.fetchData(machine.connectionUrl, 500, apiKey);
    if (!response) {
      return null;
    }

    return response.text();
  }

  private async fetchData(url: string, timeoutMs: number = 1000, apiKey?: string) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const isHttps = url.startsWith("https://");
      const agent = isHttps
        ? new HttpsAgent({ rejectUnauthorized: false })
        : new HttpAgent();

      const headers: Record<string, string> = {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      };

      if (apiKey) {
        headers["X-API-Key"] = apiKey;
      }

      const response = await axios.get(url, {
        httpAgent: agent,
        httpsAgent: isHttps ? agent : undefined,
        signal: controller.signal as any,
        headers,
        responseType: "text",
      });

      if (response.status !== 200) {
        logger.warn(`Non-200 response from ${url}: ${response.status}`);
        return null;
      }

      return {
        ok: true,
        text: () => Promise.resolve(response.data),
        json: () => Promise.resolve(JSON.parse(response.data)),
      };
    }
    catch {
      return null;
    }
    finally {
      clearTimeout(timeout);
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

    if (current.execution === "ACTIVE") {
      return MachineState.ACTIVE;
    }

    if (current.execution === "STOPPED") {
      return MachineState.IDLE;
    }

    if (current.alarm && current.alarm !== "") {
      return MachineState.ALARM;
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

  private async hasMoved(current: any, previous: any): Promise<boolean> {
    if (!current || !previous || !current?.metrics || !previous?.metrics)
      return false;

    const EPSILON = 0.0001;

    const currentSpindleSpeed = Number(current.metrics.spindleSpeed);
    const previousSpindleSpeed = Number(previous.metrics.spindleSpeed);

    if (
      !Number.isNaN(currentSpindleSpeed)
      && !Number.isNaN(previousSpindleSpeed)
      && Math.abs(currentSpindleSpeed - previousSpindleSpeed) > EPSILON
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
          current.metrics.axisPositions[axis]
          - previous.metrics.axisPositions[axis],
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
    statuses: any[],
    startDate: Date,
    endDate: Date,
    now: Date,
  ): Record<MachineState, number> {
    const totalsByState: Record<MachineState, number> = {
      [MachineState.ACTIVE]: 0,
      [MachineState.SETUP]: 0,
      [MachineState.IDLE]: 0,
      [MachineState.ALARM]: 0,
      [MachineState.OFFLINE]: 0,
      [MachineState.UNKNOWN]: 0,
    };

    const statusesByMachine = statuses.reduce<Record<string, any[]>>(
      (acc, status) => {
        (acc[status.machineId] ??= []).push(status);
        return acc;
      },
      {},
    );

    for (const machineStatuses of Object.values(statusesByMachine)) {
      for (const status of machineStatuses) {
        const statusStart = new Date(status.startTime);
        const statusEnd = status.endTime ? new Date(status.endTime) : now;

        if (statusStart > endDate || statusEnd < startDate)
          continue;

        const overlapStart = Math.max(
          statusStart.getTime(),
          startDate.getTime(),
        );
        const overlapEnd = Math.min(statusEnd.getTime(), endDate.getTime());

        if (overlapEnd <= overlapStart)
          continue;
        totalsByState[status.state as MachineState]
          += overlapEnd - overlapStart;
      }
    }

    return totalsByState;
  }

  private getOverviewScale(startDate: Date, endDate: Date) {
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays <= 3) {
      return { scale: TimeScale.HOUR, divisionCount: Math.ceil(diffDays * 24) };
    }
    else if (diffDays <= 20) {
      return { scale: TimeScale.DAY, divisionCount: Math.ceil(diffDays) };
    }
    else if (diffDays <= 84) {
      return { scale: TimeScale.WEEK, divisionCount: Math.ceil(diffDays / 7) };
    }
    else if (diffDays <= 548) {
      return {
        scale: TimeScale.MONTH,
        divisionCount: Math.ceil(diffDays / 30.4375),
      };
    }
    else if (diffDays <= 548) {
      return {
        scale: TimeScale.QUARTER,
        divisionCount: Math.ceil(diffDays / 91.3125),
      };
    }
    else {
      return {
        scale: TimeScale.YEAR,
        divisionCount: Math.ceil(diffDays / 365.25),
      };
    }
  }

  private calculateDivisionStart(
    startDate: Date,
    scale: string,
    index: number,
  ): Date {
    const start = new Date(startDate);
    switch (scale) {
      case TimeScale.HOUR:
        start.setUTCHours(start.getUTCHours() + index);
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
    limit: Date,
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
        const hours = d.getUTCHours() % 12 || 12;
        const ampm = d.getUTCHours() < 12 ? "AM" : "PM";
        return `${hours}:00 ${ampm}`;
      },
      [TimeScale.DAY]: (d: Date) =>
        d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
      [TimeScale.WEEK]: (d: Date) =>
        `Week of ${d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          timeZone: "UTC",
        })}`,
      [TimeScale.MONTH]: (d: Date) =>
        d.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" }),
      [TimeScale.QUARTER]: (d: Date) =>
        `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`,
      [TimeScale.YEAR]: (d: Date) => d.getFullYear().toString(),
    };

    return formatters[scale as keyof typeof formatters]?.(date) || "";
  }

  private formatDivisionRangeLabel(
    startDate: Date,
    endDate: Date,
    scale: string,
    timezoneOffset?: number,
  ): string {
    const formatters = {
      [TimeScale.HOUR]: (start: Date, _end: Date) => {
        // Calculate the client's hour based on the start date and timezone offset
        // This should match what we show in the label
        const startUtcHours = start.getUTCHours();
        const offsetHours = (timezoneOffset || 0) / 60;
        const clientStartHour = (startUtcHours - offsetHours + 24) % 24;
        const clientEndHour = (clientStartHour + 1) % 24;

        const startHours = clientStartHour % 12 || 12;
        const startAmpm = clientStartHour < 12 ? "AM" : "PM";
        const endHours = clientEndHour % 12 || 12;
        const endAmpm = clientEndHour < 12 ? "AM" : "PM";

        return `${startHours}:00 ${startAmpm} - ${endHours}:00 ${endAmpm}`;
      },
      [TimeScale.DAY]: (start: Date, end: Date) => {
        const startStr = start.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          timeZone: "UTC",
        });
        const endStr = end.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          timeZone: "UTC",
        });
        return `${startStr} - ${endStr}`;
      },
      [TimeScale.WEEK]: (start: Date, end: Date) => {
        const startStr = start.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          timeZone: "UTC",
        });
        const endStr = end.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          timeZone: "UTC",
        });
        return `${startStr} - ${endStr}`;
      },
      [TimeScale.MONTH]: (start: Date, end: Date) => {
        const startStr = start.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        });
        const endStr = end.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        });
        return `${startStr} - ${endStr}`;
      },
      [TimeScale.QUARTER]: (start: Date, end: Date) => {
        const startQ = `Q${Math.floor(start.getMonth() / 3) + 1} ${start.getFullYear()}`;
        const endQ = `Q${Math.floor(end.getMonth() / 3) + 1} ${end.getFullYear()}`;
        return `${startQ} - ${endQ}`;
      },
      [TimeScale.YEAR]: (start: Date, end: Date) => {
        return `${start.getFullYear()} - ${end.getFullYear()}`;
      },
    };

    return (
      formatters[scale as keyof typeof formatters]?.(startDate, endDate) || ""
    );
  }

  async closeMachineStatus(machineId: string) {
    const openStatuses = await machineStatusRepository.getAll({
      filter: {
        machineId,
        endTime: null,
      },
    });

    if (!openStatuses.data) {
      throw new BadRequestError("Machine status not found");
    }

    return await machineStatusRepository.update(openStatuses.data[0].id, {
      endTime: new Date(),
      duration:
        new Date().getTime()
          - new Date(openStatuses.data[0].startTime).getTime(),
    });
  }

  async closeAllMachineStatuses() {
    return await prisma.$transaction(async (tx) => {
      const now = new Date();
      const openStatuses = await tx.machineStatus.findMany({
        where: {
          endTime: null,
        },
      });

      for (const status of openStatuses) {
        await tx.machineStatus.update({
          where: { id: status.id },
          data: {
            endTime: now,
            duration: now.getTime() - new Date(status.startTime).getTime(),
          },
        });

        await cacheService.delete(`machine:${status.machineId}:current_state`);
      }

      return openStatuses;
    });
  }

  private calculateStateDistribution(
    totalsByState: Record<MachineState, number>,
    totalAvailableTime: number,
  ) {
    const safePercentage = (value: number) => {
      if (totalAvailableTime === 0)
        return 0;
      return (value / totalAvailableTime) * 100;
    };

    return [
      {
        state: MachineState.ACTIVE,
        total: totalsByState[MachineState.ACTIVE] || 0,
        percentage: safePercentage(totalsByState[MachineState.ACTIVE] || 0),
      },
      {
        state: MachineState.SETUP,
        total: totalsByState[MachineState.SETUP] || 0,
        percentage: safePercentage(totalsByState[MachineState.SETUP] || 0),
      },
      {
        state: MachineState.IDLE,
        total: totalsByState[MachineState.IDLE] || 0,
        percentage: safePercentage(totalsByState[MachineState.IDLE] || 0),
      },
      {
        state: MachineState.ALARM,
        total: totalsByState[MachineState.ALARM] || 0,
        percentage: safePercentage(totalsByState[MachineState.ALARM] || 0),
      },
      {
        state: MachineState.OFFLINE,
        total: totalsByState[MachineState.OFFLINE] || 0,
        percentage: safePercentage(totalsByState[MachineState.OFFLINE] || 0),
      },
      {
        state: MachineState.UNKNOWN,
        total: totalsByState[MachineState.UNKNOWN] || 0,
        percentage: safePercentage(totalsByState[MachineState.UNKNOWN] || 0),
      },
    ];
  }

  private calculateKPIs(
    activeTime: number,
    totalAvailableTime: number,
    machineCount: number,
    states: any[],
    previousTotalsByState: Record<MachineState, number>,
  ) {
    const utilization = (activeTime / totalAvailableTime) * 100;
    const averageRuntime = activeTime / machineCount;
    const alarmCount = states.filter(
      state => state.state === MachineState.ALARM,
    ).length;
    const previousAlarmCount = previousTotalsByState[MachineState.ALARM] || 0;
    const alarmChange
      = previousAlarmCount === 0
        ? 0
        : ((alarmCount - previousAlarmCount) / previousAlarmCount) * 100;

    return {
      utilization: {
        value: utilization,
        change: 0,
      },
      averageRuntime: {
        value: averageRuntime,
        change: 0,
      },
      alarmCount: {
        value: alarmCount,
        change: alarmChange,
      },
    };
  }

  private calculateUtilizationOverTime(
    divisions: Array<{ start: Date; end: Date; label: string }>,
    states: Prisma.MachineStatusGetPayload<{ include: { machine: true } }>[],
    machineCount: number,
    now: Date,
    view: string = "all",
    machines: any[],
    scale: string,
    timezoneOffset?: number,
  ) {
    if (view === "all") {
      return divisions.map((division) => {
        const divisionTotals = this.calculateStatusTotals(
          states,
          division.start,
          division.end,
          now,
        );

        const divisionActiveTime = divisionTotals[MachineState.ACTIVE] ?? 0;
        const divisionDuration
          = division.end.getTime() - division.start.getTime();
        const divisionTotalTime = divisionDuration * machineCount;
        const isFuture = division.start > now;

        return {
          label: division.label,
          rangeLabel: this.formatDivisionRangeLabel(
            division.start,
            division.end,
            scale,
            timezoneOffset,
          ),
          start: division.start,
          end: division.end,
          utilization: isFuture
            ? null
            : Number(
                ((divisionActiveTime / divisionTotalTime) * 100).toFixed(2),
              ),
          runtime: divisionActiveTime,
        };
      });
    }

    // Group by machine type or machine ID
    const groupedStates = states.reduce(
      (acc, state) => {
        const key
          = view === "group"
            ? (state.machine?.type ?? "unknown")
            : state.machineId;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(state);
        return acc;
      },
      {} as Record<string, typeof states>,
    );

    const allGroups = new Set<string>();
    if (view === "group") {
      machines.forEach((machine) => {
        if (machine.type) {
          allGroups.add(machine.type);
        }
      });
    }
    else {
      machines.forEach((machine) => {
        if (machine.id) {
          allGroups.add(machine.id);
        }
      });
    }

    return divisions.map((division) => {
      const result: any = {
        label: division.label,
        rangeLabel: this.formatDivisionRangeLabel(
          division.start,
          division.end,
          scale,
          timezoneOffset,
        ),
        start: division.start,
        end: division.end,
        groups: {},
      };

      for (const key of allGroups) {
        const groupStates = groupedStates[key] || [];
        const divisionTotals = this.calculateStatusTotals(
          groupStates as any[],
          division.start,
          division.end,
          now,
        );

        const divisionActiveTime = divisionTotals[MachineState.ACTIVE] ?? 0;
        const divisionDuration
          = division.end.getTime() - division.start.getTime();

        let groupMachineCount = 0;
        if (view === "group") {
          groupMachineCount = machines.filter(m => m.type === key).length;
        }
        else {
          groupMachineCount = machines.find(m => m.id === key) ? 1 : 0;
        }

        const divisionTotalTime = divisionDuration * groupMachineCount;
        const isFuture = division.start > now;

        result.groups[key] = {
          utilization:
            isFuture || divisionTotalTime === 0
              ? null
              : Number(
                  ((divisionActiveTime / divisionTotalTime) * 100).toFixed(2),
                ),
          runtime: divisionActiveTime,
        };
      }

      return result;
    });
  }

  private transformMachineData(machines: any[]) {
    return machines.map(machine => ({
      id: machine.id,
      name: machine.name,
      type: machine.type,
    }));
  }

  async reset() {
    logger.info("Resetting machine monitor service");

    try {
      await this.stop();
      this.isInitialized = false;
      this.isStarted = false;
      logger.info("Machine monitor service reset successfully");
    }
    catch (error) {
      logger.error("Error resetting machine monitor service:", error);
      throw error;
    }
  }

  async resetFanucAdapter() {
    const response = await fetch(
      `http://${env.FANUC_ADAPTER_HOST}:${env.FANUC_ADAPTER_PORT}/api/reset`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    return response.json();
  }
}

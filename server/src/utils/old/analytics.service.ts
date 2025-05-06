import { Services } from ".";
import MachineState from "@/models/machine-state";
import { Op } from "sequelize";

type StateType = "running" | "setup" | "idle" | "error" | "offline" | "future";

interface StateTotals {
  [key: string]: number;
}

interface ChartDivision {
  startedAt: Date;
  endedAt: Date;
  label: string;
  states: StateTotals;
}

interface TimeScale {
  scale: "hourly" | "daily" | "weekly" | "monthly" | "quarterly";
  divisionCount: number;
}

export class AnalyticsService {
  private readonly STATES: StateType[] = [
    "running",
    "setup",
    "idle",
    "error",
    "offline",
    "future",
  ];
  private readonly WORK_HOURS_PER_DAY = 7.5;
  private readonly STATE_MAPPINGS = {
    cutting: "running",
    in_cycle: "running",
    active: "running",
    running: "running",
    setup: "setup",
    preparing: "setup",
    ready: "idle",
    idle: "idle",
    waiting: "idle",
    stopped: "idle",
    interrupted: "error",
    error: "error",
    fault: "error",
    alarm: "error",
  };

  constructor(private services: Services) {}

  async overview(startDate: Date, endDate: Date) {
    const [machines, machineStates] = await Promise.all([
      this.services.machine.getMachines(),
      this.fetchMachineStates(startDate, endDate),
    ]);

    const now = new Date();
    const totalDurationMs = Math.min(
      endDate.getTime() - startDate.getTime(),
      now.getTime() - startDate.getTime()
    );

    const stateTotals = this.calculateStateTotals(
      machineStates,
      machines.length,
      startDate,
      endDate
    );

    const machineTotals = this.calculateMachineTotals(
      machineStates,
      machines,
      startDate,
      endDate
    );

    const chart = await this.generateChart(
      machineStates,
      machines.length,
      startDate,
      endDate
    );

    return {
      startDate,
      endDate,
      totals: stateTotals,
      machineTotals,
      chart,
    };
  }

  async timeline(machineId: string, startDate: Date, endDate: Date) {
    const states = await MachineState.findAll({
      where: {
        machineId,
        [Op.or]: [
          { startedAt: { [Op.between]: [startDate, endDate] } },
          { endedAt: { [Op.between]: [startDate, endDate] } },
        ],
      },
      order: [["startedAt", "ASC"]],
    });

    return states.map(({ startedAt, endedAt, state }) => ({
      startedAt,
      endedAt,
      state,
    }));
  }

  private async fetchMachineStates(startDate: Date, endDate: Date) {
    return MachineState.findAll({
      where: {
        [Op.or]: [
          { startedAt: { [Op.between]: [startDate, endDate] } },
          { endedAt: { [Op.between]: [startDate, endDate] } },
          {
            [Op.and]: [
              { startedAt: { [Op.lte]: startDate } },
              {
                [Op.or]: [
                  { endedAt: { [Op.gte]: endDate } },
                  { endedAt: null },
                ],
              },
            ],
          },
        ],
      },
    });
  }

  private calculateStateDuration(
    state: MachineState,
    periodStart: Date,
    periodEnd: Date
  ): number {
    const now = new Date();
    const stateStart = new Date(
      Math.max(state.startedAt.getTime(), periodStart.getTime())
    );
    const stateEnd = state.endedAt
      ? new Date(
          Math.min(state.endedAt.getTime(), periodEnd.getTime(), now.getTime())
        )
      : new Date(Math.min(periodEnd.getTime(), now.getTime()));

    return Math.max(0, stateEnd.getTime() - stateStart.getTime());
  }

  private calculateStateTotals(
    states: MachineState[],
    machineCount: number,
    startDate: Date,
    endDate: Date
  ): StateTotals {
    const totalDurationMs = endDate.getTime() - startDate.getTime();
    const totals: StateTotals = {
      running: 0,
      setup: 0,
      idle: 0,
      error: 0,
      offline: totalDurationMs * machineCount,
      future: 0,
    };

    states.forEach((state) => {
      const mappedState = this.mapState(state.state);
      const duration = this.calculateStateDuration(state, startDate, endDate);

      totals[mappedState] += duration;
      if (mappedState !== "offline") {
        totals.offline = Math.max(0, totals.offline - duration);
      }
    });

    return totals;
  }

  private calculateMachineTotals(
    states: MachineState[],
    machines: any[],
    startDate: Date,
    endDate: Date
  ) {
    const machineTotals: Record<string, any> = {};
    const now = new Date();
    const elapsedMs = Math.min(
      endDate.getTime() - startDate.getTime(),
      now.getTime() - startDate.getTime()
    );
    const plannedProductionMs =
      (elapsedMs / (24 * 60 * 60 * 1000)) *
      this.WORK_HOURS_PER_DAY *
      60 *
      60 *
      1000;

    machines.forEach((machine) => {
      const machineStates = states.filter((s) => s.machineId === machine.id);
      const totals = this.calculateStateTotals(
        machineStates,
        1,
        startDate,
        endDate
      );
      const totalRunning = totals.running + totals.setup;

      machineTotals[machine.id] = {
        machineName: machine.name,
        machineType: machine.type,
        ...totals,
        availability: (totalRunning / plannedProductionMs) * 100,
      };
    });

    return machineTotals;
  }

  private async generateChart(
    states: MachineState[],
    machineCount: number,
    startDate: Date,
    endDate: Date
  ) {
    const { scale, divisionCount } = await this.getTimeScale(
      startDate,
      endDate
    );
    const divisions: ChartDivision[] = [];
    let divisionStart = new Date(startDate);

    for (let i = 0; i < divisionCount; i++) {
      const divisionEnd = this.calculateDivisionEnd(
        divisionStart,
        scale,
        endDate
      );
      const divisionStates = states.filter((state) =>
        this.isStateInDivision(state, divisionStart, divisionEnd)
      );

      divisions.push({
        startedAt: new Date(divisionStart),
        endedAt: new Date(divisionEnd),
        label: this.formatDivisionLabel(divisionStart, scale),
        states: this.calculateStateTotals(
          divisionStates,
          machineCount,
          divisionStart,
          divisionEnd
        ),
      });

      divisionStart = divisionEnd;
    }

    return { scale, divisionCount, divisions };
  }

  private mapState(state: string): StateType {
    return this.STATE_MAPPINGS[state.toLowerCase()] || "offline";
  }
}

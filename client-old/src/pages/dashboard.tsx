import { format } from "date-fns";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import React, { useCallback, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  BarChart,
  XAxis,
  YAxis,
  Bar,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import Badge from "@/components/badge";
import DateRangePicker from "@/components/date-range-picker";
import Loader from "@/components/shared/loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  TooltipContent,
  TooltipTrigger,
  Tooltip as TooltipS,
} from "@/components/ui/tooltip";
import useGetMachineOverview from "@/hooks/machine-state/use-get-overview";
import useGetTimeline from "@/hooks/machine-state/use-get-timeline";
import useSocket from "@/hooks/context/use-websocket";
import { formatDuration, STATUS_MAPPING } from "@/lib/utils";

interface ITimelineState {
  id: string;
  state: string;
  duration: number;
  startDate: string;
  endDate: string;
}

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: number;
}

interface MachineRowProps {
  machine: any;
  openDrawers: string[];
  onClick: (machineId: string) => void;
  machineData: Record<string, { state: string; data: any }>;
}

const sampleErrors = [
  {
    id: "1",
    machineId: "1",
    error: "Error 1",
    description: "Description 1",
    severity: "High",
    timestamp: "2021-01-01",
  },
];

const useScrollToRow = () => {
  const scrollToRow = useCallback((machineId: string) => {
    const element = document.getElementById(`${machineId}-row`);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
    }
  }, []);

  return scrollToRow;
};

const MetricCard = ({ label, value }: MetricCardProps) => {
  return (
    <Card className="transform transition-all duration-300 border-border rounded-md shadow-md">
      <CardContent className="p-4">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm capitalize font-medium text-muted-foreground text-nowrap truncate">
              {label}
            </p>
          </div>

          <span className="text-lg md:text-xl text-primary tracking-tight truncate">
            {value?.toLocaleString() || 0}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

const MachineRow = ({
  machine,
  openDrawers,
  onClick,
  machineData,
}: MachineRowProps) => {
  const [searchParams] = useSearchParams();
  const startParam = searchParams.get("startDate");
  const endParam = searchParams.get("endDate");

  const isOpen = openDrawers.includes(machine.id);
  const {
    timeline,
    loading: timelineLoading,
    error: timelineError,
  } = useGetTimeline({
    machineId: machine.id,
    startDate: startParam ? new Date(startParam) : undefined,
    endDate: endParam ? new Date(endParam) : undefined,
    enabled: isOpen,
  });

  const scrollToRow = useScrollToRow();

  const handleRowClick = (machineId: string) => {
    onClick(machineId);

    setTimeout(() => {
      scrollToRow(machineId);
    }, 0);
  };

  const currentMachineData = machineData[machine.id];
  const machineState = currentMachineData?.state || "OFFLINE";

  const data = [
    {
      name: "Running",
      value: machine.states?.running || 0,
      className: STATUS_MAPPING.success.fill,
    },
    {
      name: "Setup",
      value: machine.states?.setup || 0,
      className: STATUS_MAPPING.progress.fill,
    },
    {
      name: "Idle",
      value: machine.states?.idle || 0,
      className: STATUS_MAPPING.warning.fill,
    },
    {
      name: "Error",
      value: machine.states?.error || 0,
      className: STATUS_MAPPING.error.fill,
    },
    {
      name: "Offline",
      value: machine.states?.offline || 0,
      className: STATUS_MAPPING.offline.fill,
    },
  ];

  const getProgressBarBase = (availability: number) => {
    if (availability < 50) {
      return STATUS_MAPPING.error.background;
    } else if (availability >= 50 && availability < 75) {
      return STATUS_MAPPING.warning.background;
    } else {
      return STATUS_MAPPING.success.background;
    }
  };

  const getProgressBarFill = (availability: number) => {
    if (availability < 50) {
      return STATUS_MAPPING.error.text;
    } else if (availability >= 50 && availability < 75) {
      return STATUS_MAPPING.warning.text;
    } else {
      return STATUS_MAPPING.success.text;
    }
  };

  return (
    <React.Fragment key={machine.id}>
      <TableRow
        className="cursor-pointer select-none whitespace-nowrap"
        onClick={() => handleRowClick(machine.id)}>
        <TableCell className="font-medium text-sm w-44">
          {machine.name}
        </TableCell>
        <TableCell className="w-44">
          <Badge status={machineState}>{machineState}</Badge>
        </TableCell>
        <TableCell>{}</TableCell>
      </TableRow>
      {isOpen && (
        <TableRow>
          <TableCell
            id={`${machine.id}-row`}
            colSpan={4}
            className="p-0 border-0">
            <div className="w-full p-2 flex flex-col lg:flex-row gap-2">
              <div className="flex flex-col-reverse w-full lg:w-1/2 xl:w-1/3 lg:flex-row">
                <div className="space-y-2 w-full mr-2">
                  <p className="text-sm capitalize font-medium text-muted-foreground text-nowrap truncate">
                    Time
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    {data
                      .filter((state) => state.name !== "Offline")
                      .map((state) => (
                        <div
                          key={state.name}
                          className={`flex flex-col p-2 rounded-md border border-l-4 ${state.className.replace(
                            "fill-",
                            "border-l-"
                          )} w-full`}>
                          <p className="text-sm capitalize font-medium text-muted-foreground text-nowrap truncate">
                            {state.name}
                          </p>
                          <p className="text-sm text-nowrap">
                            {formatDuration(state.value)}
                          </p>
                        </div>
                      ))}
                  </div>

                  <div className="p-2 rounded-md border border-border">
                    <div className="flex justify-between items-center">
                      <p className="text-sm capitalize font-medium text-muted-foreground text-nowrap truncate">
                        Availability
                      </p>
                      <p className="text-sm">
                        {machine.availability.toFixed(2)}%
                      </p>
                    </div>
                    <div
                      className={`w-full border rounded h-3 mt-2 overflow-clip ${getProgressBarBase(machine.availability)}`}>
                      <div
                        className={`h-full ${getProgressBarFill(machine.availability)}`}
                        style={{ width: `${machine.availability}%` }}></div>
                    </div>
                    {machine.availability > 90 && (
                      <Badge
                        className="text-center mt-2"
                        status="success">
                        90% and above is likely due to lights out
                      </Badge>
                    )}
                  </div>
                </div>

                <ResponsiveContainer
                  width={"100%"}
                  height={"100%"}
                  className="min-h-[170px]">
                  <PieChart>
                    <Pie
                      data={data}
                      innerRadius={40}
                      outerRadius={80}
                      dataKey="value"
                      animationDuration={500}
                      animationBegin={0}
                      strokeWidth={1}
                      stroke="hsl(var(--border))">
                      {data.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          className={entry.className}
                        />
                      ))}
                    </Pie>
                    {/* <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.[0]) return null;

                        const totalTime =
                          (machine.cutting[0] || 0) +
                          (machine.moving[0] || 0) +
                          (machine.idle[0] || 0) +
                          (machine.off[0] || 0);

                        const percentage =
                          (((payload[0].value as number) || 0) / totalTime) *
                          100;

                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-md">
                            <p className="text-primary">
                              {payload[0].name}: {percentage.toFixed(2)}%
                            </p>
                          </div>
                        );
                      }}
                    /> */}
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="lg:w-1/2 xl:w-2/3 flex flex-col gap-2 min-h-[170px]">
                <p className="text-sm capitalize font-medium text-muted-foreground text-nowrap truncate">
                  Timeline
                </p>

                <div className="border rounded-md overflow-clip flex-1 relative">
                  <div className="absolute inset-0 overflow-x-auto">
                    <div className="flex flex-col w-full min-w-max h-full">
                      <div className="flex-1">
                        <div className="flex h-full">
                          {timelineLoading && (
                            <div className="flex-1 flex items-center justify-center">
                              <Loader />
                            </div>
                          )}

                          {!timelineLoading && timelineError && (
                            <div className="flex-1 flex items-center justify-center">
                              {timelineError}
                            </div>
                          )}

                          {!timelineLoading &&
                            !timelineError &&
                            timeline === null && (
                              <div className="flex-1 flex items-center justify-center">
                                No timeline found
                              </div>
                            )}

                          {!timelineLoading && !timelineError && timeline && (
                            <>
                              {timeline.states.map((state: ITimelineState) => {
                                const widthInPixels = state.duration / 1000;
                                return (
                                  <TooltipProvider>
                                    <TooltipS delayDuration={0}>
                                      <TooltipTrigger asChild>
                                        <div
                                          key={state.id}
                                          className={`h-full`}
                                          style={{
                                            width: `${widthInPixels}px`,
                                          }}
                                        />
                                      </TooltipTrigger>
                                      <TooltipContent
                                        side="top"
                                        align="center"
                                        className="border shadow-md p-2 bg-background text-primary">
                                        <p>
                                          Status:{" "}
                                          <span className="capitalize">
                                            {state.state}
                                          </span>
                                        </p>
                                        <p>
                                          Start:{" "}
                                          {format(state.startDate, "PPpp")}
                                        </p>
                                        <p>
                                          End: {format(state.endDate, "PPpp")}
                                        </p>
                                        <p>
                                          Duration:{" "}
                                          {formatDuration(state.duration)}
                                        </p>
                                      </TooltipContent>
                                    </TooltipS>
                                  </TooltipProvider>
                                );
                              })}
                            </>
                          )}
                        </div>
                      </div>

                      <div className="w-full flex justify-between leading-none select-none">
                        {timeline &&
                          timeline.labels &&
                          timeline.labels.map(
                            (timeLabel: {
                              label: string;
                              sequence: number;
                            }) => (
                              <span
                                key={timeLabel.sequence}
                                className="text-xs text-muted-foreground min-w-[52px] text-center">
                                {timeLabel.label}
                              </span>
                            )
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </React.Fragment>
  );
};

const TotalsChart = ({ overview }: { overview: any }) => {
  if (!overview?.chart?.divisions) return null;

  const data = overview.chart.divisions.map((division: any) => ({
    label: division.label,
    running: division.states.running,
    setup: division.states.setup,
    idle: division.states.idle,
    error: division.states.error,
    offline: division.states.offline,
    future: division.states.future || 0,
  }));

  return (
    <div className="h-[300px] w-full border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm capitalize font-medium text-muted-foreground">
          State Distribution
        </p>
        <div className="hidden md:flex gap-2 text-sm">
          <span className={STATUS_MAPPING.success.text}>Running</span>
          <span className={STATUS_MAPPING.warning.text}>Idle</span>
          <span className={STATUS_MAPPING.error.text}>Error</span>
          <span className={STATUS_MAPPING.offline.text}>Offline</span>
        </div>
      </div>
      <ResponsiveContainer
        width="100%"
        height="100%">
        <BarChart
          data={data}
          stackOffset="none"
          barGap={0}
          barCategoryGap={0}>
          <XAxis
            dataKey="label"
            className="fill-foreground text-sm"
            stroke="currentColor"
          />
          <YAxis
            className="fill-foreground text-sm"
            stroke="currentColor"
            tickFormatter={(value) =>
              `${((value / (3600000 * 8)) * 100).toFixed(0)}%`
            }
            ticks={[0, 3600000 * 2, 3600000 * 4, 3600000 * 6, 3600000 * 8]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--background)",
              borderColor: "var(--border)",
              padding: "1rem",
              borderRadius: "0.5rem",
            }}
            formatter={(value: number, name: string) => {
              if (name.toLowerCase() === "future") return [null, null];

              let statusKey: keyof typeof STATUS_MAPPING = "offline";

              switch (name.toLowerCase()) {
                case "running":
                  statusKey = "success";
                  break;
                case "setup":
                  statusKey = "progress";
                  break;
                case "idle":
                  statusKey = "warning";
                  break;
                case "error":
                  statusKey = "error";
                  break;
              }

              return [
                <span className={STATUS_MAPPING[statusKey].text}>
                  {formatDuration(value)}
                </span>,
                null,
              ];
            }}
          />
          <Bar
            dataKey="running"
            stackId="status"
            className={STATUS_MAPPING.success.fill}
            name="Running"
          />
          <Bar
            dataKey="setup"
            stackId="status"
            className={STATUS_MAPPING.progress.fill}
            name="Setup"
          />
          <Bar
            dataKey="idle"
            stackId="status"
            className={STATUS_MAPPING.warning.fill}
            name="Idle"
          />
          <Bar
            dataKey="error"
            stackId="status"
            className={STATUS_MAPPING.error.fill}
            name="Error"
          />
          <Bar
            dataKey="offline"
            stackId="status"
            className="fill-neutral-200 dark:fill-card"
            name="Offline"
          />
          <Bar
            dataKey="future"
            stackId="status"
            fill="transparent"
            name="Future"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const RecentErrorsCard = ({ overview }: { overview: any }) => {
  const recentErrors = sampleErrors;

  return (
    <div className="h-[300px] w-full border rounded-lg p-4">
      <p className="text-sm capitalize font-medium text-muted-foreground mb-2">
        Recent Alarms
      </p>
      <div className="h-[calc(100%-2rem)] overflow-y-auto">
        {recentErrors.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            No recent alarms
          </div>
        ) : (
          <div className="space-y-2">
            {recentErrors.map((error: any, index: number) => (
              <div
                key={index}
                className="p-2 border rounded-md bg-background/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {error.error}{" "}
                    <span className="text-xs text-muted-foreground">
                      ({error.machineId})
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(error.timestamp), "PPpp")}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {error.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const [openMachineDrawers, setOpenMachineDrawers] = useState<string[]>([]);
  const [searchParams] = useSearchParams();
  const { machineData } = useSocket();

  const startParam = searchParams.get("startDate");
  const endParam = searchParams.get("endDate");

  const {
    overview,
    loading: overviewLoading,
    error: overviewError,
  } = useGetMachineOverview(
    startParam || endParam
      ? {
          startDate: startParam ? new Date(startParam) : undefined,
          endDate: endParam ? new Date(endParam) : undefined,
        }
      : undefined
  );

  const processOverviewData = (overview: any) => {
    if (!overview?.machineTotals) return { lathes: [], mills: [] };

    const machines = Object.entries(overview.machineTotals).map(
      ([machineId, states]: [string, any]) => {
        return {
          id: machineId,
          name: states.machineName,
          type: states.machineType,
          states: {
            running: states.running || 0,
            setup: states.setup || 0,
            idle: states.idle || 0,
            error: states.error || 0,
            offline: states.offline || 0,
          },
          availability: states.availability || 0,
        };
      }
    );

    const lathes = machines.filter((machine: any) => machine.type === "lathe");
    const mills = machines.filter((machine: any) => machine.type === "mill");

    return { lathes, mills };
  };

  const { lathes, mills } = overview
    ? processOverviewData(overview)
    : { lathes: [], mills: [] };

  const handleMachineClick = (machineId: string) => {
    setOpenMachineDrawers((prev) =>
      prev.includes(machineId)
        ? prev.filter((id) => id !== machineId)
        : [...prev, machineId]
    );
  };

  return (
    <div className="flex-1 flex flex-col h-max p-2 gap-2">
      <div className="flex justify-between items-center">
        <h1>Dashboard</h1>
        <DateRangePicker />
      </div>

      {overviewLoading && (
        <div className="flex w-full items-center justify-center py-20">
          <Loader />
        </div>
      )}

      {overviewError && !overviewLoading && (
        <div className="flex w-full items-center justify-center py-20">
          <div className="flex flex-col items-center justify-center rounded-lg p-4">
            <h3 className="font-semibold mb-2">Unable to Load Overview Data</h3>
            <p className="text-center max-w-md mb-6 text-sm">
              There was a problem loading the machine data. Try again later.
            </p>
            <Button onClick={() => window.location.reload()}>Refresh</Button>
          </div>
        </div>
      )}

      {!overview && !overviewLoading && !overviewError && (
        <div className="flex w-full items-center justify-center py-20">
          <div className="flex flex-col items-center justify-center rounded-lg p-4">
            <h3 className="font-semibold mb-2">No Overview Data Available</h3>
            <Button onClick={() => window.location.reload()}>Refresh</Button>
          </div>
        </div>
      )}

      {overview && !overviewLoading && !overviewError && (
        <>
          <div className="grid grid-cols-2 md:hidden xl:grid xl:grid-cols-8 w-full gap-2">
            {[
              { label: "Running Time", state: "running" },
              { label: "Setup Time", state: "setup" },
              { label: "Idle Time", state: "idle" },
              { label: "Error Time", state: "error" },
            ].map((metric) => {
              const totalTime =
                overview.totals.running +
                overview.totals.setup +
                overview.totals.idle +
                overview.totals.error +
                overview.totals.offline;

              const value = overview.totals[metric.state] || 0;
              const percentage = totalTime > 0 ? (value / totalTime) * 100 : 0;

              return (
                <React.Fragment key={metric.label}>
                  <MetricCard
                    label={metric.label}
                    value={formatDuration(value)}
                  />
                  <MetricCard
                    label={`${metric.label} Percentage`}
                    value={`${percentage.toFixed(1)}%`}
                  />
                </React.Fragment>
              );
            })}
          </div>

          <div className="hidden md:grid grid-cols-4 xl:hidden w-full gap-2">
            {[
              { label: "Running Time", state: "running" },
              { label: "Setup Time", state: "setup" },
              { label: "Idle Time", state: "idle" },
              { label: "Error Time", state: "error" },
            ].map((metric) => {
              const value = overview.totals[metric.state] || 0;

              return (
                <MetricCard
                  key={metric.label}
                  label={metric.label}
                  value={formatDuration(value)}
                />
              );
            })}
            {[
              { label: "Running", state: "running" },
              { label: "Setup", state: "setup" },
              { label: "Idle", state: "idle" },
              { label: "Error", state: "error" },
            ].map((metric) => {
              const totalTime =
                overview.totals.running +
                overview.totals.setup +
                overview.totals.idle +
                overview.totals.error +
                overview.totals.offline;

              const value = overview.totals[metric.state] || 0;
              const percentage = totalTime > 0 ? (value / totalTime) * 100 : 0;

              return (
                <MetricCard
                  key={`${metric.label}-percentage`}
                  label={`${metric.label} Percentage`}
                  value={`${percentage.toFixed(1)}%`}
                />
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-2">
            <div className="lg:col-span-3">
              <TotalsChart overview={overview} />
            </div>
            <div className="lg:col-span-1">
              <RecentErrorsCard overview={overview} />
            </div>
          </div>

          {lathes.length > 0 && (
            <div className="border rounded-lg overflow-hidden w-full">
              <table className="w-full">
                <tbody>
                  {lathes.map((machine: any) => (
                    <MachineRow
                      key={machine.id}
                      machine={machine}
                      openDrawers={openMachineDrawers}
                      onClick={handleMachineClick}
                      machineData={machineData}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {mills.length > 0 && (
            <div className="border rounded-lg overflow-hidden w-full">
              <table className="w-full">
                <tbody>
                  {mills.map((machine: any) => (
                    <MachineRow
                      key={machine.id}
                      machine={machine}
                      openDrawers={openMachineDrawers}
                      onClick={handleMachineClick}
                      machineData={machineData}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DashboardPage;

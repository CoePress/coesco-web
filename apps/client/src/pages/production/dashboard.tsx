import { startOfToday, isSameDay, formatDistance } from "date-fns";
import {
  Gauge,
  AlertTriangle,
  RefreshCcw,
  Clock,
  Map,
  Box,
  Calendar,
  Filter,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/theme.context";

import {
  Card,
  Loader,
  MachineMap,
  Modal,
  PageHeader,
  StatusBadge,
} from "@/components";
import { useSocket } from "@/contexts/socket.context";
import useGetOverview from "@/hooks/production/use-get-overview";
import useGetTimeline from "@/hooks/production/use-get-timeline";
import { formatDuration, getStatusColor, getVariantFromStatus } from "@/utils";
import { IOverviewAlarm, IOverviewMachine } from "@/utils/types";

type ExpandedMachine = IOverviewMachine & {
  status: string;
  program: string;
  execution: string;
  controller: string;
  tool: string;
  spindleSpeed: number;
  feedRate: number;
  axisPositions: Record<string, number>;
  alarmCode?: string;
  alarmMessage?: string;
  startTime: string;
};

type MachineDetailsProps = {
  machine: any;
};

const MachineDetails = ({ machine }: MachineDetailsProps) => {
  const { machineStates } = useSocket();
  const realTimeData = machineStates.find(
    (state) => state.machineId === machine.id
  );

  return (
    <div className="pt-2 text-sm flex flex-col gap-2">
      <div className="grid md:grid-cols-2 gap-2">
        <Card>
          <h4 className="text-sm font-medium mb-2 text-text-muted">
            Status Information
          </h4>
          <div className="grid grid-cols-[1fr_auto] gap-1 text-text-muted">
            <span className="text-muted-foreground">Machine:</span>
            <span className="font-medium text-right">{machine.name}</span>
            <span className="text-muted-foreground">Status:</span>
            <span className="font-medium text-right uppercase">
              {realTimeData?.state || "-"}
            </span>
            <span className="text-muted-foreground">Controller:</span>
            <span className="font-medium text-right">
              {realTimeData?.controller || "-"}
            </span>
            <span className="text-muted-foreground">Execution:</span>
            <span className="font-medium text-right">
              {realTimeData?.execution || "-"}
            </span>
            <span className="text-muted-foreground">Program:</span>
            <span className="font-medium text-right truncate max-w-[200px]">
              {realTimeData?.program || "-"}
            </span>
          </div>
        </Card>

        <Card>
          <h4 className="text-sm font-medium mb-2 text-text-muted">
            Machine Information
          </h4>
          <div className="grid grid-cols-[1fr_auto] gap-1 text-text-muted">
            <span className="text-muted-foreground">Tool:</span>
            <span className="font-medium text-right">
              {realTimeData?.tool || "-"}
            </span>
            <span className="text-muted-foreground">Spindle RPM:</span>
            <span className="font-medium text-right">
              {realTimeData?.metrics?.spindleSpeed || "-"}
            </span>
            <span className="text-muted-foreground">Spindle Load:</span>
            <span className="font-medium text-right">
              {realTimeData?.metrics?.spindleLoad || "-"}
            </span>
            <span className="text-muted-foreground">Feed Rate:</span>
            <span className="font-medium text-right">
              {realTimeData?.metrics?.feedRate || "-"}
            </span>
            <span className="text-muted-foreground">Position:</span>
            <span className="font-medium text-right">
              X:
              {Number(realTimeData?.metrics?.axisPositions?.X || 0).toFixed(
                3
              )}{" "}
              Y:
              {Number(realTimeData?.metrics?.axisPositions?.Y || 0).toFixed(
                3
              )}{" "}
              Z:
              {Number(realTimeData?.metrics?.axisPositions?.Z || 0).toFixed(3)}
            </span>
          </div>
        </Card>
      </div>

      <div className="hidden md:grid grid-cols-2 gap-2">
        <Card>
          <h4 className="text-sm font-medium mb-2 text-text-muted">
            Program History (Last 24h)
          </h4>
          <div className="flex flex-col gap-2">
            {/* {sampleProgramHistory.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2">
                <span className="text-sm font-medium">{item.label}</span>
                <span className="text-sm text-text-muted">
                  {item.timestamp}
                </span>
              </div>
            ))} */}
          </div>
        </Card>

        <Card>
          <h4 className="text-sm font-medium mb-2 text-text-muted">
            State History (Last 24h)
          </h4>
          {/* <ResponsiveContainer
            width="100%"
            height={200}>
            <PieChart>
              <Pie
                key={sampleStateDistribution
                  .map((e) => e.label + e.value)
                  .join("-")}
                data={sampleStateDistribution}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                outerRadius={80}
                isAnimationActive={false}>
                {sampleStateDistribution.map((entry, idx) => (
                  <Cell
                    key={`cell-${idx}`}
                    strokeWidth={0}
                    fill={
                      entry.label === "Offline"
                        ? "var(--surface)"
                        : getStatusColor(entry.label)
                    }
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer> */}
        </Card>
      </div>
    </div>
  );
};

type MachineTimelineProps = {
  startDate: Date;
  endDate: Date;
};

const MachineTimeline = ({ startDate, endDate }: MachineTimelineProps) => {
  const { timeline, loading, error } = useGetTimeline({
    startDate: startDate.toISOString().slice(0, 10),
    endDate: endDate.toISOString().slice(0, 10),
  });

  const intervals = Array.from({ length: 24 }, (_, i) => {
    return `${i.toString().padStart(2, "0")}:00`;
  });

  const intervalRef = useRef<HTMLDivElement>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <Loader />
      </div>
    );
  }

  if (error) {
    return <div>Error</div>;
  }

  return (
    <div className="space-y-4 p-2">
      <div className="overflow-x-auto">
        <div className="min-w-[2600px]">
          <div className="flex border-b bg-background sticky top-0 z-10 w-full">
            <div className="w-44 flex-shrink-0 p-2 font-medium text-sm bg-background sticky left-0 z-20">
              Machine
            </div>
            <div className="flex flex-1">
              {intervals.map((label, i) => (
                <div
                  key={i}
                  ref={intervalRef}
                  className="flex-shrink-0 flex-1 text-xs text-text-muted border-l px-1 text-center"
                  style={{ minWidth: 50 }}>
                  {label}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            {timeline &&
              timeline.machines.map((machine: IOverviewMachine) => (
                <div
                  key={machine.id}
                  className="flex items-center group hover:bg-surface/50">
                  <div className="w-44 flex-shrink-0 p-2 bg-background sticky left-0 z-10">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium whitespace-nowrap truncate">
                        {machine.name}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 flex h-12 relative gap-2">
                    {Array.from({ length: 49 }).map((_, i) => (
                      <div
                        key={i}
                        className={`absolute h-full border-l ${
                          i % 2 === 0 ? "border-border" : "border-border/30"
                        }`}
                        style={
                          intervalRef.current
                            ? {
                                left: `${(i / 48) * 100}%`,
                              }
                            : {}
                        }
                      />
                    ))}
                    {/* {machine.timeline.map((event, index) => {
                      // Convert event timestamps to EST
                      const startDate = getESTDate(new Date(event.startTime));
                      const endDate = getESTDate(event.endTime || new Date());

                      const startMinutes =
                        startDate.getHours() * 60 + startDate.getMinutes();
                      const durationMinutes =
                        (endDate.getTime() - startDate.getTime()) / (1000 * 60);

                      return (
                        <div
                          key={index}
                          className="absolute h-8 top-2 transition-opacity hover:opacity-90 group flex-1"
                          style={{
                            left: `${(startMinutes / 30) * 50}px`,
                            width: `${(durationMinutes / 30) * 50}px`,
                            backgroundColor: getStatusColor(event.state),
                          }}>
                          <div className="h-full flex items-center justify-center text-xs text-white font-medium truncate px-2">
                            {event.state}
                          </div>
                          <div className="absolute bottom-full mb-1 left-0 bg-background border rounded p-2 hidden hover:block whitespace-nowrap z-20 text-xs">
                            <p className="font-medium">{event.state}</p>
                            <p>
                              {startDate.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                              {" - "}
                              {endDate.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                              {" ("}
                              {Math.floor(durationMinutes)}m{")"}
                            </p>
                          </div>
                        </div>
                      );
                    })} */}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="border-t pt-4 flex flex-wrap gap-2">
        {/* {timeline &&
          Array.from(
            new Set(
              timeline.machines
                .flatMap((machine) => machine.timeline)
                .map((x) => x.state)
            )
          ).map((state) => (
            <div
              key={state}
              className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: getStatusColor(state) }}
              />
              <span className="text-sm">{state}</span>
            </div>
          ))} */}
      </div>
    </div>
  );
};

type KPICardProps = {
  title: string;
  value: number | string;
  description: string;
  icon: React.ReactNode;
  change?: number;
};

const KPICard = ({ title, value, description, icon, change }: KPICardProps) => {
  let color;

  const hasChange = change !== undefined && change !== null;

  if (hasChange && change > 0) {
    color = "text-success bg-success/10";
  } else if (hasChange && change < 0) {
    color = "text-error bg-error/10";
  } else {
    color = "text-text-muted bg-surface";
  }

  return (
    <div className="bg-foreground rounded border p-2">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2 text-primary">
          {icon}
          <p className="text-sm text-text-muted ">{title}</p>
        </div>
        {hasChange && (
          <span className={`text-xs ${color} px-2 py-1 rounded`}>
            {change}%
          </span>
        )}
      </div>
      <h3 className="text-xl font-semibold text-text-muted">{value}</h3>
      <p className="text-xs text-text-muted mt-1 hidden md:block">
        {description}
      </p>
    </div>
  );
};

type IOverviewKPI = {
  value: number;
  change: number;
};

type IOverviewKPIs = {
  utilization: IOverviewKPI;
  averageRuntime: IOverviewKPI;
  alarmCount: IOverviewKPI;
};

type IOverview = {
  kpis: IOverviewKPIs;
  utilization: any[];
  states: any[];
  machines: IOverviewMachine[];
  alarms: IOverviewAlarm[];
};

const Dashboard = () => {
  const parseDateParam = (param: string | null, fallback: Date) => {
    if (!param) return fallback;
    const [year, month, day] = param.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    return isNaN(d.getTime()) ? fallback : d;
  };

  const [chartView, setChartView] = useState<"all" | "group" | "machine">(
    "all"
  );
  const [selectedChartFilter, setSelectedChartFilter] = useState<string>("all");
  const [isChartFilterOpen, setIsChartFilterOpen] = useState(false);
  const chartFilterRef = useRef<HTMLDivElement>(null);
  const [visibleLines, setVisibleLines] = useState<string[]>([]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        chartFilterRef.current &&
        !chartFilterRef.current.contains(event.target as Node)
      ) {
        setIsChartFilterOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getChartFilterOptions = () => {
    switch (chartView) {
      case "group":
        return [
          { label: "All Groups", value: "all" },
          ...Array.from(new Set(machines.map((m) => m.type))).map((type) => ({
            label: type.charAt(0).toUpperCase() + type.slice(1),
            value: type,
          })),
        ];
      case "machine":
        return [
          { label: "All Machines", value: "all" },
          ...machines.map((machine) => ({
            label: machine.name,
            value: machine.id,
          })),
        ];
      default:
        return [{ label: "All", value: "all" }];
    }
  };

  const getInitialDateRange = () => {
    const params = new URLSearchParams(window.location.search);
    return {
      start: parseDateParam(params.get("startDate"), startOfToday()),
      end: parseDateParam(params.get("endDate"), new Date()),
    };
  };

  const [dateRange, setDateRange] = useState(getInitialDateRange);
  const { machineStates } = useSocket();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { overview, loading, error, refresh } = useGetOverview({
    startDate: dateRange.start.toISOString().slice(0, 10),
    endDate: dateRange.end.toISOString().slice(0, 10),
    view: chartView,
    filter: selectedChartFilter !== "all" ? selectedChartFilter : undefined,
  }) as {
    overview: IOverview | null;
    loading: boolean;
    error: any;
    refresh: () => void;
  };

  const [selectedMachine, setSelectedMachine] = useState<any | null>(null);
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [machineTypeFilter, setMachineTypeFilter] = useState("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const kpis = [
    {
      title: "Utilization",
      value: `${overview?.kpis?.utilization?.value?.toFixed(2) ?? 0}%`,
      description: "Utilization of machines",
      icon: <Gauge size={16} />,
      change: overview?.kpis?.utilization?.change ?? 0,
    },
    {
      title: "Total Runtime",
      value: formatDuration(
        overview?.kpis?.averageRuntime?.value
          ? overview.kpis.averageRuntime.value * 8
          : 0
      ),
      description: "Total runtime of machines",
      icon: <Clock size={16} />,
      change: 0,
    },
    {
      title: "Average Runtime",
      value: formatDuration(overview?.kpis?.averageRuntime?.value ?? 0),
      description: "Average runtime of machines",
      icon: <Clock size={16} />,
      change: overview?.kpis?.averageRuntime?.change ?? 0,
    },
    {
      title: "Alarms",
      value: overview?.kpis?.alarmCount?.value ?? 0,
      description: "Number of alarms",
      icon: <AlertTriangle size={16} />,
      change: overview?.kpis?.alarmCount?.change ?? 0,
    },
  ];

  const utilizationOverTime = overview?.utilization || [];

  const stateDistribution = overview?.states || [];

  const machines = (overview?.machines || [])
    .sort((a: IOverviewMachine, b: IOverviewMachine) => {
      const typeCompare = a.type.localeCompare(b.type);
      if (typeCompare === 0) {
        return a.name.localeCompare(b.name);
      }
      return typeCompare;
    })
    .map((machine: IOverviewMachine): ExpandedMachine => {
      const realTime = machineStates.find(
        (state) => state.machineId === machine.id
      );
      return {
        ...machine,
        status: realTime?.state || "OFFLINE",
        program: realTime?.program || "-",
        execution: realTime?.execution || "-",
        controller: realTime?.controller || "-",
        tool: realTime?.tool || "-",
        spindleSpeed: realTime?.metrics?.spindleSpeed || 0,
        feedRate: realTime?.metrics?.feedRate || 0,
        axisPositions: realTime?.metrics?.axisPositions || { X: 0, Y: 0, Z: 0 },
        alarmCode: realTime?.alarmCode,
        alarmMessage: realTime?.alarmMessage,
        startTime: realTime?.startTime || new Date().toISOString(),
      };
    });

  const isToday =
    isSameDay(dateRange.start, startOfToday()) &&
    isSameDay(dateRange.end, startOfToday());

  useEffect(() => {
    const startStr = dateRange.start.toISOString().slice(0, 10);
    const endStr = dateRange.end.toISOString().slice(0, 10);
    const isDefault =
      isSameDay(dateRange.start, startOfToday()) &&
      isSameDay(dateRange.end, startOfToday());

    const params = new URLSearchParams(window.location.search);

    if (isDefault) {
      params.delete("startDate");
      params.delete("endDate");
    } else {
      params.set("startDate", startStr);
      params.set("endDate", endStr);
    }

    navigate({ search: params.toString() }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const newStart = parseDateParam(params.get("startDate"), startOfToday());
    const newEnd = parseDateParam(params.get("endDate"), new Date());
    if (
      newStart.getTime() !== dateRange.start.getTime() ||
      newEnd.getTime() !== dateRange.end.getTime()
    ) {
      setDateRange({ start: newStart, end: newEnd });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [window.location.search]);

  // Update visibleLines when utilizationOverTime or chartView changes
  useEffect(() => {
    if (chartView === "group" || chartView === "machine") {
      const keys =
        utilizationOverTime.length > 0
          ? Object.keys(utilizationOverTime[0]?.groups || {})
          : [];
      setVisibleLines(keys);
    } else {
      setVisibleLines([]);
    }
  }, [utilizationOverTime, chartView]);

  // const stateData = [
  //   { name: "Running", value: 45, color: "#22c55e" },
  //   { name: "Idle", value: 25, color: "#fbbf24" },
  //   { name: "Maintenance", value: 15, color: "#f97316" },
  //   { name: "Offline", value: 10, color: "#ef4444" },
  //   { name: "Setup", value: 5, color: "#8b5cf6" },
  // ];

  return (
    <div className="w-full flex-1 flex flex-col">
      <PageHeader
        title="Production Dashboard"
        description="Real-time machine status and metrics"
        actions={[
          {
            type: "button",
            label: "Map",
            variant: "secondary-outline",
            icon: <Map size={16} />,
            onClick: () => setIsMapModalOpen(true),
          },
          {
            type: "dropdown",
            label: "Machines",
            value: machineTypeFilter,
            isOpen: isFilterOpen,
            onOpenChange: setIsFilterOpen,
            options: [
              { label: "All Machines", value: "all" },
              { label: "Lathes", value: "lathes" },
              { label: "Mills", value: "mills" },
            ],
            onChange: (value) => setMachineTypeFilter(value),
          },
          {
            type: "datepicker",
            dateRange: dateRange,
            setDateRange: setDateRange,
            icon: <Calendar size={16} />,
          },
          {
            type: "button",
            label: "Refresh",
            variant: "primary",
            icon: <RefreshCcw size={16} />,
            onClick: refresh,
          },
        ]}
      />

      {error && (
        <div className="p-2">
          <p className="text-error">Error loading data</p>
        </div>
      )}

      <div className="p-2 gap-2 flex flex-col flex-1 overflow-hidden">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {kpis.map((metric) => (
            <KPICard {...metric} />
          ))}
        </div>

        <div className="grid h-full grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 overflow-hidden">
          <div className="bg-foreground rounded border flex flex-col md:col-span-2 lg:col-span-3 min-h-0 overflow-hidden max-h-[300px]">
            <div className="p-2 border-b flex items-center justify-between">
              <h3 className="text-sm text-text-muted">Utilization Over Time</h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setChartView("all")}
                  className={`px-2 py-1 text-xs rounded cursor-pointer ${
                    chartView === "all"
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface text-text-muted hover:bg-surface/80"
                  }`}>
                  All
                </button>
                <button
                  onClick={() => setChartView("group")}
                  className={`px-2 py-1 text-xs rounded cursor-pointer ${
                    chartView === "group"
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface text-text-muted hover:bg-surface/80"
                  }`}>
                  By Group
                </button>
                <button
                  onClick={() => setChartView("machine")}
                  className={`px-2 py-1 text-xs rounded cursor-pointer ${
                    chartView === "machine"
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface text-text-muted hover:bg-surface/80"
                  }`}>
                  By Machine
                </button>
                <div
                  className="relative"
                  ref={chartFilterRef}>
                  <button
                    onClick={() => setIsChartFilterOpen(!isChartFilterOpen)}
                    className="px-2 py-1 text-xs rounded cursor-pointer bg-surface text-text-muted hover:bg-surface/80">
                    <Filter size={12} />
                  </button>
                  {isChartFilterOpen &&
                    (chartView === "group" || chartView === "machine") && (
                      <div className="absolute right-0 mt-1 w-48 bg-foreground border rounded shadow-lg text-text-muted z-50 max-h-[300px] overflow-y-auto">
                        {chartView === "group"
                          ? Object.keys(
                              utilizationOverTime[0]?.groups || {}
                            ).map((key) => (
                              <label
                                key={key}
                                className="flex items-center px-3 py-2 text-xs hover:bg-surface cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={visibleLines.includes(key)}
                                  onChange={() => {
                                    setVisibleLines((prev) =>
                                      prev.includes(key)
                                        ? prev.filter((k) => k !== key)
                                        : [...prev, key]
                                    );
                                  }}
                                  className="mr-2"
                                />
                                {key}
                              </label>
                            ))
                          : machines.map((machine) => (
                              <label
                                key={machine.id}
                                className="flex items-center px-3 py-2 text-xs hover:bg-surface cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={visibleLines.includes(machine.id)}
                                  onChange={() => {
                                    setVisibleLines((prev) =>
                                      prev.includes(machine.id)
                                        ? prev.filter((k) => k !== machine.id)
                                        : [...prev, machine.id]
                                    );
                                  }}
                                  className="mr-2"
                                />
                                {machine.name}
                              </label>
                            ))}
                      </div>
                    )}
                </div>
              </div>
            </div>
            <div className="flex-1 p-2 min-h-0 overflow-hidden">
              <ResponsiveContainer
                width="100%"
                height="100%">
                <LineChart data={utilizationOverTime}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    horizontal={true}
                    stroke="var(--border)"
                  />
                  <XAxis
                    dataKey="label"
                    padding={{ left: 0, right: 0 }}
                    tick={{ fontSize: 12 }}
                    tickMargin={5}
                    tickFormatter={(value, index) =>
                      index % 2 === 0 ? value : ""
                    }
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                    width={35}
                    tick={{ fontSize: 12 }}
                    padding={{ top: 0, bottom: 0 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(v) => `${parseFloat(v as string).toFixed(2)}%`}
                    contentStyle={{
                      backgroundColor: "var(--foreground)",
                      color: "var(--text-muted)",
                      border: "1px solid var(--border)",
                      borderRadius: "4px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="utilization"
                    stroke="var(--primary)"
                    name="Utilization"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                    animationDuration={1000}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="previous"
                    stroke="var(--text-muted)"
                    opacity={0.5}
                    name="Previous"
                    strokeWidth={2}
                    animationDuration={1000}
                    isAnimationActive={false}
                  />
                  {(chartView === "group" || chartView === "machine") &&
                    utilizationOverTime.length > 0 &&
                    Object.entries(utilizationOverTime[0]?.groups || {})
                      .filter(([key]) => visibleLines.includes(key))
                      .map(([key, _], index) => (
                        <Line
                          key={key}
                          type="monotone"
                          dataKey={`groups.${key}.utilization`}
                          stroke={`hsl(${(index * 137.5) % 360}, 70%, 50%)`}
                          name={key}
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                          animationDuration={1000}
                          isAnimationActive={false}
                        />
                      ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-foreground rounded border flex flex-col min-h-0 overflow-hidden">
            <div className="p-2 border-b flex items-center justify-between">
              <h3 className="text-sm text-text-muted">State Distribution</h3>
            </div>
            <div className="flex flex-row lg:flex-col flex-1 overflow-hidden">
              <div className="flex-1 p-2 min-h-0 ">
                {/* <ResponsiveContainer
                  width="100%"
                  height="100%">
                  <PieChart>
                    <Pie
                      data={stateDistribution}
                      dataKey="total"
                      nameKey="state"
                      cx="50%"
                      cy="50%"
                      outerRadius="80%"
                      stroke="var(--border)"
                      strokeWidth={1}
                      isAnimationActive={false}
                      animationDuration={1000}>
                      {stateDistribution.map((entry, _) => (
                        <Cell
                          key={`cell-${entry.state}`}
                          fill={
                            entry.state === "OFFLINE"
                              ? "var(--surface)"
                              : getStatusColor(entry.state, theme)
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const entry = payload[0];

                        const total = entry.payload.total;
                        const percentage = entry.payload.percentage;

                        return (
                          <div
                            style={{
                              background: "var(--foreground)",
                              color: "var(--text-muted)",
                              border: "1px solid var(--border)",
                              borderRadius: 4,
                              padding: 8,
                            }}>
                            <div
                              style={{
                                fontWeight: 500,
                                color: getStatusColor(
                                  entry.payload.state,
                                  theme
                                ),
                              }}>
                              {entry.payload.state}
                            </div>
                            <div className="mt-1">
                              <p>
                                {formatDuration(total)} ({percentage.toFixed(2)}
                                %)
                              </p>
                            </div>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer> */}
              </div>
              <div className="hidden xl:flex flex-row gap-2 text-text-muted flex-wrap justify-center p-2">
                {stateDistribution.map((entry) => (
                  <div
                    key={entry.state}
                    className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded"
                      style={{
                        backgroundColor: getStatusColor(entry.state, theme),
                      }}
                    />
                    <span className="text-xs font-medium text-nowrap">
                      {entry.state} ({entry.percentage?.toFixed(1) ?? 0}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div
            className={`bg-foreground rounded border flex flex-col md:col-span-2 lg:col-span-3   ${
              !isToday ? "opacity-50" : ""
            }`}>
            <div className="p-2 border-b flex items-center justify-between">
              <h3 className="text-sm text-text-muted">
                Machines ({machines.length})
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 p-2 flex-1">
              {machines &&
                machines.map((machine: ExpandedMachine) => (
                  <div
                    key={machine.id}
                    onClick={() => {
                      setSelectedMachine(machine);
                    }}
                    className="flex flex-col justify-between p-2 gap-1 bg-surface rounded hover:bg-surface/80 border border-border cursor-pointer text-text-muted text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="text-sm font-medium text-text-muted truncate">
                          {machine.name}
                        </p>
                      </div>
                      <StatusBadge
                        variant={
                          getVariantFromStatus(machine.status) as
                            | "error"
                            | "success"
                            | "warning"
                            | "info"
                        }
                        label={machine.status}
                        size="sm"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 min-w-0 flex-1">
                        <Box
                          size={12}
                          className="text-text-muted flex-shrink-0"
                        />
                        <span className="truncate text-xs">
                          Program: {machine.program || "-"}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-text-muted text-xs">
                        Spindle RPM:
                      </span>
                      <span className="text-xs text-text-muted">
                        {machine.spindleSpeed || 0}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-text-muted text-xs">
                        Controller:
                      </span>
                      <span className="text-xs text-text-muted">
                        {machine.controller || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted text-xs">
                        Execution:
                      </span>
                      <span className="text-xs text-text-muted">
                        {machine.execution || "-"}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
          <div className="bg-foreground rounded border flex flex-col">
            <div className="p-2 border-b flex items-center justify-between">
              <h3 className="text-sm text-text-muted">Alarms</h3>
            </div>

            <div className="p-2 space-y-2 flex-1 flex flex-col">
              {loading ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader />
                </div>
              ) : overview?.alarms.length && overview?.alarms.length > 0 ? (
                overview?.alarms.map((alarm: IOverviewAlarm, idx: number) => (
                  <div
                    key={idx}
                    className="p-2 bg-surface rounded border border-border flex justify-between">
                    <div className="flex items-start gap-2">
                      <AlertTriangle
                        size={16}
                        className="text-error"
                      />
                      <div>
                        <p className="text-sm font-medium text-text-muted">
                          {alarm.message}
                        </p>
                        <p className="text-xs text-text-muted">
                          {alarm.machineId}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-text-muted leading-none">
                      {formatDistance(new Date(alarm.timestamp), new Date(), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex-1 text-text-muted text-sm py-2 flex items-center justify-center">
                  No alarms
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedMachine && (
        <Modal
          isOpen={selectedMachine !== null}
          onClose={() => {
            setSelectedMachine(null);
          }}
          title={`Machine Details - ${selectedMachine.name}`}
          size="md">
          <MachineDetails machine={selectedMachine} />
        </Modal>
      )}

      {isMapModalOpen && (
        <Modal
          isOpen={isMapModalOpen}
          onClose={() => setIsMapModalOpen(false)}
          title="Machine Map"
          size="md">
          <div className="p-2">
            <MachineMap machines={machines} />
          </div>
        </Modal>
      )}

      {isTimelineModalOpen && (
        <Modal
          isOpen={isTimelineModalOpen}
          onClose={() => setIsTimelineModalOpen(false)}
          title="Machine Timeline"
          size="lg">
          <MachineTimeline
            startDate={dateRange.start}
            endDate={dateRange.end}
          />
        </Modal>
      )}
    </div>
  );
};

export default Dashboard;

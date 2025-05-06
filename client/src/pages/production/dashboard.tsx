import { startOfToday, isSameDay, formatDistance } from "date-fns";
import {
  Activity,
  Gauge,
  Box,
  AlertTriangle,
  RefreshCcw,
  Clock,
  Map,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Button, Card, MachineMap, PageHeader } from "@/components";
import Modal from "@/components/shared/modal";
import DatePicker from "@/components/v1/date-picker";
import useGetOverview from "@/hooks/production/use-get-overview";
import useGetTimeline from "@/hooks/production/use-get-timeline";
import { useSocket } from "@/contexts/socket-context";
import { getStateColor, getStatusColor } from "@/utils";

interface IMachine {
  name: string;
  status: string;
  lastUpdated: string;
  execution: string;
  controllerMode: string;
  mainProgram: string;
  subProgram: string;
  toolNumber: string;
  spindles: {
    name: string;
    speed: number;
    override: number;
  }[];
  axes: {
    name: string;
    position: number;
    feedRate: number;
    load: number;
  }[];
}

const timeSeriesData = [
  {
    time: "00:00",
    utilization: 78.4,
    quality: 99.1,
    oee: 77.6,
    previous: {
      utilization: 67.2,
      quality: 98.8,
      oee: 66.4,
    },
  },
  {
    time: "04:00",
    utilization: 92.3,
    quality: 99.3,
    oee: 91.7,
    previous: {
      utilization: 86.5,
      quality: 99.6,
      oee: 86.2,
    },
  },
  {
    time: "08:00",
    utilization: 45.2,
    quality: 99.5,
    oee: 45.0,
    previous: {
      utilization: 54.8,
      quality: 99.1,
      oee: 54.3,
    },
  },
  {
    time: "12:00",
    utilization: 98.8,
    quality: 99.8,
    oee: 98.6,
    previous: {
      utilization: 94.3,
      quality: 99.4,
      oee: 93.8,
    },
  },
  {
    time: "16:00",
    utilization: 65.7,
    quality: 99.2,
    oee: 65.2,
    previous: {
      utilization: 72.4,
      quality: 98.9,
      oee: 71.6,
    },
  },
  {
    time: "20:00",
    utilization: 81.9,
    quality: 99.0,
    oee: 81.1,
    previous: {
      utilization: 76.3,
      quality: 99.3,
      oee: 75.8,
    },
  },
];

const machineStateEvents = {
  M1: [
    { timestamp: "06:45", state: "POWER_ON", duration: 180 }, // 3 mins
    { timestamp: "06:48", state: "HOMING", duration: 240 }, // 4 mins
    { timestamp: "06:52", state: "IDLE", duration: 480 }, // 8 mins
    { timestamp: "07:00", state: "SETUP", duration: 300 }, // 5 mins
    { timestamp: "07:05", state: "TOOL_CHANGE", duration: 300 }, // 5 mins
    { timestamp: "07:10", state: "ACTIVE", duration: 2100 }, // 35 mins
    { timestamp: "07:45", state: "FEED_HOLD", duration: 300 }, // 5 mins
    { timestamp: "07:50", state: "ACTIVE", duration: 2400 }, // 40 mins
    { timestamp: "08:30", state: "TOOL_CHANGE", duration: 120 }, // 2 mins
    { timestamp: "08:32", state: "ACTIVE", duration: 2580 }, // 43 mins
    { timestamp: "09:15", state: "E-STOP", duration: 300 }, // 5 mins
    { timestamp: "09:20", state: "RESET", duration: 300 }, // 5 mins
    { timestamp: "09:25", state: "HOMING", duration: 300 }, // 5 mins
    { timestamp: "09:30", state: "ACTIVE", duration: 1800 }, // 30 mins
    { timestamp: "10:00", state: "FEED_HOLD", duration: 300 }, // 5 mins
    { timestamp: "10:05", state: "ACTIVE", duration: 2400 }, // 40 mins
    { timestamp: "10:45", state: "IDLE", duration: 900 }, // 15 mins
  ],
  M2: [
    { timestamp: "07:00", state: "POWER_ON", duration: 180 },
    { timestamp: "07:03", state: "ALARM", duration: 420 },
    { timestamp: "07:10", state: "MAINTENANCE", duration: 3600 },
  ],
  M3: [
    { timestamp: "06:30", state: "POWER_ON", duration: 300 },
    { timestamp: "06:35", state: "SETUP", duration: 1200 },
    { timestamp: "06:55", state: "ACTIVE", duration: 7200 },
  ],
};

const utilizationGraphData = timeSeriesData.map((data) => ({
  time: data.time,
  utilization: data.utilization,
  previous: data.previous.utilization,
}));

const stateDurations: Record<string, number> = {};

Object.values(machineStateEvents).forEach((events) => {
  events.forEach((event) => {
    stateDurations[event.state] =
      (stateDurations[event.state] || 0) + event.duration / 60; // minutes
  });
});

const statePieData = Object.entries(stateDurations).map(([state, value]) => ({
  state,
  value,
}));

type MachineDetailsProps = {
  machine: IMachine;
};

const MachineDetails = ({ machine }: MachineDetailsProps) => {
  return (
    <div className="space-y-2 pt-2 text-sm">
      <div className="grid grid-cols-2 gap-2">
        <Card>
          <h4 className="text-sm font-medium mb-2">Status Information</h4>
          <div className="grid grid-cols-[1fr_auto] gap-1">
            <span className="text-muted-foreground">Machine:</span>
            <span className="font-medium text-right">{machine.name}</span>
            <span className="text-muted-foreground">Controller:</span>
            <span className="font-medium text-right">
              {machine.controllerMode || "-"}
            </span>
            <span className="text-muted-foreground">Execution:</span>
            <span className="font-medium text-right">
              {machine.execution || "-"}
            </span>
            <span className="text-muted-foreground">Updated:</span>
            <span className="font-medium text-right">
              {new Date(machine.lastUpdated || Date.now()).toLocaleString()}
            </span>
          </div>
        </Card>

        <Card>
          <h4 className="text-sm font-medium mb-2">Program Information</h4>
          <div className="grid grid-cols-[1fr_auto] gap-1">
            <span className="text-muted-foreground">Program:</span>
            <span className="font-medium text-right">
              {machine.mainProgram || "-"}
            </span>

            <span className="text-muted-foreground">Tool:</span>
            <span className="font-medium text-right">
              {machine.toolNumber || "-"}
            </span>
          </div>
        </Card>
      </div>

      <Card>
        <h4 className="text-sm font-medium mb-2">Spindle Information</h4>
        {machine.spindles && machine.spindles.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {machine.spindles.map((spindle, index) => (
              <div
                key={index}
                className="flex items-center border rounded p-2 bg-muted/30">
                <div>
                  <div className="text-xs text-muted-foreground">
                    Spindle {spindle.name || `#${index + 1}`}
                  </div>
                  <div className="text-sm font-bold">
                    {spindle.speed || "0"} RPM
                    {spindle.override && (
                      <span className="text-xs ml-1 text-muted-foreground">
                        ({spindle.override}%)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground text-sm py-2">
            No spindle data available
          </div>
        )}
      </Card>

      <Card>
        <h4 className="text-sm font-medium mb-2">Axis Information</h4>
        {machine.axes && machine.axes.length > 0 ? (
          <div className="grid grid-cols-4 gap-2">
            {machine.axes.map((axis, index) => (
              <div
                key={index}
                className="border rounded p-2 bg-muted/30">
                <h5 className="text-sm font-medium">{axis.name} Axis</h5>
                <div className="mt-1 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pos:</span>
                    <span>
                      {axis.position !== undefined
                        ? axis.position.toFixed(3)
                        : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Feed:</span>
                    <span>
                      {axis.feedRate !== undefined
                        ? axis.feedRate.toFixed(1)
                        : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Load:</span>
                    <span>
                      {axis.load !== undefined
                        ? `${axis.load.toFixed(0)}%`
                        : "-"}
                    </span>
                  </div>
                  {axis.load !== undefined && (
                    <Progress
                      value={axis.load}
                      className="h-1 mt-1"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground text-sm py-2">
            No axis data available
          </div>
        )}
      </Card>
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

  useEffect(() => {
    console.log("API Timeline (on modal open):", {
      timeline,
      loading,
      error,
    });
  }, [timeline, loading, error]);

  return (
    <div className="space-y-4 p-2">
      <div className="sticky top-0 z-10 bg-background">
        <div className="flex border-b">
          <div className="w-32 flex-shrink-0 p-2 font-medium text-sm">
            Machine
          </div>
          <div className="flex flex-1">
            {Array.from({ length: 25 }).map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-[100px] text-xs text-text-muted border-l px-1">
                {String(6 + Math.floor(i / 2)).padStart(2, "0")}:
                {i % 2 ? "30" : "00"}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[2500px]">
          <div className="space-y-1">
            {machineStatus.map((machine) => (
              <div
                key={machine.id}
                className="flex items-center group hover:bg-surface/50 rounded">
                <div className="w-32 flex-shrink-0 p-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        machine.status === "running"
                          ? "bg-success"
                          : machine.status === "setup"
                          ? "bg-warning"
                          : "bg-error"
                      }`}
                    />
                    <span className="text-sm font-medium">{machine.name}</span>
                  </div>
                </div>

                <div className="flex-1 h-12 relative">
                  {Array.from({ length: 49 }).map((_, i) => (
                    <div
                      key={i}
                      className={`absolute h-full border-l ${
                        i % 2 === 0 ? "border-border" : "border-border/30"
                      }`}
                      style={{ left: `${i * 50}px` }}
                    />
                  ))}

                  {machineStateEvents[machine.id]?.map((event, index) => {
                    const [hours, minutes] = event.timestamp
                      .split(":")
                      .map(Number);
                    const startMinutes = (hours - 6) * 60 + minutes;
                    const widthMinutes = event.duration / 60;

                    return (
                      <div
                        key={index}
                        className="absolute h-8 top-2 transition-opacity hover:opacity-90 group"
                        style={{
                          left: `${(startMinutes / 30) * 100}px`,
                          width: `${(widthMinutes / 30) * 100}px`,
                          backgroundColor: getStateColor(event.state),
                        }}>
                        <div className="h-full flex items-center justify-center text-xs text-white font-medium truncate px-2">
                          {event.state}
                        </div>

                        {/* Hover Tooltip */}
                        <div className="absolute bottom-full mb-1 left-0 bg-background border rounded p-2 hidden group-hover:block whitespace-nowrap z-20 text-xs">
                          <p className="font-medium">{event.state}</p>
                          <p>
                            {event.timestamp} ({Math.floor(event.duration / 60)}
                            m)
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t pt-4 flex flex-wrap gap-2">
        {Array.from(
          new Set(
            Object.values(machineStateEvents)
              .flat()
              .map((x) => x.state)
          )
        ).map((state) => (
          <div
            key={state}
            className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: getStateColor(state) }}
            />
            <span className="text-sm">{state}</span>
          </div>
        ))}
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
  const color = change && change > 0 ? "success" : "error";

  return (
    <div className="bg-foreground rounded border p-2">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2 text-primary">
          {icon}
          <p className="text-sm text-text-muted ">{title}</p>
        </div>
        {change && (
          <span
            className={`text-xs text-${color} bg-${color}/10 px-2 py-1 rounded`}>
            {change}
          </span>
        )}
      </div>
      <h3 className="text-xl font-semibold text-text-muted">{value}</h3>
      <p className="text-xs text-text-muted mt-1">{description}</p>
    </div>
  );
};

const Dashboard = () => {
  const [selectedMachine, setSelectedMachine] = useState<IMachine | null>(null);
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  const { machineStates } = useSocket();

  const navigate = useNavigate();

  const parseDateParam = (param: string | null, fallback: Date) => {
    if (!param) return fallback;
    const [year, month, day] = param.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    return isNaN(d.getTime()) ? fallback : d;
  };

  const getInitialDateRange = () => {
    const params = new URLSearchParams(window.location.search);
    return {
      start: parseDateParam(params.get("startDate"), startOfToday()),
      end: parseDateParam(params.get("endDate"), new Date()),
    };
  };

  const [dateRange, setDateRange] = useState(getInitialDateRange);

  const { overview, loading, error, refresh } = useGetOverview({
    startDate: dateRange.start.toISOString().slice(0, 10),
    endDate: dateRange.end.toISOString().slice(0, 10),
  });

  const kpis = [
    {
      title: "Active Machines",
      value: "-/-",
      description: "Number of active machines",
      icon: <Activity size={16} />,
    },
    {
      title: "Utilization",
      value: overview?.kpis.utilization?.value || "-",
      description: "Utilization of machines",
      icon: <Gauge size={16} />,
      change: overview?.kpis.utilization?.change || 0,
    },
    {
      title: "Average Runtime",
      value: overview?.kpis.averageRuntime?.value || "-",
      description: "Average runtime of machines",
      icon: <Clock size={16} />,
      change: overview?.kpis.averageRuntime?.change || 0,
    },
    {
      title: "Alarms",
      value: overview?.kpis.alarmCount?.value || "-",
      description: "Number of alarms",
      icon: <AlertTriangle size={16} />,
      change: overview?.kpis.alarmCount?.change || 0,
    },
  ];

  const stateDistribution =
    overview?.states ||
    Object.entries(stateDurations).map(([state, value]) => ({
      state,
      value,
    }));

  const machines = (overview?.machines || [])
    .sort((a, b) => {
      const typeCompare = a.type.localeCompare(b.type);
      if (typeCompare === 0) {
        return a.name.localeCompare(b.name);
      }
      return typeCompare;
    })
    .map((machine) => {
      const realTime = machineStates.find(
        (state) => state.machineId === machine.id
      );
      return {
        ...machine,
        status: realTime?.currentState?.toLowerCase() || "unknown",
        currentProgram: realTime?.currentProgram || "-",
        estimatedCompletion: realTime?.estimatedCompletion || "-",
        spindleLoad: realTime?.spindleLoad || 0,
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

  return (
    <div className="w-full flex-1 flex flex-col">
      <PageHeader
        title="Production Dashboard"
        description="Real-time machine status and metrics"
        actions={
          <>
            <Button
              variant="secondary-outline"
              size="sm"
              onClick={() => setIsMapModalOpen(true)}>
              <Map size={16} />
              Map
            </Button>
            <Button
              variant="secondary-outline"
              size="sm"
              onClick={() => setIsTimelineModalOpen(true)}>
              <Clock size={16} />
              Timeline
            </Button>
            <DatePicker
              dateRange={dateRange}
              setDateRange={setDateRange}
            />
            <Button
              variant="primary"
              onClick={refresh}>
              <RefreshCcw size={16} />
              Refresh
            </Button>
          </>
        }
      />

      <div className="p-2 gap-2 flex flex-col flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          {kpis.map((metric) => (
            <KPICard
              key={metric.title}
              {...metric}
            />
          ))}
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          <div className="md:col-span-2 lg:col-span-3 w-full h-full bg-foreground rounded border flex flex-col min-h-[250px]">
            <div className="p-2 border-b flex items-center justify-between">
              <h3 className="text-sm text-text-muted">Utilization Over Time</h3>
            </div>

            <div className="p-2 flex-1 text-sm">
              <ResponsiveContainer
                width="100%"
                height="100%">
                <LineChart
                  data={utilizationGraphData}
                  margin={{ left: 0, right: 5, top: 5, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    horizontal={true}
                    stroke="var(--border)"
                  />
                  <XAxis
                    dataKey="time"
                    padding={{ left: 0, right: 0 }}
                    tick={{ fontSize: 12 }}
                    tickMargin={5}
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
                    formatter={(v) => `${v}%`}
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
                    name="Current"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="previous"
                    stroke="var(--text-muted)"
                    opacity={0.5}
                    name="Previous"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="w-full h-full bg-foreground rounded border flex flex-col min-h-[250px]">
            <div className="p-2 border-b">
              <h3 className="text-sm text-text-muted">State Distribution</h3>
            </div>
            <div className="flex-1 flex items-center justify-center text-sm">
              <ResponsiveContainer
                width="100%"
                height="100%">
                <PieChart>
                  <Pie
                    data={statePieData}
                    dataKey="value"
                    nameKey="state"
                    cx="50%"
                    cy="50%"
                    outerRadius="80%"
                    isAnimationActive={false}
                    stroke="var(--border)">
                    {statePieData.map((entry, idx) => (
                      <Cell
                        key={`cell-${idx}`}
                        fill={getStateColor(entry.state)}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const entry = payload[0];
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
                              color: "var(--text-muted)",
                            }}>
                            {entry.payload.state}
                          </div>
                          <div
                            className="mt-1"
                            style={{ color: "var(--text-muted)" }}>
                            {entry.value} min
                          </div>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="hidden md:flex items-center gap-2 text-text-muted flex-wrap justify-center pb-2">
              {statePieData
                .slice()
                .sort((a, b) => b.value - a.value)
                .slice(0, 5)
                .map((entry) => (
                  <div
                    key={entry.state}
                    className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: getStateColor(entry.state) }}
                    />
                    <span className="text-xs font-medium">{entry.state}</span>
                  </div>
                ))}
            </div>
          </div>

          <div className="w-full h-full bg-foreground rounded border flex flex-col min-h-[250px] lg:hidden">
            <div className="p-2 border-b">
              <h3 className="text-sm text-text-muted">Alarms</h3>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          <div
            className={`md:col-span-2 lg:col-span-3 w-full h-full bg-foreground rounded border ${
              !isToday ? "opacity-50" : ""
            }`}>
            <div className="p-2 border-b">
              <h3 className="text-sm text-text-muted">
                Machines ({machines.length})
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 p-2">
              {machines &&
                machines.map((machine) => (
                  <div
                    key={machine.id}
                    onClick={() => {
                      setSelectedMachine(machine);
                    }}
                    className="flex flex-col p-2 gap-1 bg-surface rounded hover:bg-surface/80 border border-border cursor-pointer text-text-muted text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-2 h-2 rounded-full border border-border"
                          style={{
                            backgroundColor: getStatusColor(machine.status),
                          }}
                        />
                        <p className="text-sm font-medium text-text-muted truncate">
                          {machine.name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Box
                          size={12}
                          className="text-text-muted"
                        />
                        <span className="truncate text-xs">
                          {machine.currentProgram || "-"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 justify-end">
                        <Clock
                          size={12}
                          className="text-text-muted"
                        />
                        <span className="text-xs">
                          {machine.estimatedCompletion || "-"}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-text-muted text-xs">Load</span>
                      <span className="text-xs text-text-muted">
                        {machine.spindleLoad}%
                      </span>
                    </div>
                    <div className="w-full rounded-full h-1.5 border border-border bg-surface overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all bg-text-muted/50"
                        style={{ width: `${machine.spindleLoad}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-foreground rounded border flex-col h-[239px] hidden lg:flex">
            <div className="p-2 border-b flex-shrink-0">
              <h3 className="text-sm text-text-muted">Alarms</h3>
            </div>

            <div className="overflow-y-auto flex-grow">
              <div className="p-2 space-y-2">
                {loading ? (
                  <div className="text-center text-text-muted text-sm py-2">
                    Loading...
                  </div>
                ) : overview?.alarms.length && overview?.alarms.length > 0 ? (
                  overview?.alarms.map((alarm, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-surface rounded border border-border flex justify-between">
                      <div className="flex items-start gap-2">
                        <AlertTriangle
                          size={16}
                          className={
                            alarm.type === "alarm"
                              ? "text-error"
                              : "text-warning"
                          }
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
                  <div className="text-center text-text-muted text-sm py-2">
                    No alarms
                  </div>
                )}
              </div>
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

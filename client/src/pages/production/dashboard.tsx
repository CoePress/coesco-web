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
import { useSocket } from "@/contexts/socket.context";
import { getStateColor, getStatusColor } from "@/utils";

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

type MachineDetailsProps = {
  machine: any;
};

const MachineDetails = ({ machine }: MachineDetailsProps) => {
  const sampleProgramHistory = [
    { label: "Program 1", timestamp: "06:00", duration: 10 },
    { label: "Program 2", timestamp: "06:10", duration: 20 },
    { label: "Program 3", timestamp: "06:20", duration: 30 },
    { label: "Program 4", timestamp: "06:30", duration: 40 },
    { label: "Program 5", timestamp: "06:40", duration: 50 },
  ];

  const sampleStateDistribution = [
    { label: "Active", value: 70 },
    { label: "Idle", value: 10 },
    { label: "Alarm", value: 20 },
    { label: "Offline", value: 10 },
  ];

  return (
    <div className="space-y-2 pt-2 text-sm">
      <div className="grid grid-cols-2 gap-2">
        <Card>
          <h4 className="text-sm font-medium mb-2 text-text-muted">
            Status Information
          </h4>
          <div className="grid grid-cols-[1fr_auto] gap-1 text-text-muted">
            <span className="text-muted-foreground">Machine:</span>
            <span className="font-medium text-right">{machine.name}</span>
            <span className="text-muted-foreground">Status:</span>
            <span className="font-medium text-right uppercase">
              {machine.status || "-"}
            </span>
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
          <h4 className="text-sm font-medium mb-2 text-text-muted">
            Program Information
          </h4>
          <div className="grid grid-cols-[1fr_auto] gap-1 text-text-muted">
            <span className="text-muted-foreground">Program:</span>
            <span className="font-medium text-right">
              {machine.currentProgram || "-"}
            </span>

            <span className="text-muted-foreground">Tool:</span>
            <span className="font-medium text-right">
              {machine.toolNumber || "-"}
            </span>
            <span className="text-muted-foreground">Spindle (RPM):</span>
            <span className="font-medium text-right">
              {machine.spindleSpeed || "-"}
            </span>
            <span className="text-muted-foreground">Spindle (Load):</span>
            <span className="font-medium text-right">
              {machine.spindleLoad || "-"}
            </span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Card>
          <h4 className="text-sm font-medium mb-2 text-text-muted">
            Program History (Last 24h)
          </h4>
          <div className="flex flex-col gap-2">
            {sampleProgramHistory.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2">
                <span className="text-sm font-medium">{item.label}</span>
                <span className="text-sm text-text-muted">
                  {item.timestamp}
                </span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h4 className="text-sm font-medium mb-2 text-text-muted">
            State History (Last 24h)
          </h4>
          {/* Pie Chart */}
          <ResponsiveContainer
            width="100%"
            height={200}>
            <PieChart>
              <Pie
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
          </ResponsiveContainer>
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
            {machineStates.map((machine) => (
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
  const [selectedMachine, setSelectedMachine] = useState<any | null>(null);
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

  const utilizationOverTime = overview?.utilization || [];

  const stateDistribution = overview?.states || [];

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

      {error && (
        <div className="p-2">
          <p className="text-error">Error loading data</p>
        </div>
      )}

      <div className="p-2 gap-2 flex flex-col flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          {kpis.map((metric) => (
            <KPICard
              key={metric.title}
              {...metric}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 flex-1">
          <div className="md:col-span-2 lg:col-span-3 w-full h-full bg-foreground rounded border flex flex-col min-h-[250px]">
            <div className="p-2 border-b flex items-center justify-between">
              <h3 className="text-sm text-text-muted">Utilization Over Time</h3>
            </div>

            <div className="p-2 flex-1 text-sm">
              <ResponsiveContainer
                width="100%"
                height="100%">
                <LineChart
                  data={utilizationOverTime}
                  margin={{ left: 0, right: 5, top: 5, bottom: 0 }}>
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
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="previous"
                    stroke="var(--text-muted)"
                    opacity={0.5}
                    name="Previous"
                    strokeWidth={2}
                    isAnimationActive={false}
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
                    data={stateDistribution}
                    dataKey="duration"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius="80%"
                    isAnimationActive={false}
                    stroke="var(--border)">
                    {stateDistribution.map((entry, idx) => (
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
                              color: getStatusColor(entry.payload.label),
                            }}>
                            {entry.payload.label}
                          </div>
                          <div className="mt-1">
                            <p>{entry.payload.duration}</p>
                            <p>{entry.payload.percentage * 100}%</p>
                          </div>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* <div className="hidden md:flex items-center gap-2 text-text-muted flex-wrap justify-center pb-2">
              {stateDistribution.map((entry) => (
                <div
                  key={entry.label}
                  className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded"
                    style={{
                      backgroundColor: getStatusColor(entry.label),
                    }}
                  />
                  <span className="text-xs font-medium">{entry.label}</span>
                </div>
              ))}
            </div> */}
          </div>

          <div className="w-full h-full bg-foreground rounded border flex flex-col min-h-[250px] lg:hidden">
            <div className="p-2 border-b">
              <h3 className="text-sm text-text-muted">Alarms</h3>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          <div
            className={`md:col-span-2 lg:col-span-3 w-full h-full bg-foreground flex flex-col rounded border ${
              !isToday ? "opacity-50" : ""
            }`}>
            <div className="p-2 border-b">
              <h3 className="text-sm text-text-muted">
                Machines ({machines.length})
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 p-2 flex-1">
              {machines &&
                machines.map((machine) => (
                  <div
                    key={machine.id}
                    onClick={() => {
                      setSelectedMachine(machine);
                    }}
                    className="flex flex-col justify-between p-2 gap-1 bg-surface rounded hover:bg-surface/80 border border-border cursor-pointer text-text-muted text-sm">
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

          <div className="bg-foreground rounded border flex-col h-[300px] hidden lg:flex">
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

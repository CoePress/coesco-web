import {
  Activity,
  Gauge,
  Box,
  AlertTriangle,
  Timer,
  Filter,
  RefreshCcw,
  Clock,
  User,
  Map,
  ChevronDown,
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
} from "recharts";
import { useState, useEffect } from "react";
import Modal from "@/components/shared/modal";
import { useNavigate } from "react-router-dom";

import { Button, MachineMap, PageHeader } from "@/components";
import DatePicker from "@/components/v1/date-picker";
import { startOfToday, isSameDay } from "date-fns";
import useGetOverview from "@/hooks/production/use-get-overview";
import useGetTimeline from "@/hooks/production/use-get-timeline";

const timeSeriesData = [
  {
    time: "00:00",
    output: 452,
    target: 500,
    efficiency: 90.4,
    quality: 99.1,
    oee: 88.5,
  },
  {
    time: "04:00",
    output: 478,
    target: 500,
    efficiency: 95.6,
    quality: 99.3,
    oee: 91.2,
  },
  {
    time: "08:00",
    output: 489,
    target: 500,
    efficiency: 97.8,
    quality: 99.5,
    oee: 93.4,
  },
  {
    time: "12:00",
    output: 495,
    target: 500,
    efficiency: 99.0,
    quality: 99.8,
    oee: 94.8,
  },
  {
    time: "16:00",
    output: 482,
    target: 500,
    efficiency: 96.4,
    quality: 99.2,
    oee: 92.1,
  },
  {
    time: "20:00",
    output: 471,
    target: 500,
    efficiency: 94.2,
    quality: 99.0,
    oee: 90.8,
  },
];

const machineStatus = [
  {
    id: "M1",
    name: "Haas VF-2",
    status: "running",
    uptime: "12h 30m",
    currentJob: "Housing Block #JB-2234",
    operator: "Mike K.",
    estimatedCompletion: "2h 15m",
    spindleLoad: 45,
  },
  {
    id: "M2",
    name: "DMG MORI NLX 2500",
    status: "setup",
    uptime: "5h 45m",
    currentJob: "Setup in progress",
    operator: "Sarah L.",
    estimatedCompletion: "-",
    spindleLoad: 0,
  },
  {
    id: "M3",
    name: "Mazak QTN-200",
    status: "running",
    uptime: "8h 15m",
    currentJob: "Shaft Series #PS-789",
    operator: "John D.",
    estimatedCompletion: "45m",
    spindleLoad: 65,
  },
  {
    id: "M4",
    name: "Okuma LB3000",
    status: "stopped",
    uptime: "0h 0m",
    currentJob: "Maintenance Required",
    operator: "-",
    estimatedCompletion: "-",
    spindleLoad: 0,
  },
  {
    id: "M5",
    name: "Haas ST-20",
    status: "running",
    uptime: "16h 20m",
    currentJob: "Custom Flanges #CF-445",
    operator: "Rob M.",
    estimatedCompletion: "3h 30m",
    spindleLoad: 35,
  },
  {
    id: "M6",
    name: "DMG MORI DMU 50",
    status: "running",
    uptime: "4h 10m",
    currentJob: "Mold Base #MB-112",
    operator: "Dave S.",
    estimatedCompletion: "5h 45m",
    spindleLoad: 80,
  },
  {
    id: "M7",
    name: "Doosan Puma 2600",
    status: "maintenance",
    uptime: "2h 30m",
    currentJob: "Scheduled Maintenance",
    operator: "Tech Team",
    estimatedCompletion: "1h 15m",
    spindleLoad: 0,
  },
  {
    id: "M8",
    name: "Mazak VTC-300C",
    status: "running",
    uptime: "10h 45m",
    currentJob: "Prototype Parts #PP-556",
    operator: "Alex W.",
    estimatedCompletion: "1h 50m",
    spindleLoad: 55,
  },
];

const shopMetrics = {
  activeJobs: 6,
  totalMachines: 8,
  alertCount: 3,
  utilization: 85.2,
};

const machineStateTimeline = {
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

const machineStatusPieChart = {
  ACTIVE: 85,
  IDLE: 10,
  FEED_HOLD: 5,
  "E-STOP": 5,
  ALARM: 5,
  SETUP: 5,
  TOOL_CHANGE: 5,
  POWER_ON: 5,
  HOMING: 5,
  RESET: 5,
  MAINTENANCE: 5,
};

const getStateColor = (state: string) => {
  const colors = {
    ACTIVE: "#22c55e", // Green
    IDLE: "#3b82f6", // Blue
    FEED_HOLD: "#eab308", // Yellow
    "E-STOP": "#ef4444", // Red
    ALARM: "#ef4444", // Red
    SETUP: "#f97316", // Orange
    TOOL_CHANGE: "#8b5cf6", // Purple
    POWER_ON: "#6b7280", // Gray
    HOMING: "#6b7280", // Gray
    RESET: "#6b7280", // Gray
    MAINTENANCE: "#f97316", // Orange
  };
  return colors[state as keyof typeof colors] || "#6b7280";
};

const lineGraphData = timeSeriesData.map((data) => ({
  time: data.time,
  output: data.output,
  target: data.target,
  efficiency: data.efficiency,
}));

const AllTimelinesTimelineFetcher = ({
  dateRange,
}: {
  dateRange: { start: Date; end: Date };
}) => {
  const { timeline, loading, error } = useGetTimeline({
    startDate: dateRange.start.toISOString().slice(0, 10),
    endDate: dateRange.end.toISOString().slice(0, 10),
  });
  useEffect(() => {
    console.log("API Timeline (on modal open):", { timeline, loading, error });
  }, [timeline, loading, error]);
  return null;
};

const Dashboard = () => {
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
  const [isAllTimelinesModalOpen, setIsAllTimelinesModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const navigate = useNavigate();

  const parseDateParam = (param: string | null, fallback: Date) => {
    if (!param) return fallback;
    const [year, month, day] = param.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    return isNaN(d.getTime()) ? fallback : d;
  };

  // Only read search params on mount
  const getInitialDateRange = () => {
    const params = new URLSearchParams(window.location.search);
    return {
      start: parseDateParam(params.get("startDate"), startOfToday()),
      end: parseDateParam(params.get("endDate"), new Date()),
    };
  };

  const [dateRange, setDateRange] = useState(getInitialDateRange);

  // Use the API hook with date range
  const { overview, loading, error, refresh } = useGetOverview({
    startDate: dateRange.start.toISOString().slice(0, 10),
    endDate: dateRange.end.toISOString().slice(0, 10),
  });

  // Log the API response for now
  console.log("API Overview:", { overview, loading, error });

  // Helper to check if both start and end are today
  const isToday =
    isSameDay(dateRange.start, startOfToday()) &&
    isSameDay(dateRange.end, startOfToday());

  useEffect(() => {
    const startStr = dateRange.start.toISOString().slice(0, 10);
    const endStr = dateRange.end.toISOString().slice(0, 10);
    const isDefault =
      isSameDay(dateRange.start, startOfToday()) &&
      isSameDay(dateRange.end, startOfToday());

    // Always build params from window.location.search, not from useSearchParams
    const params = new URLSearchParams(window.location.search);

    if (isDefault) {
      params.delete("startDate");
      params.delete("endDate");
    } else {
      params.set("startDate", startStr);
      params.set("endDate", endStr);
    }

    navigate({ search: params.toString() }, { replace: true });
    // Only depend on dateRange, not searchParams
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  // Only update dateRange if the URL changes (e.g., user manually edits URL)
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

      <div className="p-2 space-y-2 flex flex-col flex-1">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          <div className="bg-foreground rounded border p-2">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <Activity
                  size={20}
                  className="text-primary"
                />
                <p className="text-sm text-text-muted">Machine Status</p>
              </div>
              <span className="text-xs text-success bg-success/10 px-2 py-1 rounded">
                {shopMetrics.activeJobs} Active
              </span>
            </div>
            <h3 className="text-2xl font-semibold text-text-muted">
              {shopMetrics.activeJobs}/{shopMetrics.totalMachines}
            </h3>
            <p className="text-xs text-text-muted mt-1">Machines Running</p>
          </div>

          <div className="bg-foreground rounded border p-2">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <Gauge
                  size={20}
                  className="text-primary"
                />
                <p className="text-sm text-text-muted">Utilization</p>
              </div>
              <span className="text-xs text-success bg-success/10 px-2 py-1 rounded">
                +2.1%
              </span>
            </div>
            <h3 className="text-2xl font-semibold text-text-muted">
              {shopMetrics.utilization}%
            </h3>
            <p className="text-xs text-text-muted mt-1">
              Shop Utilization Rate
            </p>
          </div>

          <div className="bg-foreground rounded border p-2">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle
                  size={20}
                  className="text-primary"
                />
                <p className="text-sm text-text-muted">Active Alerts</p>
              </div>
              <span className="text-xs text-error bg-error/10 px-2 py-1 rounded">
                {shopMetrics.alertCount} Issues
              </span>
            </div>
            <h3 className="text-2xl font-semibold text-text-muted">
              {shopMetrics.alertCount}
            </h3>
            <p className="text-xs text-text-muted mt-1">Require Attention</p>
          </div>

          <div className="bg-foreground rounded border p-2">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <Clock
                  size={20}
                  className="text-primary"
                />
                <p className="text-sm text-text-muted">Average Runtime</p>
              </div>
              <span className="text-xs text-warning bg-warning/10 px-2 py-1 rounded">
                8.5h
              </span>
            </div>
            <h3 className="text-2xl font-semibold text-text-muted">8.5h</h3>
            <p className="text-xs text-text-muted mt-1">Per Machine Today</p>
          </div>
        </div>

        {/* Line Graph + Alerts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 h-full">
          {/* Production Metrics Graph */}
          <div className="bg-foreground rounded border col-span-2 lg:col-span-3 flex flex-col h-full min-h-[300px]">
            <div className="p-2 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-sm text-text-muted">States Over Time</h3>
                <div className="flex gap-2">
                  <Button variant="secondary-outline">
                    <Filter
                      size={16}
                      className="mr-2"
                    />
                    Filter
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-2 flex-1">
              <ResponsiveContainer
                width="100%"
                height="100%">
                <LineChart data={lineGraphData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis yAxisId="left" />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                  />
                  <Tooltip />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="output"
                    stroke="#3b82f6"
                    name="Output"
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="target"
                    stroke="#6b7280"
                    name="Target"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="efficiency"
                    stroke="#22c55e"
                    name="Efficiency %"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-foreground rounded border col-span-2 lg:col-span-1 h-full min-h-[300px] hidden lg:block">
            <div className="p-2 border-b ">
              <div className="flex justify-between items-center">
                <h3 className="text-sm text-text-muted">State Distribution</h3>
                <div className="flex gap-2">
                  <Button variant="secondary-outline">
                    All Machines
                    <ChevronDown size={16} />
                  </Button>
                </div>
              </div>
              <ResponsiveContainer
                width="100%"
                height="100%">
                <PieChart>
                  <Pie
                    data={Object.entries(machineStatusPieChart).map(
                      ([state, value]) => ({
                        state,
                        value,
                      })
                    )}
                    dataKey="value"
                    nameKey="state"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label
                  />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          {/* Machine Status Section - Full Width */}
          <div
            className={`bg-foreground rounded border col-span-2 lg:col-span-3 ${
              !isToday ? "opacity-50" : ""
            }`}>
            <div className="p-2 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-sm text-text-muted">
                  Machines ({machineStatus.length})
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="secondary-outline"
                    onClick={() => setIsMapModalOpen(true)}>
                    <Map size={16} />
                    Map
                  </Button>
                  <Button
                    variant="secondary-outline"
                    onClick={() => setIsAllTimelinesModalOpen(true)}>
                    <Clock size={16} />
                    Timeline
                  </Button>
                </div>
              </div>
            </div>
            <div className="p-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {machineStatus.map((machine) => (
                  <div
                    key={machine.id}
                    className="flex flex-col p-2 bg-surface rounded hover:bg-surface/80 border border-border h-[120px] cursor-pointer text-text-muted"
                    onClick={() => {
                      setSelectedMachine(machine);
                      setIsTimelineModalOpen(true);
                    }}>
                    {/* Header: Machine Name + Status + Settings */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            machine.status === "running"
                              ? "bg-success"
                              : machine.status === "setup" ||
                                machine.status === "maintenance"
                              ? "bg-warning"
                              : "bg-error"
                          }`}
                        />
                        <p className="text-sm font-medium text-text-muted truncate">
                          {machine.name}
                        </p>
                      </div>
                    </div>

                    {/* Info Grid */}
                    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <div className="flex items-center gap-1">
                        <Box
                          size={12}
                          className="text-text-muted"
                        />
                        <span className="truncate">{machine.currentJob}</span>
                      </div>
                      <div className="flex items-center gap-1 justify-end">
                        <Clock
                          size={12}
                          className="text-text-muted"
                        />
                        <span>{machine.estimatedCompletion}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User
                          size={12}
                          className="text-text-muted"
                        />
                        <span>{machine.operator}</span>
                      </div>
                      <div className="flex items-center gap-1 justify-end">
                        <Timer
                          size={12}
                          className="text-text-muted"
                        />
                        <span>{machine.uptime}</span>
                      </div>
                    </div>

                    {/* Spindle Load (only for running machines) */}
                    {machine.status === "running" && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-text-muted">Load</span>
                          <span
                            className={`${
                              machine.spindleLoad > 80
                                ? "text-error"
                                : machine.spindleLoad > 60
                                ? "text-warning"
                                : "text-success"
                            }`}>
                            {machine.spindleLoad}%
                          </span>
                        </div>
                        <div className="w-full bg-surface rounded-full h-1">
                          <div
                            className={`h-full rounded-full transition-all ${
                              machine.spindleLoad > 80
                                ? "bg-error"
                                : machine.spindleLoad > 60
                                ? "bg-warning"
                                : "bg-success"
                            }`}
                            style={{ width: `${machine.spindleLoad}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Alerts Section */}
          <div className="bg-foreground rounded border hidden lg:block">
            <div className="p-2 border-b flex justify-between items-center">
              <h3 className="text-sm text-text-muted">Alarms</h3>
              <span className="text-xs bg-error/10 text-error px-2 py-1 rounded">
                3 Critical
              </span>
            </div>
            <div className="p-2">
              <div className="space-y-2">
                {[
                  {
                    title: "High Spindle Temperature",
                    machine: "DMG MORI NLX 2500",
                    severity: "critical",
                  },
                  {
                    title: "Tool Life Warning",
                    machine: "Haas VF-2",
                    severity: "warning",
                  },
                  {
                    title: "Coolant Level Low",
                    machine: "Mazak QTN-200",
                    severity: "critical",
                  },
                ].map((alert, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-surface rounded border border-border">
                    <div className="flex items-start gap-3">
                      <AlertTriangle
                        size={16}
                        className={
                          alert.severity === "critical"
                            ? "text-error"
                            : "text-warning"
                        }
                      />
                      <div>
                        <p className="text-sm font-medium text-text-muted">
                          {alert.title}
                        </p>
                        <p className="text-xs text-text-muted mt-1">
                          {alert.machine}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedMachine && (
        <Modal
          isOpen={isTimelineModalOpen}
          onClose={() => {
            setIsTimelineModalOpen(false);
            setSelectedMachine(null);
          }}
          title={`${selectedMachine.name} - Machine State Timeline`}
          size="lg">
          <div className="space-y-4 p-2">
            {/* Timeline Container */}
            <div className="relative">
              {/* Timeline Header with times */}
              <div className="flex border-b sticky top-0 bg-background">
                <div className="w-20 flex-shrink-0" />{" "}
                {/* Spacer for scrollbar */}
                {Array.from({ length: 25 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 w-[100px] text-xs text-text-muted border-l px-1">
                    {String(6 + Math.floor(i / 2)).padStart(2, "0")}:
                    {i % 2 ? "30" : "00"}
                  </div>
                ))}
              </div>

              {/* Scrollable Timeline */}
              <div className="overflow-x-auto">
                <div
                  className="flex h-16 relative"
                  style={{ width: "calc(100px * 25)" }}>
                  {/* State Blocks */}
                  {machineStateTimeline[selectedMachine.id].map(
                    (event, index) => {
                      // Convert timestamp to position
                      const [hours, minutes] = event.timestamp
                        .split(":")
                        .map(Number);
                      const startMinutes = (hours - 6) * 60 + minutes; // 6:00 is our start time
                      const widthMinutes = event.duration / 60;

                      return (
                        <div
                          key={index}
                          className="absolute h-full transition-opacity hover:opacity-90"
                          style={{
                            left: `${(startMinutes / 30) * 100}px`,
                            width: `${(widthMinutes / 30) * 100}px`,
                            backgroundColor: getStateColor(event.state),
                            top: 0,
                          }}>
                          <div className="h-full flex items-center justify-center text-xs text-white font-medium truncate px-2">
                            {event.state}
                          </div>

                          {/* Tooltip */}
                          <div className="absolute bottom-full mb-2 left-0 bg-background border rounded p-2 hidden group-hover:block whitespace-nowrap z-10">
                            <p className="font-medium">{event.state}</p>
                            <p className="text-xs">
                              {event.timestamp} - Duration:{" "}
                              {Math.floor(event.duration / 60)}m
                            </p>
                          </div>
                        </div>
                      );
                    }
                  )}

                  {/* Time Grid Lines */}
                  {Array.from({ length: 49 }).map((_, i) => (
                    <div
                      key={i}
                      className={`absolute h-full border-l ${
                        i % 2 === 0 ? "border-border" : "border-border/30"
                      }`}
                      style={{ left: `${i * 50}px` }}
                    />
                  ))}
                </div>
              </div>

              {/* Current Time Indicator */}
              <div
                className="absolute top-0 h-full border-l-2 border-primary"
                style={{ left: "300px" }}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 pt-4 border-t">
              {/* Legend */}
              <div className="flex gap-2 flex-wrap">
                {Array.from(
                  new Set(
                    machineStateTimeline[selectedMachine.id].map((x) => x.state)
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
          </div>
        </Modal>
      )}

      {isAllTimelinesModalOpen && (
        <Modal
          isOpen={isAllTimelinesModalOpen}
          onClose={() => setIsAllTimelinesModalOpen(false)}
          title="All Machine Timelines"
          size="lg">
          <AllTimelinesTimelineFetcher dateRange={dateRange} />
          <div className="space-y-4 p-2">
            {/* Timeline Header with times - Sticky */}
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

            {/* Scrollable Container */}
            <div className="overflow-x-auto">
              <div className="min-w-[2500px]">
                {" "}
                {/* Width to accommodate timeline */}
                {/* Machine Timelines */}
                <div className="space-y-1">
                  {machineStatus.map((machine) => (
                    <div
                      key={machine.id}
                      className="flex items-center group hover:bg-surface/50 rounded">
                      {/* Machine Name */}
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
                          <span className="text-sm font-medium">
                            {machine.name}
                          </span>
                        </div>
                      </div>

                      {/* Timeline */}
                      <div className="flex-1 h-12 relative">
                        {/* Time Grid Lines */}
                        {Array.from({ length: 49 }).map((_, i) => (
                          <div
                            key={i}
                            className={`absolute h-full border-l ${
                              i % 2 === 0 ? "border-border" : "border-border/30"
                            }`}
                            style={{ left: `${i * 50}px` }}
                          />
                        ))}

                        {/* State Blocks */}
                        {machineStateTimeline[machine.id]?.map(
                          (event, index) => {
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
                                    {event.timestamp} (
                                    {Math.floor(event.duration / 60)}m)
                                  </p>
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="border-t pt-4 flex flex-wrap gap-2">
              {Array.from(
                new Set(
                  Object.values(machineStateTimeline)
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
        </Modal>
      )}

      {isMapModalOpen && (
        <Modal
          isOpen={isMapModalOpen}
          onClose={() => setIsMapModalOpen(false)}
          title="Machine Map"
          size="md">
          <div className="p-2">
            <MachineMap machines={machineStatus} />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Dashboard;

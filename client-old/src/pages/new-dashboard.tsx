import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  format,
  startOfToday,
  subDays,
  subMonths,
  isAfter,
  startOfDay,
  endOfDay,
} from "date-fns";

// Sample data with 8 machines
const machineData = [
  {
    id: 1,
    name: "CNC Mill #1",
    status: "running",
    currentJob: "Part XYZ-123",
    progress: 75,
    efficiency: 92,
    partsCompleted: 150,
    partsTarget: 200,
  },
  {
    id: 2,
    name: "CNC Lathe #1",
    status: "idle",
    currentJob: "Part ABC-456",
    progress: 0,
    efficiency: 85,
    partsCompleted: 180,
    partsTarget: 200,
  },
  {
    id: 3,
    name: "CNC Mill #2",
    status: "error",
    currentJob: "Part DEF-789",
    progress: 45,
    efficiency: 65,
    partsCompleted: 90,
    partsTarget: 150,
  },
  {
    id: 4,
    name: "CNC Lathe #2",
    status: "running",
    currentJob: "Part GHI-101",
    progress: 88,
    efficiency: 95,
    partsCompleted: 175,
    partsTarget: 200,
  },
  {
    id: 5,
    name: "CNC Mill #3",
    status: "running",
    currentJob: "Part JKL-202",
    progress: 32,
    efficiency: 78,
    partsCompleted: 65,
    partsTarget: 100,
  },
  {
    id: 6,
    name: "Surface Grinder",
    status: "idle",
    currentJob: "Part MNO-303",
    progress: 0,
    efficiency: 72,
    partsCompleted: 45,
    partsTarget: 80,
  },
  {
    id: 7,
    name: "EDM Machine",
    status: "error",
    currentJob: "Part PQR-404",
    progress: 15,
    efficiency: 45,
    partsCompleted: 20,
    partsTarget: 50,
  },
  {
    id: 8,
    name: "CNC Router",
    status: "running",
    currentJob: "Part STU-505",
    progress: 92,
    efficiency: 88,
    partsCompleted: 88,
    partsTarget: 100,
  },
];

// Sample production metrics
const productionMetrics = {
  dailyOutput: 420,
  targetOutput: 500,
  efficiency: 84,
  quality: 98,
  downtime: 45,
  activeJobs: 8,
};

// Sample recent errors
const recentErrors = [
  {
    id: 1,
    machine: "EDM Machine",
    error: "Tool breakage detected",
    timestamp: "2024-03-20 14:23:45",
    severity: "high",
  },
  {
    id: 2,
    machine: "CNC Mill #2",
    error: "Spindle overload",
    timestamp: "2024-03-20 13:15:22",
    severity: "medium",
  },
  {
    id: 3,
    machine: "CNC Lathe #1",
    error: "Emergency stop triggered",
    timestamp: "2024-03-20 11:45:33",
    severity: "high",
  },
  {
    id: 4,
    machine: "CNC Mill #3",
    error: "Coolant level low",
    timestamp: "2024-03-20 10:30:15",
    severity: "low",
  },
];

// Update the production capacity data format for Recharts
const productionCapacityData = [
  { time: "6:00", actual: 65, target: 85 },
  { time: "8:00", actual: 78, target: 85 },
  { time: "10:00", actual: 90, target: 85 },
  { time: "12:00", actual: 85, target: 85 },
  { time: "14:00", actual: 92, target: 85 },
  { time: "16:00", actual: 88, target: 85 },
  { time: "18:00", actual: 95, target: 85 },
  { time: "20:00", actual: 89, target: 85 },
];

// Add date range presets
const dateRangePresets = [
  {
    label: "Today",
    getValue: () => ({ start: startOfToday(), end: new Date() }),
  },
  {
    label: "Yesterday",
    getValue: () => ({
      start: subDays(startOfToday(), 1),
      end: subDays(startOfToday(), 1),
    }),
  },
  {
    label: "Last 7 Days",
    getValue: () => ({ start: subDays(new Date(), 7), end: new Date() }),
  },
  {
    label: "Last 14 Days",
    getValue: () => ({ start: subDays(new Date(), 14), end: new Date() }),
  },
  {
    label: "Last 30 Days",
    getValue: () => ({ start: subDays(new Date(), 30), end: new Date() }),
  },
  {
    label: "This Month",
    getValue: () => ({
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      end: new Date(),
    }),
  },
  {
    label: "Last Month",
    getValue: () => ({
      start: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
      end: new Date(new Date().getFullYear(), new Date().getMonth(), 0),
    }),
  },
  {
    label: "Last Quarter",
    getValue: () => ({ start: subMonths(new Date(), 3), end: new Date() }),
  },
];

const NewDashboard = () => {
  // Update state management
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [dateRange, setDateRange] = useState(() =>
    dateRangePresets[0].getValue()
  );
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [selectedPreset, setSelectedPreset] = useState("Today");

  // Add date handling functions
  const handlePresetSelect = (preset: (typeof dateRangePresets)[0]) => {
    setSelectedPreset(preset.label);
    setDateRange(preset.getValue());
    setCustomStartDate(format(preset.getValue().start, "yyyy-MM-dd"));
    setCustomEndDate(format(preset.getValue().end, "yyyy-MM-dd"));
  };

  const handleCustomDateChange = () => {
    if (customStartDate && customEndDate) {
      const start = startOfDay(new Date(customStartDate));
      const end = endOfDay(new Date(customEndDate));

      if (isAfter(start, end)) {
        alert("Start date must be before end date");
        return;
      }

      setDateRange({ start, end });
      setSelectedPreset("Custom");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "bg-green-100 text-green-800";
      case "idle":
        return "bg-yellow-100 text-yellow-800";
      case "error":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "text-red-600";
      case "medium":
        return "text-yellow-600";
      case "low":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Updated Header with Advanced Date Picker */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">
          Production Dashboard
        </h1>
        <div className="relative">
          <button
            onClick={() => setDatePickerOpen(!datePickerOpen)}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
            <span>
              {format(dateRange.start, "MMM d, yyyy")} -{" "}
              {format(dateRange.end, "MMM d, yyyy")}
            </span>
            <svg
              className="h-5 w-5 text-gray-400"
              viewBox="0 0 20 20"
              fill="currentColor">
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {datePickerOpen && (
            <div className="absolute right-0 mt-2 w-96 rounded-lg bg-white p-4 shadow-lg ring-1 ring-black ring-opacity-5">
              <div className="mb-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mb-4">
                <button
                  onClick={handleCustomDateChange}
                  className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                  Apply Custom Range
                </button>
              </div>

              <div className="mb-2 text-xs font-medium text-gray-500">
                Preset Ranges
              </div>
              <div className="grid grid-cols-2 gap-2">
                {dateRangePresets.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => {
                      handlePresetSelect(preset);
                      setDatePickerOpen(false);
                    }}
                    className={`rounded-md px-3 py-2 text-sm font-medium ${
                      selectedPreset === preset.label
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}>
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => setDatePickerOpen(false)}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleCustomDateChange();
                    setDatePickerOpen(false);
                  }}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        {Object.entries(productionMetrics).map(([key, value]) => (
          <div
            key={key}
            className="rounded-lg bg-white p-3 shadow-sm">
            <div className="text-xs font-medium text-gray-500">
              {key
                .replace(/([A-Z])/g, " $1")
                .replace(/^./, (str) => str.toUpperCase())}
            </div>
            <div className="mt-1 text-xl font-semibold">
              {typeof value === "number"
                ? value + (key.includes("percentage") ? "%" : "")
                : value}
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* Machine Status Grid */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {machineData.map((machine) => (
              <div
                key={machine.id}
                className="rounded-lg bg-white p-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900">
                    {machine.name}
                  </h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${getStatusColor(
                      machine.status
                    )}`}>
                    {machine.status}
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-xs text-gray-500">Current Job</div>
                  <div className="text-sm font-medium">
                    {machine.currentJob}
                  </div>
                </div>
                <div className="mt-2">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span>Progress</span>
                    <span>{machine.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-gray-200">
                    <div
                      className="h-1.5 rounded-full bg-blue-600"
                      style={{ width: `${machine.progress}%` }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Errors */}
        <div className="lg:col-span-1">
          <div className="rounded-lg bg-white p-3 shadow-sm">
            <h2 className="mb-2 text-sm font-semibold text-gray-900">
              Recent Errors
            </h2>
            <div className="space-y-2">
              {recentErrors.map((error) => (
                <div
                  key={error.id}
                  className="border-b border-gray-100 pb-2 last:border-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-medium">{error.machine}</div>
                      <div
                        className={`text-xs ${getSeverityColor(error.severity)}`}>
                        {error.error}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(error.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Production Capacity Graph */}
      <div className="mt-4">
        <div className="rounded-lg bg-white p-3 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold text-gray-900">
            Production Capacity
          </h2>
          <div className="h-64">
            <ResponsiveContainer
              width="100%"
              height="100%">
              <LineChart
                data={productionCapacityData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f0f0f0"
                />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 12 }}
                  stroke="#9CA3AF"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="#9CA3AF"
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #E5E7EB",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem",
                  }}
                />
                <Legend
                  align="end"
                  verticalAlign="top"
                  height={36}
                  iconType="circle"
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  name="Actual Production"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  name="Target Capacity"
                  stroke="#E5E7EB"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewDashboard;

import { format, startOfToday, subDays, startOfDay } from "date-fns";
import { useState } from "react";
import { Calendar } from "lucide-react";
import { Button } from "@/components";

type DatePickerProps = {
  dateRange: {
    start: Date;
    end: Date;
  };
  setDateRange: (dateRange: { start: Date; end: Date }) => void;
};

const DatePicker = ({ dateRange, setDateRange }: DatePickerProps) => {
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [customStartDate, setCustomStartDate] = useState(
    startOfDay(dateRange.start)
  );
  const [customEndDate, setCustomEndDate] = useState(startOfDay(dateRange.end));

  const dateRangePresets = [
    {
      label: "Today",
      getValue: () => ({
        start: startOfDay(startOfToday()),
        end: startOfDay(new Date()),
      }),
    },
    {
      label: "Yesterday",
      getValue: () => {
        const yesterday = startOfDay(subDays(startOfToday(), 1));
        return { start: yesterday, end: yesterday };
      },
    },
    {
      label: "This Week",
      getValue: () => {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        return { start: startOfDay(startOfWeek), end: startOfDay(now) };
      },
    },
    {
      label: "This Month",
      getValue: () => {
        const now = new Date();
        const start = startOfDay(
          new Date(now.getFullYear(), now.getMonth(), 1)
        );
        return { start, end: startOfDay(now) };
      },
    },
    {
      label: "This Quarter",
      getValue: () => {
        const now = new Date();
        const quarter = Math.floor(now.getMonth() / 3);
        const start = startOfDay(new Date(now.getFullYear(), quarter * 3, 1));
        return { start, end: startOfDay(now) };
      },
    },
    {
      label: "This Year",
      getValue: () => {
        const now = new Date();
        const start = startOfDay(new Date(now.getFullYear(), 0, 1));
        return { start, end: startOfDay(now) };
      },
    },
    {
      label: "Last Week",
      getValue: () => {
        const now = new Date();
        const startOfThisWeek = new Date(now);
        startOfThisWeek.setDate(now.getDate() - now.getDay());
        const start = new Date(startOfThisWeek);
        start.setDate(start.getDate() - 7);
        const end = new Date(startOfThisWeek);
        end.setDate(end.getDate() - 1);
        return { start: startOfDay(start), end: startOfDay(end) };
      },
    },
    {
      label: "Last Month",
      getValue: () => {
        const now = new Date();
        const start = startOfDay(
          new Date(now.getFullYear(), now.getMonth() - 1, 1)
        );
        const end = startOfDay(new Date(now.getFullYear(), now.getMonth(), 0));
        return { start, end };
      },
    },
    {
      label: "Last Quarter",
      getValue: () => {
        const now = new Date();
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const start = startOfDay(
          new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1)
        );
        const end = startOfDay(
          new Date(now.getFullYear(), currentQuarter * 3, 0)
        );
        return { start, end };
      },
    },
    {
      label: "Last Year",
      getValue: () => {
        const now = new Date();
        const start = startOfDay(new Date(now.getFullYear() - 1, 0, 1));
        const end = startOfDay(new Date(now.getFullYear() - 1, 11, 31));
        return { start, end };
      },
    },
  ];

  let dateLabel = "";
  if (dateRange.start.toDateString() === dateRange.end.toDateString()) {
    dateLabel = format(dateRange.start, "MMM d, yyyy");
  } else {
    dateLabel = `${format(dateRange.start, "MMM d, yyyy")} - ${format(
      dateRange.end,
      "MMM d, yyyy"
    )}`;
  }

  return (
    <div className="w-full sm:w-auto relative hidden sm:block">
      <Button
        variant="secondary-outline"
        onClick={() => setDatePickerOpen(!datePickerOpen)}
        className="flex items-center gap-2 w-full sm:w-auto">
        <Calendar size={16} />
        <span className="hidden sm:inline">{dateLabel}</span>
      </Button>

      {datePickerOpen && (
        <div className="absolute right-0 mt-2 w-96 rounded bg-foreground p-2 shadow-lg ring-1 ring-border ring-opacity-5 z-50">
          <label
            htmlFor="startDate"
            className="text-sm text-text-muted mb-2 block">
            Date Range
          </label>
          <div className="mb-2 flex items-center gap-2">
            <input
              type="date"
              value={format(customStartDate, "yyyy-MM-dd")}
              onChange={(e) => setCustomStartDate(new Date(e.target.value))}
              className="block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-text-muted placeholder:text-text-muted"
            />
            <p className="text-sm text-text-muted">to</p>
            <input
              type="date"
              value={format(customEndDate, "yyyy-MM-dd")}
              onChange={(e) => setCustomEndDate(new Date(e.target.value))}
              className="block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-text-muted placeholder:text-text-muted"
            />
          </div>

          <label
            htmlFor="startDate"
            className="text-sm text-text-muted mb-2 block">
            Presets
          </label>

          <div className="grid grid-cols-2 gap-2 mb-2">
            {dateRangePresets.map((preset) => (
              <Button
                key={preset.label}
                variant="secondary-outline"
                onClick={() => {
                  setDateRange(preset.getValue());
                  setDatePickerOpen(false);
                }}>
                {preset.label}
              </Button>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary-outline"
              onClick={() => setDatePickerOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setDateRange({ start: customStartDate, end: customEndDate });
                setDatePickerOpen(false);
              }}>
              Apply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;

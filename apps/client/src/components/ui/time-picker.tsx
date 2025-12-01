import { Clock } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components";

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

function TimePicker({
  value,
  onChange,
  placeholder = "Select time",
  className = "",
  disabled = false,
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempHour, setTempHour] = useState<string>("12");
  const [tempMinute, setTempMinute] = useState<string>("00");
  const [tempPeriod, setTempPeriod] = useState<"AM" | "PM">("AM");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const formatTime = (time24: string): string => {
    if (!time24)
      return placeholder;

    const [hours, minutes] = time24.split(":");
    const hour = Number.parseInt(hours);
    const period = hour >= 12 ? "PM" : "AM";
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

    return `${hour12}:${minutes} ${period}`;
  };

  const convertTo24Hour = (hour: string, minute: string, period: "AM" | "PM"): string => {
    let hour24 = Number.parseInt(hour);

    if (period === "AM" && hour24 === 12) {
      hour24 = 0;
    }
    else if (period === "PM" && hour24 !== 12) {
      hour24 += 12;
    }

    return `${hour24.toString().padStart(2, "0")}:${minute}`;
  };

  const parseTime = (time24: string) => {
    if (!time24) {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();

      setTempHour(hour === 0 ? "12" : hour > 12 ? (hour - 12).toString() : hour.toString());
      setTempMinute(minute.toString().padStart(2, "0"));
      setTempPeriod(hour >= 12 ? "PM" : "AM");
      return;
    }

    const [hours, minutes] = time24.split(":");
    const hour = Number.parseInt(hours);
    const period = hour >= 12 ? "PM" : "AM";
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

    setTempHour(hour12.toString());
    setTempMinute(minutes);
    setTempPeriod(period);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpen = () => {
    if (disabled)
      return;
    parseTime(value);
    setIsOpen(true);
  };

  const handleApply = () => {
    const time24 = convertTo24Hour(tempHour, tempMinute, tempPeriod);
    onChange(time24);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  const incrementHour = () => {
    const hour = Number.parseInt(tempHour);
    setTempHour(hour === 12 ? "1" : (hour + 1).toString());
  };

  const decrementHour = () => {
    const hour = Number.parseInt(tempHour);
    setTempHour(hour === 1 ? "12" : (hour - 1).toString());
  };

  const incrementMinute = () => {
    const minute = Number.parseInt(tempMinute);
    setTempMinute(minute === 59 ? "00" : (minute + 1).toString().padStart(2, "0"));
  };

  const decrementMinute = () => {
    const minute = Number.parseInt(tempMinute);
    setTempMinute(minute === 0 ? "59" : (minute - 1).toString().padStart(2, "0"));
  };

  const setCurrentTime = () => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();

    setTempHour(hour === 0 ? "12" : hour > 12 ? (hour - 12).toString() : hour.toString());
    setTempMinute(minute.toString().padStart(2, "0"));
    setTempPeriod(hour >= 12 ? "PM" : "AM");
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <Button
        onClick={handleOpen}
        variant="secondary-outline"
        disabled={disabled}
        className="w-full justify-start"
      >
        <Clock size={16} />
        <span className="flex-1 text-left">
          {formatTime(value)}
        </span>
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={handleCancel}
          />
          <div className="absolute left-0 z-50 mt-1 p-3 bg-foreground border border-border rounded shadow-lg">
            <div className="w-64">
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={incrementHour}
                    className="p-1 hover:bg-surface rounded transition-colors cursor-pointer text-text-muted"
                  >
                    ▲
                  </button>
                  <input
                    type="text"
                    value={tempHour}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      if (val === "" || (Number.parseInt(val) >= 1 && Number.parseInt(val) <= 12)) {
                        setTempHour(val);
                      }
                    }}
                    onBlur={() => {
                      const hour = Number.parseInt(tempHour) || 12;
                      setTempHour(Math.max(1, Math.min(12, hour)).toString());
                    }}
                    className="w-12 text-center text-2xl font-medium bg-surface border border-border rounded py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <button
                    type="button"
                    onClick={decrementHour}
                    className="p-1 hover:bg-surface rounded transition-colors cursor-pointer text-text-muted"
                  >
                    ▼
                  </button>
                </div>

                <span className="text-2xl font-medium text-text-muted">:</span>

                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={incrementMinute}
                    className="p-1 hover:bg-surface rounded transition-colors cursor-pointer text-text-muted"
                  >
                    ▲
                  </button>
                  <input
                    type="text"
                    value={tempMinute}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      if (val === "" || (Number.parseInt(val) >= 0 && Number.parseInt(val) <= 59)) {
                        setTempMinute(val.padStart(2, "0"));
                      }
                    }}
                    onBlur={() => {
                      const minute = Number.parseInt(tempMinute) || 0;
                      setTempMinute(Math.max(0, Math.min(59, minute)).toString().padStart(2, "0"));
                    }}
                    className="w-12 text-center text-2xl font-medium bg-surface border border-border rounded py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <button
                    type="button"
                    onClick={decrementMinute}
                    className="p-1 hover:bg-surface rounded transition-colors cursor-pointer text-text-muted"
                  >
                    ▼
                  </button>
                </div>

                <div className="flex flex-col gap-1 ml-2">
                  <button
                    type="button"
                    onClick={() => setTempPeriod("AM")}
                    className={`px-2 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                      tempPeriod === "AM"
                        ? "bg-primary text-background"
                        : "bg-surface text-text-muted hover:bg-surface/80"
                    }`}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempPeriod("PM")}
                    className={`px-2 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                      tempPeriod === "PM"
                        ? "bg-primary text-background"
                        : "bg-surface text-text-muted hover:bg-surface/80"
                    }`}
                  >
                    PM
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={setCurrentTime}
                  className="text-xs text-primary hover:underline font-medium cursor-pointer"
                >
                  Now
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-2 py-1 text-xs text-text-muted hover:text-text transition-colors rounded cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApply}
                    className="px-2 py-1 text-xs bg-primary text-background rounded hover:bg-primary/90 transition-colors cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default TimePicker;

import { useCallback, useEffect, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "react-router-dom";

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

const DateRangePicker = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [workingRange, setWorkingRange] = useState<DateRange>({
    startDate: null,
    endDate: null,
  });

  const [confirmedRange, setConfirmedRange] = useState<DateRange>({
    startDate: null,
    endDate: null,
  });

  const formatDateToISO = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const updateURLParams = useCallback(
    (range: DateRange) => {
      const params = new URLSearchParams(searchParams);

      if (range.startDate) {
        params.set("startDate", formatDateToISO(range.startDate));
      } else {
        params.delete("startDate");
      }

      if (range.endDate) {
        params.set("endDate", formatDateToISO(range.endDate));
      } else {
        params.delete("endDate");
      }

      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const handleDateClick = (date: Date) => {
    if (!workingRange.startDate || workingRange.endDate) {
      setWorkingRange({
        startDate: date,
        endDate: null,
      });
    } else if (date > workingRange.startDate) {
      setWorkingRange({
        ...workingRange,
        endDate: date,
      });
    } else {
      setWorkingRange({
        startDate: date,
        endDate: null,
      });
    }
  };

  const handleApply = () => {
    if (workingRange.startDate) {
      setConfirmedRange(workingRange);
      updateURLParams(workingRange);
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setWorkingRange({ startDate: null, endDate: null });
    setConfirmedRange({ startDate: null, endDate: null });
    updateURLParams({ startDate: null, endDate: null });
    setIsOpen(false);
  };

  const handleNavigate = (days: number) => {
    const baseDate = confirmedRange.startDate || new Date();
    const newStart = new Date(baseDate);
    newStart.setDate(newStart.getDate() + days);

    let newEnd = null;
    if (confirmedRange.endDate) {
      newEnd = new Date(confirmedRange.endDate);
      newEnd.setDate(newEnd.getDate() + days);
    }

    const newRange = { startDate: newStart, endDate: newEnd };
    setConfirmedRange(newRange);
    updateURLParams(newRange);
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentMonth(newDate);
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: (Date | null)[] = [];
    const startPadding = firstDay.getDay();

    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const formatDateRange = () => {
    if (!confirmedRange.startDate) return "Today";

    const start = confirmedRange.startDate.toLocaleDateString();
    if (!confirmedRange.endDate) return start;

    return `${start} - ${confirmedRange.endDate.toLocaleDateString()}`;
  };

  useEffect(() => {
    const startParam = searchParams.get("startDate");
    const endParam = searchParams.get("endDate");

    if (!startParam) {
      setConfirmedRange({ startDate: null, endDate: null });
      return;
    }

    const [startYear, startMonth, startDay] = startParam.split("-").map(Number);
    const startDate = new Date(startYear, startMonth - 1, startDay, 12);

    let endDate = null;
    if (endParam) {
      const [endYear, endMonth, endDay] = endParam.split("-").map(Number);
      endDate = new Date(endYear, endMonth - 1, endDay, 12);
    }

    const newRange = { startDate, endDate };
    setWorkingRange(newRange);
    setConfirmedRange(newRange);
    setCurrentMonth(startDate);
  }, [searchParams]);

  useEffect(() => {
    if (isOpen) {
      setWorkingRange(confirmedRange);
    }
  }, [isOpen, confirmedRange]);

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isInRange = (date: Date): boolean => {
    return !!(
      workingRange.startDate &&
      workingRange.endDate &&
      date > workingRange.startDate &&
      date < workingRange.endDate
    );
  };

  const getRangeLength = () => {
    if (!workingRange.startDate || !workingRange.endDate) {
      return 1;
    }

    const diffTime = Math.abs(
      workingRange.endDate.getTime() - workingRange.startDate.getTime()
    );
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays + 1;
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={() => handleNavigate(getRangeLength() * -1)}
        variant="outline"
        size="icon">
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Popover
        open={isOpen}
        onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-max justify-start text-left font-normal">
            <Calendar className="mr-2 h-4 w-4" />
            {formatDateRange()}
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-auto p-0"
          align="start">
          <Card className="border-0 shadow-none">
            <div className="flex items-center justify-between p-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => changeMonth(-12)}>
                <ChevronLeft className="h-4 w-4" />
                <ChevronLeft className="h-4 w-4 -ml-2" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => changeMonth(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                onClick={() => setCurrentMonth(new Date())}
                className="text-sm font-medium">
                {currentMonth.toLocaleString("default", {
                  month: "long",
                  year: "numeric",
                })}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => changeMonth(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => changeMonth(12)}>
                <ChevronRight className="h-4 w-4" />
                <ChevronRight className="h-4 w-4 -ml-2" />
              </Button>
            </div>

            <CardContent className="p-3 pt-0">
              <div className="grid grid-cols-7 gap-2 text-center text-sm">
                {WEEKDAYS.map((day) => (
                  <div
                    key={day}
                    className="text-muted-foreground">
                    {day}
                  </div>
                ))}

                {getDaysInMonth().map((date, i) => {
                  if (!date) return <div key={`empty-${i}`} />;

                  const isSelected =
                    workingRange.startDate?.toDateString() ===
                      date.toDateString() ||
                    workingRange.endDate?.toDateString() ===
                      date.toDateString();

                  return (
                    <button
                      key={date.toISOString()}
                      onClick={() => handleDateClick(date)}
                      className={`
                        w-8 h-8 rounded-md flex items-center justify-center text-sm
                        ${isSelected ? "bg-primary text-primary-foreground" : ""}
                        ${isInRange(date) ? "bg-muted" : ""}
                        ${isToday(date) ? "border border-primary" : ""}
                        hover:bg-muted
                      `}>
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-between items-center border-t pt-3 mt-2">
                <button
                  onClick={handleClear}
                  className="text-sm text-destructive hover:text-destructive/80">
                  Clear
                </button>
                <Button
                  onClick={handleApply}
                  disabled={!workingRange.startDate}>
                  Apply
                </Button>
              </div>
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>

      <Button
        onClick={() => handleNavigate(getRangeLength())}
        variant="outline"
        size="icon">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default DateRangePicker;

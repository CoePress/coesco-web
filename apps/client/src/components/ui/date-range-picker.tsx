import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components';

interface DateRangePickerProps {
  startDate: Date;
  endDate: Date;
  onChange: (startDate: Date, endDate: Date) => void;
  className?: string;
}

const DateRangePicker = ({
  startDate,
  endDate,
  onChange,
  className = ''
}: DateRangePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStart, setTempStart] = useState<Date | null>(null);
  const [tempEnd, setTempEnd] = useState<Date | null>(null);
  const [viewMonth, setViewMonth] = useState<Date>(new Date());

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const formatDateRange = (): string => {
    const today = new Date();
    const isToday = startDate.toDateString() === today.toDateString() &&
                    endDate.toDateString() === today.toDateString();

    if (isToday) {
      return 'Today';
    }

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    };

    if (startDate.toDateString() === endDate.toDateString()) {
      return formatDate(startDate);
    }

    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  const goToPreviousDay = () => {
    const newDate = new Date(startDate);
    newDate.setDate(newDate.getDate() - 1);
    onChange(newDate, newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(startDate);
    newDate.setDate(newDate.getDate() + 1);
    onChange(newDate, newDate);
  };

  const goToToday = () => {
    const today = new Date();
    onChange(today, today);
    setIsOpen(false);
    setTempStart(null);
    setTempEnd(null);
  };

  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);

    if (!tempStart) {
      setTempStart(clickedDate);
      setTempEnd(null);
    } else if (!tempEnd) {
      if (clickedDate < tempStart) {
        setTempEnd(tempStart);
        setTempStart(clickedDate);
      } else {
        setTempEnd(clickedDate);
      }
    } else {
      setTempStart(clickedDate);
      setTempEnd(null);
    }
  };

  const applyDateRange = () => {
    if (tempStart && tempEnd) {
      onChange(tempStart, tempEnd);
    } else if (tempStart) {
      onChange(tempStart, tempStart);
    }
    setIsOpen(false);
    setTempStart(null);
    setTempEnd(null);
  };

  const cancel = () => {
    setIsOpen(false);
    setTempStart(null);
    setTempEnd(null);
  };

  const isSelectedDate = (day: number): boolean => {
    const date = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
    const dateStr = date.toDateString();

    if (tempStart && tempStart.toDateString() === dateStr) return true;
    if (tempEnd && tempEnd.toDateString() === dateStr) return true;

    return false;
  };

  const isInRange = (day: number): boolean => {
    const date = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);

    if (tempStart && tempEnd) {
      const start = tempStart < tempEnd ? tempStart : tempEnd;
      const end = tempStart < tempEnd ? tempEnd : tempStart;
      return start <= date && date <= end;
    }

    return false;
  };

  const isToday = (day: number): boolean => {
    const today = new Date();
    return (
      today.getFullYear() === viewMonth.getFullYear() &&
      today.getMonth() === viewMonth.getMonth() &&
      today.getDate() === day
    );
  };

  const handlePreviousMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1));
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(viewMonth);
    const firstDay = getFirstDayOfMonth(viewMonth);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-7" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = isSelectedDate(day);
      const isCurrentDay = isToday(day);
      const inRange = isInRange(day);

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateClick(day)}
          className={`
            h-7 w-full rounded text-xs font-medium
            transition-colors cursor-pointer
            ${isSelected
              ? 'bg-primary text-background'
              : inRange
              ? 'bg-primary/20 text-text'
              : isCurrentDay
              ? 'text-primary hover:bg-surface'
              : 'text-text-muted hover:bg-surface'
            }
          `}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button onClick={goToPreviousDay} variant="secondary-outline" className="px-2">
        <ChevronLeft size={16} />
      </Button>

      <div className="relative">
        <Button onClick={() => setIsOpen(!isOpen)} variant="secondary-outline">
          <Calendar size={16} />
          <span className="min-w-[100px] text-left">
            {formatDateRange()}
          </span>
        </Button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={cancel}
            />
            <div className="absolute right-0 z-50 mt-1 p-3 bg-foreground border border-border rounded shadow-lg">
              <div className="w-72">
                <div className="flex items-center justify-between mb-3">
                  <button
                    type="button"
                    onClick={handlePreviousMonth}
                    className="p-1 hover:bg-surface rounded transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={16} className="text-text-muted" />
                  </button>

                  <div className="text-xs font-medium text-text-muted">
                    {monthNames[viewMonth.getMonth()]} {viewMonth.getFullYear()}
                  </div>

                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1 hover:bg-surface rounded transition-colors cursor-pointer"
                  >
                    <ChevronRight size={16} className="text-text-muted" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-2">
                  {dayNames.map(day => (
                    <div key={day} className="h-7 flex items-center justify-center text-xs font-medium text-text-muted">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1 mb-3">
                  {renderCalendarDays()}
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={goToToday}
                    className="text-xs text-primary hover:underline font-medium cursor-pointer"
                  >
                    Today
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={cancel}
                      className="px-2 py-1 text-xs text-text-muted hover:text-text transition-colors rounded cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={applyDateRange}
                      disabled={!tempStart}
                      className="px-2 py-1 text-xs bg-primary text-background rounded hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                </div>

                {!tempStart ? (
                  <div className="mt-2 text-xs text-text-muted text-center">
                    Select start date
                  </div>
                ) : !tempEnd ? (
                  <div className="mt-2 text-xs text-text-muted text-center">
                    Select end date (or click Apply for single day)
                  </div>
                ) : null}
              </div>
            </div>
          </>
        )}
      </div>

      <Button onClick={goToNextDay} variant="secondary-outline" className="px-2">
        <ChevronRight size={16} />
      </Button>
    </div>
  );
};

export default DateRangePicker;

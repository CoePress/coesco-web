import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar, ChevronDown } from 'lucide-react';
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
  const [tempStartDate, setTempStartDate] = useState<Date | null>(null);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(null);
  const [selectingStart, setSelectingStart] = useState(true);
  const [viewMonth, setViewMonth] = useState<Date>(new Date());
  const pickerRef = useRef<HTMLDivElement>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setTempStartDate(null);
        setTempEndDate(null);
        setSelectingStart(true);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
  };

  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);

    if (selectingStart || !tempStartDate) {
      setTempStartDate(clickedDate);
      setTempEndDate(null);
      setSelectingStart(false);
    } else {
      if (clickedDate < tempStartDate) {
        setTempEndDate(tempStartDate);
        setTempStartDate(clickedDate);
      } else {
        setTempEndDate(clickedDate);
      }
    }
  };

  const applyDateRange = () => {
    if (tempStartDate && tempEndDate) {
      onChange(tempStartDate, tempEndDate);
      setIsOpen(false);
      setTempStartDate(null);
      setTempEndDate(null);
      setSelectingStart(true);
    } else if (tempStartDate) {
      onChange(tempStartDate, tempStartDate);
      setIsOpen(false);
      setTempStartDate(null);
      setTempEndDate(null);
      setSelectingStart(true);
    }
  };

  const isSelectedDate = (day: number): boolean => {
    const date = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
    const dateStr = date.toDateString();

    // Check if it's in the current range
    if (startDate.toDateString() === dateStr || endDate.toDateString() === dateStr) {
      return true;
    }

    // Check if it's in the temp range
    if (tempStartDate && tempStartDate.toDateString() === dateStr) {
      return true;
    }
    if (tempEndDate && tempEndDate.toDateString() === dateStr) {
      return true;
    }

    return false;
  };

  const isInRange = (day: number): boolean => {
    const date = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);

    // Check current range
    if (startDate <= date && date <= endDate) {
      return true;
    }

    // Check temp range
    if (tempStartDate && tempEndDate) {
      const start = tempStartDate < tempEndDate ? tempStartDate : tempEndDate;
      const end = tempStartDate < tempEndDate ? tempEndDate : tempStartDate;
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
      days.push(<div key={`empty-${i}`} className="h-8" />);
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
            h-8 w-8 rounded-lg text-sm font-medium
            transition-all duration-150
            ${isSelected
              ? 'bg-primary text-background'
              : inRange
              ? 'bg-primary/20 text-primary'
              : isCurrentDay
              ? 'bg-primary/10 text-primary hover:bg-primary/20'
              : 'text-text hover:bg-foreground'
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
    <div className="relative" ref={pickerRef}>
      <div className={`flex items-center gap-1 ${className}`}>
        <Button onClick={goToPreviousDay} variant="secondary-outline" className="px-2">
          <ChevronLeft size={16} />
        </Button>

        <Button onClick={() => setIsOpen(!isOpen)} variant="secondary-outline">
          <Calendar size={16} />
          <span className="min-w-[100px] text-left">
            {formatDateRange()}
          </span>
        </Button>

        <Button onClick={goToNextDay} variant="secondary-outline" className="px-2">
          <ChevronRight size={16} />
        </Button>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-2 p-4 bg-foreground border border-border rounded-lg shadow-xl">
          <div className="w-80">
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={handlePreviousMonth}
                className="p-1 hover:bg-surface rounded-lg transition-colors"
              >
                <ChevronLeft size={18} className="text-text-muted" />
              </button>

              <div className="text-sm font-semibold text-text">
                {monthNames[viewMonth.getMonth()]} {viewMonth.getFullYear()}
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 hover:bg-surface rounded-lg transition-colors"
              >
                <ChevronRight size={18} className="text-text-muted" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map(day => (
                <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-text-muted">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 mb-4">
              {renderCalendarDays()}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-border">
              <button
                type="button"
                onClick={goToToday}
                className="text-xs text-primary hover:underline font-medium"
              >
                Today
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setTempStartDate(null);
                    setTempEndDate(null);
                    setSelectingStart(true);
                  }}
                  className="px-3 py-1 text-xs text-text-muted hover:text-text transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={applyDateRange}
                  disabled={!tempStartDate}
                  className="px-3 py-1 text-xs bg-primary text-background rounded hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply
                </button>
              </div>
            </div>

            {selectingStart ? (
              <div className="mt-2 text-xs text-text-muted text-center">
                Select start date
              </div>
            ) : tempStartDate && !tempEndDate ? (
              <div className="mt-2 text-xs text-text-muted text-center">
                Select end date (or click Apply for single day)
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
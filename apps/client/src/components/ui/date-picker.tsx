import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface DatePickerProps {
  value?: string;
  onChange: (date: string) => void;
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
  className?: string;
  disabled?: boolean;
  label?: string;
  id?: string;
  name?: string;
  required?: boolean;
  requiredBgClassName?: string;
}

const DatePicker = ({
  value,
  onChange,
  placeholder = 'Select date',
  minDate,
  maxDate,
  className = '',
  disabled = false,
  label,
  id,
  name,
  required = false,
  requiredBgClassName = ''
}: DatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMonth, setViewMonth] = useState<Date>(new Date());
  const [inputValue, setInputValue] = useState('');
  const pickerRef = useRef<HTMLDivElement>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  useEffect(() => {
    if (value) {
      const [year, month, day] = value.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      setSelectedDate(date);
      setViewMonth(date);
      setInputValue(formatDateForDisplay(date));
    } else {
      setSelectedDate(null);
      setInputValue('');
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDateForDisplay = (date: Date): string => {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const formatDateForValue = (date: Date): string => {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setInputValue(input);

    const datePattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = input.match(datePattern);

    if (match) {
      const month = parseInt(match[1], 10) - 1;
      const day = parseInt(match[2], 10);
      const year = parseInt(match[3], 10);

      const date = new Date(year, month, day);

      if (!isNaN(date.getTime()) &&
          date.getMonth() === month &&
          date.getDate() === day &&
          date.getFullYear() === year) {

        if (isDateInRange(date)) {
          setSelectedDate(date);
          setViewMonth(date);
          onChange(formatDateForValue(date));
        }
      }
    }
  };

  const isDateInRange = (date: Date): boolean => {
    if (minDate) {
      const min = new Date(minDate);
      if (date < min) return false;
    }
    if (maxDate) {
      const max = new Date(maxDate);
      if (date > max) return false;
    }
    return true;
  };

  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handleDateClick = (day: number) => {
    const date = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);

    if (isDateInRange(date)) {
      setSelectedDate(date);
      setInputValue(formatDateForDisplay(date));
      onChange(formatDateForValue(date));
      setIsOpen(false);
    }
  };

  const handlePreviousMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1));
  };

  const isSelectedDate = (day: number): boolean => {
    if (!selectedDate) return false;
    return (
      selectedDate.getFullYear() === viewMonth.getFullYear() &&
      selectedDate.getMonth() === viewMonth.getMonth() &&
      selectedDate.getDate() === day
    );
  };

  const isToday = (day: number): boolean => {
    const today = new Date();
    return (
      today.getFullYear() === viewMonth.getFullYear() &&
      today.getMonth() === viewMonth.getMonth() &&
      today.getDate() === day
    );
  };

  const isDisabledDate = (day: number): boolean => {
    const date = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
    return !isDateInRange(date);
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
      const isDisabled = isDisabledDate(day);

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateClick(day)}
          disabled={isDisabled}
          className={`
            h-8 w-8 rounded-sm text-sm font-medium
            transition-all duration-150
            ${isSelected
              ? 'bg-primary text-background cursor-pointer'
              : isCurrentDay
              ? 'bg-primary/20 text-primary hover:bg-primary/30 cursor-pointer'
              : isDisabled
              ? 'text-text-muted cursor-not-allowed opacity-40'
              : 'text-text hover:bg-foreground cursor-pointer'
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
      {label && (
        <label
          htmlFor={id || name}
          className="block mb-2 text-sm font-medium text-text"
        >
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          id={id || name}
          name={name}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full text-sm px-3 py-1.5 pr-10 rounded
            bg-foreground border border-border
            text-text placeholder:text-text-muted
            focus:outline-none focus:border-primary
            disabled:bg-surface disabled:text-text-muted
            transition-colors duration-200
            ${requiredBgClassName}
            ${className}
          `}
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors cursor-pointer"
        >
          <Calendar size={18} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-2 p-4 bg-foreground border border-border rounded-sm shadow-xl">
          <div className="w-64">
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={handlePreviousMonth}
                className="p-1 hover:bg-surface rounded-sm transition-colors cursor-pointer"
              >
                <ChevronLeft size={18} className="text-text-muted" />
              </button>

              <div className="text-sm font-semibold text-text">
                {monthNames[viewMonth.getMonth()]} {viewMonth.getFullYear()}
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 hover:bg-surface rounded-sm transition-colors cursor-pointer"
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

            <div className="grid grid-cols-7 gap-1">
              {renderCalendarDays()}
            </div>

            <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  if (isDateInRange(today)) {
                    setSelectedDate(today);
                    setViewMonth(today);
                    setInputValue(formatDateForDisplay(today));
                    onChange(formatDateForValue(today));
                    setIsOpen(false);
                  }
                }}
                className="text-xs text-primary hover:underline font-medium cursor-pointer"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedDate(null);
                  setInputValue('');
                  onChange('');
                  setIsOpen(false);
                }}
                className="text-xs text-text-muted hover:text-text transition-colors cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;
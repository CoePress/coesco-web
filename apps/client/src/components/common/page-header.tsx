import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "./button";
import DatePicker from "./date-picker";

type ActionButton = {
  type: "button";
  label: string;
  variant?:
    | "primary"
    | "secondary"
    | "primary-outline"
    | "secondary-outline"
    | "ghost"
    | "destructive";
  size?: "sm" | "md" | "lg";
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
};

type ActionDropdown = {
  type: "dropdown";
  label: string;
  options: {
    label: string;
    value: string;
    disabled?: boolean;
  }[];
  value: string;
  onChange: (value: string) => void;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

type ActionDatePicker = {
  type: "datepicker";
  dateRange: {
    start: Date;
    end: Date;
  };
  setDateRange: (range: { start: Date; end: Date }) => void;
  icon: React.ReactNode;
};

type Action = ActionButton | ActionDropdown | ActionDatePicker;

type PageHeaderProps = {
  title: string;
  description: string;
  actions?: Action[];
  backButton?: boolean;
  onBack?: () => void;
};

const PageHeader = ({
  title,
  description,
  actions = [],
  backButton = false,
  onBack = () => {},
}: PageHeaderProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const renderAction = (action: Action) => {
    if (action.type === "button") {
      return (
        <Button
          key={action.label}
          variant={action.variant}
          size={action.size}
          onClick={action.onClick}
          disabled={action.disabled}
          className="flex items-center gap-2 w-full sm:w-auto">
          {action.icon}
          <span className="hidden sm:inline">{action.label}</span>
        </Button>
      );
    }

    if (action.type === "dropdown") {
      const selectedOption = action.options.find(
        (opt) => opt.value === action.value
      );

      return (
        <div className="relative w-full sm:w-auto">
          <Button
            variant="secondary-outline"
            onClick={() => action.onOpenChange(!action.isOpen)}>
            <span className="hidden sm:inline">
              {selectedOption?.label || action.label}
            </span>
            <span className="sm:hidden">{action.label}</span>
          </Button>

          {action.isOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded bg-foreground p-2 shadow-lg ring-1 ring-border ring-opacity-5">
              <label className="text-sm text-text-muted mb-2 block">
                {action.label}
              </label>
              <div className="flex flex-col gap-1">
                {action.options.map((option) => (
                  <Button
                    key={option.value}
                    variant={
                      option.value === action.value
                        ? "primary"
                        : "secondary-outline"
                    }
                    disabled={option.disabled}
                    onClick={() => {
                      action.onChange(option.value);
                      action.onOpenChange(false);
                    }}
                    className="w-full justify-start text-left text-sm text-nowrap">
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (action.type === "datepicker") {
      return (
        <DatePicker
          key="datepicker"
          dateRange={action.dateRange}
          setDateRange={action.setDateRange}
        />
      );
    }
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-2 border-b sticky top-0 bg-foreground z-10 min-h-[57px]">
      <div className="flex items-center gap-2">
        {backButton && (
          <button
            onClick={handleBack}
            className="text-text-muted hover:text-text cursor-pointer">
            <ArrowLeft size={20} />
          </button>
        )}
        <div className="flex flex-col gap-1 text-nowrap">
          <h1 className="font-semibold text-text leading-none">{title}</h1>
          <p className="text-xs text-text-muted leading-none">{description}</p>
        </div>
      </div>
      <div className="flex gap-2 w-full justify-center sm:justify-end">
        {actions.map(renderAction)}
      </div>
    </div>
  );
};

export default PageHeader;

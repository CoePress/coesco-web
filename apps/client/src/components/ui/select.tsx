import React from "react";

type Option = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SelectProps = {
  options: Option[];
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
  label?: string;
  placeholder?: string;
  error?: string;
  variant?: "default" | "success" | "error" | "warning" | "info";
  customBackgroundColor?: string;
};

const Select = ({
  options,
  value,
  onChange,
  className = "",
  disabled = false,
  required = false,
  id,
  name,
  label,
  placeholder,
  error,
  variant = "default",
  customBackgroundColor,
}: SelectProps) => {
  // Get CSS class for colored backgrounds based on variant or custom color
  const getColoredSelectClass = () => {
    if (customBackgroundColor) {
      // Map simple color names and CSS custom properties to our theme-aware classes
      if (customBackgroundColor === 'success' || customBackgroundColor.includes('--color-success')) {
        return 'input-success';
      } else if (customBackgroundColor === 'error' || customBackgroundColor.includes('--color-error')) {
        return 'input-error';
      } else if (customBackgroundColor === 'warning' || customBackgroundColor.includes('--color-warning')) {
        return 'input-warning';
      } else if (customBackgroundColor === 'info' || customBackgroundColor.includes('--color-info')) {
        return 'input-info';
      } else {
        // For any other custom colors, fall back to inline styles
        return null;
      }
    }

    switch (variant) {
      case "success":
        return 'input-success';
      case "error":
        return 'input-error';
      case "warning":
        return 'input-warning';
      case "info":
        return 'input-info';
      default:
        return null;
    }
  };

  // Fallback inline styles for custom colors that don't match our CSS custom properties
  const getFallbackStyles = () => {
    const colorClass = getColoredSelectClass();
    if (colorClass || !customBackgroundColor) {
      return {};
    }

    // If we have a custom color that doesn't match our CSS custom properties,
    // use inline styles as fallback
    return {
      backgroundColor: customBackgroundColor,
      color: "var(--text)" // Use theme-aware text color instead of forcing white
    };
  };

  const colorClass = getColoredSelectClass();
  const fallbackStyles = getFallbackStyles();

  return (
    <div>
      {label && (
        <label
          htmlFor={id}
          className="block mb-2 text-sm font-medium text-text">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        id={id}
        name={name}
        style={fallbackStyles}
        className={`
          w-full text-sm px-3 py-1.5 rounded border
          ${!colorClass && Object.keys(fallbackStyles).length === 0 ? 'bg-foreground text-text' : ''}
          focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
          disabled:bg-surface disabled:text-text-muted
          ${error ? "border-error" : "border-border"}
          ${colorClass || ""}
          ${className}
        `}>
        {placeholder && (
          <option
            value=""
            disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-error">{error}</p>}
    </div>
  );
};

export default Select;

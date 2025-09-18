import React from "react";

type InputProps = {
  type?: "text" | "password" | "email" | "number" | "search" | "date";
  placeholder?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
  label?: string;
  error?: string;
  readOnly?: boolean;
  min?: number;
  max?: number;
  variant?: "default" | "success" | "error" | "warning";
  customBackgroundColor?: string;
};

const Input = ({
  type = "text",
  placeholder = "",
  value,
  onChange,
  onBlur,
  className = "",
  disabled = false,
  required = false,
  id,
  name,
  label,
  error,
  readOnly = false,
  min,
  max,
  variant = "default",
  customBackgroundColor,
}: InputProps) => {
  // Get CSS class for colored backgrounds based on variant or custom color
  const getColoredInputClass = () => {
    if (customBackgroundColor) {
      // Map CSS custom properties to our theme-aware classes
      if (customBackgroundColor.includes('--color-success')) {
        return 'input-success';
      } else if (customBackgroundColor.includes('--color-error')) {
        return 'input-error';
      } else if (customBackgroundColor.includes('--color-warning')) {
        return 'input-warning';
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
      default:
        return null;
    }
  };

  // Fallback inline styles for custom colors that don't match our CSS custom properties
  const getFallbackStyles = () => {
    const colorClass = getColoredInputClass();
    if (colorClass || !customBackgroundColor) {
      return {};
    }

    // If we have a custom color that doesn't match our CSS custom properties,
    // use inline styles as fallback
    return {
      backgroundColor: customBackgroundColor,
      color: "#ffffff" // Default to white text for custom colors
    };
  };

  const colorClass = getColoredInputClass();
  const fallbackStyles = getFallbackStyles();

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="block mb-2 text-sm font-medium text-text">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        required={required}
        id={id}
        name={name}
        readOnly={readOnly}
        min={min}
        max={max}
        style={fallbackStyles}
        className={`
          w-full text-sm px-3 py-1.5 rounded
          border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
          ${!colorClass && Object.keys(fallbackStyles).length === 0 ? 'bg-foreground text-text' : ''} 
          disabled:bg-surface disabled:text-text-muted
          ${error ? "border-error" : "border-border"}
          ${colorClass || ""}
          ${className}
        `}
      />
      {error && <p className="mt-1 text-sm text-error">{error}</p>}
    </div>
  );
};

export default Input;

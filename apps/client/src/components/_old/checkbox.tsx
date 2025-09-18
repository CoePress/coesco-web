import React from "react";

interface CheckboxProps {
  label?: string;
  name?: string;
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
  customBackgroundColor?: "success" | "error" | "warning" | "info";
}

const Checkbox = ({
  label,
  name,
  checked = false,
  onChange,
  required = false,
  error,
  disabled = false,
  className = "",
  customBackgroundColor,
}: CheckboxProps) => {
  // Function to get colored checkbox class
  const getColoredCheckboxClass = (color: "success" | "error" | "warning" | "info") => {
    switch (color) {
      case "success":
        return "checkbox-success";
      case "error":
        return "checkbox-error";
      case "warning":
        return "checkbox-warning";
      case "info":
        return "checkbox-info";
      default:
        return "";
    }
  };

  // Function to get fallback styles if CSS classes aren't available
  const getFallbackStyles = (color: "success" | "error" | "warning" | "info") => {
    switch (color) {
      case "success":
        return { backgroundColor: 'var(--color-success)', borderColor: 'var(--color-success)' };
      case "error":
        return { backgroundColor: 'var(--color-error)', borderColor: 'var(--color-error)' };
      case "warning":
        return { backgroundColor: 'var(--color-warning)', borderColor: 'var(--color-warning)' };
      case "info":
        return { backgroundColor: 'var(--color-info)', borderColor: 'var(--color-info)' };
      default:
        return {};
    }
  };

  const colorClass = customBackgroundColor ? getColoredCheckboxClass(customBackgroundColor) : "";
  const fallbackStyle = customBackgroundColor ? getFallbackStyles(customBackgroundColor) : {};

  // Get background color for the container div
  const getContainerBackgroundColor = () => {
    if (!customBackgroundColor) return "";

    switch (customBackgroundColor) {
      case "success":
        return "checkbox-container-success";
      case "error":
        return "checkbox-container-error";
      case "warning":
        return "checkbox-container-warning";
      case "info":
        return "checkbox-container-info";
      default:
        return "";
    }
  };

  const containerColorClass = getContainerBackgroundColor();

  return (
    <div className={`w-full flex items-center p-2 rounded ${containerColorClass} ${disabled ? 'checkbox-disabled' : ''} ${className}`}>
      <input
        type="checkbox"
        id={name}
        name={name}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={`
          accent-primary
          w-4 h-4 rounded border focus:ring-2 focus:ring-primary focus:border-transparent
          ${error ? "border-error" : "border-border"}
          ${colorClass}
        `}
        style={colorClass ? {} : fallbackStyle}
      />
      {label && (
        <label
          htmlFor={name}
          className={`ml-2 text-sm font-medium text-text select-none ${disabled ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
            }`}
        >
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      {error && <p className="mt-1 text-sm text-error w-full">{error}</p>}
    </div>
  );
};

export default Checkbox; 
interface TextareaProps {
  label?: string;
  name?: string;
  id?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
  rows?: number;
  placeholder?: string;
  variant?: "default" | "success" | "error" | "warning" | "info";
  customBackgroundColor?: string;
}

const Textarea = ({
  label,
  name,
  id,
  value,
  onChange,
  onBlur,
  required = false,
  error,
  disabled = false,
  className = "",
  rows = 3,
  placeholder = "",
  variant = "default",
  customBackgroundColor,
}: TextareaProps) => {
  // Get CSS class for colored backgrounds based on variant or custom color
  const getColoredTextareaClass = () => {
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
    const colorClass = getColoredTextareaClass();
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

  const colorClass = getColoredTextareaClass();
  const fallbackStyles = getFallbackStyles();
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id || name}
          className="block mb-2 text-sm font-medium text-text"
        >
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      <textarea
        name={name}
        id={id || name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        required={required}
        disabled={disabled}
        rows={rows}
        placeholder={placeholder}
        style={fallbackStyles}
        className={`
          w-full text-sm px-3 py-1.5 rounded border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
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

export default Textarea; 
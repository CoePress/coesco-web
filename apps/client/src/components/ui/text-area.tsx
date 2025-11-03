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
  autoComplete?: string;
  requiredBgClassName?: string;
  checkBorderClassName?: string;
  checkIconPrefix?: string;
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
  autoComplete,
  requiredBgClassName = "",
  checkBorderClassName = "",
  checkIconPrefix = "",
}: TextareaProps) => {
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
        value={checkIconPrefix && value ? `${checkIconPrefix}${value}` : value}
        onChange={onChange}
        onBlur={onBlur}
        required={required}
        disabled={disabled}
        rows={rows}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`w-full text-sm px-3 py-1.5 rounded border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-foreground text-text disabled:bg-surface disabled:text-text-muted transition-colors duration-200 ${error ? "border-error" : "border-border"} ${requiredBgClassName} ${checkBorderClassName} ${className}`}
      />
      {error && <p className="mt-1 text-sm text-error">{error}</p>}
    </div>
  );
};

export default Textarea; 
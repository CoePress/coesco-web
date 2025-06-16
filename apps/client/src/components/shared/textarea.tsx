import React from "react";

interface TextareaProps {
  label?: string;
  name?: string;
  id?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
  rows?: number;
  placeholder?: string;
}

const Textarea = ({
  label,
  name,
  id,
  value,
  onChange,
  required = false,
  error,
  disabled = false,
  className = "",
  rows = 3,
  placeholder = "",
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
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        rows={rows}
        placeholder={placeholder}
        className={`w-full text-sm px-3 py-1.5 rounded border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-foreground text-text disabled:bg-surface disabled:text-text-muted ${error ? "border-error" : "border-border"} ${className}`}
      />
      {error && <p className="mt-1 text-sm text-error">{error}</p>}
    </div>
  );
};

export default Textarea; 
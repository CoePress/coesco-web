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
}

function Checkbox({
  label,
  name,
  checked = false,
  onChange,
  required = false,
  error,
  disabled = false,
  className = "",
}: CheckboxProps) {
  return (
    <div className={`w-full flex items-center ${className}`}>
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
          disabled:bg-surface disabled:text-text-muted
          ${error ? "border-error" : "border-border"}
        `}
      />
      {label && (
        <label
          htmlFor={name}
          className="ml-2 text-sm font-medium text-text cursor-pointer select-none"
        >
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      {error && <p className="mt-1 text-sm text-error w-full">{error}</p>}
    </div>
  );
}

export default Checkbox;

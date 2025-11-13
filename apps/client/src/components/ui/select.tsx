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
  readOnly?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
  label?: string;
  placeholder?: string;
  error?: string;
  requiredBgClassName?: string;
  checkBorderClassName?: string;
  checkIconPrefix?: string;
};

const Select = ({
  options,
  value,
  onChange,
  className = "",
  disabled = false,
  readOnly = false,
  required = false,
  id,
  name,
  label,
  placeholder,
  error,
  requiredBgClassName = "",
  checkBorderClassName = "",
  checkIconPrefix = "",
}: SelectProps) => {
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
        disabled={disabled || readOnly}
        required={required}
        id={id}
        name={name}
        className={`
          w-full text-sm px-3 py-1.5 rounded border
          bg-foreground text-text
          focus:outline-none focus:border-primary
          disabled:bg-surface disabled:text-text-muted
          transition-colors duration-200
          ${error ? "border-error" : "border-border"}
          ${requiredBgClassName}
          ${checkBorderClassName}
          ${readOnly ? "cursor-not-allowed" : ""}
          ${className}
        `}>
        {placeholder && (
          <option
            value=""
            disabled
            className="bg-foreground text-text-muted">
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            className="bg-foreground text-text">
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-error">{error}</p>}
    </div>
  );
};

export default Select;

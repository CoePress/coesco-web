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
        disabled={disabled}
        required={required}
        id={id}
        name={name}
        className={`
          w-full text-sm px-3 py-1.5 rounded border
          bg-foreground text-text
          focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
          disabled:bg-surface disabled:text-text-muted
          ${error ? "border-error" : "border-border"}
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

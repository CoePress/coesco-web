import React from "react";

type InputProps = {
  type?: "text" | "password" | "email" | "number" | "search";
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
  label?: string;
  error?: string;
};

const Input = ({
  type = "text",
  placeholder = "",
  value,
  onChange,
  className = "",
  disabled = false,
  required = false,
  id,
  name,
  label,
  error,
}: InputProps) => {
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
        disabled={disabled}
        required={required}
        id={id}
        name={name}
        className={`
          w-full text-sm px-3 py-1.5 rounded
          border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
          bg-foreground text-text
          disabled:bg-surface disabled:text-text-muted
          ${error ? "border-error" : "border-border"}
          ${className}
        `}
      />
      {error && <p className="mt-1 text-sm text-error">{error}</p>}
    </div>
  );
};

export default Input;

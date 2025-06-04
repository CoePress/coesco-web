import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";

type Option = {
  value: string;
  label: string;
  disabled?: boolean;
};

type Props = {
  options: Option[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

const AdvancedDropdown = ({
  options,
  value,
  onChange,
  placeholder = "Select...",
  className = "",
  disabled = false,
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const [isCreateNew, setIsCreateNew] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const option = options.find((opt) => opt.value === value);
      setSelectedOption(option || null);
      setInputValue(option?.label || "");
    } else {
      setSelectedOption(null);
      setInputValue("");
    }
  }, [value, options]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleSelect = (option: Option) => {
    if (option.disabled) return;
    setSelectedOption(option);
    setInputValue(option.label);
    onChange(option.value);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedOption(null);
    setInputValue("");
    onChange("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    if (!isCreateNew) {
      setIsOpen(true);
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleBlur = () => {
    if (!isCreateNew && selectedOption) {
      setInputValue(selectedOption.label);
    }
  };

  const handleCreateNew = () => {
    setIsCreateNew(true);
    setIsOpen(false);
  };

  const handleExitCreateNew = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCreateNew(false);
  };

  return (
    <div
      className={`relative w-full max-w-sm ${className}`}
      ref={dropdownRef}>
      <div className="relative">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleBlur}
            placeholder={isCreateNew ? "Customer Name" : placeholder}
            disabled={disabled}
            className={`w-full px-3 py-2 bg-foreground border rounded-md ${
              disabled
                ? "opacity-50 cursor-not-allowed"
                : "hover:border-primary"
            } ${
              isOpen ? "border-primary" : "border-border"
            } focus:outline-none focus:ring-1 leading-0 focus:ring-primary focus:border-primary text-text ${
              isCreateNew ? "pl-20" : ""
            }`}
          />
          {isCreateNew && (
            <div className="absolute left-2 flex items-center gap-1">
              <div className="px-2 py-1 bg-primary/10 text-primary text-xs rounded flex items-center gap-1">
                New
                <button
                  onClick={handleExitCreateNew}
                  className="hover:bg-primary/20 rounded-full p-0.5 cursor-pointer">
                  <X size={12} />
                </button>
              </div>
            </div>
          )}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {selectedOption && !isCreateNew && (
              <button
                onClick={handleClear}
                className="p-1 hover:bg-surface rounded-full">
                <X
                  size={14}
                  className="text-text-muted"
                />
              </button>
            )}
            {!isCreateNew && (
              <ChevronDown
                size={16}
                className={`text-text-muted transition-transform ${
                  isOpen ? "transform rotate-180" : ""
                }`}
              />
            )}
          </div>
        </div>
      </div>

      {isOpen && !isCreateNew && (
        <div className="absolute z-10 w-full mt-1 bg-foreground border border-border rounded-md shadow-lg">
          <div className="max-h-60 overflow-auto">
            <div
              className="px-3 py-2 cursor-pointer text-sm hover:bg-surface text-text border-b border-border"
              onClick={handleCreateNew}>
              Create New
            </div>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={`px-3 py-2 cursor-pointer text-sm ${
                    option.disabled
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-surface"
                  } ${
                    selectedOption?.value === option.value
                      ? "bg-surface text-primary"
                      : "text-text"
                  }`}
                  onClick={() => handleSelect(option)}>
                  {option.label}
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-text-muted">
                No options found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedDropdown;

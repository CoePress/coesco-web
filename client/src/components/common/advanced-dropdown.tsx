import React, { useState, useRef, useEffect, forwardRef } from "react";
import { ChevronDown, X } from "lucide-react";

type Option = {
  value: string;
  label: string;
  disabled?: boolean;
};

type DropdownValue = string | { create: true; label: string };

type Props = {
  options: Option[];
  value?: DropdownValue;
  onChange: (value: DropdownValue) => void;
  placeholder?: string;
  createPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  mode?: "select" | "create";
};

const AdvancedDropdown = forwardRef<HTMLDivElement, Props>(
  (
    {
      options,
      value,
      onChange,
      placeholder = "Select",
      createPlaceholder = "Create new",
      className = "",
      disabled = false,
      mode,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [selectedOption, setSelectedOption] = useState<Option | null>(null);
    const [highlightedIndex, setHighlightedIndex] = useState<number | null>(
      null
    );
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (value && typeof value === "string") {
        const option = options.find((opt) => opt.value === value);
        setSelectedOption(option || null);
        setInputValue(option?.label || "");
      } else if (value && typeof value === "object" && value.create) {
        // Handle create mode values properly
        setSelectedOption(null);
        setInputValue(value.label || "");
      } else {
        setSelectedOption(null);
        setInputValue("");
      }
    }, [value, options]);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          ref &&
          "current" in ref &&
          ref.current &&
          !ref.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, [ref]);

    const filteredOptions = options.filter((option) =>
      option.label.toLowerCase().includes(inputValue.toLowerCase())
    );

    const handleSelect = (option: Option) => {
      if (option.disabled) return;
      setSelectedOption(option);
      setInputValue(option.label);
      onChange(option.value);
      setIsOpen(false);
      setHighlightedIndex(null);
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedOption(null);
      setInputValue("");
      onChange("");
    };

    const handleInputFocus = () => {
      if (!selectedOption && mode !== "create") {
        setIsOpen(true);
        setHighlightedIndex(null);
      }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      if (mode === "create") {
        onChange({ create: true, label: newValue });
      } else if (!selectedOption) {
        setIsOpen(true);
      }
    };

    const handleBlur = () => {
      if (mode === "create") {
        return;
      }
      if (selectedOption) {
        setInputValue(selectedOption.label);
      } else {
        setInputValue("");
      }
    };

    const handleCreateNew = () => {
      const currentValue = inputValue;
      setIsOpen(false);
      setInputValue(currentValue);
      onChange({ create: true, label: currentValue });
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    };

    const handleExitCreateNew = (e: React.MouseEvent) => {
      e.stopPropagation();
      setInputValue("");
      onChange("");
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && filteredOptions.length === 0 && inputValue) {
        handleCreateNew();
      }
      if (e.key === "ArrowDown" && isOpen) {
        e.preventDefault();
        if (highlightedIndex === null) {
          setHighlightedIndex(0);
        } else if (highlightedIndex < filteredOptions.length - 1) {
          setHighlightedIndex(highlightedIndex + 1);
        }
      }
      if (e.key === "ArrowUp" && isOpen) {
        e.preventDefault();
        if (highlightedIndex === null) {
          setHighlightedIndex(filteredOptions.length - 1);
        } else if (highlightedIndex > 0) {
          setHighlightedIndex(highlightedIndex - 1);
        }
      }
      if (e.key === "Enter" && highlightedIndex !== null) {
        e.preventDefault();
        handleSelect(filteredOptions[highlightedIndex]);
      }
    };

    return (
      <div
        className={`relative w-full max-w-sm ${className}`}
        ref={ref}>
        <div className="relative flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={mode === "create" ? createPlaceholder : placeholder}
            disabled={disabled || (!!selectedOption && mode !== "create")}
            className={`w-full px-3 py-2 bg-foreground border rounded-md ${
              disabled || (!!selectedOption && mode !== "create")
                ? "opacity-50"
                : "hover:border-primary"
            } ${
              isOpen ? "border-primary" : "border-border"
            } focus:outline-none focus:ring-1 leading-0 focus:ring-primary focus:border-primary text-text ${
              mode === "create" ? "pl-20" : ""
            }`}
          />
          {mode === "create" && (
            <div className="absolute left-2 flex items-center gap-1">
              <div className="px-2 py-1 bg-primary/10 text-primary text-xs rounded flex items-center gap-1">
                New
                <button
                  onClick={handleExitCreateNew}
                  tabIndex={-1}
                  className="hover:bg-primary/20 rounded-full p-0.5 cursor-pointer">
                  <X size={12} />
                </button>
              </div>
            </div>
          )}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {selectedOption && mode !== "create" && (
              <button
                onClick={handleClear}
                className="p-1 hover:bg-surface rounded-full cursor-pointer">
                <X
                  size={14}
                  className="text-text-muted"
                />
              </button>
            )}
            {mode !== "create" && !selectedOption && (
              <ChevronDown
                size={16}
                className={`text-text-muted transition-transform ${
                  isOpen ? "transform rotate-180" : ""
                }`}
              />
            )}
          </div>
        </div>

        {isOpen && mode !== "create" && (
          <div className="absolute z-10 w-full mt-1 bg-foreground border border-border rounded-md shadow-lg">
            <div className="max-h-60 overflow-auto">
              <div
                className="px-3 py-2 cursor-pointer text-sm hover:bg-surface text-text border-b border-border"
                onClick={handleCreateNew}>
                Create New
              </div>
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => (
                  <div
                    key={option.value}
                    className={`px-3 py-2 cursor-pointer text-sm ${
                      option.disabled
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-surface"
                    } ${
                      selectedOption?.value === option.value ||
                      highlightedIndex === index
                        ? "bg-primary text-white"
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
  }
);

export default AdvancedDropdown;

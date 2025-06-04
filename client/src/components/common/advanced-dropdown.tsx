import React, { useState, useRef, useEffect, forwardRef } from "react";
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
  createPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  onIsCreateNewChange?: (isCreateNew: boolean) => void;
  forceCreate?: boolean;
  onInputChange?: (value: string) => void;
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
      onIsCreateNewChange,
      forceCreate = false,
      onInputChange,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [selectedOption, setSelectedOption] = useState<Option | null>(null);
    const [isCreateNew, setIsCreateNew] = useState(forceCreate);
    const [highlightedIndex, setHighlightedIndex] = useState<number | null>(
      null
    );
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (forceCreate) {
        setIsCreateNew(true);
        onIsCreateNewChange?.(true);
        setTimeout(() => {
          inputRef.current?.focus();
        }, 0);
      }
    }, [forceCreate, onIsCreateNewChange]);

    useEffect(() => {
      if (isCreateNew) return;

      if (value) {
        const option = options.find((opt) => opt.value === value);
        setSelectedOption(option || null);
        setInputValue(option?.label || "");
      } else {
        setSelectedOption(null);
        setInputValue("");
      }
    }, [value, options, isCreateNew]);

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
      if (!selectedOption && !isCreateNew) {
        setIsOpen(true);
        setHighlightedIndex(null);
      }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      onInputChange?.(newValue);
      if (!isCreateNew && !selectedOption) {
        setIsOpen(true);
      }
    };

    const handleBlur = () => {
      if (isCreateNew) {
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
      setIsCreateNew(true);
      onIsCreateNewChange?.(true);
      setIsOpen(false);
      setInputValue(currentValue);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    };

    const handleExitCreateNew = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsCreateNew(false);
      onIsCreateNewChange?.(false);
      setInputValue("");
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (isCreateNew) {
        if (e.key === "Backspace" && !inputValue) {
          setIsCreateNew(false);
          setInputValue("");
        }
        return;
      }

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
        <div className="relative">
          <div className="relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder={isCreateNew ? createPlaceholder : placeholder}
              disabled={disabled || (!!selectedOption && !isCreateNew)}
              className={`w-full px-3 py-2 bg-foreground border rounded-md ${
                disabled || (!!selectedOption && !isCreateNew)
                  ? "opacity-50"
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
                    tabIndex={-1}
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
                  className="p-1 hover:bg-surface rounded-full cursor-pointer">
                  <X
                    size={14}
                    className="text-text-muted"
                  />
                </button>
              )}
              {!isCreateNew && !selectedOption && (
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

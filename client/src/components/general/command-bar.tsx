import React, { useState, useRef, useEffect } from "react";

// Define types for module pages and popups
interface ModulePage {
  path: string;
  label: string;
  requiresId?: boolean;
  sampleIds?: string[];
}

interface ModulePopup {
  entity: string;
  label: string;
  requiresId?: boolean;
  sampleIds?: string[];
}

interface ModuleConfig {
  [key: string]: {
    pages: ModulePage[];
    popups: ModulePopup[];
  };
}

// Define types for our suggestion items
interface SuggestionItem {
  text: string;
  description: string;
  type: "page" | "popup";
  requiresId?: boolean;
  isId?: boolean;
  entity?: string;
}

// Props interface
interface CommandBarProps {
  onNavigate?: (path: string) => void;
  defaultModule?: string;
  isOpen?: boolean;
}

export const openPopup = (module: string, params: string[]) => {
  window.open(
    `/${module}/popup?${params.join("&")}`,
    "_blank",
    "width=800,height=600"
  );
};

// Define available modules and their pages/popups
const moduleConfig: ModuleConfig = {
  sales: {
    pages: [
      { path: "", label: "Dashboard" },
      { path: "pipeline", label: "Pipeline" },
      { path: "quotes", label: "Quotes" },
      {
        path: "quotes",
        label: "Quote",
        requiresId: true,
        sampleIds: [
          "QT-2023-0456",
          "QT-2023-0789",
          "QT-2024-0123",
          "QT-2024-0245",
        ],
      },
      { path: "customers", label: "Customers" },
      {
        path: "customers",
        label: "Customer",
        requiresId: true,
        sampleIds: ["CUST-1001", "CUST-1002", "CUST-1003", "CUST-2574"],
      },
      { path: "catalog", label: "Catalog" },
      { path: "reports", label: "Reports" },
    ],
    popups: [
      {
        entity: "customers",
        label: "Customer",
        requiresId: true,
        sampleIds: ["CUST-1001", "CUST-1002", "CUST-1003", "CUST-2574"],
      },
      {
        entity: "quotes",
        label: "Quote",
        requiresId: true,
        sampleIds: [
          "QT-2023-0456",
          "QT-2023-0789",
          "QT-2024-0123",
          "QT-2024-0245",
        ],
      },
      {
        entity: "dashboard",
        label: "Dashboard",
      },
      {
        entity: "pipeline",
        label: "Pipeline",
      },
      {
        entity: "catalog",
        label: "Catalog",
      },
    ],
  },
  // Add more modules here as needed
};

const CommandBar: React.FC<CommandBarProps> = ({
  onNavigate,
  defaultModule = "sales",
  isOpen: externalIsOpen = false,
}) => {
  const [input, setInput] = useState<string>("");
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [waitingForId, setWaitingForId] = useState<boolean>(false);
  const [activeItem, setActiveItem] = useState<SuggestionItem | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const suggestionItemsRef = useRef<(HTMLDivElement | null)[]>([]);

  // Effect to focus input when opened
  useEffect(() => {
    if (externalIsOpen && inputRef.current) {
      // Use a slight delay to ensure the input is rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [externalIsOpen]);

  // Effect to scroll to the selected item
  useEffect(() => {
    if (
      isOpen &&
      suggestionsRef.current &&
      suggestionItemsRef.current[selectedIndex]
    ) {
      const container = suggestionsRef.current;
      const selectedElement = suggestionItemsRef.current[selectedIndex];

      if (selectedElement) {
        // Calculate positions
        const containerRect = container.getBoundingClientRect();
        const selectedRect = selectedElement.getBoundingClientRect();

        // Check if the selected element is outside the visible area
        if (selectedRect.bottom > containerRect.bottom) {
          // Element is below visible area
          container.scrollTop += selectedRect.bottom - containerRect.bottom;
        } else if (selectedRect.top < containerRect.top) {
          // Element is above visible area
          container.scrollTop -= containerRect.top - selectedRect.top;
        }
      }
    }
  }, [selectedIndex, isOpen]);

  // Get ID suggestions based on entity
  const getIdSuggestions = (
    entity: string,
    type: "page" | "popup",
    query = ""
  ): SuggestionItem[] => {
    const module = moduleConfig[defaultModule];
    if (!module) return [];

    const normalizedQuery = query.toLowerCase();

    let sampleIds: string[] | undefined;

    if (type === "page") {
      const page = module.pages.find((p) => p.label === entity && p.requiresId);
      sampleIds = page?.sampleIds;
    } else {
      const popup = module.popups.find(
        (p) => p.label === entity && p.requiresId
      );
      sampleIds = popup?.sampleIds;
    }

    if (!sampleIds) return [];

    return sampleIds
      .filter((id) => id.toLowerCase().includes(normalizedQuery))
      .map((id) => ({
        text: id,
        description: `${type === "page" ? "Go to" : "Open"} ${entity} ${id}`,
        type,
        isId: true,
        entity,
      }));
  };

  // Get all suggestions based on input query
  const getSuggestions = (query: string): SuggestionItem[] => {
    const module = moduleConfig[defaultModule];
    if (!module) return [];

    const normalizedQuery = query.toLowerCase();
    const suggestions: SuggestionItem[] = [];

    // If waiting for ID, only show ID suggestions
    if (waitingForId && activeItem) {
      return getIdSuggestions(activeItem.text, activeItem.type, query);
    }

    // Add page suggestions with header
    if (!suggestions.length) {
      suggestions.push({
        text: "Pages",
        description: "",
        type: "page",
      });
    }

    // Add matching pages
    module.pages
      .filter(
        (page) =>
          page.label.toLowerCase().includes(normalizedQuery) ||
          normalizedQuery === ""
      )
      .forEach((page) => {
        suggestions.push({
          text: page.label,
          description: `Go to ${page.label}${
            page.requiresId ? " (requires ID)" : ""
          }`,
          type: "page",
          requiresId: page.requiresId,
        });
      });

    // Add popup header
    suggestions.push({
      text: "Popups",
      description: "",
      type: "popup",
    });

    // Add matching popups
    module.popups
      .filter(
        (popup) =>
          popup.label.toLowerCase().includes(normalizedQuery) ||
          normalizedQuery === ""
      )
      .forEach((popup) => {
        suggestions.push({
          text: popup.label,
          description: `Open ${popup.label} popup${
            popup.requiresId ? " (requires ID)" : ""
          }`,
          type: "popup",
          requiresId: popup.requiresId,
        });
      });

    return suggestions;
  };

  // Navigate to a page
  const navigateToPage = (page: string, id?: string) => {
    const module = moduleConfig[defaultModule];
    if (!module) return;

    const pageConfig = module.pages.find(
      (p) => p.label === page && (id ? p.requiresId : !p.requiresId)
    );

    if (pageConfig) {
      let path = `/${defaultModule}/${pageConfig.path}`;
      if (id && pageConfig.requiresId) {
        path += `/${id}`;
      }

      if (onNavigate) {
        onNavigate(path);
      } else {
        window.location.href = path;
      }
    }
  };

  // Open a popup
  const openPopupView = (popupName: string, id?: string) => {
    const module = moduleConfig[defaultModule];
    if (!module) return;

    const popupConfig = module.popups.find(
      (p) => p.label === popupName && (id ? p.requiresId : !p.requiresId)
    );

    if (popupConfig) {
      const params = id
        ? [popupConfig.entity, `id=${id}`]
        : [popupConfig.entity];
      openPopup(defaultModule, params);
    }
  };

  // Execute a selected item
  const executeItem = (item: SuggestionItem, id?: string) => {
    if (item.requiresId && !id) {
      // We need an ID but don't have one
      setWaitingForId(true);
      setActiveItem(item);
      setInput("");

      // Immediately show ID suggestions
      const idSuggestions = getIdSuggestions(item.text, item.type, "");
      setSuggestions(idSuggestions);
      setIsOpen(idSuggestions.length > 0);
      setSelectedIndex(0);
      return;
    }

    // Execute based on type
    if (item.type === "page") {
      navigateToPage(item.text, id);
    } else if (item.type === "popup") {
      openPopupView(item.text, id);
    }

    // Reset state
    setInput("");
    setIsOpen(false);
    setWaitingForId(false);
    setActiveItem(null);
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);

    // If waiting for ID, only filter ID suggestions
    if (waitingForId && activeItem) {
      const idSuggestions = getIdSuggestions(
        activeItem.text,
        activeItem.type,
        value
      );
      setSuggestions(idSuggestions);
      setIsOpen(idSuggestions.length > 0);
      setSelectedIndex(0);
      return;
    }

    // Otherwise filter all suggestions
    const newSuggestions = getSuggestions(value);
    setSuggestions(newSuggestions);
    setIsOpen(newSuggestions.length > 0);
    setSelectedIndex(0);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Execute on Enter
    if (e.key === "Enter") {
      if (suggestions.length > 0 && isOpen && selectedIndex >= 0) {
        const selectedItem = suggestions[selectedIndex];

        // Skip headers
        if (selectedItem.text === "Pages" || selectedItem.text === "Popups") {
          return;
        }

        if (selectedItem.isId && activeItem) {
          // It's an ID selection
          executeItem(activeItem, selectedItem.text);
        } else {
          // It's a regular item
          executeItem(selectedItem);
        }
        e.preventDefault();
      }
    }

    // Navigate through suggestions
    else if (e.key === "ArrowDown" && isOpen) {
      let newIndex = selectedIndex + 1;

      // Skip headers when navigating down
      while (
        newIndex < suggestions.length &&
        (suggestions[newIndex].text === "Pages" ||
          suggestions[newIndex].text === "Popups")
      ) {
        newIndex++;
      }

      if (newIndex >= suggestions.length) {
        // Wrap around, find first non-header
        newIndex = 0;
        while (
          newIndex < suggestions.length &&
          (suggestions[newIndex].text === "Pages" ||
            suggestions[newIndex].text === "Popups")
        ) {
          newIndex++;
        }
      }

      setSelectedIndex(newIndex);
      e.preventDefault();
    } else if (e.key === "ArrowUp" && isOpen) {
      let newIndex = selectedIndex - 1;

      // Skip headers when navigating up
      while (
        newIndex >= 0 &&
        (suggestions[newIndex].text === "Pages" ||
          suggestions[newIndex].text === "Popups")
      ) {
        newIndex--;
      }

      if (newIndex < 0) {
        // Wrap around, find last non-header
        newIndex = suggestions.length - 1;
        while (
          newIndex >= 0 &&
          (suggestions[newIndex].text === "Pages" ||
            suggestions[newIndex].text === "Popups")
        ) {
          newIndex--;
        }
      }

      setSelectedIndex(newIndex);
      e.preventDefault();
    }

    // Close suggestions on Escape
    else if (e.key === "Escape") {
      if (waitingForId) {
        // If waiting for ID, go back to entity selection
        setWaitingForId(false);
        setActiveItem(null);
        setInput("");
        const newSuggestions = getSuggestions("");
        setSuggestions(newSuggestions);
        setIsOpen(true);
        setSelectedIndex(0);
      } else {
        // Just close
        setIsOpen(false);
      }
    }

    // Open suggestions on any key if closed
    else if (!isOpen) {
      const newSuggestions = getSuggestions("");
      setSuggestions(newSuggestions);
      setIsOpen(true);
      setSelectedIndex(0);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (item: SuggestionItem) => {
    // Skip headers
    if (item.text === "Pages" || item.text === "Popups") {
      return;
    }

    if (item.isId && activeItem) {
      // It's an ID selection
      executeItem(activeItem, item.text);
    } else {
      // It's a regular item
      executeItem(item);
    }
  };

  // Focus input on / key
  useEffect(() => {
    const handleSlashKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();

        // Show suggestions
        const newSuggestions = getSuggestions("");
        setSuggestions(newSuggestions);
        setIsOpen(true);
        setSelectedIndex(0);
      }
    };

    document.addEventListener("keydown", handleSlashKey);
    return () => {
      document.removeEventListener("keydown", handleSlashKey);
    };
  }, []);

  // Get placeholder text based on current state
  const getPlaceholderText = () => {
    if (waitingForId && activeItem) {
      return `Enter ${activeItem.text} ID`;
    }
    return "Type to filter pages and popups...";
  };

  // Reset refs array when suggestions change
  useEffect(() => {
    suggestionItemsRef.current = suggestionItemsRef.current.slice(
      0,
      suggestions.length
    );
  }, [suggestions]);

  return (
    <div className="relative w-full max-w-2xl">
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={getPlaceholderText()}
          className="w-full px-4 py-3 text-text text-base bg-foreground border border-border rounded-lg shadow-sm focus:outline-none focus:ring focus:ring-primary focus:border-primary transition-all duration-200"
          autoFocus={externalIsOpen}
          onFocus={() => {
            if (!isOpen) {
              const newSuggestions = getSuggestions("");
              setSuggestions(newSuggestions);
              setIsOpen(true);
              setSelectedIndex(0);
            }
          }}
        />
      </div>

      {isOpen && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-1 overflow-y-auto bg-foreground border border-border rounded-lg shadow-lg max-h-64">
          {suggestions.map((suggestion, index) => {
            const isHeader =
              suggestion.text === "Pages" || suggestion.text === "Popups";

            return (
              <div
                key={`${suggestion.type}-${suggestion.text}-${index}`}
                ref={(el) => {
                  if (el) {
                    suggestionItemsRef.current[index] = el;
                  }
                }}
                className={`px-4 py-3 ${
                  isHeader
                    ? "font-bold text-xs uppercase text-text-muted bg-surface"
                    : "cursor-pointer hover:bg-surface"
                } ${
                  !isHeader && index === selectedIndex
                    ? "bg-surface border-l-4 border-primary"
                    : isHeader
                    ? ""
                    : "border-l-4 border-transparent"
                }`}
                onClick={() => {
                  if (!isHeader) {
                    handleSuggestionClick(suggestion);
                  }
                }}>
                <div className="flex justify-between items-center">
                  <span
                    className={
                      isHeader ? "text-text-muted" : "font-medium text-text"
                    }>
                    {suggestion.text}
                  </span>
                  {!isHeader && suggestion.description && (
                    <span className="text-sm text-text-muted">
                      {suggestion.description}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CommandBar;

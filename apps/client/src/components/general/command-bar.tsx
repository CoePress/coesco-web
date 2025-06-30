import { useState, useRef, useEffect } from "react";

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

interface SuggestionItem {
  text: string;
  description: string;
  type: "page" | "popup";
  requiresId?: boolean;
  isId?: boolean;
  entity?: string;
}

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
};

const CommandBar = ({
  onNavigate,
  defaultModule = "sales",
  isOpen: externalIsOpen = false,
}: CommandBarProps) => {
  const [input, setInput] = useState<string>("");
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [waitingForId, setWaitingForId] = useState<boolean>(false);
  const [activeItem, setActiveItem] = useState<SuggestionItem | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const suggestionItemsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (externalIsOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [externalIsOpen]);

  useEffect(() => {
    if (
      isOpen &&
      suggestionsRef.current &&
      suggestionItemsRef.current[selectedIndex]
    ) {
      const container = suggestionsRef.current;
      const selectedElement = suggestionItemsRef.current[selectedIndex];

      if (selectedElement) {
        const containerRect = container.getBoundingClientRect();
        const selectedRect = selectedElement.getBoundingClientRect();

        if (selectedRect.bottom > containerRect.bottom) {
          container.scrollTop += selectedRect.bottom - containerRect.bottom;
        } else if (selectedRect.top < containerRect.top) {
          container.scrollTop -= containerRect.top - selectedRect.top;
        }
      }
    }
  }, [selectedIndex, isOpen]);

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

  const getSuggestions = (query: string): SuggestionItem[] => {
    const module = moduleConfig[defaultModule];
    if (!module) return [];

    const normalizedQuery = query.toLowerCase();
    const suggestions: SuggestionItem[] = [];

    if (waitingForId && activeItem) {
      return getIdSuggestions(activeItem.text, activeItem.type, query);
    }

    if (!suggestions.length) {
      suggestions.push({
        text: "Pages",
        description: "",
        type: "page",
      });
    }

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

    suggestions.push({
      text: "Popups",
      description: "",
      type: "popup",
    });

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

  const executeItem = (item: SuggestionItem, id?: string) => {
    if (item.requiresId && !id) {
      setWaitingForId(true);
      setActiveItem(item);
      setInput("");

      const idSuggestions = getIdSuggestions(item.text, item.type, "");
      setSuggestions(idSuggestions);
      setIsOpen(idSuggestions.length > 0);
      setSelectedIndex(0);
      return;
    }

    if (item.type === "page") {
      navigateToPage(item.text, id);
    } else if (item.type === "popup") {
      openPopupView(item.text, id);
    }

    setInput("");
    setIsOpen(false);
    setWaitingForId(false);
    setActiveItem(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);

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

    const newSuggestions = getSuggestions(value);
    setSuggestions(newSuggestions);
    setIsOpen(newSuggestions.length > 0);
    setSelectedIndex(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (suggestions.length > 0 && isOpen && selectedIndex >= 0) {
        const selectedItem = suggestions[selectedIndex];

        if (selectedItem.text === "Pages" || selectedItem.text === "Popups") {
          return;
        }

        if (selectedItem.isId && activeItem) {
          executeItem(activeItem, selectedItem.text);
        } else {
          executeItem(selectedItem);
        }
        e.preventDefault();
      }
    } else if (e.key === "ArrowDown" && isOpen) {
      let newIndex = selectedIndex + 1;

      while (
        newIndex < suggestions.length &&
        (suggestions[newIndex].text === "Pages" ||
          suggestions[newIndex].text === "Popups")
      ) {
        newIndex++;
      }

      if (newIndex >= suggestions.length) {
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

      while (
        newIndex >= 0 &&
        (suggestions[newIndex].text === "Pages" ||
          suggestions[newIndex].text === "Popups")
      ) {
        newIndex--;
      }

      if (newIndex < 0) {
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
    } else if (e.key === "Escape") {
      if (waitingForId) {
        setWaitingForId(false);
        setActiveItem(null);
        setInput("");
        const newSuggestions = getSuggestions("");
        setSuggestions(newSuggestions);
        setIsOpen(true);
        setSelectedIndex(0);
      } else {
        setIsOpen(false);
      }
    } else if (!isOpen) {
      const newSuggestions = getSuggestions("");
      setSuggestions(newSuggestions);
      setIsOpen(true);
      setSelectedIndex(0);
    }
  };

  const handleSuggestionClick = (item: SuggestionItem) => {
    if (item.text === "Pages" || item.text === "Popups") {
      return;
    }

    if (item.isId && activeItem) {
      executeItem(activeItem, item.text);
    } else {
      executeItem(item);
    }
  };

  useEffect(() => {
    const handleSlashKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();

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

  const getPlaceholderText = () => {
    if (waitingForId && activeItem) {
      return `Enter ${activeItem.text} ID`;
    }
    return "Type to filter pages and popups...";
  };

  useEffect(() => {
    suggestionItemsRef.current = suggestionItemsRef.current.slice(
      0,
      suggestions.length
    );
  }, [suggestions]);

  return (
    <div className="relative w-full max-w-2xl">
      <div className="mt-2 text-sm text-center opacity-70 select-none text-text-muted">
        <div className="bg-foreground rounded p-2 flex items-center gap-2 w-max mx-auto">
          <kbd className="bg-surface px-2 py-1 rounded text-xs">Esc</kbd> to
          close
          <span>|</span>
          <kbd className="bg-surface px-2 py-1 rounded text-xs">↑↓</kbd> to
          navigate
          <span>|</span>
          <kbd className="bg-surface px-2 py-1 rounded text-xs">Enter</kbd> to
          select
        </div>
      </div>

      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={getPlaceholderText()}
          className="w-full px-4 py-3 text-text text-base bg-foreground border border-border rounded shadow-sm focus:outline-none focus:ring focus:ring-primary focus:border-primary transition-all duration-200"
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
          className="absolute z-10 w-full mt-1 overflow-y-auto bg-foreground border border-border rounded shadow-lg max-h-64">
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

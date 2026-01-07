import { Button, Input, Select } from "@/components";
import { Filter, Tags, Info, ChevronDown } from "lucide-react";
import { Employee } from "./utils";
import { useState, useRef, useEffect } from "react";

interface PipelineHeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  rsmFilterDisplay: string;
  setRsmFilter: (filter: string) => void;
  setRsmFilterDisplay: (display: string) => void;
  availableRsms: Employee[];
  rsmDisplayNames?: Map<string, string>;
  journeyStatusFilter: string[];
  setJourneyStatusFilter: (statuses: string[]) => void;
  employee: any;
  setIsFilterModalOpen: (open: boolean) => void;
  showTags?: boolean;
  setShowTags?: (show: boolean) => void;
  kanbanBatchSize?: number;
  setKanbanBatchSize?: (size: number) => void;
  viewMode?: string;
  validJourneyStatuses: string[];
}

export const PipelineHeader = ({
  searchTerm,
  setSearchTerm,
  rsmFilterDisplay,
  setRsmFilter,
  setRsmFilterDisplay,
  availableRsms,
  rsmDisplayNames,
  journeyStatusFilter,
  setJourneyStatusFilter,
  employee,
  setIsFilterModalOpen,
  showTags,
  setShowTags,
  kanbanBatchSize,
  setKanbanBatchSize,
  viewMode,
  validJourneyStatuses
}: PipelineHeaderProps) => {
  const [showSearchHelp, setShowSearchHelp] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
    };

    if (isStatusDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isStatusDropdownOpen]);

  const handleStatusToggle = (status: string) => {
    if (journeyStatusFilter.includes(status)) {
      setJourneyStatusFilter(journeyStatusFilter.filter(s => s !== status));
    } else {
      setJourneyStatusFilter([...journeyStatusFilter, status]);
    }
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between px-4 py-2 border-b border-border bg-foreground gap-3 md:gap-0">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4 w-full md:w-auto">
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-1 flex-1 md:flex-initial">
            <div className="text-xs h-4"></div>
            <Input
              placeholder="Search journeys..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64"
            />
          </div>
          <div className="relative">
            <div className="flex flex-col gap-1">
              <div className="text-xs h-4"></div>
              <button
                onMouseEnter={() => setShowSearchHelp(true)}
                onMouseLeave={() => setShowSearchHelp(false)}
                className="p-1 rounded hover:bg-background-secondary transition-colors"
                type="button"
              >
                <Info size={16} className="text-text-muted" />
              </button>
            </div>
            {showSearchHelp && (
              <div className="absolute left-0 md:left-auto md:right-0 top-8 z-50 w-screen max-w-[calc(100vw-2rem)] md:w-80 p-3 bg-background border border-border rounded shadow-lg">
                <div className="text-sm space-y-2">
                  <p className="font-medium text-text">Search Options:</p>
                  <ul className="space-y-1 text-text-muted text-xs md:text-sm">
                    <li>• Regular search: Type any text to search journey names and companies</li>
                    <li>• Tag search: Use <code className="px-1 py-0.5 bg-background-secondary rounded">tag:</code> prefix to search by tags</li>
                  </ul>
                  <p className="font-medium text-text mt-2">Examples:</p>
                  <ul className="space-y-1 text-text-muted text-xs md:text-sm">
                    <li>• <code className="px-1 py-0.5 bg-background-secondary rounded">metalsa</code> - Find journeys with "metalsa" in name/company</li>
                    <li>• <code className="px-1 py-0.5 bg-background-secondary rounded">tag:</code> - Show all journeys that have any tags</li>
                    <li>• <code className="px-1 py-0.5 bg-background-secondary rounded">tag:test</code> - Find all journeys with tag "TEST"</li>
                    <li>• <code className="px-1 py-0.5 bg-background-secondary rounded">metalsa tag:test</code> - Find "metalsa" journeys with tag "TEST"</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-end gap-2">
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <label className="text-xs font-medium text-text-muted">RSM</label>
            <Select
              value={(() => {
                if (rsmFilterDisplay === 'my-journeys' || rsmFilterDisplay === "") return rsmFilterDisplay;

                if (rsmDisplayNames) {
                  for (const [initials, displayName] of rsmDisplayNames) {
                    if (displayName === rsmFilterDisplay) return initials;
                  }
                }
                return rsmFilterDisplay;
              })()}
              onChange={(e) => {
                if (e.target.value === 'my-journeys') {
                  const userInitials = employee?.number;
                  setRsmFilter(userInitials || "");
                  setRsmFilterDisplay('my-journeys');
                } else if (e.target.value === "") {
                  setRsmFilter("");
                  setRsmFilterDisplay("");
                } else {
                  const initials = e.target.value;
                  setRsmFilter(initials);
                  setRsmFilterDisplay(rsmDisplayNames?.get(initials) || initials);
                }
              }}
              options={(() => {
                const baseOptions = [
                  { value: "", label: "All" },
                  { value: "my-journeys", label: "Me    " }
                ];
                const rsmOptions = availableRsms.map((rsm: Employee) => ({
                  value: rsm.initials,
                  label: rsmDisplayNames?.get(rsm.initials) || rsm.name
                }));
                return [...baseOptions, ...rsmOptions];
              })()}
              className="w-full md:w-48"
            />
          </div>

          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <label className="text-xs font-medium text-text-muted">Status</label>
            <div className="relative" ref={statusDropdownRef}>
              <button
                type="button"
                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                className="w-full md:w-48 text-sm px-3 py-1.5 rounded border focus:outline-none focus:border-primary bg-foreground text-text border-border flex items-center justify-between"
              >
                <span className="truncate">
                  {journeyStatusFilter.length === 0
                    ? "All"
                    : journeyStatusFilter.length === 1
                    ? journeyStatusFilter[0]
                    : `${journeyStatusFilter.length} selected`}
                </span>
                <ChevronDown size={16} className="ml-2 flex-shrink-0" />
              </button>
              {isStatusDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-full md:w-48 bg-background border border-border rounded shadow-lg z-50 max-h-64 overflow-y-auto">
                  <div className="py-1">
                    <label className="flex items-center gap-2 px-3 py-2 hover:bg-surface cursor-pointer">
                      <input
                        type="checkbox"
                        checked={journeyStatusFilter.length === 0}
                        onChange={() => setJourneyStatusFilter([])}
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-text">All</span>
                    </label>
                    {validJourneyStatuses.map((status: string) => (
                      <label
                        key={status}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-surface cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={journeyStatusFilter.includes(status)}
                          onChange={() => handleStatusToggle(status)}
                          className="rounded border-border text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-text">{status}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {viewMode === "kanban" && kanbanBatchSize !== undefined && setKanbanBatchSize && (
            <div className="flex flex-col gap-1 w-20">
              <label className="text-xs font-medium text-text-muted">Show</label>
              <Select
                value={kanbanBatchSize.toString()}
                onChange={(e) => setKanbanBatchSize(Number(e.target.value))}
                options={[
                  { value: "25", label: "25" },
                  { value: "50", label: "50" },
                  { value: "75", label: "75" },
                  { value: "100", label: "100" }
                ]}
                className="w-full"
              />
            </div>
          )}
        </div>
      </div>
    <div className="flex flex-wrap items-end gap-2 w-full md:w-auto">
      {viewMode === "kanban" && showTags !== undefined && setShowTags && (
        <Button
          variant={showTags ? "secondary" : "secondary-outline"}
          size="sm"
          onClick={() => setShowTags(!showTags)}
          className="flex items-center gap-2 justify-center flex-1 sm:flex-initial"
        >
          <Tags size={14} />
          <span className="hidden sm:inline">{showTags ? "Hide Tags" : "Show Tags"}</span>
          <span className="sm:hidden">Tags</span>
        </Button>
      )}
      <Button
        variant="secondary-outline"
        size="sm"
        onClick={() => setIsFilterModalOpen(true)}
        className="flex items-center gap-2 justify-center flex-1 sm:flex-initial"
      >
        <Filter size={14} />
        <span className="hidden sm:inline">Advanced Filters</span>
        <span className="sm:hidden">Filters</span>
      </Button>
    </div>
  </div>
  );
};

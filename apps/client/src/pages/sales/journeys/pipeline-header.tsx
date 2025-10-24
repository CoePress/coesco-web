import { Button, Input, Select } from "@/components";
import { Filter, Tags, Info } from "lucide-react";
import { Employee } from "./utils";
import { useState } from "react";

interface PipelineHeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  rsmFilterDisplay: string;
  setRsmFilter: (filter: string) => void;
  setRsmFilterDisplay: (display: string) => void;
  availableRsms: Employee[];
  rsmDisplayNames?: Map<string, string>;
  journeyStatusFilter: string;
  setJourneyStatusFilter: (status: string) => void;
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

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-foreground">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-1">
            <div className="text-xs h-4"></div>
            <Input
              placeholder="Search journeys..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
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
              <div className="absolute left-0 top-8 z-50 w-80 p-3 bg-background border border-border rounded shadow-lg">
                <div className="text-sm space-y-2">
                  <p className="font-medium text-text">Search Options:</p>
                  <ul className="space-y-1 text-text-muted">
                    <li>• Regular search: Type any text to search journey names and companies</li>
                    <li>• Tag search: Use <code className="px-1 py-0.5 bg-background-secondary rounded">tag:</code> prefix to search by tags</li>
                  </ul>
                  <p className="font-medium text-text mt-2">Examples:</p>
                  <ul className="space-y-1 text-text-muted">
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
      <div className="flex flex-col gap-1">
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
              { value: "my-journeys", label: "Me    " }
            ];
            const rsmOptions = availableRsms.map((rsm: Employee) => ({
              value: rsm.initials,
              label: rsmDisplayNames?.get(rsm.initials) || rsm.name
            }));
            return [...baseOptions, ...rsmOptions];
          })()}
          className="w-48"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-text-muted">Status</label>
        <Select
          value={journeyStatusFilter}
          onChange={(e) => setJourneyStatusFilter(e.target.value)}
          options={[
            { value: "", label: "All" },
            ...validJourneyStatuses.map((status: string) => ({ value: status, label: status + " " }))
          ]}
          className="w-48"
        />
      </div>
    </div>
    <div className="flex items-center gap-2">
      {viewMode === "kanban" && kanbanBatchSize !== undefined && setKanbanBatchSize && (
        <div className="flex flex-col gap-1">
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
            className="w-24"
          />
        </div>
      )}
      {viewMode === "kanban" && showTags !== undefined && setShowTags && (
        <div className="flex flex-col gap-1">
          <div className="text-xs h-4"></div>
          <Button
            variant={showTags ? "secondary" : "secondary-outline"}
            size="sm"
            onClick={() => setShowTags(!showTags)}
            className="flex items-center gap-2"
          >
            <Tags size={14} />
            {showTags ? "Hide Tags" : "Show Tags"}
          </Button>
        </div>
      )}
      <div className="flex flex-col gap-1">
        <div className="text-xs h-4"></div>
        <Button
          variant="secondary-outline"
          size="sm"
          onClick={() => setIsFilterModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Filter size={14} />
          Advanced Filters
        </Button>
      </div>
    </div>
  </div>
  );
};
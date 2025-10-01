import { Button, Input, Select } from "@/components";
import { Filter, Tags } from "lucide-react";
import { VALID_JOURNEY_STATUS } from "./constants";

interface PipelineHeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  rsmFilterDisplay: string;
  setRsmFilter: (filter: string) => void;
  setRsmFilterDisplay: (display: string) => void;
  availableRsms: string[];
  rsmDisplayNames?: Map<string, string>;
  journeyStatusFilter: string;
  setJourneyStatusFilter: (status: string) => void;
  employee: any;
  setIsFilterModalOpen: (open: boolean) => void;
  showTags?: boolean;
  setShowTags?: (show: boolean) => void;
  viewMode?: string;
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
  viewMode
}: PipelineHeaderProps) => (
  <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-foreground">
    <div className="flex items-center gap-4">
      <Input
        placeholder="Search journeys..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-64"
      />
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-text-muted">RSM</label>
        <Select
          value={(() => {
            // Convert display value back to actual value for Select component
            if (rsmFilterDisplay === 'my-journeys' || rsmFilterDisplay === "") return rsmFilterDisplay;
            // Find the initials that match the display name
            if (rsmDisplayNames) {
              for (const [initials, displayName] of rsmDisplayNames) {
                if (displayName === rsmFilterDisplay) return initials;
              }
            }
            return rsmFilterDisplay; // fallback
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
              // e.target.value contains the initials (the value)
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
            const rsmOptions = availableRsms.filter((rsm: string) => rsm && rsm.trim()).map((rsm: string) => ({ 
              value: rsm, 
              label: rsmDisplayNames?.get(rsm) || rsm 
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
            ...VALID_JOURNEY_STATUS.map((status: string) => ({ value: status, label: status + " " }))
          ]}
          className="w-48"
        />
      </div>
    </div>
    <div className="flex items-center gap-2">
      {viewMode === "kanban" && showTags !== undefined && setShowTags && (
        <Button
          variant={showTags ? "secondary" : "secondary-outline"}
          size="sm"
          onClick={() => setShowTags(!showTags)}
          className="flex items-center gap-2"
        >
          <Tags size={14} />
          {showTags ? "Hide Tags" : "Show Tags"}
        </Button>
      )}
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
);
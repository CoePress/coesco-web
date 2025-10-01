import { useState, useRef, useEffect, useCallback } from "react";
import { MoreHorizontal, Eye, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button, StatusBadge } from "@/components";
import Table from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/utils";
import { getPriorityConfig } from "./utils";
import { DeleteJourneyModal } from "@/components/modals/delete-journey-modal";
import { TrackJourneyModal } from "@/components/modals/track-journey-modal";
import { UntrackJourneyModal } from "@/components/modals/untrack-journey-modal";
import { useJourneyTracking } from "@/hooks/use-journey-tracking";

const TableActionsCell = ({ journey, onDelete }: { journey: any; onDelete: (id: string) => void }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [showUntrackModal, setShowUntrackModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { isTracked, trackingInfo, refreshTracking, setIsTracked } = useJourneyTracking(journey?.id);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <div className="text-right">
      <div className="relative" ref={menuRef}>
        <button 
          className="text-neutral-400 hover:text-neutral-600 p-1"
          onClick={(e) => {
            e.stopPropagation();
            setIsMenuOpen(!isMenuOpen);
          }}
        >
          <MoreHorizontal size={16} />
        </button>
        {isMenuOpen && (
          <div className="absolute right-0 top-8 bg-background border border-border rounded shadow-lg py-1 z-50 min-w-32">
            <button
              className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${
                isTracked 
                  ? 'text-blue-600 hover:bg-blue-50' 
                  : 'text-neutral-400 hover:bg-gray-50'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(false);
                if (isTracked) {
                  setShowUntrackModal(true);
                } else {
                  setShowTrackModal(true);
                }
              }}
            >
              <Eye size={14} />
              {isTracked ? 'Stop Tracking' : 'Track Journey'}
            </button>
            <button
              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(false);
                setShowDeleteConfirm(true);
              }}
            >
              <Trash2 size={14} />
              Delete Journey
            </button>
          </div>
        )}
      </div>
      <DeleteJourneyModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          setShowDeleteConfirm(false);
          onDelete(journey.id);
        }}
        journey={journey}
      />
      
      <TrackJourneyModal
        isOpen={showTrackModal}
        onClose={() => setShowTrackModal(false)}
        journey={journey}
        onTrackingChange={(tracked) => {
          setIsTracked(tracked);
          refreshTracking();
        }}
      />
      
      <UntrackJourneyModal
        isOpen={showUntrackModal}
        onClose={() => setShowUntrackModal(false)}
        journey={journey}
        trackingInfo={trackingInfo}
        onTrackingChange={(tracked) => {
          setIsTracked(tracked);
          refreshTracking();
        }}
      />
    </div>
  );
};

interface ListViewProps {
  journeys: any[];
  sortedFilteredJourneys: any[];
  customersById: Map<string, any>;
  listBatchSize: number;
  hasMoreJourneys: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  onDeleteJourney: (journeyId: string) => void;
  onSort: (field: string, order?: 'asc' | 'desc') => void;
  stageLabel: (id?: number) => string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

export const ListView = ({
  journeys,
  sortedFilteredJourneys,
  customersById,
  listBatchSize,
  hasMoreJourneys,
  isLoadingMore,
  onLoadMore,
  onDeleteJourney,
  onSort,
  stageLabel,
  sortField,
  sortDirection,
}: ListViewProps) => {
  const listContainerRef = useRef<HTMLDivElement>(null);

  const listJourneys = journeys.slice(0, listBatchSize);

  const handleScroll = useCallback((e: Event) => {
    const target = e.target as HTMLElement;
    if (!target) return;
    
    const { scrollTop, scrollHeight, clientHeight } = target;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100; // 100px threshold
    
    if (isNearBottom && hasMoreJourneys && !isLoadingMore) {
      onLoadMore();
    }
  }, [hasMoreJourneys, isLoadingMore, onLoadMore]);

  useEffect(() => {
    if (!listContainerRef.current) return;

    const scrollContainer = listContainerRef.current;

    // Throttle scroll events
    let timeoutId: NodeJS.Timeout;
    const throttledScroll = (e: Event) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => handleScroll(e), 100);
    };

    scrollContainer.addEventListener('scroll', throttledScroll, { passive: true });
    
    return () => {
      scrollContainer.removeEventListener('scroll', throttledScroll);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [handleScroll]);

  const tableColumns = [
    {
      key: "name",
      header: "Journey Name",
      render: (_: string, row: any) => (
        <Link
          to={`/sales/pipeline/${row.id}`}
          className="text-sm font-medium text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {row.name}
        </Link>
      ),
    },
    {
      key: "customerId",
      header: "Company",
      render: (value: string, row: any) => {
        const customer = customersById.get(String(value));
        let companyDisplay = "";
        
        if (value && value !== "0" && customer?.name) {
          companyDisplay = customer.name;
        } else if (row.companyName) {
          companyDisplay = row.companyName;
        } else if (row.target_account) {
          companyDisplay = row.target_account;
        } else {
          companyDisplay = "NA";
        }
        
        return (
          <div>
            <div className="text-sm text-neutral-400">
              {companyDisplay}
            </div>
            <div className="text-xs text-neutral-400">{row.contact}</div>
          </div>
        );
      }
    },
    {
      key: "stage",
      header: "Stage",
      render: (value: number) => (
        <div className="flex items-center gap-2">
          <div className="text-sm text-neutral-400">{stageLabel(value)}</div>
        </div>
      ),
    },
    {
      key: "value",
      header: "Value",
      render: (value: number) => (
        <div className="text-sm font-medium text-neutral-400">
          {formatCurrency(value)}
        </div>
      ),
    },
    {
      key: "confidence",
      header: "Confidence",
      render: (value: number) => (
        <div className="flex items-center gap-2">
          <div className="bg-gray-200 h-1.5 w-16 rounded-full overflow-hidden">
            <div
              className={`h-full ${
                (value ?? 0) >= 70
                  ? "bg-green-500"
                  : (value ?? 0) >= 40
                    ? "bg-yellow-500"
                    : "bg-red-500"
              }`}
              style={{ width: `${(value ?? 0)}%` }}></div>
          </div>
          <span className="text-xs text-neutral-400">{value ?? 0}%</span>
        </div>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      render: (value: string) => (
        <StatusBadge label={value} variant={getPriorityConfig(value).style} />
      ),
    },
    {
      key: "updatedAt",
      header: "Last Activity",
      render: (value: string) => (
        <div className="text-sm text-neutral-400">{formatDate(value)}</div>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (_: any, row: any) => (
        <TableActionsCell journey={row} onDelete={onDeleteJourney} />
      ),
    },
  ];

  return (
    <div ref={listContainerRef} className="flex-1 overflow-auto">
      <div className="flex flex-col h-full">
        <Table
          columns={tableColumns}
          data={listJourneys}
          total={sortedFilteredJourneys.length}
          className="bg-foreground rounded shadow-sm border flex-shrink-0"
          onSortChange={(sort, order) => onSort(sort, order)}
          sort={sortField}
          order={sortDirection}
        />
        {hasMoreJourneys && (
          <div className="p-4 bg-foreground flex justify-center flex-shrink-0">
            <Button
              variant="secondary-outline"
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className="min-w-32"
            >
              {isLoadingMore 
                ? "Loading..." 
                : `Load ${Math.min(200, sortedFilteredJourneys.length - listBatchSize)} More (${sortedFilteredJourneys.length - listBatchSize} remaining)`
              }
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
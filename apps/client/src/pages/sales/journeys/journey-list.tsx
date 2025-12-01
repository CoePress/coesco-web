import { Eye, MoreHorizontal, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { StatusBadge } from "@/components";
import { DeleteJourneyModal } from "@/components/modals/delete-journey-modal";
import { TrackJourneyModal } from "@/components/modals/track-journey-modal";
import { UntrackJourneyModal } from "@/components/modals/untrack-journey-modal";
import Table from "@/components/ui/table";
import { useJourneyTracking } from "@/hooks/use-journey-tracking";
import { formatCurrency, formatDate } from "@/utils";

import { getPriorityConfig } from "./utils";

function TableActionsCell({ journey, onDelete }: { journey: any; onDelete: (id: string) => void }) {
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
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
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
                  ? "text-blue-600 hover:bg-blue-50"
                  : "text-neutral-400 hover:bg-gray-50"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(false);
                if (isTracked) {
                  setShowUntrackModal(true);
                }
                else {
                  setShowTrackModal(true);
                }
              }}
            >
              <Eye size={14} />
              {isTracked ? "Stop Tracking" : "Track Journey"}
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
}

interface ListViewProps {
  journeys: any[];
  customersById: Map<string, any>;
  pagination: {
    page: number;
    totalPages: number;
    total: number;
    limit: number;
  };
  onPageChange: (page: number) => void;
  onDeleteJourney: (journeyId: string) => void;
  onSort: (field: string, order?: "asc" | "desc") => void;
  stageLabel: (id?: number) => string;
  sortField?: string;
  sortDirection?: "asc" | "desc";
  isLoading?: boolean;
}

export function ListView({
  journeys,
  customersById,
  pagination,
  onPageChange,
  onDeleteJourney,
  onSort,
  stageLabel,
  sortField,
  sortDirection,
  isLoading,
}: ListViewProps) {
  const listContainerRef = useRef<HTMLDivElement>(null);

  const tableColumns = [
    {
      key: "customerId",
      header: "Company",
      render: (value: string, row: any) => {
        const customer = customersById.get(String(value));
        let companyDisplay = "";

        if (value && value !== "0" && customer?.name) {
          companyDisplay = customer.name;
        }
        else if (row.companyName) {
          companyDisplay = row.companyName;
        }
        else if (row.target_account) {
          companyDisplay = row.target_account;
        }
        else {
          companyDisplay = "NA";
        }

        return (
          <Link
            to={`/sales/pipeline/${row.id}`}
            className="hover:underline"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-sm font-medium text-primary">
              {companyDisplay}
            </div>
            <div className="text-xs text-neutral-400">{row.contact}</div>
          </Link>
        );
      },
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
              style={{ width: `${(value ?? 0)}%` }}
            >
            </div>
          </div>
          <span className="text-xs text-neutral-400">
            {value ?? 0}
            %
          </span>
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
        <div className="text-sm text-neutral-400">{value ? formatDate(value) : "N/A"}</div>
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
      <div className="flex flex-col h-full relative">
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
            <div className="bg-foreground p-4 rounded border shadow-lg">
              <span className="text-sm text-text-muted">Loading journeys...</span>
            </div>
          </div>
        )}
        <Table
          columns={tableColumns}
          data={journeys}
          total={pagination.total}
          className="bg-foreground rounded shadow-sm border flex-shrink-0"
          onSortChange={(sort, order) => onSort(sort, order)}
          sort={sortField}
          order={sortDirection}
          pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
}

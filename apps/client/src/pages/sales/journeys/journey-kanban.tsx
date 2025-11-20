import { useState, useCallback, useMemo, useRef, memo, useEffect } from "react";
import { MoreHorizontal, Eye, Tags, Ban, CheckCircle } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  pointerWithin,
  rectIntersection,
  getFirstCollision,
  type CollisionDetection
} from "@dnd-kit/core";
import {
  sortableKeyboardCoordinates,
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useNavigate } from "react-router-dom";
import { formatCurrency, formatDate } from "@/utils";
import { STAGES } from "./constants";
import { getPriorityConfig } from "./utils";
import { TrackJourneyModal } from "@/components/modals/track-journey-modal";
import { UntrackJourneyModal } from "@/components/modals/untrack-journey-modal";
import { AddTagsModal } from "@/components/modals/add-tags-modal";
import { useJourneyTracking } from "@/hooks/use-journey-tracking";
import { useApi } from "@/hooks/use-api";
import { useMobileDetection } from "@/hooks/use-mobile-detection";
import { MobileKanbanView } from "./components";

// const columnIdPrefix = "column-";

const DroppableColumn = ({
  id,
  children,
  className = "",
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`${className} ${isOver ? "bg-blue-50" : ""} transition-colors`}
    >
      {children}
    </div>
  );
};

const JourneyCard = memo(({
  journey,
  customer,
  isDragging = false,
  onClick,
  onDelete,
  style,
  showTags = false,
  onTagsUpdated,
  journeyTags,
  ...dragProps
}: {
  journey: any;
  customer?: any;
  isDragging?: boolean;
  onClick?: () => void;
  onDelete?: (journeyId: string) => void;
  style?: React.CSSProperties;
  showTags?: boolean;
  onTagsUpdated?: () => void;
  journeyTags?: Map<string, any[]>;
} & any) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [showUntrackModal, setShowUntrackModal] = useState(false);
  const [showTagsModal, setShowTagsModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { isTracked, trackingInfo, refreshTracking, setIsTracked } = useJourneyTracking(journey?.id);
  const isDeleted = journey.deletedAt === 1;

  const tags = journeyTags?.get(journey?.id?.toString()) || [];

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

  const handleTagsUpdated = () => {
    onTagsUpdated?.();
  };
  
  const priorityConfig = useMemo(() => getPriorityConfig(journey.priority), [journey.priority]);
  
  return (
    <div
      style={style}
      onClick={showTagsModal ? undefined : onClick}
      className={`bg-foreground rounded shadow-sm border border-border p-3 select-none mb-2
        hover:shadow-md hover:bg-opacity-90 hover:border-neutral-500 transition-all duration-200 ${
          showTagsModal ? 'cursor-default' : 'cursor-move'
        }`}
      {...dragProps}
    >
      <div className="flex items-center gap-2 mb-1">
        <div 
          className={`w-3 h-3 rounded-full ${priorityConfig.color} relative group cursor-help`}
          title={`Priority: ${journey.priority || 'None'} (${priorityConfig.label})`}
        >
          <div className="absolute bottom-full left-0 mb-1 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
            Priority: {journey.priority || 'None'} ({priorityConfig.label})
          </div>
        </div>
        <div className="text-sm font-medium text-neutral-400 truncate flex-1">
          {journey.name}
        </div>
      </div>
      {journey.Quote_Number && (
        <div className="text-xs text-neutral-500 mb-1">
          Quote #: {journey.Quote_Number}
        </div>
      )}
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm font-medium text-neutral-400">
          {formatCurrency(journey.value)}
        </div>
        <div className={`text-xs px-2 py-0.5 rounded-full ${priorityConfig.style}`}>
          {journey.priority}
        </div>
      </div>
      {journey.expectedDecisionDate && (
        <div className="text-xs text-neutral-400">
          Expected decision: {formatDate(journey.expectedDecisionDate)}
        </div>
      )}
      {showTags && (
        <div className="mt-2">
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {tags.map((tag: any) => (
                <div
                  key={tag.id}
                  className="bg-primary text-white px-2 py-0.5 rounded-full text-xs"
                >
                  {tag.description}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-neutral-400 italic">No tags</div>
          )}
        </div>
      )}
      <div className="flex justify-between items-center mt-2 pt-2 border-t">
        <div className="flex flex-col flex-1 mr-2">
          {journey.CreateDT && (
            <div className="text-xs text-neutral-400">
              Created: {formatDate(journey.CreateDT)}
            </div>
          )}
        </div>
        {!isDragging && (
          <div className="relative" ref={menuRef}>
            <button
              className="text-neutral-400 hover:text-neutral-600 p-1"
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
            >
              <MoreHorizontal size={14} />
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 top-6 bg-background border border-border rounded shadow-lg py-1 z-50 min-w-32">
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
                  className="w-full px-3 py-2 text-left text-sm text-neutral-400 hover:bg-gray-50 flex items-center gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    setShowTagsModal(true);
                  }}
                >
                  <Tags size={14} />
                  Add Tags
                </button>
                <button
                  className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${
                    isDeleted
                      ? 'text-green-600 hover:bg-green-50'
                      : 'text-red-600 hover:bg-red-50'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    onDelete?.(journey.id);
                  }}
                >
                  {isDeleted ? <CheckCircle size={14} /> : <Ban size={14} />}
                  {isDeleted ? 'Enable Journey' : 'Disable Journey'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

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
      
      <AddTagsModal
        isOpen={showTagsModal}
        onClose={() => {
          setShowTagsModal(false);
        }}
        journeyId={journey.id.toString()}
        onTagsUpdated={handleTagsUpdated}
      />
    </div>
  );
});

const SortableItem = memo(({
  journey,
  customersById,
  onDelete,
  showTags = false,
  onTagsUpdated,
  journeyTags,
}: {
  journey: any;
  customersById: Map<string, any>;
  onDelete?: (journeyId: string) => void;
  showTags?: boolean;
  onTagsUpdated?: () => void;
  journeyTags: Map<string, any[]>;
}) => {
  const navigate = useNavigate();
  const customer = customersById?.get(String(journey.customerId));

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: journey.id.toString() });

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!isDragging) {
      e.stopPropagation();
      navigate(`/sales/pipeline/${journey.id}`);
    }
  }, [isDragging, navigate, journey]);

  return (
    <JourneyCard
      ref={setNodeRef}
      journey={journey}
      customer={customer}
      isDragging={isDragging}
      onClick={handleClick}
      onDelete={onDelete}
      showTags={showTags}
      onTagsUpdated={onTagsUpdated}
      journeyTags={journeyTags}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      {...attributes}
      {...listeners}
    />
  );
});

const DragPreview = memo(({
  journey,
  customersById,
  showTags = false,
  journeyTags,
}: {
  journey: any;
  customersById: Map<string, any>;
  showTags?: boolean;
  journeyTags: Map<string, any[]>;
}) => {
  const customer = customersById?.get(String(journey.customerId));
  return (
    <JourneyCard
      journey={journey}
      customer={customer}
      isDragging
      showTags={showTags}
      journeyTags={journeyTags}
      className="select-none"
    />
  );
});

interface KanbanViewProps {
  journeys: any[];
  customersById: Map<string, any>;
  visibleStageIds: number[];
  idsByStage: Record<number, string[]>;
  stageCalculations: Map<number, any>;
  onDeleteJourney: (journeyId: string) => void;
  onStageUpdate: (journeyId: string, newStage: number) => Promise<void>;
  setIdsByStage: (updater: (prev: Record<number, string[]>) => Record<number, string[]>) => void;
  showTags?: boolean;
  onTagsUpdated?: () => void;
  employee?: any;
  journeyTags: Map<string, any[]>;
  isLoading?: boolean;
}

export const KanbanView = ({
  journeys,
  customersById,
  visibleStageIds,
  idsByStage,
  stageCalculations,
  onDeleteJourney,
  onStageUpdate,
  setIdsByStage,
  showTags = false,
  onTagsUpdated,
  employee,
  journeyTags,
  isLoading = false,
}: KanbanViewProps) => {
  const isMobile = useMobileDetection(768);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [originalStage, setOriginalStage] = useState<number | null>(null);
  const api = useApi();

  const columnIdPrefix = "column-";

  const stageFromDroppableId = useCallback((droppableId: string): number | undefined =>
    droppableId.startsWith(columnIdPrefix)
      ? Number(droppableId.replace(columnIdPrefix, ""))
      : undefined,
  [columnIdPrefix]);

  const findStageByItemId = useCallback((id: string): number | undefined => {
    const key = Object.keys(idsByStage).find((k) =>
      (idsByStage[Number(k)] ?? []).includes(id)
    );
    return key ? Number(key) : undefined;
  }, [idsByStage]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const collisionDetection = useCallback<CollisionDetection>((args) => {
    const pointerIntersections = pointerWithin(args);
    const intersections = pointerIntersections.length > 0 ? pointerIntersections : rectIntersection(args);
    const overId = getFirstCollision(intersections, "id");
    return overId ? [{ id: overId }] : [];
  }, []);

  const handleDragStart = useCallback(({ active }: any) => {
    setActiveId(active.id.toString());

    const activeContainerId: string | undefined =
      active?.data?.current?.sortable?.containerId;
    const fromStage =
      (activeContainerId && stageFromDroppableId(activeContainerId)) ??
      findStageByItemId(String(active.id));

    setOriginalStage(typeof fromStage === 'number' ? fromStage : null);
  }, [stageFromDroppableId, findStageByItemId]);

  const handleDragOver = useCallback(({ active, over }: any) => {
    if (!over) return;

    const activeContainerId: string | undefined =
      active?.data?.current?.sortable?.containerId;
    const sourceStage =
      (activeContainerId && stageFromDroppableId(activeContainerId)) ??
      findStageByItemId(String(active.id));

    const targetStage =
      stageFromDroppableId(String(over.id)) ??
      (over?.data?.current?.sortable?.containerId
        ? stageFromDroppableId(over.data.current.sortable.containerId)
        : undefined) ??
      findStageByItemId(String(over.id));

    if (!sourceStage || !targetStage || sourceStage === targetStage) return;

    setIdsByStage((prev) => {
      const sourceItems = [...(prev[sourceStage] ?? [])];
      const targetItems = [...(prev[targetStage] ?? [])];
      const activeIndex = sourceItems.indexOf(String(active.id));
      if (activeIndex === -1) return prev;

      sourceItems.splice(activeIndex, 1);

      const isOverAColumn =
        typeof over.id === "string" && String(over.id).startsWith(columnIdPrefix);
      const overIndex = isOverAColumn ? 0 : targetItems.indexOf(String(over.id));
      const insertAt = overIndex < 0 ? 0 : overIndex;

      targetItems.splice(insertAt, 0, String(active.id));

      return {
        ...prev,
        [sourceStage]: sourceItems,
        [targetStage]: targetItems,
      };
    });
  }, [stageFromDroppableId, findStageByItemId, columnIdPrefix, setIdsByStage]);

  const handleDragEnd = useCallback(async ({ active, over }: any) => {
    const fromStage = originalStage;
    setActiveId(null);
    setOriginalStage(null);

    if (!over || !fromStage) return;

    const toStage =
      stageFromDroppableId(String(over.id)) ??
      (over?.data?.current?.sortable?.containerId
        ? stageFromDroppableId(over.data.current.sortable.containerId)
        : undefined) ??
      findStageByItemId(String(over.id));

    if (!toStage) return;

    const isOverAColumn =
      typeof over.id === "string" && String(over.id).startsWith(columnIdPrefix);

    setIdsByStage((prev) => {
      if (fromStage === toStage) {
        const list = [...(prev[fromStage] ?? [])];
        const fromIndex = list.indexOf(String(active.id));
        if (fromIndex === -1) return prev;

        const rawToIndex = isOverAColumn
          ? list.length - 1
          : list.indexOf(String(over.id));

        const toIndex = Math.max(0, Math.min(list.length - 1, rawToIndex));
        return { ...prev, [fromStage]: arrayMove(list, fromIndex, toIndex) };
      } else {
        const fromList = [...(prev[fromStage] ?? [])];
        const toList = [...(prev[toStage] ?? [])];
        const fromIndex = fromList.indexOf(String(active.id));
        if (fromIndex === -1) return prev;

        fromList.splice(fromIndex, 1);

        const overIndex = isOverAColumn
          ? toList.length
          : toList.indexOf(String(over.id));
        const insertAt = overIndex < 0 ? toList.length : overIndex;

        toList.splice(insertAt, 0, String(active.id));

        return { ...prev, [fromStage]: fromList, [toStage]: toList };
      }
    });

    // Call the stage update handler first
    try {
      await onStageUpdate(String(active.id), toStage);
    } catch (error) {
      console.error("Failed to update journey stage:", error);
    }

    if (fromStage !== toStage && employee?.initials) {
      try {
        const journey = journeys.find((j) => j.id.toString() === String(active.id));
        const journeyId = journey?.ID || journey?.id || String(active.id);
        const fromStageLabel = STAGES.find(s => s.id === fromStage)?.label || `Stage ${fromStage}`;
        const toStageLabel = STAGES.find(s => s.id === toStage)?.label || `Stage ${toStage}`;

        await Promise.all([
          api.post('/legacy/std/Journey_Log', {
            Jrn_ID: journeyId,
            Action: `Journey_Stage: FROM ${fromStageLabel} TO ${toStageLabel}`,
            CreateDtTm: new Date().toISOString().replace('T', ' ').substring(0, 23),
            CreateInit: employee.initials
          }),
          api.post('/core/notes', {
            body: new Date().toISOString(),
            entityId: journeyId,
            entityType: "journey",
            type: "LastActivity",
            createdBy: employee.initials
          })
        ]);
      } catch (error) {
        console.error("Failed to log journey stage change:", error);
      }
    }
  }, [originalStage, stageFromDroppableId, findStageByItemId, columnIdPrefix, setIdsByStage, onStageUpdate, employee, api, journeys]);

  if (isMobile) {
    return (
      <MobileKanbanView
        journeys={journeys}
        customersById={customersById}
        visibleStageIds={visibleStageIds}
        idsByStage={idsByStage}
        stageCalculations={stageCalculations}
        onDeleteJourney={onDeleteJourney}
        onStageUpdate={onStageUpdate}
        setIdsByStage={setIdsByStage}
        showTags={showTags}
        onTagsUpdated={onTagsUpdated}
        employee={employee}
        journeyTags={journeyTags}
        isLoading={isLoading}
        JourneyCardComponent={JourneyCard}
        DragPreviewComponent={DragPreview}
      />
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 min-h-0 w-full overflow-x-auto overflow-y-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
            <div className="bg-foreground p-4 rounded border shadow-lg">
              <span className="text-sm text-text-muted">Loading journeys...</span>
            </div>
          </div>
        )}
        <div className="inline-flex gap-2 p-2 h-full">
          {STAGES.filter(s => visibleStageIds?.includes(s.id)).map((stage) => {
            const { items, stageTotal, stageWeighted } = stageCalculations.get(stage.id) || { items: [], stageTotal: 0, stageWeighted: 0 };
            return (
              <DroppableColumn
                key={stage.id}
                id={`${columnIdPrefix}${stage.id}`}
                className="w-[320px] min-w-[320px] bg-foreground rounded border border-border flex flex-col h-full"
              >
                <div className="p-2 pb-1 flex items-center justify-between flex-shrink-0">
                  <div className="text-sm font-semibold text-primary">{stage.label}</div>
                  <div className="text-xs text-neutral-400">
                    {items.length} Journeys
                  </div>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto px-2 pt-8">
                  <SortableContext
                    id={`${columnIdPrefix}${stage.id}`}
                    items={items}
                    strategy={verticalListSortingStrategy}
                  >
                    {items.map((itemId: string) => {
                      const journey = journeys.find((d) => d.id.toString() === itemId);
                      return journey ? (
                        <SortableItem
                          key={itemId}
                          journey={journey}
                          customersById={customersById}
                          onDelete={onDeleteJourney}
                          showTags={showTags}
                          onTagsUpdated={onTagsUpdated}
                          journeyTags={journeyTags}
                        />
                      ) : null;
                    })}
                  </SortableContext>
                </div>
                <div className="flex-shrink-0 p-2 pt-1 border-t border-border bg-background/50">
                  <div className="text-xs text-neutral-500 space-y-1">
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span className="font-medium">{formatCurrency(stageTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Weighted ({Math.round(stage.weight * 100)}%):</span>
                      <span className="font-medium text-primary">{formatCurrency(stageWeighted)}</span>
                    </div>
                  </div>
                </div>
              </DroppableColumn>
            );
          })}
        </div>
      </div>
      <DragOverlay>
        {activeId && (() => {
          const journey = journeys.find((d) => d.id.toString() === activeId);
          return journey ? <DragPreview journey={journey} customersById={customersById} showTags={showTags} journeyTags={journeyTags} /> : null;
        })()}
      </DragOverlay>
    </DndContext>
  );
};
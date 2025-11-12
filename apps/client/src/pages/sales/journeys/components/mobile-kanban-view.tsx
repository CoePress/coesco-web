import { useState, useCallback, useRef, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  type CollisionDetection,
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates,
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { StageNavigator } from './stage-navigator';
import { STAGES } from '../constants';
import { useApi } from '@/hooks/use-api';

interface MobileKanbanViewProps {
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
  JourneyCardComponent: React.ComponentType<any>;
  DragPreviewComponent: React.ComponentType<any>;
}

const DroppableColumn = ({
  id,
  children,
  className = '',
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`${className} ${isOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''} transition-colors`}
    >
      {children}
    </div>
  );
};

const SortableItem = memo(({
  journey,
  customersById,
  onDelete,
  showTags = false,
  onTagsUpdated,
  journeyTags,
  JourneyCardComponent,
}: {
  journey: any;
  customersById: Map<string, any>;
  onDelete?: (journeyId: string) => void;
  showTags?: boolean;
  onTagsUpdated?: () => void;
  journeyTags: Map<string, any[]>;
  JourneyCardComponent: React.ComponentType<any>;
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
    <JourneyCardComponent
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

export const MobileKanbanView = ({
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
  JourneyCardComponent,
  DragPreviewComponent,
}: MobileKanbanViewProps) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [originalStage, setOriginalStage] = useState<number | null>(null);
  const api = useApi();

  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const visibleStages = STAGES.filter(s => visibleStageIds?.includes(s.id));
  const currentStage = visibleStages[currentStageIndex];
  const columnIdPrefix = 'column-mobile-';

  const stageFromDroppableId = (droppableId: string): number | undefined =>
    droppableId.startsWith(columnIdPrefix)
      ? Number(droppableId.replace(columnIdPrefix, ''))
      : undefined;

  const findStageByItemId = (id: string): number | undefined => {
    const key = Object.keys(idsByStage).find((k) =>
      (idsByStage[Number(k)] ?? []).includes(id)
    );
    return key ? Number(key) : undefined;
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 15 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const collisionDetection = useCallback<CollisionDetection>((args) => {
    const pointerIntersections = pointerWithin(args);
    const intersections = pointerIntersections.length > 0 ? pointerIntersections : rectIntersection(args);
    const overId = getFirstCollision(intersections, 'id');
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
  }, []);

  const handleDragEnd = useCallback(async ({ active, over }: any) => {
    const fromStage = originalStage;
    setActiveId(null);
    setOriginalStage(null);

    if (!over || !fromStage) return;

    const toStage = currentStage.id;

    const isOverAColumn =
      typeof over.id === 'string' && String(over.id).startsWith(columnIdPrefix);

    setIdsByStage((prev) => {
      const list = [...(prev[fromStage] ?? [])];
      const fromIndex = list.indexOf(String(active.id));
      if (fromIndex === -1) return prev;

      const rawToIndex = isOverAColumn
        ? list.length - 1
        : list.indexOf(String(over.id));

      const toIndex = Math.max(0, Math.min(list.length - 1, rawToIndex));
      return { ...prev, [fromStage]: arrayMove(list, fromIndex, toIndex) };
    });

    try {
      await onStageUpdate(String(active.id), toStage);
    } catch (error) {
      console.error('Failed to update journey stage:', error);
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
            entityType: 'journey',
            type: 'LastActivity',
            createdBy: employee.initials
          })
        ]);
      } catch (error) {
        console.error('Failed to log journey stage change:', error);
      }
    }
  }, [originalStage, currentStage, columnIdPrefix, setIdsByStage, onStageUpdate, employee, api, journeys]);

  const goToNextStage = useCallback(() => {
    setCurrentStageIndex((prev) => Math.min(prev + 1, visibleStages.length - 1));
  }, [visibleStages.length]);

  const goToPrevStage = useCallback(() => {
    setCurrentStageIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToStage = useCallback((index: number) => {
    setCurrentStageIndex(index);
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchStartX.current - touchEndX;
    const diffY = touchStartY.current - touchEndY;

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 75) {
      if (diffX > 0) {
        goToNextStage();
      } else {
        goToPrevStage();
      }
    }
  }, [goToNextStage, goToPrevStage]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd]);

  if (!currentStage) return null;

  const { items, stageTotal, stageWeighted } = stageCalculations.get(currentStage.id) || {
    items: [],
    stageTotal: 0,
    stageWeighted: 0
  };

  return (
    <div className="flex-1 min-h-0 w-full flex flex-col overflow-hidden" ref={containerRef}>
      <StageNavigator
        currentStage={currentStage}
        currentIndex={currentStageIndex}
        totalStages={visibleStages.length}
        stageTotal={stageTotal}
        stageWeighted={stageWeighted}
        journeyCount={items.length}
        onNext={goToNextStage}
        onPrev={goToPrevStage}
        onSelectStage={goToStage}
        allStages={visibleStages}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 min-h-0 w-full overflow-hidden relative">
          {isLoading && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
              <div className="bg-foreground p-4 rounded border shadow-lg">
                <span className="text-sm text-text-muted">Loading journeys...</span>
              </div>
            </div>
          )}

          <DroppableColumn
            id={`${columnIdPrefix}${currentStage.id}`}
            className="h-full overflow-y-auto px-2 py-2"
          >
            <SortableContext
              id={`${columnIdPrefix}${currentStage.id}`}
              items={items}
              strategy={verticalListSortingStrategy}
            >
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-text-muted">
                  <p className="text-sm">No journeys in this stage</p>
                  <p className="text-xs mt-1">Swipe to see other stages</p>
                </div>
              ) : (
                items.map((itemId: string) => {
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
                      JourneyCardComponent={JourneyCardComponent}
                    />
                  ) : null;
                })
              )}
            </SortableContext>
          </DroppableColumn>
        </div>

        <DragOverlay>
          {activeId && (() => {
            const journey = journeys.find((d) => d.id.toString() === activeId);
            return journey ? (
              <DragPreviewComponent
                journey={journey}
                customersById={customersById}
                showTags={showTags}
                journeyTags={journeyTags}
              />
            ) : null;
          })()}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

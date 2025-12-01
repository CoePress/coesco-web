import { ChevronLeft, ChevronRight } from "lucide-react";

import { formatCurrency } from "@/utils";

interface StageNavigatorProps {
  currentStage: {
    id: number;
    label: string;
    weight: number;
  };
  currentIndex: number;
  totalStages: number;
  stageTotal: number;
  stageWeighted: number;
  journeyCount: number;
  onNext: () => void;
  onPrev: () => void;
  onSelectStage?: (index: number) => void;
  allStages: Array<{ id: number; label: string }>;
}

export function StageNavigator({
  currentStage,
  currentIndex,
  totalStages,
  stageTotal,
  stageWeighted,
  journeyCount,
  onNext,
  onPrev,
  onSelectStage,
  allStages,
}: StageNavigatorProps) {
  return (
    <div className="bg-foreground border-b border-border sticky top-0 z-20">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={onPrev}
          disabled={currentIndex === 0}
          className="p-2 rounded-lg hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous stage"
        >
          <ChevronLeft size={24} />
        </button>

        <div className="flex-1 text-center">
          <div className="text-lg font-semibold text-primary">
            {currentStage.label}
          </div>
          <div className="text-xs text-text-muted">
            Stage
            {" "}
            {currentIndex + 1}
            {" "}
            of
            {" "}
            {totalStages}
            {" "}
            •
            {" "}
            {journeyCount}
            {" "}
            {journeyCount === 1 ? "journey" : "journeys"}
          </div>
        </div>

        <button
          onClick={onNext}
          disabled={currentIndex === totalStages - 1}
          className="p-2 rounded-lg hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Next stage"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      <div className="flex justify-center gap-1 pb-3 px-4">
        {allStages.map((stage, index) => (
          <button
            key={stage.id}
            onClick={() => onSelectStage?.(index)}
            className={`h-1.5 rounded-full transition-all ${
              index === currentIndex
                ? "w-6 bg-primary"
                : "w-1.5 bg-border hover:bg-primary/50"
            }`}
            aria-label={`Go to ${stage.label}`}
          />
        ))}
      </div>

      <div className="px-4 pb-3 flex justify-between text-xs text-text-muted border-t border-border pt-2">
        <div>
          <span className="font-medium">Total:</span>
          {" "}
          <span className="text-text">{formatCurrency(stageTotal)}</span>
        </div>
        <div>
          <span className="font-medium">
            Weighted (
            {Math.round(currentStage.weight * 100)}
            %):
          </span>
          {" "}
          <span className="text-primary font-medium">{formatCurrency(stageWeighted)}</span>
        </div>
      </div>
    </div>
  );
}

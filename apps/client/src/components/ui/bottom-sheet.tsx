import { GripHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button, Card } from "@/components";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  headerActions?: React.ReactNode;
  snapPoint?: "small" | "medium" | "large" | "full";
  showHandle?: boolean;
  showCloseButton?: boolean;
  enableDrag?: boolean;
  backdropClosable?: boolean;
}

function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  footer,
  headerActions,
  snapPoint = "medium",
  showHandle = true,
  showCloseButton = false,
  enableDrag = true,
  backdropClosable = true,
}: BottomSheetProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [currentTranslateY, setCurrentTranslateY] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  const snapPoints = {
    small: "30vh",
    medium: "50vh",
    large: "75vh",
    full: "95vh",
  };

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      document.body.style.overflow = "hidden";
    }
    else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (backdropClosable && e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
      setCurrentTranslateY(0);
    }, 300);
  };

  const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (!enableDrag)
      return;

    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    setDragStartY(clientY);
  };

  const handleDragMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!enableDrag || dragStartY === null)
      return;

    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const deltaY = clientY - dragStartY;

    if (deltaY > 0) {
      setCurrentTranslateY(deltaY);
    }
  };

  const handleDragEnd = () => {
    if (!enableDrag || dragStartY === null)
      return;

    if (currentTranslateY > 100) {
      handleClose();
    }
    else {
      setCurrentTranslateY(0);
    }

    setDragStartY(null);
  };

  if (!isOpen && !isAnimating)
    return null;

  return (
    <div
      className="fixed inset-0 bg-background/35 backdrop-blur-xs z-[60] text-text"
      onClick={handleOverlayClick}
      style={{
        opacity: isAnimating ? 1 : 0,
        transition: "opacity 300ms ease-in-out",
      }}
    >
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 flex flex-col"
        style={{
          maxHeight: snapPoints[snapPoint],
          transform: isAnimating
            ? `translateY(${currentTranslateY}px)`
            : "translateY(100%)",
          transition:
            dragStartY !== null
              ? "none"
              : "transform 300ms cubic-bezier(0.32, 0.72, 0, 1)",
        }}
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        <Card className="flex flex-col h-full rounded-b-none border-b-0">
          {showHandle && (
            <div className="flex justify-center py-2 cursor-grab active:cursor-grabbing">
              <GripHorizontal size={24} className="text-text-muted" />
            </div>
          )}

          {title && (
            <div className="flex items-center justify-between mb-2 flex-shrink-0">
              <h2 className="font-medium text-lg">{title}</h2>
              {(headerActions || showCloseButton) && (
                <div className="flex items-center gap-2">
                  {headerActions}
                  {showCloseButton && (
                    <Button
                      variant="secondary-outline"
                      size="sm"
                      onClick={handleClose}
                    >
                      <X size={16} />
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2 flex-1 overflow-auto">
            {children}
          </div>

          {footer && (
            <div className="flex-shrink-0 pt-2 border-t border-border mt-2">
              {footer}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default BottomSheet;

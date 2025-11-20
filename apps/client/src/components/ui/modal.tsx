import { Card, Button } from "@/components";
import { X } from "lucide-react";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  headerActions?: React.ReactNode;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  overflow?: "visible" | "auto";
  backdropClosable?: boolean;
};

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  headerActions,
  size = "md",
  overflow = "auto",
  backdropClosable = false,
}: ModalProps) => {
  if (!isOpen) return null;

  const sizeClass = {
    xs: "w-[400px]",
    sm: "w-[600px]",
    md: "w-[800px]",
    lg: "w-[1000px]",
    xl: "w-[1200px]",
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (backdropClosable && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-background/35 backdrop-blur-xs z-50 text-text px-4"
      onClick={handleOverlayClick}
    >
      <Card
        className={`max-h-[90vh] md:max-h-[70vh] flex flex-col ${sizeClass[size]}`}>
        <div className="flex items-center justify-between mb-2 flex-shrink-0">
          <h2 className="font-medium">{title}</h2>
          <div className="flex items-center gap-2">
            {headerActions}
            <Button
              variant="secondary-outline"
              size="sm"
              onClick={onClose}>
              <X size={16} />
            </Button>
          </div>
        </div>
        <div className={`flex flex-col gap-2 flex-1 ${overflow === "visible" ? "overflow-visible" : "overflow-auto"}`}>{children}</div>
        {footer && (
          <div className="flex-shrink-0 pt-2 border-t border-border mt-2">
            {footer}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Modal;

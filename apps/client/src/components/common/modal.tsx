import { Card, Button } from "@/components";
import { X } from "lucide-react";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "xs" | "sm" | "md" | "lg";
};

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
}: ModalProps) => {
  if (!isOpen) return null;

  const sizeClass = {
    xs: "w-[400px]",
    sm: "w-[600px]",
    md: "w-[800px]",
    lg: "w-[1000px]",
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 text-white/80 px-4">
      <Card
        className={`max-h-[90vh] md:max-h-[70vh] overflow-hidden ${sizeClass[size]}`}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-medium">{title}</h2>
          <Button
            variant="secondary-outline"
            size="sm"
            onClick={onClose}>
            <X size={16} />
          </Button>
        </div>
        <div className="flex flex-col gap-2">{children}</div>
      </Card>
    </div>
  );
};

export default Modal;

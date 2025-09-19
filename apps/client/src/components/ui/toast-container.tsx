import { createPortal } from "react-dom";
import Toast from "./toast";
import { ToastData } from "@/contexts/toast.context";

type ToastContainerProps = {
  toasts: ToastData[];
  onRemoveToast: (id: string) => void;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "top-center" | "bottom-center";
};

const ToastContainer = ({
  toasts,
  onRemoveToast,
  position = "top-right",
}: ToastContainerProps) => {
  if (toasts.length === 0) return null;

  const positionClasses = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-center": "top-4 left-1/2 transform -translate-x-1/2",
    "bottom-center": "bottom-4 left-1/2 transform -translate-x-1/2",
  };

  return createPortal(
    <div
      className={`fixed z-[9999] flex flex-col gap-2 pointer-events-none ${positionClasses[position]}`}
      style={{ maxWidth: "420px", width: "100%" }}
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            id={toast.id}
            title={toast.title}
            message={toast.message}
            variant={toast.variant}
            duration={toast.duration}
            onClose={onRemoveToast}
          />
        </div>
      ))}
    </div>,
    document.body
  );
};

export default ToastContainer;
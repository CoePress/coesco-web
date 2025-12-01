import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from "lucide-react";
import { useEffect, useState } from "react";

type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastProps {
  id: string;
  title?: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
  onClose: (id: string) => void;
}

function Toast({
  id,
  title,
  message,
  variant = "info",
  duration = 5000,
  onClose,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose(id), 150);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, id, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(id), 150);
  };

  const variants = {
    success: {
      icon: CheckCircle,
      bg: "bg-success/10 border-success/20",
      text: "text-success",
      iconColor: "text-success",
    },
    error: {
      icon: AlertCircle,
      bg: "bg-error/10 border-error/20",
      text: "text-error",
      iconColor: "text-error",
    },
    warning: {
      icon: AlertTriangle,
      bg: "bg-warning/10 border-warning/20",
      text: "text-warning",
      iconColor: "text-warning",
    },
    info: {
      icon: Info,
      bg: "bg-info/10 border-info/20",
      text: "text-info",
      iconColor: "text-info",
    },
  };

  const { icon: Icon, bg, text, iconColor } = variants[variant];

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-lg border shadow-lg backdrop-blur-sm
        transform transition-all duration-200 ease-out
        ${bg} ${text}
        ${
    isVisible
      ? "translate-x-0 opacity-100"
      : "translate-x-full opacity-0"
    }
      `}
    >
      <Icon size={20} className={`flex-shrink-0 mt-0.5 ${iconColor}`} />

      <div className="flex-1 min-w-0">
        {title && (
          <div className="font-semibold text-sm mb-1">{title}</div>
        )}
        <div className="text-sm leading-relaxed">{message}</div>
      </div>

      <button
        onClick={handleClose}
        className="flex-shrink-0 p-1 rounded-md hover:bg-black/10 transition-colors"
        aria-label="Close notification"
      >
        <X size={16} className="text-text-muted hover:text-text" />
      </button>
    </div>
  );
}

export default Toast;

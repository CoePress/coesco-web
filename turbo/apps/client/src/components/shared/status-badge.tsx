import { LucideIcon } from "lucide-react";

type StatusBadgeProps = {
  label?: string;
  icon?: LucideIcon;
  variant?: "success" | "warning" | "error" | "info" | "default";
};

const StatusBadge = ({
  label,
  icon: Icon,
  variant = "default",
}: StatusBadgeProps) => {
  const variants = {
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    error: "bg-error/10 text-error",
    info: "bg-info/10 text-info",
    default: "bg-surface text-text-muted",
  };

  const iconVariants = {
    success: "text-success",
    warning: "text-warning",
    error: "text-error",
    info: "text-info",
    default: "text-text-muted",
  };

  const borderVariants = {
    success: "border-success/50",
    warning: "border-warning/50",
    error: "border-error/50",
    info: "border-info/50",
    default: "border-border",
  };

  return (
    <div
      className={`w-max flex items-center gap-1 rounded border px-2 py-1 text-xs font-medium ${variants[variant]} ${borderVariants[variant]}`}>
      {Icon && (
        <Icon
          size={14}
          className={iconVariants[variant]}
        />
      )}
      <span className="uppercase">{label}</span>
    </div>
  );
};

export default StatusBadge;

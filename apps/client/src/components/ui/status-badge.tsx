import { LucideIcon } from "lucide-react";

type StatusBadgeProps = {
  label?: string;
  icon?: LucideIcon;
  variant?: "success" | "warning" | "error" | "info" | "default" | "secondary";
  size?: "sm" | "md" | "lg";
  className?: string;
};

const StatusBadge = ({
  label,
  icon: Icon,
  variant = "default",
  size = "md",
  className = "",
}: StatusBadgeProps) => {
  const variants = {
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    error: "bg-error/10 text-error",
    info: "bg-info/10 text-info",
    default: "bg-surface text-text-muted",
    secondary: "bg-text/10 text-text",
  };

  const sizes = {
    sm: "text-[10px] px-1 py-0.5",
    md: "text-xs px-2 py-1",
    lg: "text-sm px-3 py-1.5",
  };

  const iconVariants = {
    success: "text-success",
    warning: "text-warning",
    error: "text-error",
    info: "text-info",
    default: "text-text-muted",
    secondary: "text-text",
  };

  const borderVariants = {
    success: "border-success/50",
    warning: "border-warning/50",
    error: "border-error/50",
    info: "border-info/50",
    default: "border-border",
    secondary: "border-text/50",
  };

  return (
    <div
      className={`w-max flex items-center gap-1 rounded border ${sizes[size]} font-medium ${variants[variant]} ${borderVariants[variant]} ${className}`}>
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

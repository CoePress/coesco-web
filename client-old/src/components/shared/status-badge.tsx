import { cn } from "@/utils";

type StatusBadgeProps = {
  label: string;
  variant: "success" | "info" | "warning" | "error" | "default";
};

const StatusBadge = ({ label, variant }: StatusBadgeProps) => {
  const baseStyles = "inline-flex px-2 py-0.5 text-xs rounded uppercase border";

  const variantStyles = {
    success: "bg-success/10 border-success/75 text-success fill-success",
    info: "bg-info/10 border-info/75 text-info fill-info",
    warning: "bg-warning/10 border-warning/75 text-warning fill-warning",
    error: "bg-error/10 border-error/75 text-error fill-error",
    default: "bg-default/10 border-default/75 text-default fill-default",
  };

  const variantStyle = variantStyles[variant as keyof typeof variantStyles];

  return <div className={cn(baseStyles, variantStyle)}>{label}</div>;
};

export default StatusBadge;

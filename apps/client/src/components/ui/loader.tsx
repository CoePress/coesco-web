interface LoaderProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

function Loader({ size = "md", className = "" }: LoaderProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div
      role="status"
      className={className}
    >
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-muted border-t-primary`}
      />
    </div>
  );
}

export default Loader;

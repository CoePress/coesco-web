type MetricsProps = {
  children: React.ReactNode;
};

const Metrics = ({ children }: MetricsProps) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
      {children}
    </div>
  );
};

type MetricsCardProps = {
  title: string;
  value: number | string;
  description: string;
  icon: React.ReactNode;
  change?: number;
};

export const MetricsCard = ({ title, value, description, icon, change }: MetricsCardProps) => {
  let color;

  const hasChange = change !== undefined && change !== null;

  if (hasChange && change > 0) {
    color = "text-success bg-success/10";
  } else if (hasChange && change < 0) {
    color = "text-error bg-error/10";
  } else {
    color = "text-text-muted bg-surface";
  }

  return (
    <div className="bg-foreground rounded border p-2">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2 text-primary">
          {icon}
          <p className="text-sm text-text-muted">{title}</p>
        </div>
        {hasChange && (
          <span className={`text-xs ${color} px-2 py-1 rounded`}>
            {change}%
          </span>
        )}
      </div>
      <h3 className="text-xl font-semibold text-text-muted">{value}</h3>
      <p className="text-xs text-text-muted mt-1 hidden md:block">
        {description}
      </p>
    </div>
  );
};

export default Metrics;

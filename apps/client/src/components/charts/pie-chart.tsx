import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface PieChartData {
  name: string;
  value: number;
  color?: string;
}

interface CustomPieChartProps {
  data: PieChartData[];
  innerRadius?: number;
  outerRadius?: number;
  paddingAngle?: number;
  showLegend?: boolean;
  showTooltip?: boolean;
  customTooltip?: (props: any) => React.ReactNode | null;
  customLegend?: (props: any) => React.ReactNode | null;
}

function CustomPieChart({
  data,
  innerRadius = 40,
  outerRadius = 80,
  paddingAngle = 0,
  showLegend = true,
  showTooltip = true,
  customTooltip,
  customLegend,
}: CustomPieChartProps) {
  const defaultTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          className="bg-foreground border border-border rounded p-2 text-xs text-text-muted"
        >
          <p className="font-medium">{data.name}</p>
          <p>
            Value:
            {data.value}
          </p>
        </div>
      );
    }
    return null;
  };

  const defaultLegend = (props: any) => {
    const { payload } = props;
    return (
      <ul className="flex flex-wrap justify-center gap-2 text-xs">
        {payload.map((entry: any, index: number) => (
          <li key={index} className="flex items-center gap-1">
            <span
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-text-muted">{entry.value}</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={paddingAngle}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} stroke={entry.color} />
          ))}
        </Pie>
        {showTooltip && <Tooltip content={customTooltip || defaultTooltip} />}
        {showLegend && <Legend content={customLegend || defaultLegend} />}
      </PieChart>
    </ResponsiveContainer>
  );
}

export default CustomPieChart;

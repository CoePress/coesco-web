import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface LineChartData {
    [key: string]: string | number;
}

interface LineConfig {
    dataKey: string;
    stroke: string;
    name: string;
}

interface CustomLineChartProps {
    data: LineChartData[];
    lines: LineConfig[];
    xAxisKey: string;
    xAxisLabel?: string;
    yAxisLabel?: string;
    height?: number;
    showGrid?: boolean;
    showLegend?: boolean;
    showTooltip?: boolean;
}

const CustomLineChart = ({
    data,
    lines,
    xAxisKey,
    xAxisLabel,
    yAxisLabel,
    height = 400,
    showGrid = true,
    showLegend = true,
    showTooltip = true,
}: CustomLineChartProps) => {
    const customTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-foreground border border-border rounded p-2 text-xs text-text-muted">
                    <p className="font-medium mb-1">{`${xAxisLabel || xAxisKey}: ${label}`}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} style={{ color: entry.stroke }}>
                            {`${entry.name}: ${entry.value}`}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-border" />}
                <XAxis
                    dataKey={xAxisKey}
                    label={{ value: xAxisLabel, position: 'insideBottom', offset: -5 }}
                    className="text-text-muted text-xs"
                />
                <YAxis
                    label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }}
                    className="text-text-muted text-xs"
                />
                {showTooltip && <Tooltip content={customTooltip} />}
                {showLegend && <Legend wrapperStyle={{ paddingTop: '10px' }} />}
                {lines.map((line, index) => (
                    <Line
                        key={index}
                        type="monotone"
                        dataKey={line.dataKey}
                        stroke={line.stroke}
                        name={line.name}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                    />
                ))}
            </LineChart>
        </ResponsiveContainer>
    );
};

export default CustomLineChart;

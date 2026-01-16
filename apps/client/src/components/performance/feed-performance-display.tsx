import { useMemo, useState } from 'react';
import CustomLineChart from '@/components/charts/line-chart';
import Table from '@/components/ui/table';
import { Button } from '@/components';

interface FeedTableRow {
    length: number;
    feedAngle1: number;
    feedAngle2: number;
    spmAt180: number;
    fpm180: number;
    indexTime1: number;
    spmAt240: number;
    fpm240: number;
    indexTime2: number;
}

interface FeedPerformanceDisplayProps {
    tableValues: FeedTableRow[];
}

const FeedPerformanceDisplay = ({ tableValues }: FeedPerformanceDisplayProps) => {
    const [showIndexTime1, setShowIndexTime1] = useState(false);
    const [showIndexTime2, setShowIndexTime2] = useState(false);

    const allColumns = [
        { key: 'length', header: 'Length', sortable: false, visible: true },
        { key: 'spmAt180', header: 'SPM @ Feed Angle 1', sortable: false, visible: true },
        { key: 'fpm180', header: 'FPM', sortable: false, visible: true },
        { key: 'indexTime1', header: 'Index Time 1', sortable: false, visible: showIndexTime1 },
        { key: 'spmAt240', header: 'SPM @ Feed Angle 2', sortable: false, visible: true },
        { key: 'fpm240', header: 'FPM', sortable: false, visible: true },
        { key: 'indexTime2', header: 'Index Time 2', sortable: false, visible: showIndexTime2 },
    ];

    const columns = allColumns.filter(col => col.visible);

    const chartData = useMemo(() => {
        return tableValues.map(row => ({
            length: row.length,
            'Stroke/min (FA 1)': row.spmAt180,
            'Stroke/min (FA 2)': row.spmAt240,
        }));
    }, [tableValues]);

    const lineConfigs = [
        { dataKey: 'Stroke/min (FA 1)', stroke: '#8B4513', name: 'Stroke/min (FA 1)' },
        { dataKey: 'Stroke/min (FA 2)', stroke: '#FFD700', name: 'Stroke/min (FA 2)' },
    ];

    if (!tableValues || tableValues.length === 0) {
        return (
            <div className="p-4 text-center text-text-muted bg-surface border border-border rounded">
                No performance data available. Performance calculations will populate this table.
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 w-full">
            {/* Performance Table */}
            <div className="bg-surface border border-border rounded overflow-hidden">
                <div className="p-2 border-b border-border flex items-center justify-between">
                    <h3 className="font-medium text-sm">Performance Table</h3>
                    <div className="flex gap-2">
                        <Button
                            variant={showIndexTime1 ? "primary" : "secondary-outline"}
                            size="sm"
                            onClick={() => setShowIndexTime1(!showIndexTime1)}
                        >
                            {showIndexTime1 ? 'Hide' : 'Show'} Index Time 1
                        </Button>
                        <Button
                            variant={showIndexTime2 ? "primary" : "secondary-outline"}
                            size="sm"
                            onClick={() => setShowIndexTime2(!showIndexTime2)}
                        >
                            {showIndexTime2 ? 'Hide' : 'Show'} Index Time 2
                        </Button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <Table
                        columns={columns}
                        data={tableValues}
                        total={tableValues.length}
                        idField="length"
                        pagination={false}
                        className="text-xs"
                    />
                </div>
            </div>

            {/* Performance Chart */}
            <div className="bg-surface border border-border rounded overflow-hidden p-4">
                <div className="pb-2">
                    <h3 className="font-medium text-sm mb-1">Feeder - Sigma V</h3>
                    <p className="text-xs text-text-muted">Performance Graph</p>
                </div>
                <CustomLineChart
                    data={chartData}
                    lines={lineConfigs}
                    xAxisKey="length"
                    xAxisLabel="Length"
                    yAxisLabel="Stroke/min"
                    height={300}
                    showGrid={true}
                    showLegend={true}
                    showTooltip={true}
                />
            </div>
        </div>
    );
};

export default FeedPerformanceDisplay;

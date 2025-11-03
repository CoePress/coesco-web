import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from "@/utils";
import { STAGES } from "./constants";

interface ProjectionsViewProps {
  journeys: any[];
  customersById: Map<string, any>;
}

export const ProjectionsView = ({ journeys }: ProjectionsViewProps) => {
  const monthlyProjections = useMemo(() => {
    const monthMap = new Map<string, { journeys: any[], weightedValue: number, totalValue: number }>();

    journeys.forEach(journey => {
      if (!journey.expectedDecisionDate) return;
      const expectedDecisionDate = new Date(journey.expectedDecisionDate);
      if (isNaN(expectedDecisionDate.getTime())) return;
      const monthKey = `${expectedDecisionDate.getFullYear()}-${String(expectedDecisionDate.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = expectedDecisionDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      
      const stage = STAGES.find(s => s.id === journey.stage);
      const weight = stage?.weight ?? 0;
      const value = Number(journey.value ?? 0);
      const weightedValue = value * weight;
      
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, {
          journeys: [],
          weightedValue: 0,
          totalValue: 0
        });
      }
      
      const monthData = monthMap.get(monthKey)!;
      monthData.journeys.push({ ...journey, monthLabel });
      monthData.weightedValue += weightedValue;
      monthData.totalValue += value;
    });
    
    // Sort by month and convert to array
    return Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monthKey, data]) => ({
        monthKey,
        monthLabel: data.journeys[0]?.monthLabel || monthKey,
        ...data,
        avgValuePerDeal: data.journeys.length > 0 ? data.totalValue / data.journeys.length : 0,
        avgDealAge: data.journeys.length > 0 ? (() => {
          const journeysWithDates = data.journeys.filter(j => {
            if (!j.CreateDT) return false;
            const date = new Date(j.CreateDT);
            return !isNaN(date.getTime());
          });
          if (journeysWithDates.length === 0) return 0;
          const totalAge = journeysWithDates.reduce((sum, j) => {
            const createdDate = new Date(j.CreateDT);
            const daysDiff = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
            return sum + daysDiff;
          }, 0);
          return totalAge / journeysWithDates.length;
        })() : 0
      }));
  }, [journeys]);

  const totalWeightedProjection = monthlyProjections.reduce((sum, month) => sum + month.weightedValue, 0);
  const totalDeals = journeys.length;
  const avgValuePerDeal = totalDeals > 0 ? journeys.reduce((sum, j) => sum + Number(j.value ?? 0), 0) / totalDeals : 0;
  const avgDealAge = (() => {
    const journeysWithDates = journeys.filter(j => {
      if (!j.CreateDT) return false;
      const date = new Date(j.CreateDT);
      return !isNaN(date.getTime());
    });
    if (journeysWithDates.length === 0) return 0;
    const totalAge = journeysWithDates.reduce((sum, j) => {
      const createdDate = new Date(j.CreateDT);
      const daysDiff = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      return sum + daysDiff;
    }, 0);
    return totalAge / journeysWithDates.length;
  })();

  return (
    <div className="flex-1 min-h-0 w-full overflow-hidden flex flex-col">
      {/* Note Banner */}
      <div className="border-b px-6 py-3 bg-blue-50 dark:bg-blue-900/20">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <span className="font-semibold">Note:</span> Projections are being incorporated into the Dashboard
        </p>
      </div>

      {/* Summary Cards */}
      <div className="border-b px-6 py-4 bg-foreground">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-background rounded border border-border p-4">
            <div className="text-sm text-neutral-400 mb-1">Total Weighted Projection</div>
            <div className="text-2xl font-semibold text-primary">{formatCurrency(totalWeightedProjection)}</div>
          </div>
          <div className="bg-background rounded border border-border p-4">
            <div className="text-sm text-neutral-400 mb-1">Average Deal Value</div>
            <div className="text-2xl font-semibold text-neutral-400">{formatCurrency(avgValuePerDeal)}</div>
          </div>
          <div className="bg-background rounded border border-border p-4">
            <div className="text-sm text-neutral-400 mb-1">Average Deal Age</div>
            <div className="text-2xl font-semibold text-neutral-400">{Math.round(avgDealAge)} days</div>
          </div>
          <div className="bg-background rounded border border-border p-4">
            <div className="text-sm text-neutral-400 mb-1">Active Months</div>
            <div className="text-2xl font-semibold text-neutral-400">{monthlyProjections.length}</div>
          </div>
        </div>
      </div>

      {/* Scrollable Content Container */}
      <div className="flex-1 min-h-0 overflow-auto bg-background">
        {/* Revenue Chart */}
        <div className="p-6">
          <div className="bg-foreground rounded border border-border p-4 mb-6">
            <h3 className="text-lg font-semibold text-neutral-400 mb-4">Revenue by Month</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyProjections.map(month => ({
                  month: month.monthLabel,
                  totalValue: month.totalValue,
                  weightedValue: month.weightedValue,
                  monthKey: month.monthKey
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#9CA3AF"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: number, _name: string, props: any) => [
                      formatCurrency(value), 
                      props.dataKey === 'totalValue' ? 'Total Value' : 'Weighted Value'
                    ]}
                    labelStyle={{ color: '#9CA3AF' }}
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '6px',
                      color: '#F9FAFB'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ color: '#9CA3AF' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="totalValue" 
                    stroke="#9CA3AF" 
                    strokeWidth={2}
                    name="Total Value"
                    dot={{ fill: '#9CA3AF', strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="weightedValue" 
                    stroke="#EAB308" 
                    strokeWidth={2}
                    name="Weighted Value"
                    dot={{ fill: '#EAB308', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Monthly Projections Table */}
        <div className="px-6 pb-6">
        <div className="bg-foreground rounded border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-background">
            <h3 className="text-lg font-semibold text-neutral-400">Monthly Projections</h3>
          </div>
          <div>
            <table className="w-full">
              <thead className="bg-background">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-neutral-400">Month</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-neutral-400">Journeys</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-neutral-400">Total Value</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-neutral-400">Weighted Value</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-neutral-400">Avg Value/Deal</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-neutral-400">Avg Age (days)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {monthlyProjections.map((month) => (
                  <tr key={month.monthKey} className="hover:bg-background transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-neutral-400">{month.monthLabel}</div>
                    </td>
                    <td className="px-4 py-3 text-right text-neutral-400">
                      {month.journeys.length}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-neutral-400">
                      {formatCurrency(month.totalValue)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-primary">
                      {formatCurrency(month.weightedValue)}
                    </td>
                    <td className="px-4 py-3 text-right text-neutral-400">
                      {formatCurrency(month.avgValuePerDeal)}
                    </td>
                    <td className="px-4 py-3 text-right text-neutral-400">
                      {Math.round(month.avgDealAge)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};
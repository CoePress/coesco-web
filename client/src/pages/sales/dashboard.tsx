import {
  TrendingUp,
  FileText,
  Users,
  DollarSign,
  MoreHorizontal,
  Filter,
  List,
  RefreshCcw,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import { Button, PageHeader } from "@/components";
import { formatCurrency, openPopup } from "@/utils";

const mockData = [
  { month: "Jan", sales: 65000, quotes: 85000, conversion: 76, deals: 42 },
  { month: "Feb", sales: 72000, quotes: 92000, conversion: 78, deals: 45 },
  { month: "Mar", sales: 89000, quotes: 110000, conversion: 81, deals: 52 },
  { month: "Apr", sales: 95000, quotes: 123000, conversion: 77, deals: 48 },
  { month: "May", sales: 78000, quotes: 105000, conversion: 74, deals: 39 },
  { month: "Jun", sales: 92000, quotes: 118000, conversion: 78, deals: 47 },
];

const topDeals = [
  { client: "TechCorp", value: 125000, status: "Negotiating", probability: 85 },
  { client: "GlobalSys", value: 95000, status: "Proposal", probability: 65 },
  { client: "InnovateX", value: 78000, status: "Closing", probability: 95 },
  { client: "DataFlow", value: 68000, status: "Discovery", probability: 45 },
];

const mockTasks = [
  { id: 1, title: "Follow up with TechCorp", due: "Today", priority: "high" },
  {
    id: 2,
    title: "Send proposal to GlobalSys",
    due: "Tomorrow",
    priority: "medium",
  },
  {
    id: 3,
    title: "Schedule demo with InnovateX",
    due: "Next Week",
    priority: "low",
  },
  {
    id: 4,
    title: "Contract review for DataFlow",
    due: "Today",
    priority: "high",
  },
];

type KPICardProps = {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  change?: number;
};

const KPICard = ({ title, value, description, icon, change }: KPICardProps) => {
  const color = change && change > 0 ? "success" : "error";

  return (
    <div className="bg-foreground rounded border p-2">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2 text-primary">
          {icon}
          <p className="text-sm text-text-muted">{title}</p>
        </div>
        {change && (
          <span
            className={`text-xs text-${color} bg-${color}/10 px-2 py-1 rounded`}>
            {change > 0 ? "+" : ""}
            {change}%
          </span>
        )}
      </div>
      <h3 className="text-xl font-semibold text-text-muted">{value}</h3>
      <p className="text-xs text-text-muted mt-1">{description}</p>
    </div>
  );
};

const Dashboard = () => {
  const pageTitle = "Sales Dashboard";
  const pageDescription = "Track your sales performance and metrics";

  const kpis = [
    {
      title: "Monthly Revenue",
      value: formatCurrency(92000, false),
      description: "Total revenue this month",
      icon: <DollarSign size={16} />,
      change: 12.5,
    },
    {
      title: "Total Quotes",
      value: "118",
      description: "Active quotes this month",
      icon: <FileText size={16} />,
      change: 8.2,
    },
    {
      title: "Conversion Rate",
      value: "78%",
      description: "Quote to deal conversion",
      icon: <TrendingUp size={16} />,
      change: -2.1,
    },
    {
      title: "Active Deals",
      value: "47",
      description: "Deals in pipeline",
      icon: <Users size={16} />,
      change: 5.3,
    },
  ];

  const stateDistribution = [
    { state: "Negotiating", total: 8, percentage: 35 },
    { state: "Proposal", total: 12, percentage: 25 },
    { state: "Discovery", total: 15, percentage: 20 },
    { state: "Closing", total: 5, percentage: 20 },
  ];

  const wonLostData = [
    { name: "Won", value: 65 },
    { name: "Lost", value: 35 },
  ];

  const COLORS = ["var(--success)", "var(--error)"];

  return (
    <div className="w-full flex-1 flex flex-col">
      <PageHeader
        title={pageTitle}
        description={pageDescription}
        actions={
          <>
            <Button
              variant="secondary-outline"
              size="sm">
              <Filter size={16} />
              Filter
            </Button>
            <Button
              variant="primary"
              size="sm">
              <RefreshCcw size={16} />
              Refresh
            </Button>
          </>
        }
      />

      <div className="p-2 gap-2 flex flex-col flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          {kpis.map((metric) => (
            <KPICard
              key={metric.title}
              {...metric}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 flex-1">
          <div className="md:col-span-2 lg:col-span-3 w-full h-full bg-foreground rounded border flex flex-col min-h-[250px]">
            <div className="p-2 border-b flex items-center justify-between">
              <h3 className="text-sm text-text-muted">Performance Overview</h3>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost">
                  1W
                </Button>
                <Button
                  size="sm"
                  variant="primary">
                  1M
                </Button>
                <Button
                  size="sm"
                  variant="ghost">
                  3M
                </Button>
              </div>
            </div>

            <div className="p-2 flex-1">
              <ResponsiveContainer
                width="100%"
                height="100%">
                <BarChart
                  data={mockData}
                  margin={{ left: 0, right: 5, top: 5, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                  />
                  <XAxis
                    dataKey="month"
                    stroke="var(--text-muted)"
                    tick={{ fontSize: 12 }}
                    tickMargin={5}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="var(--text-muted)"
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    width={35}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--foreground)",
                      color: "var(--text-muted)",
                      border: "1px solid var(--border)",
                      borderRadius: "4px",
                    }}
                  />
                  <Bar
                    dataKey="sales"
                    fill="var(--primary)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="quotes"
                    fill="var(--secondary)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="w-full bg-foreground rounded border">
            <div className="p-2 border-b">
              <h3 className="text-sm text-text-muted">Won vs Lost</h3>
            </div>
            <div className="p-2 flex flex-col items-center justify-center h-[250px]">
              <ResponsiveContainer
                width="100%"
                height="100%">
                <PieChart>
                  <Pie
                    data={wonLostData}
                    cx="50%"
                    cy="50%"
                    outerRadius="80%"
                    stroke="var(--border)"
                    strokeWidth={1}
                    isAnimationActive={true}
                    animationDuration={1000}
                    dataKey="value">
                    {wonLostData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const entry = payload[0];
                      return (
                        <div
                          style={{
                            background: "var(--foreground)",
                            color: "var(--text-muted)",
                            border: "1px solid var(--border)",
                            borderRadius: 4,
                            padding: 8,
                          }}>
                          <div
                            style={{
                              fontWeight: 500,
                              color:
                                COLORS[
                                  payload[0].payload.name === "Won" ? 0 : 1
                                ],
                            }}>
                            {entry.payload.name}
                          </div>
                          <div className="mt-1">
                            <p>{entry.value}%</p>
                          </div>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-success"></div>
                  <span className="text-xs text-text-muted">Won (67%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-error"></div>
                  <span className="text-xs text-text-muted">Lost (33%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          <div className="md:col-span-2 w-full bg-foreground rounded border">
            <div className="p-2 border-b">
              <h3 className="text-sm text-text-muted">Active Tasks</h3>
            </div>
            <div className="p-2">
              <div className="space-y-2">
                {mockTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 bg-surface rounded hover:bg-surface/80 border border-border">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded ${
                          task.priority === "high"
                            ? "bg-error"
                            : task.priority === "medium"
                            ? "bg-warning"
                            : "bg-success"
                        }`}
                      />
                      <span className="text-sm font-medium text-text-muted">
                        {task.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-text-muted">
                        {task.due}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm">
                        <MoreHorizontal size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="w-full bg-foreground rounded border">
            <div className="p-2 border-b flex justify-between items-center">
              <h3 className="text-sm text-text-muted">Top Deals</h3>
              <Button
                onClick={() =>
                  openPopup("sales", [
                    "entity=deals",
                    "sort=value",
                    "order=desc",
                  ])
                }
                variant="secondary-outline"
                size="sm">
                <List size={16} />
                View All
              </Button>
            </div>
            <div className="p-2">
              <div className="space-y-2">
                {topDeals.map((deal) => (
                  <div
                    key={deal.client}
                    className="flex items-center justify-between p-3 bg-surface rounded hover:bg-surface/80 border border-border">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text-muted">
                        {deal.client}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-text-muted">
                          {deal.status}
                        </span>
                        <div className="h-1.5 w-24 bg-surface rounded overflow-hidden">
                          <div
                            className="h-full bg-primary rounded"
                            style={{ width: `${deal.probability}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-text-muted">
                      {formatCurrency(deal.value, false)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="w-full h-full bg-foreground rounded border flex flex-col min-h-[250px]">
            <div className="p-2 border-b">
              <h3 className="text-sm text-text-muted">Deal Distribution</h3>
            </div>
            <div className="p-4 flex flex-col gap-4">
              {stateDistribution.map((entry, idx) => (
                <div
                  key={entry.state}
                  className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-muted">
                      {entry.state}
                    </span>
                    <span className="text-xs text-text-muted">
                      {entry.total} deals ({entry.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-surface rounded overflow-hidden">
                    <div
                      className="h-full rounded bg-primary"
                      style={{
                        width: `${entry.percentage}%`,
                        opacity: 0.2 + idx * 0.2,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

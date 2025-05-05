import {
  TrendingUp,
  FileText,
  Users,
  DollarSign,
  Plus,
  MoreHorizontal,
  Filter,
  List,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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

const Dashboard = () => {
  const pageTitle = "Sales Dashboard";
  const pageDescription = "Track your sales performance and metrics";

  return (
    <div className="w-full flex-1">
      <PageHeader
        title={pageTitle}
        description={pageDescription}
        actions={
          <Button variant="secondary-outline">
            <Filter size={16} />
            Filter
          </Button>
        }
      />

      <div className="p-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mb-2">
          <div className="bg-foreground rounded border p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <DollarSign
                  size={20}
                  className="text-primary"
                />
                <p className="text-sm text-text-muted">Monthly Revenue</p>
              </div>
              <span className="text-xs text-success bg-success/10 px-2 py-1 rounded">
                +12.5%
              </span>
            </div>
            <h3 className="text-2xl font-semibold text-text-muted">
              {formatCurrency(92000, false)}
            </h3>
            <div className="h-[40px] mt-2">
              <ResponsiveContainer
                width="100%"
                height="100%">
                <LineChart data={mockData}>
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-foreground rounded border p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <FileText
                  size={20}
                  className="text-primary"
                />
                <p className="text-sm text-text-muted">Total Quotes</p>
              </div>
              <span className="text-xs text-success bg-success/10 px-2 py-1 rounded">
                +8.2%
              </span>
            </div>
            <h3 className="text-2xl font-semibold text-text-muted">118</h3>
            <div className="h-[40px] mt-2">
              <ResponsiveContainer
                width="100%"
                height="100%">
                <LineChart data={mockData}>
                  <Line
                    type="monotone"
                    dataKey="quotes"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-foreground rounded border p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp
                  size={20}
                  className="text-primary"
                />
                <p className="text-sm text-text-muted">Conversion Rate</p>
              </div>
              <span className="text-xs text-warning bg-warning/10 px-2 py-1 rounded">
                -2.1%
              </span>
            </div>
            <h3 className="text-2xl font-semibold text-text-muted">78%</h3>
            <div className="h-[40px] mt-2">
              <ResponsiveContainer
                width="100%"
                height="100%">
                <LineChart data={mockData}>
                  <Line
                    type="monotone"
                    dataKey="conversion"
                    stroke="#e8a80c"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-foreground rounded border p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <Users
                  size={20}
                  className="text-primary"
                />
                <p className="text-sm text-text-muted">Active Deals</p>
              </div>
              <span className="text-xs text-success bg-success/10 px-2 py-1 rounded">
                +5.3%
              </span>
            </div>
            <h3 className="text-2xl font-semibold text-text-muted">47</h3>
            <div className="h-[40px] mt-2">
              <ResponsiveContainer
                width="100%"
                height="100%">
                <LineChart data={mockData}>
                  <Line
                    type="monotone"
                    dataKey="deals"
                    stroke="#e8a80c"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-12 lg:col-span-8">
            <div className="bg-foreground rounded border">
              <div className="p-4 border-b">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-text-muted">
                    Performance Overview
                  </h3>
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
              </div>
              <div className="p-4">
                <div className="h-[300px]">
                  <ResponsiveContainer
                    width="100%"
                    height="100%">
                    <BarChart data={mockData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                      />
                      <XAxis
                        dataKey="month"
                        stroke="var(--text-muted)"
                      />
                      <YAxis stroke="var(--text-muted)" />
                      <Tooltip />
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
            </div>

            <div className="bg-foreground rounded border mt-2">
              <div className="p-4 border-b">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-text-muted">
                    Active Tasks
                  </h3>
                  <Button variant="secondary-outline">
                    <Plus size={16} />
                    New Task
                  </Button>
                </div>
              </div>
              <div className="p-4">
                <div className="space-y-3">
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
                        <Button variant="ghost">
                          <MoreHorizontal size={16} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 space-y-2">
            <div className="bg-foreground rounded border">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-text-muted">
                  Conversion Funnel
                </h3>
              </div>
              <div className="p-4">
                <div className="space-y-4">
                  {[
                    { stage: "Leads", count: 245, percent: 100 },
                    { stage: "Qualified", count: 189, percent: 77 },
                    { stage: "Proposal", count: 121, percent: 49 },
                    { stage: "Negotiation", count: 85, percent: 35 },
                    { stage: "Closed", count: 42, percent: 17 },
                  ].map((stage) => (
                    <div
                      key={stage.stage}
                      className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-text-muted">{stage.stage}</span>
                        <span className="font-medium text-text-muted">
                          {stage.count}
                        </span>
                      </div>
                      <div className="h-2 bg-border rounded overflow-hidden">
                        <div
                          className="h-full bg-primary rounded transition-all duration-300"
                          style={{ width: `${stage.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-foreground rounded border">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="font-semibold text-text-muted">Active Deals</h3>

                <Button
                  onClick={() =>
                    openPopup("sales", [
                      "entity=deals",
                      "sort=value",
                      "order=desc",
                    ])
                  }
                  variant="secondary-outline">
                  <List size={16} />
                  View All
                </Button>
              </div>
              <div className="p-4">
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
                      <span className="text-sm font-semibold text-neutral-400">
                        {formatCurrency(deal.value, false)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

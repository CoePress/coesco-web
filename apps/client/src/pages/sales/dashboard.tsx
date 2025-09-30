import {
  TrendingUp,
  FileText,
  Users,
  DollarSign,
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
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components";
import { formatCurrency } from "@/utils";
import PageHeader from "@/components/layout/page-header";
import Metrics, { MetricsCard } from "@/components/ui/metrics";
import { useApi } from "@/hooks/use-api";
import { STAGES } from "./journeys/constants";

type StageId = (typeof STAGES)[number]["id"];

const mapLegacyStageToId = (stage: any): StageId => {
  const s = String(stage ?? "").toLowerCase();
  if (!s) return 1;
  if (s.includes("qualify") || s.includes("pain") || s.includes("discover")) return 2;
  if (s.includes("present") || s.includes("demo") || s.includes("proposal") || s.includes("quote")) return 3;
  if (s.includes("negot")) return 4;
  if (s.includes("po") || s.includes("won") || s.includes("closedwon") || s.includes("closed won") || s.includes("order")) return 5;
  if (s.includes("lost") || s.includes("closedlost") || s.includes("closed lost") || s.includes("declin")) return 6;
  if (s.includes("lead") || s.includes("open") || s.includes("new")) return 1;
  return 1;
};

const SalesDashboard = () => {
  const [journeys, setJourneys] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const api = useApi();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [journeysResponse, companiesResponse] = await Promise.all([
          api.get("/legacy/std/Journey", {
            limit: 1000,
            sort: "Journey_Start_Date",
            order: "desc"
          }),
          api.get("/legacy/base/Company", {
            limit: 500,
            sort: "Company_ID",
            order: "desc"
          })
        ]);

        console.log("Journeys response:", journeysResponse);
        console.log("Companies response:", companiesResponse);
        
        if (journeysResponse) {
          const journeyData = Array.isArray(journeysResponse) ? journeysResponse : (journeysResponse.data || []);
          console.log("Setting journeys:", journeyData);
          setJourneys(journeyData);
        }
        
        if (companiesResponse) {
          const companyData = Array.isArray(companiesResponse) ? companiesResponse : (companiesResponse.data || []);
          console.log("Setting companies:", companyData);
          setCompanies(companyData);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const companiesById = new Map(companies.map(c => [c.Company_ID, c]));

  // Debug logging
  console.log("Total journeys:", journeys.length);
  console.log("Total companies:", companies.length);
  console.log("Sample journey:", journeys[0]);
  
  // Calculate real metrics from journey data
  const activeJourneys = journeys.filter(j => 
    j.Journey_Status === 'open' || !j.Journey_Status
  );
  
  console.log("Active journeys:", activeJourneys.length);
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const thisMonthJourneys = activeJourneys.filter(j => {
    if (!j.Journey_Start_Date) return false;
    const date = new Date(j.Journey_Start_Date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const wonJourneys = journeys.filter(j => j.Journey_Status === 'won');
  const lostJourneys = journeys.filter(j => j.Journey_Status === 'lost');
  const closedJourneys = [...wonJourneys, ...lostJourneys];
  
  const monthlyRevenue = thisMonthJourneys.reduce((sum, j) => sum + (j.Journey_Value || 0), 0);
  const totalQuotes = activeJourneys.length;
  const totalJourneysWithValue = activeJourneys.filter(j => (j.Journey_Value || 0) > 0).length;
  const conversionRate = closedJourneys.length > 0 ? (wonJourneys.length / closedJourneys.length) * 100 : 0;

  // Calculate monthly performance data
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
    
    const monthJourneys = journeys.filter(j => {
      if (!j.Journey_Start_Date) return false;
      const jDate = new Date(j.Journey_Start_Date);
      return jDate.getMonth() === date.getMonth() && jDate.getFullYear() === date.getFullYear();
    });
    
    const monthSales = monthJourneys
      .filter(j => j.Journey_Status === 'won')
      .reduce((sum, j) => sum + (j.Journey_Value || 0), 0);
    
    const monthQuotes = monthJourneys.length;
    const monthJourneysWithValue = monthJourneys.filter(j => (j.Journey_Value || 0) > 0).length;
    const monthConversion = monthJourneys.length > 0 
      ? (monthJourneys.filter(j => j.Journey_Status === 'won').length / monthJourneys.length) * 100 
      : 0;

    monthlyData.push({
      month: monthName,
      sales: monthSales,
      quotes: monthQuotes * 1000, // Multiply for visualization scale
      conversion: Math.round(monthConversion),
      journeys: monthJourneysWithValue
    });
  }

  // Get top journeys
  const topJourneys = activeJourneys
    .filter(j => (j.Journey_Value || 0) > 0)
    .sort((a, b) => (b.Journey_Value || 0) - (a.Journey_Value || 0))
    .slice(0, 4)
    .map(j => {
      const company = companiesById.get(j.Company_ID);
      const journeyStageId = mapLegacyStageToId(j.Journey_Stage);
      const stageInfo = STAGES.find(s => s.id === journeyStageId) || STAGES[0];
      return {
        id: j.ID,
        client: company?.CustDlrName || j.Target_Account || `Company ${j.Company_ID}`,
        value: j.Journey_Value || 0,
        status: stageInfo.label,
        probability: Math.round((stageInfo.weight * 100))
      };
    });


  // Calculate stage distribution including closed journeys
  const allStageDistribution = STAGES.map(stage => {
    const stageJourneys = journeys.filter(j => {
      // Map the journey stage to numeric ID for comparison
      const journeyStageId = mapLegacyStageToId(j.Journey_Stage);
      return journeyStageId === stage.id;
    });
    const total = stageJourneys.length;
    const percentage = journeys.length > 0 ? Math.round((total / journeys.length) * 100) : 0;
    
    console.log(`Stage ${stage.label} (${stage.id}): ${total} journeys, ${percentage}%`);
    
    return {
      state: stage.label,
      total,
      percentage
    };
  });
  
  // Only show stages that have journeys or are the main pipeline stages
  const stageDistribution = allStageDistribution.filter(stage => 
    stage.total > 0 || ["Lead", "Qualified", "Presentations", "Negotiation"].includes(stage.state)
  );
  
  console.log("Stage distribution:", stageDistribution);

  // Won vs Lost vs Open data
  const wonJourneysCount = wonJourneys.length;
  const lostJourneysCount = lostJourneys.length;
  const openJourneysCount = activeJourneys.length;
  const totalJourneysCount = journeys.length;
  
  const wonPercentage = totalJourneysCount > 0 ? Math.round((wonJourneysCount / totalJourneysCount) * 100) : 0;
  const lostPercentage = totalJourneysCount > 0 ? Math.round((lostJourneysCount / totalJourneysCount) * 100) : 0;
  const openPercentage = totalJourneysCount > 0 ? Math.round((openJourneysCount / totalJourneysCount) * 100) : 0;
  
  const wonLostData = [
    { name: "Won", value: wonPercentage },
    { name: "Lost", value: lostPercentage },
    { name: "Open", value: openPercentage },
  ];
  const kpis = [
    {
      title: "Monthly Revenue",
      value: formatCurrency(monthlyRevenue, false),
      description: "Total revenue this month",
      icon: <DollarSign size={16} />,
      change: 0, // Would need historical data to calculate change
    },
    {
      title: "Total Quotes",
      value: totalQuotes.toString(),
      description: "Active quotes in pipeline",
      icon: <FileText size={16} />,
      change: 0, // Would need historical data to calculate change
    },
    {
      title: "Conversion Rate",
      value: `${Math.round(conversionRate)}%`,
      description: "Journey win rate",
      icon: <TrendingUp size={16} />,
      change: 0, // Would need historical data to calculate change
    },
    {
      title: "Active Journeys",
      value: totalJourneysWithValue.toString(),
      description: "Journeys with values in pipeline",
      icon: <Users size={16} />,
      change: 0, // Would need historical data to calculate change
    },
  ];

  const COLORS = ["var(--success)", "var(--error)", "var(--primary)"];

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const [journeysResponse, companiesResponse] = await Promise.all([
        api.get("/legacy/std/Journey", {
          limit: 1000,
          sort: "Journey_Start_Date",
          order: "desc"
        }),
        api.get("/legacy/base/Company", {
          limit: 500,
          sort: "Company_ID", 
          order: "desc"
        })
      ]);

      if (journeysResponse) {
        const journeyData = Array.isArray(journeysResponse) ? journeysResponse : (journeysResponse.data || []);
        setJourneys(journeyData);
      }
      
      if (companiesResponse) {
        const companyData = Array.isArray(companiesResponse) ? companiesResponse : (companiesResponse.data || []);
        setCompanies(companyData);
      }
    } catch (error) {
      console.error("Error refreshing dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const Actions = () => {
    return (
      <div className="flex gap-2">
        <Button onClick={refreshData} disabled={isLoading}>
          <RefreshCcw size={20} className={isLoading ? "animate-spin" : ""} /> 
          {isLoading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>
    );
  };

  if (isLoading && journeys.length === 0) {
    return (
      <div className="w-full flex-1 flex flex-col">
        <PageHeader
          title="Sales Dashboard"
          description="Track your sales performance and metrics"
          actions={<Actions />}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <RefreshCcw className="animate-spin mx-auto mb-4" size={32} />
            <p className="text-text-muted">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col">
      <PageHeader
        title="Sales Dashboard"
        description="Track your sales performance and metrics"
        actions={<Actions />}
      />

      <div className="p-2 gap-2 flex flex-col flex-1">
        <Metrics>
          {kpis.map((metric, index) => (
            <MetricsCard key={metric.title || index} {...metric} />
          ))}
        </Metrics>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 flex-1">
          <div className="md:col-span-2 lg:col-span-3 w-full h-full bg-foreground rounded border flex flex-col min-h-[250px]">
            <div className="p-2 border-b">
              <h3 className="text-sm text-text-muted">Performance Overview</h3>
            </div>

            <div className="p-2 flex-1">
              <ResponsiveContainer
                width="100%"
                height="100%">
                <BarChart
                  data={monthlyData}
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
                    width={60}
                    tickFormatter={(value) => {
                      if (value >= 1000000) {
                        return `$${(value / 1000000).toFixed(1)}M`;
                      } else if (value >= 1000) {
                        return `$${(value / 1000).toFixed(0)}K`;
                      }
                      return `$${value}`;
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--foreground)",
                      color: "var(--text-muted)",
                      border: "1px solid var(--border)",
                      borderRadius: "4px",
                    }}
                    formatter={(value, name) => {
                      const numValue = Number(value);
                      if (name === 'sales') {
                        return [formatCurrency(numValue), 'Sales'];
                      }
                      if (name === 'quotes') {
                        return [Math.round(numValue / 1000), 'Quotes'];
                      }
                      return [value, name];
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
              <h3 className="text-sm text-text-muted">Journey Status</h3>
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
              <div className="flex gap-2 mt-2 flex-wrap justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-success"></div>
                  <span className="text-xs text-text-muted">Won ({wonPercentage}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-error"></div>
                  <span className="text-xs text-text-muted">Lost ({lostPercentage}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <span className="text-xs text-text-muted">Open ({openPercentage}%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          <div className="md:col-span-2 w-full bg-foreground rounded border">
            <div className="p-2 border-b">
              <h3 className="text-sm text-text-muted">Recent Activity</h3>
            </div>
            <div className="p-2">
              <div className="space-y-3">
                {(() => {
                  const recentJourneys = journeys
                    .filter(j => j.CreateDT)
                    .sort((a, b) => new Date(b.CreateDT).getTime() - new Date(a.CreateDT).getTime())
                    .slice(0, 4);
                  
                  return recentJourneys.map((journey) => {
                    const company = companiesById.get(journey.Company_ID);
                    const companyName = company?.CustDlrName || journey.Target_Account || `Company ${journey.Company_ID}`;
                    const journeyStageId = mapLegacyStageToId(journey.Journey_Stage);
                    const stageInfo = STAGES.find(s => s.id === journeyStageId) || STAGES[0];
                    
                    return (
                      <Link
                        key={journey.ID}
                        to={`/sales/pipeline/${journey.ID}`}
                        className="flex items-center justify-between p-3 bg-surface rounded hover:bg-surface/80 border border-border transition-colors">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-2 h-2 rounded ${
                              journey.Journey_Status === "won"
                                ? "bg-success"
                                : journey.Journey_Status === "lost"
                                ? "bg-error"
                                : "bg-primary"
                            }`}
                          />
                          <div className="flex-1">
                            <span className="text-sm font-medium text-text-muted hover:text-primary transition-colors">
                              {companyName}
                            </span>
                            <div className="text-xs text-text-muted">
                              {stageInfo.label} • {journey.Journey_Value ? formatCurrency(journey.Journey_Value, false) : 'No value'}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-text-muted">
                          {(() => {
                            try {
                              const date = new Date(journey.CreateDT);
                              const now = new Date();
                              const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));
                              
                              if (diffDays === 0) return "Today";
                              if (diffDays === 1) return "Yesterday";
                              if (diffDays < 7) return `${diffDays} days ago`;
                              return date.toLocaleDateString();
                            } catch {
                              return "Recently";
                            }
                          })()}
                        </div>
                      </Link>
                    );
                  });
                })()}
              </div>
            </div>
          </div>

          <div className="w-full bg-foreground rounded border">
            <div className="p-2 border-b flex justify-between items-center">
              <h3 className="text-sm text-text-muted">Top Journeys</h3>
              <Button
                variant="secondary-outline"
                size="sm">
                <List size={16} />
                View All
              </Button>
            </div>
            <div className="p-2">
              <div className="space-y-2">
                {topJourneys.map((journey) => (
                  <Link
                    key={journey.client}
                    to={`/sales/pipeline/${journey.id}`}
                    className="flex items-center justify-between p-3 bg-surface rounded hover:bg-surface/80 border border-border transition-colors">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text-muted hover:text-primary transition-colors">
                        {journey.client}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-text-muted">
                          {journey.status}
                        </span>
                        <div className="h-1.5 w-24 bg-surface rounded overflow-hidden">
                          <div
                            className="h-full bg-primary rounded"
                            style={{ width: `${journey.probability}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-text-muted">
                      {formatCurrency(journey.value, false)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="w-full h-full bg-foreground rounded border flex flex-col min-h-[250px]">
            <div className="p-2 border-b">
              <h3 className="text-sm text-text-muted">Journey Distribution</h3>
            </div>
            <div className="p-4 flex flex-col gap-4">
              {stageDistribution.map((entry, idx) => (
                <div
                  key={entry.state}
                  className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-muted">
                      {entry.state}
                    </span>
                    <span className="text-xs text-text-muted">
                      {entry.total} journeys ({entry.percentage}%)
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

export default SalesDashboard;

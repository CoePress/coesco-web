import {
  TrendingUp,
  FileText,
  Users,
  DollarSign,
  List,
  RefreshCcw,
  Info,
  Download,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import ExcelJS from "exceljs";

import { Button, Select } from "@/components";
import { formatCurrency } from "@/utils";
import PageHeader from "@/components/layout/page-header";
import Metrics, { MetricsCard } from "@/components/ui/metrics";
import { useApi } from "@/hooks/use-api";
import { STAGES } from "./journeys/constants";
import DatePicker from "@/components/ui/date-picker";
import { useAuth } from "@/contexts/auth.context";
import { fetchAvailableRsms, Employee } from "./journeys/utils";

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
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [showMetricInfo, setShowMetricInfo] = useState(false);
  const api = useApi();
  const navigate = useNavigate();
  const { employee } = useAuth();
  const [rsmFilter, setRsmFilter] = useState<string>("");
  const [rsmFilterDisplay, setRsmFilterDisplay] = useState<string>("");
  const [availableRsms, setAvailableRsms] = useState<Employee[]>([]);
  const [rsmDisplayNames, setRsmDisplayNames] = useState<Map<string, string>>(new Map());

  const getDefaultStartDate = () => {
    const date = new Date();
    date.setMonth(date.getMonth() - 3);
    return date.toISOString().split('T')[0];
  };

  const getDefaultEndDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const [startDate, setStartDate] = useState<string>(getDefaultStartDate());
  const [endDate, setEndDate] = useState<string>(getDefaultEndDate());
  const [showRevenue, setShowRevenue] = useState(true);
  const [showActiveJourneys, setShowActiveJourneys] = useState(true);
  const [showConversion, setShowConversion] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const filterConditions: any[] = [];

        if (startDate) {
          filterConditions.push({
            field: "Journey_Start_Date",
            operator: "gte",
            value: startDate
          });
        }

        if (endDate) {
          filterConditions.push({
            field: "Journey_Start_Date",
            operator: "lte",
            value: endDate
          });
        }

        if (rsmFilter) {
          filterConditions.push({
            field: "RSM",
            operator: "contains",
            value: rsmFilter
          });
        }

        const params: any = {
          limit: 10000,
          sort: "Journey_Start_Date",
          order: "desc"
        };

        if (filterConditions.length > 0) {
          params.filter = JSON.stringify({ filters: filterConditions });
        }

        const [journeysResponse, companiesResponse] = await Promise.all([
          api.get("/legacy/base/Journey", params),
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
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate, rsmFilter]);

  useEffect(() => {
    const loadRsms = async () => {
      const rsms = await fetchAvailableRsms({ get: api.get });
      if (rsms.length > 0) {
        setAvailableRsms(rsms);
        const displayNamesMap = new Map<string, string>();
        rsms.forEach(rsm => {
          displayNamesMap.set(rsm.initials, `${rsm.name} (${rsm.initials})`);
        });
        setRsmDisplayNames(displayNamesMap);
      }
    };
    loadRsms();
  }, []);

  const companiesById = new Map(companies.map(c => [c.Company_ID, c]));

  const activeJourneys = journeys.filter(j =>
    j.Journey_Status === 'open' || !j.Journey_Status
  );

  const wonJourneys = journeys.filter(j => mapLegacyStageToId(j.Journey_Stage) === 5);
  const lostJourneys = journeys.filter(j => mapLegacyStageToId(j.Journey_Stage) === 6);
  const closedJourneys = [...wonJourneys, ...lostJourneys];

  const totalRevenue = journeys
    .filter(j => j.Journey_Status === 'won')
    .reduce((sum, j) => sum + (j.Journey_Value || 0), 0);
  const totalQuotes = activeJourneys.length;
  const totalJourneysWithValue = activeJourneys.filter(j => (j.Journey_Value || 0) > 0).length;
  const conversionRate = closedJourneys.length > 0 ? (wonJourneys.length / (wonJourneys.length + lostJourneys.length)) * 100 : 0;

  // Calculate performance data based on selected timeframe
  const monthlyData: Array<{
    month: string;
    sales: number;
    quotes: number;
    conversion: number;
    journeys: number;
    year: number;
  }> = [];

  if (timeframe === 'daily') {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dayMap = new Map<string, any[]>();

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toDateString();
      dayMap.set(dateKey, []);
    }

    journeys.forEach(j => {
      if (!j.Journey_Start_Date) return;
      const jDate = new Date(j.Journey_Start_Date);
      const dateKey = jDate.toDateString();
      if (dayMap.has(dateKey)) {
        dayMap.get(dateKey)?.push(j);
      }
    });

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toDateString();
      const dayLabel = `${d.getMonth() + 1}/${d.getDate()}`;
      const dayJourneys = dayMap.get(dateKey) || [];

      const daySales = dayJourneys
        .filter(j => j.Journey_Status === 'won')
        .reduce((sum, j) => sum + (j.Journey_Value || 0), 0);

      const dayQuotes = dayJourneys.length;
      const dayJourneysWithValue = dayJourneys.filter(j => {
        const stage = String(j.Journey_Stage || '').toLowerCase();
        return !stage.includes('closed won') &&
               !stage.includes('job lost') &&
               !stage.includes('closed lost') &&
               !stage.includes('post installation');
      }).length;

      const dayWonJourneys = dayJourneys.filter(j => mapLegacyStageToId(j.Journey_Stage) === 5);
      const dayLostJourneys = dayJourneys.filter(j => mapLegacyStageToId(j.Journey_Stage) === 6);
      const dayClosedJourneys = dayWonJourneys.length + dayLostJourneys.length;
      const dayConversion = dayClosedJourneys > 0
        ? (dayWonJourneys.length / dayClosedJourneys) * 100
        : 0;

      monthlyData.push({
        month: dayLabel,
        sales: daySales,
        quotes: dayQuotes * 1000,
        conversion: Math.round(dayConversion),
        journeys: dayJourneysWithValue,
        year: d.getFullYear()
      });
    }
  } else if (timeframe === 'weekly') {
    const start = new Date(startDate);
    const end = new Date(endDate);

    let weekStart = new Date(start);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    while (weekStart <= end) {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const weekLabel = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;

      const weekJourneys = journeys.filter(j => {
        if (!j.Journey_Start_Date) return false;
        const jDate = new Date(j.Journey_Start_Date);
        return jDate >= weekStart && jDate <= weekEnd;
      });

      const weekSales = weekJourneys
        .filter(j => j.Journey_Status === 'won')
        .reduce((sum, j) => sum + (j.Journey_Value || 0), 0);

      const weekQuotes = weekJourneys.length;
      const weekJourneysWithValue = weekJourneys.filter(j => {
        const stage = String(j.Journey_Stage || '').toLowerCase();
        return !stage.includes('closed won') &&
               !stage.includes('job lost') &&
               !stage.includes('closed lost') &&
               !stage.includes('post installation');
      }).length;

      const weekWonJourneys = weekJourneys.filter(j => mapLegacyStageToId(j.Journey_Stage) === 5);
      const weekLostJourneys = weekJourneys.filter(j => mapLegacyStageToId(j.Journey_Stage) === 6);
      const weekClosedJourneys = weekWonJourneys.length + weekLostJourneys.length;
      const weekConversion = weekClosedJourneys > 0
        ? (weekWonJourneys.length / weekClosedJourneys) * 100
        : 0;

      monthlyData.push({
        month: weekLabel,
        sales: weekSales,
        quotes: weekQuotes * 1000,
        conversion: Math.round(weekConversion),
        journeys: weekJourneysWithValue,
        year: weekStart.getFullYear()
      });

      weekStart.setDate(weekStart.getDate() + 7);
    }
  } else {
    const start = new Date(startDate);
    const end = new Date(endDate);

    let currentMonth = new Date(start.getFullYear(), start.getMonth(), 1);
    const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

    while (currentMonth <= endMonth) {
      const monthName = currentMonth.toLocaleDateString('en-US', { month: 'short' });

      const monthJourneys = journeys.filter(j => {
        if (!j.Journey_Start_Date) return false;
        const jDate = new Date(j.Journey_Start_Date);
        return jDate.getMonth() === currentMonth.getMonth() && jDate.getFullYear() === currentMonth.getFullYear();
      });

      const monthSales = monthJourneys
        .filter(j => j.Journey_Status === 'won')
        .reduce((sum, j) => sum + (j.Journey_Value || 0), 0);

      const monthQuotes = monthJourneys.length;
      const monthJourneysWithValue = monthJourneys.filter(j => {
        const stage = String(j.Journey_Stage || '').toLowerCase();
        return !stage.includes('closed won') &&
               !stage.includes('job lost') &&
               !stage.includes('closed lost') &&
               !stage.includes('post installation');
      }).length;

      const monthWonJourneys = monthJourneys.filter(j => mapLegacyStageToId(j.Journey_Stage) === 5);
      const monthLostJourneys = monthJourneys.filter(j => mapLegacyStageToId(j.Journey_Stage) === 6);
      const monthClosedJourneys = monthWonJourneys.length + monthLostJourneys.length;
      const monthConversion = monthClosedJourneys > 0
        ? (monthWonJourneys.length / monthClosedJourneys) * 100
        : 0;

      monthlyData.push({
        month: monthName,
        sales: monthSales,
        quotes: monthQuotes * 1000,
        conversion: Math.round(monthConversion),
        journeys: monthJourneysWithValue,
        year: currentMonth.getFullYear()
      });

      currentMonth.setMonth(currentMonth.getMonth() + 1);
    }
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

    return {
      state: stage.label,
      total,
      percentage
    };
  });

  const stageDistribution = allStageDistribution.filter(stage =>
    stage.total > 0 || ["Lead", "Qualified", "Presentations", "Negotiation"].includes(stage.state)
  );
  
  const kpis = [
    {
      title: "Order Intake",
      value: formatCurrency(totalRevenue, false),
      description: "Total value of won journeys in range",
      icon: <DollarSign size={16} />,
    },
    {
      title: "Total Quotes",
      value: totalQuotes.toString(),
      description: "Active quotes in pipeline",
      icon: <FileText size={16} />,
    },
    {
      title: "Conversion Rate",
      value: `${Math.round(conversionRate)}%`,
      description: "Of the closed journeys, this percentage were won",
      icon: <TrendingUp size={16} />,
    },
    {
      title: "Active Journeys",
      value: totalJourneysWithValue.toString(),
      description: "Journeys with values in pipeline",
      icon: <Users size={16} />,
    },
  ];

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const filterConditions: any[] = [];

      if (startDate) {
        filterConditions.push({
          field: "Journey_Start_Date",
          operator: "gte",
          value: startDate
        });
      }

      if (endDate) {
        filterConditions.push({
          field: "Journey_Start_Date",
          operator: "lte",
          value: endDate
        });
      }

      if (rsmFilter) {
        filterConditions.push({
          field: "RSM",
          operator: "contains",
          value: rsmFilter
        });
      }

      const params: any = {
        limit: 10000,
        sort: "Journey_Start_Date",
        order: "desc"
      };

      if (filterConditions.length > 0) {
        params.filter = JSON.stringify({ filters: filterConditions });
      }

      const [journeysResponse, companiesResponse] = await Promise.all([
        api.get("/legacy/base/Journey", params),
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

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();

    const kpiSheet = workbook.addWorksheet("KPI Summary");

    kpiSheet.addTable({
      name: "KPITable",
      ref: "A1",
      headerRow: true,
      totalsRow: false,
      style: {
        theme: "TableStyleMedium2",
        showRowStripes: true,
      },
      columns: [
        { name: "Metric", filterButton: false },
        { name: "Value", filterButton: false },
      ],
      rows: [
        ["Order Intake", formatCurrency(totalRevenue, false)],
        ["Conversion Rate", `${Math.round(conversionRate)}%`],
        ["Active Journeys", totalJourneysWithValue],
      ],
    });

    kpiSheet.getColumn(1).width = 25;
    kpiSheet.getColumn(2).width = 20;

    const stageData = stageDistribution.map(s => [
      s.state,
      s.total,
      `${s.percentage}%`,
    ]);

    const stageStartRow = 6;
    kpiSheet.addTable({
      name: "StageDistributionTable",
      ref: `A${stageStartRow}`,
      headerRow: true,
      totalsRow: false,
      style: {
        theme: "TableStyleMedium2",
        showRowStripes: true,
      },
      columns: [
        { name: "Stage", filterButton: true },
        { name: "Total Journeys", filterButton: true },
        { name: "Percentage", filterButton: true },
      ],
      rows: stageData,
    });

    kpiSheet.getColumn(3).width = 15;

    const journeySheet = workbook.addWorksheet("Journey List");
    const journeyData = journeys.map(j => {
      const company = companiesById.get(j.Company_ID);
      const journeyStageId = mapLegacyStageToId(j.Journey_Stage);
      const stageInfo = STAGES.find(s => s.id === journeyStageId) || STAGES[0];
      return [
        j.ID,
        company?.CustDlrName || j.Target_Account || `Company ${j.Company_ID}`,
        stageInfo.label,
        j.Journey_Status || "open",
        j.Journey_Value ? formatCurrency(j.Journey_Value, false) : "$0",
        j.Journey_Start_Date ? new Date(j.Journey_Start_Date).toLocaleDateString() : "",
        j.CreateDT ? new Date(j.CreateDT).toLocaleDateString() : "",
      ];
    });

    journeySheet.addTable({
      name: "JourneyTable",
      ref: "A1",
      headerRow: true,
      totalsRow: false,
      style: {
        theme: "TableStyleMedium2",
        showRowStripes: true,
      },
      columns: [
        { name: "Link to Journey", filterButton: true },
        { name: "Company", filterButton: true },
        { name: "Stage", filterButton: true },
        { name: "Status", filterButton: true },
        { name: "Value", filterButton: true },
        { name: "Start Date", filterButton: true },
        { name: "Created Date", filterButton: true },
      ],
      rows: journeyData,
    });

    journeys.forEach((j, index) => {
      const cell = journeySheet.getCell(`A${index + 2}`);
      cell.value = {
        text: j.ID,
        hyperlink: `https://portal.cpec.com/sales/pipeline/${j.ID}`
      };
      cell.font = { color: { argb: 'FF0563C1' }, underline: true };
    });

    journeySheet.getColumn(1).width = 38;
    journeySheet.getColumn(2).width = 30;
    journeySheet.getColumn(3).width = 20;
    journeySheet.getColumn(4).width = 15;
    journeySheet.getColumn(5).width = 15;
    journeySheet.getColumn(6).width = 15;
    journeySheet.getColumn(7).width = 15;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sales-dashboard-${startDate}-to-${endDate}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const Actions = () => {
    return (
      <div className="flex gap-2 items-center">
        <Select
          value={(() => {
            if (rsmFilterDisplay === 'my-journeys' || rsmFilterDisplay === "") return rsmFilterDisplay;

            if (rsmDisplayNames) {
              for (const [initials, displayName] of rsmDisplayNames) {
                if (displayName === rsmFilterDisplay) return initials;
              }
            }
            return rsmFilterDisplay;
          })()}
          onChange={(e) => {
            if (e.target.value === 'my-journeys') {
              const userInitials = employee?.number;
              setRsmFilter(userInitials || "");
              setRsmFilterDisplay('my-journeys');
            } else if (e.target.value === "") {
              setRsmFilter("");
              setRsmFilterDisplay("");
            } else {
              const initials = e.target.value;
              setRsmFilter(initials);
              setRsmFilterDisplay(rsmDisplayNames?.get(initials) || initials);
            }
          }}
          options={(() => {
            const baseOptions = [
              { value: "", label: "All RSMs" },
              { value: "my-journeys", label: "My Journeys" }
            ];
            const rsmOptions = availableRsms.map((rsm: Employee) => ({
              value: rsm.initials,
              label: rsmDisplayNames?.get(rsm.initials) || rsm.name
            }));
            return [...baseOptions, ...rsmOptions];
          })()}
          className="w-48"
        />
        <div className="flex gap-2 items-center">
          <span className="text-sm text-text-muted">Start:</span>
          <DatePicker
            value={startDate}
            onChange={setStartDate}
            placeholder="Start Date"
            className="w-[150px]"
          />
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-sm text-text-muted">End:</span>
          <DatePicker
            value={endDate}
            onChange={setEndDate}
            placeholder="End Date"
            className="w-[150px]"
          />
        </div>
        <Button onClick={refreshData} disabled={isLoading}>
          <RefreshCcw size={20} className={isLoading ? "animate-spin" : ""} />
          {isLoading ? "Refreshing..." : "Refresh"}
        </Button>
        <Button onClick={exportToExcel} disabled={isLoading}>
          <Download size={20} />
          Export
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

        <div className="w-full h-full bg-foreground rounded border flex flex-col min-h-[250px] flex-1">
          <div className="p-2 border-b flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h3 className="text-sm text-text-muted">Performance Overview</h3>
              <button
                onClick={() => setShowMetricInfo(!showMetricInfo)}
                className="text-text-muted hover:text-primary transition-colors">
                <Info size={16} />
              </button>
            </div>
            <div className="flex gap-4 items-center">
              <div className="flex gap-3 items-center">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showRevenue}
                    onChange={(e) => setShowRevenue(e.target.checked)}
                    className="rounded cursor-pointer"
                  />
                  <span className="text-xs text-success">Revenue</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showActiveJourneys}
                    onChange={(e) => setShowActiveJourneys(e.target.checked)}
                    className="rounded cursor-pointer"
                  />
                  <span className="text-xs text-warning">Active Journeys</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showConversion}
                    onChange={(e) => setShowConversion(e.target.checked)}
                    className="rounded cursor-pointer"
                  />
                  <span className="text-xs text-error">Conversion Rate</span>
                </label>
              </div>
              <div className="flex gap-1">
                <Button
                  variant={timeframe === 'daily' ? 'primary' : 'secondary-outline'}
                  size="sm"
                  onClick={() => setTimeframe('daily')}>
                  Daily
                </Button>
                <Button
                  variant={timeframe === 'weekly' ? 'primary' : 'secondary-outline'}
                  size="sm"
                  onClick={() => setTimeframe('weekly')}>
                  Weekly
                </Button>
                <Button
                  variant={timeframe === 'monthly' ? 'primary' : 'secondary-outline'}
                  size="sm"
                  onClick={() => setTimeframe('monthly')}>
                  Monthly
                </Button>
              </div>
            </div>
          </div>

          {showMetricInfo && (
            <div className="p-3 bg-surface border-b text-xs text-text-muted space-y-2">
              <div>
                <span className="font-medium text-success">Revenue:</span> Total value of all won journeys within the time period
              </div>
              <div>
                <span className="font-medium text-warning">Active Journeys:</span> Number of journeys excluding Closed Won, Job Lost, Closed Lost, and Post Installation stages
              </div>
              <div>
                <span className="font-medium text-error">Conversion Rate:</span> Percentage of journeys won out of total journeys in the period
              </div>
            </div>
          )}

          <div className="p-2 flex-1">
            <ResponsiveContainer
              width="100%"
              height="100%">
              <LineChart
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
                  yAxisId="left"
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
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="var(--text-muted)"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--foreground)",
                    color: "var(--text-muted)",
                    border: "1px solid var(--border)",
                    borderRadius: "4px",
                  }}
                  labelFormatter={(label) => {
                    const dataPoint = monthlyData.find(d => d.month === label);
                    if (dataPoint?.year) {
                      return `${label} ${dataPoint.year}`;
                    }
                    return label;
                  }}
                  formatter={(value, name) => {
                    const numValue = Number(value);
                    if (name === 'sales') {
                      return [formatCurrency(numValue), 'Revenue'];
                    }
                    if (name === 'journeys') {
                      return [numValue, 'Active Journeys'];
                    }
                    if (name === 'conversion') {
                      return [`${numValue}%`, 'Conversion Rate'];
                    }
                    return [value, name];
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px' }}
                  formatter={(value) => {
                    if (value === 'sales') return 'Revenue';
                    if (value === 'journeys') return 'Active Journeys';
                    if (value === 'conversion') return 'Conversion Rate';
                    return value;
                  }}
                />
                {showRevenue && (
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="sales"
                    stroke="var(--success)"
                    strokeWidth={2}
                    dot={{ fill: "var(--success)", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                )}
                {showActiveJourneys && (
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="journeys"
                    stroke="var(--warning)"
                    strokeWidth={2}
                    dot={{ fill: "var(--warning)", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                )}
                {showConversion && (
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="conversion"
                    stroke="var(--error)"
                    strokeWidth={2}
                    dot={{ fill: "var(--error)", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
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
                size="sm"
                onClick={() => navigate('/sales/pipeline?view=list&sort=value&order=desc')}>
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

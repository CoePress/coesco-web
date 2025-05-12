import {
  Filter,
  Download,
  MoreHorizontal,
  ChevronDown,
  Plus,
  Layout,
  List as ListIcon,
} from "lucide-react";
import { useState } from "react";

import { Button, PageHeader, PageSearch, StatusBadge } from "@/components";
import { formatCurrency, formatDate } from "@/utils";
import { sampleDeals } from "@/utils/sample-data";
import Table from "@/components/v1/table";

const Pipeline = () => {
  const [viewMode, setViewMode] = useState("kanban");

  const pipelineStages = [
    { id: 1, name: "Lead", color: "bg-neutral-400" },
    { id: 2, name: "Qualified", color: "bg-blue-400" },
    { id: 3, name: "Proposal", color: "bg-indigo-400" },
    { id: 4, name: "Negotiation", color: "bg-yellow-400" },
    { id: 5, name: "Closed Won", color: "bg-green-400" },
    { id: 6, name: "Closed Lost", color: "bg-red-400" },
  ];

  const getDealsByStage = (stageId: number) => {
    return sampleDeals.filter((deal) => deal.stage === stageId);
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case "high":
        return "error";
      case "medium":
        return "warning";
      case "low":
        return "success";
      default:
        return "default";
    }
  };

  const getStageTotalValue = (stageId: number) => {
    return sampleDeals
      .filter((deal) => deal.stage === stageId)
      .reduce((sum, deal) => sum + deal.value, 0);
  };

  const renderKanbanCard = (deal: any) => (
    <div
      key={deal.id}
      draggable={true}
      className="bg-foreground rounded-lg shadow-sm border p-3 mb-3 cursor-move hover:shadow select-none">
      <div className="text-sm font-medium text-neutral-400 mb-1 truncate">
        {deal.name}
      </div>
      <div className="text-xs text-neutral-400 mb-2">{deal.company}</div>
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm font-medium text-neutral-400">
          {formatCurrency(deal.value)}
        </div>
        <div
          className={`text-xs px-2 py-0.5 rounded-full ${getPriorityStyles(
            deal.priority
          )}`}>
          {deal.priority}
        </div>
      </div>
      <div className="text-xs text-neutral-400">
        Close date: {formatDate(deal.closeDate)}
      </div>
      <div className="flex justify-between items-center mt-2 pt-2 border-t">
        <div className="text-xs text-neutral-400">
          Last activity: {deal.activity}
        </div>
        <button className="text-neutral-400 hover:text-neutral-600">
          <MoreHorizontal size={14} />
        </button>
      </div>
    </div>
  );

  const totalPipelineValue = sampleDeals.reduce(
    (sum, deal) => sum + deal.value,
    0
  );

  const pageTitle = "Sales Pipeline";
  const pageDescription = `${sampleDeals.length} deals · ${formatCurrency(
    totalPipelineValue
  )} total value`;

  const tableColumns = [
    {
      key: "name",
      header: "Deal Name",
      render: (value: string, _: any) => (
        <div className="text-sm font-medium text-primary">{value}</div>
      ),
    },
    {
      key: "company",
      header: "Company",
      render: (value: string, row: any) => (
        <div>
          <div className="text-sm text-neutral-400">{value}</div>
          <div className="text-xs text-neutral-400">{row.contact}</div>
        </div>
      ),
    },
    {
      key: "stage",
      header: "Stage",
      render: (value: number, _: any) => {
        const stage = pipelineStages.find((s) => s.id === value);
        return (
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${stage?.color}`}></div>
            <div className="text-sm text-neutral-400">{stage?.name}</div>
          </div>
        );
      },
    },
    {
      key: "value",
      header: "Value",
      render: (value: number) => (
        <div className="text-sm font-medium text-neutral-400">
          {formatCurrency(value)}
        </div>
      ),
    },
    {
      key: "closeDate",
      header: "Close Date",
      render: (value: string) => (
        <div className="text-sm text-neutral-400">{formatDate(value)}</div>
      ),
    },
    {
      key: "probability",
      header: "Probability",
      render: (value: number) => (
        <div className="flex items-center gap-2">
          <div className="bg-gray-200 h-1.5 w-16 rounded-full overflow-hidden">
            <div
              className={`h-full ${
                value >= 70
                  ? "bg-green-500"
                  : value >= 40
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${value}%` }}></div>
          </div>
          <span className="text-xs text-neutral-400">{value}%</span>
        </div>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      render: (value: string) => (
        <StatusBadge
          label={value}
          variant={getPriorityStyles(value)}
        />
      ),
    },
    {
      key: "activity",
      header: "Last Activity",
      render: (value: string) => (
        <div className="text-sm text-neutral-400">{value}</div>
      ),
    },
    {
      key: "actions",
      header: "",
      render: () => (
        <div className="text-right">
          <button className="text-neutral-400 hover:text-neutral-600">
            <MoreHorizontal size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <PageHeader
        title={pageTitle}
        description={pageDescription}
        actions={
          <>
            <div className="flex border rounded-md overflow-hidden">
              <button
                className={`px-3 py-1.5 text-sm flex items-center gap-1.5 ${
                  viewMode === "kanban"
                    ? "bg-primary text-white"
                    : "bg-foreground text-neutral-400"
                }`}
                onClick={() => setViewMode("kanban")}>
                <Layout size={16} />
                Kanban
              </button>
              <button
                className={`px-3 py-1.5 text-sm flex items-center gap-1.5 ${
                  viewMode === "list"
                    ? "bg-primary text-white"
                    : "bg-foreground text-neutral-400"
                }`}
                onClick={() => setViewMode("list")}>
                <ListIcon size={16} />
                List
              </button>
            </div>
            <Button
              onClick={() => {}}
              variant="secondary-outline">
              <Download size={16} />
              Export
            </Button>
            <Button onClick={() => {}}>
              <Plus size={16} />
              Add Deal
            </Button>
          </>
        }
      />

      <PageSearch
        placeholder="Search deals..."
        filters={[
          { label: "Filters", icon: Filter, onClick: () => {} },
          { label: "Status", icon: ChevronDown, onClick: () => {} },
        ]}
        label="Deals"
        labelTrigger={false}
      />

      {viewMode === "kanban" && (
        <div className="flex-1 min-h-0 w-full overflow-hidden">
          <div className="h-full w-full overflow-x-auto">
            <div className="inline-flex gap-4 p-4">
              {pipelineStages.map((stage) => (
                <div
                  key={stage.id}
                  className="flex-shrink-0 w-72">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${stage.color}`}></div>
                      <h3 className="text-sm font-medium text-neutral-400">
                        {stage.name}
                      </h3>
                      <span className="text-xs text-neutral-400">
                        {getDealsByStage(stage.id).length}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-400">
                      {formatCurrency(getStageTotalValue(stage.id))}
                    </div>
                  </div>
                  <div
                    className={`p-3 rounded-lg ${stage.color} h-max overflow-y-auto`}>
                    {getDealsByStage(stage.id).map((deal) =>
                      renderKanbanCard(deal)
                    )}
                    <button className="w-full p-2 bg-foreground bg-opacity-60 rounded border border-dashed border-border text-sm text-neutral-400 hover:bg-opacity-80 flex items-center justify-center gap-1">
                      <Plus size={16} />
                      Add Deal
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {viewMode === "list" && (
        <Table
          columns={tableColumns as any}
          data={sampleDeals}
          total={sampleDeals.length}
          className="bg-foreground rounded-lg shadow-sm border"
        />
      )}
    </div>
  );
};

export default Pipeline;

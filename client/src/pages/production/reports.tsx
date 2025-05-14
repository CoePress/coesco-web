import { useState } from "react";
import {
  FileText,
  Mail,
  Clock,
  Plus,
  Search,
  Filter,
  Eye,
  Copy,
  RefreshCcw,
  Send,
  Settings,
} from "lucide-react";

import { Button, Card, PageHeader } from "@/components";

const Reports = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  const reportTemplates = [
    {
      id: "daily-oee",
      name: "Daily OEE Report",
      description: "Daily Overall Equipment Effectiveness metrics",
      icon: <FileText size={20} />,
      category: "Production",
      lastUsed: "2 days ago",
      popular: true,
    },
    {
      id: "machine-status",
      name: "Machine Status Report",
      description: "Detailed machine status and performance metrics",
      icon: <FileText size={20} />,
      category: "Production",
      lastUsed: "1 week ago",
      popular: true,
    },
    {
      id: "alarm-summary",
      name: "Alarm Summary Report",
      description: "Summary of machine alarms and alerts",
      icon: <FileText size={20} />,
      category: "Production",
      lastUsed: "3 days ago",
      popular: false,
    },
    {
      id: "utilization",
      name: "Utilization Report",
      description: "Machine utilization and efficiency metrics",
      icon: <FileText size={20} />,
      category: "Production",
      lastUsed: "1 month ago",
      popular: true,
    },
    // Add more templates to demonstrate scrolling
    {
      id: "quality-metrics",
      name: "Quality Metrics Report",
      description: "Quality control and inspection metrics",
      icon: <FileText size={20} />,
      category: "Quality",
      lastUsed: "5 days ago",
      popular: false,
    },
    {
      id: "maintenance-schedule",
      name: "Maintenance Schedule",
      description: "Upcoming and completed maintenance tasks",
      icon: <FileText size={20} />,
      category: "Maintenance",
      lastUsed: "1 day ago",
      popular: true,
    },
  ];

  const sentReports = [
    {
      id: 1,
      name: "Daily OEE - June 30, 2025",
      template: "Daily OEE Report",
      sentAt: "2025-06-30T06:00:00",
      status: "sent",
      recipients: ["production@company.com", "managers@company.com"],
      sentBy: "System",
    },
    {
      id: 2,
      name: "Machine Status - June 28, 2025",
      template: "Machine Status Report",
      sentAt: "2025-06-28T08:00:00",
      status: "sent",
      recipients: ["maintenance@company.com"],
      sentBy: "System",
    },
    {
      id: 3,
      name: "Alarm Summary - June 25, 2025",
      template: "Alarm Summary Report",
      sentAt: "2025-06-25T16:00:00",
      status: "sent",
      recipients: ["support@company.com"],
      sentBy: "System",
    },
  ];

  return (
    <div className="w-full flex-1 flex flex-col">
      <PageHeader
        title="Production Reports"
        description="Create and manage production reports"
        actions={
          <>
            <Button
              variant="secondary-outline"
              size="sm">
              <RefreshCcw size={16} />
              Refresh
            </Button>
            <Button>
              <Plus size={16} />
              New Report
            </Button>
          </>
        }
      />

      <div className="p-2 gap-2 flex flex-col flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 flex-1">
          <div className="space-y-2">
            <Card>
              <div className="p-2 border-b flex items-center justify-between">
                <h3 className="text-sm font-medium text-text-muted">
                  Report Templates
                </h3>
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted"
                  />
                  <input
                    type="text"
                    placeholder="Search templates..."
                    className="pl-8 pr-2 py-1 text-sm bg-surface rounded border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="h-[calc(50vh-200px)] overflow-y-auto">
                <div className="divide-y">
                  {reportTemplates.map((template) => (
                    <div
                      key={template.id}
                      className={`p-2 cursor-pointer transition-all hover:bg-surface/80 ${
                        selectedTemplate === template.id ? "bg-surface" : ""
                      }`}
                      onClick={() => {
                        setSelectedTemplate(template.id);
                        setSelectedReport(null);
                      }}>
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-surface">
                          {template.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-text-muted truncate">
                            {template.name}
                          </h3>
                          <p className="text-xs text-text-muted mt-1">
                            {template.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Clock
                              size={12}
                              className="text-text-muted"
                            />
                            <span className="text-xs text-text-muted">
                              {template.lastUsed}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-2 border-b">
                <h3 className="text-sm font-medium text-text-muted">
                  Sent Reports
                </h3>
              </div>
              <div className="h-[calc(50vh-200px)] overflow-y-auto">
                <div className="divide-y">
                  {sentReports.map((report) => (
                    <div
                      key={report.id}
                      className="p-2 hover:bg-surface/50 cursor-pointer"
                      onClick={() => {
                        setSelectedReport(report);
                        setSelectedTemplate(null);
                      }}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-text-muted truncate">
                            {report.name}
                          </h4>
                          <p className="text-xs text-text-muted mt-1">
                            {report.template}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-success/10 text-success">
                            <Send
                              size={12}
                              className="mr-1"
                            />
                            Sent
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-2">
                          <Mail
                            size={12}
                            className="text-text-muted"
                          />
                          <span className="text-xs text-text-muted">
                            {report.recipients.join(", ")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock
                            size={12}
                            className="text-text-muted"
                          />
                          <span className="text-xs text-text-muted">
                            {new Date(report.sentAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-2 flex-1 flex flex-col">
            <Card className="flex-1 flex flex-col min-h-44">
              <div className="p-2 border-b flex items-center justify-between">
                <h3 className="text-sm font-medium text-text-muted">
                  {selectedTemplate
                    ? "Template Preview"
                    : selectedReport
                    ? "Report Details"
                    : "Preview"}
                </h3>
                <div className="flex items-center gap-2">
                  {selectedTemplate && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm">
                        <Settings size={16} />
                        Configure
                      </Button>
                      <Button
                        variant="primary"
                        size="sm">
                        <Send size={16} />
                        Send Report
                      </Button>
                    </>
                  )}
                  {selectedReport && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm">
                        <Eye size={16} />
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm">
                        <Copy size={16} />
                        Duplicate
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {selectedTemplate ? (
                  <div className="pt-2">
                    <div className="aspect-[8.5/11] bg-surface rounded-lg border border-dashed flex items-center justify-center">
                      <div className="text-center">
                        <FileText
                          size={48}
                          className="mx-auto text-text-muted mb-2"
                        />
                        <p className="text-sm text-text-muted">
                          Template preview will be shown here
                        </p>
                      </div>
                    </div>
                  </div>
                ) : selectedReport ? (
                  <div className="p-2 space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-text text-sm">
                      <div>
                        <h4 className="text-sm font-medium text-text-muted mb-2">
                          Report Information
                        </h4>
                        <div className="space-y-2">
                          <div>
                            <span className="text-xs text-text-muted">
                              Name
                            </span>
                            <p className="text-sm">{selectedReport.name}</p>
                          </div>
                          <div>
                            <span className="text-xs text-text-muted">
                              Template
                            </span>
                            <p className="text-sm">{selectedReport.template}</p>
                          </div>
                          <div>
                            <span className="text-xs text-text-muted">
                              Sent By
                            </span>
                            <p className="text-sm">{selectedReport.sentBy}</p>
                          </div>
                          <div>
                            <span className="text-xs text-text-muted">
                              Sent At
                            </span>
                            <p className="text-sm">
                              {new Date(selectedReport.sentAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-text-muted mb-2">
                          Recipients
                        </h4>
                        <div className="space-y-1">
                          {selectedReport.recipients.map((email: string) => (
                            <div
                              key={email}
                              className="flex items-center gap-2 text-sm">
                              <Mail
                                size={14}
                                className="text-text-muted"
                              />
                              <span>{email}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="aspect-[8.5/11] bg-surface rounded-lg border border-dashed flex items-center justify-center">
                      <div className="text-center">
                        <FileText
                          size={48}
                          className="mx-auto text-text-muted mb-2"
                        />
                        <p className="text-sm text-text-muted">
                          Report preview will be shown here
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <FileText
                        size={48}
                        className="mx-auto text-text-muted mb-2"
                      />
                      <p className="text-sm text-text-muted">
                        Select a template or report to preview
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;

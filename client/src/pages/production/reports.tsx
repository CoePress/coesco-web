import { useState, useEffect, useRef } from "react";
import { FileText, Mail, Clock, Plus, RefreshCcw, Send } from "lucide-react";

import { Button, Card, PageHeader, Modal } from "@/components";
import useGetTemplates from "@/hooks/emails/use-get-templates";
import { instance } from "@/utils";

const Reports = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [scheduleTime, setScheduleTime] = useState("06:00");
  const [scheduleType, setScheduleType] = useState<
    "daily" | "weekly" | "monthly"
  >("daily");
  const [selectedDay, setSelectedDay] = useState<number>(1); // 1-7 for weekly
  const [selectedDate, setSelectedDate] = useState<number>(1); // 1-31 for monthly
  const [timezone, setTimezone] = useState("America/New_York");
  const [templateHtml, setTemplateHtml] = useState<string | null>(null);

  const { templates, loading, error, refresh } = useGetTemplates();

  const timezones = [
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Anchorage",
    "America/Adak",
    "Pacific/Honolulu",
  ];

  const weekDays = [
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wednesday" },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" },
    { value: 6, label: "Saturday" },
    { value: 7, label: "Sunday" },
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

  useEffect(() => {
    const fetchTemplateHtml = async () => {
      if (selectedTemplate) {
        try {
          const { data } = await instance.get(
            `/email/templates/${selectedTemplate}`
          );
          setTemplateHtml(data.data.html);
        } catch (error) {
          console.error("Error fetching template HTML:", error);
          setTemplateHtml(null);
        }
      } else {
        setTemplateHtml(null);
      }
    };

    fetchTemplateHtml();
  }, [selectedTemplate]);

  const TemplatePreview = ({ html }: { html: string }) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const isDark = document.documentElement.classList.contains("dark");

    useEffect(() => {
      if (iframeRef.current) {
        const iframe = iframeRef.current;
        const doc = iframe.contentDocument || iframe.contentWindow?.document;

        if (doc) {
          doc.open();
          doc.write(`
            <!DOCTYPE html>
            <html class="${isDark ? "dark" : ""}">
              <head>
                <style>
                  :root {
                    --primary: #e8a80c;
                    --secondary: #c4930d;
                    --background: #f8f8f8;
                    --foreground: #ffffff;
                    --surface: #f0f0f0;
                    --text: #202020;
                    --text-muted: #707070;
                    --border: #d4d4d4;
                    --error: #d93026;
                    --success: #05843e;
                    --warning: #ffa500;
                    --info: #0284c7;
                    --shadow: rgba(0, 0, 0, 0.08);
                  }

                  .dark {
                    --primary: #e8a80c;
                    --secondary: #ffc547;
                    --background: #121212;
                    --foreground: #1c1c1c;
                    --surface: #262626;
                    --text: #efefef;
                    --text-muted: #a0a0a0;
                    --border: #404040;
                    --error: #f44336;
                    --success: #34d399;
                    --warning: #ffab00;
                    --info: #38bdf8;
                    --shadow: rgba(0, 0, 0, 0.25);
                  }

                  body { 
                    margin: 0; 
                    padding: 0;
                    font-family: "Roboto Mono", monospace;
                    background: var(--background);
                    color: var(--text);
                  }

                  /* Scrollbar styles */
                  ::-webkit-scrollbar {
                    width: 12px;
                    height: 12px;
                  }

                  ::-webkit-scrollbar-track {
                    background: var(--background);
                    border-radius: 8px;
                  }

                  ::-webkit-scrollbar-thumb {
                    background: var(--border);
                    border-radius: 8px;
                    border: 3px solid var(--background);
                  }

                  ::-webkit-scrollbar-thumb:hover {
                    background: var(--primary);
                  }

                  /* Firefox */
                  * {
                    scrollbar-width: thin;
                    scrollbar-color: var(--border) var(--background);
                  }

                  /* For all elements with scrollable overflow */
                  *:not(body)::-webkit-scrollbar {
                    width: 12px;
                    height: 12px;
                  }

                  *:not(body)::-webkit-scrollbar-track {
                    background: var(--background);
                    border-radius: 8px;
                  }

                  *:not(body)::-webkit-scrollbar-thumb {
                    background: var(--border);
                    border-radius: 8px;
                    border: 3px solid var(--background);
                  }

                  *:not(body)::-webkit-scrollbar-thumb:hover {
                    background: var(--primary);
                  }
                </style>
              </head>
              <body>
                ${html}
              </body>
            </html>
          `);
          doc.close();
        }
      }
    }, [html, isDark]);

    return (
      <iframe
        ref={iframeRef}
        className="w-full h-full border-0"
        title="Template Preview"
      />
    );
  };

  return (
    <div className="w-full flex-1 flex flex-col">
      <PageHeader
        title="Production Reports"
        description="Create and manage production reports"
        actions={
          <>
            <Button
              variant="secondary-outline"
              size="sm"
              onClick={refresh}>
              <RefreshCcw size={16} />
              Refresh
            </Button>
            <Button onClick={() => setIsScheduleModalOpen(true)}>
              <Plus size={16} />
              New Report
            </Button>
          </>
        }
      />

      <div className="p-2 gap-2 flex flex-col flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 flex-1">
          <div className="space-y-2 flex flex-col">
            <Card className="flex-1 flex flex-col">
              <div className="p-2 border-b flex items-center justify-between">
                <h3 className="text-sm font-medium text-text-muted">
                  Report Templates
                </h3>
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-auto">
                  <div className="divide-y">
                    {loading ? (
                      <div className="p-4 text-center text-text-muted">
                        Loading templates...
                      </div>
                    ) : error ? (
                      <div className="p-4 text-center text-red-500">
                        {error}
                      </div>
                    ) : (
                      templates?.map((template) => (
                        <div
                          key={template.slug}
                          className={`p-2 cursor-pointer transition-all hover:bg-surface/80 ${
                            selectedTemplate === template.slug
                              ? "bg-surface"
                              : ""
                          }`}
                          onClick={() => {
                            setSelectedTemplate(template.slug);
                            setSelectedReport(null);
                          }}>
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-surface">
                              <FileText size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-medium text-text-muted truncate">
                                {template.name}
                              </h3>
                              {template.subject && (
                                <p className="text-xs text-text-muted mt-1">
                                  {template.subject}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="flex-1 flex flex-col">
              <div className="p-2 border-b">
                <h3 className="text-sm font-medium text-text-muted">
                  Sent Reports
                </h3>
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-auto">
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
              </div>
              <div className="flex-1 overflow-hidden">
                {selectedTemplate ? (
                  <div className="h-full">
                    {templateHtml ? (
                      <div className="h-full overflow-auto">
                        <TemplatePreview html={templateHtml} />
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                          <FileText
                            size={48}
                            className="mx-auto text-text-muted mb-2"
                          />
                          <p className="text-sm text-text-muted">
                            Loading template preview...
                          </p>
                        </div>
                      </div>
                    )}
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

      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title="Schedule Report"
        size="md">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-text-muted mb-2 block">
              Report Template
            </label>
            <select className="block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-text-muted placeholder:text-text-muted bg-surface">
              {templates?.map((template) => (
                <option
                  key={template.slug}
                  value={template.slug}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-text-muted mb-2 block">
              Schedule
            </label>
            <select
              value={scheduleType}
              onChange={(e) =>
                setScheduleType(
                  e.target.value as "daily" | "weekly" | "monthly"
                )
              }
              className="block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-text-muted placeholder:text-text-muted bg-surface">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {scheduleType === "weekly" && (
            <div>
              <label className="text-sm text-text-muted mb-2 block">
                Day of Week
              </label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(Number(e.target.value))}
                className="block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-text-muted placeholder:text-text-muted bg-surface">
                {weekDays.map((day) => (
                  <option
                    key={day.value}
                    value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {scheduleType === "monthly" && (
            <div>
              <label className="text-sm text-text-muted mb-2 block">
                Day of Month
              </label>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(Number(e.target.value))}
                className="block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-text-muted placeholder:text-text-muted bg-surface">
                {Array.from({ length: 31 }, (_, i) => i + 1).map((date) => (
                  <option
                    key={date}
                    value={date}>
                    {date}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-sm text-text-muted mb-2 block">Time</label>
            <div className="flex gap-2">
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-text-muted placeholder:text-text-muted bg-surface"
              />
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-text-muted placeholder:text-text-muted bg-surface">
                {timezones.map((tz) => (
                  <option
                    key={tz}
                    value={tz}>
                    {tz.replace("America/", "")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm text-text-muted mb-2 block">
              Recipients
            </label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add email address"
                  className="block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-text-muted placeholder:text-text-muted bg-surface"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.currentTarget.value) {
                      setSelectedRecipients([
                        ...selectedRecipients,
                        e.currentTarget.value,
                      ]);
                      e.currentTarget.value = "";
                    }
                  }}
                />
                <Button
                  variant="secondary-outline"
                  onClick={() => {
                    const input = document.querySelector(
                      'input[type="text"]'
                    ) as HTMLInputElement;
                    if (input.value) {
                      setSelectedRecipients([
                        ...selectedRecipients,
                        input.value,
                      ]);
                      input.value = "";
                    }
                  }}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedRecipients.map((email) => (
                  <div
                    key={email}
                    className="inline-flex items-center gap-1 rounded-full bg-surface px-2 py-1 text-sm">
                    <span>{email}</span>
                    <button
                      onClick={() =>
                        setSelectedRecipients(
                          selectedRecipients.filter((e) => e !== email)
                        )
                      }
                      className="text-text-muted hover:text-text">
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary-outline"
              onClick={() => setIsScheduleModalOpen(false)}>
              Cancel
            </Button>
            <Button>Schedule Report</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Reports;

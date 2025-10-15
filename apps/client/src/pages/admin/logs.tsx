import { RefreshCcwIcon } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import {
  StatusBadge,
  PageHeader,
  Table,
  Button,
  Modal,
} from "@/components";
import { TableColumn } from "@/components/ui/table";
import { useApi } from "@/hooks/use-api";
import { IApiResponse} from "@/utils/types";
import { format } from "date-fns";
import { AuditLog } from "@coesco/types";

type EmailLog = {
  id: string;
  to: string;
  subject: string;
  template: string | null;
  status: "PENDING" | "SENT" | "FAILED";
  sentAt: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
};

type LogView = "audit" | "email" | "system";

const Logs = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const getInitialView = (): LogView => {
    const view = searchParams.get('view');
    if (view && ['email', 'system'].includes(view)) {
      return view as 'email' | 'system';
    }
    return 'audit';
  };

  const [view, setView] = useState<LogView>(getInitialView);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [selectedEmailLog, setSelectedEmailLog] = useState<EmailLog | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEmailDetailsModalOpen, setIsEmailDetailsModalOpen] = useState(false);

  const { get, response: auditLogs, loading, error } = useApi<IApiResponse<AuditLog[]>>();
  const { get: getEmails, response: emailLogs, loading: emailLoading, error: emailError } = useApi<IApiResponse<EmailLog[]>>();

  const [params, setParams] = useState({
    sort: "createdAt" as string,
    order: "desc" as "asc" | "desc",
    page: 1,
    limit: 25,
  });

  const [emailParams, setEmailParams] = useState({
    sort: "createdAt" as string,
    order: "desc" as "asc" | "desc",
    page: 1,
    limit: 25,
  });

  const queryParams = useMemo(() => {
    const q: Record<string, string> = {
      sort: params.sort,
      order: params.order,
      page: params.page.toString(),
      limit: params.limit.toString(),
    };

    return q;
  }, [params]);

  const emailQueryParams = useMemo(() => {
    const q: Record<string, string> = {
      sort: emailParams.sort,
      order: emailParams.order,
      page: emailParams.page.toString(),
      limit: emailParams.limit.toString(),
    };

    return q;
  }, [emailParams]);

  const columns: TableColumn<AuditLog>[] = [
    {
      key: "createdAt",
      header: "Timestamp",
      render: (_, row) => (
        <div className="flex flex-col">
          <span>{row.createdAt ? format(new Date(row.createdAt), "MM/dd/yyyy") : 'N/A'}</span>
          <span className="text-xs text-text-muted">
            {row.createdAt ? format(new Date(row.createdAt), "hh:mm:ss a") : 'N/A'}
          </span>
        </div>
      ),
    },
    {
      key: "model",
      header: "Model",
      render: (_, row) => (
        <StatusBadge
          label={row.model}
          variant="default"
        />
      ),
    },
    {
      key: "recordId",
      header: "Record ID",
      render: (_, row) => (
        <span className="font-mono text-sm">{row.recordId}</span>
      ),
    },
    {
      key: "changedBy",
      header: "Changed By",
      render: (_, row) => (
        <span>{(row as any).changedByName || row.changedBy}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-1",
      sortable: false,
      render: (_, row) => (
        <Button
          variant="secondary-outline"
          size="sm"
          onClick={() => {
            setSelectedLog(row);
            setIsDetailsModalOpen(true);
          }}>
          View
        </Button>
      ),
    },
  ];

  const emailColumns: TableColumn<EmailLog>[] = [
    {
      key: "createdAt",
      header: "Timestamp",
      render: (_, row) => (
        <div className="flex flex-col">
          <span>{row.createdAt ? format(new Date(row.createdAt), "MM/dd/yyyy") : 'N/A'}</span>
          <span className="text-xs text-text-muted">
            {row.createdAt ? format(new Date(row.createdAt), "hh:mm:ss a") : 'N/A'}
          </span>
        </div>
      ),
    },
    {
      key: "to",
      header: "To",
      render: (_, row) => (
        <span className="text-sm">{row.to}</span>
      ),
    },
    {
      key: "subject",
      header: "Subject",
      render: (_, row) => (
        <span className="text-sm">{row.subject}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (_, row) => (
        <StatusBadge
          label={row.status}
          variant={
            row.status === "SENT"
              ? "success"
              : row.status === "FAILED"
              ? "error"
              : "default"
          }
        />
      ),
    },
    {
      key: "sentAt",
      header: "Sent At",
      render: (_, row) => (
        <div className="flex flex-col">
          {row.sentAt ? (
            <>
              <span>{format(new Date(row.sentAt), "MM/dd/yyyy")}</span>
              <span className="text-xs text-text-muted">
                {format(new Date(row.sentAt), "hh:mm:ss a")}
              </span>
            </>
          ) : (
            <span className="text-text-muted text-sm">-</span>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-1",
      sortable: false,
      render: (_, row) => (
        <Button
          variant="secondary-outline"
          size="sm"
          onClick={() => {
            setSelectedEmailLog(row);
            setIsEmailDetailsModalOpen(true);
          }}>
          View
        </Button>
      ),
    },
  ];

  const fetchAuditLogs = async () => {
    await get("/admin/logs", queryParams);
  };

  const fetchEmailLogs = async () => {
    await getEmails("/admin/logs/emails", emailQueryParams);
  };

  const refresh = () => {
    if (view === "audit") {
      fetchAuditLogs();
    } else {
      fetchEmailLogs();
    }
  };

  useEffect(() => {
    if (view === "audit") {
      fetchAuditLogs();
    }
  }, [params]);

  useEffect(() => {
    if (view === "email") {
      fetchEmailLogs();
    }
  }, [emailParams]);

  useEffect(() => {
    const view = searchParams.get('view');
    const newView: LogView =
      (view && ['email', 'system'].includes(view)) ? view as 'email' | 'system' : 'audit';

    setView(newView);
  }, [searchParams]);

  useEffect(() => {
    if (view === "audit") {
      fetchAuditLogs();
    } else if (view === "email") {
      fetchEmailLogs();
    }
  }, [view]);

  const handleParamsChange = (updates: Partial<typeof params>) => {
    setParams(prev => ({
      ...prev,
      ...updates
    }));
  };

  const handleEmailParamsChange = (updates: Partial<typeof emailParams>) => {
    setEmailParams(prev => ({
      ...prev,
      ...updates
    }));
  };

  const handleViewChange = (newView: LogView) => {
    setView(newView);
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      if (newView === 'audit') {
        newParams.delete('view');
      } else {
        newParams.set('view', newView);
      }
      return newParams;
    });
  };

  const Actions = () => {
    return (
      <div className="flex gap-2">
        <div className="flex gap-1 bg-surface p-1 rounded border border-border">
          <button
            onClick={() => handleViewChange('audit')}
            className={`px-3 py-1 text-sm font-medium rounded transition-colors cursor-pointer ${
              view === 'audit'
                ? 'bg-primary text-background'
                : 'text-text-muted hover:text-text'
            }`}
          >
            Records
          </button>
          <button
            onClick={() => handleViewChange('email')}
            className={`px-3 py-1 text-sm font-medium rounded transition-colors cursor-pointer ${
              view === 'email'
                ? 'bg-primary text-background'
                : 'text-text-muted hover:text-text'
            }`}
          >
            Emails
          </button>
          <button
            onClick={() => handleViewChange('system')}
            className={`px-3 py-1 text-sm font-medium rounded transition-colors cursor-pointer ${
              view === 'system'
                ? 'bg-primary text-background'
                : 'text-text-muted hover:text-text'
            }`}
          >
            System
          </button>
        </div>
        <Button onClick={refresh} variant="primary" className="px-2">
          <RefreshCcwIcon size={16} />
        </Button>
      </div>
    );
  };

  return (
    <div className="w-full flex-1 flex flex-col overflow-hidden">
      <PageHeader
        title="Logs"
        description="View system activity, email delivery, and application events"
        actions={<Actions />}
      />

      <div className="p-2 flex flex-col flex-1 overflow-hidden gap-2">
        <div className="flex-1 overflow-hidden">
          {view === "audit" ? (
            <Table<AuditLog>
              columns={columns}
              data={auditLogs?.data || []}
              total={auditLogs?.meta?.total || 0}
              idField="id"
              pagination
              loading={loading}
              error={error}
              currentPage={auditLogs?.meta?.page}
              totalPages={auditLogs?.meta?.totalPages}
              onPageChange={(page) => handleParamsChange({ page })}
              sort={params.sort}
              order={params.order}
              onSortChange={(newSort, newOrder) => {
                handleParamsChange({
                  sort: newSort as any,
                  order: newOrder as any
                });
              }}
              className="rounded border overflow-clip"
              emptyMessage="No audit logs found"
            />
          ) : view === "email" ? (
            <Table<EmailLog>
              columns={emailColumns}
              data={emailLogs?.data || []}
              total={emailLogs?.meta?.total || 0}
              idField="id"
              pagination
              loading={emailLoading}
              error={emailError}
              currentPage={emailLogs?.meta?.page}
              totalPages={emailLogs?.meta?.totalPages}
              onPageChange={(page) => handleEmailParamsChange({ page })}
              sort={emailParams.sort}
              order={emailParams.order}
              onSortChange={(newSort, newOrder) => {
                handleEmailParamsChange({
                  sort: newSort as any,
                  order: newOrder as any
                });
              }}
              className="rounded border overflow-clip"
              emptyMessage="No email logs found"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-surface border border-border rounded">
              <div className="text-center p-8">
                <p className="text-text-muted">System logs coming soon</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedLog(null);
        }}
        title="Audit Log Details"
        size="lg">
        {selectedLog && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-text-muted mb-2 block">Timestamp</label>
                <div className="text-sm">
                  {selectedLog.createdAt ? format(new Date(selectedLog.createdAt), "MM/dd/yyyy hh:mm:ss a") : 'N/A'}
                </div>
              </div>
              <div>
                <label className="text-sm text-text-muted mb-2 block">Model</label>
                <StatusBadge label={selectedLog.model} variant="default" />
              </div>
              <div>
                <label className="text-sm text-text-muted mb-2 block">Record ID</label>
                <span className="font-mono text-sm">{selectedLog.recordId}</span>
              </div>
              <div>
                <label className="text-sm text-text-muted mb-2 block">Changed By</label>
                <div className="text-sm">{(selectedLog as any).changedByName || selectedLog.changedBy}</div>
              </div>
            </div>

            <div>
              <label className="text-sm text-text-muted mb-2 block">Changes</label>
              <div className="bg-surface border border-border rounded-lg p-4 max-h-96 overflow-y-auto">
                {selectedLog.diff && typeof selectedLog.diff === 'object' ? (
                  Object.keys(selectedLog.diff).length > 0 ? (
                    <div className="space-y-4">
                      {Object.entries(selectedLog.diff).map(([key, value]) => {
                        const beforeVal = (value as any)?.before;
                        const afterVal = (value as any)?.after;

                        const formatValue = (val: any) => {
                          if (val === null || val === undefined) return 'null';
                          if (typeof val === 'string') return val;
                          if (typeof val === 'boolean') return val.toString();
                          if (typeof val === 'number') return val.toString();
                          return JSON.stringify(val, null, 2);
                        };

                        return (
                          <div key={key} className="border-b border-border pb-3 last:border-b-0">
                            <div className="text-sm font-medium text-text mb-2">{key}</div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <div className="text-xs text-error font-medium mb-1">Before:</div>
                                <div className="bg-error/10 border border-error/50 rounded p-2 font-mono text-xs text-text">
                                  {formatValue(beforeVal)}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-success font-medium mb-1">After:</div>
                                <div className="bg-success/10 border border-success/50 rounded p-2 font-mono text-xs text-text">
                                  {formatValue(afterVal)}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-text-muted text-sm">No changes recorded</div>
                  )
                ) : (
                  <div className="text-text-muted text-sm">Invalid change data</div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isEmailDetailsModalOpen}
        onClose={() => {
          setIsEmailDetailsModalOpen(false);
          setSelectedEmailLog(null);
        }}
        title="Email Log Details"
        size="lg">
        {selectedEmailLog && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-text-muted mb-2 block">Timestamp</label>
                <div className="text-sm">
                  {selectedEmailLog.createdAt ? format(new Date(selectedEmailLog.createdAt), "MM/dd/yyyy hh:mm:ss a") : 'N/A'}
                </div>
              </div>
              <div>
                <label className="text-sm text-text-muted mb-2 block">Status</label>
                <StatusBadge
                  label={selectedEmailLog.status}
                  variant={
                    selectedEmailLog.status === "SENT"
                      ? "success"
                      : selectedEmailLog.status === "FAILED"
                      ? "error"
                      : "default"
                  }
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm text-text-muted mb-2 block">To</label>
                <div className="text-sm">{selectedEmailLog.to}</div>
              </div>
              <div className="col-span-2">
                <label className="text-sm text-text-muted mb-2 block">Subject</label>
                <div className="text-sm">{selectedEmailLog.subject}</div>
              </div>
              {selectedEmailLog.template && (
                <div className="col-span-2">
                  <label className="text-sm text-text-muted mb-2 block">Template</label>
                  <div className="text-sm font-mono bg-surface border border-border rounded p-2">
                    {selectedEmailLog.template}
                  </div>
                </div>
              )}
              {selectedEmailLog.sentAt && (
                <div>
                  <label className="text-sm text-text-muted mb-2 block">Sent At</label>
                  <div className="text-sm">
                    {format(new Date(selectedEmailLog.sentAt), "MM/dd/yyyy hh:mm:ss a")}
                  </div>
                </div>
              )}
              {selectedEmailLog.error && (
                <div className="col-span-2">
                  <label className="text-sm text-text-muted mb-2 block">Error</label>
                  <div className="bg-error/10 border border-error/50 rounded p-3 text-sm text-error">
                    {selectedEmailLog.error}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Logs
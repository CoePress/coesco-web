import type { AuditLog } from "@coesco/types";

import { format } from "date-fns";
import { RefreshCcwIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import type { TableColumn } from "@/components/ui/table";
import type { IApiResponse } from "@/utils/types";

import {
  Button,
  Modal,
  PageHeader,
  StatusBadge,
  Table,
} from "@/components";
import { instance, useApi } from "@/hooks/use-api";

interface EmailLog {
  id: string;
  to: string;
  subject: string;
  template: string | null;
  status: "PENDING" | "SENT" | "FAILED";
  sentAt: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

interface BugReport {
  id: string;
  title: string;
  description: string;
  userEmail: string | null;
  userName: string | null;
  url: string | null;
  userAgent: string | null;
  issueKey: string | null;
  issueUrl: string | null;
  status: "SUBMITTED" | "IN_JIRA" | "FAILED";
  createdAt: string;
  createdById: string | null;
}

interface LoginAttempt {
  id: string;
  userId: string | null;
  username: string | null;
  loginMethod: "PASSWORD" | "MICROSOFT" | "TOKEN";
  success: boolean;
  failureReason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  location: any;
  timestamp: string;
}

interface LogFile {
  name: string;
  size?: number;
  modified?: string;
}

interface BackupFile {
  name: string;
  size?: number;
  modified?: string;
}

type LogView = "audit" | "email" | "bugs" | "login" | "system" | "backups";

function Logs() {
  const [searchParams, setSearchParams] = useSearchParams();

  const getInitialView = (): LogView => {
    const view = searchParams.get("view");
    if (view && ["email", "bugs", "login", "system", "backups"].includes(view)) {
      return view as "email" | "bugs" | "login" | "system" | "backups";
    }
    return "audit";
  };

  const [view, setView] = useState<LogView>(getInitialView);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [selectedEmailLog, setSelectedEmailLog] = useState<EmailLog | null>(null);
  const [selectedBugReport, setSelectedBugReport] = useState<BugReport | null>(null);
  const [selectedLoginAttempt, setSelectedLoginAttempt] = useState<LoginAttempt | null>(null);
  const [selectedLogFile, setSelectedLogFile] = useState<string | null>(null);
  const [logFileContent, setLogFileContent] = useState<string>("");
  const [isPrettyPrint, setIsPrettyPrint] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEmailDetailsModalOpen, setIsEmailDetailsModalOpen] = useState(false);
  const [isBugDetailsModalOpen, setIsBugDetailsModalOpen] = useState(false);
  const [isLoginDetailsModalOpen, setIsLoginDetailsModalOpen] = useState(false);
  const [isLogFileModalOpen, setIsLogFileModalOpen] = useState(false);

  const { get, response: auditLogs, loading, error } = useApi<IApiResponse<AuditLog[]>>();
  const { get: getEmails, response: emailLogs, loading: emailLoading, error: emailError } = useApi<IApiResponse<EmailLog[]>>();
  const { get: getBugs, response: bugReports, loading: bugsLoading, error: bugsError } = useApi<IApiResponse<BugReport[]>>();
  const { get: getLogins, response: loginAttempts, loading: loginsLoading, error: loginsError } = useApi<IApiResponse<LoginAttempt[]>>();
  const { get: getLogFiles, response: logFiles, loading: logFilesLoading, error: logFilesError } = useApi<IApiResponse<string[]>>();
  const { get: getBackupFiles, response: backupFiles, loading: backupFilesLoading, error: backupFilesError } = useApi<IApiResponse<string[]>>();

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

  const [bugParams, setBugParams] = useState({
    sort: "createdAt" as string,
    order: "desc" as "asc" | "desc",
    page: 1,
    limit: 25,
  });

  const [loginParams, setLoginParams] = useState({
    sort: "timestamp" as string,
    order: "desc" as "asc" | "desc",
    page: 1,
    limit: 25,
  });

  const [systemParams, setSystemParams] = useState({
    page: 1,
    limit: 25,
  });

  const [backupParams, setBackupParams] = useState({
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

  const bugQueryParams = useMemo(() => {
    const q: Record<string, string> = {
      sort: bugParams.sort,
      order: bugParams.order,
      page: bugParams.page.toString(),
      limit: bugParams.limit.toString(),
    };

    return q;
  }, [bugParams]);

  const loginQueryParams = useMemo(() => {
    const q: Record<string, string> = {
      sort: loginParams.sort,
      order: loginParams.order,
      page: loginParams.page.toString(),
      limit: loginParams.limit.toString(),
    };

    return q;
  }, [loginParams]);

  const systemQueryParams = useMemo(() => {
    const q: Record<string, string> = {
      page: systemParams.page.toString(),
      limit: systemParams.limit.toString(),
    };

    return q;
  }, [systemParams]);

  const backupQueryParams = useMemo(() => {
    const q: Record<string, string> = {
      page: backupParams.page.toString(),
      limit: backupParams.limit.toString(),
    };

    return q;
  }, [backupParams]);

  const columns: TableColumn<AuditLog>[] = [
    {
      key: "createdAt",
      header: "Timestamp",
      render: (_, row) => (
        <div className="flex flex-col">
          <span>{row.createdAt ? format(new Date(row.createdAt), "MM/dd/yyyy") : "N/A"}</span>
          <span className="text-xs text-text-muted">
            {row.createdAt ? format(new Date(row.createdAt), "hh:mm:ss a") : "N/A"}
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
          }}
        >
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
          <span>{row.createdAt ? format(new Date(row.createdAt), "MM/dd/yyyy") : "N/A"}</span>
          <span className="text-xs text-text-muted">
            {row.createdAt ? format(new Date(row.createdAt), "hh:mm:ss a") : "N/A"}
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
          {row.sentAt
            ? (
                <>
                  <span>{format(new Date(row.sentAt), "MM/dd/yyyy")}</span>
                  <span className="text-xs text-text-muted">
                    {format(new Date(row.sentAt), "hh:mm:ss a")}
                  </span>
                </>
              )
            : (
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
          }}
        >
          View
        </Button>
      ),
    },
  ];

  const logFileColumns: TableColumn<LogFile>[] = [
    {
      key: "name",
      header: "File Name",
      render: (_, row) => (
        <span className="font-mono text-sm">{row.name}</span>
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
          onClick={() => handleViewLogFile(row.name)}
        >
          View
        </Button>
      ),
    },
  ];

  const backupFileColumns: TableColumn<BackupFile>[] = [
    {
      key: "name",
      header: "File Name",
      render: (_, row) => (
        <span className="font-mono text-sm">{row.name}</span>
      ),
    },
  ];

  const bugColumns: TableColumn<BugReport>[] = [
    {
      key: "createdAt",
      header: "Timestamp",
      render: (_, row) => (
        <div className="flex flex-col">
          <span>{row.createdAt ? format(new Date(row.createdAt), "MM/dd/yyyy") : "N/A"}</span>
          <span className="text-xs text-text-muted">
            {row.createdAt ? format(new Date(row.createdAt), "hh:mm:ss a") : "N/A"}
          </span>
        </div>
      ),
    },
    {
      key: "title",
      header: "Title",
      render: (_, row) => (
        <span className="text-sm">{row.title}</span>
      ),
    },
    {
      key: "userName",
      header: "Reported By",
      render: (_, row) => (
        <span className="text-sm">{row.userName || row.userEmail || "-"}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (_, row) => (
        <StatusBadge
          label={row.status}
          variant={
            row.status === "IN_JIRA"
              ? "success"
              : row.status === "FAILED"
                ? "error"
                : "default"
          }
        />
      ),
    },
    {
      key: "issueKey",
      header: "Jira Issue",
      render: (_, row) => (
        row.issueKey && row.issueUrl
          ? (
              <a href={row.issueUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
                {row.issueKey}
              </a>
            )
          : (
              <span className="text-text-muted text-sm">-</span>
            )
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
            setSelectedBugReport(row);
            setIsBugDetailsModalOpen(true);
          }}
        >
          View
        </Button>
      ),
    },
  ];

  const loginColumns: TableColumn<LoginAttempt>[] = [
    {
      key: "timestamp",
      header: "Timestamp",
      render: (_, row) => (
        <div className="flex flex-col">
          <span>{row.timestamp ? format(new Date(row.timestamp), "MM/dd/yyyy") : "N/A"}</span>
          <span className="text-xs text-text-muted">
            {row.timestamp ? format(new Date(row.timestamp), "hh:mm:ss a") : "N/A"}
          </span>
        </div>
      ),
    },
    {
      key: "username",
      header: "Username",
      render: (_, row) => (
        <span className="text-sm">{row.username || "-"}</span>
      ),
    },
    {
      key: "loginMethod",
      header: "Method",
      render: (_, row) => (
        <StatusBadge
          label={row.loginMethod}
          variant="default"
        />
      ),
    },
    {
      key: "success",
      header: "Result",
      render: (_, row) => (
        <StatusBadge
          label={row.success ? "SUCCESS" : "FAILED"}
          variant={row.success ? "success" : "error"}
        />
      ),
    },
    {
      key: "ipAddress",
      header: "IP Address",
      render: (_, row) => (
        <span className="font-mono text-sm">{row.ipAddress || "-"}</span>
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
            setSelectedLoginAttempt(row);
            setIsLoginDetailsModalOpen(true);
          }}
        >
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

  const fetchBugReports = async () => {
    await getBugs("/admin/logs/bugs", bugQueryParams);
  };

  const fetchLoginAttempts = async () => {
    await getLogins("/admin/logs/login-attempts", loginQueryParams);
  };

  const fetchLogFiles = async () => {
    await getLogFiles("/admin/logs/files", systemQueryParams);
  };

  const fetchBackupFiles = async () => {
    await getBackupFiles("/admin/backups", backupQueryParams);
  };

  const handleViewLogFile = async (filename: string) => {
    try {
      const response = await instance.get(`/admin/logs/files/${encodeURIComponent(filename)}`, {
        responseType: "text",
      });
      const content = response.data || "";
      setLogFileContent(content.trim() === "" ? "Log file is empty" : content);
      setSelectedLogFile(filename);
      setIsLogFileModalOpen(true);
    }
    catch (error) {
      console.error("Failed to load log file:", error);
      setLogFileContent("Error loading log file. Please try again.");
    }
  };

  const renderLogLine = (line: string, index: number) => {
    if (!line.trim()) {
      return <div key={index} className="h-4" />;
    }

    try {
      const logEntry = JSON.parse(line);
      const level = logEntry.level?.toLowerCase();

      let levelColor = "text-text";
      switch (level) {
        case "error":
          levelColor = "text-error";
          break;
        case "warn":
          levelColor = "text-warning";
          break;
        case "info":
          levelColor = "text-info";
          break;
        case "http":
          levelColor = "text-text-muted";
          break;
        case "debug":
          levelColor = "text-text-muted";
          break;
        default:
          levelColor = "text-text";
      }

      if (isPrettyPrint) {
        const prettyJson = JSON.stringify(logEntry, null, 2);
        return (
          <div key={index} className="font-mono text-xs mb-4">
            <pre className={levelColor}>{prettyJson}</pre>
          </div>
        );
      }

      return (
        <div key={index} className="font-mono text-xs whitespace-nowrap">
          <span className={levelColor}>{line}</span>
        </div>
      );
    }
    catch {
      return (
        <div key={index} className="font-mono text-xs text-text whitespace-nowrap">
          {line}
        </div>
      );
    }
  };

  const refresh = () => {
    if (view === "audit") {
      fetchAuditLogs();
    }
    else if (view === "email") {
      fetchEmailLogs();
    }
    else if (view === "bugs") {
      fetchBugReports();
    }
    else if (view === "login") {
      fetchLoginAttempts();
    }
    else if (view === "system") {
      fetchLogFiles();
    }
    else if (view === "backups") {
      fetchBackupFiles();
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
    if (view === "bugs") {
      fetchBugReports();
    }
  }, [bugParams]);

  useEffect(() => {
    if (view === "login") {
      fetchLoginAttempts();
    }
  }, [loginParams]);

  useEffect(() => {
    if (view === "system") {
      fetchLogFiles();
    }
  }, [systemParams]);

  useEffect(() => {
    if (view === "backups") {
      fetchBackupFiles();
    }
  }, [backupParams]);

  useEffect(() => {
    const view = searchParams.get("view");
    const newView: LogView
      = (view && ["email", "bugs", "login", "system", "backups"].includes(view)) ? view as "email" | "bugs" | "login" | "system" | "backups" : "audit";

    setView(newView);
  }, [searchParams]);

  useEffect(() => {
    if (view === "audit") {
      fetchAuditLogs();
    }
    else if (view === "email") {
      fetchEmailLogs();
    }
    else if (view === "bugs") {
      fetchBugReports();
    }
    else if (view === "login") {
      fetchLoginAttempts();
    }
    else if (view === "system") {
      fetchLogFiles();
    }
    else if (view === "backups") {
      fetchBackupFiles();
    }
  }, [view]);

  const handleParamsChange = (updates: Partial<typeof params>) => {
    setParams(prev => ({
      ...prev,
      ...updates,
    }));
  };

  const handleEmailParamsChange = (updates: Partial<typeof emailParams>) => {
    setEmailParams(prev => ({
      ...prev,
      ...updates,
    }));
  };

  const handleBugParamsChange = (updates: Partial<typeof bugParams>) => {
    setBugParams(prev => ({
      ...prev,
      ...updates,
    }));
  };

  const handleLoginParamsChange = (updates: Partial<typeof loginParams>) => {
    setLoginParams(prev => ({
      ...prev,
      ...updates,
    }));
  };

  const handleSystemParamsChange = (updates: Partial<typeof systemParams>) => {
    setSystemParams(prev => ({
      ...prev,
      ...updates,
    }));
  };

  const handleBackupParamsChange = (updates: Partial<typeof backupParams>) => {
    setBackupParams(prev => ({
      ...prev,
      ...updates,
    }));
  };

  const handleViewChange = (newView: LogView) => {
    setView(newView);
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      if (newView === "audit") {
        newParams.delete("view");
      }
      else {
        newParams.set("view", newView);
      }
      return newParams;
    });
  };

  const Actions = () => {
    return (
      <div className="flex gap-2">
        <div className="flex gap-1 bg-surface p-1 rounded border border-border">
          <button
            onClick={() => handleViewChange("audit")}
            className={`px-3 py-1 text-sm font-medium rounded transition-colors cursor-pointer ${
              view === "audit"
                ? "bg-primary text-background"
                : "text-text-muted hover:text-text"
            }`}
          >
            Records
          </button>
          <button
            onClick={() => handleViewChange("email")}
            className={`px-3 py-1 text-sm font-medium rounded transition-colors cursor-pointer ${
              view === "email"
                ? "bg-primary text-background"
                : "text-text-muted hover:text-text"
            }`}
          >
            Emails
          </button>
          <button
            onClick={() => handleViewChange("bugs")}
            className={`px-3 py-1 text-sm font-medium rounded transition-colors cursor-pointer ${
              view === "bugs"
                ? "bg-primary text-background"
                : "text-text-muted hover:text-text"
            }`}
          >
            Bugs
          </button>
          <button
            onClick={() => handleViewChange("login")}
            className={`px-3 py-1 text-sm font-medium rounded transition-colors cursor-pointer ${
              view === "login"
                ? "bg-primary text-background"
                : "text-text-muted hover:text-text"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => handleViewChange("system")}
            className={`px-3 py-1 text-sm font-medium rounded transition-colors cursor-pointer ${
              view === "system"
                ? "bg-primary text-background"
                : "text-text-muted hover:text-text"
            }`}
          >
            System
          </button>
          <button
            onClick={() => handleViewChange("backups")}
            className={`px-3 py-1 text-sm font-medium rounded transition-colors cursor-pointer ${
              view === "backups"
                ? "bg-primary text-background"
                : "text-text-muted hover:text-text"
            }`}
          >
            Backups
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
          {view === "audit"
            ? (
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
                  onPageChange={page => handleParamsChange({ page })}
                  sort={params.sort}
                  order={params.order}
                  onSortChange={(newSort, newOrder) => {
                    handleParamsChange({
                      sort: newSort as any,
                      order: newOrder as any,
                    });
                  }}
                  className="rounded border overflow-clip"
                  emptyMessage="No audit logs found"
                />
              )
            : view === "email"
              ? (
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
                    onPageChange={page => handleEmailParamsChange({ page })}
                    sort={emailParams.sort}
                    order={emailParams.order}
                    onSortChange={(newSort, newOrder) => {
                      handleEmailParamsChange({
                        sort: newSort as any,
                        order: newOrder as any,
                      });
                    }}
                    className="rounded border overflow-clip"
                    emptyMessage="No email logs found"
                  />
                )
              : view === "bugs"
                ? (
                    <Table<BugReport>
                      columns={bugColumns}
                      data={bugReports?.data || []}
                      total={bugReports?.meta?.total || 0}
                      idField="id"
                      pagination
                      loading={bugsLoading}
                      error={bugsError}
                      currentPage={bugReports?.meta?.page}
                      totalPages={bugReports?.meta?.totalPages}
                      onPageChange={page => handleBugParamsChange({ page })}
                      sort={bugParams.sort}
                      order={bugParams.order}
                      onSortChange={(newSort, newOrder) => {
                        handleBugParamsChange({
                          sort: newSort as any,
                          order: newOrder as any,
                        });
                      }}
                      className="rounded border overflow-clip"
                      emptyMessage="No bug reports found"
                    />
                  )
                : view === "login"
                  ? (
                      <Table<LoginAttempt>
                        columns={loginColumns}
                        data={loginAttempts?.data || []}
                        total={loginAttempts?.meta?.total || 0}
                        idField="id"
                        pagination
                        loading={loginsLoading}
                        error={loginsError}
                        currentPage={loginAttempts?.meta?.page}
                        totalPages={loginAttempts?.meta?.totalPages}
                        onPageChange={page => handleLoginParamsChange({ page })}
                        sort={loginParams.sort}
                        order={loginParams.order}
                        onSortChange={(newSort, newOrder) => {
                          handleLoginParamsChange({
                            sort: newSort as any,
                            order: newOrder as any,
                          });
                        }}
                        className="rounded border overflow-clip"
                        emptyMessage="No login attempts found"
                      />
                    )
                  : view === "system"
                    ? (
                        <Table<LogFile>
                          columns={logFileColumns}
                          data={(logFiles?.data || []).map(name => ({ name }))}
                          total={logFiles?.meta?.total || logFiles?.data?.length || 0}
                          idField="name"
                          pagination
                          loading={logFilesLoading}
                          error={logFilesError}
                          currentPage={logFiles?.meta?.page || systemParams.page}
                          totalPages={logFiles?.meta?.totalPages || Math.ceil((logFiles?.data?.length || 0) / systemParams.limit)}
                          onPageChange={page => handleSystemParamsChange({ page })}
                          className="rounded border overflow-clip"
                          emptyMessage="No log files found"
                        />
                      )
                    : (
                        <Table<BackupFile>
                          columns={backupFileColumns}
                          data={(backupFiles?.data || []).map(name => ({ name }))}
                          total={backupFiles?.meta?.total || backupFiles?.data?.length || 0}
                          idField="name"
                          pagination
                          loading={backupFilesLoading}
                          error={backupFilesError}
                          currentPage={backupFiles?.meta?.page || backupParams.page}
                          totalPages={backupFiles?.meta?.totalPages || Math.ceil((backupFiles?.data?.length || 0) / backupParams.limit)}
                          onPageChange={page => handleBackupParamsChange({ page })}
                          className="rounded border overflow-clip"
                          emptyMessage="No backup files found"
                        />
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
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-text-muted mb-2 block">Timestamp</label>
                <div className="text-sm">
                  {selectedLog.createdAt ? format(new Date(selectedLog.createdAt), "MM/dd/yyyy hh:mm:ss a") : "N/A"}
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
                {selectedLog.diff && typeof selectedLog.diff === "object"
                  ? (
                      Object.keys(selectedLog.diff).length > 0
                        ? (
                            <div className="space-y-4">
                              {Object.entries(selectedLog.diff).map(([key, value]) => {
                                const beforeVal = (value as any)?.before;
                                const afterVal = (value as any)?.after;

                                const formatValue = (val: any) => {
                                  if (val === null || val === undefined)
                                    return "null";
                                  if (typeof val === "string")
                                    return val;
                                  if (typeof val === "boolean")
                                    return val.toString();
                                  if (typeof val === "number")
                                    return val.toString();
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
                          )
                        : (
                            <div className="text-text-muted text-sm">No changes recorded</div>
                          )
                    )
                  : (
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
        size="lg"
      >
        {selectedEmailLog && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-text-muted mb-2 block">Timestamp</label>
                <div className="text-sm">
                  {selectedEmailLog.createdAt ? format(new Date(selectedEmailLog.createdAt), "MM/dd/yyyy hh:mm:ss a") : "N/A"}
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

      <Modal
        isOpen={isBugDetailsModalOpen}
        onClose={() => {
          setIsBugDetailsModalOpen(false);
          setSelectedBugReport(null);
        }}
        title="Bug Report Details"
        size="lg"
      >
        {selectedBugReport && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-text-muted mb-2 block">Timestamp</label>
                <div className="text-sm">
                  {selectedBugReport.createdAt ? format(new Date(selectedBugReport.createdAt), "MM/dd/yyyy hh:mm:ss a") : "N/A"}
                </div>
              </div>
              <div>
                <label className="text-sm text-text-muted mb-2 block">Status</label>
                <StatusBadge
                  label={selectedBugReport.status}
                  variant={
                    selectedBugReport.status === "IN_JIRA"
                      ? "success"
                      : selectedBugReport.status === "FAILED"
                        ? "error"
                        : "default"
                  }
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm text-text-muted mb-2 block">Title</label>
                <div className="text-sm font-medium">{selectedBugReport.title}</div>
              </div>
              <div className="col-span-2">
                <label className="text-sm text-text-muted mb-2 block">Description</label>
                <div className="text-sm bg-surface border border-border rounded p-3 whitespace-pre-wrap">
                  {selectedBugReport.description}
                </div>
              </div>
              {selectedBugReport.userName && (
                <div>
                  <label className="text-sm text-text-muted mb-2 block">Reported By</label>
                  <div className="text-sm">{selectedBugReport.userName}</div>
                </div>
              )}
              {selectedBugReport.userEmail && (
                <div>
                  <label className="text-sm text-text-muted mb-2 block">Email</label>
                  <div className="text-sm">{selectedBugReport.userEmail}</div>
                </div>
              )}
              {selectedBugReport.url && (
                <div className="col-span-2">
                  <label className="text-sm text-text-muted mb-2 block">Page URL</label>
                  <div className="text-sm font-mono bg-surface border border-border rounded p-2 break-all">
                    {selectedBugReport.url}
                  </div>
                </div>
              )}
              {selectedBugReport.userAgent && (
                <div className="col-span-2">
                  <label className="text-sm text-text-muted mb-2 block">User Agent</label>
                  <div className="text-sm font-mono bg-surface border border-border rounded p-2 text-xs">
                    {selectedBugReport.userAgent}
                  </div>
                </div>
              )}
              {selectedBugReport.issueKey && selectedBugReport.issueUrl && (
                <div className="col-span-2">
                  <label className="text-sm text-text-muted mb-2 block">Jira Issue</label>
                  <div className="text-sm">
                    <a href={selectedBugReport.issueUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {selectedBugReport.issueKey}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isLoginDetailsModalOpen}
        onClose={() => {
          setIsLoginDetailsModalOpen(false);
          setSelectedLoginAttempt(null);
        }}
        title="Login Attempt Details"
        size="lg"
      >
        {selectedLoginAttempt && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-text-muted mb-2 block">Timestamp</label>
                <div className="text-sm">
                  {selectedLoginAttempt.timestamp ? format(new Date(selectedLoginAttempt.timestamp), "MM/dd/yyyy hh:mm:ss a") : "N/A"}
                </div>
              </div>
              <div>
                <label className="text-sm text-text-muted mb-2 block">Result</label>
                <StatusBadge
                  label={selectedLoginAttempt.success ? "SUCCESS" : "FAILED"}
                  variant={selectedLoginAttempt.success ? "success" : "error"}
                />
              </div>
              {selectedLoginAttempt.username && (
                <div>
                  <label className="text-sm text-text-muted mb-2 block">Username</label>
                  <div className="text-sm">{selectedLoginAttempt.username}</div>
                </div>
              )}
              <div>
                <label className="text-sm text-text-muted mb-2 block">Login Method</label>
                <StatusBadge label={selectedLoginAttempt.loginMethod} variant="default" />
              </div>
              {selectedLoginAttempt.ipAddress && (
                <div>
                  <label className="text-sm text-text-muted mb-2 block">IP Address</label>
                  <div className="text-sm font-mono">{selectedLoginAttempt.ipAddress}</div>
                </div>
              )}
              {selectedLoginAttempt.failureReason && (
                <div className="col-span-2">
                  <label className="text-sm text-text-muted mb-2 block">Failure Reason</label>
                  <div className="bg-error/10 border border-error/50 rounded p-3 text-sm text-error">
                    {selectedLoginAttempt.failureReason}
                  </div>
                </div>
              )}
              {selectedLoginAttempt.userAgent && (
                <div className="col-span-2">
                  <label className="text-sm text-text-muted mb-2 block">User Agent</label>
                  <div className="text-sm font-mono bg-surface border border-border rounded p-2 text-xs">
                    {selectedLoginAttempt.userAgent}
                  </div>
                </div>
              )}
              {selectedLoginAttempt.location && (
                <div className="col-span-2">
                  <label className="text-sm text-text-muted mb-2 block">Location</label>
                  <div className="text-sm bg-surface border border-border rounded p-3 font-mono text-xs">
                    <pre>{JSON.stringify(selectedLoginAttempt.location, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isLogFileModalOpen}
        onClose={() => {
          setIsLogFileModalOpen(false);
          setSelectedLogFile(null);
          setLogFileContent("");
          setIsPrettyPrint(false);
        }}
        title={`Log File: ${selectedLogFile || ""}`}
        size="xl"
        overflow="auto"
        headerActions={(
          <Button
            variant={isPrettyPrint ? "primary" : "secondary-outline"}
            size="sm"
            onClick={() => setIsPrettyPrint(!isPrettyPrint)}
          >
            Pretty
          </Button>
        )}
      >
        <div className="bg-surface border border-border rounded-lg p-4 overflow-auto">
          {logFileContent
            ? (
                logFileContent === "Log file is empty" || logFileContent === "Error loading log file. Please try again."
                  ? (
                      <div className="text-text-muted text-sm">{logFileContent}</div>
                    )
                  : (
                      <div className="space-y-0.5">
                        {logFileContent.split("\n").map((line, index) => renderLogLine(line, index))}
                      </div>
                    )
              )
            : (
                <div className="text-text-muted text-sm">Loading...</div>
              )}
        </div>
      </Modal>
    </div>
  );
}

export default Logs;

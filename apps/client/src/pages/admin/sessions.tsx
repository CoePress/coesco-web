import { useMemo, useState, useEffect } from "react";

import {
  StatusBadge,
  PageHeader,
  Table,
  Button,
  Modal,
  Toolbar,
} from "@/components";
import { TableColumn } from "@/components/ui/table";
import { useApi } from "@/hooks/use-api";
import { IApiResponse } from "@/utils/types";
import { format } from "date-fns";
import { Filter } from "@/components/feature/toolbar";
import { useToast } from "@/hooks/use-toast";
import { RefreshCcwIcon } from "lucide-react";
import { useAuth } from "@/contexts/auth.context";

interface Session {
  id: string;
  userId: string;
  token: string;
  refreshToken?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: string;
  deviceName?: string;
  loginMethod: string;
  loginAt: string;
  lastActivityAt: string;
  expiresAt: string;
  revokedAt?: string;
  revokedReason?: string;
  logoutAt?: string;
  isActive: boolean;
  isSuspicious: boolean;
  suspiciousReason?: string;
  user?: {
    username: string;
    employee?: {
      firstName: string;
      lastName: string;
    };
  };
}

const Sessions = () => {
  const toast = useToast();
  const { sessionId: currentSessionId } = useAuth();
  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  const { get, response: sessions, loading, error } = useApi<IApiResponse<Session[]>>();

  const [params, setParams] = useState({
    sort: "lastActivityAt" as string,
    order: "desc" as "asc" | "desc",
    page: 1,
    limit: 25,
    filter: { isActive: "true" },
    include: ["user.employee"] as string[],
    search: "",
  });

  const queryParams = useMemo(() => {
    const q: Record<string, string> = {
      sort: params.sort,
      order: params.order,
      page: params.page.toString(),
      limit: params.limit.toString(),
    };

    const activeFilters = Object.fromEntries(
      Object.entries(params.filter).filter(([_, value]) => value),
    );

    if (Object.keys(activeFilters).length > 0) {
      q.filter = JSON.stringify(activeFilters);
    }

    if (params.include.length > 0) {
      q.include = JSON.stringify(params.include);
    }

    if (params.search) {
      q.search = params.search;
    }

    return q;
  }, [params]);

  const columns: TableColumn<Session>[] = [
    {
      key: "user.employee.lastName",
      header: "User",
      render: (_, row) => (
        <p>
          <span>
            {row.user?.employee?.firstName} {row.user?.employee?.lastName}
          </span>
          <br />
          <span className="text-xs text-text-muted">{row.user?.username}</span>
        </p>
      ),
    },
    {
      key: "deviceName",
      header: "Device",
      render: (_, row) => (
        <p>
          <span>{row.deviceName || "Unknown"}</span>
          <br />
          <span className="text-xs text-text-muted">{row.ipAddress || "N/A"}</span>
        </p>
      ),
    },
    {
      key: "loginMethod",
      header: "Method",
      render: (_, row) => (
        <StatusBadge
          label={row.loginMethod}
          variant={row.loginMethod === "PASSWORD" ? "info" : "warning"}
        />
      ),
    },
    {
      key: "loginAt",
      header: "Login",
      render: (_, row) => format(new Date(row.loginAt), "MM/dd/yyyy hh:mm a"),
    },
    {
      key: "lastActivityAt",
      header: "Last Activity",
      render: (_, row) => format(new Date(row.lastActivityAt), "MM/dd/yyyy hh:mm a"),
    },
    {
      key: "isActive",
      header: "Status",
      render: (_, row) => {
        if (row.revokedAt) {
          return <StatusBadge label="Revoked" variant="error" />;
        }
        if (row.logoutAt) {
          return <StatusBadge label="Logged Out" variant="default" />;
        }
        if (new Date(row.expiresAt) < new Date()) {
          return <StatusBadge label="Expired" variant="warning" />;
        }
        if (row.isSuspicious) {
          return <StatusBadge label="Suspicious" variant="error" />;
        }
        if (row.isActive) {
          return <StatusBadge label="Active" variant="success" />;
        }
        return <StatusBadge label="Inactive" variant="default" />;
      },
    },
    {
      key: "actions",
      header: "",
      className: "w-1",
      sortable: false,
      render: (_, row) => {
        const isCurrentSession = row.id === currentSessionId;
        return (
          <Button
            variant="secondary-outline"
            size="sm"
            onClick={(e) => {
              e?.stopPropagation();
              setSelectedSession(row);
              setIsRevokeModalOpen(true);
            }}
            disabled={!row.isActive || !!row.revokedAt || isCurrentSession}
            title={isCurrentSession ? "Cannot revoke your current session" : undefined}
          >
            Revoke
          </Button>
        );
      },
    },
  ];

  const fetchSessions = async () => {
    await get("/admin/sessions", queryParams);
  };

  const refresh = () => {
    fetchSessions();
  };

  useEffect(() => {
    fetchSessions();
  }, [params]);

  const handleSearch = (query: string) => {
    handleParamsChange({
      search: query,
      page: 1,
    });
  };

  const handleParamsChange = (updates: Partial<typeof params>) => {
    setParams((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  const handleFilterChange = (key: string, value: string) => {
    handleParamsChange({
      filter: { ...params.filter, [key]: value },
    });
  };

  const filters: Filter[] = [
    {
      key: "isActive",
      label: "Status",
      options: [
        { value: "", label: "All" },
        { value: "true", label: "Active" },
        { value: "false", label: "Inactive" },
      ],
      placeholder: "Status",
    },
    {
      key: "loginMethod",
      label: "Method",
      options: [
        { value: "", label: "All" },
        { value: "PASSWORD", label: "Password" },
        { value: "MICROSOFT", label: "Microsoft" },
      ],
      placeholder: "Method",
    },
    {
      key: "isSuspicious",
      label: "Suspicious",
      options: [
        { value: "", label: "All" },
        { value: "true", label: "Yes" },
        { value: "false", label: "No" },
      ],
      placeholder: "Suspicious",
    },
  ];

  const Actions = () => {
    return (
      <div className="flex gap-2">
        <Button onClick={refresh} variant="primary" className="px-2" disabled={loading}>
          <RefreshCcwIcon size={16} />
        </Button>
      </div>
    );
  };

  return (
    <div className="w-full flex-1 flex flex-col overflow-hidden">
      <PageHeader
        title="Sessions"
        description="View and manage active user sessions"
        actions={<Actions />}
      />

      <div className="p-2 flex flex-col flex-1 overflow-hidden gap-2">
        <Toolbar
          onSearch={handleSearch}
          searchPlaceholder="Search sessions..."
          filters={filters}
          onFilterChange={handleFilterChange}
          filterValues={params.filter}
        />

        <div className="flex-1 overflow-hidden">
          <Table<Session>
            columns={columns}
            data={sessions?.data || []}
            total={sessions?.meta?.total || 0}
            idField="id"
            pagination
            loading={loading}
            error={error}
            currentPage={sessions?.meta?.page}
            totalPages={sessions?.meta?.totalPages}
            onPageChange={(page) => handleParamsChange({ page })}
            sort={params.sort}
            order={params.order}
            onSortChange={(newSort, newOrder) => {
              handleParamsChange({
                sort: newSort as any,
                order: newOrder as any,
              });
            }}
            className="rounded border overflow-clip"
            emptyMessage="No sessions found"
          />
        </div>
      </div>

      {isRevokeModalOpen && selectedSession && (
        <RevokeSessionModal
          isOpen={isRevokeModalOpen}
          onClose={() => {
            setIsRevokeModalOpen(false);
            setSelectedSession(null);
          }}
          session={selectedSession}
          onSuccess={refresh}
        />
      )}
    </div>
  );
};

const RevokeSessionModal = ({
  isOpen,
  onClose,
  session,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  session: Session;
  onSuccess: () => void;
}) => {
  const [reason, setReason] = useState("");
  const { post: revokeSession, loading } = useApi<IApiResponse<any>>();
  const toast = useToast();

  const handleRevokeSession = async () => {
    try {
      const response = await revokeSession(`/admin/sessions/${session.id}/revoke`, {
        reason: reason || undefined,
      });

      if (response?.success) {
        toast.success("Session revoked successfully!");
        onClose();
        onSuccess();
      } else {
        toast.error("Failed to revoke session. Please try again.");
      }
    } catch (error) {
      console.error("Error revoking session:", error);
      toast.error("An unexpected error occurred while revoking the session.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Revoke Session" size="xs">
      <div className="space-y-4">
        <div className="bg-surface border border-border rounded p-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-muted">User:</span>
            <span className="font-medium text-text">
              {session.user?.employee?.firstName} {session.user?.employee?.lastName}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Device:</span>
            <span className="font-medium text-text">{session.deviceName || "Unknown"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">IP Address:</span>
            <span className="font-medium text-text">{session.ipAddress || "N/A"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Login:</span>
            <span className="font-medium text-text">
              {format(new Date(session.loginAt), "MM/dd/yyyy hh:mm a")}
            </span>
          </div>
        </div>

        <div>
          <label className="text-sm text-text-muted mb-2 block">
            Reason (optional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason for revoking this session..."
            className="block w-full rounded border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-text placeholder:text-text-muted bg-surface resize-none"
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="secondary-outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleRevokeSession} disabled={loading} variant="error">
            {loading ? "Revoking..." : "Revoke Session"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default Sessions;

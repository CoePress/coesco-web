import { useEffect, useState } from "react";
import { Users, Activity, AlertTriangle, Shield, RefreshCcw } from "lucide-react";
import { formatDistance } from "date-fns";

import { Button, Loader, PageHeader } from "@/components";
import Metrics, { MetricsCard } from "@/components/ui/metrics";
import { useApi } from "@/hooks/use-api";
import { IApiResponse } from "@/utils/types";

type AdminDashboardMetrics = {
  activeSessionsCount: number;
  totalSessionsCount: number;
  recentLoginActivity: {
    last24h: number;
    last7d: number;
    last30d: number;
  };
  failedLoginAttempts: {
    last24h: number;
    last7d: number;
    last30d: number;
  };
  sessionsByUser: Array<{
    userId: string;
    username: string;
    firstName?: string;
    lastName?: string;
    activeSessionCount: number;
  }>;
  recentlyRevokedSessions: Array<{
    id: string;
    userId: string;
    username: string;
    revokedAt: Date;
    revokedReason: string | null;
    deviceName: string | null;
    ipAddress: string | null;
  }>;
  suspiciousActivityCount: number;
};

const AdminDashboard = () => {
  const { get } = useApi<IApiResponse<AdminDashboardMetrics>>();
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    const response = await get("/admin/sessions/dashboard-metrics");

    if (response?.success) {
      setMetrics(response.data || null);
    } else {
      setError(response?.error || "Failed to fetch metrics");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const kpis = [
    {
      title: "Active Sessions",
      value: metrics?.activeSessionsCount ?? 0,
      description: "Currently active user sessions",
      icon: <Activity size={16} />,
    },
    {
      title: "Logins (24h)",
      value: metrics?.recentLoginActivity.last24h ?? 0,
      description: "Successful logins in last 24 hours",
      icon: <Users size={16} />,
    },
    {
      title: "Failed Logins (24h)",
      value: metrics?.failedLoginAttempts.last24h ?? 0,
      description: "Failed login attempts in last 24 hours",
      icon: <AlertTriangle size={16} />,
    },
    {
      title: "Suspicious Activity",
      value: metrics?.suspiciousActivityCount ?? 0,
      description: "Sessions flagged as suspicious",
      icon: <Shield size={16} />,
    },
  ];

  const Actions = () => {
    return (
      <div className="flex gap-2 items-center">
        <Button onClick={fetchMetrics} variant="primary" className="px-2">
          <RefreshCcw size={16} />
        </Button>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-1 flex-col">
      <PageHeader
        title="Admin Dashboard"
        description="System metrics and security monitoring"
        actions={<Actions />}
      />

      {error && (
        <div className="p-2">
          <p className="text-error">Error loading data</p>
        </div>
      )}

      <div className="p-2 gap-2 flex flex-col flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader />
          </div>
        ) : (
          <>
            <Metrics>
              {kpis.map((metric, idx) => (
                <MetricsCard key={idx} {...metric} />
              ))}
              </Metrics>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 overflow-hidden">
              <div className="bg-foreground rounded border border-border flex flex-col overflow-hidden">
                <div className="p-2 border-b flex items-center justify-between">
                  <h3 className="text-sm text-text-muted">
                    Recent Login Activity
                  </h3>
                </div>
                <div className="p-2 space-y-2 overflow-y-auto">
                  <div className="flex justify-between items-center p-2 bg-surface rounded">
                    <span className="text-sm text-text-muted">Last 24 Hours</span>
                    <span className="text-sm font-medium text-text-muted">
                      {metrics?.recentLoginActivity.last24h ?? 0} logins
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-surface rounded">
                    <span className="text-sm text-text-muted">Last 7 Days</span>
                    <span className="text-sm font-medium text-text-muted">
                      {metrics?.recentLoginActivity.last7d ?? 0} logins
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-surface rounded">
                    <span className="text-sm text-text-muted">Last 30 Days</span>
                    <span className="text-sm font-medium text-text-muted">
                      {metrics?.recentLoginActivity.last30d ?? 0} logins
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-foreground rounded border border-border flex flex-col overflow-hidden">
                <div className="p-2 border-b flex items-center justify-between">
                  <h3 className="text-sm text-text-muted">
                    Failed Login Attempts
                  </h3>
                </div>
                <div className="p-2 space-y-2 overflow-y-auto">
                  <div className="flex justify-between items-center p-2 bg-surface rounded">
                    <span className="text-sm text-text-muted">Last 24 Hours</span>
                    <span className="text-sm font-medium text-error">
                      {metrics?.failedLoginAttempts.last24h ?? 0} attempts
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-surface rounded">
                    <span className="text-sm text-text-muted">Last 7 Days</span>
                    <span className="text-sm font-medium text-error">
                      {metrics?.failedLoginAttempts.last7d ?? 0} attempts
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-surface rounded">
                    <span className="text-sm text-text-muted">Last 30 Days</span>
                    <span className="text-sm font-medium text-error">
                      {metrics?.failedLoginAttempts.last30d ?? 0} attempts
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-foreground rounded border border-border flex flex-col overflow-hidden">
                <div className="p-2 border-b flex items-center justify-between">
                  <h3 className="text-sm text-text-muted">
                    Users with Multiple Sessions
                  </h3>
                </div>
                <div className="p-2 space-y-2 overflow-y-auto">
                  {metrics?.sessionsByUser && metrics.sessionsByUser.length > 0 ? (
                    metrics.sessionsByUser.map((user) => (
                      <div
                        key={user.userId}
                        className="flex justify-between items-center p-2 bg-surface rounded border border-border"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-text-muted">
                            {user.firstName && user.lastName
                              ? `${user.firstName} ${user.lastName}`
                              : user.username}
                          </span>
                          {user.firstName && user.lastName && (
                            <span className="text-xs text-text-muted">
                              @{user.username}
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-medium text-primary">
                          {user.activeSessionCount} sessions
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-text-muted text-sm py-2 text-center">
                      No users with multiple sessions
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-foreground rounded border border-border flex flex-col overflow-hidden">
                <div className="p-2 border-b flex items-center justify-between">
                  <h3 className="text-sm text-text-muted">
                    Recently Revoked Sessions
                  </h3>
                </div>
                <div className="p-2 space-y-2 overflow-y-auto">
                  {metrics?.recentlyRevokedSessions && metrics.recentlyRevokedSessions.length > 0 ? (
                    metrics.recentlyRevokedSessions.map((session) => (
                      <div
                        key={session.id}
                        className="p-2 bg-surface rounded border border-border"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-medium text-text-muted">
                            {session.username}
                          </span>
                          <span className="text-xs text-text-muted">
                            {formatDistance(new Date(session.revokedAt), new Date(), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                        {session.deviceName && (
                          <div className="text-xs text-text-muted">
                            {session.deviceName}
                          </div>
                        )}
                        {session.revokedReason && (
                          <div className="text-xs text-text-muted mt-1 italic">
                            {session.revokedReason}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-text-muted text-sm py-2 text-center">
                      No recently revoked sessions
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
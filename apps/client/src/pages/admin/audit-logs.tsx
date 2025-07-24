import { useState } from "react";
import {
  Calendar,
  RefreshCcw,
  Filter,
  User,
  Database,
  AlertTriangle,
  Eye,
  Download,
  Search,
  Shield,
} from "lucide-react";
import { PageHeader } from "@/components";

// Type definitions for audit logs

type ActionType =
  | "LOGIN"
  | "LOGOUT"
  | "FAILED_LOGIN"
  | "PASSWORD_RESET"
  | "VIEW_PAGE"
  | "VIEW_REPORT"
  | "DOWNLOAD_FILE"
  | "SEARCH"
  | "ACCESS_GRANTED"
  | "ACCESS_DENIED"
  | "ROLE_CHANGE"
  | "INSERT"
  | "UPDATE"
  | "DELETE";

interface UserActionLog {
  id: number;
  timestamp: string;
  action: ActionType;
  user: string;
  ip?: string;
  resource?: string;
  details: string;
}

interface DataChangeLog {
  id: number;
  timestamp: string;
  action: ActionType;
  user: string;
  table: string;
  recordId: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  details: string;
}

interface UserActions {
  authentication: UserActionLog[];
  navigation: UserActionLog[];
  permissions: UserActionLog[];
}

interface DataChanges {
  customers: DataChangeLog[];
  products: DataChangeLog[];
  orders: DataChangeLog[];
}

type AuditType = "user-actions" | "data-changes";

const AuditLogs = () => {
  const userActions: UserActions = {
    authentication: [
      {
        id: 1,
        timestamp: "2024-01-15 10:30:00",
        action: "LOGIN",
        user: "john.doe@company.com",
        ip: "192.168.1.100",
        details: "Successful login via web portal",
      },
      {
        id: 2,
        timestamp: "2024-01-15 16:45:00",
        action: "LOGOUT",
        user: "john.doe@company.com",
        ip: "192.168.1.100",
        details: "User logged out",
      },
      {
        id: 3,
        timestamp: "2024-01-16 09:00:00",
        action: "FAILED_LOGIN",
        user: "bob.wilson@company.com",
        ip: "203.0.113.42",
        details: "Failed login attempt - invalid password",
      },
      {
        id: 4,
        timestamp: "2024-01-16 09:15:00",
        action: "PASSWORD_RESET",
        user: "bob.wilson@company.com",
        ip: "203.0.113.42",
        details: "Password reset requested",
      },
    ],
    navigation: [
      {
        id: 1,
        timestamp: "2024-01-15 10:35:00",
        action: "VIEW_PAGE",
        user: "john.doe@company.com",
        resource: "/dashboard",
        details: "Accessed main dashboard",
      },
      {
        id: 2,
        timestamp: "2024-01-15 10:45:00",
        action: "VIEW_REPORT",
        user: "john.doe@company.com",
        resource: "/reports/sales",
        details: "Viewed sales report for Q4 2023",
      },
      {
        id: 3,
        timestamp: "2024-01-15 11:00:00",
        action: "DOWNLOAD_FILE",
        user: "jane.smith@company.com",
        resource: "customer_data.xlsx",
        details: "Downloaded customer export file",
      },
      {
        id: 4,
        timestamp: "2024-01-15 14:20:00",
        action: "SEARCH",
        user: "jane.smith@company.com",
        resource: "customers",
        details: 'Searched for "john smith" in customer database',
      },
    ],
    permissions: [
      {
        id: 1,
        timestamp: "2024-01-15 11:30:00",
        action: "ACCESS_GRANTED",
        user: "admin@company.com",
        resource: "admin_panel",
        details: "Admin access granted to user management",
      },
      {
        id: 2,
        timestamp: "2024-01-15 15:20:00",
        action: "ACCESS_DENIED",
        user: "user@company.com",
        resource: "financial_reports",
        details: "Insufficient permissions for financial data",
      },
      {
        id: 3,
        timestamp: "2024-01-16 08:45:00",
        action: "ROLE_CHANGE",
        user: "admin@company.com",
        resource: "user_roles",
        details: 'Changed user role from "viewer" to "editor"',
      },
    ],
  };

  const dataChanges: DataChanges = {
    customers: [
      {
        id: 1,
        timestamp: "2024-01-15 11:15:00",
        action: "INSERT",
        user: "jane.smith@company.com",
        table: "customers",
        recordId: "CUST-789",
        field: null,
        oldValue: null,
        newValue: '{"name": "Acme Corp", "email": "contact@acme.com"}',
        details: "New customer record created",
      },
      {
        id: 2,
        timestamp: "2024-01-15 13:30:00",
        action: "UPDATE",
        user: "john.doe@company.com",
        table: "customers",
        recordId: "CUST-456",
        field: "email",
        oldValue: "old@company.com",
        newValue: "new@company.com",
        details: "Email address updated",
      },
      {
        id: 3,
        timestamp: "2024-01-15 15:45:00",
        action: "UPDATE",
        user: "jane.smith@company.com",
        table: "customers",
        recordId: "CUST-123",
        field: "status",
        oldValue: "active",
        newValue: "inactive",
        details: "Customer status changed to inactive",
      },
      {
        id: 4,
        timestamp: "2024-01-16 10:00:00",
        action: "DELETE",
        user: "admin@company.com",
        table: "customers",
        recordId: "CUST-999",
        field: null,
        oldValue: '{"name": "Test Customer"}',
        newValue: null,
        details: "Customer record deleted",
      },
    ],
    products: [
      {
        id: 1,
        timestamp: "2024-01-15 08:30:00",
        action: "INSERT",
        user: "product-manager@company.com",
        table: "products",
        recordId: "PROD-101",
        field: null,
        oldValue: null,
        newValue: '{"name": "Widget Pro", "price": 99.99}',
        details: "New product added to catalog",
      },
      {
        id: 2,
        timestamp: "2024-01-15 10:45:00",
        action: "UPDATE",
        user: "pricing-admin@company.com",
        table: "products",
        recordId: "PROD-101",
        field: "price",
        oldValue: "99.99",
        newValue: "89.99",
        details: "Product price updated",
      },
      {
        id: 3,
        timestamp: "2024-01-15 14:15:00",
        action: "UPDATE",
        user: "inventory-system",
        table: "products",
        recordId: "PROD-101",
        field: "stock_quantity",
        oldValue: "100",
        newValue: "150",
        details: "Stock quantity updated",
      },
      {
        id: 4,
        timestamp: "2024-01-16 11:00:00",
        action: "UPDATE",
        user: "product-manager@company.com",
        table: "products",
        recordId: "PROD-102",
        field: "status",
        oldValue: "active",
        newValue: "discontinued",
        details: "Product marked as discontinued",
      },
    ],
    orders: [
      {
        id: 1,
        timestamp: "2024-01-15 12:00:00",
        action: "INSERT",
        user: "system@company.com",
        table: "orders",
        recordId: "ORD-12345",
        field: null,
        oldValue: null,
        newValue: '{"customer_id": 789, "total": 149.99}',
        details: "New order created",
      },
      {
        id: 2,
        timestamp: "2024-01-15 13:30:00",
        action: "UPDATE",
        user: "fulfillment@company.com",
        table: "orders",
        recordId: "ORD-12345",
        field: "status",
        oldValue: "pending",
        newValue: "processing",
        details: "Order status updated",
      },
      {
        id: 3,
        timestamp: "2024-01-15 18:00:00",
        action: "UPDATE",
        user: "shipping@company.com",
        table: "orders",
        recordId: "ORD-12345",
        field: "tracking_number",
        oldValue: null,
        newValue: "FEDEX123456",
        details: "Tracking number added",
      },
      {
        id: 4,
        timestamp: "2024-01-16 09:30:00",
        action: "DELETE",
        user: "admin@company.com",
        table: "orders",
        recordId: "ORD-12346",
        field: null,
        oldValue: '{"status": "cancelled"}',
        newValue: null,
        details: "Cancelled order removed from system",
      },
    ],
  };

  const [auditType, setAuditType] = useState<AuditType>("user-actions");
  const [selectedCategory, setSelectedCategory] =
    useState<string>("authentication");

  const getCurrentData = (): UserActions | DataChanges => {
    return auditType === "user-actions" ? userActions : dataChanges;
  };

  const getCurrentCategories = (): string[] => {
    return Object.keys(getCurrentData());
  };

  const getActionIcon = (action: ActionType) => {
    const icons: Record<ActionType, React.ReactElement> = {
      LOGIN: (
        <User
          size={12}
          className="text-success"
        />
      ),
      LOGOUT: (
        <User
          size={12}
          className="text-text-muted"
        />
      ),
      FAILED_LOGIN: (
        <AlertTriangle
          size={12}
          className="text-error"
        />
      ),
      PASSWORD_RESET: (
        <Shield
          size={12}
          className="text-warning"
        />
      ),
      VIEW_PAGE: (
        <Eye
          size={12}
          className="text-info"
        />
      ),
      VIEW_REPORT: (
        <Eye
          size={12}
          className="text-info"
        />
      ),
      DOWNLOAD_FILE: (
        <Download
          size={12}
          className="text-purple-500"
        />
      ),
      SEARCH: (
        <Search
          size={12}
          className="text-blue-500"
        />
      ),
      ACCESS_GRANTED: (
        <Shield
          size={12}
          className="text-success"
        />
      ),
      ACCESS_DENIED: (
        <Shield
          size={12}
          className="text-error"
        />
      ),
      ROLE_CHANGE: (
        <Shield
          size={12}
          className="text-warning"
        />
      ),
      INSERT: (
        <Database
          size={12}
          className="text-success"
        />
      ),
      UPDATE: (
        <Database
          size={12}
          className="text-info"
        />
      ),
      DELETE: (
        <Database
          size={12}
          className="text-error"
        />
      ),
    };
    return (
      icons[action as keyof typeof icons] || (
        <Database
          size={12}
          className="text-text-muted"
        />
      )
    );
  };

  const getActionColor = (action: ActionType): string => {
    const colors: Record<ActionType, string> = {
      LOGIN: "text-success bg-success/10",
      LOGOUT: "text-text-muted bg-surface",
      FAILED_LOGIN: "text-error bg-error/10",
      PASSWORD_RESET: "text-warning bg-warning/10",
      VIEW_PAGE: "text-info bg-info/10",
      VIEW_REPORT: "text-info bg-info/10",
      DOWNLOAD_FILE: "text-purple-500 bg-purple-100",
      SEARCH: "text-blue-500 bg-blue-100",
      ACCESS_GRANTED: "text-success bg-success/10",
      ACCESS_DENIED: "text-error bg-error/10",
      ROLE_CHANGE: "text-warning bg-warning/10",
      INSERT: "text-success bg-success/10",
      UPDATE: "text-info bg-info/10",
      DELETE: "text-error bg-error/10",
    };
    return (
      colors[action as keyof typeof colors] || "text-text-muted bg-surface"
    );
  };

  const renderUserActionTable = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
              Timestamp
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
              Action
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
              User
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
              Resource/IP
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
              Details
            </th>
          </tr>
        </thead>
        <tbody>
          {(getCurrentData() as UserActions)[
            selectedCategory as keyof UserActions
          ].map((log: UserActionLog, index: number) => (
            <tr
              key={log.id}
              className={`border-b border-border hover:bg-surface/50 ${index % 2 === 0 ? "bg-background" : "bg-surface/20"}`}>
              <td className="px-4 py-3 text-sm text-text-muted">
                {log.timestamp}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {getActionIcon(log.action)}
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getActionColor(log.action)}`}>
                    {log.action}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-text-muted">{log.user}</td>
              <td className="px-4 py-3 text-sm text-text-muted">
                {log.ip || log.resource || "-"}
              </td>
              <td className="px-4 py-3 text-sm text-text-muted">
                {log.details}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderDataChangeTable = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
              Timestamp
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
              Action
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
              User
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
              Table
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
              Record ID
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
              Field
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
              Old Value
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
              New Value
            </th>
          </tr>
        </thead>
        <tbody>
          {(getCurrentData() as DataChanges)[
            selectedCategory as keyof DataChanges
          ].map((log: DataChangeLog, index: number) => (
            <tr
              key={log.id}
              className={`border-b border-border hover:bg-surface/50 ${index % 2 === 0 ? "bg-background" : "bg-surface/20"}`}>
              <td className="px-4 py-3 text-sm text-text-muted">
                {log.timestamp}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {getActionIcon(log.action)}
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getActionColor(log.action)}`}>
                    {log.action}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-text-muted">{log.user}</td>
              <td className="px-4 py-3 text-sm text-text-muted">{log.table}</td>
              <td className="px-4 py-3 text-sm text-text-muted">
                {log.recordId}
              </td>
              <td className="px-4 py-3 text-sm text-text-muted">
                {log.field || "-"}
              </td>
              <td className="px-4 py-3 text-sm text-text-muted max-w-xs truncate">
                {log.oldValue || "-"}
              </td>
              <td className="px-4 py-3 text-sm text-text-muted max-w-xs truncate">
                {log.newValue || "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const handleAuditTypeChange = (type: AuditType) => {
    setAuditType(type);
    const newCategories =
      type === "user-actions"
        ? Object.keys(userActions)
        : Object.keys(dataChanges);
    setSelectedCategory(newCategories[0]);
  };

  const getKPIStats = () => {
    const currentData = (getCurrentData() as any)[selectedCategory] as (
      | UserActionLog
      | DataChangeLog
    )[];
    const totalEvents = currentData.length;
    const uniqueUsers = new Set(
      currentData.map((log: UserActionLog | DataChangeLog) => log.user)
    ).size;
    const recentEvents = currentData.filter(
      (log: UserActionLog | DataChangeLog) => {
        const logDate = new Date(log.timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        return logDate >= yesterday;
      }
    ).length;

    return { totalEvents, uniqueUsers, recentEvents };
  };

  const { totalEvents, uniqueUsers, recentEvents } = getKPIStats();

  return (
    <div className="w-full flex-1 flex flex-col">
      <PageHeader
        title="Audit Logs"
        description="Monitor user actions and data changes across the system"
        actions={[
          {
            type: "button",
            label: "Date Range",
            variant: "secondary-outline",
            icon: <Calendar size={16} />,
            onClick: () => {},
          },
          {
            type: "button",
            label: "Refresh",
            variant: "secondary-outline",
            icon: <RefreshCcw size={16} />,
            onClick: () => {},
          },
        ]}
      />

      <div className="p-2 gap-2 flex flex-col flex-1 overflow-hidden">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleAuditTypeChange("user-actions")}
              className={`px-3 py-2 text-sm rounded font-medium transition-colors ${
                auditType === "user-actions"
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface text-text-muted hover:bg-surface/80"
              }`}>
              User Actions
            </button>
            <button
              onClick={() => handleAuditTypeChange("data-changes")}
              className={`px-3 py-2 text-sm rounded font-medium transition-colors ${
                auditType === "data-changes"
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface text-text-muted hover:bg-surface/80"
              }`}>
              Data Changes
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-text-muted">
              Category:
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-sm bg-foreground text-text-muted border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary">
              {getCurrentCategories().map((category) => (
                <option
                  key={category}
                  value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="bg-foreground rounded border border-border p-3">
            <div className="flex items-center gap-2 text-primary mb-2">
              <Database size={16} />
              <p className="text-sm text-text-muted">Total Events</p>
            </div>
            <h3 className="text-2xl font-semibold text-text-muted">
              {totalEvents}
            </h3>
            <p className="text-xs text-text-muted mt-1">In selected category</p>
          </div>
          <div className="bg-foreground rounded border border-border p-3">
            <div className="flex items-center gap-2 text-primary mb-2">
              <User size={16} />
              <p className="text-sm text-text-muted">Unique Users</p>
            </div>
            <h3 className="text-2xl font-semibold text-text-muted">
              {uniqueUsers}
            </h3>
            <p className="text-xs text-text-muted mt-1">
              Active in this category
            </p>
          </div>
          <div className="bg-foreground rounded border border-border p-3">
            <div className="flex items-center gap-2 text-primary mb-2">
              <AlertTriangle size={16} />
              <p className="text-sm text-text-muted">Recent Events</p>
            </div>
            <h3 className="text-2xl font-semibold text-text-muted">
              {recentEvents}
            </h3>
            <p className="text-xs text-text-muted mt-1">Last 24 hours</p>
          </div>
        </div>

        <div className="bg-foreground rounded border border-border flex-1 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-medium text-text-muted capitalize">
              {auditType === "user-actions" ? "User Actions" : "Data Changes"} -{" "}
              {selectedCategory}
            </h2>
            <div className="flex items-center gap-2">
              <button className="px-2 py-1 text-xs bg-surface text-text-muted rounded border border-border hover:bg-surface/80 flex items-center gap-1">
                <Filter size={12} />
                Filter
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {auditType === "user-actions"
              ? renderUserActionTable()
              : renderDataChangeTable()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;

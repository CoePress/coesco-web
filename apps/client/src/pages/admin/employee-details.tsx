import { Button, PageHeader, Tabs, StatusBadge, Table } from "@/components"
import { Edit, RefreshCcwIcon } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { TableColumn } from "@/components/ui/table";
import { useApi } from "@/hooks/use-api";
import { IApiResponse } from "@/utils/types";
import { format } from "date-fns";
import { AuditLog } from "@coesco/types";


const EditButtons = ({ isEditing, onSave, onCancel, onEdit, isSaving }: any) => (
  <div className="flex gap-2">
    {isEditing ? (
      <>
        <Button variant="primary" size="sm" onClick={onSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save"}
        </Button>
        <Button variant="secondary-outline" size="sm" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
      </>
    ) : (
      <Button variant="secondary-outline" size="sm" onClick={onEdit}>
        <Edit size={16} />
      </Button>
    )}
  </div>
);

const EmployeeDetails = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview");

  const { get: getEmployee, response: employeeData, loading: loadingEmployee } = useApi<IApiResponse<any>>();
  const { get, response: auditLogs, loading, error } = useApi<IApiResponse<AuditLog[]>>();

  const [params, setParams] = useState({
    sort: "createdAt" as string,
    order: "desc" as "asc" | "desc",
    page: 1,
    limit: 25,
    filter: { changedBy: id || "" },
  });

  const queryParams = useMemo(() => {
    const q: Record<string, string> = {
      sort: params.sort,
      order: params.order,
      page: params.page.toString(),
      limit: params.limit.toString(),
    };

    const activeFilters = Object.fromEntries(
      Object.entries(params.filter).filter(([_, value]) => value)
    );

    if (Object.keys(activeFilters).length > 0) {
      q.filter = JSON.stringify(activeFilters);
    }

    return q;
  }, [params]);

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
    },
  ];

  const fetchAuditLogs = async () => {
    await get("/audit/audit-logs", queryParams);
  };

  const refresh = () => {
    fetchAuditLogs();
  };

  useEffect(() => {
    if (id) {
      getEmployee(`/admin/employees/${id}`);
    }
  }, [id]);

  useEffect(() => {
    if (activeTab === "activity") {
      fetchAuditLogs();
    }
  }, [params, activeTab]);

  const handleParamsChange = (updates: Partial<typeof params>) => {
    setParams(prev => ({
      ...prev,
      ...updates
    }));
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "overview") {
      setSearchParams({});
    } else {
      setSearchParams({ tab });
    }
  };

  const Actions = () => {
    return (
      <div className="flex gap-2">
        <Button onClick={refresh} variant="primary" className="px-2">
          <RefreshCcwIcon size={16} />
        </Button>
      </div>
    );
  };

  return (
        <div className="w-full flex-1 flex flex-col overflow-hidden">
      <PageHeader
        title="Employee Details"
        description="Sample Description"
        goBack
        actions={<Actions />}
      />
      <Tabs
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        tabs={[
          { label: "Overview", value: "overview" },
          { label: "Activity", value: "activity" },
        ]}
      />

      {activeTab === "overview" &&
        <div className="p-2">
          <div className="bg-foreground rounded shadow-sm border p-2 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-text-muted text-sm">Employee Details</h2>
              <EditButtons isEditing={false} onSave={() => {}} onCancel={() => {}} onEdit={() => {}} isSaving={false} />
            </div>

            {loadingEmployee ? (
              <div className="text-sm text-text-muted">Loading...</div>
            ) : employeeData?.data ? (
              <div className="grid grid-cols-4 gap-x-4 gap-y-2">
                <div>
                  <div className="text-sm text-text-muted">Name</div>
                  <div className="text-sm text-text">
                    {employeeData.data.firstName} {employeeData.data.lastName}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-text-muted">Employee Number</div>
                  <div className="text-sm text-text font-mono">
                    {employeeData.data.number || "-"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-text-muted">Email</div>
                  <div className="text-sm text-text">
                    {employeeData.data.email || "-"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-text-muted">Job Title</div>
                  <div className="text-sm text-text">
                    {employeeData.data.title || "-"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-text-muted">Phone Number</div>
                  <div className="text-sm text-text">
                    {employeeData.data.phoneNumber || "-"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-text-muted">Status</div>
                  <div className="text-sm text-text">
                    {employeeData.data.isActive ? "Active" : "Inactive"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-text-muted">Hire Date</div>
                  <div className="text-sm text-text">
                    {employeeData.data.hireDate ? format(new Date(employeeData.data.hireDate), "MM/dd/yyyy") : "-"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-text-muted">Start Date</div>
                  <div className="text-sm text-text">
                    {employeeData.data.startDate ? format(new Date(employeeData.data.startDate), "MM/dd/yyyy") : "-"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-text-muted">Employment Type</div>
                  <div className="text-sm text-text">
                    {employeeData.data.isSalaried ? "Salaried" : "Hourly"}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-text-muted">Employee not found</div>
            )}
          </div>
        </div>
      }

      {activeTab === "activity" &&
        <div className="p-2 flex flex-col flex-1 overflow-hidden gap-2">
          <div className="flex-1 overflow-hidden">
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
          </div>
        </div>
      }
    </div>
  )
}

export default EmployeeDetails
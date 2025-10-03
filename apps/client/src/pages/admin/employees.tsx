import { RefreshCcw } from "lucide-react";
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
import { Employee } from "@coesco/types";
import { Filter } from "@/components/feature/toolbar";

const Employees = () => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("USER");
  const [isActive, setIsActive] = useState<boolean>(true);
  const [syncLoading, setSyncLoading] = useState<boolean>(false);
  const [updateLoading, setUpdateLoading] = useState<boolean>(false);

  const { get, post, patch, response: employees, loading, error } = useApi<IApiResponse<Employee[]>>();

  const [params, setParams] = useState({
    sort: "lastName" as string,
    order: "asc" as "asc" | "desc",
    page: 1,
    limit: 25,
    filter: { isActive: "true" },
    include: ["user"] as string[],
    search: ""
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

    if (params.include.length > 0) {
      q.include = JSON.stringify(params.include);
    }

    if (params.search) {
      q.search = params.search;
    }

    return q;
  }, [params]);

  const columns: TableColumn<any>[] = [
    {
      key: "lastName",
      header: "Name",
      render: (_, row) => (
        <p>
          <span>
            {row.firstName} {row.lastName}
          </span>
        </p>
      ),
    },
    {
      key: "email",
      header: "Email",
    },
    {
      key: "title",
      header: "Job Title",
    },
    {
      key: "user.role",
      header: "Role",
      render: (_, row) => (
        <StatusBadge
          label={row.user.role as string}
          variant={
            !row.user.isActive
              ? "default"
              : row.user.role === "ADMIN"
                ? "error"
                : "success"
          }
        />
      ),
    },
    {
      key: "user.lastLogin",
      header: "Last Login",
      render: (_, row) => {
        if (!row.user.lastLogin) return null;
        return format(row.user.lastLogin as string, "MM/dd/yyyy hh:mm a");
      },
    },
    {
      key: "actions",
      header: "",
      render: (_, row) => (
        <Button
          variant="secondary-outline"
          size="sm"
          onClick={() => {
            setSelectedEmployee(row);
            setSelectedRole(row.user.role);
            setIsActive(row.user.isActive);
            setIsEditModalOpen(true);
          }}>
          Edit
        </Button>
      ),
    },
  ];

  const fetchEmployees = async () => {
    await get("/admin/employees", queryParams);
  };

  const refresh = () => {
    fetchEmployees();
  };

  const syncEmployees = async () => {
    setSyncLoading(true);
    const response = await post("/employees/sync");
    setSyncLoading(false);
    if (response?.success) {
      refresh();
    }
  };

  const updateEmployee = async (employeeId: string, employeeData: any) => {
    setUpdateLoading(true);
    const response = await patch(`/employees/${employeeId}`, employeeData);
    setUpdateLoading(false);
    return response?.success ? response.data : null;
  };

  useEffect(() => {
    fetchEmployees();
  }, [params]);

  const handleSearch = (query: string) => {
    handleParamsChange({
      search: query,
      page: 1
    });
  };

  const handleParamsChange = (updates: Partial<typeof params>) => {
    setParams(prev => ({
      ...prev,
      ...updates
    }));
  };

  const handleFilterChange = (key: string, value: string) => {
    handleParamsChange({
      filter: { ...params.filter, [key]: value }
    });
  };

  const filters: Filter[] = [
    {
      key: 'isActive',
      label: 'Status',
      options: [
        { value: '', label: 'All' },
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Inactive' }
      ],
      placeholder: 'Status'
    },
    {
      key: 'user.role',
      label: 'Role',
      options: [
        { value: '', label: 'All' },
        { value: 'USER', label: 'User' },
        { value: 'ADMIN', label: 'Admin' }
      ],
      placeholder: 'Role'
    },
  ];

  const Actions = () => {
    return (
      <div className="flex gap-2">
        <Button onClick={syncEmployees} disabled={syncLoading}>
          <RefreshCcw size={16} /> Sync with Microsoft
        </Button>
      </div>
    );
  };

  return (
    <div className="w-full flex-1 flex flex-col overflow-hidden">
      <PageHeader
        title="Employees"
        description="Manage employee accounts and permissions"
        actions={<Actions />}
      />

      <div className="p-2 flex flex-col flex-1 overflow-hidden gap-2">
        <Toolbar
          onSearch={handleSearch}
          searchPlaceholder="Search employees..."
          filters={filters}
          onFilterChange={handleFilterChange}
          filterValues={params.filter}
        />

        <div className="flex-1 overflow-hidden">
          <Table<Employee>
            columns={columns}
            data={employees?.data || []}
            total={employees?.meta?.total || 0}
            idField="id"
            pagination
            loading={loading}
            error={error}
            currentPage={employees?.meta?.page}
            totalPages={employees?.meta?.totalPages}
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
            emptyMessage="No employees found"
          />
        </div>
      </div>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Employee Role"
        size="xs">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-text-muted mb-2 block">
              Employee
            </label>
            <div className="block w-full rounded border border-border px-3 py-2 text-sm text-text-muted bg-surface">
              {selectedEmployee?.firstName} {selectedEmployee?.lastName}
            </div>
          </div>

          <div>
            <label className="text-sm text-text-muted mb-2 block">Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="block w-full rounded border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-text-muted placeholder:text-text-muted bg-surface">
              <option value="ADMIN">Admin</option>
              <option value="USER">User</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <label
              htmlFor="isActive"
              className="text-sm text-text-muted">
              Active Account
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary-outline"
              onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (selectedEmployee) {
                  const updated = await updateEmployee(selectedEmployee.id, {
                    "user.role": selectedRole.toUpperCase(),
                    "user.isActive": isActive,
                  } as any);

                  if (updated) {
                    setSelectedEmployee(null);
                    setSelectedRole("USER");
                    setIsActive(true);
                    setIsEditModalOpen(false);
                    refresh();
                  }
                }
              }}
              disabled={updateLoading}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Employees;

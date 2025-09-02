import { RefreshCcw } from "lucide-react";
import { useMemo, useState, useEffect } from "react";

import {
  StatusBadge,
  PageHeader,
  Table,
  Button,
  Loader,
  Modal,
} from "@/components";
import { TableColumn } from "@/components/ui/table";
import { useApi } from "@/hooks/use-api";
import { IApiResponse, IEmployee } from "@/utils/types";
import { format } from "date-fns";

const Employees = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [sort, setSort] = useState("lastName");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("USER");
  const [isActive, setIsActive] = useState<boolean>(true);
  
  const [employees, setEmployees] = useState<IEmployee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  }>({ page: 1, totalPages: 1, total: 0, limit: 25 });
  const [syncLoading, setSyncLoading] = useState<boolean>(false);
  const [updateLoading, setUpdateLoading] = useState<boolean>(false);
  
  const { get, post, patch } = useApi<IApiResponse<IEmployee[]>>();

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
      key: "jobTitle",
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

  const include = useMemo(() => ["user"], []);

  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);
    const response = await get("/admin/employees", {
      page,
      limit,
      sort,
      order,
      include,
    });
    
    if (response?.success) {
      setEmployees(response.data || []);
      if (response.meta) {
        setPagination({
          total: response.meta.total || 0,
          totalPages: response.meta.totalPages || 0,
          page: response.meta.page || 1,
          limit: response.meta.limit || 25,
        });
      }
    } else {
      setError(response?.error || "Failed to fetch employees");
    }
    setLoading(false);
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
  }, [page, limit, sort, order, include]);

  if (loading || syncLoading) {
    return (
      <div className="w-full flex flex-1 flex-col items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error) {
    return <div>Error</div>;
  }

  const Actions = () => {
    return (
      <div className="flex gap-2">
        <Button onClick={syncEmployees}>
          <RefreshCcw size={16} /> Sync with Microsoft
        </Button>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-1 flex-col">
      <PageHeader
        title="Employees"
        description={`${pagination.total} total employees`}
        actions={<Actions />}
      />

      <Table<IEmployee>
        columns={columns}
        data={employees || []}
        total={pagination.total}
        idField="id"
        pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={setPage}
        sort={sort}
        order={order}
        onSortChange={(newSort, newOrder) => {
          setSort(newSort);
          setOrder(newOrder);
        }}
      />

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

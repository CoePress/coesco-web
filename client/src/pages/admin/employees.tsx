import { Plus, RefreshCcw } from "lucide-react";
import { useState } from "react";

import {
  StatusBadge,
  PageHeader,
  Table,
  Button,
  Loader,
  Modal,
} from "@/components";
import { TableColumn } from "@/components/v1/table";
import useGetEmployees from "@/hooks/admin/use-get-employees";
import useSyncEmployees from "@/hooks/admin/use-sync-employees";
import useUpdateEmployee from "@/hooks/admin/use-update-employee";
import { IEmployee, EmployeeRole } from "@/utils/types";
import { format } from "date-fns";

const Employees = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [sort, setSort] = useState("lastName");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<IEmployee | null>(
    null
  );
  const [selectedRole, setSelectedRole] = useState<string>("");

  const {
    syncEmployees,
    loading: syncLoading,
    error: syncError,
  } = useSyncEmployees();

  const { updateEmployee, loading: updateLoading } = useUpdateEmployee();

  const columns: TableColumn<IEmployee>[] = [
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
      key: "role",
      header: "Role",
      render: (value) => (
        <StatusBadge
          label={value as string}
          variant={
            value === "ADMIN"
              ? "error"
              : value === "EMPLOYEE"
              ? "success"
              : "default"
          }
        />
      ),
    },
    {
      key: "lastLogin",
      header: "Last Login",
      render: (value) => {
        if (!value) return null;
        return format(value as string, "MM/dd/yyyy hh:mm a");
      },
    },
    {
      key: "actions",
      header: "Actions",
      render: (_, row) => (
        <Button
          variant="secondary-outline"
          size="sm"
          onClick={() => {
            setSelectedEmployee(row);
            setSelectedRole(row.role);
            setIsEditModalOpen(true);
          }}>
          Edit
        </Button>
      ),
    },
  ];

  const { employees, loading, error, pagination, refresh } = useGetEmployees({
    page,
    limit,
    sort,
    order,
  });

  if (loading || syncLoading) {
    return (
      <div className="w-full flex flex-1 flex-col items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error || syncError) {
    return <div>Error</div>;
  }

  return (
    <div className="w-full flex flex-1 flex-col">
      <PageHeader
        title="Employees"
        description={`${pagination.total} total employees`}
        actions={[
          {
            type: "button",
            label: "Sync",
            variant: "secondary-outline",
            icon: <RefreshCcw size={16} />,
            onClick: () => syncEmployees(),
          },
          {
            type: "button",
            label: "New Employee",
            variant: "secondary-outline",
            icon: <Plus size={16} />,
            onClick: () => {
              syncEmployees();
            },
          },
        ]}
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
            <div className="block w-full rounded-md border border-border px-3 py-2 text-sm text-text-muted bg-surface">
              {selectedEmployee?.firstName} {selectedEmployee?.lastName}
            </div>
          </div>

          <div>
            <label className="text-sm text-text-muted mb-2 block">Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-text-muted placeholder:text-text-muted bg-surface">
              <option value={EmployeeRole.ADMIN}>Admin</option>
              <option value={EmployeeRole.MANAGER}>Manager</option>
              <option value={EmployeeRole.EMPLOYEE}>Employee</option>
              <option value={EmployeeRole.INACTIVE}>Inactive</option>
            </select>
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
                  const result = await updateEmployee(selectedEmployee.id, {
                    role: selectedRole as EmployeeRole,
                  });
                  if (result) {
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

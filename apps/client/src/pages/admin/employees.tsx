import { RefreshCcw } from "lucide-react";
import { useMemo, useState } from "react";

import {
  StatusBadge,
  PageHeader,
  Table,
  Button,
  Loader,
  Modal,
} from "@/components";
import { TableColumn } from "@/components/ui/table";
import { useGetEntities } from "@/hooks/_base/use-get-entities";
import useSyncEmployees from "@/hooks/admin/use-sync-employees";
import useUpdateEmployee from "@/hooks/admin/use-update-employee";
import { IEmployee } from "@/utils/types";
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

  const {
    syncEmployees,
    loading: syncLoading,
    error: syncError,
  } = useSyncEmployees();

  const { updateEmployee, loading: updateLoading } = useUpdateEmployee();

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
      header: "Actions",
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

  const {
    entities: employees,
    loading,
    error,
    pagination,
    refresh,
  } = useGetEntities("/employees", {
    page,
    limit,
    sort,
    order,
    include,
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

import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
  StatusBadge,
  PageHeader,
  Table,
  Button,
  Modal,
  Toolbar,
  ToggleSwitch,
} from "@/components";
import { TableColumn } from "@/components/ui/table";
import { useApi } from "@/hooks/use-api";
import { IApiResponse } from "@/utils/types";
import { format } from "date-fns";
import { Employee } from "@coesco/types";
import { Filter } from "@/components/feature/toolbar";
import { useToast } from "@/hooks/use-toast";
import { RefreshCcwIcon } from "lucide-react";

const Employees = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);

  const { get, response: employees, loading, error } = useApi<IApiResponse<Employee[]>>();
  const { post: syncEmployees, loading: syncing } = useApi<IApiResponse<any>>();

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
      className: "w-1",
      sortable: false,
      render: (_, row) => (
        <Button
          variant="secondary-outline"
          size="sm"
          onClick={(e) => {
            e?.stopPropagation();
            setSelectedEmployee(row);
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

  const handleSync = async () => {
    try {
      const response = await syncEmployees("/admin/employees/sync");

      if (response?.success) {
        toast.success("Employee sync completed successfully!");
        refresh();
      } else {
        toast.error("Employee sync failed. Please try again.");
      }
    } catch (error) {
      console.error("Error syncing employees:", error);
      toast.error("An unexpected error occurred during sync.");
    }
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
        <Button
          onClick={handleSync}
          variant="secondary-outline"
          disabled={syncing || loading}
        >
          {syncing ? "Syncing..." : "Sync Employees"}
        </Button>
        <Button onClick={refresh} variant="primary" className="px-2" disabled={loading}>
          <RefreshCcwIcon size={16} />
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
            onRowClick={(row) => navigate(`/admin/employees/${row.id}`)}
            className="rounded border overflow-clip"
            emptyMessage="No employees found"
            mobileCardView={true}
          />
        </div>
      </div>

      {isEditModalOpen && (
        <EditEmployeeModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          employee={selectedEmployee}
          onSuccess={refresh}
        />
      )}
    </div>
  );
};

const EditEmployeeModal = ({
  isOpen,
  onClose,
  employee,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  employee: any;
  onSuccess: () => void;
}) => {
  const [formData, setFormData] = useState({
    role: employee?.user?.role || "USER",
    isActive: employee?.user?.isActive ?? true,
  });
  const [showConfirmation, setShowConfirmation] = useState(false);

  const { patch: updateEmployee, loading } = useApi<IApiResponse<any>>();
  const toast = useToast();

  const handleChange = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({
      ...prev,
      ...updates
    }));
  };

  const hasChanges = () => {
    return formData.role !== employee?.user?.role || formData.isActive !== employee?.user?.isActive;
  };

  const handleUpdateEmployee = async () => {
    try {
      const response = await updateEmployee(`/admin/employees/${employee.id}`, {
        "user.role": formData.role.toUpperCase(),
        "user.isActive": formData.isActive,
      });

      if (response?.success) {
        toast.success(`Employee "${employee.firstName} ${employee.lastName}" updated successfully!`);
        onClose();
        onSuccess();
      } else {
        toast.error('Failed to update employee. Please try again.');
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      toast.error('An unexpected error occurred while updating the employee.');
    }
  };

  const resetForm = () => {
    setFormData({
      role: employee?.user?.role || "USER",
      isActive: employee?.user?.isActive ?? true,
    });
    setShowConfirmation(false);
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    } else {
      setFormData({
        role: employee?.user?.role || "USER",
        isActive: employee?.user?.isActive ?? true,
      });
    }
  }, [isOpen, employee]);

  if (showConfirmation) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Confirm Changes"
        size="xs">
        <div className="space-y-4">
          <p className="text-sm text-text">
            Are you sure you want to update <span className="font-semibold">{employee?.firstName} {employee?.lastName}</span>'s account?
          </p>

          <div className="bg-surface border border-border rounded p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-text-muted">Role:</span>
              <span className="font-medium text-text">{formData.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Status:</span>
              <span className="font-medium text-text">{formData.isActive ? "Active" : "Inactive"}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary-outline"
              onClick={() => setShowConfirmation(false)}>
              Back
            </Button>
            <Button
              onClick={handleUpdateEmployee}
              disabled={loading}>
              {loading ? "Saving..." : "Confirm"}
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Employee Role"
      size="xs">
      <div className="space-y-4">
        <div>
          <label className="text-sm text-text-muted mb-2 block">
            Employee
          </label>
          <div className="block w-full rounded border border-border px-3 py-2 text-sm text-text-muted bg-surface">
            {employee?.firstName} {employee?.lastName}
          </div>
        </div>

        <div>
          <label className="text-sm text-text-muted mb-2 block">Role</label>
          <select
            value={formData.role}
            onChange={(e) => handleChange({ role: e.target.value })}
            className="block w-full rounded border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-text-muted placeholder:text-text-muted bg-surface">
            <option value="ADMIN">Admin</option>
            <option value="USER">User</option>
          </select>
        </div>

        <ToggleSwitch
          checked={formData.isActive}
          onChange={(checked) => handleChange({ isActive: checked })}
          label="Active"
          id="isActive"
        />

        <div className="flex justify-end gap-2">
          <Button
            variant="secondary-outline"
            onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => setShowConfirmation(true)}
            disabled={!hasChanges()}>
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default Employees;

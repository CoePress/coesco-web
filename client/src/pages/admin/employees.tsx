import { Plus, MoreHorizontal, Search, RefreshCcw } from "lucide-react";
import { useState } from "react";

import { StatusBadge, PageHeader, Table, Button, Loader } from "@/components";
import { TableColumn } from "@/components/v1/table";
import useGetEmployees from "@/hooks/admin/use-get-employees";
import useSyncEmployees from "@/hooks/admin/use-sync-employees";
import { IEmployee } from "@/utils/types";
import { format } from "date-fns";

const Employees = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(25);

  const {
    syncEmployees,
    loading: syncLoading,
    error: syncError,
  } = useSyncEmployees();

  const columns: TableColumn<IEmployee>[] = [
    {
      key: "name",
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
      key: "department",
      header: "Department",
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
      header: "",
      render: () => (
        <button onClick={(e) => e.stopPropagation()}>
          <MoreHorizontal size={16} />
        </button>
      ),
    },
  ];

  const { employees, loading, error, pagination } = useGetEmployees({
    page,
    limit,
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
        actions={
          <>
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search
                  size={18}
                  className="text-text-muted"
                />
              </div>
              <input
                type="text"
                placeholder="Search"
                className="block w-full pl-10 pr-3 py-1.5 border rounded-md text-sm text-text-muted"
              />
            </div>
            <Button
              onClick={() => {
                syncEmployees();
              }}
              disabled={syncLoading}
              variant="secondary-outline">
              <RefreshCcw size={16} />
              Sync
            </Button>
            <Button onClick={() => {}}>
              <Plus size={16} />
              New Employee
            </Button>
          </>
        }
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
      />
    </div>
  );
};

export default Employees;

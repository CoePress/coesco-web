import {
  Plus,
  Filter,
  Download,
  MoreHorizontal,
  Loader,
  Search,
} from "lucide-react";
import { useState } from "react";

import { StatusBadge, PageHeader, Table, Button } from "@/components";
import { formatDate } from "@/utils";
import { TableColumn } from "@/components/v1/table";
import useGetEmployees from "@/hooks/admin/use-get-employees";
import { IEmployee } from "@/utils/types";

const Employees = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(25);

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
      key: "status",
      header: "Status",
      render: (value) => (
        <StatusBadge
          label={value as string}
          variant={value === "ACTIVE" ? "success" : "default"}
        />
      ),
    },
    {
      key: "lastLogin",
      header: "Last Login",
      render: (value) => {
        if (!value) return null;
        return formatDate(value as string);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <Loader />
      </div>
    );
  }

  if (error) {
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
              onClick={() => {}}
              variant="secondary-outline">
              <Filter size={16} />
              Filters
            </Button>
            <Button
              onClick={() => {}}
              variant="secondary-outline">
              <Download size={16} />
              Export
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

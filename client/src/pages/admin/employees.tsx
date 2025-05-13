import {
  Plus,
  Filter,
  Download,
  MoreHorizontal,
  ChevronDown,
  Loader,
} from "lucide-react";
import { useState } from "react";

import {
  StatusBadge,
  PageHeader,
  Table,
  PageSearch,
  Button,
} from "@/components";
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
            value === "admin"
              ? "error"
              : value === "employee"
              ? "success"
              : "default"
          }
        />
      ),
    },
    {
      key: "isActive",
      header: "Status",
      render: (value) => (
        <StatusBadge
          label={value ? "Active" : "Inactive"}
          variant={value ? "success" : "default"}
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
    return <Loader />;
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

      <PageSearch
        placeholder="Search employees..."
        filters={[
          { label: "Filters", icon: Filter, onClick: () => {} },
          { label: "Status", icon: ChevronDown, onClick: () => {} },
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
      />
    </div>
  );
};

export default Employees;

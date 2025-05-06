import {
  Plus,
  Filter,
  Download,
  MoreHorizontal,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  StatusBadge,
  PageHeader,
  Table,
  PageSearch,
  Button,
} from "@/components";
import { formatDate } from "@/utils";
import { TableColumn } from "@/components/v1/table";
import useGetEmployees, { IEmployee } from "@/hooks/admin/use-get-employees";

const Employees = () => {
  const navigate = useNavigate();
  const [selectedRows, setSelectedRows] = useState<(string | number)[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const columns: TableColumn<IEmployee>[] = [
    {
      key: "name",
      header: "Name",
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
              : value === "user"
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

  const { employees, loading, error, refresh } = useGetEmployees({
    page,
    limit,
  });

  return (
    <div className="w-full flex flex-1 flex-col">
      <PageHeader
        title="Employees"
        description={`${employees?.length} total employees`}
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
        total={employees?.length || 0}
        idField="id"
        pagination
      />
    </div>
  );
};

export default Employees;

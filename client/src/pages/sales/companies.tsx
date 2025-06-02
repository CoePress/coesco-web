import {
  Plus,
  Filter,
  Download,
  MoreHorizontal,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { StatusBadge, PageHeader, Table, PageSearch } from "@/components";
import { formatCurrency, formatDate } from "@/utils";
import { TableColumn } from "@/components/shared/table";
import useGetCompanies from "@/hooks/sales/use-get-companies";

type Customer = {
  id: number;
  name: string;
  contact: string;
  email: string;
  status: string;
  type: string;
  location: string;
  lastQuote: string;
  totalValue: number;
};

const Companies = () => {
  const navigate = useNavigate();
  const [selectedRows, setSelectedRows] = useState<(string | number)[]>([]);

  const { companies, loading, error, refresh, pagination } = useGetCompanies();

  const columns: TableColumn<Customer>[] = [
    {
      key: "name",
      header: "Name",
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

  const pageTitle = "Companies";
  const pageDescription = companies
    ? `${companies?.length} total companies`
    : "";

  return (
    <div className="w-full flex flex-1 flex-col">
      <PageHeader
        title={pageTitle}
        description={pageDescription}
        actions={[
          {
            type: "button",
            label: "Export",
            icon: <Download size={16} />,
            variant: "secondary-outline",
            onClick: () => {},
          },
          {
            type: "button",
            label: "New Company",
            icon: <Plus size={16} />,
            variant: "primary",
            onClick: () => {},
          },
        ]}
      />

      <PageSearch
        placeholder="Search companies..."
        filters={[
          { label: "Filters", icon: Filter, onClick: () => {} },
          { label: "Status", icon: ChevronDown, onClick: () => {} },
        ]}
        label={`${selectedRows.length} selected`}
        labelTrigger={selectedRows.length > 0}
      />

      <Table<Customer>
        columns={columns}
        data={companies || []}
        total={companies?.length || 0}
        idField="id"
        pagination
        onRowClick={(row) => navigate(`/sales/companies/${row.id}`)}
      />
    </div>
  );
};

export default Companies;

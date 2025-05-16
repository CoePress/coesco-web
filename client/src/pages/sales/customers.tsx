import {
  Plus,
  Filter,
  Download,
  MoreHorizontal,
  ChevronDown,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { StatusBadge, PageHeader, Table, PageSearch } from "@/components";
import { formatCurrency, formatDate } from "@/utils";
import { sampleCustomers } from "@/utils/sample-data";
import { TableColumn } from "@/components/v1/table";

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

const Customers = () => {
  const navigate = useNavigate();
  const [selectedRows, setSelectedRows] = useState<(string | number)[]>([]);

  const columns: TableColumn<Customer>[] = [
    {
      key: "name",
      header: "Name",
    },
    {
      key: "contact",
      header: "Contact",
      render: (_, row) => (
        <>
          <div>{row.contact}</div>
          <div>{row.email}</div>
        </>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (value) => (
        <StatusBadge
          label={value as string}
          icon={value === "active" ? CheckCircle : XCircle}
          variant={
            value === "active"
              ? "success"
              : value === "inactive"
              ? "error"
              : "default"
          }
        />
      ),
    },
    {
      key: "type",
      header: "Type",
    },
    {
      key: "location",
      header: "Location",
    },
    {
      key: "lastQuote",
      header: "Last Quote",
      render: (value) => formatDate(value as string),
    },
    {
      key: "totalValue",
      header: "Value",
      render: (value) => formatCurrency(value as number),
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

  return (
    <div className="w-full flex flex-1 flex-col">
      <PageHeader
        title="Customers"
        description={`${sampleCustomers.length} total customers`}
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
            label: "New Customer",
            icon: <Plus size={16} />,
            variant: "primary",
            onClick: () => {},
          },
        ]}
      />

      <PageSearch
        placeholder="Search customers..."
        filters={[
          { label: "Filters", icon: Filter, onClick: () => {} },
          { label: "Status", icon: ChevronDown, onClick: () => {} },
        ]}
        label={`${selectedRows.length} selected`}
        labelTrigger={selectedRows.length > 0}
      />

      <Table<Customer>
        columns={columns}
        data={sampleCustomers}
        total={sampleCustomers.length}
        selectable
        selectedItems={selectedRows}
        onSelectionChange={setSelectedRows}
        onRowClick={(row) => navigate(`/sales/customers/${row.id}`)}
        idField="id"
        pagination
      />
    </div>
  );
};

export default Customers;

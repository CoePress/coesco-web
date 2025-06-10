import { Plus, Filter, MoreHorizontal, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";

import { PageHeader, Table, PageSearch } from "@/components";
import { TableColumn } from "@/components/shared/table";
import useGetCompanies from "@/hooks/sales/use-get-companies";

const Companies = () => {
  const { companies, loading, error, refresh, pagination } = useGetCompanies();

  const columns: TableColumn<any>[] = [
    {
      key: "name",
      header: "Name",
      className: "text-primary hover:underline",
      render: (_, row) => (
        <Link to={`/crm/companies/${row.id}`}>{row.name}</Link>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      className: "hover:underline",
      render: (_, row) =>
        row.phone ? <Link to={`tel:${row.phone}`}>{row.phone}</Link> : "-",
    },
    {
      key: "email",
      header: "Email",
      className: "hover:underline",
      render: (_, row) =>
        row.email ? <Link to={`mailto:${row.email}`}>{row.email}</Link> : "-",
    },
    {
      key: "website",
      header: "Website",
      className: "hover:underline",
      render: (_, row) =>
        row.website ? (
          <Link
            to={row.website}
            target="_blank">
            {row.website}
          </Link>
        ) : (
          "-"
        ),
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
            label: "New Company",
            icon: <Plus size={16} />,
            variant: "primary",
            onClick: () => {},
          },
        ]}
      />

      <div className="p-2 flex flex-col">
        <PageSearch
          placeholder="Search companies..."
          filters={[
            { label: "Filters", icon: Filter, onClick: () => {} },
            { label: "Status", icon: ChevronDown, onClick: () => {} },
          ]}
        />

        <Table<any>
          columns={columns}
          data={companies || []}
          total={companies?.length || 0}
          idField="id"
          pagination
        />
      </div>
    </div>
  );
};

export default Companies;

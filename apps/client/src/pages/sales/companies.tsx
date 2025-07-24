import {
  Filter,
  MoreHorizontal,
  ChevronDown,
  PlusCircleIcon,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Table, PageSearch, Button } from "@/components";
import { TableColumn } from "@/components/common/table";
import { useGetEntities } from "@/hooks/_base/use-get-entities";
import PageHeader from "@/components/common/page-head";

const Companies = () => {
  const { entities: companies } = useGetEntities("/companies");

  const columns: TableColumn<any>[] = [
    {
      key: "name",
      header: "Name",
      className: "text-primary hover:underline",
      render: (_, row) => (
        <Link to={`/sales/companies/${row.id}`}>{row.name}</Link>
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

  const Actions = () => {
    return (
      <div className="flex gap-2">
        <Button>
          <PlusCircleIcon size={20} /> Create New
        </Button>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-1 flex-col">
      <PageHeader
        title={pageTitle}
        description={pageDescription}
        actions={<Actions />}
      />

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
  );
};

export default Companies;

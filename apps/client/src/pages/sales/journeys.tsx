import {
  MoreHorizontal,
  PlusCircleIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Table, Button } from "@/components";
import { TableColumn } from "@/components/ui/table";
import { useGetEntities } from "@/hooks/_base/use-get-entities";
import PageHeader from "@/components/layout/page-header";

const Journeys = () => {
  const { entities: journeys } = useGetEntities("/crm/journeys");

  const columns: TableColumn<any>[] = [
    {
      key: "name",
      header: "Name",
      className: "text-primary hover:underline",
      render: (_, row) => (
        <Link to={`/sales/journeys/${row.id}`}>{row.name}</Link>
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

  const pageTitle = "Journeys";
  const pageDescription = journeys ? `${journeys?.length} total journeys` : "";

  const Actions = () => {
    return (
      <div className="flex gap-2">
        <Button onClick={() => {}}>
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

      <Table<any>
        columns={columns}
        data={journeys || []}
        total={journeys?.length || 0}
        idField="id"
        pagination
      />
    </div>
  );
};

export default Journeys;

import { Button, Loader, PageHeader, Table } from "@/components";
import { TableColumn } from "@/components/ui/table";
import { useGetEntities } from "@/hooks/_base/use-get-entities";
import { PlusIcon } from "lucide-react";
import { useState } from "react";

const Machines = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [sort, setSort] = useState("name");
  const [order, setOrder] = useState<"asc" | "desc">("asc");

  const { entities: machines, loading, error, pagination } = useGetEntities("/production/machines", {page, limit});

  if (loading) {
    return (
      <div className="w-full flex flex-1 flex-col items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error) return <div>Error</div>;


  const columns: TableColumn<any>[] = [
    {
      key: "name",
      header: "Name",
    },
    {
      key: "type",
      header: "Type",
    },
    {
      key: "controllerType",
      header: "Controller Type",
    },
    {
      key: "connectionUrl",
      header: "Connection URL",
    },
    {
      key: "enabled",
      header: "Status",
      render: (_, row) => (
        row.enabled ? <div className="text-success">Enabled</div> : <div className="text-error">Disabled</div>
      )
    },
    {
      key: "actions",
      header: "",
      render: () => (
        <Button
          variant="secondary-outline"
          size="sm"
          onClick={() => {}}>
          Edit
        </Button>
      ),
    },
  ];

    const Actions = () => {
    return (
      <div className="flex gap-2">
        <Button onClick={() => { }} variant="primary">
          <PlusIcon size={16} /> New Machine
        </Button>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-1 flex-col">
      <PageHeader
        title="Machines"
        description="Manage all machines"
        actions={<Actions />}
      />

      <div className="w-full flex flex-1 flex-col">
        <Table
          columns={columns}
          data={machines || []}
          total={machines?.length || 0}
                  idField="id"
        pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={setPage}
        sort={sort}
        order={order}
        onSortChange={(newSort, newOrder) => {
          setSort(newSort);
          setOrder(newOrder);
        }}
        />
      </div>
    </div>
  );
};

export default Machines;

import { Button, Loader, PageHeader, Table } from "@/components";
import { TableColumn } from "@/components/ui/table";
import StatusBadge from "@/components/ui/status-badge";
import Modal from "@/components/ui/modal";
import MachineForm from "@/components/forms/machine-form";
import { useGetEntities } from "@/hooks/_base/use-get-entities";
import { PlusIcon } from "lucide-react";
import { useState } from "react";

const Machines = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [sort, setSort] = useState("name");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<any>(null);

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
        <StatusBadge 
          label={row.enabled ? "Enabled" : "Disabled"}
          variant={row.enabled ? "success" : "default"}
        />
      )
    },
    {
      key: "actions",
      header: "",
      render: (_, row) => (
        <Button
          variant="secondary-outline"
          size="sm"
          onClick={() => {
            setSelectedMachine(row);
            setIsModalOpen(true);
          }}>
          Edit
        </Button>
      ),
    },
  ];

  const Actions = () => {
    return (
      <div className="flex gap-2">
        <Button 
          onClick={() => {
            setSelectedMachine(null);
            setIsModalOpen(true);
          }} 
          variant="primary"
        >
          <PlusIcon size={16} /> New Machine
        </Button>
      </div>
    );
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMachine(null);
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

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedMachine ? "Edit Machine" : "New Machine"}
        size="sm"
      >
        <MachineForm 
          machine={selectedMachine}
          onClose={handleCloseModal}
        />
      </Modal>
    </div>
  );
};

export default Machines;

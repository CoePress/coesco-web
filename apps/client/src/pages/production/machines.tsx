import { Button, Loader, PageHeader, Table } from "@/components";
import { TableColumn } from "@/components/ui/table";
import StatusBadge from "@/components/ui/status-badge";
import Modal from "@/components/ui/modal";
import MachineForm from "@/components/forms/machine-form";
import { useApi } from "@/hooks/use-api";
import { PlusIcon } from "lucide-react";
import { useState, useEffect } from "react";
import type { IApiResponse } from "@/utils/types";

const Machines = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [sort, setSort] = useState("name");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<any>(null);
  const [machines, setMachines] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 0,
    total: 0,
    limit: 25
  });

  const { get, loading, error } = useApi();

  useEffect(() => {
    const fetchMachines = async () => {
      const response = await get("/production/machines", {
        page,
        limit,
        sort,
        order
      });

      if (response) {
        const data = response as IApiResponse<any[]>;
        setMachines(data.data || []);
        if (data.meta) {
          setPagination({
            page: data.meta.page || 1,
            totalPages: data.meta.totalPages || 0,
            total: data.meta.total || 0,
            limit: data.meta.limit || 25
          });
        }
      }
    };

    fetchMachines();
  }, [page, limit, sort, order]);

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

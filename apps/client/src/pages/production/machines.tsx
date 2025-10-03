import { Button, Loader, PageHeader, Table, Modal, ToggleSwitch } from "@/components";
import { TableColumn } from "@/components/ui/table";
import StatusBadge from "@/components/ui/status-badge";
import { useApi } from "@/hooks/use-api";
import { useSocket } from "@/contexts/socket.context";
import { getVariantFromStatus } from "@/utils";
import { PlusIcon } from "lucide-react";
import { useState, useEffect } from "react";
import type { IApiResponse } from "@/utils/types";
import { useToast } from "@/hooks/use-toast";

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
  const { machineStates, subscribeToMachineStates, unsubscribeFromMachineStates } = useSocket();

  useEffect(() => {
    subscribeToMachineStates();

    return () => {
      unsubscribeFromMachineStates();
    };
  }, []);

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
      header: "Active",
      render: (_, row) => (
        <StatusBadge
          label={row.enabled ? "True" : "False"}
          variant={row.enabled ? "success" : "default"}
        />
      )
    },
    {
      key: "realTimeStatus",
      header: "Live Status",
      render: (_, row) => {
        const realTimeData = machineStates.find(
          (state) => state.machineId === row.id
        );
        const status = realTimeData?.state || "OFFLINE";
        return (
          <StatusBadge
            label={status}
            variant={getVariantFromStatus(status) as "error" | "success" | "warning" | "info"}
          />
        );
      }
    },
    {
      key: "actions",
      header: "",
      className: "w-1",
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

  const refresh = () => {
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

      {isModalOpen && (
        <EditMachineModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          machine={selectedMachine}
          onSuccess={refresh}
        />
      )}
    </div>
  );
};

const EditMachineModal = ({
  isOpen,
  onClose,
  machine,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  machine: any;
  onSuccess: () => void;
}) => {
  const [formData, setFormData] = useState({
    name: machine?.name || "",
    type: machine?.type || "",
    controllerType: machine?.controllerType || "",
    connectionUrl: machine?.connectionUrl || "",
    enabled: machine?.enabled ?? true,
  });
  const [showConfirmation, setShowConfirmation] = useState(false);

  const { patch: updateMachine, loading } = useApi<IApiResponse<any>>();
  const toast = useToast();

  const handleChange = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({
      ...prev,
      ...updates
    }));
  };

  const hasChanges = () => {
    return (
      formData.name !== machine?.name ||
      formData.type !== machine?.type ||
      formData.controllerType !== machine?.controllerType ||
      formData.connectionUrl !== machine?.connectionUrl ||
      formData.enabled !== machine?.enabled
    );
  };

  const handleUpdateMachine = async () => {
    try {
      const response = await updateMachine(`/production/machines/${machine.id}`, formData);

      if (response?.success) {
        toast.success(`Machine "${machine.name}" updated successfully!`);
        onClose();
        onSuccess();
      } else {
        toast.error('Failed to update machine. Please try again.');
      }
    } catch (error) {
      console.error('Error updating machine:', error);
      toast.error('An unexpected error occurred while updating the machine.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: machine?.name || "",
      type: machine?.type || "",
      controllerType: machine?.controllerType || "",
      connectionUrl: machine?.connectionUrl || "",
      enabled: machine?.enabled ?? true,
    });
    setShowConfirmation(false);
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    } else {
      setFormData({
        name: machine?.name || "",
        type: machine?.type || "",
        controllerType: machine?.controllerType || "",
        connectionUrl: machine?.connectionUrl || "",
        enabled: machine?.enabled ?? true,
      });
    }
  }, [isOpen, machine]);

  if (showConfirmation) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Confirm Changes"
        size="xs">
        <div className="space-y-4">
          <p className="text-sm text-text">
            Are you sure you want to update <span className="font-semibold">{machine?.name}</span>?
          </p>

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary-outline"
              onClick={() => setShowConfirmation(false)}>
              Back
            </Button>
            <Button
              onClick={handleUpdateMachine}
              disabled={loading}>
              {loading ? "Saving..." : "Confirm"}
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Machine"
      size="xs">
      <div className="space-y-4">
        <div>
          <label className="text-sm text-text-muted mb-2 block">
            Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange({ name: e.target.value })}
            className="block w-full rounded border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-text-muted placeholder:text-text-muted bg-surface"
          />
        </div>

        <div>
          <label className="text-sm text-text-muted mb-2 block">Type</label>
          <input
            type="text"
            value={formData.type}
            onChange={(e) => handleChange({ type: e.target.value })}
            className="block w-full rounded border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-text-muted placeholder:text-text-muted bg-surface"
          />
        </div>

        <div>
          <label className="text-sm text-text-muted mb-2 block">Controller Type</label>
          <select
            value={formData.controllerType}
            onChange={(e) => handleChange({ controllerType: e.target.value })}
            className="block w-full rounded border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-text-muted placeholder:text-text-muted bg-surface">
            <option value="">Select controller type</option>
            <option value="MAZAK">MAZAK</option>
            <option value="FANUC">FANUC</option>
            <option value="OTHER">OTHER</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-text-muted mb-2 block">Connection URL</label>
          <input
            type="text"
            value={formData.connectionUrl}
            onChange={(e) => handleChange({ connectionUrl: e.target.value })}
            className="block w-full rounded border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-text-muted placeholder:text-text-muted bg-surface"
          />
        </div>

        <ToggleSwitch
          checked={formData.enabled}
          onChange={(checked) => handleChange({ enabled: checked })}
          label="Enabled"
          id="enabled"
        />

        <div className="flex justify-end gap-2">
          <Button
            variant="secondary-outline"
            onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => setShowConfirmation(true)}
            disabled={!hasChanges()}>
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default Machines;

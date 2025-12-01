import { MachineControllerType, MachineType } from "@coesco/types";
import { PlusIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { TableColumn } from "@/components/ui/table";
import type { IApiResponse } from "@/utils/types";

import { Button, Modal, PageHeader, Table, ToggleSwitch } from "@/components";
import StatusBadge from "@/components/ui/status-badge";
import { useSocket } from "@/contexts/socket.context";
import { useApi } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { getVariantFromStatus } from "@/utils";

function Machines() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<any>(null);
  const { get: getMachines, response: machines, loading, error } = useApi<IApiResponse<any[]>>();
  const { machineStates, subscribeToMachineStates, unsubscribeFromMachineStates } = useSocket();

  const [params, setParams] = useState({
    sort: "name" as string,
    order: "asc" as "asc" | "desc",
    page: 1,
    limit: 25,
    filter: {},
    include: [] as string[],
  });

  const queryParams = useMemo(() => {
    const q: Record<string, string> = {
      sort: params.sort,
      order: params.order,
      page: params.page.toString(),
      limit: params.limit.toString(),
    };

    const activeFilters = Object.fromEntries(
      Object.entries(params.filter).filter(([_, value]) => value),
    );

    if (Object.keys(activeFilters).length > 0) {
      q.filter = JSON.stringify(activeFilters);
    }

    if (params.include.length > 0) {
      q.include = JSON.stringify(params.include);
    }

    return q;
  }, [params]);

  const fetchMachines = async () => {
    await getMachines("/production/machines", queryParams);
  };

  const refresh = () => {
    fetchMachines();
  };

  useEffect(() => {
    subscribeToMachineStates();

    return () => {
      unsubscribeFromMachineStates();
    };
  }, []);

  useEffect(() => {
    fetchMachines();
  }, [params]);

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
      ),
    },
    {
      key: "realTimeStatus",
      header: "Live Status",
      render: (_, row) => {
        const realTimeData = machineStates.find(
          state => state.machineId === row.id,
        );
        const status = realTimeData?.state || "OFFLINE";
        return (
          <StatusBadge
            label={status}
            variant={getVariantFromStatus(status) as "error" | "success" | "warning" | "info"}
          />
        );
      },
    },
    {
      key: "actions",
      header: "",
      className: "w-1",
      sortable: false,
      render: (_, row) => (
        <Button
          variant="secondary-outline"
          size="sm"
          onClick={() => {
            setSelectedMachine(row);
            setIsModalOpen(true);
          }}
        >
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
          <PlusIcon size={16} />
          {" "}
          New Machine
        </Button>
      </div>
    );
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMachine(null);
  };

  const handleParamsChange = (updates: Partial<typeof params>) => {
    setParams(prev => ({
      ...prev,
      ...updates,
    }));
  };

  return (
    <div className="w-full flex-1 flex flex-col overflow-hidden">
      <PageHeader
        title="Machines"
        description="Manage all machines"
        actions={<Actions />}
      />

      <div className="p-2 flex flex-col flex-1 overflow-hidden gap-2">
        <div className="flex-1 overflow-hidden">
          <Table
            columns={columns}
            data={machines?.data || []}
            total={machines?.meta?.total || 0}
            idField="id"
            pagination
            loading={loading}
            error={error}
            currentPage={machines?.meta?.page}
            totalPages={machines?.meta?.totalPages}
            onPageChange={page => handleParamsChange({ page })}
            sort={params.sort}
            order={params.order}
            onSortChange={(newSort, newOrder) => {
              handleParamsChange({
                sort: newSort as any,
                order: newOrder as any,
              });
            }}
            className="rounded border overflow-clip"
            emptyMessage="No machines found"
          />
        </div>
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
}

function EditMachineModal({
  isOpen,
  onClose,
  machine,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  machine: any;
  onSuccess: () => void;
}) {
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
      ...updates,
    }));
  };

  const hasChanges = () => {
    return (
      formData.name !== machine?.name
      || formData.type !== machine?.type
      || formData.controllerType !== machine?.controllerType
      || formData.connectionUrl !== machine?.connectionUrl
      || formData.enabled !== machine?.enabled
    );
  };

  const handleUpdateMachine = async () => {
    try {
      const response = await updateMachine(`/production/machines/${machine.id}`, formData);

      if (response?.success) {
        toast.success(`Machine "${machine.name}" updated successfully!`);
        onClose();
        onSuccess();
      }
      else {
        toast.error("Failed to update machine. Please try again.");
      }
    }
    catch (error) {
      console.error("Error updating machine:", error);
      toast.error("An unexpected error occurred while updating the machine.");
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
    }
    else {
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
        size="xs"
      >
        <div className="space-y-4">
          <p className="text-sm text-text">
            Are you sure you want to update
            {" "}
            <span className="font-semibold">{machine?.name}</span>
            ?
          </p>

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary-outline"
              onClick={() => setShowConfirmation(false)}
            >
              Back
            </Button>
            <Button
              onClick={handleUpdateMachine}
              disabled={loading}
            >
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
      size="xs"
    >
      <div className="space-y-4">
        <div>
          <label className="text-sm text-text-muted mb-2 block">
            Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={e => handleChange({ name: e.target.value })}
            className="block w-full rounded border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-text-muted placeholder:text-text-muted bg-surface"
          />
        </div>

        <div>
          <label className="text-sm text-text-muted mb-2 block">Type</label>
          <select
            value={formData.type}
            onChange={e => handleChange({ type: e.target.value })}
            className="block w-full rounded border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-text-muted placeholder:text-text-muted bg-surface"
          >
            <option value="">Select type</option>
            {Object.keys(MachineType).map(type => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-text-muted mb-2 block">Controller Type</label>
          <select
            value={formData.controllerType}
            onChange={e => handleChange({ controllerType: e.target.value })}
            className="block w-full rounded border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-text-muted placeholder:text-text-muted bg-surface"
          >
            <option value="">Select controller type</option>
            {Object.keys(MachineControllerType).map(type => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-text-muted mb-2 block">Connection URL</label>
          <input
            type="text"
            value={formData.connectionUrl}
            onChange={e => handleChange({ connectionUrl: e.target.value })}
            className="block w-full rounded border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-text-muted placeholder:text-text-muted bg-surface"
          />
        </div>

        <ToggleSwitch
          checked={formData.enabled}
          onChange={checked => handleChange({ enabled: checked })}
          label="Enabled"
          id="enabled"
        />

        <div className="flex justify-end gap-2">
          <Button
            variant="secondary-outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            onClick={() => setShowConfirmation(true)}
            disabled={!hasChanges()}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default Machines;

import { BeakerIcon, PlusIcon, RefreshCcwIcon } from "lucide-react";
import { useState } from "react";

import {
  StatusBadge,
  PageHeader,
  Table,
  Button,
  Loader,
  Modal,
} from "@/components";
import { TableColumn } from "@/components/ui/table";
import { useGetEntities } from "@/hooks/_base/use-get-entities";
import { format } from "date-fns";

interface IDevice {
  id: string;
  name: string;
  host: string;
  port: number;
  enabled: boolean;
  maxMissedPings: number;
  currentMissedPings: number;
  lastPingTime: Date | null;
  lastPingSuccess: boolean | null;
  isDown: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const Devices = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [sort, setSort] = useState("name");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<IDevice | null>(null);

  // Form state
  const [deviceName, setDeviceName] = useState("");
  const [deviceHost, setDeviceHost] = useState("");
  const [deviceEnabled, setDeviceEnabled] = useState(true);
  const [maxMissedPings, setMaxMissedPings] = useState(3);

  const columns: TableColumn<IDevice>[] = [
    {
      key: "name",
      header: "Name",
    },
    {
      key: "host",
      header: "Host",
      render: (_, row) => (
        <span className="font-mono text-sm">{row.host}</span>
      ),
    },
    {
      key: "enabled",
      header: "Status",
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <StatusBadge
            label={row.enabled ? "Enabled" : "Disabled"}
            variant={row.enabled ? "success" : "default"}
          />
          {row.enabled && (
            <StatusBadge
              label={row.isDown ? "Down" : "Up"}
              variant={row.isDown ? "error" : "success"}
            />
          )}
        </div>
      ),
    },
    {
      key: "lastPingTime",
      header: "Last Ping",
      render: (_, row) => {
        if (!row.lastPingTime) return <span className="text-text-muted">Never</span>;
        return (
          <div className="flex flex-col">
            <span>{format(new Date(row.lastPingTime), "MM/dd/yyyy")}</span>
            <span className="text-xs text-text-muted">
              {format(new Date(row.lastPingTime), "hh:mm:ss a")}
            </span>
          </div>
        );
      },
    },
    {
      key: "currentMissedPings",
      header: "Missed Pings",
      render: (_, row) => (
        <span className={row.currentMissedPings >= row.maxMissedPings ? "text-red-600" : ""}>
          {row.currentMissedPings} / {row.maxMissedPings}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (_, row) => (
        <Button
          variant="secondary-outline"
          size="sm"
          onClick={() => {
            setSelectedDevice(row);
            setDeviceName(row.name);
            setDeviceHost(row.host);
            setDeviceEnabled(row.enabled);
            setMaxMissedPings(row.maxMissedPings);
            setIsEditModalOpen(true);
          }}>
          Edit
        </Button>
      ),
    },
  ];

  const {
    entities: devices,
    loading,
    error,
    pagination,
    refresh,
  } = useGetEntities<IDevice>("/admin/devices", {
    page,
    limit,
    sort,
    order,
  });

  const resetForm = () => {
    setDeviceName("");
    setDeviceHost("");
    setDeviceEnabled(true);
    setMaxMissedPings(3);
    setSelectedDevice(null);
  };

  const handleSaveDevice = async () => {
    const deviceData = {
      name: deviceName,
      host: deviceHost,
      enabled: deviceEnabled,
      maxMissedPings,
    };

    try {
      if (selectedDevice) {
        // Update existing device
        const response = await fetch(`http://localhost:8080/api/admin/devices/${selectedDevice.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(deviceData),
          credentials: 'include', 
        });
        if (response.ok) {
          setIsEditModalOpen(false);
          resetForm();
          refresh();
        }
      } else {
        // Create new device
        const response = await fetch("http://localhost:8080/api/admin/devices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(deviceData),
          credentials: 'include', 
        });
        if (response.ok) {
          setIsAddModalOpen(false);
          resetForm();
          refresh();
        }
      }
    } catch (error) {
      console.error("Error saving device:", error);
    }
  };

  const handleCreateClick = () => { 
    resetForm();
    setIsAddModalOpen(true);
  }

  const handleTest = async () => {
    try {
        // Update existing device
        const response = await fetch(`http://localhost:8080/api/admin/test-ntfy`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: 'include', 
        });
        if (response.ok) {
          setIsEditModalOpen(false);
          resetForm();
          refresh();
        }
    } catch (error) {
      console.error("Error saving device:", error);
    }
  }

  if (loading) {
    return (
      <div className="w-full flex flex-1 flex-col items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error) {
    return <div>Error loading devices</div>;
  }

  const Actions = () => {
    return (
      <div className="flex gap-2">
        <Button onClick={handleTest} variant="secondary-outline">
          <BeakerIcon size={16} /> Test Notification
        </Button>
        <Button onClick={handleCreateClick}>
          <PlusIcon size={16} /> New Device
        </Button>
        <Button onClick={refresh} variant="secondary-outline">
          <RefreshCcwIcon size={16} /> Refresh
        </Button>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-1 flex-col">
      <PageHeader
        title="Devices"
        description={`${pagination.total} total devices`}
        actions={<Actions />}
      />

      <Table<IDevice>
        columns={columns}
        data={devices || []}
        total={pagination.total}
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

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          resetForm();
        }}
        title="Add Device"
        size="sm">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-text-muted mb-2 block">Name</label>
            <input
              type="text"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              placeholder="Device name"
              className="block w-full rounded border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-text-muted placeholder:text-text-muted bg-surface"
            />
          </div>

          <div>
            <label className="text-sm text-text-muted mb-2 block">Host</label>
            <input
              type="text"
              value={deviceHost}
              onChange={(e) => setDeviceHost(e.target.value)}
              placeholder="192.168.1.100"
              className="block w-full rounded border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-text-muted placeholder:text-text-muted bg-surface font-mono"
            />
          </div>

          <div>
            <label className="text-sm text-text-muted mb-2 block">Max Missed Pings</label>
            <input
              type="number"
              value={maxMissedPings}
              onChange={(e) => setMaxMissedPings(parseInt(e.target.value) || 3)}
              min="1"
              className="block w-full rounded border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-text-muted placeholder:text-text-muted bg-surface"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enabled"
              checked={deviceEnabled}
              onChange={(e) => setDeviceEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="enabled" className="text-sm text-text-muted">
              Enabled
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary-outline"
              onClick={() => {
                setIsAddModalOpen(false);
                resetForm();
              }}>
              Cancel
            </Button>
            <Button onClick={handleSaveDevice}>
              Add Device
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Device Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          resetForm();
        }}
        title="Edit Device"
        size="sm">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-text-muted mb-2 block">Name</label>
            <input
              type="text"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              className="block w-full rounded border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-text-muted placeholder:text-text-muted bg-surface"
            />
          </div>

          <div>
            <label className="text-sm text-text-muted mb-2 block">Host</label>
            <input
              type="text"
              value={deviceHost}
              onChange={(e) => setDeviceHost(e.target.value)}
              className="block w-full rounded border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-text-muted placeholder:text-text-muted bg-surface font-mono"
            />
          </div>

          <div>
            <label className="text-sm text-text-muted mb-2 block">Max Missed Pings</label>
            <input
              type="number"
              value={maxMissedPings}
              onChange={(e) => setMaxMissedPings(parseInt(e.target.value) || 3)}
              min="1"
              className="block w-full rounded border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-text-muted placeholder:text-text-muted bg-surface"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enabled-edit"
              checked={deviceEnabled}
              onChange={(e) => setDeviceEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="enabled-edit" className="text-sm text-text-muted">
              Enabled
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary-outline"
              onClick={() => {
                setIsEditModalOpen(false);
                resetForm();
              }}>
              Cancel
            </Button>
            <Button onClick={handleSaveDevice}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Devices;
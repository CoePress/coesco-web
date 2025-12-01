import { format } from "date-fns";
import { BeakerIcon, PlusIcon, RefreshCcwIcon } from "lucide-react";
import { useEffect, useState } from "react";

import type { TableColumn } from "@/components/ui/table";
import type { IApiResponse } from "@/utils/types";

import {
  Button,
  Loader,
  Modal,
  PageHeader,
  StatusBadge,
  Table,
} from "@/components";
import { useApi } from "@/hooks/use-api";

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

function Devices() {
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [sort, setSort] = useState("name");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<IDevice | null>(null);

  // Data state
  const [devices, setDevices] = useState<IDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 25,
  });

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
        if (!row.lastPingTime)
          return <span className="text-text-muted">Never</span>;
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
          {row.currentMissedPings}
          {" "}
          /
          {row.maxMissedPings}
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
          }}
        >
          Edit
        </Button>
      ),
    },
  ];

  const { get, post, put } = useApi<IApiResponse<IDevice[]>>();

  const fetchDevices = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await get("/admin/devices", {
        page,
        limit,
        sort,
        order,
      });

      if (response?.success && response.data) {
        setDevices(response.data as unknown as IDevice[]);
        setPagination(prev => ({
          ...prev,
          ...response.meta,
        }));
      }
    }
    catch (err: any) {
      setError(err.message || "Failed to fetch devices");
      setDevices([]);
    }
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, [page, limit, sort, order]);

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
        await put(`/admin/devices/${selectedDevice.id}`, deviceData);
        setIsEditModalOpen(false);
      }
      else {
        await post("/admin/devices", deviceData);
        setIsAddModalOpen(false);
      }
      resetForm();
      fetchDevices();
    }
    catch (error) {
      console.error("Error saving device:", error);
    }
  };

  const handleCreateClick = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleTest = async () => {
    try {
      await post("/admin/test-ntfy", {});
    }
    catch (error) {
      console.error("Error testing notification:", error);
    }
  };

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
          <BeakerIcon size={16} />
          {" "}
          Test Notification
        </Button>
        <Button onClick={handleCreateClick}>
          <PlusIcon size={16} />
          {" "}
          New Device
        </Button>
        <Button onClick={fetchDevices} variant="secondary-outline">
          <RefreshCcwIcon size={16} />
          {" "}
          Refresh
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
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm text-text-muted mb-2 block">Name</label>
            <input
              type="text"
              value={deviceName}
              onChange={e => setDeviceName(e.target.value)}
              placeholder="Device name"
              className="block w-full rounded border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-text-muted placeholder:text-text-muted bg-surface"
            />
          </div>

          <div>
            <label className="text-sm text-text-muted mb-2 block">Host</label>
            <input
              type="text"
              value={deviceHost}
              onChange={e => setDeviceHost(e.target.value)}
              placeholder="192.168.1.100"
              className="block w-full rounded border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-text-muted placeholder:text-text-muted bg-surface font-mono"
            />
          </div>

          <div>
            <label className="text-sm text-text-muted mb-2 block">Max Missed Pings</label>
            <input
              type="number"
              value={maxMissedPings}
              onChange={e => setMaxMissedPings(Number.parseInt(e.target.value) || 3)}
              min="1"
              className="block w-full rounded border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-text-muted placeholder:text-text-muted bg-surface"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enabled"
              checked={deviceEnabled}
              onChange={e => setDeviceEnabled(e.target.checked)}
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
              }}
            >
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
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm text-text-muted mb-2 block">Name</label>
            <input
              type="text"
              value={deviceName}
              onChange={e => setDeviceName(e.target.value)}
              className="block w-full rounded border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-text-muted placeholder:text-text-muted bg-surface"
            />
          </div>

          <div>
            <label className="text-sm text-text-muted mb-2 block">Host</label>
            <input
              type="text"
              value={deviceHost}
              onChange={e => setDeviceHost(e.target.value)}
              className="block w-full rounded border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-text-muted placeholder:text-text-muted bg-surface font-mono"
            />
          </div>

          <div>
            <label className="text-sm text-text-muted mb-2 block">Max Missed Pings</label>
            <input
              type="number"
              value={maxMissedPings}
              onChange={e => setMaxMissedPings(Number.parseInt(e.target.value) || 3)}
              min="1"
              className="block w-full rounded border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-text-muted placeholder:text-text-muted bg-surface"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enabled-edit"
              checked={deviceEnabled}
              onChange={e => setDeviceEnabled(e.target.checked)}
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
              }}
            >
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
}

export default Devices;

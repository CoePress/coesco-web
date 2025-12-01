import { format } from "date-fns";
import { RefreshCcwIcon, Trash2, Undo2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { Filter } from "@/components/feature/toolbar";
import type { TableColumn } from "@/components/ui/table";
import type { IApiResponse } from "@/utils/types";

import {
  Button,
  Modal,
  PageHeader,
  StatusBadge,
  Table,
  Toolbar,
} from "@/components";
import { useApi } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";

interface DeletedRecord {
  id: string;
  modelName: string;
  displayName: string;
  deletedAt: string;
  hardDeleteDate: string;
  metadata: Record<string, any>;
}

function DeletedRecords() {
  const toast = useToast();
  const [modelNames, setModelNames] = useState<string[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<DeletedRecord | null>(null);
  const [confirmAction, setConfirmAction] = useState<"restore" | "hardDelete" | null>(null);

  const { get, response: deletedRecords, loading, error } = useApi<IApiResponse<DeletedRecord[]>>();
  const { get: getModels } = useApi<{ modelNames: string[] }>();
  const { post: restoreRecord, loading: restoring } = useApi();
  const { delete: hardDeleteRecord, loading: deleting } = useApi();

  const [params, setParams] = useState({
    page: 1,
    limit: 25,
    filter: { modelName: "" },
  });

  const queryParams = useMemo(() => {
    const q: Record<string, string> = {
      page: params.page.toString(),
      limit: params.limit.toString(),
    };

    if (params.filter.modelName) {
      q.modelName = params.filter.modelName;
    }

    return q;
  }, [params]);

  const formatModelName = (modelName: string) => {
    return modelName
      .split(/(?=[A-Z])/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getDaysUntilHardDelete = (hardDeleteDate: string) => {
    const now = new Date();
    const deleteDate = new Date(hardDeleteDate);
    const diffTime = deleteDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const columns: TableColumn<DeletedRecord>[] = [
    {
      key: "modelName",
      header: "Type",
      render: (_, row) => (
        <StatusBadge
          label={formatModelName(row.modelName)}
          variant="default"
        />
      ),
    },
    {
      key: "displayName",
      header: "Name",
      render: (_, row) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.displayName}</span>
          {row.metadata.type && (
            <span className="text-xs text-text-muted">
              {row.metadata.type}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "deletedAt",
      header: "Deleted At",
      render: (_, row) => (
        <div className="flex flex-col">
          <span>{format(new Date(row.deletedAt), "MM/dd/yyyy")}</span>
          <span className="text-xs text-text-muted">
            {format(new Date(row.deletedAt), "hh:mm a")}
          </span>
        </div>
      ),
    },
    {
      key: "hardDeleteDate",
      header: "Hard Delete In",
      render: (_, row) => {
        const daysUntil = getDaysUntilHardDelete(row.hardDeleteDate);
        const isExpiringSoon = daysUntil <= 7;

        return (
          <div className="flex flex-col">
            <span className={isExpiringSoon ? "text-error font-medium" : ""}>
              {daysUntil > 0 ? `${daysUntil} day${daysUntil !== 1 ? "s" : ""}` : "Today"}
            </span>
            <span className="text-xs text-text-muted">
              {format(new Date(row.hardDeleteDate), "MM/dd/yyyy")}
            </span>
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "",
      className: "w-1",
      sortable: false,
      render: (_, row) => (
        <div className="flex gap-2">
          <Button
            variant="secondary-outline"
            size="sm"
            onClick={(e) => {
              e?.stopPropagation();
              setSelectedRecord(row);
              setConfirmAction("restore");
            }}
          >
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button
            variant="secondary-outline"
            size="sm"
            onClick={(e) => {
              e?.stopPropagation();
              setSelectedRecord(row);
              setConfirmAction("hardDelete");
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  const fetchRecords = async () => {
    await get("/admin/deleted-records", queryParams);
  };

  const fetchModelNames = async () => {
    const response = await getModels("/admin/deleted-records/models");
    if (response) {
      setModelNames(response.modelNames);
    }
  };

  const refresh = () => {
    fetchRecords();
  };

  const handleRestore = async () => {
    if (!selectedRecord)
      return;

    try {
      await restoreRecord(`/admin/deleted-records/${selectedRecord.modelName}/${selectedRecord.id}/restore`);
      toast.success("Record restored successfully");
      setConfirmAction(null);
      setSelectedRecord(null);
      refresh();
    }
    catch (error) {
      console.error("Restore failed:", error);
      toast.error("Restore failed. Please try again.");
    }
  };

  const handleHardDelete = async () => {
    if (!selectedRecord)
      return;

    try {
      await hardDeleteRecord(`/admin/deleted-records/${selectedRecord.modelName}/${selectedRecord.id}`);
      toast.success("Record permanently deleted");
      setConfirmAction(null);
      setSelectedRecord(null);
      refresh();
    }
    catch (error) {
      console.error("Hard delete failed:", error);
      toast.error("Hard delete failed. Please try again.");
    }
  };

  useEffect(() => {
    fetchModelNames();
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [params]);

  const handleParamsChange = (updates: Partial<typeof params>) => {
    setParams(prev => ({
      ...prev,
      ...updates,
    }));
  };

  const handleFilterChange = (key: string, value: string) => {
    handleParamsChange({
      filter: { ...params.filter, [key]: value },
      page: 1,
    });
  };

  const filters: Filter[] = [
    {
      key: "modelName",
      label: "Model Type",
      options: [
        { value: "", label: "All Models" },
        ...modelNames.map(model => ({
          value: model,
          label: formatModelName(model),
        })),
      ],
      placeholder: "Filter by type",
    },
  ];

  const Actions = () => {
    return (
      <div className="flex gap-2">
        <Button onClick={refresh} variant="primary" className="px-2" disabled={loading}>
          <RefreshCcwIcon size={16} />
        </Button>
      </div>
    );
  };

  return (
    <div className="w-full flex-1 flex flex-col overflow-hidden">
      <PageHeader
        title="Deleted Records"
        description="View and manage soft-deleted records. Records are automatically hard-deleted after 30 days."
        actions={<Actions />}
      />

      <div className="p-2 flex flex-col flex-1 overflow-hidden gap-2">
        <Toolbar
          filters={filters}
          onFilterChange={handleFilterChange}
          filterValues={params.filter}
        />

        <div className="flex-1 overflow-hidden">
          <Table<DeletedRecord>
            columns={columns}
            data={deletedRecords?.data || []}
            total={deletedRecords?.meta?.total || 0}
            idField="id"
            pagination
            loading={loading}
            error={error}
            currentPage={deletedRecords?.meta?.page}
            totalPages={deletedRecords?.meta?.totalPages}
            onPageChange={page => handleParamsChange({ page })}
            className="rounded border overflow-clip"
            emptyMessage="No deleted records found"
            mobileCardView={true}
          />
        </div>
      </div>

      {confirmAction === "restore" && selectedRecord && (
        <Modal
          isOpen={true}
          onClose={() => {
            setConfirmAction(null);
            setSelectedRecord(null);
          }}
          title="Restore Record"
          size="xs"
        >
          <div className="space-y-4">
            <p className="text-sm text-text">
              Are you sure you want to restore this
              {" "}
              {formatModelName(selectedRecord.modelName)}
              ?
            </p>

            <div className="bg-surface border border-border rounded p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Type:</span>
                <span className="font-medium text-text">{formatModelName(selectedRecord.modelName)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Name:</span>
                <span className="font-medium text-text">{selectedRecord.displayName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Deleted:</span>
                <span className="font-medium text-text">
                  {format(new Date(selectedRecord.deletedAt), "MM/dd/yyyy hh:mm a")}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="secondary-outline"
                onClick={() => {
                  setConfirmAction(null);
                  setSelectedRecord(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRestore}
                disabled={restoring}
              >
                {restoring ? "Restoring..." : "Restore"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {confirmAction === "hardDelete" && selectedRecord && (
        <Modal
          isOpen={true}
          onClose={() => {
            setConfirmAction(null);
            setSelectedRecord(null);
          }}
          title="Permanently Delete Record"
          size="xs"
        >
          <div className="space-y-4">
            <p className="text-sm text-text">
              Are you sure you want to
              {" "}
              <strong className="text-error">permanently delete</strong>
              {" "}
              this
              {" "}
              {formatModelName(selectedRecord.modelName)}
              ? This action cannot be undone.
            </p>

            <div className="bg-surface border border-border rounded p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Type:</span>
                <span className="font-medium text-text">{formatModelName(selectedRecord.modelName)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Name:</span>
                <span className="font-medium text-text">{selectedRecord.displayName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Deleted:</span>
                <span className="font-medium text-text">
                  {format(new Date(selectedRecord.deletedAt), "MM/dd/yyyy hh:mm a")}
                </span>
              </div>
            </div>

            <div className="bg-error/10 border border-error/50 rounded p-3">
              <p className="text-sm text-error font-medium">
                Warning: This will permanently delete the record and cannot be recovered.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="secondary-outline"
                onClick={() => {
                  setConfirmAction(null);
                  setSelectedRecord(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleHardDelete}
                disabled={deleting}
                className="bg-error hover:bg-error/90"
              >
                {deleting ? "Deleting..." : "Permanently Delete"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default DeletedRecords;

import { RefreshCcwIcon } from "lucide-react";
import { useState, useEffect } from "react";

import {
  StatusBadge,
  PageHeader,
  Table,
  Button,
  Loader,
  Modal,
} from "@/components";
import { TableColumn } from "@/components/ui/table";
import { useApi } from "@/hooks/use-api";
import { IApiResponse, IAuditLog } from "@/utils/types";
import { format } from "date-fns";

const Logs = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [sort, setSort] = useState("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  const [auditLogs, setAuditLogs] = useState<IAuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 25,
  });
  const [selectedLog, setSelectedLog] = useState<IAuditLog | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const { get } = useApi<IApiResponse<IAuditLog[]>>();

  const columns: TableColumn<IAuditLog>[] = [
    {
      key: "createdAt",
      header: "Timestamp",
      render: (_, row) => (
        <div className="flex flex-col">
          <span>{format(new Date(row.createdAt), "MM/dd/yyyy")}</span>
          <span className="text-xs text-text-muted">
            {format(new Date(row.createdAt), "hh:mm:ss a")}
          </span>
        </div>
      ),
    },
    {
      key: "model",
      header: "Model",
      render: (_, row) => (
        <StatusBadge
          label={row.model}
          variant="default"
        />
      ),
    },
    {
      key: "recordId",
      header: "Record ID",
      render: (_, row) => (
        <span className="font-mono text-sm">{row.recordId}</span>
      ),
    },
    {
      key: "changedBy",
      header: "Changed By",
    },
    {
      key: "actions",
      header: "Actions",
      render: (_, row) => (
        <Button
          variant="secondary-outline"
          size="sm"
          onClick={() => {
            setSelectedLog(row);
            setIsDetailsModalOpen(true);
          }}>
          View Details
        </Button>
      ),
    },
  ];

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await get("/audit/audit-logs", {
        page,
        limit,
        sort,
        order,
      });

      if (response?.success && response.data) {
        setAuditLogs(response.data as unknown as IAuditLog[]);
        setPagination(prev => ({
          ...prev,
          ...response.meta,
        }));
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch audit logs");
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [page, limit, sort, order]);

  if (loading) {
    return (
      <div className="w-full flex flex-1 flex-col items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error) {
    return <div>Error loading audit logs: {error}</div>;
  }

  const Actions = () => {
    return (
      <div className="flex gap-2">
        <Button onClick={fetchAuditLogs} variant="secondary-outline">
          <RefreshCcwIcon size={16} /> Refresh
        </Button>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-1 flex-col">
      <PageHeader
        title="Audit Logs"
        description={`${pagination.total} total audit log entries`}
        actions={<Actions />}
      />

      <Table<IAuditLog>
        columns={columns}
        data={auditLogs || []}
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
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedLog(null);
        }}
        title="Audit Log Details"
        size="lg">
        {selectedLog && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-text-muted mb-2 block">Timestamp</label>
                <div className="text-sm">
                  {format(new Date(selectedLog.createdAt), "MM/dd/yyyy hh:mm:ss a")}
                </div>
              </div>
              <div>
                <label className="text-sm text-text-muted mb-2 block">Model</label>
                <StatusBadge label={selectedLog.model} variant="default" />
              </div>
              <div>
                <label className="text-sm text-text-muted mb-2 block">Record ID</label>
                <span className="font-mono text-sm">{selectedLog.recordId}</span>
              </div>
              <div>
                <label className="text-sm text-text-muted mb-2 block">Changed By</label>
                <div className="text-sm">{selectedLog.changedBy}</div>
              </div>
            </div>

            <div>
              <label className="text-sm text-text-muted mb-2 block">Changes</label>
              <div className="bg-surface border border-border rounded-lg p-4 max-h-96 overflow-y-auto">
                {selectedLog.diff && typeof selectedLog.diff === 'object' ? (
                  Object.keys(selectedLog.diff).length > 0 ? (
                    <div className="space-y-4">
                      {Object.entries(selectedLog.diff).map(([key, value]) => (
                        <div key={key} className="border-b border-border pb-3 last:border-b-0">
                          <div className="text-sm font-medium text-text-muted mb-2">{key}</div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="text-xs text-red-600 font-medium mb-1">Old Value:</div>
                              <div className="bg-red-50 border border-red-200 rounded p-2 font-mono text-xs">
                                {JSON.stringify((value as any)?.old, null, 2) || 'null'}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-green-600 font-medium mb-1">New Value:</div>
                              <div className="bg-green-50 border border-green-200 rounded p-2 font-mono text-xs">
                                {JSON.stringify((value as any)?.new, null, 2) || 'null'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-text-muted text-sm">No changes recorded</div>
                  )
                ) : (
                  <div className="text-text-muted text-sm">Invalid change data</div>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                variant="secondary-outline"
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  setSelectedLog(null);
                }}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Logs
import { RefreshCcwIcon } from "lucide-react";
import { useState, useEffect, useMemo } from "react";

import {
  StatusBadge,
  PageHeader,
  Table,
  Button,
  Modal,
} from "@/components";
import { TableColumn } from "@/components/ui/table";
import { useApi } from "@/hooks/use-api";
import { IApiResponse} from "@/utils/types";
import { format } from "date-fns";
import { AuditLog } from "@coesco/types";

const Logs = () => {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const { get, response: auditLogs, loading, error } = useApi<IApiResponse<AuditLog[]>>();

  const [params, setParams] = useState({
    sort: "createdAt" as string,
    order: "desc" as "asc" | "desc",
    page: 1,
    limit: 25,
  });

  const queryParams = useMemo(() => {
    const q: Record<string, string> = {
      sort: params.sort,
      order: params.order,
      page: params.page.toString(),
      limit: params.limit.toString(),
    };

    return q;
  }, [params]);

  const columns: TableColumn<AuditLog>[] = [
    {
      key: "createdAt",
      header: "Timestamp",
      render: (_, row) => (
        <div className="flex flex-col">
          <span>{row.createdAt ? format(new Date(row.createdAt), "MM/dd/yyyy") : 'N/A'}</span>
          <span className="text-xs text-text-muted">
            {row.createdAt ? format(new Date(row.createdAt), "hh:mm:ss a") : 'N/A'}
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
      render: (_, row) => (
        <span>{(row as any).changedByName || row.changedBy}</span>
      ),
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
            setSelectedLog(row);
            setIsDetailsModalOpen(true);
          }}>
          View
        </Button>
      ),
    },
  ];

  const fetchAuditLogs = async () => {
    await get("/admin/logs", queryParams);
  };

  const refresh = () => {
    fetchAuditLogs();
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [params]);

  const handleParamsChange = (updates: Partial<typeof params>) => {
    setParams(prev => ({
      ...prev,
      ...updates
    }));
  };

  const Actions = () => {
    return (
      <div className="flex gap-2">
        <Button onClick={refresh} variant="primary" className="px-2">
          <RefreshCcwIcon size={16} />
        </Button>
      </div>
    );
  };

  return (
    <div className="w-full flex-1 flex flex-col overflow-hidden">
      <PageHeader
        title="Audit Logs"
        description="Track all system changes and user activity"
        actions={<Actions />}
      />

      <div className="p-2 flex flex-col flex-1 overflow-hidden gap-2">
        <div className="flex-1 overflow-hidden">
          <Table<AuditLog>
            columns={columns}
            data={auditLogs?.data || []}
            total={auditLogs?.meta?.total || 0}
            idField="id"
            pagination
            loading={loading}
            error={error}
            currentPage={auditLogs?.meta?.page}
            totalPages={auditLogs?.meta?.totalPages}
            onPageChange={(page) => handleParamsChange({ page })}
            sort={params.sort}
            order={params.order}
            onSortChange={(newSort, newOrder) => {
              handleParamsChange({
                sort: newSort as any,
                order: newOrder as any
              });
            }}
            className="rounded border overflow-clip"
            emptyMessage="No audit logs found"
          />
        </div>
      </div>

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
                  {selectedLog.createdAt ? format(new Date(selectedLog.createdAt), "MM/dd/yyyy hh:mm:ss a") : 'N/A'}
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
                <div className="text-sm">{(selectedLog as any).changedByName || selectedLog.changedBy}</div>
              </div>
            </div>

            <div>
              <label className="text-sm text-text-muted mb-2 block">Changes</label>
              <div className="bg-surface border border-border rounded-lg p-4 max-h-96 overflow-y-auto">
                {selectedLog.diff && typeof selectedLog.diff === 'object' ? (
                  Object.keys(selectedLog.diff).length > 0 ? (
                    <div className="space-y-4">
                      {Object.entries(selectedLog.diff).map(([key, value]) => {
                        const beforeVal = (value as any)?.before;
                        const afterVal = (value as any)?.after;

                        const formatValue = (val: any) => {
                          if (val === null || val === undefined) return 'null';
                          if (typeof val === 'string') return val;
                          if (typeof val === 'boolean') return val.toString();
                          if (typeof val === 'number') return val.toString();
                          return JSON.stringify(val, null, 2);
                        };

                        return (
                          <div key={key} className="border-b border-border pb-3 last:border-b-0">
                            <div className="text-sm font-medium text-text mb-2">{key}</div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <div className="text-xs text-error font-medium mb-1">Before:</div>
                                <div className="bg-error/10 border border-error/50 rounded p-2 font-mono text-xs text-text">
                                  {formatValue(beforeVal)}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-success font-medium mb-1">After:</div>
                                <div className="bg-success/10 border border-success/50 rounded p-2 font-mono text-xs text-text">
                                  {formatValue(afterVal)}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-text-muted text-sm">No changes recorded</div>
                  )
                ) : (
                  <div className="text-text-muted text-sm">Invalid change data</div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Logs
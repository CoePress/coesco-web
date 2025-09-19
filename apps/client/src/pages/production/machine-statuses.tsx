import { Loader, PageHeader, StatusBadge } from "@/components";
import Table, { TableColumn } from "@/components/ui/table";
import { useApi } from "@/hooks/use-api";
import { formatDuration, getVariantFromStatus } from "@/utils";
import {  IApiResponse } from "@/utils/types";
import { MachineStatus } from "@coesco/types";
import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";

const MachineStatuses = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [sort, setSort] = useState("startTime");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [selectedState, _setSelectedState] = useState("");
  const [selectedMachine, _setSelectedMachine] = useState("");
  const [machineStatuses, setMachineStatuses] = useState<MachineStatus[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 0,
    total: 0,
    limit: 25
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filter = useMemo(
    () => ({
      state: selectedState || undefined,
      machineId: selectedMachine || undefined,
    }),
    [selectedState, selectedMachine]
  );

  const api = useApi<IApiResponse<MachineStatus[]>>();
  const machinesApi = useApi<IApiResponse<any[]>>();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [statusesResponse, machinesResponse] = await Promise.all([
          api.get("/production/machine-statuses", {
            page,
            limit,
            sort,
            order,
            filter
          }),
          machinesApi.get("/production/machines", {
            limit: 100
          })
        ]);

        if (statusesResponse) {
          const statusData = statusesResponse as IApiResponse<MachineStatus[]>;
          setMachineStatuses(statusData.data || []);
          if (statusData.meta) {
            setPagination({
              page: statusData.meta.page || 1,
              totalPages: statusData.meta.totalPages || 0,
              total: statusData.meta.total || 0,
              limit: statusData.meta.limit || 25
            });
          }
        }

        if (machinesResponse) {
          const machineData = machinesResponse as IApiResponse<any[]>;
          setMachines(machineData.data || []);
        }
      } catch (err) {
        setError(api.error || machinesApi.error || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [page, limit, sort, order, filter]);

  // const stateOptions = [
  //   { label: "All States", value: "" },
  //   { label: "Active", value: "ACTIVE" },
  //   { label: "Idle", value: "IDLE" },
  //   { label: "Alarm", value: "ALARM" },
  //   { label: "Maintenance", value: "MAINTENANCE" },
  //   { label: "Offline", value: "OFFLINE" },
  // ];

  // const machineOptions = [
  //   { label: "All Machines", value: "" },
  //   ...(machines?.map((machine) => ({
  //     label: machine.name,
  //     value: machine.id,
  //   })) || []),
  // ];

  const columns = [
    {
      key: "machineId",
      header: "Machine",
      render: (_: any, row: MachineStatus) => {
        const machine = machines?.find(
          (machine) => machine.id === row.machineId
        );
        return <div>{machine?.name}</div>;
      },
    },
    {
      key: "state",
      header: "State",
      render: (value: any) => {
        return (
          <StatusBadge
            label={value.toUpperCase()}
            variant={getVariantFromStatus(value) as any}
          />
        );
      },
    },
    {
      key: "execution",
      header: "Execution",
      render: (value: string) => {
        return (
          <StatusBadge
            label={value}
            variant="default"
          />
        );
      },
    },
    {
      key: "controller",
      header: "Controller",
      render: (value: string) => {
        return (
          <StatusBadge
            label={value}
            variant="default"
          />
        );
      },
    },
    {
      key: "program",
      header: "Program",
    },
    {
      key: "startTime",
      header: "Start",
      render: (value: string) => {
        return format(new Date(value), "MMM dd, hh:mm:ss a");
      },
    },
    {
      key: "endTime",
      header: "End",
      render: (value: string) => {
        return value ? format(new Date(value), "MMM dd, hh:mm:ss a") : "-";
      },
    },
    {
      key: "duration",
      header: "Duration",
      render: (_: any, row: any) => {
        const start = new Date(row.startTime);
        const end = row.endTime ? new Date(row.endTime) : new Date();
        const durationMs = end.getTime() - start.getTime();
        return formatDuration(durationMs);
      },
    },
  ];

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error) {
    return <div>{error}</div>
  }

  return (
    <div className="w-full flex-1 flex flex-col overflow-hidden">
      <PageHeader
        title="Machine Statuses"
        description="Explore all machine history"
      />
      <div className="p-2 flex flex-col flex-1 overflow-hidden gap-2">
        <div className="flex-1 overflow-hidden">
          <Table<MachineStatus>
            columns={columns as TableColumn<MachineStatus>[]}
            data={machineStatuses || []}
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
            className="rounded border overflow-clip"
          />
        </div>
      </div>
    </div>
  )
}

export default MachineStatuses
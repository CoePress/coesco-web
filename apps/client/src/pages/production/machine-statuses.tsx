import { Loader, StatusBadge } from "@/components";
import PageHeader from "@/components/_old/page-head"
import Table, { TableColumn } from "@/components/ui/table";
import { useGetEntities } from "@/hooks/_base/use-get-entities";
import { formatDuration, getVariantFromStatus } from "@/utils";
import { IMachineStatus } from "@/utils/types";
import { format } from "date-fns";
import { useMemo, useState } from "react";

const MachineStatuses = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [sort, setSort] = useState("startTime");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [selectedState, setSelectedState] = useState("");
  const [selectedMachine, setSelectedMachine] = useState("");

  const filter = useMemo(
    () => ({
      state: selectedState || undefined,
      machineId: selectedMachine || undefined,
    }),
    [selectedState, selectedMachine]
  );

  const { entities: machineStatuses, loading: machineStatusesLoading, error: machineStatusesError, pagination } = useGetEntities("/production/machine-statuses", {
    page, limit, sort, order, filter,
  });
  const { entities: machines, loading: machinesLoading, error: machinesError } = useGetEntities("/production/machines");

  const loading = machineStatusesLoading || machinesLoading;
  const error = machineStatusesError || machinesError;

  const stateOptions = [
    { label: "All States", value: "" },
    { label: "Active", value: "ACTIVE" },
    { label: "Idle", value: "IDLE" },
    { label: "Alarm", value: "ALARM" },
    { label: "Maintenance", value: "MAINTENANCE" },
    { label: "Offline", value: "OFFLINE" },
  ];

  const machineOptions = [
    { label: "All Machines", value: "" },
    ...(machines?.map((machine) => ({
      label: machine.name,
      value: machine.id,
    })) || []),
  ];

  const columns = [
    {
      key: "machineId",
      header: "Machine",
      render: (_: any, row: IMachineStatus) => {
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
    <div className="w-full flex flex-1 flex-col">
      <PageHeader
        title="Machine Statuses"
        description="Explore all machine history"
      />
      <Table<IMachineStatus>
        columns={columns as TableColumn<IMachineStatus>[]}
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
      />
    </div>
  )
}

export default MachineStatuses
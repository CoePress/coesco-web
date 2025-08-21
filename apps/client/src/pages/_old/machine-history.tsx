import { StatusBadge, Table } from "@/components";
import PageHeader from "@/components/common/page-header";
import { Download, Loader } from "lucide-react";
import { format } from "date-fns";
import { useState, useMemo } from "react";
import { useGetEntities } from "@/hooks/_base/use-get-entities";
import { formatDuration, getVariantFromStatus } from "@/utils";
import { TableColumn } from "@/components/ui/table";
import { IMachineStatus } from "@/utils/types";

const MachineHistory = () => {
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

  const {
    entities: states,
    loading: statesLoading,
    error: statesError,
    pagination,
  } = useGetEntities("/production/machines/statuses", {
    page,
    limit,
    sort,
    order,
    filter,
  });

  const {
    entities: machines,
    loading: machinesLoading,
    error: machinesError,
  } = useGetEntities("/production/machines");

  const loading = statesLoading || machinesLoading;
  const error = statesError || machinesError;

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

  const [openDropdown, setOpenDropdown] = useState<"machine" | "state" | null>(
    null
  );

  if (loading) {
    return (
      <div className="w-full flex flex-1 flex-col items-center justify-center">
        <Loader />
      </div>
    );
  }
  if (error) return <div>{error}</div>;

  return (
    <div className="w-full flex flex-1 flex-col">
      <PageHeader
        title="Machine History"
        description="Explore all machine history"
        actions={[
          {
            type: "dropdown",
            options: machineOptions,
            onChange: setSelectedMachine,
            value: selectedMachine,
            isOpen: openDropdown === "machine",
            onOpenChange: (isOpen) =>
              setOpenDropdown(isOpen ? "machine" : null),
            label: "Filter by machine",
          },
          {
            type: "dropdown",
            options: stateOptions,
            onChange: setSelectedState,
            value: selectedState,
            isOpen: openDropdown === "state",
            onOpenChange: (isOpen) => setOpenDropdown(isOpen ? "state" : null),
            label: "Filter by state",
          },
          {
            type: "button",
            label: "Export",
            icon: <Download size={16} />,
            onClick: () => {},
          },
        ]}
      />

      <Table<IMachineStatus>
        columns={columns as TableColumn<IMachineStatus>[]}
        data={states || []}
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
  );
};

export default MachineHistory;

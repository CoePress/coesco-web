import { Button, StatusBadge, Table } from "@/components";
import DatePicker from "@/components/v1/date-picker";
import PageHeader from "@/components/v1/page-header";
import { Download, Loader } from "lucide-react";
import { format, startOfToday } from "date-fns";
import { useState } from "react";
import useGetStates from "@/hooks/production/use-get-states";
import useGetMachines from "@/hooks/production/use-get-machines";
import { formatDuration } from "@/utils";
import { IMachineState } from "@/utils/types";
import { TableColumn } from "@/components/v1/table";

const MachineStates = () => {
  const parseDateParam = (param: string | null, fallback: Date) => {
    if (!param) return fallback;
    const [year, month, day] = param.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    return isNaN(d.getTime()) ? fallback : d;
  };

  const getInitialDateRange = () => {
    const params = new URLSearchParams(window.location.search);
    return {
      start: parseDateParam(params.get("startDate"), startOfToday()),
      end: parseDateParam(params.get("endDate"), new Date()),
    };
  };

  const [dateRange, setDateRange] = useState(getInitialDateRange);

  const {
    states,
    loading: statesLoading,
    error: statesError,
  } = useGetStates({
    startDate: dateRange.start.toISOString().slice(0, 10),
    endDate: dateRange.end.toISOString().slice(0, 10),
  });

  const {
    machines,
    loading: machinesLoading,
    error: machinesError,
  } = useGetMachines();

  const columns = [
    {
      key: "machineId",
      header: "Machine",
      render: (_: any, row: IMachineState) => {
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
            variant={value === "running" ? "success" : "default"}
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

  if (statesLoading) return <Loader />;
  if (statesError) return <div>Error</div>;

  if (machinesLoading) return <Loader />;
  if (machinesError) return <div>Error</div>;

  return (
    <div className="w-full flex flex-1 flex-col">
      <PageHeader
        title="Machine States"
        description="Explore all machine states"
        actions={
          <>
            <DatePicker
              dateRange={dateRange}
              setDateRange={setDateRange}
            />
            <Button variant="primary">
              <Download size={16} />
              Export
            </Button>
          </>
        }
      />

      <Table<IMachineState>
        columns={columns as TableColumn<IMachineState>[]}
        data={states || []}
        total={states?.length || 0}
        idField="id"
        pagination
      />
    </div>
  );
};

export default MachineStates;

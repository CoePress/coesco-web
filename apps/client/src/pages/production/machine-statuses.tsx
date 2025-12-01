import type { MachineStatus } from "@coesco/types";

import { format, isSameDay, startOfToday } from "date-fns";
import { RefreshCcw, X } from "lucide-react";
import { useEffect, useState } from "react";

import type { TableColumn } from "@/components/ui/table";
import type { IApiResponse } from "@/utils/types";

import { Button, Loader, PageHeader, StatusBadge } from "@/components";
import DateRangePicker from "@/components/ui/date-range-picker";
import Select from "@/components/ui/select";
import Table from "@/components/ui/table";
import { useApi } from "@/hooks/use-api";
import { formatDuration, getVariantFromStatus } from "@/utils";

function MachineStatuses() {
  const parseDateParam = (param: string | null, fallback: Date) => {
    if (!param)
      return fallback;
    const [year, month, day] = param.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    return isNaN(d.getTime()) ? fallback : d;
  };

  const getInitialValues = () => {
    const params = new URLSearchParams(window.location.search);
    return {
      machine: params.get("machine") || "",
      startDate: parseDateParam(params.get("startDate"), startOfToday()),
      endDate: parseDateParam(params.get("endDate"), new Date()),
    };
  };

  const initialValues = getInitialValues();

  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [sort, setSort] = useState("startTime");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [selectedMachine, setSelectedMachine] = useState(initialValues.machine);
  const [dateRange, setDateRange] = useState({
    start: initialValues.startDate,
    end: initialValues.endDate,
  });
  const [machineStatuses, setMachineStatuses] = useState<MachineStatus[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 0,
    total: 0,
    limit: 25,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const api = useApi<IApiResponse<MachineStatus[]>>();
  const machinesApi = useApi<IApiResponse<any[]>>();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlMachine = params.get("machine") || "";
    const urlStartDate = parseDateParam(params.get("startDate"), startOfToday());
    const urlEndDate = parseDateParam(params.get("endDate"), new Date());

    if (urlMachine !== selectedMachine) {
      setSelectedMachine(urlMachine);
    }
    if (urlStartDate.getTime() !== dateRange.start.getTime() || urlEndDate.getTime() !== dateRange.end.getTime()) {
      setDateRange({ start: urlStartDate, end: urlEndDate });
    }
  }, [window.location.search]);

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
            ...(selectedMachine ? { "filter[machineId]": selectedMachine } : {}),
            ...(dateRange.start ? { "filter[startTime][gte]": dateRange.start.toISOString() } : {}),
            ...(dateRange.end ? { "filter[startTime][lte]": dateRange.end.toISOString() } : {}),
          }),
          machinesApi.get("/production/machines", {
            page: 1,
            limit: 100,
            sort: "name",
            order: "asc",
          }),
        ]);

        if (statusesResponse) {
          const statusData = statusesResponse as IApiResponse<MachineStatus[]>;
          setMachineStatuses(statusData.data || []);
          if (statusData.meta) {
            setPagination({
              page: statusData.meta.page || 1,
              totalPages: statusData.meta.totalPages || 0,
              total: statusData.meta.total || 0,
              limit: statusData.meta.limit || 25,
            });
          }
        }

        if (machinesResponse) {
          const machineData = machinesResponse as IApiResponse<any[]>;
          setMachines(machineData.data || []);
        }
      }
      catch (err) {
        setError(api.error || machinesApi.error || "Failed to fetch data");
      }
      finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [page, limit, sort, order, selectedMachine, dateRange]);

  const refresh = () => {
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
            ...(selectedMachine ? { "filter[machineId]": selectedMachine } : {}),
            ...(dateRange.start ? { "filter[startTime][gte]": dateRange.start.toISOString() } : {}),
            ...(dateRange.end ? { "filter[startTime][lte]": dateRange.end.toISOString() } : {}),
          }),
          machinesApi.get("/production/machines", {
            page: 1,
            limit: 100,
            sort: "name",
            order: "asc",
          }),
        ]);

        if (statusesResponse) {
          const statusData = statusesResponse as IApiResponse<MachineStatus[]>;
          setMachineStatuses(statusData.data || []);
          if (statusData.meta) {
            setPagination({
              page: statusData.meta.page || 1,
              totalPages: statusData.meta.totalPages || 0,
              total: statusData.meta.total || 0,
              limit: statusData.meta.limit || 25,
            });
          }
        }

        if (machinesResponse) {
          const machineData = machinesResponse as IApiResponse<any[]>;
          setMachines(machineData.data || []);
        }
      }
      catch (err) {
        setError(api.error || machinesApi.error || "Failed to fetch data");
      }
      finally {
        setLoading(false);
      }
    };

    fetchData();
  };

  // const stateOptions = [
  //   { label: "All States", value: "" },
  //   { label: "Active", value: "ACTIVE" },
  //   { label: "Idle", value: "IDLE" },
  //   { label: "Alarm", value: "ALARM" },
  //   { label: "Maintenance", value: "MAINTENANCE" },
  //   { label: "Offline", value: "OFFLINE" },
  // ];

  const machineOptions = [
    { label: "All Machines", value: "" },
    ...(machines?.map(machine => ({
      label: machine.name,
      value: machine.id,
    })) || []),
  ];

  const columns = [
    {
      key: "machineId",
      header: "Machine",
      render: (_: any, row: MachineStatus) => {
        const machine = machines?.find(
          machine => machine.id === row.machineId,
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
    return <div>{error}</div>;
  }

  const updateURL = (machine: string, startDate: Date, endDate: Date) => {
    const params = new URLSearchParams(window.location.search);

    if (machine) {
      params.set("machine", machine);
    }
    else {
      params.delete("machine");
    }

    const startStr = startDate.toISOString().slice(0, 10);
    const endStr = endDate.toISOString().slice(0, 10);
    const isDefaultDate = isSameDay(startDate, startOfToday()) && isSameDay(endDate, startOfToday());

    if (isDefaultDate) {
      params.delete("startDate");
      params.delete("endDate");
    }
    else {
      params.set("startDate", startStr);
      params.set("endDate", endStr);
    }

    const newURL = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    window.history.replaceState({}, "", newURL);
  };

  const handleDateRangeChange = (startDate: Date, endDate: Date) => {
    setDateRange({ start: startDate, end: endDate });
    setPage(1);
    updateURL(selectedMachine, startDate, endDate);
  };

  const handleMachineChange = (machineId: string) => {
    setSelectedMachine(machineId);
    setPage(1);
    updateURL(machineId, dateRange.start, dateRange.end);
  };

  const clearFilters = () => {
    const defaultStart = startOfToday();
    const defaultEnd = new Date();
    setSelectedMachine("");
    setDateRange({ start: defaultStart, end: defaultEnd });
    setPage(1);
    updateURL("", defaultStart, defaultEnd);
  };

  const hasActiveFilters = selectedMachine || !isSameDay(dateRange.start, startOfToday()) || !isSameDay(dateRange.end, startOfToday());

  const Actions = () => {
    return (
      <div className="flex gap-2 items-center">
        {hasActiveFilters && (
          <Button onClick={clearFilters} variant="destructive" className="px-2">
            <X size={16} />
          </Button>
        )}
        <div className="w-64">
          <Select
            options={machineOptions}
            value={selectedMachine}
            onChange={(e) => {
              handleMachineChange(e.target.value);
            }}
            placeholder="All Machines"
          />
        </div>
        <DateRangePicker
          startDate={dateRange.start}
          endDate={dateRange.end}
          onChange={handleDateRangeChange}
        />
        <Button onClick={refresh} variant="primary" className="px-2">
          <RefreshCcw size={16} />
        </Button>
      </div>
    );
  };

  return (
    <div className="w-full flex-1 flex flex-col overflow-hidden">
      <PageHeader
        title="Machine Statuses"
        description="Explore all machine history"
        actions={<Actions />}
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
  );
}

export default MachineStatuses;

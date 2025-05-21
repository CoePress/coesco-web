import { StatusBadge, Table } from "@/components";
import PageHeader from "@/components/v1/page-header";
import { Calendar, Download, Loader } from "lucide-react";
import { format, startOfToday } from "date-fns";
import { useState } from "react";
import useGetMachines from "@/hooks/production/use-get-machines";
import { formatDuration, getVariantFromStatus } from "@/utils";
import { TableColumn } from "@/components/v1/table";
import { IMachineStatus } from "@/utils/types";
import useGetStatuses from "@/hooks/production/use-get-statuses";

// type DropdownProps = {
//   options: {
//     label: string;
//     value: string;
//     disabled?: boolean;
//   }[];
//   onChange: (value: string) => void;
//   selectedValue?: string;
//   isOpen: boolean;
//   onOpenChange: (isOpen: boolean) => void;
//   label: string;
// };

// const Dropdown = ({
//   options,
//   onChange,
//   selectedValue,
//   isOpen,
//   onOpenChange,
//   label,
// }: DropdownProps) => {
//   const selectedOption = options.find((opt) => opt.value === selectedValue);

//   return (
//     <div className="relative">
//       <Button
//         variant="secondary-outline"
//         onClick={() => onOpenChange(!isOpen)}>
//         <span>{selectedOption?.label || label}</span>
//       </Button>

//       {isOpen && (
//         <div className="absolute right-0 mt-2 w-48 rounded bg-foreground p-2 shadow-lg ring-1 ring-border ring-opacity-5">
//           <label className="text-sm text-text-muted mb-2 block">{label}</label>

//           <div className="flex flex-col gap-1">
//             {options.map((option) => (
//               <Button
//                 key={option.value}
//                 variant={
//                   option.value === selectedValue
//                     ? "primary"
//                     : "secondary-outline"
//                 }
//                 disabled={option.disabled}
//                 onClick={() => {
//                   onChange(option.value);
//                   onOpenChange(false);
//                 }}
//                 className="w-full justify-start text-left text-sm text-nowrap">
//                 {option.label}
//               </Button>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

const MachineHistory = () => {
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
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [sort, setSort] = useState("startTime");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  const {
    states,
    loading: statesLoading,
    error: statesError,
    pagination,
  } = useGetStatuses({
    page,
    limit,
    sort,
    order,
  });

  const {
    machines,
    loading: machinesLoading,
    error: machinesError,
  } = useGetMachines();

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
      // disabled: !states?.some((state) => state.machineId === machine.id),
    })) || []),
  ];

  const [selectedState, setSelectedState] = useState("");
  const [selectedMachine, setSelectedMachine] = useState("");

  const filteredStates =
    states?.filter(
      (state) =>
        (!selectedState || state.state === selectedState) &&
        (!selectedMachine || state.machineId === selectedMachine)
    ) || [];

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

  if (loading) return <Loader />;
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
            type: "datepicker",
            dateRange: dateRange,
            setDateRange: setDateRange,
            icon: <Calendar size={16} />,
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
        data={filteredStates}
        total={filteredStates.length}
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

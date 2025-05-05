import { useState } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  Calendar as CalendarIcon,
  RefreshCw,
} from "lucide-react";
import useGetMachines from "@/hooks/machine/use-get-machines";
import useGetMachineStates from "@/hooks/machine-state/use-get-states";
import Loader from "@/components/shared/loader";
import { formatDuration } from "@/lib/utils";
import Badge from "@/components/badge";

const StatesPage = () => {
  const initializeStateFromURL = () => {
    const params = new URLSearchParams(window.location.search);
    const startedAt = params.get("startedAt");
    const endedAt = params.get("endedAt");

    return {
      view: params.get("view") || "states",
      machine: params.get("machine") ?? undefined,
      monitor: params.get("monitor") ?? undefined,
      startedAt: startedAt ? new Date(startedAt) : undefined,
      endedAt: endedAt ? new Date(endedAt) : undefined,
      page: parseInt(params.get("page") || "1"),
      state: params.get("state") ?? undefined,
    };
  };

  const dateToString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const updateURL = (params: Record<string, string | undefined>) => {
    const searchParams = new URLSearchParams(window.location.search);
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        searchParams.set(key, value);
      } else {
        searchParams.delete(key);
      }
    });
    const newURL = `${window.location.pathname}?${searchParams.toString()}`;
    window.history.replaceState({}, "", newURL);
  };

  const initialState = initializeStateFromURL();
  const [startedAt, setStartedAt] = useState<Date | undefined>(
    initialState.startedAt
  );
  const [endedAt, setEndedAt] = useState<Date | undefined>(
    initialState.endedAt
  );
  const [selectedMachine, setSelectedMachine] = useState<string | undefined>(
    initialState.machine
  );

  const [page, setPage] = useState(initialState.page);
  const limit = 50;

  const {
    states,
    loading: statesLoading,
    error: statesError,
  } = useGetMachineStates({
    machineId: selectedMachine,
    startedAt,
    endedAt,
    page,
    limit,
  });

  const { machines } = useGetMachines();

  const clearAllFilters = () => {
    setSelectedMachine(undefined);
    setStartedAt(undefined);
    setEndedAt(undefined);
    setPage(1);

    const newURL = `${window.location.pathname}`;
    window.history.replaceState({}, "", newURL);
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="shrink-0 flex flex-col md:flex-row justify-between md:items-center p-2 border-b">
        <h1 className="whitespace-nowrap mb-3 md:mb-0">States</h1>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-2">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button
              variant="ghost"
              onClick={clearAllFilters}
              className="text-destructive hover:text-destructive/80">
              Clear Filter
            </Button>

            <div className="flex flex-1 md:flex-none gap-2">
              <Popover modal={false}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex-1 md:flex-none">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startedAt ? format(startedAt, "PP") : "From"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0"
                  align="start">
                  <Calendar
                    mode="single"
                    selected={startedAt}
                    onSelect={(date) => {
                      setStartedAt(date);
                      setPage(1);
                      updateURL({
                        start: date ? dateToString(date) : undefined,
                      });
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover modal={false}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex-1 md:flex-none">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endedAt ? format(endedAt, "PP") : "To"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0"
                  align="start">
                  <Calendar
                    mode="single"
                    selected={endedAt}
                    onSelect={(date) => {
                      setEndedAt(date);
                      setPage(1);
                      updateURL({ end: date ? dateToString(date) : undefined });
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Select
              value={selectedMachine === undefined ? "all" : selectedMachine}
              onValueChange={(value) => {
                const machineId = value === "all" ? undefined : value;
                setSelectedMachine(machineId);
                setPage(1);
                updateURL({ machine: machineId });
              }}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Select Machine" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Machines</SelectItem>
                {machines?.map((machine) => (
                  <SelectItem
                    key={machine.id}
                    value={machine.id}>
                    {machine.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 ml-auto md:ml-0">
              <Button
                size="icon"
                variant="outline"
                disabled={page === 1}
                onClick={() => {
                  const newPage = page - 1;
                  setPage(newPage);
                  updateURL({ page: newPage.toString() });
                }}>
                <ArrowLeft />
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() => {
                  const newPage = page + 1;
                  setPage(newPage);
                  updateURL({ page: newPage.toString() });
                }}>
                <ArrowRight />
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() => window.location.reload()}>
                <RefreshCw />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 p-2 relative">
        <div className="absolute inset-0 p-2">
          <>
            {statesLoading && (
              <div className="flex-1 flex items-center justify-center">
                <Loader />
              </div>
            )}

            {!statesLoading && statesError && (
              <div className="flex-1 flex items-center justify-center">
                {statesError}
              </div>
            )}

            {!statesLoading && !statesError && states === null && (
              <div className="flex w-full items-center justify-center py-20">
                <div className="flex flex-col items-center justify-center rounded-lg p-4">
                  <h3 className="font-semibold mb-2">
                    No State Data Available
                  </h3>
                  <Button onClick={() => window.location.reload()}>
                    Refresh
                  </Button>
                </div>
              </div>
            )}

            {!statesLoading &&
              !statesError &&
              states &&
              states &&
              states.length > 0 && (
                <div className="w-full h-full overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">
                          Machine
                        </TableHead>
                        <TableHead className="whitespace-nowrap">
                          State
                        </TableHead>
                        <TableHead className="whitespace-nowrap">
                          Start Time
                        </TableHead>
                        <TableHead className="whitespace-nowrap">
                          End Time
                        </TableHead>
                        <TableHead className="whitespace-nowrap">
                          Duration
                        </TableHead>
                        <TableHead className="whitespace-nowrap">
                          Program
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {states.map((state) => (
                        <TableRow
                          key={state.id}
                          className="whitespace-nowrap">
                          <TableCell>
                            {state.machine!.name || "Unknown"}
                          </TableCell>
                          <TableCell>
                            <Badge status={state.state || "offline"}>
                              {state.state || "OFFLINE"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(state.startedAt), "PPpp")}
                          </TableCell>
                          <TableCell>
                            {state.endedAt
                              ? format(new Date(state.endedAt), "PPpp")
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {state.durationMs !== null &&
                            state.durationMs !== undefined
                              ? formatDuration(state.durationMs)
                              : state.endedAt
                                ? formatDuration(
                                    new Date(state.endedAt).getTime() -
                                      new Date(state.startedAt).getTime()
                                  )
                                : formatDuration(
                                    new Date().getTime() -
                                      new Date(state.startedAt).getTime()
                                  )}
                          </TableCell>
                          <TableCell>
                            {state.data?.programInfo.mainProgram || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
          </>
        </div>
      </div>
    </div>
  );
};

export default StatesPage;

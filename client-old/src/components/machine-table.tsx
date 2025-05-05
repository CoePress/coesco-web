import Loader from "@/components/shared/loader";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import React from "react";
import {
  IMachine,
  IMachineCurrent,
  IMachineConnection,
} from "@machining/types";
import Badge from "./badge";
import MachineModal from "./machine-modal";

interface MachineTableProps {
  machines: IMachineCurrent[] | null;
  loading: boolean;
  error: string | null;
}

const MachineTable = React.memo(
  ({
    machines,
    loading: machinesLoading,
    error: machinesError,
  }: MachineTableProps) => {
    const [machineUpdate, setMachineUpdate] = useState<IMachine | null>(null);
    const [machineConnection, setMachineConnection] = useState<
      IMachineConnection | undefined
    >(undefined);

    const handleUpdateMachine = (
      machine: IMachine,
      connection?: IMachineConnection
    ) => {
      console.log(machine, connection);
      setMachineConnection(connection);
    };

    return (
      <div className="flex-1 min-h-0 relative">
        <div className="absolute inset-0">
          {machinesLoading && (
            <div className="flex-1 flex items-center justify-center">
              <Loader />
            </div>
          )}

          {!machinesLoading && machinesError && (
            <div className="flex-1 flex items-center justify-center">
              {machinesError}
            </div>
          )}

          {!machinesLoading &&
            !machinesError &&
            (!machines || machines.length === 0) && (
              <div className="flex-1 flex items-center justify-center">
                No Machines Found
              </div>
            )}

          {!machinesLoading &&
            !machinesError &&
            machines &&
            machines.length > 0 && (
              <div className="w-full h-full overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/4">Name</TableHead>
                      <TableHead className="w-1/4">Type</TableHead>
                      <TableHead className="w-1/4">Status</TableHead>
                      <TableHead className="w-1/4"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {machines.map((machine) => (
                      <TableRow
                        key={machine.id}
                        className="text-nowrap">
                        <TableCell className="font-medium">
                          {machine.name}
                        </TableCell>
                        <TableCell className="capitalize">
                          {machine.type.toLowerCase()}
                        </TableCell>
                        <TableCell>
                          <Badge status={machine.execution}>
                            {machine.execution}
                          </Badge>
                        </TableCell>
                        <TableCell className="flex gap-2 justify-end px-8">
                          <Dialog
                            open={machineUpdate !== null}
                            onOpenChange={(open) =>
                              setMachineUpdate(open ? machine : null)
                            }>
                            <DialogTrigger asChild>
                              <p className="hover:underline cursor-pointer">
                                Edit
                              </p>
                            </DialogTrigger>
                            <MachineModal
                              machine={machineUpdate}
                              connection={machineConnection}
                              onUpdate={handleUpdateMachine}
                              onClose={() => setMachineUpdate(null)}
                            />
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
        </div>
      </div>
    );
  }
);

MachineTable.displayName = "MachineTable";

export default MachineTable;

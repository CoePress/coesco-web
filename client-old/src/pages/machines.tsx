import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Grid, Map, Table } from "lucide-react";
import { useSocket } from "@/contexts/socket-context";
import useGetMachines from "@/hooks/machine/use-get-machines";
import MachineGrid from "@/components/machine-grid";
import MachineTable from "@/components/machine-table";
import { IMachineCurrent } from "@machining/types";
import MachineMap from "@/components/machine-map";

const MachinesPage = () => {
  const [activeTab, setActiveTab] = useState("table");

  const {
    machines,
    loading: machinesLoading,
    error: machinesError,
  } = useGetMachines();

  const { machineData } = useSocket();

  const machinesWithStates =
    machines?.map((machine) => ({
      ...machine,
      ...machineData[machine.id]?.data,
      state: machineData[machine.id]?.state || "OFFLINE",
    })) || [];

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col gap-2">
        <div className="shrink-0 p-2 border-b">
          <div className="flex justify-between items-center">
            <h1>Machines</h1>

            <div className="flex items-center gap-2">
              <Tabs>
                <TabsList>
                  <TabsTrigger
                    value="table"
                    data-state={activeTab === "table" ? "active" : ""}
                    onClick={() => setActiveTab("table")}
                    className="flex items-center gap-2">
                    <Table className="h-4 w-4" />
                    <span>Table</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="grid"
                    data-state={activeTab === "grid" ? "active" : ""}
                    onClick={() => setActiveTab("grid")}
                    className="flex items-center gap-2">
                    <Grid className="h-4 w-4" />
                    <span>Grid</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="floor"
                    data-state={activeTab === "floor" ? "active" : ""}
                    onClick={() => setActiveTab("floor")}
                    className="flex items-center gap-2">
                    <Map className="h-4 w-4" />
                    <span>Floor</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>

        {activeTab === "table" && (
          <div className="flex-1 flex overflow-auto m-0 px-2 pb-2">
            <MachineTable
              machines={machinesWithStates as IMachineCurrent[]}
              loading={machinesLoading}
              error={machinesError}
            />
          </div>
        )}

        {activeTab === "grid" && (
          <div className="flex-1 flex overflow-auto m-0 px-2 pb-2">
            <MachineGrid machines={machinesWithStates} />
          </div>
        )}

        {activeTab === "floor" && (
          <div className="flex-1 flex overflow-auto m-0 px-2 pb-2">
            <MachineMap machines={machinesWithStates} />
          </div>
        )}
      </div>
    </div>
  );
};

export default MachinesPage;

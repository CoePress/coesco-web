import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Badge from "@/components/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "./ui/button";
import { IMachineCurrent } from "@machining/types";
import { STATUS_MAPPING } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

type MachineCardProps = {
  machine: IMachineCurrent;
};

type MachineGridProps = {
  machines: IMachineCurrent[];
};

const MachineCard = ({ machine }: MachineCardProps) => {
  if (!machine) {
    return (
      <Card className="overflow-hidden border-2 bg-muted cursor-pointer">
        <CardContent className="p-2">
          <div className="flex items-center justify-center h-64">
            <span className="text-muted-foreground">No machine data</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const status = machine.execution?.toLowerCase() || "offline";
  const currentData = machine || {};

  let statusKey: keyof typeof STATUS_MAPPING = "offline";
  for (const [key, config] of Object.entries(STATUS_MAPPING)) {
    if (config.states.includes(status as never)) {
      statusKey = key as keyof typeof STATUS_MAPPING;
      break;
    }
  }

  const statusColor = STATUS_MAPPING[statusKey].border;
  const machineName = machine.name || "Unknown Machine";

  const mainProgram = currentData?.programInfo?.mainProgram;
  const subProgram = currentData?.programInfo?.subProgram;
  const toolNumber = currentData?.tool?.number;
  const controllerMode = currentData?.mode;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card
          className={`overflow-hidden border ${statusColor} cursor-pointer bg-card transition-shadow duration-300 hover:shadow-lg`}>
          <CardContent className="p-2 py-1">
            <div className="mb-1">
              <h3 className="text-lg font-bold">{machineName}</h3>
            </div>

            <div className="mb-3">
              <Badge status={status}>{status}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <div className="text-sm text-muted-foreground">Program</div>
                <div className="font-medium truncate">
                  {mainProgram || subProgram || "-"}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Tool</div>
                <div className="font-medium">{toolNumber || "-"}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto p-4 pb-2">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div
              className={`h-3 w-3 rounded-full ${STATUS_MAPPING[statusKey].background}`}></div>
            {machineName} Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <div className="grid grid-cols-2 gap-2">
            <Card>
              <CardContent className="p-2 text-sm">
                <h4 className="text-sm font-medium mb-2">Status Information</h4>
                <div className="grid grid-cols-[1fr_auto] gap-1">
                  <span className="text-muted-foreground">Machine:</span>
                  <span className="font-medium text-right">{machineName}</span>

                  <span className="text-muted-foreground">Controller:</span>
                  <span className="font-medium text-right">
                    {controllerMode || "N/A"}
                  </span>

                  <span className="text-muted-foreground">Execution:</span>
                  <span className="font-medium text-right">
                    {machine.execution || "N/A"}
                  </span>

                  <span className="text-muted-foreground">Updated:</span>
                  <span className="font-medium text-right">
                    {new Date(
                      currentData?.lastUpdated || Date.now()
                    ).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-2 text-sm">
                <h4 className="text-sm font-medium mb-2">
                  Program Information
                </h4>
                <div className="grid grid-cols-[1fr_auto] gap-1">
                  <span className="text-muted-foreground">Main Program:</span>
                  <span className="font-medium text-right">
                    {mainProgram || "N/A"}
                  </span>

                  {subProgram && (
                    <>
                      <span className="text-muted-foreground">
                        Sub Program:
                      </span>
                      <span className="font-medium text-right">
                        {subProgram}
                      </span>
                    </>
                  )}

                  <span className="text-muted-foreground">Tool:</span>
                  <span className="font-medium text-right">
                    {toolNumber || "N/A"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-2">
              <h4 className="text-sm font-medium mb-2">Spindle Information</h4>
              {currentData?.spindles && currentData.spindles.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {currentData.spindles.map((spindle: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center border rounded p-2 bg-muted/30">
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Spindle {spindle.name || `#${index + 1}`}
                        </div>
                        <div className="text-sm font-bold">
                          {spindle.speed || "0"} RPM
                          {spindle.override && (
                            <span className="text-xs ml-1 text-muted-foreground">
                              ({spindle.override}%)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground text-sm py-2">
                  No spindle data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-2">
              <h4 className="text-sm font-medium mb-2">Axis Information</h4>
              {currentData?.axes && currentData.axes.length > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                  {currentData.axes.map((axis: any, index: number) => (
                    <div
                      key={index}
                      className="border rounded p-2 bg-muted/30">
                      <h5 className="text-sm font-medium">{axis.name} Axis</h5>
                      <div className="mt-1 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Pos:</span>
                          <span>
                            {axis.position
                              ? parseFloat(axis.position).toFixed(3)
                              : "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Feed:</span>
                          <span>
                            {axis.feedRate
                              ? parseFloat(axis.feedRate).toFixed(1)
                              : "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Load:</span>
                          <span>
                            {axis.load
                              ? `${parseFloat(axis.load).toFixed(0)}%`
                              : "N/A"}
                          </span>
                        </div>
                        {axis.load && (
                          <Progress
                            value={parseInt(axis.load)}
                            className="h-1 mt-1"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground text-sm py-2">
                  No axis data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const MachineGrid = ({ machines }: MachineGridProps) => {
  return (
    <div className="flex-1 overflow-auto">
      {machines.length === 0 ? (
        <div className="flex w-full items-center justify-center py-20">
          <div className="flex flex-col items-center justify-center rounded-lg p-2">
            <h3 className="font-semibold mb-2">No Machine Data Available</h3>
            <Button onClick={() => window.location.reload()}>Refresh</Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {machines.map((machine) => (
            <MachineCard
              key={machine.id}
              machine={machine}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MachineGrid;

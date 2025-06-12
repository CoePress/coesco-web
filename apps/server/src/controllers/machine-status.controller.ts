import { MachineStatus } from "@prisma/client";
import { machineStatusService } from "@/services";
import { BaseController } from "./_";

export class MachineStatusController extends BaseController<MachineStatus> {
  protected service = machineStatusService;
  protected entityName = "MachineStatus";
}

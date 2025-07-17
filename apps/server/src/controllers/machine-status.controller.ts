import { MachineStatus } from "@prisma/client";
import { machineStatusService } from "@/services/repository";
import { BaseController } from "./_base.controller";

export class MachineStatusController extends BaseController<MachineStatus> {
  protected service = machineStatusService;
  protected entityName = "MachineStatus";
}

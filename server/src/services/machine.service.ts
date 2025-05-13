import Machine from "@/models/machine";
import {
  ICreateMachineDto,
  IMachine,
  MachineConnectionType,
} from "@/types/schema.types";

export class MachineService {
  async getMachines() {}

  async getMachine(id: string) {}

  async createMachine(machine: ICreateMachineDto) {
    await this.validateMachine(machine);

    const newMachine = await Machine.create(machine);
    return newMachine;
  }

  async updateMachine(id: string, machine: IMachine) {}

  async deleteMachine(id: string) {}

  async getMachineStatuses(id: string) {}

  // Private Methods
  private async validateMachine(machine: ICreateMachineDto) {
    if (!machine.name) {
      throw new Error("Machine name is required");
    }
    if (!machine.slug) {
      throw new Error("Machine slug is required");
    }
    if (!machine.type) {
      throw new Error("Machine type is required");
    }
    if (!machine.controllerType) {
      throw new Error("Machine controller type is required");
    }
    if (!machine.connectionType) {
      throw new Error("Machine connection type is required");
    }
    if (!machine.connectionHost) {
      throw new Error("Machine connection host is required");
    }
    if (!machine.connectionPort) {
      throw new Error("Machine connection port is required");
    }

    const existingMachine = await Machine.findOne({
      where: { slug: machine.slug },
    });
    if (existingMachine) {
      throw new Error("Machine already exists");
    }
  }
}

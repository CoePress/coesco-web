import { machineSeed } from "@/config/database";
import Machine from "@/models/machine";
import {
  ICreateMachineDTO,
  IMachineService,
  IUpdateMachineDTO,
  MachineType,
  IMachine,
  ValidationError,
  MachineController,
} from "@/utils/types";

class MachineService implements IMachineService {
  async initialize() {
    const machines = await Machine.findAll();
    if (machines.length === 0) {
      for (const machine of machineSeed) {
        await this.createMachine({
          ...machine,
          type: machine.type as MachineType,
          controller: machine.controller as MachineController,
        });
      }
    }
  }

  async createMachine(data: ICreateMachineDTO): Promise<IMachine> {
    await this.validateMachine(data);

    const existing = await Machine.findOne({ where: { slug: data.slug } });
    if (existing)
      throw new ValidationError("Machine with this slug already exists");

    const machine = await Machine.create(data);
    return machine;
  }

  async getMachines(type?: MachineType): Promise<IMachine[]> {
    const where: any = {};
    if (type) where.type = type;
    const machines = await Machine.findAll({
      where,
      raw: true,
    });
    return machines;
  }

  async getMachine(id: string): Promise<IMachine | null> {
    if (!id) throw new ValidationError("Machine ID is required");
    const machine = await Machine.findByPk(id);
    return machine ? machine : null;
  }

  async getMachineBySlug(slug: string): Promise<IMachine | null> {
    if (!slug) throw new ValidationError("Machine slug is required");
    const machine = await Machine.findOne({ where: { slug } });
    return machine ? machine : null;
  }

  async updateMachine(id: string, data: IUpdateMachineDTO): Promise<IMachine> {
    if (!id) throw new ValidationError("Machine ID is required");

    const machine = await Machine.findByPk(id);
    if (!machine) throw new ValidationError("Machine not found");

    if (data.name !== undefined) machine.name = data.name;
    if (data.type !== undefined) machine.type = data.type;

    await machine.save();
    return machine;
  }

  async deleteMachine(id: string): Promise<boolean> {
    if (!id) throw new ValidationError("Machine ID is required");

    const machine = await Machine.findByPk(id);
    if (!machine) return false;

    await machine.destroy();
    return true;
  }

  async validateMachine(machine: ICreateMachineDTO): Promise<void> {
    if (!machine.slug) throw new ValidationError("Machine slug is required");
    if (!machine.name) throw new ValidationError("Machine name is required");
    if (!machine.type) throw new ValidationError("Machine type is required");
  }
}

export default MachineService;

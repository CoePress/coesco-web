import Machine from "@/models/machine";
import { IQueryParams } from "@/types/api.types";
import { ICreateMachineDto, IMachine } from "@/types/schema.types";
import { buildQuery } from "@/utils";

export class MachineService {
  async getMachines(params: IQueryParams) {
    const { whereClause, orderClause, page, limit, offset } = buildQuery(
      params,
      ["name", "slug", "type", "controllerType"]
    );

    const machines = await Machine.findAll({
      where: whereClause,
      order: Object.entries(orderClause).map(([key, value]) => [key, value]),
      limit,
      offset,
    });

    const total = await Machine.count({ where: whereClause });
    const totalPages = limit ? Math.ceil(total / limit) : 1;

    return {
      success: true,
      data: machines.map((machine) => machine.toJSON() as IMachine),
      total,
      totalPages,
      page,
      limit,
    };
  }

  async getMachine(id: string) {
    const machine = await Machine.findByPk(id);
    if (!machine) {
      throw new Error("Machine not found");
    }
    return machine;
  }

  async createMachine(machine: ICreateMachineDto) {
    await this.validateMachine(machine);

    const newMachine = await Machine.create(machine);
    return newMachine;
  }

  async updateMachine(id: string, machine: IMachine) {}

  async deleteMachine(id: string) {}

  async getMachineStatuses(params: IQueryParams) {
    const { whereClause, orderClause, page, limit, offset } = buildQuery(
      params,
      ["machineId"]
    );
  }

  // Private Methods
  private async validateMachine(machine: ICreateMachineDto) {}
}

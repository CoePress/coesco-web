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

  async getMachine(id: string) {}

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

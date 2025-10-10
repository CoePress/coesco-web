import type { Employee } from "@prisma/client";

import { employeeRepository } from "@/repositories";

export class EmployeeService {
  async createEmployee(data: Omit<Employee, "id" | "createdAt" | "updatedAt">) {
    return employeeRepository.create(data);
  }

  async updateEmployee(id: string, data: Partial<Omit<Employee, "id" | "createdAt" | "updatedAt">>) {
    return employeeRepository.update(id, data);
  }

  async deleteEmployee(id: string) {
    return employeeRepository.delete(id);
  }

  async getAllEmployees() {
    return employeeRepository.getAll();
  }

  async getEmployeeById(id: string) {
    return employeeRepository.getById(id);
  }
}
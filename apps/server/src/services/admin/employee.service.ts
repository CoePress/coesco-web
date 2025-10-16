import type { Employee, User } from "@prisma/client";

import type { IQueryParams } from "@/types";

import { employeeRepository, userRepository } from "@/repositories";

export class EmployeeService {
  async createEmployee(data: Partial<Employee>) {
    return employeeRepository.create(data);
  }

  async updateEmployee(id: string, data: Partial<Employee>) {
    return employeeRepository.update(id, data);
  }

  async deleteEmployee(id: string) {
    return employeeRepository.delete(id);
  }

  async getAllEmployees(params?: IQueryParams<Employee>) {
    return employeeRepository.getAll(params);
  }

  async getEmployeeById(id: string, params?: IQueryParams<Employee>) {
    return employeeRepository.getById(id, params);
  }

  async createUser(data: Partial<User>) {
    return userRepository.create(data);
  }

  async updateUser(id: string, data: Partial<User>) {
    return userRepository.update(id, data);
  }

  async deleteUser(id: string) {
    return userRepository.delete(id);
  }

  async getAllUsers(params?: IQueryParams<User>) {
    return userRepository.getAll(params);
  }

  async getUserById(id: string, params?: IQueryParams<User>) {
    return userRepository.getById(id, params);
  }
}

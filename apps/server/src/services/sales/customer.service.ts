import type { Company } from "@prisma/client";

import type { IQueryParams } from "@/types";

import { companyRepository } from "@/repositories";

export class CustomerService {
  async createCompany(data: Partial<Company>) {
    return companyRepository.create(data);
  }

  async updateCompany(id: string, data: Partial<Company>) {
    return companyRepository.update(id, data);
  }

  async deleteCompany(id: string) {
    return companyRepository.delete(id);
  }

  async getAllCompanies(params?: IQueryParams<Company>) {
    return companyRepository.getAll(params);
  }

  async getCompanyById(id: string, params?: IQueryParams<Company>) {
    return companyRepository.getById(id, params);
  }
}
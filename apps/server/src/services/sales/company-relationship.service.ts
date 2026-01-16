import type { CompanyRelationship } from "@prisma/client";

import type { IQueryParams } from "@/types";

import { companyRelationshipRepository } from "@/repositories";

export class CompanyRelationshipService {
  async createCompanyRelationship(data: Partial<CompanyRelationship>) {
    return companyRelationshipRepository.create(data);
  }

  async updateCompanyRelationship(id: string, data: Partial<CompanyRelationship>) {
    return companyRelationshipRepository.update(id, data);
  }

  async deleteCompanyRelationship(id: string) {
    return companyRelationshipRepository.delete(id);
  }

  async getAllCompanyRelationships(params?: IQueryParams<CompanyRelationship>) {
    return companyRelationshipRepository.getAll(params);
  }

  async getCompanyRelationshipById(id: string, params?: IQueryParams<CompanyRelationship>) {
    return companyRelationshipRepository.getById(id, params);
  }
}

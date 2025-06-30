import { Company, Industry } from "@prisma/client";
import { BaseService } from "./_base.service";
import { prisma } from "@/utils/prisma";
import { BadRequestError } from "@/middleware/error.middleware";

type CompanyAttributes = Omit<Company, "id" | "createdAt" | "updatedAt">;

export class CompanyService extends BaseService<Company> {
  protected model = prisma.company;
  protected entityName = "Company";
  protected modelName = "company";

  protected async validate(company: CompanyAttributes): Promise<void> {
    if (!company.name) {
      throw new BadRequestError("Company name is required");
    }

    if (company.industry) {
      if (!Object.values(Industry).includes(company.industry)) {
        throw new BadRequestError("Invalid industry");
      }
    }
  }
}

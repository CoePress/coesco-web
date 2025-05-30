import { Company } from "@prisma/client";
import { BaseService } from "./_";
import { prisma } from "@/utils/prisma";
import { BadRequestError } from "@/middleware/error.middleware";

type CompanyAttributes = Omit<Company, "id" | "createdAt" | "updatedAt">;

export class CompanyService extends BaseService<Company> {
  protected model = prisma.company;
  protected entityName = "Company";

  protected async validate(company: CompanyAttributes): Promise<void> {
    if (!company.name) {
      throw new BadRequestError("Company name is required");
    }
  }
}

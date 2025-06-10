import { Company } from "@prisma/client";
import { prisma } from "@/utils/prisma";
import { BaseService } from "../repository/_";
import { BadRequestError } from "@/middleware/error.middleware";


type CompanyAttributes = Omit<Company, "id" | "createdAt" | "updatedAt">;

export class CompanyService extends BaseService<Company> {
  protected model = prisma.company;
  protected entityName = "Company";
  protected modelName = "company";

  protected getOrganizationFilter(organizationId: string) {
    return { organizationId };
  }

  protected async validate(data: CompanyAttributes): Promise<void> {
    if (!data.name) {
      throw new BadRequestError("name is required");
    }

    if (!data.status) {
      throw new BadRequestError("status is required");
    }
  }
}

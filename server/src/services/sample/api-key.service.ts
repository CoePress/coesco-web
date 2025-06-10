import { ApiKey } from "@prisma/client";
import { prisma } from "@/utils/prisma";
import { BaseService } from "../repository/_";
import { BadRequestError } from "@/middleware/error.middleware";


type ApiKeyAttributes = Omit<ApiKey, "id" | "createdAt" | "updatedAt">;

export class ApiKeyService extends BaseService<ApiKey> {
  protected model = prisma.apiKey;
  protected entityName = "ApiKey";
  protected modelName = "apiKey";

  protected getOrganizationFilter(organizationId: string) {
    return { organizationId };
  }

  protected async validate(data: ApiKeyAttributes): Promise<void> {
    if (!data.key) {
      throw new BadRequestError("key is required");
    }
  }
}

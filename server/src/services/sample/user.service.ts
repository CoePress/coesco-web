import { User } from "@prisma/client";
import { prisma } from "@/utils/prisma";
import { BaseService } from "../repository/_";
import { BadRequestError } from "@/middleware/error.middleware";


type UserAttributes = Omit<User, "id" | "createdAt" | "updatedAt">;

export class UserService extends BaseService<User> {
  protected model = prisma.user;
  protected entityName = "User";
  protected modelName = "user";

  protected getOrganizationFilter(organizationId: string) {
    return { organizationId };
  }

  protected async validate(data: UserAttributes): Promise<void> {
    if (!data.username) {
      throw new BadRequestError("username is required");
    }

    if (!data.role) {
      throw new BadRequestError("role is required");
    }

    if (!data.isActive) {
      throw new BadRequestError("isActive is required");
    }
  }
}

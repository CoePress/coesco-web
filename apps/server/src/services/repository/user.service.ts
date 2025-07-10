import { User } from "@prisma/client";
import { BaseService } from "./_base.service";
import { prisma } from "@/utils/prisma";

type UserAttributes = Omit<User, "id" | "createdAt" | "updatedAt">;

export class UserService extends BaseService<User> {
  protected model = prisma.user;
  protected entityName = "User";
  protected modelName = "user";

  protected async validate(user: UserAttributes): Promise<void> {}
}

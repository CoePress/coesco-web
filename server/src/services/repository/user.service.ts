import { User } from "@prisma/client";
import { BaseService } from "./_";
import { prisma } from "@/utils/prisma";

type UserAttributes = Omit<User, "id" | "createdAt" | "updatedAt">;

export class UserService extends BaseService<User> {
  protected model = prisma.user;
  protected entityName = "User";

  protected async validate(user: UserAttributes): Promise<void> {}
}

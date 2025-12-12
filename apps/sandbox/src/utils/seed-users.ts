import bcrypt from "bcryptjs";
import { PrismaClient } from "../generated/client";

export type SeedUser = {
  username: string;
  password?: string;
  microsoftId?: string | null;
  isActive?: boolean;
};

export async function seedUsers(prisma: PrismaClient, users: SeedUser[]) {
  for (const u of users) {
    const passwordHash = u.password ? await bcrypt.hash(u.password, 12) : null;

    await prisma.user.upsert({
      where: { username: u.username },
      update: {
        microsoftId: u.microsoftId ?? undefined,
        isActive: u.isActive ?? undefined,
        password: passwordHash ?? undefined,
      },
      create: {
        username: u.username,
        microsoftId: u.microsoftId ?? null,
        isActive: u.isActive ?? false,
        password: passwordHash,
      },
    });
  }
}

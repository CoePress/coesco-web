import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../generated/client";
import env from "./env";

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export { prisma };

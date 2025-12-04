import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  process.env.NODE_ENV === "production"
    ? globalForPrisma.prisma ?? new PrismaClient()
    : new PrismaClient();

if (process.env.NODE_ENV === "production") globalForPrisma.prisma = prisma;

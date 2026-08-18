import { prismaClient } from "@/generated/prisma"

export const prisma = globalThis.prismaGlobal ?? new prismaClient()

if (process.env.NODE_ENV !== 'production'){
    globalThis.prismaGlobal = prisma
}
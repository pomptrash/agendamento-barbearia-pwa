import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from "@/generated/prisma/client"

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL
})

export const prisma = globalThis.prismaGlobal ?? new PrismaClient({adapter})

if (process.env.NODE_ENV !== 'production'){
    globalThis.prismaGlobal = prisma
}
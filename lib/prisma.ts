import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const connectionString = `${process.env.DATABASE_URL}`;
console.log(process.env.DATABASE_URL);

const adapter = new PrismaPg({ connectionString });
const prisma = globalForPrisma.prisma ||  new PrismaClient({ adapter });

export { prisma };

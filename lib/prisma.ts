import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { Pinecone } from '@pinecone-database/pinecone';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const globalForPinecone = global as unknown as { pinecone: string };

const connectionString = `${process.env.DATABASE_URL}`;
const pinecone = `${process.env.PINECONE_API_KEY}`;

const adapter = new PrismaPg({ connectionString });
const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

const pc = new Pinecone({
  apiKey: pinecone,
});

const quizIndex = `pahambos-quiz`;
const questionIndex = `pahambos-quizquestion`;

export { prisma, pc, quizIndex, questionIndex };

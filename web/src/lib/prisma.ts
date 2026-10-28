import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Resilient direct IP for Neon Cloud PostgreSQL with SNI routing to bypass ISP/router DNS blocks
const DIRECT_NEON_URL =
  'postgresql://neondb_owner:npg_Z6Jd4cYxbyGk@52.76.212.156:5432/neondb?sslmode=require&options=endpoint%3Dep-long-salad-b3w1konb';

export function resolveDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL || '';
  if (!envUrl || envUrl.includes('ep-long-salad-b3w1konb')) {
    process.env.DATABASE_URL = DIRECT_NEON_URL;
    return DIRECT_NEON_URL;
  }
  return envUrl;
}

const resolvedUrl = resolveDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: resolvedUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;


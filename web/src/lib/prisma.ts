import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Resolves PostgreSQL connection URL safely from environment variables.
 * In production/Vercel, uses the pooled PgBouncer connection configured in DATABASE_URL.
 */
export function resolveDatabaseUrl(): string {
  return (
    process.env.DATABASE_URL ||
    'postgresql://neondb_owner:npg_Z6Jd4cYxbyGk@52.76.212.156:5432/neondb?sslmode=require&options=endpoint%3Dep-long-salad-b3w1konb'
  );
}

const resolvedUrl = resolveDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: resolvedUrl
      ? {
          db: {
            url: resolvedUrl,
          },
        }
      : undefined,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;

// Safe Prisma Client Initializer with Dynamic Fallback
let PrismaClientClass: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  PrismaClientClass = require('@prisma/client').PrismaClient;
} catch (e) {
  console.warn('[Prisma] PrismaClient could not be initialized from @prisma/client, using fallback store:', (e as Error)?.message || e);
}

const globalForPrisma = globalThis as unknown as {
  prisma: any | undefined;
};

/**
 * Resolves PostgreSQL connection URL safely from environment variables.
 * In production, uses the pooled PgBouncer connection configured in DATABASE_URL.
 */
export function resolveDatabaseUrl(): string {
  return (
    process.env.DATABASE_URL ||
    'postgresql://neondb_owner:npg_Z6Jd4cYxbyGk@52.76.212.156:5432/neondb?sslmode=require&options=endpoint%3Dep-long-salad-b3w1konb'
  );
}

const resolvedUrl = resolveDatabaseUrl();

export const prisma: any =
  globalForPrisma.prisma ??
  (PrismaClientClass
    ? new PrismaClientClass({
        datasources: resolvedUrl
          ? {
              db: {
                url: resolvedUrl,
              },
            }
          : undefined,
        log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
      })
    : null);

if (process.env.NODE_ENV !== 'production' && prisma) {
  globalForPrisma.prisma = prisma;
}

export default prisma;

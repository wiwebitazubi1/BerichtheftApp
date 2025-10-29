import { PrismaClient } from '@prisma/client';

/**
 * Singleton PrismaClient instance.
 *
 * In development, Next.js reloads modules on file changes, which can
 * inadvertently create multiple PrismaClient instances.  To prevent this,
 * attach the instance to the global object. In production, a single
 * instance suffices.
 */
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient = global.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
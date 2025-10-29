import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

/**
 * Seed script to initialize the database with a default instructor account.
 *
 * Running `npx prisma db seed` will execute this file. It creates an
 * instructor user (email: admin100@example.com) with the password
 * "admin100". The password is hashed using bcrypt with 12 rounds to
 * match the security requirements defined in the project specification.
 */
async function main() {
  const prisma = new PrismaClient();
  try {
    const email = 'admin100@example.com';
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      const hashed = await bcrypt.hash('admin100', 12);
      await prisma.user.create({
        data: {
          email,
          passwordHash: hashed,
          role: Role.AUSBILDER,
          name: 'Instructor Admin'
        }
      });
      console.log('Seeded instructor account');
    } else {
      console.log('Instructor account already exists');
    }
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
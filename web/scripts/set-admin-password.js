const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return salt + ':' + hash;
}

const prisma = new PrismaClient();

async function main() {
  const passHash = hashPassword('1234@GTS');

  // 1. Update existing admin@electricare.in
  const updated = await prisma.user.updateMany({
    where: { role: 'SUPER_ADMIN' },
    data: {
      passwordHash: passHash,
      isActive: true,
      isVerified: true
    }
  });
  console.log(`Updated ${updated.count} SUPER_ADMIN records with password '1234@GTS'`);

  // 2. Also ensure admin@ghartak.in exists as SUPER_ADMIN
  const gtsAdmin = await prisma.user.upsert({
    where: { email: 'admin@ghartak.in' },
    update: {
      passwordHash: passHash,
      role: 'SUPER_ADMIN',
      isActive: true,
      isVerified: true
    },
    create: {
      email: 'admin@ghartak.in',
      phone: '+919999000000',
      fullName: 'Ghar Tak Super Admin',
      role: 'SUPER_ADMIN',
      passwordHash: passHash,
      isActive: true,
      isVerified: true
    }
  });
  console.log(`Ensured admin@ghartak.in exists with ID: ${gtsAdmin.id}`);

  // 3. Also grant SUPER_ADMIN or check ghartakservicesit@gmail.com
  const itAdmin = await prisma.user.upsert({
    where: { email: 'ghartakservicesit@gmail.com' },
    update: {
      passwordHash: passHash,
      role: 'SUPER_ADMIN',
      isActive: true,
      isVerified: true
    },
    create: {
      email: 'ghartakservicesit@gmail.com',
      phone: '+919999000001',
      fullName: 'GTS IT Administrator',
      role: 'SUPER_ADMIN',
      passwordHash: passHash,
      isActive: true,
      isVerified: true
    }
  });
  console.log(`Ensured ghartakservicesit@gmail.com is SUPER_ADMIN with ID: ${itAdmin.id}`);

  // 4. Update PARTNER accounts
  await prisma.user.updateMany({
    where: { role: 'PARTNER' },
    data: { passwordHash: passHash, isActive: true, isVerified: true }
  });
  console.log('Updated PARTNER accounts to password 1234@GTS');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

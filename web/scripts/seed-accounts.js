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
  console.log('Password hash generated for 1234@GTS');

  const defaultPartner = await prisma.partner.findFirst();
  console.log('Default partner ID:', defaultPartner?.id);

  // 1. Seed or update ghartakservicesit@gmail.com
  let user = await prisma.user.findFirst({ where: { email: 'ghartakservicesit@gmail.com' } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        fullName: 'Ghar Tak IT Team',
        email: 'ghartakservicesit@gmail.com',
        phone: '+919999000001',
        passwordHash: passHash,
        role: 'CUSTOMER',
        isVerified: true,
        isActive: true,
        customerProfile: {
          create: {
            defaultAddressLine: 'Doorstep Hub, Berhampur',
            defaultPincode: '760001'
          }
        }
      }
    });
    console.log('Created customer user:', user.email);
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: passHash, isActive: true, isVerified: true }
    });
    console.log('Updated user password:', user.email);
  }

  // ghartakservicesit remains a clean administrative user (no fake technician profile)

  // 2. Seed customer@ghartak.in
  let cust = await prisma.user.findFirst({ where: { email: 'customer@ghartak.in' } });
  if (!cust) {
    cust = await prisma.user.create({
      data: {
        fullName: 'Demo Customer',
        email: 'customer@ghartak.in',
        phone: '+919999000002',
        passwordHash: passHash,
        role: 'CUSTOMER',
        isVerified: true,
        isActive: true,
        customerProfile: {
          create: {
            defaultAddressLine: 'Demo Residence, Sector 4',
            defaultPincode: '760001'
          }
        }
      }
    });
    console.log('Created demo customer:', cust.email);
  } else {
    await prisma.user.update({ where: { id: cust.id }, data: { passwordHash: passHash } });
    console.log('Updated demo customer password');
  }

  // 3. Seed tech@ghartak.in
  let techUser = await prisma.user.findFirst({ where: { email: 'tech@ghartak.in' } });
  if (!techUser) {
    techUser = await prisma.user.create({
      data: {
        fullName: 'Master Technician',
        email: 'tech@ghartak.in',
        phone: '+919999000003',
        passwordHash: passHash,
        role: 'TECHNICIAN',
        isVerified: true,
        isActive: true
      }
    });
    console.log('Created demo user:', techUser.email);
  } else {
    await prisma.user.update({ where: { id: techUser.id }, data: { passwordHash: passHash } });
    console.log('Updated demo technician password');
  }

  // 4. Update rajesh.kumar and amit.sharma passwords
  await prisma.user.updateMany({
    where: { email: { in: ['rajesh.kumar@electricare.tech', 'amit.sharma@gmail.com'] } },
    data: { passwordHash: passHash }
  });
  console.log('Updated rajesh and amit passwords to 1234@GTS');

  // 5. Seed matruprasadpanda497@gmail.com
  let devUser = await prisma.user.findFirst({ where: { email: 'matruprasadpanda497@gmail.com' } });
  if (!devUser) {
    devUser = await prisma.user.create({
      data: {
        fullName: 'Matru Prasad',
        email: 'matruprasadpanda497@gmail.com',
        phone: '+919999000004',
        passwordHash: passHash,
        role: 'CUSTOMER',
        isVerified: true,
        isActive: true,
        customerProfile: {
          create: {
            defaultAddressLine: 'Main Road, Berhampur',
            defaultPincode: '760001'
          }
        }
      }
    });
    console.log('Created Matru Prasad user profile');
  } else {
    await prisma.user.update({ where: { id: devUser.id }, data: { passwordHash: passHash } });
    console.log('Updated Matru Prasad password');
  }

  // 6. Seed itsmatruprasad@gmail.com
  let itsUser = await prisma.user.findFirst({ where: { email: 'itsmatruprasad@gmail.com' } });
  if (!itsUser) {
    itsUser = await prisma.user.create({
      data: {
        fullName: 'Matru Prasad',
        email: 'itsmatruprasad@gmail.com',
        phone: '+919999000005',
        passwordHash: passHash,
        role: 'CUSTOMER',
        isVerified: true,
        isActive: true,
        customerProfile: {
          create: {
            defaultAddressLine: 'Doorstep Hub, Berhampur',
            defaultPincode: '760001'
          }
        }
      }
    });
    console.log('Created itsmatruprasad@gmail.com customer profile');
  } else {
    await prisma.user.update({ where: { id: itsUser.id }, data: { passwordHash: passHash } });
    console.log('Updated itsmatruprasad@gmail.com password');
  }

  console.log('All demo accounts seeded and synchronized successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());

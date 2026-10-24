const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const techs = await prisma.technician.findMany({
    include: { user: true }
  });
  console.log('--- TECHNICIANS IN DATABASE ---');
  console.log(JSON.stringify(techs.map(t => ({
    id: t.id,
    badge: t.badgeNumber,
    name: t.user?.fullName,
    email: t.user?.email,
    phone: t.user?.phone,
    pin: t.assignedPincode,
    isOnline: t.isOnline,
    lat: t.currentLatitude,
    lng: t.currentLongitude
  })), null, 2));

  const users = await prisma.user.findMany({
    where: { role: 'TECHNICIAN' },
    select: { id: true, fullName: true, email: true, phone: true }
  });
  console.log('--- USERS WITH ROLE TECHNICIAN ---');
  console.log(JSON.stringify(users, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());

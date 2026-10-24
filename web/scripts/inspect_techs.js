const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const techs = await prisma.technician.findMany({
    include: { user: true }
  });
  console.log('TOTAL TECHS IN DB:', techs.length);
  for (const t of techs) {
    console.log(JSON.stringify({
      id: t.id,
      badge: t.badgeNumber,
      name: t.user?.fullName,
      email: t.user?.email,
      phone: t.user?.phone,
      pincode: t.assignedPincode,
      online: t.isOnline,
      kyc: t.kycStatus
    }));
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

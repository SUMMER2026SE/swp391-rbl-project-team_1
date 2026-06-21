const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.activityLog.deleteMany()
  .then(() => console.log('Deleted all ActivityLog'))
  .catch(console.error)
  .finally(() => prisma.$disconnect());

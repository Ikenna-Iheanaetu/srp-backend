// prisma/add-admin-seed.ts
import { PrismaClient, UserType, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { BCRYPT_SALT_ROUNDS } from '../src/common/constants/salt-rounds';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error('❌  SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set');
    process.exit(1);
  }

  // 1. Hash password (adminPassword is now guaranteed string)
  const hashedPassword = await bcrypt.hash(adminPassword, BCRYPT_SALT_ROUNDS);

  // 2. Create the User row
  const user = await prisma.user.create({
    data: {
      email: adminEmail,
      name: 'Hope indigo',
      password: hashedPassword,
      userType: UserType.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  // 3. Admin profile
  await prisma.admin.create({
    data: { userId: user.id },
  });

  console.log(`✅ Admin seeded → ${adminEmail}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

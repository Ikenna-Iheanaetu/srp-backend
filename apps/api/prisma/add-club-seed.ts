import {
  PrismaClient,
  UserType,
  UserStatus,
  AffiliateStatus,
  AffiliateType,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { BCRYPT_SALT_ROUNDS } from '../src/common/constants/salt-rounds';

const prisma = new PrismaClient();

async function main() {
  const clubPassword = 'password';
  const clubEmail = 'clubly@gmail.com';

  const hashedPassword = await bcrypt.hash(clubPassword, BCRYPT_SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: clubEmail,
      name: 'Clubly Sam',
      password: hashedPassword,
      userType: UserType.CLUB,
      status: UserStatus.ACTIVE,
    },
  });

  await prisma.club.create({
    data: {
      userId: user.id,
      onboardingSteps: [1, 2, 3],
      refCode: 'CLUBSEED123',
    },
  });

  console.log(`✅ Club seeded → ${clubEmail}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

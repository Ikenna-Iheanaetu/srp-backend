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
  const playerPassword = 'password';
  const PlayerEmail = 'flyer@gmail.com';

  const hashedPassword = await bcrypt.hash(playerPassword, BCRYPT_SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: PlayerEmail,
      name: 'Flyer Player',
      password: hashedPassword,
      userType: UserType.PLAYER,
      status: UserStatus.ACTIVE,
    },
  });

  await prisma.player.create({
    data: { userId: user.id, clubId: '68c02dee6759f60fe9213823', onboardingSteps: [1, 2, 3, 4] },
  });

  await prisma.affiliate.create({
    data: {
      email: PlayerEmail,
      clubId: '68d9cd582b6702f659ab7774',
      userId: user.id,
      isApproved: true,
      status: AffiliateStatus.ACTIVE,
      type: AffiliateType.PLAYER,
      refCode: 'CLUB001',
    },
  });

  console.log(`✅ Player seeded → ${PlayerEmail} ${user.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

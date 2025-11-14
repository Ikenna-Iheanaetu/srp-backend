import {
  PrismaClient,
  UserType,
  UserStatus,
  AffiliateStatus,
  EmploymentType,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = 'password';
  const hashedPassword = await bcrypt.hash(password, 10);

  // Club affiliation details
  const clubId = '68f5799aa1c2ab8ed39fbc41';
  const clubRefCode = 'TEST001';

  console.log('Creating test accounts...');

  // ==================== COMPANIES ====================

  // Company 1: wawake1582@rograc.com
  const company1User = await prisma.user.create({
    data: {
      email: 'wawake1582@rograc.com',
      name: 'Wawake Sports Company',
      password: hashedPassword,
      userType: UserType.COMPANY,
      status: UserStatus.ACTIVE,
    },
  });

  await prisma.company.create({
    data: {
      userId: company1User.id,
      about: 'Leading sports recruitment and talent management company',
      availability: 'Immediate',
      tagline: 'Your partner in sports talent acquisition',
      industry: 'Sports Management',
      address: '123 Sports Avenue, New York, NY 10001',
      country: 'United States',
      phone: '+1-555-1001',
      avatar: 'https://ui-avatars.com/api/?name=Wawake+Sports&background=4ECDC4',
      banner: 'https://picsum.photos/1200/300?random=100',
      isQuestionnaireTaken: true,
      analysisResult: 'Strong company profile with focus on sports recruitment',
      score: 85,
      focus: 'Sports Recruitment',
      region: {
        primary: 'United States',
        secondary: ['Canada', 'United Kingdom'],
      },
      onboardingSteps: [1, 2, 3, 4, 5],
      securityQuestion: {
        question: 'What industry do you operate in?',
        answer: 'Sports Management',
      },
    },
  });

  console.log(`✅ Company 1 created → ${company1User.email} (ID: ${company1User.id})`);

  // Company 2: test company
  const company2User = await prisma.user.create({
    data: {
      email: 'company2@sportstech.com',
      name: 'SportsTech Solutions',
      password: hashedPassword,
      userType: UserType.COMPANY,
      status: UserStatus.ACTIVE,
    },
  });

  await prisma.company.create({
    data: {
      userId: company2User.id,
      about: 'Innovative technology solutions for sports organizations',
      availability: 'Within 2 weeks',
      tagline: 'Technology meets sports excellence',
      industry: 'Technology',
      address: '456 Tech Boulevard, San Francisco, CA 94105',
      country: 'United States',
      phone: '+1-555-2002',
      avatar: 'https://ui-avatars.com/api/?name=SportsTech&background=FF6B6B',
      banner: 'https://picsum.photos/1200/300?random=101',
      isQuestionnaireTaken: true,
      analysisResult: 'Tech-focused company with strong sports industry presence',
      score: 90,
      focus: 'Sports Technology',
      region: {
        primary: 'United States',
        secondary: ['Canada', 'Australia'],
      },
      onboardingSteps: [1, 2, 3, 4, 5],
      securityQuestion: {
        question: 'What is your company focus?',
        answer: 'Sports Technology',
      },
    },
  });

  console.log(`✅ Company 2 created → ${company2User.email} (ID: ${company2User.id})`);

  // ==================== PLAYERS ====================

  // Player 1: flyer@gmail.com
  const player1User = await prisma.user.create({
    data: {
      email: 'flyer@gmail.com',
      name: 'Flyer Johnson',
      password: hashedPassword,
      userType: UserType.PLAYER,
      status: UserStatus.ACTIVE,
    },
  });

  await prisma.player.create({
    data: {
      userId: player1User.id,
      about: 'Professional athlete with 8 years of experience in competitive sports and team management',
      address: '789 Athlete Lane, Los Angeles, CA 90001',
      avatar: 'https://ui-avatars.com/api/?name=Flyer+Johnson&background=45B7D1',
      shirtNumber: 10,
      birthYear: 1995,
      sportsHistory: 'Started playing at age 8, competed at regional, national, and international levels',
      industry: 'Sports Management',
      phone: '+1-555-3001',
      yearsOfExperience: 8,
      score: 88,
      isQuestionnaireTaken: true,
      analysisResult: 'Highly skilled player with strong leadership and team management abilities',
      workAvailability: true,
      resume: 'https://example.com/resume/flyer-johnson.pdf',
      clubCategory: 'Professional',
      clubId: clubId,
      workCountry: ['United States', 'United Kingdom', 'Canada'],
      jobRole: {
        primary: 'Sports Management',
        secondary: ['Team Leadership', 'Player Development'],
      },
      employmentType: {
        primary: EmploymentType.FULL_TIME,
        secondary: [EmploymentType.CONTRACT, EmploymentType.PART_TIME],
      },
      certifications: [
        'Certified Sports Management Professional',
        'Leadership in Sports Certificate',
        'Team Coaching Certification',
      ],
      traits: ['Leadership', 'Teamwork', 'Communication', 'Problem Solving'],
      skills: ['Team Management', 'Strategic Planning', 'Player Development', 'Communication'],
      onboardingSteps: [1, 2, 3, 4],
      securityQuestion: {
        question: 'What is your shirt number?',
        answer: '10',
      },
    },
  });

  console.log(`✅ Player 1 created → ${player1User.email} (ID: ${player1User.id})`);

  // Player 2: test player
  const player2User = await prisma.user.create({
    data: {
      email: 'player2@athletes.com',
      name: 'Sarah Martinez',
      password: hashedPassword,
      userType: UserType.PLAYER,
      status: UserStatus.ACTIVE,
    },
  });

  await prisma.player.create({
    data: {
      userId: player2User.id,
      about: 'Experienced professional athlete specializing in sports analytics and performance coaching',
      address: '321 Champions Drive, Miami, FL 33101',
      avatar: 'https://ui-avatars.com/api/?name=Sarah+Martinez&background=96CEB4',
      shirtNumber: 7,
      birthYear: 1992,
      sportsHistory: 'Elite athlete with 12 years of competitive experience and 5 years in coaching',
      industry: 'Sports Analytics',
      phone: '+1-555-4002',
      yearsOfExperience: 12,
      score: 92,
      isQuestionnaireTaken: true,
      analysisResult: 'Exceptional player with strong analytical and coaching capabilities',
      workAvailability: true,
      resume: 'https://example.com/resume/sarah-martinez.pdf',
      clubCategory: 'Professional',
      clubId: clubId,
      workCountry: ['United States', 'Spain', 'Germany'],
      jobRole: {
        primary: 'Sports Analytics',
        secondary: ['Performance Coaching', 'Data Analysis'],
      },
      employmentType: {
        primary: EmploymentType.FULL_TIME,
        secondary: [EmploymentType.FREELANCE, EmploymentType.PROJECT_BASED],
      },
      certifications: [
        'Certified Sports Analytics Professional',
        'Performance Coaching Certificate',
        'Data Science in Sports',
      ],
      traits: ['Analytical Thinking', 'Leadership', 'Communication', 'Innovation'],
      skills: ['Data Analysis', 'Performance Metrics', 'Coaching', 'Strategic Planning'],
      onboardingSteps: [1, 2, 3, 4],
      securityQuestion: {
        question: 'What is your shirt number?',
        answer: '7',
      },
    },
  });

  console.log(`✅ Player 2 created → ${player2User.email} (ID: ${player2User.id})`);

  // ==================== AFFILIATIONS ====================

  console.log('\nCreating club affiliations...');

  // Affiliate Company 1
  await prisma.affiliate.create({
    data: {
      userId: company1User.id,
      clubId: clubId,
      email: company1User.email,
      purpose: 'Sports talent recruitment partnership',
      type: 'COMPANY',
      refCode: clubRefCode,
      status: AffiliateStatus.ACTIVE,
      isApproved: true,
      byAdmin: true,
    },
  });
  console.log(`✅ Company 1 affiliated to club ${clubId}`);

  // Affiliate Company 2
  await prisma.affiliate.create({
    data: {
      userId: company2User.id,
      clubId: clubId,
      email: company2User.email,
      purpose: 'Technology partnership for sports recruitment',
      type: 'COMPANY',
      refCode: clubRefCode,
      status: AffiliateStatus.ACTIVE,
      isApproved: true,
      byAdmin: true,
    },
  });
  console.log(`✅ Company 2 affiliated to club ${clubId}`);

  // Affiliate Player 1
  await prisma.affiliate.create({
    data: {
      userId: player1User.id,
      clubId: clubId,
      email: player1User.email,
      purpose: 'Professional development and networking',
      type: 'PLAYER',
      refCode: clubRefCode,
      status: AffiliateStatus.ACTIVE,
      isApproved: true,
      byAdmin: false,
    },
  });
  console.log(`✅ Player 1 affiliated to club ${clubId}`);

  // Affiliate Player 2
  await prisma.affiliate.create({
    data: {
      userId: player2User.id,
      clubId: clubId,
      email: player2User.email,
      purpose: 'Professional development and networking',
      type: 'PLAYER',
      refCode: clubRefCode,
      status: AffiliateStatus.ACTIVE,
      isApproved: true,
      byAdmin: false,
    },
  });
  console.log(`✅ Player 2 affiliated to club ${clubId}`);

  console.log('\n=== SEED SUMMARY ===');
  console.log('Password for all accounts: password');
  console.log(`Club ID: ${clubId}`);
  console.log(`Club RefCode: ${clubRefCode}`);
  console.log('\nCompanies:');
  console.log(`  1. ${company1User.email} (ID: ${company1User.id})`);
  console.log(`  2. ${company2User.email} (ID: ${company2User.id})`);
  console.log('\nPlayers:');
  console.log(`  1. ${player1User.email} (ID: ${player1User.id})`);
  console.log(`  2. ${player2User.email} (ID: ${player2User.id})`);
  console.log('\nAll users are affiliated to club ' + clubId);
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

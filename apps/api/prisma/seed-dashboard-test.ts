import {
  PrismaClient,
  UserType,
  UserStatus,
  AffiliateStatus,
  EmploymentType,
  ExperienceLevel,
  JobMode,
  JobStatus,
  ApplicationStatus,
  ShortlistedStatus,
  InvoiceStatus,
  RevenueType,
  AffiliateType,
} from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

// Helper function to hash passwords
const hashPassword = async (password: string) => {
  return await hash(password, 10);
};

// Helper function to create dates in different periods
const createDateInPeriod = (period: string, daysOffset: number = 0) => {
  const now = new Date();
  const date = new Date(now);
  
  switch (period) {
    case 'today':
      date.setDate(now.getDate() + daysOffset);
      break;
    case 'yesterday':
      date.setDate(now.getDate() - 1 + daysOffset);
      break;
    case 'last_week':
      date.setDate(now.getDate() - 7 + daysOffset);
      break;
    case 'last_month':
      date.setMonth(now.getMonth() - 1);
      date.setDate(now.getDate() + daysOffset);
      break;
    case 'last_year':
      date.setFullYear(now.getFullYear() - 1);
      date.setDate(now.getDate() + daysOffset);
      break;
    default:
      date.setDate(now.getDate() - 7 + daysOffset);
  }
  
  return date;
};

async function seedDashboardTestData() {
  console.log('Starting dashboard test data seed...');

  try {
    // Clear existing test data
    await prisma.revenue.deleteMany();
    await prisma.shortlisted.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.application.deleteMany();
    await prisma.job.deleteMany();
    await prisma.affiliate.deleteMany();
    await prisma.club.deleteMany();
    await prisma.company.deleteMany();
    await prisma.player.deleteMany();
    await prisma.user.deleteMany();

    console.log('Cleared existing test data...');

    // 1. Create a test club
    const clubUser = await prisma.user.create({
      data: {
        name: 'Test Sports Club',
        email: 'testclub@sportsjobs.com',
        password: await hashPassword('club123'),
        userType: UserType.CLUB,
        status: UserStatus.ACTIVE,
      },
    });

    const club = await prisma.club.create({
      data: {
        userId: clubUser.id,
        about: 'Professional sports club for testing dashboard functionality',
        tagline: 'Excellence in Sports',
        category: 'Professional',
        address: '123 Test Street, Test City',
        country: 'United States',
        region: 'Test Region',
        website: 'https://testclub.sports.com',
        phone: '+1-555-0123',
        avatar: 'https://ui-avatars.com/api/?name=TestClub&background=random',
        banner: 'https://picsum.photos/800/200?random=1',
        focus: 'Professional',
        founded: '2020',
        refCode: 'TEST001',
        preferredColor: '#FF6B6B',
        onboardingSteps: [1, 2, 3, 4],
        securityQuestion: {
          question: 'What year was the club founded?',
          answer: '2020',
        },
        sponsorshipOpportunities: ['Equipment Sponsorship', 'Event Sponsorship'],
        sponsorshipPrograms: ['Bronze Package', 'Silver Package'],
        socials: {
          facebook: 'https://facebook.com/testclub',
          instagram: 'https://instagram.com/testclub',
          twitter: 'https://twitter.com/testclub',
        },
      },
    });

    console.log('Created test club...');

    // 2. Create test companies
    const companies: any[] = [];
    for (let i = 1; i <= 5; i++) {
      const companyUser = await prisma.user.create({
        data: {
          name: `Test Company ${i}`,
          email: `testcompany${i}@techcorp.com`,
          password: await hashPassword('company123'),
          userType: UserType.COMPANY,
          status: UserStatus.ACTIVE,
        },
      });

      const company = await prisma.company.create({
        data: {
          userId: companyUser.id,
          about: `Test company ${i} for dashboard testing`,
          availability: 'Immediate',
          tagline: `Innovation in Technology ${i}`,
          industry: 'Technology',
          address: `${1000 + i} Business Blvd, Tech City`,
          country: 'United States',
          phone: `+1-555-${1000 + i}`,
          avatar: `https://ui-avatars.com/api/?name=Test${i}&background=random`,
          secondaryAvatar: `https://ui-avatars.com/api/?name=T${i}&background=random`,
          banner: `https://picsum.photos/1200/300?random=${i}`,
          isQuestionnaireTaken: true,
          analysisResult: `Strong company profile ${i}`,
          score: 80 + i,
          focus: 'Technology',
          region: {
            primary: 'United States',
            secondary: ['Canada', 'Mexico'],
          },
          onboardingSteps: [1, 2, 3, 4, 5],
          preferredClubs: [club.id],
          securityQuestion: {
            question: 'What industry do you operate in?',
            answer: 'Technology',
          },
        },
      });

      companies.push(company);
    }

    console.log('Created test companies...');

    // 3. Create test players
    const players: any[] = [];
    for (let i = 1; i <= 10; i++) {
      const playerUser = await prisma.user.create({
        data: {
          name: `Test Player ${i}`,
          email: `testplayer${i}@sports.com`,
          password: await hashPassword('player123'),
          userType: UserType.PLAYER,
          status: UserStatus.ACTIVE,
        },
      });

      const player = await prisma.player.create({
        data: {
          userId: playerUser.id,
          about: `Test player ${i} for dashboard testing`,
          address: `${2000 + i} Player Street, Sports City`,
          avatar: `https://ui-avatars.com/api/?name=Player${i}&background=random`,
          shirtNumber: i,
          birthYear: 1990 + (i % 10),
          sportsHistory: `Test sports history for player ${i}`,
          industry: 'Technology',
          phone: `+1-555-${2000 + i}`,
          yearsOfExperience: 3 + (i % 5),
          score: 70 + (i % 20),
          isQuestionnaireTaken: true,
          analysisResult: `Skilled test player ${i}`,
          workAvailability: true,
          resume: `https://example.com/resume/testplayer${i}.pdf`,
          clubCategory: 'Professional',
          clubId: club.id,
          workCountry: ['United States', 'Canada'],
          jobRole: {
            primary: 'Software Developer',
            secondary: ['React Developer', 'Node.js Developer'],
          },
          employmentType: {
            primary: EmploymentType.FULL_TIME,
            secondary: [EmploymentType.PART_TIME],
          },
          certifications: ['Certified Software Developer'],
          traits: ['Leadership', 'Teamwork'],
          skills: ['JavaScript', 'React', 'Node.js'],
          onboardingSteps: [1, 2, 3, 4],
          securityQuestion: {
            question: 'What is your shirt number?',
            answer: i.toString(),
          },
        },
      });

      players.push(player);
    }

    console.log('Created test players...');

    // 4. Create affiliates with different time periods
    const timePeriods = ['today', 'yesterday', 'last_week', 'last_month', 'last_year'];
    
    // Company affiliates distributed across time periods
    for (let i = 0; i < companies.length; i++) {
      const period = timePeriods[i % timePeriods.length];
      const createdAt = createDateInPeriod(period, i);
      
      await prisma.affiliate.create({
        data: {
          userId: companies[i].userId,
          clubId: club.id,
          email: companies[i].userId,
          purpose: 'Test partnership',
          type: AffiliateType.COMPANY,
          refCode: club.refCode,
          status: AffiliateStatus.ACTIVE,
          isApproved: true,
          byAdmin: true,
          createdAt: createdAt,
        },
      });
    }

    // Player affiliates distributed across time periods
    for (let i = 0; i < players.length; i++) {
      const period = timePeriods[i % timePeriods.length];
      const createdAt = createDateInPeriod(period, i);
      
      await prisma.affiliate.create({
        data: {
          userId: players[i].userId,
          clubId: club.id,
          email: players[i].userId,
          purpose: 'Test player membership',
          type: AffiliateType.PLAYER,
          refCode: club.refCode,
          status: AffiliateStatus.ACTIVE,
          isApproved: true,
          byAdmin: false,
          createdAt: createdAt,
        },
      });
    }

    console.log('Created affiliates with time distribution...');

    // 5. Create jobs
    const jobs: any[] = [];
    for (let i = 1; i <= 8; i++) {
      const job = await prisma.job.create({
        data: {
          companyId: companies[i % companies.length].id,
          title: `Test Job ${i}`,
          role: 'Software Developer',
          description: `Test job description ${i}`,
          location: 'United States, Remote Available',
          type: EmploymentType.FULL_TIME,
          experienceLevel: ExperienceLevel.MID,
          mode: JobMode.REMOTE,
          startDate: new Date(2024, 0, 1),
          endDate: new Date(2024, 11, 31),
          status: JobStatus.ACTIVE,
          openToAll: true,
          responsibilities: ['Develop software', 'Collaborate with team'],
          qualifications: ['2+ years experience', 'Strong skills'],
          skills: ['JavaScript', 'React', 'Node.js'],
          traits: ['Leadership', 'Teamwork'],
          clubs: [club.id],
          tags: ['remote-friendly', 'growth-opportunity'],
          salary: {
            min: 50000 + i * 5000,
            max: 80000 + i * 8000,
            currency: 'USD',
          },
        },
      });
      jobs.push(job);
    }

    console.log('Created test jobs...');

    // 6. Create applications
    const applications: any[] = [];
    for (let i = 0; i < 15; i++) {
      const job = jobs[i % jobs.length];
      const player = players[i % players.length];

      const application = await prisma.application.create({
        data: {
          jobId: job.id,
          playerId: player.id,
          name: player.userId,
          email: player.userId,
          phone: `+1-555-${2000 + (i % players.length)}`,
          zip: `${10000 + i}`,
          resume: `https://example.com/resume/testplayer${(i % players.length) + 1}.pdf`,
          applicationLetter: `Test application letter ${i}`,
          status: ApplicationStatus.SHORTLISTED,
          legallyAuthorized: true,
          visaSponsorship: false,
          yearsOfExperience: 2 + (i % 5),
        },
      });
      applications.push(application);
    }

    console.log('Created test applications...');

    // 7. Create invoices with different time periods and statuses
    const invoices: any[] = [];
    
    // Create paid invoices distributed across time periods
    for (let i = 0; i < 10; i++) {
      const company = companies[i % companies.length];
      const period = timePeriods[i % timePeriods.length];
      const createdAt = createDateInPeriod(period, i);
      const paidAt = createDateInPeriod(period, i + 1); // Paid 1 day after creation

      const invoice = await prisma.invoice.create({
        data: {
          invoiceCode: `TEST-INV-${String(i + 1).padStart(5, '0')}`,
          companyId: company.id,
          clubId: club.id,
          amount: 2000 + i * 500,
          currency: 'USD',
          status: InvoiceStatus.PAID,
          dueDate: new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000),
          paidAt: paidAt,
          description: `Test invoice ${i + 1} for club`,
          createdAt: createdAt,
          metadata: {
            jobTitle: `Test Job ${i + 1}`,
            paymentMethod: 'Bank Transfer',
          },
        },
      });

      invoices.push(invoice);
    }

    console.log('Created test invoices...');

    // 8. Create shortlisted entries with hired status distributed across time periods
    for (let i = 0; i < applications.length; i++) {
      const app = applications[i];
      const period = timePeriods[i % timePeriods.length];
      const hiredAt = createDateInPeriod(period, i);
      const invoice = invoices[i % invoices.length];

      await prisma.shortlisted.create({
        data: {
          jobId: app.jobId,
          playerId: app.playerId,
          status: ShortlistedStatus.HIRED,
          invoiceId: invoice.id,
          hiredAt: hiredAt,
        },
      });
    }

    console.log('Created shortlisted entries...');

    // 9. Create revenue records
    for (const invoice of invoices) {
      await prisma.revenue.create({
        data: {
          invoiceId: invoice.id,
          type: RevenueType.HIRING_FEE,
          amount: invoice.amount * 0.3, // 30% commission
          currency: invoice.currency,
          description: `Revenue from ${invoice.invoiceCode}`,
          recordedAt: invoice.paidAt || new Date(),
          metadata: {
            invoiceCode: invoice.invoiceCode,
            originalAmount: invoice.amount,
            commissionRate: 0.3,
          },
        },
      });
    }

    console.log('Created revenue records...');

    console.log('Dashboard test data seed completed successfully!');

    // Print summary
    const counts = {
      users: await prisma.user.count(),
      companies: await prisma.company.count(),
      players: await prisma.player.count(),
      clubs: await prisma.club.count(),
      jobs: await prisma.job.count(),
      applications: await prisma.application.count(),
      invoices: await prisma.invoice.count(),
      revenues: await prisma.revenue.count(),
      shortlisted: await prisma.shortlisted.count(),
      affiliates: await prisma.affiliate.count(),
    };

    console.log('\n=== DASHBOARD TEST DATA SUMMARY ===');
    Object.entries(counts).forEach(([model, count]) => {
      console.log(`${model}: ${count}`);
    });

    console.log('\n=== TEST CLUB LOGIN CREDENTIALS ===');
    console.log('Email: testclub@sportsjobs.com');
    console.log('Password: club123');
    console.log('Club ID:', club.id);
    console.log('Club Ref Code:', club.refCode);

  } catch (error) {
    console.error('Error during dashboard test data seed:', error);
    throw error;
  }
}

seedDashboardTestData()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

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
  TaskPriority,
  TaskStatus,
  NotificationType,
  NotificationStatus,
} from '@prisma/client';
import { hash } from 'bcrypt';
import { BCRYPT_SALT_ROUNDS } from '../src/common/constants/salt-rounds';

const prisma = new PrismaClient();

// Helper function to hash passwords
const hashPassword = async (password: string) => {
  return await hash(password, BCRYPT_SALT_ROUNDS);
};

// Sample data arrays
const industries = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Manufacturing',
  'Retail',
  'Consulting',
  'Real Estate',
  'Entertainment',
  'Transportation',
];

const skills = [
  'JavaScript',
  'TypeScript',
  'React',
  'Node.js',
  'Python',
  'Java',
  'Project Management',
  'Data Analysis',
  'Marketing',
  'Sales',
  'Design',
  'Communication',
  'Leadership',
  'Problem Solving',
];

const countries = [
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'Nigeria',
  'Kenya',
  'South Africa',
];

const clubCategories = [
  'Professional',
  'Sports',
  'Academic',
  'Social',
  'Technology',
  'Business',
];

async function main() {
  console.log('Starting seed...');

  // Clear existing data (optional - be careful in production!)
  await prisma.notification.deleteMany();
  await prisma.clubUpdate.deleteMany();
  await prisma.playerBookmark.deleteMany();
  await prisma.shortlisted.deleteMany();
  await prisma.application.deleteMany();
  await prisma.task.deleteMany();
  await prisma.job.deleteMany();
  await prisma.experience.deleteMany();
  await prisma.affiliate.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.club.deleteMany();
  await prisma.company.deleteMany();
  await prisma.player.deleteMany();
  await prisma.user.deleteMany();

  console.log('Cleared existing data...');

  // 1. Create Clubs
  const clubs: { id: string; userId: string; refCode: string }[] = [];
  for (let i = 1; i <= 5; i++) {
    const clubUser = await prisma.user.create({
      data: {
        name: `Sports Club ${i}`,
        email: `club${i}@sportsjobs.com`,
        password: await hashPassword('club123'),
        userType: UserType.CLUB,
        status: UserStatus.ACTIVE,
      },
    });

    const clubRefCode = `CLUB${i.toString().padStart(3, '0')}`;

    const club = await prisma.club.create({
      data: {
        userId: clubUser.id,
        about: `Professional sports club focused on ${clubCategories[i % clubCategories.length]} activities`,
        tagline: `Excellence in ${clubCategories[i % clubCategories.length]}`,
        category: clubCategories[i % clubCategories.length],
        address: `${1000 + i} Sports Avenue, City ${i}`,
        country: countries[i % countries.length],
        region: `Region ${i}`,
        website: `https://club${i}.sports.com`,
        phone: `+1-555-${1000 + i}`,
        avatar: `https://ui-avatars.com/api/?name=Club${i}&background=random`,
        banner: `https://picsum.photos/800/200?random=${i}`,
        focus: clubCategories[i % clubCategories.length],
        founded: `${1990 + i}`,
        refCode: clubRefCode,
        preferredColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][
          i % 5
        ],
        onboardingSteps: [1, 2, 3, 4],
        securityQuestion: {
          question: 'What year was the club founded?',
          answer: `${1990 + i}`,
        },
        sponsorshipOpportunities: [
          'Equipment Sponsorship',
          'Event Sponsorship',
          'Player Sponsorship',
        ],
        sponsorshipPrograms: [
          'Bronze Package',
          'Silver Package',
          'Gold Package',
        ],
        socials: {
          facebook: `https://facebook.com/club${i}`,
          instagram: `https://instagram.com/club${i}`,
          twitter: `https://twitter.com/club${i}`,
        },
      },
    });

    clubs.push({ id: club.id, userId: clubUser.id, refCode: clubRefCode });

    // Create club updates
    await prisma.clubUpdate.create({
      data: {
        clubId: club.id,
        message: `Welcome to ${clubUser.name}! We're excited to have new members join our community.`,
      },
    });
  }

  console.log('Created clubs...');

  // 2. Create Companies
  const companies: { id: string; userId: string }[] = [];
  for (let i = 1; i <= 8; i++) {
    const companyUser = await prisma.user.create({
      data: {
        name: `TechCorp ${i}`,
        email: `company${i}@techcorp.com`,
        password: await hashPassword('company123'),
        userType: UserType.COMPANY,
        status: UserStatus.ACTIVE,
      },
    });

    const company = await prisma.company.create({
      data: {
        userId: companyUser.id,
        about: `Leading ${industries[i % industries.length]} company with innovative solutions`,
        availability: 'Immediate',
        tagline: `Innovation in ${industries[i % industries.length]}`,
        industry: industries[i % industries.length],
        address: `${2000 + i} Business Blvd, Tech City ${i}`,
        country: countries[i % countries.length],
        phone: `+1-555-${2000 + i}`,
        avatar: `https://ui-avatars.com/api/?name=Tech${i}&background=random`,
        secondaryAvatar: `https://ui-avatars.com/api/?name=T${i}&background=random`,
        banner: `https://picsum.photos/1200/300?random=${i + 10}`,
        isQuestionnaireTaken: true,
        analysisResult: `Strong company profile with focus on ${industries[i % industries.length]}`,
        score: 80 + (i % 20),
        focus: industries[i % industries.length],
        region: {
          primary: countries[i % countries.length],
          secondary: [
            countries[(i + 1) % countries.length],
            countries[(i + 2) % countries.length],
          ],
        },
        onboardingSteps: [1, 2, 3, 4, 5],
        preferredClubs: [clubs[i % clubs.length].id],
        securityQuestion: {
          question: 'What industry do you operate in?',
          answer: industries[i % industries.length],
        },
      },
    });

    companies.push({ id: company.id, userId: companyUser.id });
  }

  console.log('Created companies...');

  // 3. Create Players
  const players: { id: string; userId: string }[] = [];
  for (let i = 1; i <= 15; i++) {
    const playerUser = await prisma.user.create({
      data: {
        name: `Player ${i}`,
        email: `player${i}@sports.com`,
        password: await hashPassword('player123'),
        userType: UserType.PLAYER,
        status: UserStatus.ACTIVE,
      },
    });

    const player = await prisma.player.create({
      data: {
        userId: playerUser.id,
        about: `Experienced professional athlete with ${3 + (i % 10)} years in sports`,
        address: `${3000 + i} Player Street, Sports City ${i}`,
        avatar: `https://ui-avatars.com/api/?name=Player${i}&background=random`,
        shirtNumber: i,
        birthYear: 1990 + (i % 15),
        sportsHistory: `Started playing at age ${8 + (i % 5)}, competed at regional and national levels`,
        industry: industries[i % industries.length],
        phone: `+1-555-${3000 + i}`,
        yearsOfExperience: 3 + (i % 10),
        score: 70 + (i % 30),
        isQuestionnaireTaken: true,
        analysisResult: `Skilled player with strong potential in ${industries[i % industries.length]}`,
        workAvailability: true,
        resume: `https://example.com/resume/player${i}.pdf`,
        clubCategory: clubCategories[i % clubCategories.length],
        clubId: clubs[i % clubs.length].id,
        workCountry: [
          countries[i % countries.length],
          countries[(i + 1) % countries.length],
        ],
        jobRole: {
          primary: skills[i % skills.length],
          secondary: [
            skills[(i + 1) % skills.length],
            skills[(i + 2) % skills.length],
          ],
        },
        employmentType: {
          primary: [
            EmploymentType.FULL_TIME,
            EmploymentType.PART_TIME,
            EmploymentType.CONTRACT,
          ][i % 3],
          secondary: [EmploymentType.FREELANCE, EmploymentType.PROJECT_BASED],
        },
        certifications: [
          `Certified ${skills[i % skills.length]} Professional`,
          'Sports Management Certificate',
        ],
        traits: [
          'Leadership',
          'Teamwork',
          'Communication',
          'Problem Solving',
        ].slice(0, 2 + (i % 3)),
        skills: skills.slice(0, 3 + (i % 5)),
        onboardingSteps: [1, 2, 3, 4],
        securityQuestion: {
          question: 'What is your shirt number?',
          answer: i.toString(),
        },
      },
    });

    players.push({ id: player.id, userId: playerUser.id });

    // Create experiences for players
    await prisma.experience.create({
      data: {
        playerId: player.id,
        title: `${skills[i % skills.length]} Specialist`,
        company: `Previous Company ${i}`,
        current: i % 4 === 0, // Some current jobs
        remote: i % 3 === 0, // Some remote jobs
        startDate: new Date(2020 + (i % 4), i % 12, 1),
        endDate: i % 4 === 0 ? null : new Date(2023 + (i % 2), i % 12, 28),
        companyPhone: `+1-555-${4000 + i}`,
        companyEmail: `hr@previouscompany${i}.com`,
        skills: skills.slice(i % 5, (i % 5) + 3),
        tools: [
          'Microsoft Office',
          'Google Workspace',
          'Slack',
          'Trello',
        ].slice(0, 2 + (i % 3)),
        responsibilities: [
          'Led team projects and initiatives',
          'Collaborated with cross-functional teams',
          'Improved processes and efficiency',
        ],
      },
    });
  }

  console.log('Created players and experiences...');

  // 4. Create Supporters
  const supporters: { id: string; userId: string }[] = [];
  for (let i = 1; i <= 5; i++) {
    const supporterUser = await prisma.user.create({
      data: {
        name: `Sports Fan ${i}`,
        email: `supporter${i}@sports.com`,
        password: await hashPassword('supporter123'),
        userType: UserType.SUPPORTER,
        status: UserStatus.ACTIVE,
      },
    });
    supporters.push({ id: supporterUser.id, userId: supporterUser.id });
  }

  console.log('Created supporters...');

  // 5. Create Affiliates
  const affiliates: {
    id: string;
    userId: string | null;
    type: string | null;
  }[] = [];

  // Company affiliates
  for (let i = 0; i < companies.length; i++) {
    const clubIndex = i % clubs.length;
    const affiliate = await prisma.affiliate.create({
      data: {
        userId: companies[i].userId,
        clubId: clubs[clubIndex].id,
        email: `company${i + 1}@techcorp.com`,
        purpose: 'Partnership for talent acquisition',
        type: 'COMPANY',
        refCode: clubs[clubIndex].refCode, // Use club's refCode
        status: i % 6 === 0 ? AffiliateStatus.PENDING : AffiliateStatus.ACTIVE,
        isApproved: i % 6 !== 0,
        byAdmin: true,
      },
    });
    affiliates.push({
      id: affiliate.id,
      userId: affiliate.userId,
      type: affiliate.type,
    });
  }

  // Player affiliates
  for (let i = 0; i < Math.min(players.length, 10); i++) {
    const clubIndex = i % clubs.length;
    const affiliate = await prisma.affiliate.create({
      data: {
        userId: players[i].userId,
        clubId: clubs[clubIndex].id,
        email: `player${i + 1}@sports.com`,
        purpose: 'Professional development and networking',
        type: 'PLAYER',
        refCode: clubs[clubIndex].refCode, // Use club's refCode
        status: i % 5 === 0 ? AffiliateStatus.PENDING : AffiliateStatus.ACTIVE,
        isApproved: i % 5 !== 0,
        byAdmin: false,
      },
    });
    affiliates.push({
      id: affiliate.id,
      userId: affiliate.userId,
      type: affiliate.type,
    });
  }

  // Supporter affiliates
  for (let i = 0; i < supporters.length; i++) {
    const clubIndex = i % clubs.length;
    const affiliate = await prisma.affiliate.create({
      data: {
        userId: supporters[i].userId,
        clubId: clubs[clubIndex].id,
        email: `supporter${i + 1}@sports.com`,
        purpose: 'Community support and engagement',
        type: 'SUPPORTER',
        refCode: clubs[clubIndex].refCode, // Use club's refCode
        status: AffiliateStatus.ACTIVE,
        isApproved: true,
        byAdmin: false,
      },
    });
    affiliates.push({
      id: affiliate.id,
      userId: affiliate.userId,
      type: affiliate.type,
    });
  }

  console.log('Created affiliates...');

  // 6. Create Jobs
  const jobs: { id: string; companyId: string }[] = [];
  for (let i = 1; i <= 12; i++) {
    const job = await prisma.job.create({
      data: {
        companyId: companies[i % companies.length].id,
        title: `${skills[i % skills.length]} ${['Specialist', 'Manager', 'Lead', 'Senior'][i % 4]}`,
        role: skills[i % skills.length],
        description: `We are looking for an experienced ${skills[i % skills.length]} professional to join our growing team.`,
        location: `${countries[i % countries.length]}, Remote Available`,
        type: [
          EmploymentType.FULL_TIME,
          EmploymentType.PART_TIME,
          EmploymentType.CONTRACT,
          EmploymentType.FREELANCE,
        ][i % 4],
        experienceLevel: [
          ExperienceLevel.ENTRY,
          ExperienceLevel.MID,
          ExperienceLevel.SENIOR,
          ExperienceLevel.EXECUTIVE,
        ][i % 4],
        mode: [JobMode.ONSITE, JobMode.REMOTE, JobMode.HYBRID][i % 3],
        startDate: new Date(2024, i % 12, 1),
        endDate: new Date(2024, i % 12, 1),
        status: i % 8 === 0 ? JobStatus.INACTIVE : JobStatus.ACTIVE, // Some paused jobs
        openToAll: i % 3 === 0,
        responsibilities: [
          `Develop and maintain ${skills[i % skills.length]} solutions`,
          'Collaborate with team members on projects',
          'Participate in code reviews and technical discussions',
          'Mentor junior team members',
        ],
        qualifications: [
          `${2 + (i % 5)}+ years of experience in ${skills[i % skills.length]}`,
          'Strong problem-solving skills',
          'Excellent communication abilities',
          "Bachelor's degree preferred",
        ],
        skills: skills.slice(i % 5, (i % 5) + 4),
        traits: [
          'Leadership',
          'Teamwork',
          'Communication',
          'Problem Solving',
        ].slice(0, 2 + (i % 3)),
        clubs: [clubs[i % clubs.length].id],
        tags: [
          'remote-friendly',
          'growth-opportunity',
          'competitive-salary',
        ].slice(0, 1 + (i % 3)),
        salary: {
          min: 50000 + i * 5000,
          max: 80000 + i * 8000,
          currency: 'USD',
        },
      },
    });
    jobs.push({ id: job.id, companyId: job.companyId });
  }

  console.log('Created jobs...');

  // 7. Create Applications
  const applications: {
    id: string;
    jobId: string;
    playerId: string | null;
    status: ApplicationStatus;
  }[] = [];
  for (let i = 0; i < 25; i++) {
    const job = jobs[i % jobs.length];
    const player = players[i % players.length];

    const application = await prisma.application.create({
      data: {
        jobId: job.id,
        playerId: player.id,
        name: `Player ${(i % players.length) + 1}`,
        email: `player${(i % players.length) + 1}@sports.com`,
        phone: `+1-555-${3000 + (i % players.length) + 1}`,
        zip: `${10000 + i}`,
        resume: `https://example.com/resume/player${(i % players.length) + 1}.pdf`,
        applicationLetter: `I am very interested in this position at your company...`,
        status: [
          ApplicationStatus.APPLIED,
          ApplicationStatus.UNDER_REVIEW,
          ApplicationStatus.SHORTLISTED,
          ApplicationStatus.REJECTED,
        ][i % 4],
        legallyAuthorized: true,
        visaSponsorship: i % 3 === 0,
        yearsOfExperience: 2 + (i % 8),
      },
    });
    applications.push({
      id: application.id,
      jobId: application.jobId,
      playerId: application.playerId,
      status: application.status,
    });
  }

  console.log('Created applications...');

  // 8. Create Shortlisted entries
  const shortlistedApps = applications.filter(
    (app) => app.status === ApplicationStatus.SHORTLISTED,
  );
  for (const app of shortlistedApps) {
    if (app.playerId) {
      await prisma.shortlisted.create({
        data: {
          jobId: app.jobId,
          playerId: app.playerId,
        },
      });
    }
  }

  console.log('Created shortlisted entries...');

  // 9. Create Bookmarks
  for (let i = 0; i < 10; i++) {
    await prisma.playerBookmark.create({
      data: {
        playerId: players[i % players.length].id,
        jobId: jobs[i % jobs.length].id,
      },
    });
  }

  console.log('Created bookmarks...');

  // 10. Create Tasks
  for (let i = 1; i <= 8; i++) {
    await prisma.task.create({
      data: {
        companyId: companies[i % companies.length].id,
        title: `Task ${i}: ${['Review Applications', 'Interview Candidates', 'Update Job Posting', 'Team Meeting'][i % 4]}`,
        category: ['HR', 'Development', 'Marketing', 'Operations'][i % 4],
        notes: `Important task that needs attention by end of week`,
        priority: [
          TaskPriority.LOW,
          TaskPriority.MEDIUM,
          TaskPriority.HIGH,
          TaskPriority.URGENT,
        ][i % 4],
        startDate: new Date(2024, 8, i), // September 2024
        endDate: new Date(2024, 8, i + 7), // One week later
        status: [
          TaskStatus.TODO,
          TaskStatus.IN_PROGRESS,
          TaskStatus.COMPLETED,
          TaskStatus.CANCELLED,
        ][i % 4],
        assignedTo: `team.member${i}@techcorp.com`,
        tags: ['urgent', 'review', 'hiring', 'planning'].slice(0, 1 + (i % 3)),
      },
    });
  }

  console.log('Created tasks...');

  // 11. Create Notifications
  const allUsers = await prisma.user.findMany({ select: { id: true } });
  for (let i = 0; i < 20; i++) {
    await prisma.notification.create({
      data: {
        userId: allUsers[i % allUsers.length].id,
        title: [
          'New Job Alert',
          'Application Update',
          'System Maintenance',
          'Welcome Message',
        ][i % 4],
        message: [
          'A new job matching your profile has been posted',
          'Your application status has been updated',
          'System maintenance scheduled for tonight',
          'Welcome to Sports Jobs platform!',
        ][i % 4],
        type: [
          NotificationType.JOB_ALERT,
          NotificationType.APPLICATION_UPDATE,
          NotificationType.SYSTEM,
          NotificationType.MESSAGE,
        ][i % 4],
        status:
          i % 3 === 0 ? NotificationStatus.READ : NotificationStatus.UNREAD,
      },
    });
  }

  console.log('Created notifications...');

  console.log('Seed completed successfully!');

  // Print summary
  const counts = {
    users: await prisma.user.count(),
    companies: await prisma.company.count(),
    players: await prisma.player.count(),
    clubs: await prisma.club.count(),
    jobs: await prisma.job.count(),
    applications: await prisma.application.count(),
    affiliates: await prisma.affiliate.count(),
    tasks: await prisma.task.count(),
    notifications: await prisma.notification.count(),
  };

  console.log('\n=== SEED SUMMARY ===');
  Object.entries(counts).forEach(([model, count]) => {
    console.log(`${model}: ${count}`);
  });
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

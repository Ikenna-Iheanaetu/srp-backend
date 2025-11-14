# Sports Recruitment Platform

A comprehensive sports recruitment platform built with NestJS, TypeScript, and MongoDB. This platform connects sports clubs, companies, players, and supporters in a unified ecosystem for talent acquisition and career opportunities.

## 🏆 Overview

The Sports Recruitment Platform is a multi-sided marketplace that facilitates:

- **Player Recruitment**: Sports clubs can discover and recruit talented players
- **Job Opportunities**: Companies can post sports-related job openings
- **Career Development**: Players can showcase their skills and find opportunities
- **Club Management**: Clubs can manage their roster and recruitment processes
- **Admin Oversight**: Comprehensive admin panel for platform management

## 🏗️ Architecture

### Tech Stack

- **Backend**: NestJS (Node.js framework)
- **Database**: MongoDB with Prisma ORM
- **Authentication**: JWT with refresh tokens
- **File Storage**: MinIO (S3-compatible)
- **Email**: Nodemailer with HTML templates
- **Validation**: Class-validator & class-transformer
- **Testing**: Jest with comprehensive unit tests
- **Documentation**: Swagger/OpenAPI

### User Types

- **ADMIN**: Platform administrators with full access
- **CLUB**: Sports clubs looking to recruit players
- **COMPANY**: Companies posting sports-related jobs
- **PLAYER**: Athletes seeking opportunities
- **SUPPORTER**: Fans and supporters of the platform

## 🚀 Features

### Authentication & Authorization

- Multi-type user registration and login
- Google OAuth integration
- Email verification with OTP
- Password reset functionality
- JWT access & refresh token system
- Role-based access control

### Player Management

- Comprehensive player profiles with skills, experience, and achievements
- Experience tracking with detailed work history
- Skills and certifications management
- Availability status and preferences
- Club affiliation system

### Club Management

- Club profiles with branding and information
- Player roster management
- Reference code system for recruitment
- Club updates and announcements
- Sponsorship opportunities tracking

### Job Management

- Company job postings with detailed requirements
- Application tracking and management
- Shortlisting system for candidates
- Job bookmarking for players
- Advanced filtering and search

### Admin Features

- User management and approval system
- Company oversight and verification
- Platform analytics and reporting
- Content moderation tools

### File Management

- Avatar and banner uploads
- Resume and document storage
- MinIO integration for scalable storage
- Public URL generation for media

## 📁 Project Structure

```
src/
├── admin/                 # Admin management
├── auth/                  # Authentication & authorization
├── company/               # Company management
├── common/                # Shared utilities and decorators
├── email/                 # Email service and templates
├── prisma/                # Database configuration
├── utils/                 # Utility functions
└── types/                 # TypeScript type definitions
```

## 🛠️ Setup & Installation

### Prerequisites

- Node.js (v18+)
- MongoDB
- MinIO server (for file storage)
- SMTP server (for emails)

### Environment Variables

Create `.env.development` file:

```env
# Database
DATABASE_URL="mongodb://localhost:27017/sports-recruitment"

# JWT
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# MinIO
MINIO_ENDPOINT="localhost"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET_NAME="sports-recruitment"

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# App
PORT=3000
NODE_ENV=development
```

### Installation

```bash
# Install dependencies
pnpm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Seed the database
pnpm run prisma:seed

# Add admin user
pnpm run prisma:add-admin-seed
```

## 🚀 Running the Application

```bash
# Development mode
pnpm run start:dev

# Production mode
pnpm run build
pnpm run start:prod

# Debug mode
pnpm run start:debug
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:cov

# Run specific test file
pnpm test auth/auth.service.spec.ts

# Run tests for specific resource
pnpm test -- admin
```

## 📚 API Documentation

Once the application is running, visit:

- **Swagger UI**: `http://localhost:3000/api`
- **API Endpoints**: `http://localhost:3000/api/v1`

### Key Endpoints

#### Authentication

- `POST /auth/signup` - User registration
- `POST /auth/login` - User login
- `POST /auth/google-signup` - Google OAuth registration
- `POST /auth/google-login` - Google OAuth login
- `POST /auth/verify-account` - Email verification
- `POST /auth/forgot-password` - Password reset request
- `POST /auth/reset-password` - Password reset
- `POST /auth/change-password` - Change password
- `POST /auth/refresh-token` - Refresh access token

#### Admin

- `GET /admin/profile` - Get admin profile
- `PUT /admin/profile` - Update admin profile
- `GET /admin/companies` - Get companies list

#### Company

- `GET /company/companies` - Get companies with filtering
- `POST /company/invite` - Invite company to platform

## 🗄️ Database Schema

### Core Models

- **User**: Central user entity with role-based access
- **Player**: Athlete profiles with skills and experience
- **Club**: Sports club profiles and management
- **Company**: Business profiles for job postings
- **Admin**: Platform administrators
- **Job**: Job postings with detailed requirements
- **Application**: Job applications and tracking
- **Affiliate**: Club-company-player relationships
- **Notification**: System notifications
- **Task**: Company task management

### Key Relationships

- Users have one profile (Player/Club/Company/Admin)
- Players can be affiliated with clubs
- Companies post jobs and receive applications
- Clubs can have multiple players
- Affiliates connect users with clubs/companies

## 🔧 Development

### Code Quality

```bash
# Lint code
pnpm run lint

# Format code
pnpm run format
```

### Database Management

```bash
# View database in Prisma Studio
npx prisma studio

# Reset database
npx prisma db push --force-reset

# Generate new migration
npx prisma migrate dev --name migration-name
```

## 🚀 Deployment

### Production Build

```bash
# Build the application
pnpm run build

# Start production server
pnpm run start:prod
```

### Docker Support

The application can be containerized with Docker. Ensure all environment variables are properly configured for the production environment.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the API documentation
- Review the test files for usage examples

## 🔮 Future Enhancements

- Real-time notifications with WebSockets
- Advanced analytics dashboard
- Mobile app integration
- Payment processing for premium features
- Advanced matching algorithms
- Video profile support
- Social features and networking

# Sports Recruitment Platform - Monorepo

A comprehensive sports recruitment platform built with modern web technologies.

## Architecture

This monorepo contains:

- **apps/web** - React frontend with TypeScript, React Router, and Tailwind CSS
- **apps/api** - NestJS backend with Prisma and MongoDB
- **packages/types** - Shared TypeScript types and Zod schemas

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm >= 9
- MongoDB

### Installation

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm api:prisma:generate

# Push database schema
pnpm api:prisma:push
```

### Development

```bash
# Start all services
pnpm dev

# Start individual services
pnpm web:dev    # Frontend only
pnpm api:dev    # Backend only
```

### Scripts

- `pnpm dev` - Start all services in development mode
- `pnpm build` - Build all packages
- `pnpm lint` - Lint all packages
- `pnpm test` - Run tests for all packages
- `pnpm typecheck` - Type check all packages

## Project Structure

```
sports-recruitment-monorepo/
├── apps/
│   ├── web/          # React frontend
│   └── api/          # NestJS backend
├── packages/
│   └── types/        # Shared types
├── docs/
└── .github/
    └── workflows/
```

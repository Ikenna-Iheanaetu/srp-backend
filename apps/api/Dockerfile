# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9.0.0

# Copy workspace configuration
COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml ./

# Copy all workspace packages
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
COPY packages/email-templates/package.json ./packages/email-templates/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/prettier-config/package.json ./packages/prettier-config/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/api ./apps/api
COPY packages ./packages

# Generate Prisma client
WORKDIR /app/apps/api
RUN npx prisma generate

# Build the application
RUN pnpm build

# Production stage
FROM node:20-alpine AS production

# Build arguments for metadata
ARG GIT_SHA=unknown
ARG BUILD_TIME=unknown

# Add metadata labels
LABEL org.opencontainers.image.title="Sports Recruitment Platform API" \
    org.opencontainers.image.description="NestJS API for Sports Recruitment Platform - Staging" \
    org.opencontainers.image.revision="${GIT_SHA}" \
    org.opencontainers.image.created="${BUILD_TIME}" \
    org.opencontainers.image.environment="staging"

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9.0.0

# Copy workspace configuration
COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml ./

# Copy all workspace packages
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
COPY packages/email-templates/package.json ./packages/email-templates/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/prettier-config/package.json ./packages/prettier-config/

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy packages source (might be needed at runtime)
COPY packages ./packages

# Copy Prisma schema
COPY apps/api/prisma ./apps/api/prisma

# Copy built application from builder
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Generate Prisma Client in production stage
WORKDIR /app/apps/api
RUN pnpm prisma:generate

# Create non-root user and change ownership
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "dist/src/main.js"]

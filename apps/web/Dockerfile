FROM node:20-alpine AS builder

WORKDIR /app

RUN apk update && apk add --no-cache bash libc6-compat
RUN npm install -g pnpm

# Copy required monorepo config files from root
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy workspace packages required for installation and build
COPY packages/typescript-config ./packages/typescript-config
COPY packages/shared ./packages/shared

COPY apps/web/package.json ./apps/web/package.json

RUN pnpm install --frozen-lockfile --production=false

COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ARG VITE_SITE_URL
ENV VITE_SITE_URL=$VITE_SITE_URL

RUN echo "Verifying Build Environment Variables:" && \
    echo "VITE_API_URL: ${VITE_API_URL}" && \
    echo "VITE_GOOGLE_CLIENT_ID: ${VITE_GOOGLE_CLIENT_ID}" && \
    echo "VITE_SITE_URL: ${VITE_SITE_URL}" && \
    echo "Environment check complete."

WORKDIR /app/apps/web
# Using pnpm run build, assuming tests are removed from the script
RUN pnpm run build 
WORKDIR /app

FROM nginx:alpine AS runner
EXPOSE 4000

COPY --from=builder /app/apps/web/build/client /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

RUN ls -la /usr/share/nginx/html && echo "Files copied to nginx successfully"

CMD ["nginx", "-g", "daemon off;"]
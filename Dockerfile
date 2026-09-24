# Multi-stage production Dockerfile for Ceylon Weddings monorepo
# Base image
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.15.1 --activate
WORKDIR /app

# Dependencies stage
FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/database/package.json ./packages/database/
COPY packages/env/package.json ./packages/env/
COPY packages/i18n/package.json ./packages/i18n/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/ui/package.json ./packages/ui/
COPY packages/web/package.json ./packages/web/

RUN pnpm install --frozen-lockfile

# Builder stage
FROM dependencies AS builder
COPY . .
RUN pnpm run db:generate
RUN pnpm run build

# Target 1: Production API Server
FROM node:22-alpine AS api
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api ./apps/api
COPY --from=builder /app/package.json ./
WORKDIR /app/apps/api
EXPOSE 4000
CMD ["node", "dist/main.js"]

# Target 2: Production Web Application (Next.js)
FROM node:22-alpine AS web
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/web ./apps/web
COPY --from=builder /app/package.json ./
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["npm", "run", "start"]

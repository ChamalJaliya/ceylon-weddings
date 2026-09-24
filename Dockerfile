# Monorepo image. Build from the repository root.
#   docker build --target api -t ceylon-api .
#   docker build --target web -t ceylon-web .
# Default target is api. Railway uses apps/api/Dockerfile.
FROM node:22-bookworm-slim AS base

WORKDIR /app
ENV DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl python3 make g++ ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@10.15.1 --activate

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/contracts/package.json packages/contracts/
COPY packages/database/package.json packages/database/
COPY packages/env/package.json packages/env/
COPY packages/i18n/package.json packages/i18n/
COPY packages/typescript-config packages/typescript-config
COPY packages/ui/package.json packages/ui/
COPY packages/web/package.json packages/web/
RUN pnpm install --frozen-lockfile

FROM deps AS api-builder
COPY . .
RUN pnpm --filter @ceylonweddings/database generate
RUN pnpm --filter @ceylonweddings/api build

FROM deps AS web-builder
COPY . .
RUN pnpm --filter @ceylonweddings/database generate
RUN pnpm --filter @ceylonweddings/site build

FROM node:22-bookworm-slim AS web
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@10.15.1 --activate
COPY --from=web-builder /app /app
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["pnpm", "start"]

FROM node:22-bookworm-slim AS api
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@10.15.1 --activate
COPY --from=api-builder /app /app
EXPOSE 4000
CMD ["sh", "apps/api/scripts/start.sh"]

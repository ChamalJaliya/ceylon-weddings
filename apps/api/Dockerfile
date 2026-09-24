# Build context MUST be the monorepo root (not apps/api).
# Railway: empty root directory + dockerfilePath apps/api/Dockerfile
FROM node:22-bookworm-slim AS builder

WORKDIR /app
ENV DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@10.15.1 --activate

COPY . .

RUN pnpm install --frozen-lockfile --filter @ceylonweddings/api...
RUN pnpm --filter @ceylonweddings/database generate
RUN pnpm --filter @ceylonweddings/api build

FROM node:22-bookworm-slim AS runner

WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@10.15.1 --activate

COPY --from=builder /app /app

EXPOSE 4000

CMD ["sh", "apps/api/scripts/start.sh"]

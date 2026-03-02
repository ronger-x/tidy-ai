# ---- Build stage ----
FROM node:22-alpine AS builder

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package manifests
COPY package.json pnpm-lock.yaml ./

# Install dependencies (frozen lockfile for reproducible builds)
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build Nuxt app
RUN pnpm build

# ---- Runtime stage ----
FROM node:22-alpine AS runner

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package manifests and install production deps only
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# Copy built artefacts from builder
COPY --from=builder /app/.output ./.output

# Data directory for SQLite db (will be mounted as a volume)
RUN mkdir -p /app/data

EXPOSE 3000

ENV NODE_ENV=production
ENV DATABASE_URL=/app/data/tidy.db

CMD ["node", ".output/server/index.mjs"]

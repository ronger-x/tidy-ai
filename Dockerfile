# ---- Build stage ----
FROM node:22 AS builder

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package manifests
COPY package.json pnpm-lock.yaml ./

# Install dependencies (frozen lockfile for reproducible builds)
# 强制安装 optionalDependencies，避免 libsql 平台原生包在 Alpine 环境被跳过
RUN pnpm install --frozen-lockfile --no-optional=false

# Copy source
COPY . .

# Build Nuxt app
RUN pnpm build

# ---- Runtime stage ----
FROM node:22 AS runner

WORKDIR /app

# 直接从构建阶段复制 node_modules（含正确平台的原生二进制，如 @libsql/linux-x64-musl）
# 避免在运行阶段重新安装时因可选依赖缺失导致 libsql 无法加载
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/server/db/migrations ./server/db/migrations
COPY package.json ./

# Data directory for SQLite db (will be mounted as a volume)
RUN mkdir -p /app/data

EXPOSE 3000

ENV NODE_ENV=production
ENV DATABASE_URL=/app/data/tidy.db

CMD ["node", ".output/server/index.mjs"]

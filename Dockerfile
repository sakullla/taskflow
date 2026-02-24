# syntax=docker/dockerfile:1.7

# ============================================
# Stage 1: Builder
# ============================================
FROM node:20-alpine AS builder

# Build dependencies for native modules (e.g. better-sqlite3)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy lockfile and workspace manifests first for better cache reuse.
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json

RUN --mount=type=cache,target=/root/.npm \
    npm ci --workspace apps/api --workspace apps/web

# Workspace symlinks are not needed in the image.
RUN rm -f node_modules/api node_modules/web || true

# Copy sources and build both apps.
COPY apps ./apps
RUN npm --workspace apps/web run build \
    && npm --workspace apps/api run build

# ============================================
# Stage 2: Production
# ============================================
FROM node:20-alpine AS production

RUN apk add --no-cache sqlite-libs

WORKDIR /app
RUN mkdir -p /app/data

# Install only runtime dependencies for API.
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json

RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --workspace apps/api \
    && rm -f node_modules/api node_modules/web || true

# Copy runtime artifacts.
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/prisma.config.ts ./apps/api/prisma.config.ts
COPY --from=builder /app/apps/api/scripts ./apps/api/scripts
COPY --from=builder /app/apps/web/dist ./apps/web/dist

COPY scripts/docker-start.sh /app/start.sh
RUN chmod +x /app/start.sh

ENV NODE_ENV=production \
    PORT=3000 \
    DATABASE_URL=file:/app/data/todo.db \
    DB_TYPE=sqlite

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["/app/start.sh"]

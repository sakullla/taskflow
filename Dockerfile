# syntax=docker/dockerfile:1.7

# Multi-stage build for Todo App
# Single image containing both API and Web

# ============================================
# Stage 1: Build Web
# ============================================
FROM node:20-alpine AS web-builder

WORKDIR /app

# Copy lockfile and workspace manifests first to maximize cache hits.
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json

RUN --mount=type=cache,target=/root/.npm \
  npm ci --workspace apps/web

# Copy web source and build
COPY apps/web ./apps/web
RUN npm --workspace apps/web run build

# ============================================
# Stage 2: Build API
# ============================================
FROM node:20-alpine AS api-builder

# Install build dependencies for native modules (e.g. better-sqlite3)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy lockfile and workspace manifests first to maximize cache hits.
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json

RUN --mount=type=cache,target=/root/.npm \
  npm ci --workspace apps/api

# Workspace symlinks are not needed at runtime.
RUN rm -f node_modules/api node_modules/web || true

# Copy API source and build
COPY apps/api ./apps/api
RUN npm --workspace apps/api run build

# ============================================
# Stage 3: Production
# ============================================
FROM node:20-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache sqlite-libs

# Create app directory
WORKDIR /app

# Create data directory for SQLite
RUN mkdir -p /app/data

# Copy API runtime files
COPY --from=api-builder /app/node_modules ./node_modules
COPY --from=api-builder /app/apps/api/package.json ./api/package.json
COPY --from=api-builder /app/apps/api/prisma ./api/prisma
COPY --from=api-builder /app/apps/api/prisma.config.ts ./api/prisma.config.ts
COPY --from=api-builder /app/apps/api/scripts ./api/scripts
COPY --from=api-builder /app/apps/api/dist ./api/dist

# Copy web dist
COPY --from=web-builder /app/apps/web/dist ./web/dist

# Copy startup script
COPY scripts/docker-start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    DATABASE_URL=file:/app/data/todo.db \
    DB_TYPE=sqlite

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the application
CMD ["/app/start.sh"]

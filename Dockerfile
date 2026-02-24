# Multi-stage build for Todo App
# Single image containing both API and Web

# ============================================
# Stage 1: Build Web
# ============================================
FROM node:20-alpine AS web-builder

WORKDIR /app/web

# Copy web package files
COPY apps/web/package*.json ./
RUN npm install

# Copy web source
COPY apps/web/ ./

# Build web
RUN npm run build

# ============================================
# Stage 2: Build API
# ============================================
FROM node:20-alpine AS api-builder

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

WORKDIR /app/api

# Copy API package files
COPY apps/api/package*.json ./
RUN npm install

# Copy API source
COPY apps/api/ ./

# Generate Prisma client
RUN npx prisma generate

# Build API
RUN npm run build

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

# Copy API production files
COPY --from=api-builder /app/api/dist ./api/dist
COPY --from=api-builder /app/api/node_modules ./api/node_modules
COPY --from=api-builder /app/api/package*.json ./api/
COPY --from=api-builder /app/api/prisma ./api/prisma

# Copy web dist
COPY --from=web-builder /app/web/dist ./web/dist

# Copy startup script
COPY scripts/docker-start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL=file:/app/data/todo.db
ENV DB_TYPE=sqlite

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the application
CMD ["/app/start.sh"]

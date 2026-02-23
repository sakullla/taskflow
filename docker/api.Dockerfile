# 生产环境 API Dockerfile
FROM node:20-alpine AS base

# 安装系统依赖
RUN apk add --no-cache libc6-compat wget

WORKDIR /app

# 依赖安装阶段
FROM base AS deps
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/

# 安装生产依赖
RUN npm ci --omit=dev --workspace=apps/api

# 构建阶段
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY apps/api ./apps/api

WORKDIR /app/apps/api

# 生成 Prisma 客户端并构建
RUN npx prisma generate
RUN npm run build

# 生产阶段
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=4000

WORKDIR /app

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 apiuser

# 复制必要文件
COPY --from=builder --chown=apiuser:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=apiuser:nodejs /app/apps/api/prisma ./prisma
COPY --from=builder --chown=apiuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=apiuser:nodejs /app/package*.json ./

# 创建数据目录
RUN mkdir -p /app/data && chown apiuser:nodejs /app/data

USER apiuser

EXPOSE 4000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -q --spider http://localhost:4000/health || exit 1

# 启动命令
CMD ["node", "dist/server.js"]

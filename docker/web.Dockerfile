# 生产环境 Web Dockerfile
FROM node:20-alpine AS base

WORKDIR /app

# 依赖安装阶段
FROM base AS deps
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/

RUN npm ci --omit=dev --workspace=apps/web

# 构建阶段
FROM base AS builder

# 构建参数
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY apps/web ./apps/web

WORKDIR /app/apps/web

# 构建应用
RUN npm run build

# 生产阶段 - 使用 Nginx 托管静态文件
FROM nginx:alpine AS runner

# 复制构建产物
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# 复制自定义 nginx 配置
COPY docker/nginx-web.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

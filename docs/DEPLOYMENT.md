# 部署指南

## 快速开始

### 使用 Docker Compose 部署 (推荐)

```bash
# 1. 克隆仓库
git clone <repository-url>
cd to-do-list

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，设置 JWT_SECRET 等敏感信息

# 3. 启动服务
docker-compose -f docker/docker-compose.yml up -d

# 4. 运行数据库迁移
docker-compose exec api npx prisma migrate deploy

# 5. 访问应用
# 打开浏览器访问 http://localhost
```

### 环境变量说明

```bash
# API 配置
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=4000
NODE_ENV=production

# 数据库
DATABASE_URL=file:/app/data/todo.db

# 前端 (构建时注入)
VITE_API_BASE_URL=/api
```

---

## 开发环境

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问
# Web: http://localhost:5173
# API: http://localhost:4000
```

---

## 生产部署

### 使用脚本部署

```bash
# 运行部署脚本
./scripts/deploy.sh
```

### 手动部署

```bash
# 1. 构建镜像
docker-compose -f docker/docker-compose.yml build

# 2. 启动服务
docker-compose -f docker/docker-compose.yml up -d

# 3. 查看日志
docker-compose logs -f
```

---

## 备份与恢复

### 自动备份

```bash
# 设置定时任务 (crontab -e)
0 2 * * * /path/to/scripts/backup.sh
```

### 手动备份

```bash
# 备份数据库
docker-compose exec api sh -c 'cp /app/data/todo.db /app/data/backup-$(date +%Y%m%d).db'

# 下载备份
docker cp todo-api:/app/data/backup-20240101.db ./backup/
```

### 恢复备份

```bash
# 停止服务
docker-compose down

# 恢复数据库
docker cp ./backup/todo.db todo-api:/app/data/todo.db

# 重启服务
docker-compose up -d
```

---

## SSL/TLS 配置

### 使用 Let's Encrypt

```bash
# 1. 安装 certbot
docker run -it --rm \
  -v "$(pwd)/docker/certbot/conf:/etc/letsencrypt" \
  -v "$(pwd)/docker/certbot/www:/var/www/certbot" \
  certbot/certbot certonly --webroot -w /var/www/certbot -d your-domain.com

# 2. 更新 nginx 配置启用 SSL
# 3. 重启服务
```

---

## 监控

### 健康检查

```bash
# API 健康检查
curl http://localhost/api/health

# 完整检查
curl http://localhost/health
```

### 日志查看

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f api
docker-compose logs -f web
```

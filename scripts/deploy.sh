#!/bin/bash

# 生产环境部署脚本
# Usage: ./scripts/deploy.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印带颜色的信息
info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查 Docker 和 Docker Compose
check_docker() {
    if ! command -v docker &> /dev/null; then
        error "Docker 未安装，请先安装 Docker"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi

    info "Docker 环境检查通过"
}

# 检查环境变量
check_env() {
    if [ ! -f ".env" ]; then
        warn ".env 文件不存在，使用默认配置"
        warn "建议在生产环境创建 .env 文件并设置 JWT_SECRET"
    else
        info "加载 .env 文件"
        export $(grep -v '^#' .env | xargs)
    fi

    # 检查关键环境变量
    if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "change-me-in-production" ]; then
        warn "JWT_SECRET 未设置或使用了默认值"
        warn "请设置一个强密码，例如: JWT_SECRET=$(openssl rand -base64 32)"
    fi
}

# 拉取最新代码 (可选)
pull_code() {
    if [ -d ".git" ]; then
        info "拉取最新代码..."
        git pull origin main || warn "拉取代码失败，使用当前版本"
    fi
}

# 构建并启动服务
deploy() {
    info "开始构建 Docker 镜像..."
    docker-compose -f docker/docker-compose.yml build --no-cache

    info "启动服务..."
    docker-compose -f docker/docker-compose.yml up -d

    info "等待服务启动..."
    sleep 5
}

# 运行数据库迁移
migrate() {
    info "检查数据库迁移..."

    # 等待 API 服务就绪
    until docker-compose -f docker/docker-compose.yml exec -T api wget -q --spider http://localhost:4000/health; do
        warn "等待 API 服务就绪..."
        sleep 2
    done

    # 运行迁移
    docker-compose -f docker/docker-compose.yml exec -T api npx prisma migrate deploy || warn "数据库迁移失败"
}

# 健康检查
health_check() {
    info "执行健康检查..."

    # 检查 Nginx
    if curl -s http://localhost/health > /dev/null; then
        info "✓ Nginx 服务正常"
    else
        error "✗ Nginx 服务异常"
        return 1
    fi

    # 检查 API
    if curl -s http://localhost/api/health > /dev/null; then
        info "✓ API 服务正常"
    else
        error "✗ API 服务异常"
        return 1
    fi

    info "所有服务健康检查通过！"
}

# 清理旧镜像
cleanup() {
    info "清理未使用的 Docker 资源..."
    docker system prune -f --volumes=false
}

# 显示访问信息
show_info() {
    echo ""
    echo "========================================"
    echo "  🎉 部署成功！"
    echo "========================================"
    echo ""
    echo "  访问地址:"
    echo "    - 应用: http://localhost"
    echo "    - API:  http://localhost/api"
    echo ""
    echo "  常用命令:"
    echo "    查看日志: docker-compose -f docker/docker-compose.yml logs -f"
    echo "    停止服务: docker-compose -f docker/docker-compose.yml down"
    echo "    重启服务: docker-compose -f docker/docker-compose.yml restart"
    echo ""
    echo "========================================"
}

# 主函数
main() {
    echo "========================================"
    echo "  Todo 应用部署脚本"
    echo "========================================"
    echo ""

    cd "$(dirname "$0")/.."

    check_docker
    check_env
    pull_code
    deploy
    migrate
    health_check
    cleanup
    show_info
}

# 运行主函数
main "$@"

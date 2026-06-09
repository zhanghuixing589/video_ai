#!/bin/bash

# 构建脚本 - build.sh
# 用于构建 Docker 镜像和启动容器

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 函数：打印信息
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# 函数：检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 检查前置条件
print_info "检查前置条件..."

if ! command_exists docker; then
    print_error "Docker 未安装，请先安装 Docker"
    exit 1
fi

if ! command_exists docker-compose; then
    print_error "Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

if ! command_exists mvn; then
    print_warning "Maven 未找到，尝试使用 mvnw"
    if [ ! -f "./mvnw" ]; then
        print_error "mvnw 也不存在，请先安装 Maven 或使用 Maven Wrapper"
        exit 1
    fi
    MVN_CMD="./mvnw"
else
    MVN_CMD="mvn"
fi

# 参数处理
MODE=${1:-dev}  # 默认开发模式

case $MODE in
    dev)
        print_info "启动开发环境..."
        docker-compose -f docker-compose.dev.yml up -d
        print_info "开发环境已启动"
        print_info "PostgreSQL: localhost:5432"
        print_info "Redis: localhost:6379"
        print_info "Adminer: http://localhost:8081"
        print_info "Redis Commander: http://localhost:8082"
        ;;

    prod)
        print_info "构建生产镜像..."

        # 清理并构建 Maven 项目
        print_info "清理并构建 Maven 项目..."
        $MVN_CMD clean package -DskipTests

        # 构建 Docker 镜像
        print_info "构建 Docker 镜像..."
        docker build -t video-ai:1.0.0 .

        # 启动生产容器
        print_info "启动生产环境..."
        docker-compose up -d
        print_info "生产环境已启动"
        print_info "应用地址: http://localhost:8080/api"
        print_info "Swagger 文档: http://localhost:8080/api/swagger-ui.html"
        ;;

    build)
        print_info "仅构建项目..."
        $MVN_CMD clean package -DskipTests
        print_info "项目构建完成"
        ;;

    build-docker)
        print_info "构建 Docker 镜像..."
        if [ ! -f "target/video-ai-1.0.0.jar" ]; then
            print_error "JAR 文件不存在，请先运行 'build' 或 'prod' 模式"
            exit 1
        fi
        docker build -t video-ai:1.0.0 .
        print_info "Docker 镜像构建完成"
        ;;

    stop)
        print_info "停止所有容器..."
        docker-compose down
        print_info "容器已停止"
        ;;

    stop-dev)
        print_info "停止开发环境..."
        docker-compose -f docker-compose.dev.yml down
        print_info "开发环境已停止"
        ;;

    logs)
        print_info "显示后端应用日志..."
        docker-compose logs -f backend
        ;;

    logs-dev)
        print_info "显示数据库日志..."
        docker-compose -f docker-compose.dev.yml logs -f postgres
        ;;

    clean)
        print_info "清理所有容器和卷..."
        docker-compose down -v
        docker-compose -f docker-compose.dev.yml down -v
        print_info "清理完成"
        ;;

    shell)
        print_info "进入后端容器 shell..."
        docker-compose exec backend /bin/sh
        ;;

    db-shell)
        print_info "连接到 PostgreSQL..."
        docker-compose exec postgres psql -U postgres -d video_db
        ;;

    redis-cli)
        print_info "连接到 Redis..."
        docker-compose exec redis redis-cli
        ;;

    status)
        print_info "显示容器状态..."
        docker-compose ps
        ;;

    *)
        echo "用法: $0 {dev|prod|build|build-docker|stop|stop-dev|logs|logs-dev|clean|shell|db-shell|redis-cli|status}"
        echo ""
        echo "命令说明："
        echo "  dev           - 启动开发环境（包含管理工具）"
        echo "  prod          - 构建并启动生产环境"
        echo "  build         - 仅构建 Maven 项目"
        echo "  build-docker  - 仅构建 Docker 镜像"
        echo "  stop          - 停止所有容器"
        echo "  stop-dev      - 停止开发环境"
        echo "  logs          - 查看后端应用日志"
        echo "  logs-dev      - 查看开发环境数据库日志"
        echo "  clean         - 清理所有容器和卷"
        echo "  shell         - 进入后端容器 shell"
        echo "  db-shell      - 连接到 PostgreSQL"
        echo "  redis-cli     - 连接到 Redis"
        echo "  status        - 显示容器状态"
        exit 1
        ;;
esac

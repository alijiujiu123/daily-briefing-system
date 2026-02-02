#!/bin/bash

# Daily Briefing System - 一键启动脚本
# 使用方法: bash start.sh [command]

set -e

echo "📅 Daily Briefing System - 启动脚本"
echo "===================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 检查 Node.js
echo -n "检查 Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ 未安装 Node.js${NC}"
    echo "请先安装 Node.js 22+: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 22 ]; then
    echo -e "${RED}❌ Node.js 版本过低 (需要 22+)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ $NODE_VERSION${NC}"

# 检查依赖
echo -n "检查依赖..."
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  需要安装依赖${NC}"
    echo "运行: npm install"
    npm install
else
    echo -e "${GREEN}✅${NC}"
fi

# 检查配置
echo -n "检查配置..."
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  需要配置文件${NC}"
    echo ""
    echo "创建配置文件..."

    cat > .env << 'EOF'
# AI 配置
ZHIPU_API_KEY=3101936be6b740899ae7aff4b84807e9.4glgTOraFrWS6wqA
ZHIPU_MODEL=GLM-4.7

# 数据库
DATABASE_URL=sqlite:data/briefing.db

# Telegram
TELEGRAM_BOT_TOKEN=8542499421:AAEL1KFkm9SsVvAs9p2AfOJkF2N6EeXGpjg
TELEGRAM_CHAT_ID=6546260475

# 其他配置
FETCH_SCHEDULE=0 8 * * *
BRIEFING_TIMEZONE=Asia/Shanghai
MAX_ARTICLES_PER_DAY=20
LOG_LEVEL=info
EOF

    echo -e "${GREEN}✅ 配置已创建${NC}"
else
    echo -e "${GREEN}✅${NC}"
fi

# 检查数据库
echo -n "检查数据库..."
if [ ! -f "data/briefing.db" ]; then
    echo -e "${YELLOW}⚠️  需要初始化数据库${NC}"
    npm run db:init
else
    echo -e "${GREEN}✅${NC}"
fi

echo ""
echo "===================================="

# 获取命令
COMMAND=${1:-"help"}

case $COMMAND in
    "fetch")
        echo "📡 抓取文章..."
        node src/index.js fetch
        ;;

    "process")
        echo "🤖 处理文章..."
        node src/index.js process
        ;;

    "briefing")
        echo "📝 生成简报..."
        node src/index.js briefing
        ;;

    "run")
        echo "🚀 运行完整流程..."
        node src/index.js run
        ;;

    "schedule")
        echo "⏰ 启动定时任务..."
        echo "按 Ctrl+C 停止"
        node src/index.js schedule
        ;;

    "test")
        echo "🧪 测试连接..."
        node src/index.js test
        ;;

    "init")
        echo "📦 初始化数据库..."
        npm run db:init
        ;;

    "install")
        echo "📥 安装依赖..."
        npm install
        ;;

    "help"|*)
        cat << EOF
使用方法: bash start.sh [command]

命令:
  fetch      - 抓取 RSS 文章
  process    - AI 处理文章
  briefing   - 生成并发送简报
  run        - 运行完整流程（推荐）
  schedule   - 启动定时任务（守护进程）
  test       - 测试各渠道连接
  init       - 初始化数据库
  install    - 安装依赖

示例:
  bash start.sh run        # 运行一次
  bash start.sh schedule   # 定时运行
  bash start.sh fetch      # 仅抓取

配置文件: .env
数据目录: data/
EOF
        ;;
esac

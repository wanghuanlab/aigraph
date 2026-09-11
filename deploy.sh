#!/usr/bin/env bash
set -e

echo "🚀 [1/2] 构建生产环境静态资源..."
npm run build

echo "📦 [2/2] 通过 SSH 增量同步至服务器 1Panel 站点目录..."
SERVER="root@wanghuanlab.com"
REMOTE_PATH="/opt/1panel/www/sites/aigraph.wanghuanlab.com/index/"

rsync -avz --progress dist/ ${SERVER}:${REMOTE_PATH}

echo "✅ 部署完成！访问地址: https://aigraph.wanghuanlab.com"

#!/bin/bash
# AIPhoto 部署到阿里云脚本

set -e

# 配置变量
SERVER_USER="root"
SERVER_IP="your-server-ip"
SERVER_PATH="/opt/aiphoto"
PROJECT_NAME="aiphoto"

echo "========================================="
echo "AIPhoto 部署脚本"
echo "========================================="

# 1. 本地构建前端
echo "Step 1: 本地构建前端..."
cd frontend
npm run build
cd ..

# 2. 打包文件
echo "Step 2: 打包项目文件..."
tar -czf aiphoto-deploy.tar.gz \
    frontend/dist/ \
    backend/ \
    docker-compose.yml \
    .dockerignore \
    backend/Dockerfile \
    backend/.dockerignore \
    backend/requirements.txt

# 3. 上传到服务器
echo "Step 3: 上传文件到服务器..."
scp aiphoto-deploy.tar.gz ${SERVER_USER}@${SERVER_IP}:/tmp/

# 4. 服务器上部署
echo "Step 4: 服务器上部署..."
ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
set -e

# 停止现有容器
cd /opt/aiphoto
docker-compose down 2>/dev/null || true

# 解压新文件
mkdir -p /opt/aiphoto
tar -xzf /tmp/aiphoto-deploy.tar.gz -C /opt/aiphoto

# 启动服务
cd /opt/aiphoto
docker-compose up -d --build

# 清理
rm /tmp/aiphoto-deploy.tar.gz

echo "部署完成！"
echo "前端访问: http://$(curl -s ifconfig.me)"
echo "后端API: http://$(curl -s ifconfig.me):8000"
ENDSSH

# 5. 清理本地文件
echo "Step 5: 清理本地文件..."
rm aiphoto-deploy.tar.gz

echo "========================================="
echo "部署完成！"
echo "========================================="

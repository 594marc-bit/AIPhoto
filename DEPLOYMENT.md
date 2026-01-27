# 阿里云 ECS 部署指南

## 前置要求

- 阿里云 ECS 服务器（建议 2核4GB 以上）
- 服务器操作系统：Ubuntu 20.04+ / CentOS 7+ / Debian 10+
- 服务器已分配公网 IP
- 域名（可选，用于 HTTPS）

## 一、服务器准备

### 1.1 安装 Docker 和 Docker Compose

**Ubuntu/Debian:**
```bash
# 更新包索引
sudo apt-get update

# 安装 Docker
curl -fsSL https://get.docker.com | bash -s docker --mirror Aliyun

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

**CentOS:**
```bash
# 更新包索引
sudo yum update -y

# 安装 Docker
curl -fsSL https://get.docker.com | bash -s docker --mirror Aliyun

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 1.2 配置阿里云镜像加速（推荐）

```bash
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com"
  ]
}
EOF

sudo systemctl daemon-reload
sudo systemctl restart docker
```

### 1.3 配置防火墙

**阿里云安全组规则：**

| 协议 | 端口 | 说明 |
|------|------|------|
| TCP | 80 | HTTP 访问 |
| TCP | 443 | HTTPS 访问（如配置 SSL） |
| TCP | 22 | SSH 管理 |

**系统防火墙（如果启用）：**

```bash
# Ubuntu/Debian
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable

# CentOS
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --permanent --add-port=22/tcp
sudo firewall-cmd --reload
```

## 二、部署项目

### 2.1 上传项目到服务器

**方法一：使用 SCP（推荐）**

在本地 Windows PowerShell 或 CMD 中执行：
```bash
# 上传整个项目目录
scp -r E:\VSProjects\AIPhoto root@你的服务器IP:/root/

# 或使用压缩包
cd E:\VSProjects\
tar -czf AIPhoto.tar.gz AIPhoto/
scp AIPhoto.tar.gz root@你的服务器IP:/root/
```

**方法二：使用 Git（推荐用于版本控制）**
```bash
# 在服务器上
cd /root
git clone https://github.com/your-repo/AIPhoto.git
cd AIPhoto
```

**方法三：使用 SFTP 工具**
- WinSCP: https://winscp.net/
- FileZilla: https://filezilla-project.org/

### 2.2 配置生产环境变量

编辑 `backend/.env` 文件，修改生产环境配置：

```bash
cd /root/AIPhoto/backend
nano .env
```

**重要配置项：**

```bash
# 服务器配置
HOST=0.0.0.0
PORT=8000
DEBUG=false

# CORS 配置 - 添加你的域名
CORS_ORIGINS=["https://your-domain.com", "https://www.your-domain.com"]

# JWT 密钥 - 必须修改为随机字符串！
SECRET_KEY=你的随机密钥-至少32位字符
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# 数据目录
DATA_DIR=./data
```

**生成安全的 SECRET_KEY：**
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 2.3 创建必要目录

```bash
cd /root/AIPhoto
mkdir -p backend/data
```

### 2.4 启动服务

```bash
cd /root/AIPhoto
docker-compose up -d --build
```

### 2.5 查看服务状态

```bash
# 查看容器状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 查看后端日志
docker-compose logs -f backend

# 查看前端日志
docker-compose logs -f frontend
```

## 三、配置域名（可选）

### 3.1 添加域名解析

在阿里云域名控制台添加 A 记录：

| 主机记录 | 记录类型 | 记录值 |
|----------|----------|--------|
| @ | A | 你的服务器公网 IP |
| www | A | 你的服务器公网 IP |

### 3.2 修改 nginx 配置

如果有域名，修改 `frontend/nginx.conf`：

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # 其他配置保持不变...
}
```

### 3.3 配置 SSL 证书（推荐）

**使用 Let's Encrypt 免费证书：**

```bash
# 安装 certbot
sudo apt-get install certbot python3-certbot-nginx -y

# 获取证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

## 四、日常维护

### 4.1 更新项目

```bash
cd /root/AIPhoto
git pull  # 如果使用 Git
docker-compose up -d --build
```

### 4.2 备份数据

```bash
# 备份用户数据
tar -czf backup-$(date +%Y%m%d).tar.gz backend/data/

# 备份到阿里云 OSS（可选）
# 需要先安装 ossutil
```

### 4.3 查看日志

```bash
# 所有日志
docker-compose logs

# 最近 100 行
docker-compose logs --tail=100

# 实时监控
docker-compose logs -f
```

### 4.4 重启服务

```bash
# 重启所有服务
docker-compose restart

# 只重启后端
docker-compose restart backend

# 只重启前端
docker-compose restart frontend
```

### 4.5 停止服务

```bash
docker-compose down
```

## 五、故障排查

### 5.1 服务无法访问

```bash
# 检查容器状态
docker-compose ps

# 检查端口监听
netstat -tlnp | grep -E '80|8000'

# 检查防火墙
sudo ufw status
```

### 5.2 后端错误

```bash
# 查看后端日志
docker-compose logs backend

# 进入后端容器
docker-compose exec backend bash

# 检查环境变量
docker-compose exec backend env
```

### 5.3 前端白屏

```bash
# 查看 nginx 配置
docker-compose exec frontend cat /etc/nginx/conf.d/default.conf

# 检查文件是否存在
docker-compose exec frontend ls -la /usr/share/nginx/html/spa/

# 查看 nginx 错误日志
docker-compose exec frontend cat /var/log/nginx/error.log
```

## 六、性能优化（可选）

### 6.1 配置 Swap（防止内存不足）

```bash
# 创建 2GB swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 永久生效
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 6.2 限制容器资源

编辑 `docker-compose.yml`：

```yaml
services:
  backend:
    # ... 其他配置
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G

  frontend:
    # ... 其他配置
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
```

### 6.3 启用 Nginx 缓存

在 `frontend/nginx.conf` 中添加：

```nginx
# 静态资源缓存
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 七、安全建议

1. **修改默认密码**：首次登录后立即修改 admin 密码
2. **定期更新**：定期更新系统和 Docker 镜像
3. **配置防火墙**：只开放必要的端口
4. **使用 HTTPS**：生产环境建议启用 SSL
5. **定期备份**：定期备份用户数据
6. **监控日志**：定期检查访问和错误日志
7. **限制访问**：可以配置 IP 白名单限制管理访问

## 八、快速部署脚本

保存为 `deploy.sh`：

```bash
#!/bin/bash
set -e

echo "=== AIPhoto 部署脚本 ==="

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "Docker 未安装，正在安装..."
    curl -fsSL https://get.docker.com | bash
    systemctl start docker
    systemctl enable docker
fi

# 检查 Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose 未安装，正在安装..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# 创建数据目录
mkdir -p backend/data

# 构建并启动
echo "正在构建并启动服务..."
docker-compose up -d --build

echo "=== 部署完成 ==="
echo "访问地址: http://$(curl -s ifconfig.me)"
echo ""
echo "查看日志: docker-compose logs -f"
```

使用方法：
```bash
chmod +x deploy.sh
./deploy.sh
```

---

**部署完成后，访问 `http://你的服务器IP` 即可使用 AIPhoto！**

默认登录账号：
- 用户名: `admin`
- 密码: `admin123`（请立即修改）

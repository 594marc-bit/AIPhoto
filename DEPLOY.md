# AIPhoto 阿里云部署指南

## 方案一：Docker 部署（推荐）

### 前置要求
- 阿里云 ECS 服务器（1核2G以上）
- 服务器已安装 Docker 和 Docker Compose
- 域名（可选，如需 HTTPS）

### 安装 Docker

```bash
# 安装 Docker
curl -fsSL https://get.docker.com | bash -s docker --mirror Aliyun

# 安装 Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

### 部署步骤

#### 方法 A：使用部署脚本（Linux/Mac）

1. 修改 `deploy.sh` 中的服务器配置：
```bash
SERVER_USER="root"           # 服务器用户名
SERVER_IP="your-server-ip"   # 服务器IP地址
```

2. 执行部署：
```bash
chmod +x deploy.sh
./deploy.sh
```

#### 方法 B：手动部署

1. **上传项目到服务器**
```bash
scp -r . root@your-server-ip:/opt/aiphoto
```

2. **在服务器上执行**
```bash
cd /opt/aiphoto

# 启动服务
docker-compose up -d --build

# 查看日志
docker-compose logs -f

# 查看运行状态
docker-compose ps
```

3. **访问应用**
- 前端：`http://your-server-ip`
- 后端API：`http://your-server-ip:8000`
- API文档：`http://your-server-ip:8000/docs`

### 常用命令

```bash
# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看日志
docker-compose logs -f frontend
docker-compose logs -f backend

# 更新部署
git pull
docker-compose up -d --build

# 清理数据（危险操作）
docker-compose down -v
```

---

## 方案二：传统部署（不使用 Docker）

### 1. 安装依赖

```bash
# 安装 Node.js 20
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# 安装 Python 3.8+
sudo yum install -y python38 python38-pip

# 安装 Nginx
sudo yum install -y nginx

# 安装 PM2
sudo npm install -g pm2
```

### 2. 部署后端

```bash
cd /opt/aiphoto/backend

# 创建虚拟环境
python3.8 -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 使用 PM2 启动
pm2 start python --name aiphoto-backend -- main.py
pm2 save
pm2 startup
```

### 3. 部署前端

```bash
# 在本地或服务器上构建
cd /opt/aiphoto
npm install
npm run build

# 部署到 Nginx
sudo cp -r dist/* /var/www/aiphoto/
```

### 4. 配置 Nginx

```bash
sudo vi /etc/nginx/conf.d/aiphoto.conf
```

添加以下内容：
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /var/www/aiphoto;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

启动 Nginx：
```bash
sudo nginx -t
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## 配置 HTTPS（可选）

### 使用 Let's Encrypt 免费证书

```bash
# 安装 Certbot
sudo yum install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

### Nginx HTTPS 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        root /var/www/aiphoto;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 防火墙配置

```bash
# 开放端口
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

阿里云安全组规则：
- 入方向：允许 TCP 80、443 端口
- 出方向：允许所有

---

## 监控与日志

### 查看应用日志

```bash
# Docker 方式
docker-compose logs -f

# PM2 方式
pm2 logs

# Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 性能监控

推荐使用阿里云云监控或其他监控工具：
- 阿里云云监控
- Prometheus + Grafana
- Uptime Kuma

---

## 故障排查

### 1. 容器无法启动
```bash
docker-compose logs backend
docker-compose logs frontend
```

### 2. API 请求失败
- 检查后端服务是否运行：`curl http://localhost:8000/health`
- 检查 Nginx 配置：`sudo nginx -t`

### 3. 前端页面 404
- 检查 Nginx 配置中的 root 路径
- 确认前端文件已正确部署

### 4. 数据持久化
Docker 部署的数据存储在 `./backend/data` 目录，确保该目录有正确的权限。

---

## 更新部署

### Docker 方式
```bash
cd /opt/aiphoto
git pull
docker-compose down
docker-compose up -d --build
```

### 传统方式
```bash
# 前端
npm run build
sudo cp -r dist/* /var/www/aiphoto/

# 后端
cd /opt/aiphoto/backend
source venv/bin/activate
pip install -r requirements.txt
pm2 restart aiphoto-backend
```

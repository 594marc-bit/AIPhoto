# AIPhoto Backend Server

基于 Python FastAPI 的用户认证和设置管理后端服务，使用 CSV 文件存储数据。

## 功能特性

- ✅ 用户注册/登录（JWT Token 认证）
- ✅ 密码加密存储（bcrypt）
- ✅ 用户设置云端同步
- ✅ CSV 文件数据存储
- ✅ 跨平台支持（Windows/Linux/Mac）
- ✅ CORS 支持

## 技术栈

- **FastAPI** - 现代化的 Web 框架
- **uvicorn** - ASGI 服务器
- **python-jose** - JWT Token 处理
- **passlib** - 密码哈希
- **Pydantic** - 数据验证

## 目录结构

```
backend/
├── api/
│   ├── __init__.py
│   ├── auth.py           # JWT 认证工具
│   ├── csv_storage.py    # CSV 数据存储
│   └── models.py         # Pydantic 数据模型
├── data/
│   ├── users.csv         # 用户数据
│   └── user_settings.csv # 用户设置
├── main.py               # FastAPI 主应用
├── requirements.txt      # Python 依赖
├── .env                  # 环境变量配置
├── .env.example          # 环境变量示例
├── start.bat             # Windows 启动脚本
└── start.sh              # Linux/Mac 启动脚本
```

## 快速开始

### 1. 安装依赖

```bash
# Windows
pip install -r requirements.txt

# Linux/Mac
pip3 install -r requirements.txt
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并根据需要修改配置：

```bash
# 服务器配置
HOST=0.0.0.0
PORT=8000
DEBUG=true

# CORS 配置（允许的前端地址）
CORS_ORIGINS=["http://localhost:9000", "http://localhost:8080"]

# JWT 密钥（生产环境请修改！）
SECRET_KEY=your-super-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# 数据目录
DATA_DIR=./data
```

### 3. 启动服务器

#### Windows:
```bash
start.bat
```

#### Linux/Mac:
```bash
chmod +x start.sh
./start.sh
```

#### 手动启动:
```bash
python main.py
```

服务器将在 http://localhost:8000 启动

### 4. 访问 API 文档

启动后访问以下地址查看交互式 API 文档：

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API 接口

### 认证接口

#### 注册用户
```
POST /auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123"
}
```

#### 用户登录
```
POST /auth/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123"
}
```

#### 获取当前用户信息
```
GET /auth/me
Authorization: Bearer <token>
```

### 设置接口

#### 获取用户设置
```
GET /settings
Authorization: Bearer <token>
```

#### 保存用户设置
```
POST /settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "settings": {
    "borderStyle": {...},
    "exifFields": [...]
  }
}
```

#### 删除用户设置
```
DELETE /settings
Authorization: Bearer <token>
```

### 健康检查

```
GET /health
```

## 数据存储

用户数据以 CSV 格式存储在 `data/` 目录下：

### users.csv
```csv
id,username,email,password_hash,created_at,last_login
user_1234567890_abc123,testuser,test@example.com,$2b$12$...,2024-01-01T00:00:00,2024-01-01T12:00:00
```

### user_settings.csv
```csv
user_id,settings_json,updated_at
user_1234567890_abc123,"{""borderStyle"":""bottom""}",2024-01-01T12:00:00
```

## 安全说明

### 密码加密
- 使用 bcrypt 算法加密密码
- 自动生成 salt，包含在哈希值中

### JWT Token
- 默认有效期为 7 天（10080 分钟）
- 存储在客户端 localStorage 中
- 每次 API 请求都在 Authorization header 中传递

### 生产环境部署
1. 修改 `SECRET_KEY` 为强随机密钥
2. 设置 `DEBUG=false`
3. 配置正确的 `CORS_ORIGINS`
4. 使用 HTTPS
5. 考虑迁移到真实数据库（PostgreSQL/MySQL）

## 常见问题

### 端口被占用
修改 `.env` 文件中的 `PORT` 值

### CORS 错误
在 `.env` 的 `CORS_ORIGINS` 中添加前端地址

### CSV 文件权限问题
确保 `data/` 目录有读写权限

## 开发

### 运行测试
```bash
pip install pytest pytest-asyncio
pytest tests/
```

### 代码格式化
```bash
pip install black
black .
```

## License

MIT

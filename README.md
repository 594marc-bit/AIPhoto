# AI照片边框处理网站

## 项目概述

本项目是一个基于Quasar框架的照片边框处理网站，支持批量照片处理，能够为照片添加多种边框样式，自动根据照片EXIF信息判断相机品牌并选择相应的logo，同时支持用户自定义logo和EXIF信息显示。

项目采用前后端分离架构，支持Docker容器化部署。

## 功能特性

### 边框样式
- **底部边框** - 在照片底部添加边框
- **四周边框** - 在照片四周添加边框
- **艺术边框** - 带阴影和圆角的艺术边框
- **自定义边框** - 可自定义颜色、宽度和样式
- **半透明模糊背景** - 将照片稍微放大并模糊处理作为背景，模糊程度可以通过滑块调整
- **默认边框宽度** - 为每一种边框默认最美观的宽度
- **可调整边框的宽度** - 通过滑杆可调整边框的宽度
- **支持效果实时预览**

### EXIF信息控制
- **选择显示字段** - 可以选择光圈、快门、ISO、焦距、拍摄时间、GPS
- **不显示** - 完全不显示EXIF信息
- **位置调整** - 可以通过滑块调整以上每一项信息的位置，不能超出边框范围
- **字体调整** - 可以支持用户选择字体、文字的深浅度和大小

### 尺寸调整
- **保持原尺寸** - 不改变照片尺寸
- **按比例缩放** - 按指定比例缩放照片
- **固定尺寸** - 调整为指定尺寸
- **最大尺寸限制** - 限制最大宽度或高度

### 其他功能
- **Logo添加** - 信息判断相机品牌而选择相应的logo，同时也支持由用户选择品牌的logo，在边框区域添加品牌Logo，需要控制logo大小不能超出边框，用滑杆调节logo大小，logo位置可以选择上边框或下边框以及居左、居中和居右
- **批量处理** - 支持批量处理目录中的所有照片
- **默认处理** - 需要根据用户选择的边框类型、logo、字体大小等自动排版，所添加的这些信息只能在边框范围内
- **用户认证系统** - 基于FastAPI后端的用户注册/登录功能
- **JWT令牌认证** - 安全的用户身份验证和授权
- **设置持久化** - 用户设置云端存储，跨设备同步
- **用户角色** - Guest用户（单张处理）和登录用户（批量处理）

### 用户操作模式
- **操作过程** - 用户打开页面后，在左侧导航栏中选中边框操作的菜单
- 在当中操作的区域上传照片，需支持拖放上传，guest用户只支持上传单张照片
- 单张照片大小限制在8M及以下，可以是JPG，PNG格式
- 选择边框的样式，通过滑杆调整边框宽度、logo大小、字体大小、照片阴影强度等
- 确认效果后点击处理按钮，显示处理进度，完成后自动下载到用户选择的目的地

## 技术架构设计

### 技术栈选择

**前端技术栈：**
1. **前端框架**: Quasar (Vue 3) + TypeScript
2. **图片处理**: HTML5 Canvas API + Fabric.js（用于高级边框效果）
3. **EXIF解析**: exif-js 库 + piexifjs
4. **状态管理**: Pinia（Quasar推荐）
5. **样式处理**: Sass/SCSS + Quasar CSS工具类
6. **图标库**: Quasar图标 + Material Icons
7. **HTTP客户端**: Axios
8. **构建工具**: Vite (Quasar默认)
9. **国际化**: Vue I18n

**后端技术栈：**
1. **Web框架**: FastAPI (Python 3.11+)
2. **认证**: JWT (python-jose) + bcrypt 密码哈希
3. **数据存储**: CSV文件存储 (轻量级用户数据管理)
4. **跨域支持**: CORS中间件
5. **数据验证**: Pydantic
6. **ASGI服务器**: Uvicorn

**部署架构：**
1. **容器化**: Docker + Docker Compose
2. **反向代理**: Nginx (前端静态文件服务)
3. **网络**: 桥接网络隔离
4. **数据持久化**: Docker卷挂载

### 核心模块划分

**前端模块：**
1. **图片上传模块** ([ImageUploader.vue](frontend/src/components/ImageUploader.vue))：支持拖放、单张/批量上传、格式验证、大小限制
2. **边框样式模块** ([BorderStyleSelector.vue](frontend/src/components/BorderStyleSelector.vue))：5种边框样式实现，带实时预览
3. **EXIF处理模块** ([ExifFieldSelector.vue](frontend/src/components/ExifFieldSelector.vue))：读取EXIF信息，品牌Logo匹配，位置调整
4. **尺寸调整模块** ([SizeAdjuster.vue](frontend/src/components/SizeAdjuster.vue))：缩放、固定尺寸、最大限制
5. **Logo管理模块** ([LogoManager.vue](frontend/src/components/LogoManager.vue), [CustomLogoManager.vue](frontend/src/components/CustomLogoManager.vue))：品牌Logo库，位置/大小控制
6. **批量处理模块** ([BatchProgress.vue](frontend/src/components/BatchProgress.vue))：批量照片处理进度显示
7. **用户管理模块** ([UserMenu.vue](frontend/src/components/UserMenu.vue), [UserAuth.vue](frontend/src/components/UserAuth.vue))：用户认证、权限控制
8. **设置面板** ([SettingsPanel.vue](frontend/src/components/SettingsPanel.vue))：用户设置管理

**后端模块：**
1. **认证模块** ([auth.py](backend/api/auth.py))：用户注册/登录、JWT令牌生成与验证
2. **数据存储模块** ([csv_storage.py](backend/api/csv_storage.py))：用户数据和设置的CSV文件存储
3. **API路由** ([main.py](backend/main.py))：RESTful API端点定义
4. **数据模型** ([models.py](backend/api/models.py))：Pydantic数据模型定义

### 项目结构

```
AIPhoto/
├── frontend/                    # 前端 Quasar + Vue 3 应用
│   ├── src/
│   │   ├── components/          # Vue组件
│   │   │   ├── ImageUploader.vue
│   │   │   ├── BorderStyleSelector.vue
│   │   │   ├── ExifFieldSelector.vue
│   │   │   ├── LogoManager.vue
│   │   │   ├── CustomLogoManager.vue
│   │   │   ├── SizeAdjuster.vue
│   │   │   ├── ImagePreview.vue
│   │   │   ├── BatchProgress.vue
│   │   │   ├── UserMenu.vue
│   │   │   ├── UserAuth.vue
│   │   │   └── SettingsPanel.vue
│   │   ├── layouts/             # Quasar布局
│   │   │   └── MainLayout.vue
│   │   ├── pages/               # 页面组件
│   │   │   └── IndexPage.vue
│   │   ├── assets/              # 静态资源
│   │   ├── router/              # 路由配置
│   │   └── App.vue              # 根组件
│   ├── public/                  # 公共静态文件
│   ├── Dockerfile               # 前端Docker镜像构建
│   ├── nginx.conf               # Nginx配置
│   ├── package.json             # Node.js依赖
│   └── quasar.config.ts         # Quasar配置
│
├── backend/                     # 后端 FastAPI 应用
│   ├── api/                     # API模块
│   │   ├── __init__.py
│   │   ├── auth.py              # 认证逻辑
│   │   ├── csv_storage.py       # CSV存储
│   │   └── models.py            # Pydantic模型
│   ├── data/                    # 数据存储目录（运行时）
│   ├── main.py                  # FastAPI应用入口
│   ├── init_admin.py            # 管理员初始化脚本
│   ├── Dockerfile               # 后端Docker镜像构建
│   ├── requirements.txt         # Python依赖（完整版）
│   └── requirements-docker.txt  # Python依赖（Docker精简版）
│
├── docker-compose.yml           # Docker Compose编排
└── README.md                    # 项目文档
```

## 快速开始

### 环境要求

- Node.js 20+ / 22+ / 24+ / 26+ / 28
- Python 3.11+
- Docker & Docker Compose（推荐用于生产部署）

### 使用Docker部署（推荐）

1. **克隆项目**
```bash
git clone <repository-url>
cd AIPhoto
```

2. **使用Docker Compose启动**
```bash
docker-compose up -d
```

3. **访问应用**
- 前端界面: http://localhost
- 后端API: http://localhost:8000
- API文档: http://localhost:8000/docs

4. **停止服务**
```bash
docker-compose down
```

### 本地开发

**后端开发：**
```bash
cd backend
# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或 venv\Scripts\activate  # Windows

# 安装依赖
pip install -r requirements.txt

# 运行开发服务器
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**前端开发：**
```bash
cd frontend
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## API文档

后端提供RESTful API接口，支持Swagger自动文档生成。

### 认证接口

| 方法 | 端点 | 描述 |
|------|------|------|
| POST | `/auth/register` | 用户注册 |
| POST | `/auth/login` | 用户登录 |
| GET | `/auth/me` | 获取当前用户信息 |

### 设置接口

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| GET | `/settings` | 获取用户设置 | 需要 |
| POST | `/settings` | 保存用户设置 | 需要 |
| DELETE | `/settings` | 删除用户设置 | 需要 |

### 管理接口

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| GET | `/admin/users` | 获取所有用户列表 | 需要 |

### 健康检查

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/` | 服务状态检查 |
| GET | `/health` | 健康检查 |

详细API文档请访问：`http://localhost:8000/docs`

## 功能特性

### 边框样式
- **底部边框** - 在照片底部添加边框
- **四周边框** - 在照片四周添加边框
- **艺术边框** - 带阴影和圆角的艺术边框
- **自定义边框** - 可自定义颜色、宽度和样式
- **半透明模糊背景** - 将照片稍微放大并模糊处理作为背景，模糊程度可以通过滑块调整
- **默认边框宽度** - 为每一种边框默认最美观的宽度
- **可调整边框的宽度** - 通过滑杆可调整边框的宽度
- **支持效果实时预览**

### EXIF信息控制
- **选择显示字段** - 可以选择光圈、快门、ISO、焦距、拍摄时间、GPS
- **不显示** - 完全不显示EXIF信息
- **位置调整** - 可以通过滑块调整以上每一项信息的位置，不能超出边框范围
- **字体调整** - 可以支持用户选择字体、文字的深浅度和大小

### 尺寸调整
- **保持原尺寸** - 不改变照片尺寸
- **按比例缩放** - 按指定比例缩放照片
- **固定尺寸** - 调整为指定尺寸
- **最大尺寸限制** - 限制最大宽度或高度

### 其他功能
- **Logo添加** - 信息判断相机品牌而选择相应的logo，同时也支持由用户选择品牌的logo，在边框区域添加品牌Logo，需要控制logo大小不能超出边框，用滑杆调节logo大小，logo位置可以选择上边框或下边框以及居左、居中和居右
- **批量处理** - 支持批量处理目录中的所有照片
- **默认处理** - 需要根据用户选择的边框类型、logo、字体大小等自动排版，所添加的这些信息只能在边框范围内
- **用户认证系统** - 基于FastAPI后端的用户注册/登录功能
- **JWT令牌认证** - 安全的用户身份验证和授权
- **设置持久化** - 用户设置云端存储，跨设备同步
- **用户角色** - Guest用户（单张处理）和登录用户（批量处理）

### 用户操作模式
- **操作过程** - 用户打开页面后，在左侧导航栏中选中边框操作的菜单
- 在当中操作的区域上传照片，需支持拖放上传，guest用户只支持上传单张照片
- 单张照片大小限制在8M及以下，可以是JPG，PNG格式
- 选择边框的样式，通过滑杆调整边框宽度、logo大小、字体大小、照片阴影强度等
- 确认效果后点击处理按钮，显示处理进度，完成后自动下载到用户选择的目的地

## 开发说明

### 前端组件说明

- [MainLayout.vue](frontend/src/layouts/MainLayout.vue) - 主布局组件，包含侧边栏导航和顶部用户菜单
- [IndexPage.vue](frontend/src/pages/IndexPage.vue) - 主页面，集成所有照片处理功能
- [ImageUploader.vue](frontend/src/components/ImageUploader.vue) - 图片上传组件，支持拖放和选择
- [BorderStyleSelector.vue](frontend/src/components/BorderStyleSelector.vue) - 边框样式选择器
- [ExifFieldSelector.vue](frontend/src/components/ExifFieldSelector.vue) - EXIF字段选择器
- [LogoManager.vue](frontend/src/components/LogoManager.vue) - 预设Logo管理
- [CustomLogoManager.vue](frontend/src/components/CustomLogoManager.vue) - 自定义Logo管理
- [SizeAdjuster.vue](frontend/src/components/SizeAdjuster.vue) - 尺寸调整组件
- [ImagePreview.vue](frontend/src/components/ImagePreview.vue) - 实时预览组件
- [BatchProgress.vue](frontend/src/components/BatchProgress.vue) - 批量处理进度显示
- [UserMenu.vue](frontend/src/components/UserMenu.vue) - 用户菜单下拉
- [UserAuth.vue](frontend/src/components/UserAuth.vue) - 用户认证对话框
- [SettingsPanel.vue](frontend/src/components/SettingsPanel.vue) - 设置面板

### 后端API说明

- [main.py](backend/main.py) - FastAPI应用入口，定义所有API端点
- [auth.py](backend/api/auth.py) - 认证相关函数（密码哈希、JWT令牌）
- [csv_storage.py](backend/api/csv_storage.py) - CSV文件存储实现
- [models.py](backend/api/models.py) - Pydantic数据模型定义

## 环境变量

### 后端环境变量
- `CORS_ORIGINS` - 允许的跨域来源（JSON数组格式）
- `DATA_DIR` - 数据存储目录路径
- `HOST` - 服务器监听地址（默认：0.0.0.0）
- `PORT` - 服务器端口（默认：8000）
- `DEBUG` - 调试模式（默认：true）

### 前端环境变量
- `VITE_API_BASE_URL` - API基础URL

## 许可证

MIT License

## 作者

594marc-bit <594marc@gmail.com>

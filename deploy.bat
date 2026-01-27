@echo off
REM AIPhoto 部署到阿里云脚本 (Windows)

setlocal

REM 配置变量
set SERVER_USER=root
set SERVER_IP=your-server-ip
set SERVER_PATH=/opt/aiphoto

echo =========================================
echo AIPhoto 部署脚本
echo =========================================

REM 1. 本地构建前端
echo Step 1: 本地构建前端...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo 构建失败！
    exit /b 1
)
cd ..

REM 2. 打包文件 (使用 PowerShell)
echo Step 2: 打包项目文件...
powershell -Command "Compress-Archive -Path frontend/dist,backend,docker-compose.yml,.dockerignore -DestinationPath aiphoto-deploy.zip -Force"

REM 3. 上传到服务器 (需要安装 pscp 或使用 scp)
echo Step 3: 上传文件到服务器...
echo 请手动上传 aiphoto-deploy.zip 到服务器 %SERVER_IP%
echo 或者使用 scp: scp aiphoto-deploy.zip %SERVER_USER%@%SERVER_IP%:/tmp/

echo.
echo =========================================
echo 打包完成！
echo =========================================
echo 请执行以下步骤完成部署:
echo.
echo 1. 上传 aiphoto-deploy.zip 到服务器
echo 2. 在服务器上执行:
echo    mkdir -p %SERVER_PATH%
echo    cd %SERVER_PATH%
echo    unzip /tmp/aiphoto-deploy.zip
echo    docker-compose up -d --build
echo.
pause

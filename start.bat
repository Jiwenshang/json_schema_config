@echo off
REM JSON Schema 动态表单生成器 - Windows 启动脚本

echo ================================
echo JSON Schema 动态表单生成器
echo ================================
echo.

REM 获取脚本所在目录
set SCRIPT_DIR=%~dp0
cd /d %SCRIPT_DIR%

REM 检查是否安装了 Python
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo ✓ 检测到 Python
    echo.
    echo 启动本地服务器...
    echo 📂 项目路径: %SCRIPT_DIR%
    echo.
    echo 请在浏览器中打开以下链接：
    echo.
    echo 基础版: http://localhost:8000/index.html
    echo 增强版: http://localhost:8000/index-v2.html (推荐)
    echo.
    echo 按 Ctrl+C 停止服务器
    echo.
    python -m http.server 8000
    goto end
)

REM 检查 Node.js
node --version >nul 2>&1
if %errorlevel% == 0 (
    echo ✓ 检测到 Node.js
    echo.

    REM 检查 http-server
    where http-server >nul 2>&1
    if %errorlevel% neq 0 (
        echo 未找到 http-server，正在安装...
        call npm install -g http-server
    )

    echo 启动本地服务器...
    echo 📂 项目路径: %SCRIPT_DIR%
    echo.
    echo 请在浏览器中打开以下链接：
    echo.
    echo 基础版: http://localhost:8000/index.html
    echo 增强版: http://localhost:8000/index-v2.html (推荐)
    echo.
    echo 按 Ctrl+C 停止服务器
    echo.
    call http-server -p 8000
    goto end
)

REM 未找到任何工具
echo ✗ 未找到 Python 或 Node.js
echo.
echo 请安装以下任一工具：
echo   1. Python 3: https://www.python.org/downloads/
echo   2. Node.js: https://nodejs.org/
echo.
echo 或直接打开文件：
echo   %SCRIPT_DIR%index-v2.html
pause

:end

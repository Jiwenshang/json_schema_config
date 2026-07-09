#!/bin/bash

# JSON Schema 动态表单生成器 - 启动脚本

echo "================================"
echo "JSON Schema 动态表单生成器"
echo "================================"
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# 检查是否安装了 Python
if command -v python3 &> /dev/null; then
    echo "✓ 检测到 Python 3"
    echo ""
    echo "启动本地服务器..."
    echo "📂 项目路径: $SCRIPT_DIR"
    echo ""
    echo "请在浏览器中打开以下链接："
    echo ""
    echo "基础版: http://localhost:8000/index.html"
    echo "增强版: http://localhost:8000/index-v2.html (推荐)"
    echo ""
    echo "按 Ctrl+C 停止服务器"
    echo ""
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    echo "✓ 检测到 Python 2"
    echo ""
    echo "启动本地服务器..."
    echo "📂 项目路径: $SCRIPT_DIR"
    echo ""
    echo "请在浏览器中打开以下链接："
    echo ""
    echo "基础版: http://localhost:8000/index.html"
    echo "增强版: http://localhost:8000/index-v2.html (推荐)"
    echo ""
    echo "按 Ctrl+C 停止服务器"
    echo ""
    python -m SimpleHTTPServer 8000
elif command -v node &> /dev/null; then
    echo "✓ 检测到 Node.js"
    echo ""

    # 检查 http-server
    if ! command -v http-server &> /dev/null; then
        echo "未找到 http-server，正在安装..."
        npm install -g http-server
    fi

    echo "启动本地服务器..."
    echo "📂 项目路径: $SCRIPT_DIR"
    echo ""
    echo "请在浏览器中打开以下链接："
    echo ""
    echo "基础版: http://localhost:8000/index.html"
    echo "增强版: http://localhost:8000/index-v2.html (推荐)"
    echo ""
    echo "按 Ctrl+C 停止服务器"
    echo ""
    http-server -p 8000
else
    echo "✗ 未找到 Python 或 Node.js"
    echo ""
    echo "请安装以下任一工具："
    echo "  1. Python 3: https://www.python.org/downloads/"
    echo "  2. Node.js: https://nodejs.org/"
    echo ""
    echo "或直接打开文件："
    echo "  open $SCRIPT_DIR/index-v2.html"
    exit 1
fi

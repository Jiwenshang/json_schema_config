# 测试清单和部署指南

## 📋 功能测试清单

### ✅ 基础功能测试

- [ ] **表单渲染**
  - [ ] Schema 加载成功
  - [ ] 表单正确显示
  - [ ] 所有字段可见
  - [ ] 响应式布局工作

- [ ] **字段类型**
  - [ ] 文本输入可用
  - [ ] 数字输入可用
  - [ ] 复选框可用
  - [ ] 下拉框可用
  - [ ] 多选框可用
  - [ ] 日期输入可用

- [ ] **高级功能**
  - [ ] 图片上传工作
  - [ ] 拖拽上传工作
  - [ ] 拖拽排序工作
  - [ ] i18n 切换正常
  - [ ] 富文本编辑可用

### ✅ 数据操作测试

- [ ] **表单操作**
  - [ ] 填写数据后更新预览
  - [ ] 实时数据显示无延迟
  - [ ] 数据格式正确
  - [ ] 清空字段正常

- [ ] **导入/导出**
  - [ ] 导出生成有效 JSON
  - [ ] 导出文件名正确
  - [ ] 导入解析成功
  - [ ] 导入后数据正确填充
  - [ ] 导入验证工作

- [ ] **重置功能**
  - [ ] 重置清空所有数据
  - [ ] 重置后可重新填写
  - [ ] 重置确认对话框显示

### ✅ 验证测试

- [ ] **必填验证**
  - [ ] 检测必填字段为空
  - [ ] 显示错误信息
  - [ ] 错误高亮显示

- [ ] **格式验证**
  - [ ] 字符串长度验证
  - [ ] 数字范围验证
  - [ ] URL 格式验证
  - [ ] 数组项数验证

- [ ] **错误显示**
  - [ ] 错误列表显示
  - [ ] 错误信息清晰
  - [ ] 错误可清除

### ✅ UI/UX 测试

- [ ] **界面**
  - [ ] 页面加载正常
  - [ ] 所有按钮可点击
  - [ ] 下拉菜单正常
  - [ ] 模态对话框显示

- [ ] **交互**
  - [ ] 鼠标悬停效果正常
  - [ ] 点击反馈及时
  - [ ] 加载动画显示
  - [ ] 提示信息显示

- [ ] **响应式**
  - [ ] 桌面视图正常
  - [ ] 平板视图正常
  - [ ] 手机视图正常
  - [ ] 内容不溢出

### ✅ 快捷键测试

- [ ] **Ctrl+S** 导出正常
- [ ] **Ctrl+R** 重置工作
- [ ] **Ctrl+Shift+I** 导入工作
- [ ] **Ctrl+Shift+V** 验证工作（增强版）

### ✅ 浏览器兼容性

| 浏览器 | 版本 | 测试状态 | 备注 |
|--------|------|--------|------|
| Chrome | 最新 | [ ] 通过 | |
| Firefox | 最新 | [ ] 通过 | |
| Safari | 最新 | [ ] 通过 | |
| Edge | 最新 | [ ] 通过 | |
| 移动 Chrome | 最新 | [ ] 通过 | |
| 移动 Safari | 最新 | [ ] 通过 | |

### ✅ 设备测试

| 设备 | 屏幕尺寸 | 测试状态 | 备注 |
|-----|--------|--------|------|
| 桌面 | 1920x1080 | [ ] 通过 | |
| 笔记本 | 1366x768 | [ ] 通过 | |
| 平板 | 768x1024 | [ ] 通过 | |
| 手机 | 375x667 | [ ] 通过 | |
| 超宽 | 2560x1440 | [ ] 通过 | |

### ✅ 性能测试

- [ ] **加载性能**
  - [ ] 首次加载 < 2秒
  - [ ] 脚本加载完全
  - [ ] 无 404 错误
  - [ ] 无加载卡顿

- [ ] **交互性能**
  - [ ] 输入无延迟
  - [ ] 切换流畅（60fps）
  - [ ] 拖拽平滑
  - [ ] 动画流畅

- [ ] **内存占用**
  - [ ] 初始加载 < 10MB
  - [ ] 操作后未见增长
  - [ ] 无内存泄漏
  - [ ] 长时间运行稳定

### ✅ 安全性测试

- [ ] **输入验证**
  - [ ] XSS 防护
  - [ ] SQL 注入防护
  - [ ] 特殊字符处理

- [ ] **数据安全**
  - [ ] 敏感数据不硬编码
  - [ ] 本地存储安全
  - [ ] HTTPS 支持

### ✅ 错误处理测试

- [ ] **异常情况**
  - [ ] JSON 解析错误处理
  - [ ] 网络错误处理
  - [ ] 文件读取错误处理
  - [ ] 无 Schema 情况处理

- [ ] **边界情况**
  - [ ] 空 Schema
  - [ ] 大型 Schema（1000+ 字段）
  - [ ] 大型数组（100+ 项）
  - [ ] 深层嵌套结构

---

## 🚀 部署指南

### 前置要求

```
✓ Node.js 12.0+ 或 Python 3.6+
✓ Git（可选）
✓ Web 服务器（Nginx、Apache 等）
✓ 现代浏览器
```

### 开发环境部署

#### 方式 1：Python 简单服务器

```bash
# 最简单的方式
cd /Users/jiwenshang/Desktop/pro/test_conf
python3 -m http.server 8000

# 访问：http://localhost:8000/index-v2.html
```

#### 方式 2：Node.js http-server

```bash
# 全局安装
npm install -g http-server

# 启动服务
cd /Users/jiwenshang/Desktop/pro/test_conf
http-server -p 8000

# 访问：http://localhost:8000/index-v2.html
```

#### 方式 3：使用启动脚本

```bash
# macOS/Linux
cd /Users/jiwenshang/Desktop/pro/test_conf
chmod +x start.sh
./start.sh

# Windows
cd C:\Users\jiwenshang\Desktop\pro\test_conf
start.bat
```

### 生产环境部署

#### 方式 1：使用 Nginx

```nginx
# /etc/nginx/sites-available/default

server {
    listen 80;
    server_name your-domain.com;

    # 重定向 HTTP 到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL 证书
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # 安全头
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header Content-Security-Policy "default-src 'self'" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;

    # 文件位置
    root /var/www/form-generator;
    index index-v2.html;

    # 缓存设置
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index-v2.html;
    }

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css text/javascript application/json;
    gzip_min_length 1024;
}
```

#### 方式 2：使用 Apache

```apache
# .htaccess 或 httpd.conf

<VirtualHost *:443>
    ServerName your-domain.com
    DocumentRoot /var/www/form-generator

    # SSL 配置
    SSLEngine on
    SSLCertificateFile /path/to/cert.pem
    SSLCertificateKeyFile /path/to/key.pem

    # 安全头
    Header always set Strict-Transport-Security "max-age=31536000"
    Header always set Content-Security-Policy "default-src 'self'"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-Frame-Options "SAMEORIGIN"

    # 缓存
    <FilesMatch "\.(jpg|jpeg|png|gif|ico|css|js|woff|woff2)$">
        Header set Cache-Control "max-age=2592000, public"
    </FilesMatch>

    # Gzip 压缩
    <IfModule mod_deflate.c>
        AddOutputFilterByType DEFLATE text/html text/plain text/css text/javascript application/json
    </IfModule>

    # SPA 路由
    <IfModule mod_rewrite.c>
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index-v2.html [L]
    </IfModule>
</VirtualHost>
```

#### 方式 3：使用 Docker

```dockerfile
# Dockerfile

FROM node:16-alpine

WORKDIR /app

# 复制文件
COPY . .

# 安装依赖
RUN npm install -g http-server

# 暴露端口
EXPOSE 8000

# 启动命令
CMD ["http-server", "-p", "8000", "--cors"]
```

```bash
# 构建和运行
docker build -t form-generator .
docker run -p 8000:8000 form-generator
```

### 部署清单

- [ ] **准备阶段**
  - [ ] 确认所有文件完整
  - [ ] 检查文件权限
  - [ ] 验证 JSON Schema 有效性
  - [ ] 测试所有功能

- [ ] **配置阶段**
  - [ ] 配置 Web 服务器
  - [ ] 设置 SSL 证书
  - [ ] 配置缓存策略
  - [ ] 设置 CORS（如需要）

- [ ] **安全阶段**
  - [ ] 添加安全头
  - [ ] 启用 HTTPS
  - [ ] 设置 CSP
  - [ ] 配置防火墙

- [ ] **性能阶段**
  - [ ] 启用 Gzip 压缩
  - [ ] 设置缓存
  - [ ] 优化资源加载
  - [ ] 设置 CDN（可选）

- [ ] **监控阶段**
  - [ ] 设置日志记录
  - [ ] 配置监控告警
  - [ ] 设置错误追踪
  - [ ] 定期备份

---

## 🔧 常见部署问题

### 问题 1：CORS 错误

```
错误: Access to XMLHttpRequest has been blocked by CORS policy

解决方案:
1. 使用相同域名和端口
2. 在服务器配置中添加 CORS 头
3. 或使用代理服务器
```

### 问题 2：资源 404 错误

```
错误: Failed to load resource (404)

检查清单:
- [ ] 文件是否上传
- [ ] 文件路径是否正确
- [ ] 文件权限是否正确
- [ ] Web 服务器是否配置正确
```

### 问题 3：SSL 证书错误

```
错误: SSL_ERROR_HANDSHAKE_FAILURE_ALERT

解决方案:
1. 验证证书有效性
2. 检查证书链配置
3. 更新 SSL 配置
4. 测试 SSL 配置（ssllabs.com）
```

### 问题 4：性能缓慢

```
原因分析:
- [ ] 网络延迟
- [ ] 服务器配置
- [ ] 浏览器缓存未启用
- [ ] JavaScript 执行缓慢

优化方案:
1. 启用 Gzip 压缩
2. 配置浏览器缓存
3. 使用 CDN
4. 启用 HTTP/2
```

---

## 📊 性能优化清单

### 加载性能

- [ ] **资源优化**
  - [ ] 启用 Gzip 压缩
  - [ ] 移除未使用代码
  - [ ] 最小化 CSS 和 JS
  - [ ] 优化图片大小

- [ ] **缓存策略**
  - [ ] 设置长期缓存（30 天）
  - [ ] 使用版本控制
  - [ ] 配置 ETag
  - [ ] 使用 CDN

- [ ] **加载优化**
  - [ ] 延迟加载脚本
  - [ ] 异步加载样式
  - [ ] 预加载关键资源
  - [ ] 使用 Service Worker

### 运行时性能

- [ ] **代码优化**
  - [ ] 减少 DOM 操作
  - [ ] 使用事件委托
  - [ ] 避免强制重排
  - [ ] 使用虚拟滚动

- [ ] **内存优化**
  - [ ] 及时清理监听器
  - [ ] 避免内存泄漏
  - [ ] 优化数据结构
  - [ ] 使用对象池

### 监控指标

```
LCP (Largest Contentful Paint): < 2.5秒
FID (First Input Delay): < 100毫秒
CLS (Cumulative Layout Shift): < 0.1
FCP (First Contentful Paint): < 1.8秒
TTI (Time to Interactive): < 3.8秒
```

---

## 📈 监控和维护

### 监控设置

```javascript
// 添加性能监控
if ('PerformanceObserver' in window) {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      console.log(entry.name, entry.duration);
    }
  });
  observer.observe({ entryTypes: ['navigation', 'resource'] });
}

// 添加错误追踪
window.addEventListener('error', (e) => {
  console.error('运行时错误:', e.error);
  // 发送到监控服务
  sendToMonitoring({
    type: 'runtime_error',
    message: e.message,
    stack: e.error.stack,
    timestamp: new Date().toISOString()
  });
});

// 添加未处理 Promise 拒绝
window.addEventListener('unhandledrejection', (e) => {
  console.error('未处理的 Promise 拒绝:', e.reason);
  // 发送到监控服务
  sendToMonitoring({
    type: 'unhandled_rejection',
    reason: String(e.reason),
    timestamp: new Date().toISOString()
  });
});
```

### 日志记录

```javascript
// 创建日志系统
const Logger = {
  log: (msg, data) => {
    console.log(`[${new Date().toISOString()}] ${msg}`, data);
  },
  error: (msg, error) => {
    console.error(`[${new Date().toISOString()}] ERROR: ${msg}`, error);
  },
  warn: (msg, data) => {
    console.warn(`[${new Date().toISOString()}] WARN: ${msg}`, data);
  }
};

// 使用日志
Logger.log('表单已加载');
Logger.error('表单验证失败', errors);
Logger.warn('性能警告', { fps: 45 });
```

### 维护任务

| 任务 | 频率 | 检查项 |
|-----|------|--------|
| 安全更新 | 每月 | [ ] 依赖更新 [ ] 安全补丁 |
| 性能检查 | 每周 | [ ] 加载时间 [ ] 错误率 |
| 备份 | 每天 | [ ] 数据备份 [ ] 配置备份 |
| 日志审查 | 每周 | [ ] 错误日志 [ ] 访问日志 |

---

## 🔐 安全加固

### SSL/TLS 配置

```nginx
# 推荐的 Nginx SSL 配置
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers HIGH:!aNULL:!MD5;
ssl_prefer_server_ciphers on;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
ssl_stapling on;
ssl_stapling_verify on;
```

### 安全头部

```nginx
# Content Security Policy
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'";

# 其他安全头
add_header X-Content-Type-Options "nosniff";
add_header X-Frame-Options "SAMEORIGIN";
add_header X-XSS-Protection "1; mode=block";
add_header Referrer-Policy "strict-origin-when-cross-origin";
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()";
```

### 访问控制

```nginx
# 限制 IP 访问
allow 192.168.1.0/24;
allow 10.0.0.0/8;
deny all;

# 限制请求频率
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req zone=api burst=20 nodelay;
```

---

## ✅ 上线前检查清单

```
部署前最终检查:

[ ] 功能测试
  [ ] 所有功能正常
  [ ] 没有 JavaScript 错误
  [ ] 所有链接有效
  [ ] 没有 404 错误

[ ] 性能检查
  [ ] 首页加载 < 2秒
  [ ] 无明显卡顿
  [ ] 内存占用正常
  [ ] 没有性能警告

[ ] 安全检查
  [ ] 启用 HTTPS
  [ ] 配置安全头
  [ ] 没有敏感数据暴露
  [ ] 验证输入有效

[ ] 兼容性检查
  [ ] Chrome 测试通过
  [ ] Firefox 测试通过
  [ ] Safari 测试通过
  [ ] Edge 测试通过
  [ ] 移动浏览器测试通过

[ ] 配置检查
  [ ] 环境变量正确
  [ ] 数据库连接正常
  [ ] 邮件服务正常
  [ ] 日志系统正常

[ ] 监控检查
  [ ] 监控系统启用
  [ ] 告警配置正确
  [ ] 日志收集正常
  [ ] 备份系统工作

[ ] 文档检查
  [ ] 部署文档完整
  [ ] 维护手册完整
  [ ] 问题排查指南完整
  [ ] API 文档完整
```

---

## 🎉 部署成功标志

```
✓ 应用在生产环境运行
✓ 所有功能正常工作
✓ 性能指标达标
✓ 监控系统运作
✓ 用户反馈积极
✓ 没有关键错误
✓ 支持体系完善
```

---

**部署指南版本**: 2.0
**最后更新**: 2024-07
**适用版本**: 2.0+

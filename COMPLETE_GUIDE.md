# JSON Schema 动态表单生成器 - 完整指南

## 🎯 项目概述

这是一个强大的前端工具，可以根据 JSON Schema 动态生成交互式表单。支持多语言、图片上传、拖拽排序等企业级功能。

## 📁 文件结构

```
test_conf/
├── index.html              # 基础版本 HTML
├── index-v2.html           # 增强版本 HTML（推荐）
├── styles.css              # 统一样式文件
├── schema-loader.js        # Schema 加载器（加载和管理 JSON Schema）
├── form-renderer.js        # 表单渲染引擎（核心渲染逻辑）
├── validator.js            # 表单验证器（数据验证）
├── app.js                  # 基础版应用程序
├── app-v2.js               # 增强版应用程序（推荐）
├── demo.json               # Demo JSON Schema 模板
└── README.md               # 本文档
```

## 🚀 快速开始

### 方式 1：使用 Python 简单服务器（推荐）

```bash
cd /Users/jiwenshang/Desktop/pro/test_conf
python3 -m http.server 8000
# 然后在浏览器打开：http://localhost:8000/index-v2.html
```

### 方式 2：使用 Node.js http-server

```bash
npm install -g http-server
cd /Users/jiwenshang/Desktop/pro/test_conf
http-server -p 8000
# 然后在浏览器打开：http://localhost:8000/index-v2.html
```

### 方式 3：直接打开文件

```bash
open /Users/jiwenshang/Desktop/pro/test_conf/index-v2.html
```

## 📋 功能对比

| 功能 | 基础版 (index.html) | 增强版 (index-v2.html) |
|-----|------------------|-------------------|
| 动态表单渲染 | ✅ | ✅ |
| 多语言支持 (i18n) | ✅ | ✅ |
| 图片上传 | ✅ | ✅ |
| 拖拽排序 | ✅ | ✅ |
| 实时预览 | ✅ | ✅ |
| 表单验证 | ✗ | ✅ |
| 导入/导出 | ✅ | ✅ |
| 键盘快捷键 | ✅ | ✅ |
| 模态对话框 | ✗ | ✅ |
| Schema 信息显示 | ✗ | ✅ |
| 验证错误显示 | ✗ | ✅ |

**推荐使用增强版 (index-v2.html)** 获得最完整的功能。

## 🎨 支持的 Widget 类型

### 1. i18n-upload (多语言文本)
支持 11 种语言的文本输入，使用标签页切换。

```json
{
  "title": {
    "type": "object",
    "x-widget": "i18n-upload",
    "description": "多语言标题"
  }
}
```

**语言列表**: EN, ZH, ES, KO, RU, PT, JA, DE, IT, TR, FR

### 2. image-upload (图片上传)
支持点击上传和拖拽放入图片。

```json
{
  "icon": {
    "type": "string",
    "format": "uri",
    "x-widget": "image-upload",
    "description": "上传图标"
  }
}
```

### 3. select (单选下拉框)
使用 enum 字段定义选项。

```json
{
  "industry": {
    "type": "string",
    "x-widget": "select",
    "enum": ["gaming", "animation", "other"],
    "description": "选择行业"
  }
}
```

### 4. multi-select (多选框)
使用数组和 enum 定义多个选项。

```json
{
  "tags": {
    "type": "array",
    "items": {
      "type": "string",
      "enum": ["tag1", "tag2", "tag3"]
    },
    "x-widget": "multi-select",
    "description": "选择标签"
  }
}
```

### 5. drag-sort-list (拖拽排序列表)
支持拖拽重新排序的数组项目。

```json
{
  "items": {
    "type": "array",
    "minItems": 2,
    "maxItems": 4,
    "x-widget": "drag-sort-list",
    "items": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "icon": { "type": "string", "format": "uri" }
      }
    }
  }
}
```

### 6. i18n-richtext (多语言富文本)
支持 Markdown 和 HTML 的多语言文本。

```json
{
  "description": {
    "type": "object",
    "x-widget": "i18n-richtext",
    "description": "多语言描述（支持 Markdown）"
  }
}
```

### 7. 基本类型
自动推断的基本字段类型。

```json
{
  "name": { "type": "string", "description": "文本输入" },
  "age": { "type": "number", "description": "数字输入" },
  "active": { "type": "boolean", "description": "复选框" },
  "url": { "type": "string", "format": "uri", "description": "URL 输入" }
}
```

## 📊 JSON Schema 完整示例

### 示例 1：简单表单

```json
{
  "simple_form": {
    "title": "简单表单",
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "description": "名称"
      },
      "email": {
        "type": "string",
        "format": "uri",
        "description": "邮箱"
      },
      "age": {
        "type": "number",
        "description": "年龄",
        "minimum": 0,
        "maximum": 150
      },
      "subscribe": {
        "type": "boolean",
        "description": "订阅通知"
      }
    },
    "required": ["name", "email"]
  }
}
```

### 示例 2：多语言表单

```json
{
  "multilingual_form": {
    "title": "多语言表单",
    "type": "object",
    "properties": {
      "product_name": {
        "type": "object",
        "x-widget": "i18n-upload",
        "description": "产品名称（多语言）",
        "properties": {
          "EN": { "type": "string" },
          "ZH": { "type": "string" },
          "ES": { "type": "string" }
        }
      },
      "description": {
        "type": "object",
        "x-widget": "i18n-richtext",
        "description": "产品描述（富文本）",
        "properties": {
          "EN": { "type": "string" },
          "ZH": { "type": "string" }
        }
      }
    },
    "required": ["product_name", "description"]
  }
}
```

### 示例 3：复杂数组表单

```json
{
  "items_form": {
    "title": "项目管理表单",
    "type": "object",
    "properties": {
      "items": {
        "type": "array",
        "minItems": 1,
        "maxItems": 5,
        "x-widget": "drag-sort-list",
        "description": "项目列表（支持拖拽排序）",
        "items": {
          "type": "object",
          "required": ["title", "category"],
          "properties": {
            "title": {
              "type": "string",
              "description": "项目标题"
            },
            "category": {
              "type": "string",
              "x-widget": "select",
              "enum": ["featured", "regular", "archived"],
              "description": "分类"
            },
            "icon": {
              "type": "string",
              "format": "uri",
              "x-widget": "image-upload",
              "description": "项目图标"
            },
            "tags": {
              "type": "array",
              "items": {
                "type": "string",
                "enum": ["new", "popular", "trending"]
              },
              "x-widget": "multi-select",
              "description": "标签"
            }
          }
        }
      }
    },
    "required": ["items"]
  }
}
```

## ⌨️ 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+S` | 导出表单数据为 JSON 文件 |
| `Ctrl+R` | 重置表单（需要确认） |
| `Ctrl+Shift+I` | 导入之前导出的 JSON 数据 |
| `Ctrl+Shift+V` | 验证表单（仅增强版） |

## 🔍 表单验证

增强版 (index-v2.html) 支持自动表单验证。

### 验证规则

- **必填字段**: 检查 `required` 数组中的字段
- **字符串长度**: 检查 `minLength` 和 `maxLength`
- **数字范围**: 检查 `minimum` 和 `maximum`
- **数组项目**: 检查 `minItems` 和 `maxItems`
- **唯一性**: 检查 `uniqueItems`
- **URL 格式**: 验证 URI 格式的字符串
- **枚举值**: 验证值是否在 `enum` 中

### 验证示例

```json
{
  "validation_form": {
    "title": "带验证的表单",
    "type": "object",
    "properties": {
      "username": {
        "type": "string",
        "description": "用户名",
        "minLength": 3,
        "maxLength": 20
      },
      "password": {
        "type": "string",
        "description": "密码",
        "minLength": 8
      },
      "age": {
        "type": "number",
        "description": "年龄",
        "minimum": 18,
        "maximum": 100
      },
      "tags": {
        "type": "array",
        "items": { "type": "string" },
        "description": "标签",
        "minItems": 1,
        "maxItems": 5,
        "uniqueItems": true
      }
    },
    "required": ["username", "password", "age"]
  }
}
```

## 💾 导入/导出

### 导出数据

1. 填写表单
2. 点击"💾 导出"按钮或按 `Ctrl+S`
3. 自动下载 JSON 文件，命名格式：`schema-name-YYYY-MM-DD.json`

### 导入数据

1. 点击"📥 导入"按钮或按 `Ctrl+Shift+I`
2. 选择之前导出的 JSON 文件
3. 表单自动填充数据

## 🐛 故障排除

### 问题：表单不显示

**原因**: JSON Schema 格式不正确

**解决方案**:
1. 检查 JSON 是否有语法错误
2. 验证 `properties` 字段存在
3. 查看浏览器控制台（F12）错误信息

### 问题：图片上传失败

**原因**: 浏览器安全限制或图片格式不支持

**解决方案**:
1. 确认使用了 HTTP 服务器（不是 file:// 协议）
2. 检查图片格式（JPEG、PNG、GIF、WebP）
3. 检查图片大小（建议 < 5MB）

### 问题：i18n 字段不工作

**原因**: Widget 类型或语言设置错误

**解决方案**:
1. 确认使用了 `i18n-upload` 或 `i18n-richtext`
2. 检查语言代码是否正确
3. 验证 Schema 中 `properties` 包含语言字段

### 问题：拖拽排序不工作

**原因**: Widget 类型设置错误

**解决方案**:
1. 确认使用了 `drag-sort-list` widget
2. 检查是否正确设置为 `array` 类型
3. 在 Chrome 中测试（某些浏览器可能有限制）

## 📈 性能优化

### 对于大型表单

1. **分组相关字段**: 使用 collapsible 面板
2. **延迟加载**: 加载复杂嵌套结构时
3. **虚拟滚动**: 对于超大数组使用

### 对于图片上传

1. **压缩图片**: 上传前压缩
2. **限制大小**: 设置 `maxLength` 限制
3. **异步处理**: 后台上传处理

### 对于数据预览

1. **限制输出**: 对大型数据截断显示
2. **虚拟滚动**: 预览面板使用滚动
3. **按需格式化**: 延迟美化打印

## 🔐 安全性建议

### 前端安全

```javascript
// ✓ 应该做的
const data = sanitizeInput(formData);
const validator = new FormValidator(schema);
validator.validate(data);

// ✗ 不应该做的
eval(userInput);
innerHTML = unsafeHTML;
localStorage.setItem('password', plainText);
```

### 后端集成

```javascript
// 发送数据到服务器
async function submitToServer(formData) {
  const response = await fetch('/api/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': getCsrfToken()
    },
    body: JSON.stringify(formData)
  });
  return response.json();
}
```

## 🎓 高级用法

### 自定义 Widget

在 `form-renderer.js` 中添加：

```javascript
case 'custom-widget':
  this.renderCustomWidget(key, property, isRequired);
  break;

renderCustomWidget(key, property, isRequired) {
  // 实现自定义渲染逻辑
}
```

### 动态 Schema 生成

```javascript
function generateSchema(config) {
  return {
    [config.name]: {
      title: config.title,
      type: 'object',
      properties: config.fields.reduce((props, field) => {
        props[field.name] = {
          type: field.type,
          description: field.label
        };
        return props;
      }, {})
    }
  };
}
```

### 条件字段显示

```javascript
function shouldShowField(fieldName, formData) {
  const conditions = {
    'optional_field': () => formData.showOptional === true,
    'price_field': () => formData.productType === 'premium'
  };
  return conditions[fieldName]?.() ?? true;
}
```

## 📚 API 参考

### SchemaLoader

```javascript
// 加载文件
await schemaLoader.loadFromFile(file);

// 获取所有 Schema
const names = schemaLoader.getAllSchemaNames();

// 获取单个 Schema
const schema = schemaLoader.getSchema('name');

// 设置当前 Schema
schemaLoader.setCurrentSchema('name');

// 获取当前 Schema
const current = schemaLoader.getCurrentSchema();
```

### FormRenderer

```javascript
// 创建渲染器
const renderer = new FormRenderer(schema, container, onDataChange);

// 渲染表单
renderer.render();

// 获取表单数据
const data = renderer.getFormData();

// 初始化表单数据
const initial = renderer.initializeFormData();
```

### FormValidator

```javascript
// 创建验证器
const validator = new FormValidator(schema);

// 验证数据
const errors = validator.validate(data);

// 检查是否有错误
if (validator.hasErrors()) {
  console.log(validator.getErrorCount());
  console.log(validator.getErrorMessage());
}
```

## 🌐 浏览器兼容性

| 浏览器 | 版本 | 支持 |
|--------|------|------|
| Chrome | 80+ | ✅ 完全支持 |
| Firefox | 75+ | ✅ 完全支持 |
| Safari | 13+ | ✅ 完全支持 |
| Edge | 80+ | ✅ 完全支持 |
| IE 11 | - | ❌ 不支持 |

## 📞 支持和反馈

### 调试技巧

1. **打开浏览器开发者工具**: F12
2. **查看控制台**: Console 标签
3. **检查网络**: Network 标签
4. **审查元素**: Elements 标签

### 常见错误信息

| 错误 | 原因 | 解决方案 |
|-----|-----|--------|
| `Schema not found` | Schema 不存在 | 检查 Schema 名称 |
| `Invalid JSON` | JSON 格式错误 | 使用 JSON 验证工具 |
| `CORS error` | 跨域请求 | 使用本地服务器 |
| `File too large` | 文件过大 | 压缩文件或分割 |

## 🎉 特性演示

### 演示 1：创建多语言产品表单

```bash
1. 打开 index-v2.html
2. 从下拉菜单选择 "Q1 创作场景选项"
3. 填写多语言内容（点击标签页切换语言）
4. 上传图标和示例图片
5. 点击 "✓ 验证" 检查数据
6. 点击 "💾 导出" 保存为 JSON
```

### 演示 2：拖拽排序

```bash
1. 在 "sub_options" 数组中拖拽项目
2. 观察项目重新排序
3. 右侧预览面板实时更新数据
```

### 演示 3：导入/导出工作流

```bash
1. 填写表单数据
2. 按 Ctrl+S 导出
3. 清空表单或重置
4. 按 Ctrl+Shift+I 导入之前的数据
```

## 📝 许可证

MIT License - 可自由使用和修改

## 🔄 版本历史

### v1.0 (基础版)
- 动态表单渲染
- 多语言支持
- 基本验证
- 导入/导出

### v2.0 (增强版)
- 完整表单验证
- 模态对话框
- Schema 信息显示
- 改进的 UI/UX
- 更多键盘快捷键

---

**最后更新**: 2024-07

如有问题，请：
1. 查看浏览器控制台错误
2. 检查 JSON 格式
3. 参考本文档相关章节
4. 尝试增强版本 (index-v2.html)

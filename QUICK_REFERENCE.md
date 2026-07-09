# 快速参考卡片

## 🚀 快速开始（30秒）

```bash
# 1. 进入项目目录
cd /Users/jiwenshang/Desktop/pro/test_conf

# 2. 启动服务器（选一个）
python3 -m http.server 8000        # macOS/Linux
# 或
./start.sh                          # macOS/Linux（带菜单）
# 或
start.bat                           # Windows（带菜单）

# 3. 打开浏览器
http://localhost:8000/index-v2.html

# 4. 选择 Demo Schema 开始使用
```

---

## 📋 Widget 快速参考

| Widget | 类型 | 用途 | 示例 |
|--------|------|------|------|
| `text` | string | 文本输入 | `{ "type": "string" }` |
| `number` | number | 数字输入 | `{ "type": "number" }` |
| `checkbox` | boolean | 复选框 | `{ "type": "boolean" }` |
| `select` | string | 单选下拉 | `{ "enum": ["a", "b"] }` |
| `multi-select` | array | 多选框 | `{ "type": "array", "items": { "enum": [...] } }` |
| `image-upload` | string (URI) | 图片上传 | `{ "format": "uri", "x-widget": "image-upload" }` |
| `i18n-upload` | object | 多语言文本 | `{ "x-widget": "i18n-upload" }` |
| `i18n-richtext` | object | 多语言富文本 | `{ "x-widget": "i18n-richtext" }` |
| `drag-sort-list` | array | 拖拽排序 | `{ "type": "array", "x-widget": "drag-sort-list" }` |

---

## ⌨️ 键盘快捷键

```
Ctrl+S           导出数据
Ctrl+R           重置表单（需确认）
Ctrl+Shift+I     导入数据
Ctrl+Shift+V     验证表单（增强版）
```

---

## 🎨 常用 Schema 片段

### 基本表单字段

```json
{
  "name": {
    "type": "string",
    "description": "姓名",
    "minLength": 1,
    "maxLength": 50
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
  "active": {
    "type": "boolean",
    "description": "激活"
  }
}
```

### 选择字段

```json
{
  "country": {
    "type": "string",
    "description": "国家",
    "x-widget": "select",
    "enum": ["中国", "美国", "日本"]
  },
  "interests": {
    "type": "array",
    "description": "兴趣爱好",
    "x-widget": "multi-select",
    "items": {
      "type": "string",
      "enum": ["运动", "音乐", "读书", "旅游"]
    }
  }
}
```

### 多语言字段

```json
{
  "title": {
    "type": "object",
    "description": "标题（多语言）",
    "x-widget": "i18n-upload",
    "properties": {
      "EN": { "type": "string" },
      "ZH": { "type": "string" }
    }
  },
  "description": {
    "type": "object",
    "description": "描述（富文本）",
    "x-widget": "i18n-richtext",
    "properties": {
      "EN": { "type": "string" },
      "ZH": { "type": "string" }
    }
  }
}
```

### 数组字段

```json
{
  "items": {
    "type": "array",
    "description": "项目列表",
    "x-widget": "drag-sort-list",
    "minItems": 1,
    "maxItems": 5,
    "items": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "price": { "type": "number" },
        "icon": {
          "type": "string",
          "format": "uri",
          "x-widget": "image-upload"
        }
      }
    }
  }
}
```

---

## 🔍 验证规则快速参考

```javascript
// 必填字段
"required": ["field1", "field2"]

// 字符串验证
"minLength": 3              // 最少 3 个字符
"maxLength": 50             // 最多 50 个字符
"pattern": "^[a-z]+$"       // 正则匹配

// 数字验证
"minimum": 0                // 最小值
"maximum": 100              // 最大值
"multipleOf": 5             // 倍数验证

// 数组验证
"minItems": 1               // 最少 1 项
"maxItems": 10              // 最多 10 项
"uniqueItems": true         // 项目唯一

// 格式验证
"format": "uri"             // URL 格式
"enum": ["a", "b", "c"]     // 枚举值

// 依赖关系
"dependentRequired": {
  "field1": ["field2"]      // 如果有 field1 则 field2 必填
}
```

---

## 📁 文件位置和作用

```
index-v2.html          ← 打开这个！（增强版）
index.html             ← 或这个（基础版）

styles.css             ← 所有 CSS 样式
schema-loader.js       ← 加载 Schema
form-renderer.js       ← 渲染表单（核心）
validator.js           ← 验证表单
app.js                 ← 基础版逻辑
app-v2.js              ← 增强版逻辑（推荐）

demo.json              ← 示例 Schema
README.md              ← 快速开始
COMPLETE_GUIDE.md      ← 详细文档
API_REFERENCE.md       ← API 说明
PROJECT_SUMMARY.md     ← 项目总结
QUICK_REFERENCE.md     ← 本文件
```

---

## 🐛 常见问题速查

| 问题 | 解决方案 |
|-----|--------|
| 表单不显示 | 检查 JSON 格式，查看 F12 控制台错误 |
| 图片上传失败 | 使用 HTTP 服务器（不是 file://） |
| i18n 不工作 | 使用 `i18n-upload` 或 `i18n-richtext` widget |
| 拖拽无效 | 确认用了 `drag-sort-list` 和 `array` 类型 |
| 数据无法导入 | 检查 JSON 格式是否与 Schema 匹配 |
| 验证无法运行 | 使用增强版 `index-v2.html` 并检查 `validator.js` 加载 |

---

## 💻 代码片段

### 快速集成

```html
<!-- 包含必要文件 -->
<link rel="stylesheet" href="styles.css">
<script src="schema-loader.js"></script>
<script src="form-renderer.js"></script>
<script src="validator.js"></script>
<script src="app-v2.js"></script>

<!-- 容器 -->
<div id="formContainer"></div>
<div class="preview-panel">
  <pre id="dataPreview"></pre>
</div>
```

### 手动创建表单

```javascript
// 1. 定义 Schema
const schema = {
  title: '我的表单',
  type: 'object',
  properties: {
    name: { type: 'string', description: '名称' }
  },
  required: ['name']
};

// 2. 创建渲染器
const renderer = new FormRenderer(
  schema,
  document.getElementById('formContainer'),
  (data) => console.log('数据:', data)
);

// 3. 渲染
renderer.render();

// 4. 获取数据
const data = renderer.getFormData();
```

### 验证表单

```javascript
// 创建验证器
const validator = new FormValidator(schema);

// 验证数据
const data = renderer.getFormData();
const errors = validator.validate(data);

if (errors.length === 0) {
  console.log('✓ 有效');
} else {
  errors.forEach(e => {
    console.log(`✗ [${e.field}] ${e.message}`);
  });
}
```

### 导出/导入

```javascript
// 导出
const data = renderer.getFormData();
const json = JSON.stringify(data, null, 2);
downloadJSON(json, 'form-data.json');

// 导入
fetch('form-data.json')
  .then(r => r.json())
  .then(data => {
    renderer.formData = data;
    renderer.render();
  });
```

---

## 🎯 典型工作流

```
1. 打开 index-v2.html
   ↓
2. 上传 JSON Schema
   ↓
3. 选择一个 Schema
   ↓
4. 填写表单
   ↓
5. 点击"✓ 验证"检查
   ↓
6. 点击"💾 导出"保存
   ↓
7. 完成！
```

---

## 🔐 安全检查清单

- [ ] 验证所有用户输入
- [ ] 不在前端存储敏感数据
- [ ] 使用 HTTPS（生产环境）
- [ ] 设置 CSP（内容安全策略）
- [ ] 转义 HTML 输出
- [ ] 验证 JSON Schema
- [ ] 后端再次验证数据

---

## 📊 性能提示

- ✅ 表单加载：< 1秒
- ✅ 数据更新：实时（无延迟）
- ✅ 图片上传：支持大文件
- ✅ 数组项目：支持 100+ 项
- ✅ 浏览器支持：Chrome、Firefox、Safari、Edge

### 优化建议

```javascript
// ✓ 好的做法
const debounced = debounce(validate, 300);
renderer = new FormRenderer(..., debounced);

// ✗ 不好的做法
renderer = new FormRenderer(..., validate);  // 每次都验证
```

---

## 🌍 国际化语言代码

```
EN - English         中文 - Chinese
ES - Spanish         KO - Korean
FR - French          PT - Portuguese
DE - German          JA - Japanese
IT - Italian         RU - Russian
TR - Turkish
```

---

## 📞 获取帮助

1. **查看文档**
   - README.md - 快速开始
   - COMPLETE_GUIDE.md - 详细说明
   - API_REFERENCE.md - API 文档

2. **调试**
   - 按 F12 打开开发者工具
   - 查看 Console 标签的错误
   - 检查 Network 标签的请求

3. **测试**
   - 使用提供的 demo.json
   - 查看浏览器控制台输出
   - 检查预览面板中的数据

---

## ✨ 新手入门步骤

### 第 1 步：启动应用
```bash
cd /Users/jiwenshang/Desktop/pro/test_conf
python3 -m http.server 8000
```

### 第 2 步：打开浏览器
```
http://localhost:8000/index-v2.html
```

### 第 3 步：选择 Demo
```
点击下拉菜单选择 "Q1 创作场景选项"
```

### 第 4 步：填写表单
```
输入各字段内容，观察右侧预览
```

### 第 5 步：验证和导出
```
点击"✓ 验证"检查
点击"💾 导出"保存
```

---

## 🎓 学习路径

### 初级（1 小时）
- [ ] 启动应用
- [ ] 理解基本 Widget
- [ ] 填写和导出表单
- [ ] 阅读 README

### 中级（3 小时）
- [ ] 创建自己的 Schema
- [ ] 使用所有 Widget 类型
- [ ] 学习验证规则
- [ ] 实现导入/导出工作流

### 高级（1 天）
- [ ] 自定义 Widget
- [ ] 扩展验证规则
- [ ] 集成后端 API
- [ ] 优化性能

---

## 🔗 相关资源

- JSON Schema 官网: https://json-schema.org/
- MDN Web Docs: https://developer.mozilla.org/
- JavaScript 参考: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference

---

**快速参考卡片版本**: 1.0
**最后更新**: 2024-07
**适用版本**: 2.0+

💡 **提示**: 将此文件加入书签以快速参考！

# JSON Schema 动态表单生成器

一个功能强大的前端工具，可以根据 JSON Schema 动态生成表单，支持多语言、图片上传、拖拽排序等高级功能。

## 功能特性

### 核心功能
- ✅ **动态表单渲染** - 根据 JSON Schema 自动生成表单
- ✅ **多语言支持 (i18n)** - 支持 11 种语言 (EN, ZH, ES, KO, RU, PT, JA, DE, IT, TR, FR)
- ✅ **图片上传** - 支持点击上传和拖拽放入
- ✅ **拖拽排序** - 数组项目支持拖拽重新排序
- ✅ **多选/单选** - 自动渲染枚举字段为下拉框或多选框
- ✅ **数组管理** - 支持动态添加/删除数组项目
- ✅ **富文本编辑** - i18n 富文本字段支持 Markdown 和 HTML
- ✅ **实时预览** - 表单数据实时在右侧面板显示
- ✅ **导入/导出** - 支持导出和导入 JSON 数据

### 表单字段类型

| Widget | 类型 | 效果 |
|--------|------|------|
| `i18n-upload` | 多语言文本 | 标签页切换不同语言输入框 |
| `image-upload` | 图片上传 | 支持拖拽和点击上传 |
| `select` | 单选 | 使用 enum 字段渲染下拉框 |
| `multi-select` | 多选 | 使用数组 enum 渲染多选框 |
| `drag-sort-list` | 数组排序 | 支持拖拽排序的数组 |
| `i18n-richtext` | 富文本 | 支持 Markdown 和 HTML 的多语言字段 |
| `text` | 文本 | 普通文本输入框 |
| `number` | 数字 | 数字输入框 |
| `checkbox` | 布尔 | 复选框 |

## 使用方法

### 1. 启动应用

```bash
# 在浏览器中打开
open index.html
# 或使用 Python 简单服务器
python3 -m http.server 8000
# 然后访问 http://localhost:8000
```

### 2. 加载 Schema

**方式一：使用 Demo JSON**
- 应用启动时自动加载 `demo.json`
- 从下拉菜单选择一个 Schema

**方式二：上传自己的 JSON**
- 点击"📂 加载JSON文件"按钮
- 选择你的 JSON 文件
- 从下拉菜单选择要编辑的 Schema

### 3. 编辑表单

- 填写表单字段
- 实时在右侧预览面板查看数据
- 对于 i18n 字段，点击标签页切换语言

### 4. 数据操作

#### 导出数据
```
快捷键: Ctrl+S
按钮: 💾 导出
```
导出当前表单数据为 JSON 文件

#### 导入数据
```
快捷键: Ctrl+Shift+I
```
导入之前导出的 JSON 数据并自动填充表单

#### 重置表单
```
快捷键: Ctrl+R
按钮: 🔄 重置
```
清空表单所有字段

#### 复制数据
```
按钮: 复制
```
复制预览面板中的 JSON 数据到剪贴板

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+S` | 导出表单数据 |
| `Ctrl+R` | 重置表单 |
| `Ctrl+Shift+I` | 导入表单数据 |

## JSON Schema 示例

### 基础示例

```json
{
  "my_schema": {
    "title": "我的表单",
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "description": "名称"
      },
      "industry": {
        "type": "string",
        "description": "行业",
        "x-widget": "select",
        "enum": ["gaming", "animation", "other"]
      },
      "tags": {
        "type": "array",
        "items": {
          "type": "string",
          "enum": ["tag1", "tag2", "tag3"]
        },
        "description": "标签",
        "x-widget": "multi-select"
      }
    },
    "required": ["name", "industry"]
  }
}
```

### 多语言示例

```json
{
  "i18n_schema": {
    "title": "多语言表单",
    "type": "object",
    "properties": {
      "title": {
        "type": "object",
        "description": "标题（多语言）",
        "x-widget": "i18n-upload",
        "properties": {
          "EN": { "type": "string" },
          "ZH": { "type": "string" }
        }
      }
    }
  }
}
```

### 数组项目示例

```json
{
  "items_schema": {
    "title": "项目列表",
    "type": "object",
    "properties": {
      "items": {
        "type": "array",
        "description": "项目",
        "x-widget": "drag-sort-list",
        "items": {
          "type": "object",
          "properties": {
            "title": {
              "type": "string",
              "description": "项目标题"
            },
            "icon": {
              "type": "string",
              "format": "uri",
              "description": "图标",
              "x-widget": "image-upload"
            }
          }
        }
      }
    }
  }
}
```

## 文件结构

```
test_conf/
├── index.html              # HTML 主文件
├── styles.css              # CSS 样式
├── schema-loader.js        # Schema 加载器
├── form-renderer.js        # 表单渲染引擎
├── app.js                  # 应用主程序
├── demo.json               # Demo JSON Schema
└── README.md               # 本文档
```

## API 文档

### SchemaLoader 类

```javascript
// 从文件加载 Schema
await schemaLoader.loadFromFile(file);

// 获取所有 Schema 名称
const names = schemaLoader.getAllSchemaNames();

// 获取指定 Schema
const schema = schemaLoader.getSchema('schema_name');

// 设置当前 Schema
schemaLoader.setCurrentSchema('schema_name');
```

### FormRenderer 类

```javascript
// 创建渲染器
const renderer = new FormRenderer(schema, container, onDataChange);

// 渲染表单
renderer.render();

// 获取表单数据
const data = renderer.getFormData();
```

### 全局函数

```javascript
// 导出表单数据
exportFormData();

// 导入表单数据
importFormData(file);

// 重置表单
resetForm();

// 显示提示信息
showAlert(message, type); // type: 'success', 'error', 'info'
```

## 浏览器兼容性

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 高级用法

### 自定义验证

在 `form-renderer.js` 中的 `createBasicInput` 方法添加验证逻辑：

```javascript
input.addEventListener('blur', () => {
    if (!input.value.trim()) {
        input.classList.add('invalid');
        // 显示错误信息
    } else {
        input.classList.remove('invalid');
    }
});
```

### 扩展自定义 Widget

在 `FormRenderer.renderProperty` 中添加新的 widget 类型：

```javascript
case 'custom-widget':
    this.renderCustomWidget(key, property, isRequired);
    break;
```

然后实现 `renderCustomWidget` 方法。

### 集成后端 API

在 `app.js` 中修改 `submitBtn` 事件处理：

```javascript
submitBtn.addEventListener('click', async () => {
    const formData = formRenderer.getFormData();
    try {
        const response = await fetch('/api/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        if (response.ok) {
            showAlert('✓ 数据已提交', 'success');
        }
    } catch (error) {
        showAlert(`✗ 提交失败: ${error.message}`, 'error');
    }
});
```

## 故障排除

### 问题：表单不显示
- 检查 JSON Schema 格式是否正确
- 在浏览器控制台查看错误信息
- 确保 `properties` 字段存在

### 问题：图片上传失败
- 检查浏览器是否允许文件访问
- 确认图片格式为 JPEG、PNG 等
- 在本地服务器上运行应用

### 问题：i18n 字段不工作
- 确保使用了 `i18n-upload` 或 `i18n-richtext` widget
- 检查语言代码是否正确 (EN, ZH 等)
- 验证 Schema 中的 `properties` 包含语言字段

## 性能优化建议

1. **大型表单**：使用 collapsible 将相关字段分组
2. **图片上传**：压缩上传前的图片
3. **数据预览**：对大型数据对象使用虚拟滚动

## 安全性注意事项

- 不要在生产环境直接上传用户提供的 JSON
- 对所有用户输入进行验证和转义
- 使用 Content Security Policy (CSP) 保护应用

## 许可证

MIT

## 支持

如有问题，请查看：
- 浏览器控制台 (F12)
- 预览面板中的数据结构
- 源代码中的注释

---

**最后更新**: 2024

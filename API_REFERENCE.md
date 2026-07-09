# API 参考文档

## 目录
- [SchemaLoader](#schemaloader)
- [FormRenderer](#formrenderer)
- [FormValidator](#formvalidator)
- [工具函数](#工具函数)
- [事件处理](#事件处理)
- [数据结构](#数据结构)

---

## SchemaLoader

Schema 加载器类，用于管理 JSON Schema 的加载和存储。

### 构造函数

```javascript
const loader = new SchemaLoader();
```

### 方法

#### loadFromFile(file)

从文件加载 Schema。

```javascript
// 参数
file: File              // HTML5 File 对象

// 返回值
Promise<Object>         // 解析后的 Schema 对象

// 示例
document.getElementById('fileInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  try {
    const schemas = await loader.loadFromFile(file);
    console.log('加载成功:', schemas);
  } catch (error) {
    console.error('加载失败:', error.message);
  }
});
```

#### getSchema(name)

获取指定名称的 Schema。

```javascript
// 参数
name: string           // Schema 的键名

// 返回值
Object|null            // Schema 对象或 null

// 示例
const schema = loader.getSchema('onboarding_q1');
if (schema) {
  console.log('Schema 标题:', schema.title);
}
```

#### getAllSchemaNames()

获取所有 Schema 的名称列表。

```javascript
// 返回值
Array<string>          // Schema 名称数组

// 示例
const names = loader.getAllSchemaNames();
names.forEach(name => {
  console.log(name); // 'onboarding_q1', 'onboarding_q2', ...
});
```

#### setCurrentSchema(name)

设置当前活跃的 Schema。

```javascript
// 参数
name: string           // 要设置的 Schema 名称

// 示例
loader.setCurrentSchema('onboarding_q1');
```

#### getCurrentSchema()

获取当前设置的 Schema。

```javascript
// 返回值
Object|null            // 当前 Schema 对象或 null

// 示例
const current = loader.getCurrentSchema();
console.log('当前 Schema:', current.title);
```

#### getCurrentSchemaName()

获取当前 Schema 的名称。

```javascript
// 返回值
string|null            // 当前 Schema 名称或 null

// 示例
const name = loader.getCurrentSchemaName();
console.log('当前 Schema 名称:', name);
```

#### updateSchemaSelector()

更新下拉菜单中的 Schema 选项。

```javascript
// 示例
loader.updateSchemaSelector();
// 自动填充 id="schemaSelector" 的 select 元素
```

---

## FormRenderer

表单渲染引擎，负责根据 Schema 动态生成表单。

### 构造函数

```javascript
const renderer = new FormRenderer(schema, container, onDataChange);

// 参数
schema: Object         // JSON Schema 对象
container: HTMLElement // 表单容器
onDataChange: Function // 数据变化时的回调函数
```

### 示例

```javascript
const schema = {
  title: '我的表单',
  type: 'object',
  properties: {
    name: { type: 'string', description: '名称' },
    email: { type: 'string', format: 'uri', description: '邮箱' }
  },
  required: ['name']
};

const container = document.getElementById('formContainer');

const renderer = new FormRenderer(schema, container, (data) => {
  console.log('表单数据更新:', data);
});

renderer.render();
```

### 方法

#### render()

渲染表单到容器中。

```javascript
// 示例
renderer.render();
// 容器中将显示根据 schema 生成的表单
```

#### getFormData()

获取当前表单的所有数据。

```javascript
// 返回值
Object                 // 包含所有表单字段的数据对象

// 示例
const data = renderer.getFormData();
console.log('表单数据:', data);
// 输出: { name: 'John', email: 'john@example.com' }
```

#### initializeFormData()

初始化表单数据为默认值。

```javascript
// 返回值
Object                 // 初始化后的数据对象

// 示例
const initial = renderer.initializeFormData();
// 返回所有字段的初始值（空字符串、空数组等）
```

### 内部方法（高级使用）

#### renderProperty(key, property, isRequired)

渲染单个属性。

```javascript
// 参数
key: string            // 属性名
property: Object       // 属性 Schema
isRequired: boolean    // 是否必填

// 示例
renderer.renderProperty('age', {
  type: 'number',
  description: '年龄'
}, false);
```

#### createFormGroup(key, property, isRequired)

创建表单组（包含标签和输入框）。

```javascript
// 返回值
HTMLElement           // 表单组 DOM 元素

// 示例
const group = renderer.createFormGroup('username', property, true);
container.appendChild(group);
```

---

## FormValidator

表单验证器，用于验证表单数据的有效性。

### 构造函数

```javascript
const validator = new FormValidator(schema);

// 参数
schema: Object         // JSON Schema 对象
```

### 示例

```javascript
const schema = {
  type: 'object',
  properties: {
    username: {
      type: 'string',
      minLength: 3,
      maxLength: 20,
      description: '用户名'
    },
    age: {
      type: 'number',
      minimum: 18,
      maximum: 100,
      description: '年龄'
    }
  },
  required: ['username', 'age']
};

const validator = new FormValidator(schema);
```

### 方法

#### validate(data)

验证数据是否符合 Schema。

```javascript
// 参数
data: Object           // 要验证的数据

// 返回值
Array<Object>          // 错误数组，每项包含 field 和 message

// 示例
const errors = validator.validate({
  username: 'ab',      // 太短
  age: 15              // 太小
});

// 输出:
// [
//   { field: 'username', message: '用户名 最少需要 3 个字符' },
//   { field: 'age', message: '年龄 必须大于等于 18' }
// ]
```

#### hasErrors()

检查是否有验证错误。

```javascript
// 返回值
boolean                // 是否有错误

// 示例
if (validator.hasErrors()) {
  console.log('表单有错误');
} else {
  console.log('表单有效');
}
```

#### getErrorCount()

获取错误的总数。

```javascript
// 返回值
number                 // 错误数量

// 示例
const count = validator.getErrorCount();
console.log(`有 ${count} 个错误`);
```

#### getErrorMessage()

获取格式化的错误信息。

```javascript
// 返回值
string                 // 以换行符分隔的错误信息

// 示例
const message = validator.getErrorMessage();
console.log(message);
// 输出:
// • [username] 用户名 最少需要 3 个字符
// • [age] 年龄 必须大于等于 18
```

#### getErrorsByField(field)

获取指定字段的所有错误。

```javascript
// 参数
field: string          // 字段名

// 返回值
Array<Object>          // 该字段的错误数组

// 示例
const usernameErrors = validator.getErrorsByField('username');
usernameErrors.forEach(err => {
  console.log(err.message);
});
```

### 验证规则

支持以下 Schema 属性进行验证：

| 属性 | 类型 | 说明 |
|-----|------|------|
| `required` | Array | 必填字段列表 |
| `minLength` | number | 字符串最小长度 |
| `maxLength` | number | 字符串最大长度 |
| `minimum` | number | 数字最小值 |
| `maximum` | number | 数字最大值 |
| `minItems` | number | 数组最少项目数 |
| `maxItems` | number | 数组最多项目数 |
| `uniqueItems` | boolean | 数组项目是否唯一 |
| `enum` | Array | 允许的值列表 |
| `format` | string | 格式验证（仅支持 'uri'） |

---

## 工具函数

### showAlert(message, type)

显示通知消息。

```javascript
// 参数
message: string        // 消息内容
type: string          // 消息类型：'success', 'error', 'info'

// 示例
showAlert('✓ 操作成功', 'success');
showAlert('✗ 出现错误', 'error');
showAlert('ℹ 提示信息', 'info');
```

### showLoading(show)

显示或隐藏加载动画。

```javascript
// 参数
show: boolean         // 是否显示加载动画

// 示例
showLoading(true);    // 显示加载动画
// ... 执行异步操作 ...
showLoading(false);   // 隐藏加载动画
```

### showModal(title, message, callback)

显示模态对话框。

```javascript
// 参数
title: string         // 对话框标题
message: string       // 对话框内容
callback: Function    // 用户点击确定时的回调（参数：true/false）

// 示例
showModal('确认删除', '确定要删除该项目吗？', (confirmed) => {
  if (confirmed) {
    console.log('用户确认了删除操作');
  } else {
    console.log('用户取消了操作');
  }
});
```

### hideModal()

隐藏模态对话框。

```javascript
// 示例
hideModal();
```

### exportFormData()

导出表单数据为 JSON 文件。

```javascript
// 示例
exportFormData();
// 自动下载文件：schema-name-YYYY-MM-DD.json
```

### importFormData(file)

导入 JSON 文件中的数据到表单。

```javascript
// 参数
file: File            // HTML5 File 对象

// 示例
const fileInput = document.getElementById('fileInput');
fileInput.addEventListener('change', (e) => {
  importFormData(e.target.files[0]);
});
```

### resetForm()

重置表单为初始状态。

```javascript
// 示例
resetForm();
// 所有字段恢复为空或默认值
```

### validateForm()

验证当前表单的所有数据。

```javascript
// 返回值
boolean               // 表单是否有效

// 示例
if (validateForm()) {
  console.log('表单验证通过');
  // 提交表单
} else {
  console.log('表单有验证错误');
  // 显示错误信息
}
```

---

## 事件处理

### 表单数据变化事件

当表单数据发生变化时触发回调。

```javascript
const renderer = new FormRenderer(schema, container, (data) => {
  console.log('表单数据已变化:', data);
  
  // 更新预览
  updatePreview(data);
  
  // 实时验证
  validateForm();
  
  // 自动保存
  autoSave(data);
});
```

### 按键事件

全局键盘快捷键。

```javascript
// Ctrl+S: 导出
// Ctrl+R: 重置（需要确认）
// Ctrl+Shift+I: 导入
// Ctrl+Shift+V: 验证（增强版）

// 示例：自定义快捷键处理
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'e') {
    e.preventDefault();
    // 执行自定义操作
    console.log('自定义快捷键被触发');
  }
});
```

### 文件上传事件

处理图片上传。

```javascript
// 点击上传
imageInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      // 数据格式：Base64 URL
      formData.icon = event.target.result;
    };
    reader.readAsDataURL(file);
  }
});

// 拖拽上传
uploadContainer.addEventListener('drop', (e) => {
  e.preventDefault();
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    // 处理拖入的文件
  }
});
```

### 拖拽排序事件

处理数组项目的拖拽排序。

```javascript
// 拖拽开始
container.addEventListener('dragstart', (e) => {
  draggedItem = e.target;
  e.dataTransfer.effectAllowed = 'move';
});

// 拖拽覆盖
container.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
});

// 拖拽结束（重新排序）
container.addEventListener('dragend', (e) => {
  // 更新数据顺序
  updateFormData();
});
```

---

## 数据结构

### Schema 对象结构

```javascript
{
  // Schema 标识符和元数据
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "表单标题",
  "description": "表单描述（可选）",
  "type": "object",
  
  // 字段定义
  "properties": {
    "fieldName": {
      "type": "string",                    // 字段类型
      "description": "字段说明",            // 字段标签
      "x-widget": "text",                  // Widget 类型
      "format": "uri",                     // 格式（可选）
      "enum": ["option1", "option2"],     // 枚举值（可选）
      "minLength": 1,                      // 最小长度（可选）
      "maxLength": 100,                    // 最大长度（可选）
      "minimum": 0,                        // 最小值（可选）
      "maximum": 100,                      // 最大值（可选）
      "pattern": "^[a-zA-Z]+$",           // 正则验证（可选）
      "default": "defaultValue"            // 默认值（可选）
    }
  },
  
  // 必填字段
  "required": ["fieldName"],
  
  // 子类型定义
  "$defs": {
    "typeName": {
      "type": "object",
      "properties": { /* ... */ }
    }
  },
  
  // 额外配置
  "additionalProperties": false,           // 不允许额外属性
}
```

### 表单数据结构

```javascript
{
  // 基本类型
  "stringField": "value",
  "numberField": 42,
  "booleanField": true,
  
  // 对象类型（多语言）
  "i18nField": {
    "EN": "English text",
    "ZH": "中文文本",
    "ES": "Texto en español"
  },
  
  // 数组类型
  "arrayField": [
    { "name": "item1", "value": 1 },
    { "name": "item2", "value": 2 }
  ],
  
  // 多选字段
  "multiSelectField": ["option1", "option2"],
  
  // 图片字段（Base64 URL）
  "imageField": "data:image/png;base64,iVBORw0KGgoAAAANS..."
}
```

### 验证错误结构

```javascript
[
  {
    "field": "fieldName",          // 出现错误的字段名
    "message": "错误消息"           // 错误的详细说明
  },
  {
    "field": "anotherField",
    "message": "另一个错误"
  }
]
```

---

## 使用模式

### 模式 1：基础表单

```javascript
// 1. 创建 Schema
const schema = { /* ... */ };

// 2. 创建渲染器
const renderer = new FormRenderer(schema, container, (data) => {
  console.log('数据更新:', data);
});

// 3. 渲染表单
renderer.render();

// 4. 获取数据
const data = renderer.getFormData();
```

### 模式 2：带验证的表单

```javascript
// 1. 创建验证器
const validator = new FormValidator(schema);

// 2. 创建渲染器
const renderer = new FormRenderer(schema, container, (data) => {
  // 实时验证
  const errors = validator.validate(data);
  if (errors.length > 0) {
    showErrors(errors);
  }
});

// 3. 渲染表单
renderer.render();

// 4. 提交前验证
function handleSubmit() {
  const data = renderer.getFormData();
  const errors = validator.validate(data);
  
  if (errors.length === 0) {
    // 提交数据
    submitToServer(data);
  } else {
    // 显示错误
    showErrors(errors);
  }
}
```

### 模式 3：导入/导出工作流

```javascript
// 1. 导出数据
function exportData() {
  const data = renderer.getFormData();
  const json = JSON.stringify(data, null, 2);
  // 保存到文件
  downloadJSON(json);
}

// 2. 导入数据
function importData(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const data = JSON.parse(e.target.result);
    
    // 验证导入的数据
    const errors = validator.validate(data);
    if (errors.length === 0) {
      // 填充表单
      fillFormData(data);
    }
  };
  reader.readAsText(file);
}
```

---

## 常见用法示例

### 示例 1：完整表单处理

```javascript
// 初始化
const schema = schemas.myForm;
const container = document.getElementById('formContainer');
const renderer = new FormRenderer(schema, container, updatePreview);
const validator = new FormValidator(schema);

renderer.render();

// 提交处理
document.getElementById('submitBtn').addEventListener('click', () => {
  const data = renderer.getFormData();
  const errors = validator.validate(data);
  
  if (errors.length === 0) {
    console.log('✓ 表单有效，已提交');
    fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } else {
    console.log('✗ 表单无效，错误数:', errors.length);
    errors.forEach(e => console.log(`[${e.field}] ${e.message}`));
  }
});
```

### 示例 2：条件字段渲染

```javascript
function renderConditionalField(formData) {
  const container = document.getElementById('conditionalFields');
  
  if (formData.accountType === 'business') {
    // 显示商业账户字段
    renderBusinessFields(container);
  } else {
    // 显示个人账户字段
    renderPersonalFields(container);
  }
}
```

### 示例 3：自动保存

```javascript
// 每 5 秒自动保存一次
setInterval(() => {
  const data = renderer.getFormData();
  localStorage.setItem('formDraft', JSON.stringify(data));
  console.log('✓ 表单已自动保存');
}, 5000);

// 页面加载时恢复数据
window.addEventListener('load', () => {
  const saved = localStorage.getItem('formDraft');
  if (saved) {
    const data = JSON.parse(saved);
    // 填充表单
    fillFormData(data);
  }
});
```

---

## 性能优化建议

### 优化 1：延迟加载

```javascript
// 只加载可见的字段
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      renderField(entry.target);
    }
  });
});

document.querySelectorAll('.lazy-field').forEach(field => {
  observer.observe(field);
});
```

### 优化 2：防抖数据更新

```javascript
const debounce = (fn, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
};

const debouncedUpdate = debounce((data) => {
  console.log('更新数据:', data);
}, 500);

const renderer = new FormRenderer(schema, container, debouncedUpdate);
```

### 优化 3：虚拟滚动

```javascript
// 对于大型列表使用虚拟滚动
const list = new VirtualList(container, {
  itemHeight: 50,
  items: largeArray,
  renderItem: (item, index) => {
    // 只渲染可见项
  }
});
```

---

**API 参考文档版本**: 2.0
**最后更新**: 2024-07

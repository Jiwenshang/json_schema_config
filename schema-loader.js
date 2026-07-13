class SchemaLoader {
    constructor() {
        this.schemas = {};
        this.currentSchemaName = null;
    }

    loadFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    this.schemas = this.normalize(data);
                    this.updateSchemaSelector();
                    resolve(this.schemas);
                } catch (error) {
                    reject(new Error(`JSON解析失败: ${error.message}`));
                }
            };
            reader.onerror = () => {
                reject(new Error('文件读取失败'));
            };
            reader.readAsText(file);
        });
    }

    getSchema(name) {
        return this.schemas[name] || null;
    }

    // 把不同来源的 JSON 统一成 { schema名: schema对象 } 映射：
    // 1) mc.json 形如 { config_schemas: {...} } —— 拆掉外层 config_schemas
    // 2) 单个 schema 文件（顶层带 $schema/type/properties）—— 包成单条映射
    // 3) 已经是映射表 —— 原样返回
    normalize(data) {
        if (data && typeof data === 'object' && data.config_schemas
            && typeof data.config_schemas === 'object') {
            return data.config_schemas;
        }
        if (data && typeof data === 'object'
            && (data.$schema || data.type === 'object' || data.properties)) {
            const key = data.$id || data.title || 'schema';
            return { [key]: data };
        }
        return data;
    }

    getAllSchemaNames() {
        return Object.keys(this.schemas);
    }

    updateSchemaSelector() {
        const selector = document.getElementById('schemaSelector');
        selector.innerHTML = '<option value="">选择一个Schema...</option>';

        Object.keys(this.schemas).forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = this.schemas[name].title || name;
            selector.appendChild(option);
        });
    }

    setCurrentSchema(name) {
        this.currentSchemaName = name;
    }

    getCurrentSchema() {
        return this.currentSchemaName ? this.getSchema(this.currentSchemaName) : null;
    }

    getCurrentSchemaName() {
        return this.currentSchemaName;
    }
}

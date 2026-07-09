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
                    this.schemas = data;
                    this.updateSchemaSelector();
                    resolve(data);
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

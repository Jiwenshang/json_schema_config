class FormRenderer {
    constructor(schema, container, onDataChange) {
        this.schema = schema;
        this.container = container;
        this.onDataChange = onDataChange;
        this.formData = {};
        this.fieldElements = {};
        this.dragState = {};
        // 图片直传器：async (file, fieldPath) => S3 key。
        // 由宿主在绑定中台配置（已知 data_id/key）时注入；未注入时回退 base64（纯本地模式）。
        this.imageUploader = null;
        // 编辑模式的初始数据（已有 entry 的 payload）：render 时合入 formData 并回填各控件
        this.initialData = null;
    }

    setImageUploader(fn) {
        this.imageUploader = fn;
    }

    setInitialData(data) {
        this.initialData = data ? JSON.parse(JSON.stringify(data)) : null;
    }

    // 图片统一入口：直传模式返回 {value: S3 key, previewUrl: 本地 blob}，
    // 本地模式返回 {value: base64, previewUrl: base64}。失败抛错由调用方提示。
    async pickImage(file, fieldPath) {
        if (this.imageUploader) {
            const key = await this.imageUploader(file, fieldPath);
            return { value: key, previewUrl: URL.createObjectURL(file) };
        }
        const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (ev) => resolve(ev.target.result);
            reader.onerror = () => reject(new Error('读取文件失败'));
            reader.readAsDataURL(file);
        });
        return { value: dataUrl, previewUrl: dataUrl };
    }

    // 已存值的预览地址：S3 key 拼 CDN 域名，base64/URL 原样返回
    static previewUrlFor(value) {
        if (typeof value !== 'string' || !value) return '';
        if (/^(data:|https?:\/\/)/.test(value)) return value;
        const cdn = (window.MC_CDN_BASE || 'https://vast-plugin-data.rg1.data.tripo3d.com').replace(/\/+$/, '');
        return `${cdn}/${value}`;
    }

    render() {
        this.container.innerHTML = '';
        this.formData = this.initializeFormData();
        if (this.initialData) {
            const init = JSON.parse(JSON.stringify(this.initialData));
            Object.keys(init).forEach(k => { this.formData[k] = init[k]; });
        }
        this.fieldElements = {};

        const title = document.createElement('h2');
        title.className = 'section-title';
        title.textContent = this.schema.title || 'Form';
        this.container.appendChild(title);

        if (this.schema.description) {
            const desc = document.createElement('p');
            desc.style.color = '#666';
            desc.style.marginBottom = '20px';
            desc.textContent = this.schema.description;
            this.container.appendChild(desc);
        }

        // 胖 schema：若声明了 x-sections，按分区布局渲染
        if (Array.isArray(this.schema['x-sections'])) {
            this.renderSections(this.schema['x-sections']);
        } else {
            const propertiesKeys = Object.keys(this.schema.properties || {});
            const required = this.schema.required || [];
            propertiesKeys.forEach(key => {
                const property = this.schema.properties[key];
                const isRequired = required.includes(key);
                this.renderProperty(key, property, isRequired);
            });
        }

        this.updateDataPreview();
    }

    initializeFormData() {
        const data = {};
        const properties = this.schema.properties || {};

        Object.keys(properties).forEach(key => {
            const prop = properties[key];

            if (prop.type === 'array') {
                data[key] = [];
            } else if (prop.type === 'object') {
                data[key] = {};
            } else if (prop.type === 'string') {
                data[key] = '';
            } else if (prop.type === 'number') {
                data[key] = 0;
            } else if (prop.type === 'boolean') {
                data[key] = false;
            }
        });

        return data;
    }

    renderProperty(key, property, isRequired) {
        const widget = property['x-widget'] || this.getDefaultWidget(property);

        switch (widget) {
            case 'i18n-upload':
                this.renderI18nField(key, property, isRequired);
                break;
            case 'image-upload':
                this.renderImageUpload(key, property, isRequired);
                break;
            case 'select':
                this.renderSelect(key, property, isRequired);
                break;
            case 'multi-select':
                this.renderMultiSelect(key, property, isRequired);
                break;
            case 'drag-sort-list':
                this.renderDragSortList(key, property, isRequired);
                break;
            case 'i18n-richtext':
                this.renderI18nRichText(key, property, isRequired);
                break;
            default:
                this.renderBasicField(key, property, isRequired);
        }
    }

    getDefaultWidget(property) {
        if (property.$ref) return 'i18n-upload';
        if (property.type === 'array') return 'array';
        if (property.type === 'object') return 'object';
        if (property.enum) return 'select';
        if (property.type === 'string') return 'text';
        if (property.type === 'number') return 'number';
        if (property.type === 'boolean') return 'checkbox';
        return 'text';
    }

    renderBasicField(key, property, isRequired) {
        const group = this.createFormGroup(key, property, isRequired);
        const input = this.createBasicInput(key, property);
        group.appendChild(input);
        this.container.appendChild(group);
        this.fieldElements[key] = input;
    }

    createFormGroup(key, property, isRequired) {
        const group = document.createElement('div');
        group.className = 'form-group';

        const label = document.createElement('label');
        label.className = 'form-label';
        label.htmlFor = key;

        const labelText = document.createElement('span');
        labelText.textContent = property.title || property.description || key;
        label.appendChild(labelText);

        if (isRequired) {
            const required = document.createElement('span');
            required.className = 'required';
            required.textContent = '*';
            label.appendChild(required);
        }

        group.appendChild(label);
        return group;
    }

    // 用户可见的帮助文案（schema description，非内部注释 $comment），显示在控件下方
    hintFor(property) {
        if (!property.title || !property.description) return null;
        const p = document.createElement('p');
        p.className = 'field-hint';
        p.textContent = property.description;
        return p;
    }

    createBasicInput(key, property) {
        let input;

        if (property.type === 'string') {
            if (property.format === 'uri') {
                input = document.createElement('input');
                input.type = 'url';
            } else if (property.format === 'date-time') {
                input = document.createElement('input');
                input.type = 'datetime-local';
                input.step = 1;
            } else if (property.minLength && property.minLength > 50) {
                input = document.createElement('textarea');
            } else {
                input = document.createElement('input');
                input.type = 'text';
            }
        } else if (property.type === 'number' || property.type === 'integer') {
            input = document.createElement('input');
            input.type = 'number';
        } else if (property.type === 'boolean') {
            input = document.createElement('input');
            input.type = 'checkbox';
            input.style.width = 'auto';
        } else {
            input = document.createElement('input');
            input.type = 'text';
        }

        input.className = 'form-control';
        input.id = key;
        input.name = key;

        const existing = this.formData[key];
        if (property.type === 'boolean') {
            input.checked = existing === true;
        } else if (existing != null && existing !== '' && !(typeof existing === 'number' && existing === 0)) {
            input.value = existing;
        }

        input.addEventListener('input', () => {
            if (property.type === 'boolean') {
                this.formData[key] = input.checked;
            } else if (property.type === 'number' || property.type === 'integer') {
                this.formData[key] = parseFloat(input.value);
            } else {
                this.formData[key] = input.value;
            }
            this.updateDataPreview();
        });

        return input;
    }

    renderSelect(key, property, isRequired) {
        const group = this.createFormGroup(key, property, isRequired);

        const select = document.createElement('select');
        select.className = 'form-control';
        select.id = key;
        select.name = key;

        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = '请选择...';
        select.appendChild(placeholder);

        if (property.enum) {
            property.enum.forEach(value => {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = value;
                select.appendChild(option);
            });
        }

        if (this.formData[key] != null && this.formData[key] !== '') {
            select.value = String(this.formData[key]);
        }

        select.addEventListener('change', () => {
            this.formData[key] = select.value;
            this.updateDataPreview();
        });

        group.appendChild(select);
        this.container.appendChild(group);
        this.fieldElements[key] = select;
    }

    renderMultiSelect(key, property, isRequired) {
        const group = this.createFormGroup(key, property, isRequired);

        const container = document.createElement('div');
        container.className = 'multi-select-container';
        container.id = `${key}-container`;

        const input = document.createElement('input');
        input.type = 'hidden';
        input.id = key;
        input.name = key;

        const checkboxGroup = document.createElement('div');
        checkboxGroup.className = 'checkbox-group';
        checkboxGroup.style.display = 'flex';
        checkboxGroup.style.flexWrap = 'wrap';
        checkboxGroup.style.gap = '8px';
        checkboxGroup.style.width = '100%';
        checkboxGroup.style.marginTop = '8px';

        const items = property.items?.enum || property.enum || [];
        const enumLabels = property['x-enum-labels'] || {};
        if (!Array.isArray(this.formData[key])) this.formData[key] = [];
        const preSelected = this.formData[key];

        items.forEach(value => {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = value;
            checkbox.id = `${key}-${value}`;
            checkbox.checked = preSelected.includes(value);

            const label = document.createElement('label');
            label.htmlFor = `${key}-${value}`;
            label.textContent = enumLabels[value] || value;
            label.style.cursor = 'pointer';

            const wrapper = document.createElement('div');
            wrapper.style.display = 'flex';
            wrapper.style.alignItems = 'center';
            wrapper.style.gap = '4px';
            wrapper.appendChild(checkbox);
            wrapper.appendChild(label);

            checkbox.addEventListener('change', () => {
                const selected = Array.from(checkboxGroup.querySelectorAll('input:checked'))
                    .map(cb => cb.value);
                this.formData[key] = selected;
                this.updateDataPreview();
            });

            checkboxGroup.appendChild(wrapper);
        });

        group.appendChild(checkboxGroup);
        this.container.appendChild(group);
        this.fieldElements[key] = input;
    }

    renderI18nField(key, property, isRequired) {
        const group = this.createFormGroup(key, property, isRequired);

        const i18nContainer = document.createElement('div');
        i18nContainer.className = 'i18n-container';

        const languages = ['EN', 'ZH', 'ES', 'KO', 'RU', 'PT', 'JA', 'DE', 'IT', 'TR', 'FR'];
        const tabs = document.createElement('div');
        tabs.className = 'i18n-tabs';

        const contents = document.createElement('div');
        contents.className = 'i18n-contents';

        if (!this.formData[key] || typeof this.formData[key] !== 'object') this.formData[key] = {};

        languages.forEach((lang, index) => {
            const tab = document.createElement('button');
            tab.className = 'i18n-tab' + (index === 0 ? ' active' : '');
            tab.textContent = lang;
            tab.type = 'button';

            const content = document.createElement('div');
            content.className = 'i18n-content';
            content.style.display = index === 0 ? 'block' : 'none';

            const textarea = document.createElement('textarea');
            textarea.className = 'form-control';
            textarea.placeholder = `输入 ${lang} 文本...`;
            textarea.rows = 3;
            if (this.formData[key][lang]) textarea.value = this.formData[key][lang];

            textarea.addEventListener('input', () => {
                this.formData[key][lang] = textarea.value;
                this.updateDataPreview();
            });

            content.appendChild(textarea);
            contents.appendChild(content);

            tab.addEventListener('click', (e) => {
                e.preventDefault();
                tabs.querySelectorAll('.i18n-tab').forEach(t => t.classList.remove('active'));
                contents.querySelectorAll('.i18n-content').forEach(c => c.style.display = 'none');
                tab.classList.add('active');
                content.style.display = 'block';
            });

            tabs.appendChild(tab);
        });

        i18nContainer.appendChild(tabs);
        i18nContainer.appendChild(contents);
        group.appendChild(i18nContainer);
        this.container.appendChild(group);
        this.fieldElements[key] = i18nContainer;
    }

    renderI18nRichText(key, property, isRequired) {
        const group = this.createFormGroup(key, property, isRequired);

        const i18nContainer = document.createElement('div');
        i18nContainer.className = 'i18n-container';

        const languages = ['EN', 'ZH', 'ES', 'KO', 'RU', 'PT', 'JA', 'DE', 'IT', 'TR', 'FR'];
        const tabs = document.createElement('div');
        tabs.className = 'i18n-tabs';

        const contents = document.createElement('div');
        contents.className = 'i18n-contents';

        if (!this.formData[key] || typeof this.formData[key] !== 'object') this.formData[key] = {};

        languages.forEach((lang, index) => {
            const tab = document.createElement('button');
            tab.className = 'i18n-tab' + (index === 0 ? ' active' : '');
            tab.textContent = lang;
            tab.type = 'button';

            const content = document.createElement('div');
            content.className = 'i18n-content';
            content.style.display = index === 0 ? 'block' : 'none';

            const textarea = document.createElement('textarea');
            textarea.className = 'form-control';
            textarea.placeholder = `支持Markdown和富文本 (${lang})`;
            textarea.rows = 4;
            if (this.formData[key][lang]) textarea.value = this.formData[key][lang];

            textarea.addEventListener('input', () => {
                this.formData[key][lang] = textarea.value;
                this.updateDataPreview();
            });

            content.appendChild(textarea);
            contents.appendChild(content);

            tab.addEventListener('click', (e) => {
                e.preventDefault();
                tabs.querySelectorAll('.i18n-tab').forEach(t => t.classList.remove('active'));
                contents.querySelectorAll('.i18n-content').forEach(c => c.style.display = 'none');
                tab.classList.add('active');
                content.style.display = 'block';
            });

            tabs.appendChild(tab);
        });

        i18nContainer.appendChild(tabs);
        i18nContainer.appendChild(contents);
        group.appendChild(i18nContainer);
        this.container.appendChild(group);
        this.fieldElements[key] = i18nContainer;
    }

    renderImageUpload(key, property, isRequired) {
        const group = this.createFormGroup(key, property, isRequired);

        const uploadContainer = document.createElement('div');
        uploadContainer.className = 'image-upload-container';

        const input = document.createElement('input');
        input.type = 'file';
        input.className = 'image-upload-input';
        input.accept = Array.isArray(property['x-accept']) && property['x-accept'].length
            ? property['x-accept'].join(',')
            : 'image/*';
        input.id = `${key}-input`;

        const label = document.createElement('label');
        label.htmlFor = `${key}-input`;
        label.style.cursor = 'pointer';
        label.textContent = '点击上传图片或拖拽放入';

        const preview = document.createElement('img');
        preview.className = 'image-preview';
        preview.style.display = 'none';

        // 编辑模式：已有值（S3 key / URL / base64）直接出预览，重传即覆盖
        if (typeof this.formData[key] !== 'string') this.formData[key] = '';
        if (this.formData[key]) {
            preview.src = FormRenderer.previewUrlFor(this.formData[key]);
            preview.style.display = 'block';
            label.textContent = '重新上传图片';
        }

        uploadContainer.appendChild(input);
        uploadContainer.appendChild(label);
        uploadContainer.appendChild(preview);

        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const origText = label.textContent;
            label.textContent = '上传中…';
            input.disabled = true;
            try {
                const { value, previewUrl } = await this.pickImage(file, key);
                this.formData[key] = value;
                preview.src = previewUrl;
                preview.style.display = 'block';
                label.style.display = 'none';
                this.updateDataPreview();
            } catch (err) {
                label.textContent = origText;
                alert(`图片上传失败：${err.message}`);
            } finally {
                input.disabled = false;
            }
        });

        uploadContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadContainer.classList.add('dragover');
        });

        uploadContainer.addEventListener('dragleave', () => {
            uploadContainer.classList.remove('dragover');
        });

        uploadContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadContainer.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                input.files = files;
                const event = new Event('change', { bubbles: true });
                input.dispatchEvent(event);
            }
        });

        group.appendChild(uploadContainer);
        const hint = this.hintFor(property);
        if (hint) group.appendChild(hint);
        this.container.appendChild(group);
        this.fieldElements[key] = input;
    }

    renderDragSortList(key, property, isRequired) {
        const group = this.createFormGroup(key, property, isRequired);

        const listContainer = document.createElement('div');
        listContainer.id = `${key}-list`;
        listContainer.className = 'drag-sort-list';

        // 编辑模式：暂存已有项，清空后经 addArrayItem 逐项重建（数据 + 行 DOM 一起恢复）
        const existingItems = Array.isArray(this.formData[key]) ? this.formData[key] : [];
        this.formData[key] = [];

        const controlsDiv = document.createElement('div');
        controlsDiv.style.display = 'flex';
        controlsDiv.style.justifyContent = 'space-between';
        controlsDiv.style.alignItems = 'center';
        controlsDiv.style.marginBottom = '12px';

        const itemCountSpan = document.createElement('span');
        itemCountSpan.style.fontSize = '12px';
        itemCountSpan.style.color = '#666';
        itemCountSpan.textContent = '项目: 0';

        const addButton = document.createElement('button');
        addButton.type = 'button';
        addButton.className = 'btn btn-primary';
        addButton.textContent = '+ 添加项目';

        addButton.addEventListener('click', () => {
            this.addArrayItem(key, property, listContainer, itemCountSpan);
        });

        controlsDiv.appendChild(itemCountSpan);
        controlsDiv.appendChild(addButton);

        group.appendChild(controlsDiv);
        group.appendChild(listContainer);
        this.container.appendChild(group);
        this.fieldElements[key] = listContainer;

        existingItems.forEach(itemData => {
            this.addArrayItem(key, property, listContainer, itemCountSpan, itemData);
        });

        // 初始化拖拽
        this.initDragSort(listContainer, key, itemCountSpan);
    }

    addArrayItem(key, property, container, itemCountSpan, existingData) {
        const itemIndex = this.formData[key].length;
        const itemData = {};
        const itemSchema = property.items;

        const itemProperties = itemSchema.properties || {};
        Object.keys(itemProperties).forEach(propKey => {
            const propSchema = itemProperties[propKey];
            if (propSchema.type === 'array') {
                itemData[propKey] = [];
            } else if (propSchema.type === 'object') {
                itemData[propKey] = {};
            } else {
                itemData[propKey] = '';
            }
        });
        if (existingData && typeof existingData === 'object') {
            Object.assign(itemData, JSON.parse(JSON.stringify(existingData)));
        }

        this.formData[key].push(itemData);

        const item = document.createElement('div');
        item.className = 'drag-sort-item';
        item.draggable = true;
        item.dataset.index = itemIndex;

        const handle = document.createElement('span');
        handle.className = 'drag-handle';
        handle.textContent = '⋮⋮';

        const content = document.createElement('div');
        content.className = 'drag-sort-item-content';

        const itemForm = document.createElement('div');
        itemForm.style.display = 'grid';
        itemForm.style.gridTemplateColumns = 'repeat(auto-fit, minmax(200px, 1fr))';
        itemForm.style.gap = '12px';

        Object.keys(itemProperties).forEach(propKey => {
            const propSchema = itemProperties[propKey];

            const fieldGroup = document.createElement('div');
            fieldGroup.style.marginBottom = '0';

            const fieldLabel = document.createElement('label');
            fieldLabel.className = 'form-label';
            fieldLabel.style.marginBottom = '4px';
            fieldLabel.textContent = propSchema.title || propSchema.description || propKey;
            fieldGroup.appendChild(fieldLabel);

            let fieldInput;
            if (propSchema['x-widget'] === 'multi-select' || propSchema.type === 'array') {
                const multiSelect = document.createElement('div');
                multiSelect.className = 'checkbox-group';
                multiSelect.style.display = 'flex';
                multiSelect.style.flexWrap = 'wrap';
                multiSelect.style.gap = '8px';

                const items = propSchema.items?.enum || propSchema.enum || [];
                items.forEach(value => {
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.value = value;
                    checkbox.checked = Array.isArray(itemData[propKey]) && itemData[propKey].includes(value);

                    const cbLabel = document.createElement('label');
                    cbLabel.textContent = value;
                    cbLabel.style.cursor = 'pointer';
                    cbLabel.style.display = 'flex';
                    cbLabel.style.alignItems = 'center';
                    cbLabel.style.gap = '4px';

                    cbLabel.prepend(checkbox);

                    checkbox.addEventListener('change', () => {
                        const selected = Array.from(multiSelect.querySelectorAll('input:checked'))
                            .map(cb => cb.value);
                        this.formData[key][itemIndex][propKey] = selected;
                        this.updateDataPreview();
                    });

                    multiSelect.appendChild(cbLabel);
                });

                fieldInput = multiSelect;
            } else if (propSchema['x-widget'] === 'image-upload' || propSchema.format === 'uri') {
                fieldInput = document.createElement('input');
                fieldInput.type = 'url';
                fieldInput.className = 'form-control';
                fieldInput.placeholder = 'Enter URL...';
                if (itemData[propKey]) fieldInput.value = itemData[propKey];

                fieldInput.addEventListener('input', () => {
                    this.formData[key][itemIndex][propKey] = fieldInput.value;
                    this.updateDataPreview();
                });
            } else if (propSchema.enum) {
                fieldInput = document.createElement('select');
                fieldInput.className = 'form-control';

                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'Select...';
                fieldInput.appendChild(option);

                propSchema.enum.forEach(value => {
                    const opt = document.createElement('option');
                    opt.value = value;
                    opt.textContent = value;
                    fieldInput.appendChild(opt);
                });
                if (itemData[propKey]) fieldInput.value = itemData[propKey];

                fieldInput.addEventListener('change', () => {
                    this.formData[key][itemIndex][propKey] = fieldInput.value;
                    this.updateDataPreview();
                });
            } else if (propSchema.type === 'array' && propSchema.items?.type === 'string') {
                const urlList = document.createElement('div');
                urlList.style.display = 'flex';
                urlList.style.flexDirection = 'column';
                urlList.style.gap = '4px';

                const addUrlBtn = document.createElement('button');
                addUrlBtn.type = 'button';
                addUrlBtn.className = 'btn btn-small btn-primary';
                addUrlBtn.textContent = '+ 添加URL';
                addUrlBtn.style.alignSelf = 'flex-start';

                const urlContainer = document.createElement('div');
                this.formData[key][itemIndex][propKey] = [];

                addUrlBtn.addEventListener('click', () => {
                    const urlInput = document.createElement('input');
                    urlInput.type = 'url';
                    urlInput.className = 'form-control';
                    urlInput.placeholder = 'Enter URL...';
                    urlInput.style.marginBottom = '4px';

                    const removeBtn = document.createElement('button');
                    removeBtn.type = 'button';
                    removeBtn.className = 'btn btn-small btn-danger';
                    removeBtn.textContent = 'Remove';

                    const wrapper = document.createElement('div');
                    wrapper.style.display = 'flex';
                    wrapper.style.gap = '4px';
                    wrapper.appendChild(urlInput);
                    wrapper.appendChild(removeBtn);

                    urlInput.addEventListener('input', () => {
                        const urls = Array.from(urlContainer.querySelectorAll('input'))
                            .map(inp => inp.value)
                            .filter(v => v);
                        this.formData[key][itemIndex][propKey] = urls;
                        this.updateDataPreview();
                    });

                    removeBtn.addEventListener('click', () => {
                        wrapper.remove();
                        const urls = Array.from(urlContainer.querySelectorAll('input'))
                            .map(inp => inp.value)
                            .filter(v => v);
                        this.formData[key][itemIndex][propKey] = urls;
                        this.updateDataPreview();
                    });

                    urlContainer.appendChild(wrapper);
                });

                urlList.appendChild(addUrlBtn);
                urlList.appendChild(urlContainer);
                fieldInput = urlList;
            } else {
                fieldInput = document.createElement('input');
                fieldInput.type = 'text';
                fieldInput.className = 'form-control';
                if (itemData[propKey] != null && itemData[propKey] !== '') fieldInput.value = itemData[propKey];

                fieldInput.addEventListener('input', () => {
                    this.formData[key][itemIndex][propKey] = fieldInput.value;
                    this.updateDataPreview();
                });
            }

            fieldGroup.appendChild(fieldInput);
            itemForm.appendChild(fieldGroup);
        });

        content.appendChild(itemForm);
        item.appendChild(handle);
        item.appendChild(content);

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'btn btn-small btn-danger';
        removeBtn.textContent = '删除';
        removeBtn.addEventListener('click', () => {
            const index = parseInt(item.dataset.index);
            this.formData[key].splice(index, 1);
            item.remove();
            this.reindexArrayItems(container, key, itemCountSpan);
            this.updateDataPreview();
        });

        item.appendChild(removeBtn);
        container.appendChild(item);

        this.initDragSort(container, key, itemCountSpan);
        this.updateItemCount(container, itemCountSpan);
        this.updateDataPreview();
    }

    updateItemCount(container, itemCountSpan) {
        if (itemCountSpan) {
            const count = container.querySelectorAll('.drag-sort-item').length;
            itemCountSpan.textContent = `项目: ${count}`;
        }
    }

    reindexArrayItems(container, key, itemCountSpan) {
        const items = container.querySelectorAll('.drag-sort-item');
        const newData = [];

        items.forEach((item, newIndex) => {
            const oldIndex = parseInt(item.dataset.index);
            item.dataset.index = newIndex;
            newData.push(this.formData[key][oldIndex]);
        });

        this.formData[key] = newData;
        this.updateItemCount(container, itemCountSpan);
    }

    initDragSort(container, key, itemCountSpan) {
        let draggedItem = null;
        let draggedIndex = null;

        container.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('drag-sort-item')) {
                draggedItem = e.target;
                draggedIndex = parseInt(e.target.dataset.index);
                e.target.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            }
        });

        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';

            const items = container.querySelectorAll('.drag-sort-item');
            items.forEach(item => {
                if (item !== draggedItem) {
                    const rect = item.getBoundingClientRect();
                    const midpoint = rect.top + rect.height / 2;

                    if (e.clientY < midpoint) {
                        item.parentNode.insertBefore(draggedItem, item);
                    } else {
                        item.parentNode.insertBefore(draggedItem, item.nextSibling);
                    }
                }
            });
        });

        container.addEventListener('dragend', () => {
            if (draggedItem) {
                draggedItem.classList.remove('dragging');
                this.reindexArrayItems(container, key, itemCountSpan);
                this.updateDataPreview();
            }
        });
    }

    reindexArrayItems(container, key, itemCountSpan) {
        const items = container.querySelectorAll('.drag-sort-item');
        const newData = [];

        items.forEach((item, newIndex) => {
            const oldIndex = parseInt(item.dataset.index);
            item.dataset.index = newIndex;
            newData.push(this.formData[key][oldIndex]);
        });

        this.formData[key] = newData;
        this.updateItemCount(container, itemCountSpan);
    }

    updateItemCount(container, itemCountSpan) {
        if (itemCountSpan) {
            const count = container.querySelectorAll('.drag-sort-item').length;
            itemCountSpan.textContent = `项目: ${count}`;
        }
    }

    refreshDynSectionTitles() {
        (this._dynSectionTitles || []).forEach(({ el, template }) => {
            const text = template.replace(/\{(\w+)\}/g, (_, k) => {
                const v = this.formData[k];
                return typeof v === 'string' && v
                    ? v.charAt(0).toUpperCase() + v.slice(1)
                    : '';
            }).trim();
            el.textContent = text;
        });
    }

    updateDataPreview() {
        this.refreshDynSectionTitles();
        this.refreshCondFields();
        if (this.onDataChange) {
            this.onDataChange(this.formData);
        }
    }

    // ===== 胖 schema：分区渲染 =====

    renderSections(sections) {
        this._dynSectionTitles = [];
        this._condFields = [];
        sections.forEach(section => {
            const wrap = document.createElement('div');
            wrap.className = 'form-section fat-section';

            const h = document.createElement('h2');
            h.className = 'section-title';
            const titleTpl = section.title || section.key;
            h.textContent = titleTpl;
            // 分区标题占位符：如 "{plan_tier} 多语言配置"，随字段当前值动态替换（首字母大写）
            if (/\{\w+\}/.test(titleTpl)) {
                this._dynSectionTitles.push({ el: h, template: titleTpl });
                this.refreshDynSectionTitles();
            }
            wrap.appendChild(h);

            if (section.subtitle) {
                const sub = document.createElement('p');
                sub.className = 'section-subtitle';
                sub.textContent = section.subtitle;
                wrap.appendChild(sub);
            }

            const body = document.createElement('div');
            body.className = 'section-body';

            if (Array.isArray(section.rows)) {
                section.rows.forEach(row => {
                    const rowEl = document.createElement('div');
                    rowEl.className = 'field-row';
                    rowEl.style.gridTemplateColumns = `repeat(${row.length}, 1fr)`;
                    row.forEach(fieldKey => this.renderFieldInto(rowEl, fieldKey, true));
                    body.appendChild(rowEl);
                });
            }
            if (Array.isArray(section.bundle)) {
                this.renderBundleCsv(body, section);
            }
            if (section.field) {
                this.renderFieldInto(body, section.field);
            }

            wrap.appendChild(body);
            this.container.appendChild(wrap);
        });
        this.refreshCondFields();
    }

    refreshCondFields() {
        (this._condFields || []).forEach(({ el, cond }) => {
            el.style.display = this.formData[cond.field] === cond.equals ? '' : 'none';
        });
    }

    renderFieldInto(parent, key, showCardLabel) {
        const property = (this.schema.properties || {})[key];
        if (!property) return;
        const required = (this.schema.required || []).includes(key);
        const widget = property['x-widget'] || this.getDefaultWidget(property);

        // x-visible-when：条件渲染（如 具体天数 仅在 资产时效=days 时显示），
        // 与 schema 的 allOf 条件校验对应；数据层不受影响
        if (property['x-visible-when']) {
            const wrap = document.createElement('div');
            parent.appendChild(wrap);
            this._condFields.push({ el: wrap, cond: property['x-visible-when'] });
            parent = wrap;
        }

        switch (widget) {
            case 'hidden':
                break; // 系统维护字段（如 sort），表单不渲染
            case 'i18n-csv':
                this.renderI18nCsv(parent, key, property, required, showCardLabel);
                break;
            case 'image-config':
                this.renderImageConfig(parent, key, property, required);
                break;
            case 'plan-card-list':
                this.renderPlanCards(parent, key, property, required);
                break;
            case 'sub-option-table':
                this.renderSubOptionTable(parent, key, property, required);
                break;
            case 'date-range':
                this.renderDateRange(parent, key, property, required);
                break;
            case 'select':
                parent.appendChild(this.buildSelectGroup(key, property, required,
                    v => {
                        // boolean 字段用 select 表达（如 是否展示在图鉴 是/否）时还原类型
                        this.formData[key] = property.type === 'boolean' ? v === 'true' : v;
                        this.updateDataPreview();
                    },
                    this.formData[key] != null && this.formData[key] !== '' ? String(this.formData[key]) : null));
                break;
            case 'input':
            case 'text':
                parent.appendChild(this.buildInputGroup(key, property, required,
                    v => { this.formData[key] = v; this.updateDataPreview(); },
                    this.formData[key] !== '' ? this.formData[key] : null));
                break;
            default: {
                // 其余控件（image-upload / i18n-upload / multi-select / drag-sort-list / checkbox 等）
                // 复用原有渲染路径：临时把输出容器切到当前分区
                const prev = this.container;
                this.container = parent;
                this.renderProperty(key, property, required);
                this.container = prev;
            }
        }
    }

    // 通用：带标签的表单组
    labelFor(property, key, required) {
        const label = document.createElement('label');
        label.className = 'form-label';
        const span = document.createElement('span');
        span.textContent = property.title || key;
        label.appendChild(span);
        if (required) {
            const r = document.createElement('span');
            r.className = 'required';
            r.textContent = ' *';
            label.appendChild(r);
        }
        return label;
    }

    buildInputGroup(key, property, required, onChange, initialValue) {
        const group = document.createElement('div');
        group.className = 'form-group';
        group.appendChild(this.labelFor(property, key, required));

        const multiline = property['x-widget'] === 'textarea' || property['x-multiline'];
        const input = document.createElement(multiline ? 'textarea' : 'input');
        input.className = 'form-control';
        if (!multiline) {
            if (property.type === 'number' || property.type === 'integer') {
                input.type = 'number';
            } else if (property.format === 'date-time') {
                input.type = 'datetime-local';
                input.step = 1;
            } else {
                input.type = property.format === 'uri' ? 'url' : 'text';
            }
        }
        if (initialValue != null) input.value = initialValue;
        if (property['x-readonly']) {
            input.disabled = true;
            input.placeholder = '（只读，取自 CSV）';
        }
        input.addEventListener('input', () => {
            const numeric = property.type === 'number' || property.type === 'integer';
            onChange(numeric && input.value !== '' ? parseFloat(input.value) : input.value);
        });
        group.appendChild(input);
        const inputHint = this.hintFor(property);
        if (inputHint) group.appendChild(inputHint);
        this.fieldElements[key] = input;
        return group;
    }

    buildSelectGroup(key, property, required, onChange, initialValue) {
        const group = document.createElement('div');
        group.className = 'form-group';
        group.appendChild(this.labelFor(property, key, required));

        const select = document.createElement('select');
        select.className = 'form-control';
        const ph = document.createElement('option');
        ph.value = '';
        ph.textContent = '请选择...';
        select.appendChild(ph);

        const labels = property['x-enum-labels'] || {};
        const options = Array.isArray(property['x-options'])
            ? property['x-options']
            : (property.enum || []).map(v => ({ value: v, label: labels[v] || v }));

        options.forEach(opt => {
            const o = document.createElement('option');
            o.value = opt.value;
            o.textContent = opt.label;
            select.appendChild(o);
        });
        if (initialValue != null) select.value = initialValue;
        if (property['x-readonly']) select.disabled = true;
        select.addEventListener('change', () => onChange(select.value));
        group.appendChild(select);
        const selectHint = this.hintFor(property);
        if (selectHint) group.appendChild(selectHint);
        this.fieldElements[key] = select;
        return group;
    }

    // ===== image-config 控件（按语言的 webp 头图 + 图片描述）=====

    renderImageConfig(parent, key, property, required) {
        const props = property.properties || {};
        const localized = props.localized || {};
        const langs = localized['x-i18n-langs'] || ['EN'];
        this.formData[key] = this.formData[key] || {};
        if (!this.formData[key].localized) this.formData[key].localized = {};
        if (!this.formData[key].asset_type) {
            this.formData[key].asset_type = (props.asset_type && props.asset_type.default) || 'webp';
        }

        const box = document.createElement('div');
        box.className = 'image-config card';
        const body = document.createElement('div');
        body.className = 'card-body';

        // 素材类型（固定 webp）
        body.appendChild(this.buildSelectGroup(`${key}.asset_type`, props.asset_type, false,
            v => { this.formData[key].asset_type = v; this.updateDataPreview(); },
            this.formData[key].asset_type));

        // 按语言：图片描述 + 自动上传（webp）
        const container = document.createElement('div');
        container.className = 'i18n-container';
        const tabs = document.createElement('div');
        tabs.className = 'i18n-tabs';
        const contents = document.createElement('div');
        contents.className = 'i18n-contents';

        langs.forEach((lang, index) => {
            this.formData[key].localized[lang] = this.formData[key].localized[lang] || {};

            const tab = document.createElement('button');
            tab.type = 'button';
            tab.className = 'i18n-tab' + (index === 0 ? ' active' : '');
            tab.textContent = lang;

            const content = document.createElement('div');
            content.className = 'i18n-content';
            content.style.display = index === 0 ? 'block' : 'none';

            // 图片描述
            const altGroup = document.createElement('div');
            altGroup.className = 'form-group';
            const altLabel = document.createElement('label');
            altLabel.className = 'form-label';
            altLabel.textContent = '图片描述';
            const altInput = document.createElement('input');
            altInput.type = 'text';
            altInput.className = 'form-control';
            altInput.placeholder = `如 3D export privilege preview（${lang}）`;
            if (this.formData[key].localized[lang].image_alt) {
                altInput.value = this.formData[key].localized[lang].image_alt;
            }
            altInput.addEventListener('input', () => {
                this.formData[key].localized[lang].image_alt = altInput.value;
                this.updateDataPreview();
            });
            altGroup.appendChild(altLabel);
            altGroup.appendChild(altInput);

            // 自动上传（仅 webp）
            const upGroup = document.createElement('div');
            upGroup.className = 'form-group';
            const upLabel = document.createElement('label');
            upLabel.className = 'form-label';
            upLabel.textContent = '自动上传（仅 webp）';
            const upInput = document.createElement('input');
            upInput.type = 'file';
            upInput.accept = 'image/webp';
            upInput.className = 'form-control';
            const preview = document.createElement('img');
            preview.className = 'image-preview';
            preview.style.display = 'none';
            if (this.formData[key].localized[lang].image) {
                preview.src = FormRenderer.previewUrlFor(this.formData[key].localized[lang].image);
                preview.style.display = 'block';
            }
            upInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                if (file.type !== 'image/webp') {
                    alert('仅支持 webp 图片');
                    upInput.value = '';
                    return;
                }
                const reader = new FileReader();
                reader.onload = (ev) => {
                    this.formData[key].localized[lang].image = ev.target.result;
                    preview.src = ev.target.result;
                    preview.style.display = 'block';
                    this.updateDataPreview();
                };
                reader.readAsDataURL(file);
            });
            upGroup.appendChild(upLabel);
            upGroup.appendChild(upInput);
            upGroup.appendChild(preview);

            content.appendChild(altGroup);
            content.appendChild(upGroup);
            contents.appendChild(content);

            tab.addEventListener('click', (e) => {
                e.preventDefault();
                tabs.querySelectorAll('.i18n-tab').forEach(t => t.classList.remove('active'));
                contents.querySelectorAll('.i18n-content').forEach(c => c.style.display = 'none');
                tab.classList.add('active');
                content.style.display = 'block';
            });
            tabs.appendChild(tab);
        });

        container.appendChild(tabs);
        container.appendChild(contents);
        body.appendChild(container);
        box.appendChild(body);
        parent.appendChild(box);
    }

    // ===== bundle CSV 控件（多个扁平 i18n 字段 {语言: 文本} 共用一个 CSV，数据仍写回各自属性）=====

    renderBundleCsv(parent, section) {
        const keys = section.bundle;
        const props = this.schema.properties || {};
        const cfg = section['x-i18n'] || {};
        const langs = cfg.languages || ['EN', 'ZH', 'ES', 'KO', 'RU', 'PT', 'JA', 'DE', 'IT', 'TR', 'FR'];
        const reqLang = cfg.requiredLanguage || 'EN';
        keys.forEach(k => {
            if (!this.formData[k] || typeof this.formData[k] !== 'object') this.formData[k] = {};
        });

        const box = document.createElement('div');
        box.className = 'i18n-csv card';
        const body = document.createElement('div');
        body.className = 'card-body';

        const countEl = document.createElement('h3');
        countEl.className = 'i18n-csv-count';
        body.appendChild(countEl);

        const hint = document.createElement('p');
        hint.className = 'section-subtitle';
        // CSV 列头标签：优先分区 x-i18n.fields 的 label，回退到属性 title / key
        const fieldDefs = cfg.fields || [];
        const labels = keys.map(k => {
            const f = fieldDefs.find(f => f.key === k);
            return (f && f.label) || (props[k] && props[k].title) || k;
        });
        hint.textContent = `统一配置 ${labels.join('、')}；${reqLang} 必填，其他语言未配置时 fallback 到 ${reqLang}。`;
        body.appendChild(hint);

        // 表头单元格 -> 属性 key：兼容属性 key 与中文标题（title）两种写法
        const headerToKey = (h) => {
            const t = (h || '').trim();
            if (keys.includes(t)) return t;
            const li = labels.indexOf(t);
            return li >= 0 ? keys[li] : null;
        };

        const btns = document.createElement('div');
        btns.className = 'toolbar';
        const tplBtn = document.createElement('button');
        tplBtn.type = 'button';
        tplBtn.className = 'btn btn-small';
        tplBtn.style.border = '1px solid var(--border-color)';
        tplBtn.textContent = '下载 CSV 模板';
        const dlBtn = document.createElement('button');
        dlBtn.type = 'button';
        dlBtn.className = 'btn btn-small';
        dlBtn.style.border = '1px solid var(--border-color)';
        dlBtn.textContent = '下载已上传 CSV';
        const upBtn = document.createElement('button');
        upBtn.type = 'button';
        upBtn.className = 'btn btn-small btn-primary';
        upBtn.textContent = '替换 CSV';
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.csv';
        fileInput.style.display = 'none';
        btns.appendChild(tplBtn);
        btns.appendChild(dlBtn);
        btns.appendChild(upBtn);
        btns.appendChild(fileInput);
        body.appendChild(btns);

        const fileInfo = document.createElement('div');
        fileInfo.className = 'i18n-csv-fileinfo';
        body.appendChild(fileInfo);

        const updateCount = () => {
            const filled = langs.filter(l =>
                keys.some(k => this.formData[k] && this.formData[k][l])).length;
            countEl.textContent = `已配置 ${filled}/${langs.length}`;
        };

        tplBtn.addEventListener('click', () => {
            const header = ['语言', ...labels];
            const rows = langs.map(l => [l, ...keys.map(() => '')]);
            this.downloadCsv(cfg.templateName || `${section.key || 'i18n'}-template.csv`, [header, ...rows]);
        });
        dlBtn.addEventListener('click', () => {
            const header = ['语言', ...labels];
            const rows = langs
                .filter(l => keys.some(k => this.formData[k][l]))
                .map(l => [l, ...keys.map(k => this.formData[k][l] || '')]);
            this.downloadCsv(`${section.key || 'i18n'}-uploaded.csv`, [header, ...rows]);
        });
        upBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const parsed = this.parseCsv(ev.target.result);
                const head = parsed[0] || [];
                keys.forEach(k => { this.formData[k] = {}; });
                for (let i = 1; i < parsed.length; i++) {
                    const row = parsed[i];
                    const lang = (row[0] || '').trim();
                    if (!lang) continue;
                    head.forEach((h, idx) => {
                        if (idx === 0) return;
                        const k = headerToKey(h);
                        if (!k) return;
                        if (row[idx] != null && row[idx] !== '') this.formData[k][lang] = row[idx];
                    });
                }
                updateCount();
                fileInfo.innerHTML = `<div><strong>当前文件：</strong>${file.name}</div>`;
                this.updateDataPreview();
            };
            reader.readAsText(file);
        });

        updateCount();
        box.appendChild(body);
        parent.appendChild(box);
    }

    // ===== i18n-csv 控件 =====

    renderI18nCsv(parent, key, property, required, showCardLabel) {
        const cfg = property['x-i18n'] || {};
        const langs = cfg.languages || ['EN'];
        this.formData[key] = this.formData[key] || {};

        // 作为分区内普通字段（rows 布局）渲染时带字段标签；作为整段（section.field）渲染时分区标题已足够
        if (showCardLabel && property.title) {
            const group = document.createElement('div');
            group.className = 'form-group';
            group.appendChild(this.labelFor(property, key, required));
            parent.appendChild(group);
            parent = group;
        }

        const box = document.createElement('div');
        box.className = 'i18n-csv card';

        const body = document.createElement('div');
        body.className = 'card-body';

        const countEl = document.createElement('h3');
        countEl.className = 'i18n-csv-count';
        body.appendChild(countEl);

        const hint = document.createElement('p');
        hint.className = 'section-subtitle';
        hint.textContent = cfg.hint
            || `统一配置 ${(cfg.fields || []).map(f => f.label).slice(0, 6).join('、')} 等；${cfg.requiredLanguage || 'EN'} 必填，其他语言未配置时 fallback 到 ${cfg.requiredLanguage || 'EN'}。`;
        body.appendChild(hint);

        const btns = document.createElement('div');
        btns.className = 'toolbar';

        const tplBtn = document.createElement('button');
        tplBtn.type = 'button';
        tplBtn.className = 'btn btn-small';
        tplBtn.style.border = '1px solid var(--border-color)';
        tplBtn.textContent = '下载 CSV 模板';

        const dlBtn = document.createElement('button');
        dlBtn.type = 'button';
        dlBtn.className = 'btn btn-small';
        dlBtn.style.border = '1px solid var(--border-color)';
        dlBtn.textContent = '下载已上传 CSV';

        const upBtn = document.createElement('button');
        upBtn.type = 'button';
        upBtn.className = 'btn btn-small btn-primary';
        upBtn.textContent = '替换 CSV';

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.csv';
        fileInput.style.display = 'none';

        btns.appendChild(tplBtn);
        btns.appendChild(dlBtn);
        btns.appendChild(upBtn);
        btns.appendChild(fileInput);
        body.appendChild(btns);

        const fileInfo = document.createElement('div');
        fileInfo.className = 'i18n-csv-fileinfo';
        body.appendChild(fileInfo);

        const cols = (cfg.fields || []).map(f => f.key);
        const colLabels = (cfg.fields || []).map(f => f.label || f.key);
        // 表头单元格 -> 字段 key：兼容 key 与中文标签（label）两种写法；未知列名原样保留（向后兼容）
        const headerToKey = (h) => {
            const t = (h || '').trim();
            const f = (cfg.fields || []).find(f => f.key === t || f.label === t);
            return f ? f.key : t;
        };
        const updateCount = () => {
            const filled = Object.keys(this.formData[key]).filter(l =>
                this.formData[key][l] && Object.keys(this.formData[key][l]).length > 0).length;
            countEl.textContent = `已配置 ${filled}/${langs.length}`;
        };
        const renderInfo = (name) => {
            const en = this.formData[key][cfg.requiredLanguage || 'EN'] || {};
            const summary = [en.image, en.main_title].filter(Boolean).join(' / ') || '（暂无）';
            fileInfo.innerHTML = '';
            if (name) {
                const p1 = document.createElement('div');
                p1.innerHTML = `<strong>当前文件：</strong>${name}`;
                const p2 = document.createElement('div');
                p2.style.color = 'var(--text-light)';
                p2.textContent = `EN 摘要：${summary}`;
                fileInfo.appendChild(p1);
                fileInfo.appendChild(p2);
            }
        };

        tplBtn.addEventListener('click', () => {
            const header = ['语言', ...colLabels];
            const rows = langs.map(l => [l, ...cols.map(() => '')]);
            this.downloadCsv(cfg.templateName || 'i18n-template.csv', [header, ...rows]);
        });
        dlBtn.addEventListener('click', () => {
            const header = ['语言', ...colLabels];
            const rows = Object.keys(this.formData[key]).map(l =>
                [l, ...cols.map(c => (this.formData[key][l] || {})[c] || '')]);
            this.downloadCsv('i18n-uploaded.csv', [header, ...rows]);
        });
        upBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const parsed = this.parseCsv(ev.target.result);
                const map = {};
                const head = parsed[0] || [];
                for (let i = 1; i < parsed.length; i++) {
                    const row = parsed[i];
                    const lang = (row[0] || '').trim();
                    if (!lang) continue;
                    const langValues = {};
                    head.forEach((h, idx) => {
                        if (idx === 0) return;
                        if (row[idx] != null && row[idx] !== '') langValues[headerToKey(h)] = row[idx];
                    });
                    // 整行为空的语言不写入，避免产生空对象
                    if (Object.keys(langValues).length > 0) map[lang] = langValues;
                }
                this.formData[key] = map;
                updateCount();
                renderInfo(file.name);
                this.refreshPlanCards();
                this.updateDataPreview();
            };
            reader.readAsText(file);
        });

        updateCount();
        renderInfo(null);
        box.appendChild(body);
        parent.appendChild(box);
        const descHint = this.hintFor(property);
        if (descHint) parent.appendChild(descHint);
    }

    downloadCsv(filename, rows) {
        const csv = rows.map(r => r.map(cell => {
            const s = String(cell == null ? '' : cell);
            return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
        }).join(',')).join('\n');
        // UTF-8 BOM：中文表头在 Excel 中不乱码
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    parseCsv(text) {
        if (text && text.charCodeAt(0) === 0xFEFF) text = text.slice(1); // 去除 UTF-8 BOM
        const rows = [];
        let row = [], field = '', inQuotes = false;
        for (let i = 0; i < text.length; i++) {
            const c = text[i];
            if (inQuotes) {
                if (c === '"') {
                    if (text[i + 1] === '"') { field += '"'; i++; }
                    else inQuotes = false;
                } else field += c;
            } else {
                if (c === '"') inQuotes = true;
                else if (c === ',') { row.push(field); field = ''; }
                else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
                else if (c === '\r') { /* skip */ }
                else field += c;
            }
        }
        if (field.length || row.length) { row.push(field); rows.push(row); }
        return rows.filter(r => r.length && !(r.length === 1 && r[0] === ''));
    }

    // 解析本 schema 内的 $ref（如 #/$defs/contentTag），并合并引用处的覆盖字段
    resolveRef(property) {
        if (!property || !property.$ref || !property.$ref.startsWith('#/')) return property;
        const path = property.$ref.slice(2).split('/');
        let node = this.schema;
        for (const p of path) node = (node || {})[p];
        const merged = { ...(node || {}), ...property };
        delete merged.$ref;
        return merged;
    }

    // ===== date-range 控件（起止时间 + 不限勾选；勾选不限时两个时间键从数据中删除，即「不配置表示不限」）=====

    renderDateRange(parent, key, property, required) {
        const cfg = property['x-range'] || {};
        const endKey = cfg.endField;

        // 未填写的时间不应以空串出现在数据里（缺省即不限）
        if (!this.formData[key]) delete this.formData[key];
        if (endKey && !this.formData[endKey]) delete this.formData[endKey];

        const group = document.createElement('div');
        group.className = 'form-group';
        group.appendChild(this.labelFor(property, key, required));

        const rangeWrap = document.createElement('div');
        rangeWrap.className = 'date-range';

        const mkDt = (k) => {
            const i = document.createElement('input');
            i.type = 'datetime-local';
            i.step = 1;
            i.className = 'form-control';
            i.addEventListener('input', () => {
                if (i.value) this.formData[k] = i.value;
                else delete this.formData[k];
                this.updateDataPreview();
            });
            return i;
        };
        const startInput = mkDt(key);
        const endInput = mkDt(endKey);
        if (this.formData[key]) startInput.value = this.formData[key];
        if (endKey && this.formData[endKey]) endInput.value = this.formData[endKey];

        const arrow = document.createElement('span');
        arrow.className = 'date-range-arrow';
        arrow.textContent = '→';

        const unlimited = document.createElement('label');
        unlimited.className = 'date-range-unlimited';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.addEventListener('change', () => {
            startInput.disabled = cb.checked;
            endInput.disabled = cb.checked;
            if (cb.checked) {
                startInput.value = '';
                endInput.value = '';
                delete this.formData[key];
                delete this.formData[endKey];
            }
            this.updateDataPreview();
        });
        unlimited.appendChild(cb);
        unlimited.appendChild(document.createTextNode(cfg.unlimitedLabel || '不限'));

        rangeWrap.appendChild(startInput);
        rangeWrap.appendChild(arrow);
        rangeWrap.appendChild(endInput);
        rangeWrap.appendChild(unlimited);
        group.appendChild(rangeWrap);

        const hint = this.hintFor(property);
        if (hint) group.appendChild(hint);
        parent.appendChild(group);
        this.fieldElements[key] = startInput;
        if (endKey) this.fieldElements[endKey] = endInput;
        this.fieldElements[`${key}-unlimited`] = cb;
    }

    // ===== sub-option-table 控件（内容子选项表格：拖拽排序 / 文案 EN / 每项一个多语言 CSV / 子选项图 / 标签 / 示例链接）=====

    renderSubOptionTable(parent, key, property, required) {
        const itemSchema = property.items || {};
        const itemProps = itemSchema.properties || {};
        const count = property.minItems || 4;

        if (!Array.isArray(this.formData[key]) || this.formData[key].length !== count) {
            this.formData[key] = Array.from({ length: count }, () => {
                const item = {};
                Object.keys(itemProps).forEach(pk => {
                    const p = this.resolveRef(itemProps[pk]);
                    item[pk] = p.type === 'array' ? [] : (p.type === 'object' ? {} : '');
                });
                return item;
            });
        }

        const textProp = this.resolveRef(itemProps.text || {});
        const i18nCfg = textProp['x-i18n'] || {};
        const reqLang = i18nCfg.requiredLanguage || 'EN';
        const fieldKeys = (i18nCfg.fields || [{ key: 'text' }]).map(f => f.key);

        const table = document.createElement('div');
        table.className = 'sub-option-table';

        const head = document.createElement('div');
        head.className = 'sub-option-head';
        const headers = [
            '拖拽排序',
            `${textProp.title || 'text'} ${reqLang}`,
            '多语言 CSV',
            (itemProps.icon && itemProps.icon.title) || 'icon',
            (this.resolveRef(itemProps.content_tag || {}).title) || 'content_tag',
            (itemProps.example_model_urls && itemProps.example_model_urls.title) || 'example_model_urls'
        ];
        headers.forEach(h => {
            const cell = document.createElement('div');
            cell.textContent = h;
            head.appendChild(cell);
        });
        table.appendChild(head);

        this.formData[key].forEach((item, idx) => {
            table.appendChild(this.buildSubOptionRow(table, key, item, idx, {
                itemProps, i18nCfg, reqLang, fieldKeys
            }));
        });

        parent.appendChild(table);
        this.fieldElements[key] = table;
    }

    buildSubOptionRow(table, key, item, idx, ctx) {
        // 闭包全部引用 item 对象本身，拖拽重排只调整数组顺序，不影响写回目标
        const { itemProps, i18nCfg, reqLang, fieldKeys } = ctx;
        const row = document.createElement('div');
        row.className = 'sub-option-row';
        row.draggable = true;

        // 1) 拖拽排序
        const dragCell = document.createElement('div');
        dragCell.className = 'sub-option-drag';
        const num = document.createElement('span');
        num.className = 'sub-option-num';
        num.textContent = String(idx + 1);
        const handle = document.createElement('span');
        handle.className = 'drag-handle';
        handle.textContent = '⋮⋮';
        dragCell.appendChild(num);
        dragCell.appendChild(handle);
        row.appendChild(dragCell);

        // 2) 子选项文案 EN（只读，取自本项 CSV 的 EN 行）
        const textCell = document.createElement('div');
        const enText = document.createElement('div');
        enText.className = 'sub-option-en-text';
        const renderEnText = () => {
            const v = (item.text || {})[reqLang];
            enText.textContent = v || '（取自 CSV）';
            enText.classList.toggle('placeholder', !v);
        };
        renderEnText();
        textCell.appendChild(enText);
        row.appendChild(textCell);

        // 3) 每个子选项一份多语言 CSV
        const csvCell = document.createElement('div');
        csvCell.className = 'sub-option-csv';
        const mkBtn = (text, primary) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'btn btn-small' + (primary ? ' btn-primary' : '');
            if (!primary) b.style.border = '1px solid var(--border-color)';
            b.textContent = text;
            return b;
        };
        const tplBtn = mkBtn('下载模板');
        const dlBtn = mkBtn('下载已上传');
        const upBtn = mkBtn('替换 CSV', true);
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.csv';
        fileInput.style.display = 'none';
        const fileInfo = document.createElement('div');
        fileInfo.className = 'sub-option-csv-file';
        if (item.text && Object.keys(item.text).length) {
            fileInfo.textContent = `已保存配置 · 已配置 ${Object.keys(item.text).length}/${(i18nCfg.languages || []).length}`;
        }

        const fieldLabels = (i18nCfg.fields || [{ key: 'text' }]).map(f => f.label || f.key);
        tplBtn.addEventListener('click', () => {
            const header = ['语言', ...fieldLabels];
            const rows = (i18nCfg.languages || [reqLang]).map(l => [l, ...fieldKeys.map(() => '')]);
            this.downloadCsv(i18nCfg.templateName || 'sub-option-i18n-template.csv', [header, ...rows]);
        });
        dlBtn.addEventListener('click', () => {
            const header = ['语言', ...fieldLabels];
            const rows = Object.keys(item.text || {})
                .map(l => [l, item.text[l] || '']);
            this.downloadCsv('sub-option-i18n-uploaded.csv', [header, ...rows]);
        });
        upBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const parsed = this.parseCsv(ev.target.result);
                const head = parsed[0] || [];
                // 表头兼容字段 key 与中文标签两种写法
                const col = head.findIndex(h => {
                    const t = (h || '').trim();
                    return t === fieldKeys[0] || t === fieldLabels[0];
                });
                item.text = {};
                for (let i = 1; i < parsed.length; i++) {
                    const r = parsed[i];
                    const lang = (r[0] || '').trim();
                    if (!lang) continue;
                    const v = col >= 0 ? r[col] : r[1];
                    if (v != null && v !== '') item.text[lang] = v;
                }
                renderEnText();
                fileInfo.textContent = `${file.name} · 已配置 ${Object.keys(item.text).length}/${(i18nCfg.languages || []).length}`;
                this.updateDataPreview();
            };
            reader.readAsText(file);
        });

        const btnWrap = document.createElement('div');
        btnWrap.className = 'toolbar';
        btnWrap.appendChild(tplBtn);
        btnWrap.appendChild(dlBtn);
        btnWrap.appendChild(upBtn);
        csvCell.appendChild(btnWrap);
        csvCell.appendChild(fileInfo);
        csvCell.appendChild(fileInput);
        row.appendChild(csvCell);

        // 4) 子选项图（上传，所有语言共用）
        const iconCell = document.createElement('div');
        iconCell.className = 'sub-option-icon';
        const thumb = document.createElement('img');
        thumb.className = 'sub-option-thumb';
        thumb.style.display = item.icon ? '' : 'none';
        if (item.icon) thumb.src = FormRenderer.previewUrlFor(item.icon);
        const iconBtn = mkBtn('上传图片');
        const iconInput = document.createElement('input');
        iconInput.type = 'file';
        iconInput.accept = 'image/*';
        iconInput.style.display = 'none';
        iconBtn.addEventListener('click', () => iconInput.click());
        iconInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const origText = iconBtn.textContent;
            iconBtn.textContent = '上传中…';
            iconBtn.disabled = true;
            try {
                // 数组下标不参与后端 slug 校验（normalizeSlug 会剥离），用当前行号仅为审计可读
                const { value, previewUrl } = await this.pickImage(file, `${key}[${idx}].icon`);
                item.icon = value;
                thumb.src = previewUrl;
                thumb.style.display = '';
                this.updateDataPreview();
            } catch (err) {
                alert(`图片上传失败：${err.message}`);
            } finally {
                iconBtn.textContent = origText;
                iconBtn.disabled = false;
            }
        });
        iconCell.appendChild(thumb);
        iconCell.appendChild(iconBtn);
        iconCell.appendChild(iconInput);
        row.appendChild(iconCell);

        // 5) content_tag（单选）
        const tagCell = document.createElement('div');
        const tagProp = this.resolveRef(itemProps.content_tag || {});
        const tagSelect = document.createElement('select');
        tagSelect.className = 'form-control';
        const ph = document.createElement('option');
        ph.value = '';
        ph.textContent = '请选择...';
        tagSelect.appendChild(ph);
        (tagProp.enum || []).forEach(v => {
            const o = document.createElement('option');
            o.value = v;
            o.textContent = v;
            tagSelect.appendChild(o);
        });
        if (item.content_tag) tagSelect.value = item.content_tag;
        tagSelect.addEventListener('change', () => {
            item.content_tag = tagSelect.value;
            this.updateDataPreview();
        });
        tagCell.appendChild(tagSelect);
        row.appendChild(tagCell);

        // 6) 新用户示例模型链接（多行输入，每行一个 URL）
        const urlCell = document.createElement('div');
        const urlArea = document.createElement('textarea');
        urlArea.className = 'form-control';
        urlArea.rows = 4;
        const urlsProp = itemProps.example_model_urls || {};
        urlArea.placeholder = `每行一个链接${urlsProp.minItems ? `，固定 ${urlsProp.minItems} 个` : ''}`;
        if (Array.isArray(item.example_model_urls) && item.example_model_urls.length) {
            urlArea.value = item.example_model_urls.join('\n');
        }
        urlArea.addEventListener('input', () => {
            item.example_model_urls = urlArea.value.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
            this.updateDataPreview();
        });
        urlCell.appendChild(urlArea);
        row.appendChild(urlCell);

        // 拖拽重排：交换 DOM 后按 DOM 顺序重排 formData（行内闭包持有 item 引用，不受顺序影响）
        row.addEventListener('dragstart', () => {
            row.classList.add('dragging');
            this._draggingSubRow = { row, key, table };
        });
        row.addEventListener('dragover', (e) => {
            e.preventDefault();
            const drag = this._draggingSubRow;
            if (!drag || drag.table !== table || drag.row === row) return;
            const rect = row.getBoundingClientRect();
            if (e.clientY < rect.top + rect.height / 2) {
                table.insertBefore(drag.row, row);
            } else {
                table.insertBefore(drag.row, row.nextSibling);
            }
        });
        row.addEventListener('dragend', () => {
            row.classList.remove('dragging');
            this._draggingSubRow = null;
            const rows = Array.from(table.querySelectorAll('.sub-option-row'));
            this.formData[key] = rows.map(r => r._subOptionItem);
            rows.forEach((r, i) => {
                r.querySelector('.sub-option-num').textContent = String(i + 1);
            });
            this.updateDataPreview();
        });
        row._subOptionItem = item;

        return row;
    }

    // ===== plan-card-list 控件 =====

    renderPlanCards(parent, key, property, required) {
        const itemSchema = property.items || {};
        const planKeys = (itemSchema.properties?.plan_key?.enum) || [];
        // 四档定长：按 enum 顺序初始化
        if (!Array.isArray(this.formData[key]) || this.formData[key].length !== planKeys.length) {
            this.formData[key] = planKeys.map(pk => ({
                plan_key: pk, monthly_price_id: '', annual_price_id: ''
            }));
        }

        const wrap = document.createElement('div');
        wrap.className = 'plan-card-list';
        wrap.dataset.fieldKey = key;
        this._planCtx = { key, property, itemSchema, wrap };

        planKeys.forEach((pk, idx) => wrap.appendChild(this.buildPlanCard(key, itemSchema, pk, idx)));
        parent.appendChild(wrap);
    }

    buildPlanCard(key, itemSchema, planKey, idx) {
        const card = document.createElement('div');
        card.className = 'card plan-card';
        card.dataset.planKey = planKey;

        const i18nMap = itemSchema['x-plan-i18n'] || {};
        const enRow = (this.formData.i18n && this.formData.i18n.EN) || {};
        const resolve = (tpl) => enRow[(tpl || '').replace('{plan_key}', planKey)] || '';

        const header = document.createElement('div');
        header.className = 'card-header plan-card-header';
        const hTitle = document.createElement('h3');
        hTitle.textContent = resolve(i18nMap.display_name) || planKey.charAt(0).toUpperCase() + planKey.slice(1);
        const badge = document.createElement('span');
        badge.className = 'badge badge-primary';
        badge.textContent = planKey;
        header.appendChild(hTitle);
        header.appendChild(badge);
        card.appendChild(header);

        const body = document.createElement('div');
        body.className = 'card-body';

        // 套餐展示名 EN（只读，取自 i18n）
        body.appendChild(this.readonlyGroup('套餐展示名 EN', resolve(i18nMap.display_name), false));

        // Monthly / Annual price_id（可编辑）
        const mp = itemSchema.properties.monthly_price_id;
        const ap = itemSchema.properties.annual_price_id;
        body.appendChild(this.buildSelectGroup(`${key}.${idx}.monthly_price_id`, mp, true,
            v => { this.formData[key][idx].monthly_price_id = v; this.updateDataPreview(); },
            this.formData[key][idx].monthly_price_id));
        body.appendChild(this.buildSelectGroup(`${key}.${idx}.annual_price_id`, ap, true,
            v => { this.formData[key][idx].annual_price_id = v; this.updateDataPreview(); },
            this.formData[key][idx].annual_price_id));

        // 套餐文案配置（只读，取自多语言 CSV 的 EN 行）
        if (i18nMap.copy) {
            body.appendChild(this.readonlyGroup('套餐文案配置', resolve(i18nMap.copy), true));
        }

        card.appendChild(body);
        return card;
    }

    readonlyGroup(labelText, value, multiline) {
        const group = document.createElement('div');
        group.className = 'form-group';
        const label = document.createElement('label');
        label.className = 'form-label';
        const span = document.createElement('span');
        span.textContent = labelText;
        const r = document.createElement('span');
        r.className = 'required';
        r.textContent = ' *';
        label.appendChild(span);
        label.appendChild(r);
        group.appendChild(label);

        const el = document.createElement(multiline ? 'textarea' : 'input');
        el.className = 'form-control';
        el.disabled = true;
        if (value) el.value = value;
        else el.placeholder = '（只读，取自 CSV 的 EN 行）';
        group.appendChild(el);
        return group;
    }

    // CSV 上传后刷新套餐卡的只读展示
    refreshPlanCards() {
        if (!this._planCtx) return;
        const { key, itemSchema, wrap } = this._planCtx;
        const planKeys = (itemSchema.properties?.plan_key?.enum) || [];
        wrap.innerHTML = '';
        planKeys.forEach((pk, idx) => wrap.appendChild(this.buildPlanCard(key, itemSchema, pk, idx)));
    }

    getFormData() {
        return this.formData;
    }
}

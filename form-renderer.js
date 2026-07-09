class FormRenderer {
    constructor(schema, container, onDataChange) {
        this.schema = schema;
        this.container = container;
        this.onDataChange = onDataChange;
        this.formData = {};
        this.fieldElements = {};
        this.dragState = {};
    }

    render() {
        this.container.innerHTML = '';
        this.formData = this.initializeFormData();
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

        const propertiesKeys = Object.keys(this.schema.properties || {});
        const required = this.schema.required || [];

        propertiesKeys.forEach(key => {
            const property = this.schema.properties[key];
            const isRequired = required.includes(key);
            this.renderProperty(key, property, isRequired);
        });

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
        labelText.textContent = property.description || key;
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

    createBasicInput(key, property) {
        let input;

        if (property.type === 'string') {
            if (property.format === 'uri') {
                input = document.createElement('input');
                input.type = 'url';
            } else if (property.minLength && property.minLength > 50) {
                input = document.createElement('textarea');
            } else {
                input = document.createElement('input');
                input.type = 'text';
            }
        } else if (property.type === 'number') {
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

        input.addEventListener('input', () => {
            if (property.type === 'boolean') {
                this.formData[key] = input.checked;
            } else if (property.type === 'number') {
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

        items.forEach(value => {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = value;
            checkbox.id = `${key}-${value}`;

            const label = document.createElement('label');
            label.htmlFor = `${key}-${value}`;
            label.textContent = value;
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

        this.formData[key] = [];
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

        this.formData[key] = {};

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

        this.formData[key] = {};

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
        input.accept = 'image/*';
        input.id = `${key}-input`;

        const label = document.createElement('label');
        label.htmlFor = `${key}-input`;
        label.style.cursor = 'pointer';
        label.textContent = '点击上传图片或拖拽放入';

        const preview = document.createElement('img');
        preview.className = 'image-preview';
        preview.style.display = 'none';

        uploadContainer.appendChild(label);
        uploadContainer.appendChild(preview);

        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    this.formData[key] = event.target.result;
                    preview.src = event.target.result;
                    preview.style.display = 'block';
                    label.style.display = 'none';
                    this.updateDataPreview();
                };
                reader.readAsDataURL(file);
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
        this.container.appendChild(group);
        this.fieldElements[key] = input;
        this.formData[key] = '';
    }

    renderDragSortList(key, property, isRequired) {
        const group = this.createFormGroup(key, property, isRequired);

        const listContainer = document.createElement('div');
        listContainer.id = `${key}-list`;
        listContainer.className = 'drag-sort-list';

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

        // 初始化拖拽
        this.initDragSort(listContainer, key, itemCountSpan);
    }

    addArrayItem(key, property, container, itemCountSpan) {
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
            fieldLabel.textContent = propSchema.description || propKey;
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

    updateDataPreview() {
        if (this.onDataChange) {
            this.onDataChange(this.formData);
        }
    }

    getFormData() {
        return this.formData;
    }
}

let schemaLoader = null;
let formRenderer = null;
let currentFormData = {};

document.addEventListener('DOMContentLoaded', () => {
    schemaLoader = new SchemaLoader();
    initializeEventListeners();
    loadDemoSchema();
    setupKeyboardShortcuts();
});

function initializeEventListeners() {
    const loadSchemaBtn = document.getElementById('loadSchemaBtn');
    const schemaUpload = document.getElementById('schemaUpload');
    const schemaSelector = document.getElementById('schemaSelector');
    const submitBtn = document.getElementById('submitBtn');
    const resetBtn = document.getElementById('resetBtn');
    const exportBtn = document.getElementById('exportBtn');
    const copyBtn = document.getElementById('copyBtn');
    const importInput = document.getElementById('importInput');

    loadSchemaBtn.addEventListener('click', () => {
        schemaUpload.click();
    });

    schemaUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                showLoading(true);
                await schemaLoader.loadFromFile(file);
                showAlert('✓ JSON文件加载成功', 'success');
                schemaSelector.focus();
            } catch (error) {
                showAlert(`✗ 加载失败: ${error.message}`, 'error');
            } finally {
                showLoading(false);
            }
        }
    });

    schemaSelector.addEventListener('change', (e) => {
        const schemaName = e.target.value;
        if (schemaName) {
            loadSchema(schemaName);
        }
    });

    submitBtn.addEventListener('click', () => {
        const formData = formRenderer.getFormData();
        console.log('Form Data:', formData);
        showAlert('✓ 表单已提交，请查看控制台', 'success');
    });

    resetBtn.addEventListener('click', () => {
        if (confirm('确定要重置表单吗？')) {
            resetForm();
        }
    });

    exportBtn.addEventListener('click', () => {
        exportFormData();
    });

    copyBtn.addEventListener('click', () => {
        const preview = document.getElementById('dataPreview');
        navigator.clipboard.writeText(preview.textContent).then(() => {
            showAlert('✓ 数据已复制到剪贴板', 'success');
        });
    });

    // 导入功能
    importInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            importFormData(file);
        }
    });

    // 添加导入按钮（通过快捷键 Ctrl+Shift+I）
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'I') {
            e.preventDefault();
            importInput.click();
        }
    });
}

async function loadDemoSchema() {
    try {
        const response = await fetch('demo.json');
        const data = await response.json();
        schemaLoader.schemas = data;
        schemaLoader.updateSchemaSelector();
        showAlert('✓ Demo JSON已加载，请选择一个Schema', 'info');
    } catch (error) {
        console.warn('Demo JSON加载失败，请手动上传', error);
    }
}

function loadSchema(schemaName) {
    const schema = schemaLoader.getSchema(schemaName);
    if (!schema) {
        showAlert('✗ Schema不存在', 'error');
        return;
    }

    schemaLoader.setCurrentSchema(schemaName);
    const container = document.getElementById('formContainer');
    const submitBtn = document.getElementById('submitBtn');
    const resetBtn = document.getElementById('resetBtn');
    const exportBtn = document.getElementById('exportBtn');
    const copyBtn = document.getElementById('copyBtn');

    // 清空空状态
    container.innerHTML = '';

    formRenderer = new FormRenderer(schema, container, (data) => {
        currentFormData = data;
        updatePreview(data);
    });

    formRenderer.render();

    // 显示按钮
    submitBtn.style.display = 'block';
    resetBtn.style.display = 'inline-block';
    exportBtn.style.display = 'inline-block';
    copyBtn.style.display = 'inline-block';

    showAlert(`✓ 已加载 Schema: ${schema.title}`, 'info');
}

function updatePreview(data) {
    const preview = document.getElementById('dataPreview');
    preview.textContent = JSON.stringify(data, null, 2);
}

function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} show`;
    alertDiv.textContent = message;
    alertDiv.style.position = 'fixed';
    alertDiv.style.top = '20px';
    alertDiv.style.right = '20px';
    alertDiv.style.zIndex = '9999';
    alertDiv.style.maxWidth = '400px';
    alertDiv.style.animation = 'slideIn 0.3s ease';

    document.body.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => alertDiv.remove(), 300);
    }, 3000);
}

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    overlay.style.display = show ? 'flex' : 'none';
}

function exportFormData() {
    const dataStr = JSON.stringify(currentFormData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    const schemaName = schemaLoader.getCurrentSchemaName();
    link.download = `${schemaName}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showAlert('✓ 数据已导出', 'success');
}

function importFormData(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            currentFormData = data;

            // 更新表单字段
            Object.keys(data).forEach(key => {
                if (formRenderer.fieldElements[key]) {
                    const element = formRenderer.fieldElements[key];
                    if (element.type === 'checkbox') {
                        element.checked = data[key];
                    } else if (element.tagName === 'SELECT') {
                        element.value = data[key];
                    } else if (element.tagName === 'TEXTAREA') {
                        element.value = data[key];
                    }
                }
            });

            updatePreview(data);
            showAlert('✓ 数据导入成功', 'success');
        } catch (error) {
            showAlert(`✗ 导入失败: ${error.message}`, 'error');
        }
    };
    reader.readAsText(file);
}

function resetForm() {
    if (formRenderer) {
        formRenderer.formData = formRenderer.initializeFormData();
        formRenderer.render();
        updatePreview(formRenderer.formData);
        showAlert('✓ 表单已重置', 'info');
    }
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl+S: 导出
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            if (formRenderer) {
                exportFormData();
            }
        }
        // Ctrl+R: 重置
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            if (formRenderer && confirm('确定要重置表单吗？')) {
                resetForm();
            }
        }
        // Ctrl+Shift+I: 导入
        if (e.ctrlKey && e.shiftKey && e.key === 'I') {
            e.preventDefault();
            document.getElementById('importInput').click();
        }
    });
}

// 添加动画CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// 导出全局函数供外部调用
window.exportFormData = exportFormData;
window.importFormData = importFormData;
window.resetForm = resetForm;

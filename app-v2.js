let schemaLoader = null;
let formRenderer = null;
let formValidator = null;
let currentFormData = {};

document.addEventListener('DOMContentLoaded', () => {
    schemaLoader = new SchemaLoader();
    initializeEventListeners();
    setupKeyboardShortcuts();
    loadDemoSchema();
});

function initializeEventListeners() {
    const loadSchemaBtn = document.getElementById('loadSchemaBtn');
    const schemaUpload = document.getElementById('schemaUpload');
    const schemaSelector = document.getElementById('schemaSelector');
    const submitBtn = document.getElementById('submitBtn');
    const resetBtn = document.getElementById('resetBtn');
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const validateBtn = document.getElementById('validateBtn');
    const copyBtn = document.getElementById('copyBtn');
    const formatBtn = document.getElementById('formatBtn');
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
        if (validateForm()) {
            const formData = formRenderer.getFormData();
            console.log('✓ 表单数据有效，已提交:', formData);
            showAlert('✓ 表单数据有效，已提交！', 'success');
        }
    });

    resetBtn.addEventListener('click', () => {
        showModal('确认重置', '确定要清空所有表单数据吗？', () => {
            resetForm();
        });
    });

    exportBtn.addEventListener('click', () => {
        exportFormData();
    });

    importBtn.addEventListener('click', () => {
        importInput.click();
    });

    validateBtn.addEventListener('click', () => {
        validateForm();
    });

    copyBtn.addEventListener('click', () => {
        const preview = document.getElementById('dataPreview');
        navigator.clipboard.writeText(preview.textContent).then(() => {
            showAlert('✓ 数据已复制到剪贴板', 'success');
        }).catch(() => {
            showAlert('✗ 复制失败，请手动复制', 'error');
        });
    });

    formatBtn.addEventListener('click', () => {
        const preview = document.getElementById('dataPreview');
        try {
            const data = JSON.parse(preview.textContent);
            preview.textContent = JSON.stringify(data, null, 2);
            showAlert('✓ 已格式化', 'success');
        } catch (error) {
            showAlert('✗ JSON 格式错误', 'error');
        }
    });

    importInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            importFormData(file);
        }
    });

    // 模态对话框事件
    const modalConfirm = document.getElementById('modalConfirm');
    const modalCancel = document.getElementById('modalCancel');
    const modalClose = document.getElementById('modalClose');

    modalConfirm.addEventListener('click', () => {
        if (window.modalCallback) {
            window.modalCallback(true);
            window.modalCallback = null;
        }
        hideModal();
    });

    modalCancel.addEventListener('click', () => {
        if (window.modalCallback) {
            window.modalCallback(false);
            window.modalCallback = null;
        }
        hideModal();
    });

    modalClose.addEventListener('click', hideModal);
}

async function loadDemoSchema() {
    try {
        const response = await fetch('demo.json');
        const data = await response.json();
        schemaLoader.schemas = data;
        schemaLoader.updateSchemaSelector();
        showAlert('✓ Demo JSON 已加载，请选择一个 Schema', 'info');
    } catch (error) {
        console.warn('Demo JSON 加载失败，请手动上传', error);
    }
}

function loadSchema(schemaName) {
    const schema = schemaLoader.getSchema(schemaName);
    if (!schema) {
        showAlert('✗ Schema 不存在', 'error');
        return;
    }

    schemaLoader.setCurrentSchema(schemaName);
    const container = document.getElementById('formContainer');
    const submitBtn = document.getElementById('submitBtn');
    const resetBtn = document.getElementById('resetBtn');
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const validateBtn = document.getElementById('validateBtn');
    const copyBtn = document.getElementById('copyBtn');
    const formatBtn = document.getElementById('formatBtn');
    const schemaInfo = document.getElementById('schemaInfo');

    // 清空空状态
    container.innerHTML = '';

    formRenderer = new FormRenderer(schema, container, (data) => {
        currentFormData = data;
        updatePreview(data);
        clearValidationErrors();
    });

    formValidator = new FormValidator(schema);
    formRenderer.render();

    // 显示按钮
    submitBtn.style.display = 'block';
    resetBtn.style.display = 'inline-block';
    exportBtn.style.display = 'inline-block';
    importBtn.style.display = 'inline-block';
    validateBtn.style.display = 'inline-block';
    copyBtn.style.display = 'inline-block';
    formatBtn.style.display = 'inline-block';

    // 显示 Schema 信息
    const requiredCount = schema.required ? schema.required.length : 0;
    const propertyCount = Object.keys(schema.properties || {}).length;
    schemaInfo.innerHTML = `
        <div>字段数: <strong>${propertyCount}</strong></div>
        <div>必填: <strong>${requiredCount}</strong></div>
    `;

    showAlert(`✓ 已加载 Schema: ${schema.title || schemaName}`, 'info');
}

function updatePreview(data) {
    const preview = document.getElementById('dataPreview');
    preview.textContent = JSON.stringify(data, null, 2);
}

function validateForm() {
    const formData = formRenderer.getFormData();
    const errors = formValidator.validate(formData);

    if (errors.length === 0) {
        clearValidationErrors();
        showAlert('✓ 表单验证通过！', 'success');
        return true;
    } else {
        showValidationErrors(errors);
        showAlert(`✗ 表单包含 ${errors.length} 个错误`, 'error');
        return false;
    }
}

function showValidationErrors(errors) {
    const errorContainer = document.getElementById('validationErrors');
    const errorMessages = errors.map(e => `• [${e.field}] ${e.message}`).join('\n');
    errorContainer.textContent = errorMessages;
    errorContainer.style.display = 'block';
}

function clearValidationErrors() {
    const errorContainer = document.getElementById('validationErrors');
    errorContainer.style.display = 'none';
    errorContainer.textContent = '';
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

function showModal(title, message, callback) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    modalTitle.textContent = title;
    modalBody.textContent = message;
    window.modalCallback = callback;

    modal.style.display = 'flex';
}

function hideModal() {
    const modal = document.getElementById('modal');
    modal.style.display = 'none';
}

function exportFormData() {
    const formData = formRenderer.getFormData();
    const dataStr = JSON.stringify(formData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    const schemaName = schemaLoader.getCurrentSchemaName();
    link.download = `${schemaName}-${new Date().toISOString().split('T')[0]}.json`;
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

            // 重新渲染表单以填充数据
            const container = document.getElementById('formContainer');
            container.innerHTML = '';

            formRenderer = new FormRenderer(
                schemaLoader.getCurrentSchema(),
                container,
                (newData) => {
                    currentFormData = newData;
                    updatePreview(newData);
                    clearValidationErrors();
                }
            );

            // 手动填充数据
            Object.assign(formRenderer.formData, data);
            formRenderer.render();

            updatePreview(data);
            clearValidationErrors();
            showAlert('✓ 数据导入成功', 'success');
        } catch (error) {
            showAlert(`✗ 导入失败: ${error.message}`, 'error');
        }
    };
    reader.readAsText(file);
}

function resetForm() {
    if (formRenderer) {
        const container = document.getElementById('formContainer');
        container.innerHTML = '';

        formRenderer = new FormRenderer(
            schemaLoader.getCurrentSchema(),
            container,
            (data) => {
                currentFormData = data;
                updatePreview(data);
                clearValidationErrors();
            }
        );

        formRenderer.render();
        updatePreview(formRenderer.formData);
        clearValidationErrors();
        showAlert('✓ 表单已重置', 'info');
    }
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (!formRenderer) return;

        // Ctrl+S: 导出
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            exportFormData();
        }
        // Ctrl+R: 重置（需要确认）
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            showModal('确认重置', '确定要清空所有表单数据吗？', () => {
                resetForm();
            });
        }
        // Ctrl+Shift+I: 导入
        if (e.ctrlKey && e.shiftKey && e.key === 'I') {
            e.preventDefault();
            document.getElementById('importInput').click();
        }
        // Ctrl+Shift+V: 验证
        if (e.ctrlKey && e.shiftKey && e.key === 'V') {
            e.preventDefault();
            validateForm();
        }
    });
}

// 添加动画 CSS
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
window.validateForm = validateForm;

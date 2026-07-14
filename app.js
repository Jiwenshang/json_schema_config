let schemaLoader = null;
let formRenderer = null;
let currentFormData = {};
let apiClient = null;
// 从中台加载的 schema 名 -> {dataId, key}，用于提交时定位 config entry
let remoteSchemaMeta = {};

document.addEventListener('DOMContentLoaded', () => {
    schemaLoader = new SchemaLoader();
    apiClient = new McApiClient();
    initializeEventListeners();
    initializeApiControls();
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
                remoteSchemaMeta = {};
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
        submitToCenter();
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

// ==================== 中台 OpenAPI 对接 ====================

function initializeApiControls() {
    const apiBaseInput = document.getElementById('apiBaseInput');
    const loadRemoteBtn = document.getElementById('loadRemoteBtn');
    const loginBtn = document.getElementById('loginBtn');

    if (!apiBaseInput || !loadRemoteBtn || !loginBtn) {
        return;
    }

    apiBaseInput.value = apiClient.baseURL;
    apiBaseInput.addEventListener('change', () => {
        apiClient.setBaseURL(apiBaseInput.value);
        apiBaseInput.value = apiClient.baseURL;
    });

    loadRemoteBtn.addEventListener('click', () => {
        apiClient.setBaseURL(apiBaseInput.value);
        loadRemoteSchemas();
    });

    loginBtn.addEventListener('click', async () => {
        if (apiClient.isLoggedIn()) {
            apiClient.logout();
            updateAuthStatus();
            showAlert('✓ 已退出登录', 'info');
        } else {
            apiClient.setBaseURL(apiBaseInput.value);
            await showLoginModal();
        }
    });

    updateAuthStatus();
}

function updateAuthStatus() {
    const loginBtn = document.getElementById('loginBtn');
    const authStatus = document.getElementById('authStatus');
    if (!loginBtn || !authStatus) {
        return;
    }
    if (apiClient.isLoggedIn()) {
        loginBtn.textContent = '🚪 登出';
        authStatus.textContent = '已登录';
        authStatus.style.color = '#38a169';
    } else {
        loginBtn.textContent = '🔑 登录';
        authStatus.textContent = '未登录（提交需登录）';
        authStatus.style.color = '#999';
    }
}

async function loadRemoteSchemas() {
    try {
        showLoading(true);
        const schemas = await apiClient.getAllSchemas();
        const names = Object.keys(schemas || {});
        if (names.length === 0) {
            showAlert('中台暂无可用 Schema', 'info');
            return;
        }

        const schemaMap = {};
        remoteSchemaMeta = {};
        names.forEach(name => {
            const cfg = schemas[name];
            const fields = cfg.fields || {};
            if (!fields.title) {
                fields.title = cfg.title || name;
            }
            schemaMap[name] = fields;
            remoteSchemaMeta[name] = { dataId: cfg.data_id, key: cfg.key };
        });

        schemaLoader.schemas = schemaMap;
        schemaLoader.updateSchemaSelector();
        showAlert(`✓ 已从中台加载 ${names.length} 个 Schema，请选择`, 'success');
    } catch (error) {
        showAlert(`✗ 加载中台 Schema 失败: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

// 通用输入弹窗：fields = [{name, label, type, value, placeholder}]
// 确认返回 {name: value}，取消返回 null
function showFormModal(title, fields, confirmText) {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'modal';

        const inputsHtml = fields.map(f => `
            <div style="margin-bottom: 12px;">
                <label style="display: block; margin-bottom: 4px; font-size: 13px; color: #444;">${f.label}</label>
                <input type="${f.type || 'text'}" data-field="${f.name}"
                       value="${f.value || ''}" placeholder="${f.placeholder || ''}"
                       style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
            </div>`).join('');

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    ${inputsHtml}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" data-role="confirm">${confirmText || '确定'}</button>
                    <button class="btn btn-primary" data-role="cancel" style="background-color: #999;">取消</button>
                </div>
            </div>`;

        document.body.appendChild(modal);
        const firstInput = modal.querySelector('input');
        if (firstInput) {
            firstInput.focus();
        }

        const close = (result) => {
            modal.remove();
            resolve(result);
        };
        const collect = () => {
            const result = {};
            modal.querySelectorAll('input[data-field]').forEach(input => {
                result[input.dataset.field] = input.value.trim();
            });
            return result;
        };

        modal.querySelector('[data-role="confirm"]').addEventListener('click', () => close(collect()));
        modal.querySelector('[data-role="cancel"]').addEventListener('click', () => close(null));
        modal.querySelector('.modal-close').addEventListener('click', () => close(null));
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                close(collect());
            } else if (e.key === 'Escape') {
                close(null);
            }
        });
    });
}

// 弹出登录框并执行登录，成功返回 true
async function showLoginModal() {
    const values = await showFormModal('登录中台', [
        { name: 'email', label: '邮箱', type: 'email', placeholder: 'user@example.com' },
        { name: 'password', label: '密码', type: 'password' },
    ], '登录');

    if (!values) {
        return false;
    }
    if (!values.email || !values.password) {
        showAlert('✗ 请输入邮箱和密码', 'error');
        return false;
    }

    try {
        showLoading(true);
        const data = await apiClient.login(values.email, values.password);
        updateAuthStatus();
        showAlert('✓ 登录成功', 'success');
        if (data.must_change_password) {
            showAlert('⚠ 当前为初始密码，请尽快到中台修改', 'info');
        }
        return true;
    } catch (error) {
        showAlert(`✗ 登录失败: ${error.message}`, 'error');
        return false;
    } finally {
        showLoading(false);
    }
}

// 提交表单数据到中台 config entry
async function submitToCenter() {
    if (!formRenderer) {
        return;
    }

    const formData = formRenderer.getFormData();
    const schemaName = schemaLoader.getCurrentSchemaName();

    // 确定 data_id / key：中台加载的 schema 自带；本地文件加载的需要手动指定
    let meta = remoteSchemaMeta[schemaName];
    if (!meta) {
        const values = await showFormModal('指定配置位置（本地 Schema 需手动填写）', [
            { name: 'dataId', label: 'data_id（配置文件名）', value: schemaName || '' },
            { name: 'key', label: 'key（配置 Key）', placeholder: 'default' },
        ], '继续提交');
        if (!values) {
            return;
        }
        if (!values.dataId || !values.key) {
            showAlert('✗ data_id 和 key 不能为空', 'error');
            return;
        }
        meta = { dataId: values.dataId, key: values.key };
    }

    if (!apiClient.isLoggedIn()) {
        const ok = await showLoginModal();
        if (!ok) {
            return;
        }
    }

    try {
        showLoading(true);
        const { entry, created } = await apiClient.saveEntry(meta.dataId, meta.key, formData);
        showLoading(false);
        showAlert(`✓ ${created ? '创建' : '更新'}成功: ${meta.dataId}/${meta.key}（状态: ${entry.status}）`, 'success');

        if (confirm('草稿已保存到中台，是否立即发布？')) {
            showLoading(true);
            const published = await apiClient.publishEntry(meta.dataId, meta.key);
            showLoading(false);
            showAlert(`✓ 已发布: ${meta.dataId}/${meta.key}（版本: ${published.published_version}）`, 'success');
        }
    } catch (error) {
        showLoading(false);
        if (error.authRequired) {
            updateAuthStatus();
            const ok = await showLoginModal();
            if (ok) {
                return submitToCenter();
            }
            return;
        }
        if (error.status === 422) {
            showAlert('✗ 提交失败: 表单数据不符合中台 Schema 校验，请检查必填项', 'error');
        } else if (error.status === 404) {
            showAlert(`✗ 提交失败: 中台不存在该 Schema (${meta.dataId}/${meta.key})`, 'error');
        } else {
            showAlert(`✗ 提交失败: ${error.message}`, 'error');
        }
    }
}

// 图片直传：登录 → 拿 STS 凭证（后端校验 fieldPath 确为图片字段）→ SigV4 直传 S3，返回 S3 key
async function uploadImageToS3(meta, file, fieldPath) {
    const ext = ((file.name || '').split('.').pop() || '').toLowerCase();
    const format = ['png', 'jpg', 'jpeg', 'webp'].includes(ext) ? ext : null;
    if (!format) {
        throw new Error('仅支持 png / jpg / jpeg / webp 图片');
    }
    if (!apiClient.isLoggedIn()) {
        const ok = await showLoginModal();
        if (!ok) {
            throw new Error('上传图片需要先登录中台');
        }
    }
    let creds;
    try {
        creds = await apiClient.issueImageUploadToken(meta.dataId, meta.key, fieldPath, format);
    } catch (err) {
        if (err.authRequired) {
            updateAuthStatus();
            const ok = await showLoginModal();
            if (!ok) throw new Error('上传图片需要先登录中台');
            creds = await apiClient.issueImageUploadToken(meta.dataId, meta.key, fieldPath, format);
        } else if (err.status === 400) {
            throw new Error(`该字段未被中台识别为图片字段（${fieldPath}）：${err.message}`);
        } else {
            throw err;
        }
    }
    return S3DirectUploader.put(creds, file);
}

// ==================== 中台 OpenAPI 对接结束 ====================

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

    // 中台加载的 schema 自带 data_id/key：注入图片直传器，选图后走
    // upload-token → S3 直传 → 字段存 S3 key；本地 schema 无处签发凭证，保持 base64
    const meta = remoteSchemaMeta[schemaName];
    if (meta && meta.dataId && meta.key) {
        formRenderer.setImageUploader((file, fieldPath) => uploadImageToS3(meta, file, fieldPath));
    }

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

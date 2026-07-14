// 中台（tripo-marketing-center）OpenAPI 客户端
// 接口约定见 tripo-marketing-center/internal/router/router.go。
// 同一配置位 (data_id, key) 允许多条数据，单条操作走 items/:id：
//   POST /auth/login                                          登录换取 JWT（响应 {code, msg, data:{token}}）
//   GET  /v2/marketing/config/schema                          获取所有配置 Schema（公开，无需认证）
//   GET  /v2/marketing/config/entry/:data_id/:key             列出该配置位全部条目（需认证）
//   POST /v2/marketing/config/entry/:data_id/:key             新建一条配置条目（需认证，每次都是新条目）
//   PUT  /v2/marketing/config/entry/:data_id/:key/items/:id   更新指定条目草稿（需认证）
//   POST /v2/marketing/config/entry/:data_id/:key/items/:id/publish 发布指定条目（需认证）
class McApiClient {
    constructor() {
        this.baseURL = localStorage.getItem('mc_api_base') || 'http://localhost:8080';
        this.token = localStorage.getItem('mc_token') || null;
    }

    setBaseURL(url) {
        this.baseURL = (url || '').trim().replace(/\/+$/, '') || 'http://localhost:8080';
        localStorage.setItem('mc_api_base', this.baseURL);
    }

    isLoggedIn() {
        return !!this.token;
    }

    logout() {
        this.token = null;
        localStorage.removeItem('mc_token');
    }

    entryPath(dataId, key, suffix = '') {
        return `/v2/marketing/config/entry/${encodeURIComponent(dataId)}/${encodeURIComponent(key)}${suffix}`;
    }

    async request(method, path, body) {
        const headers = { 'Content-Type': 'application/json' };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        let resp;
        try {
            resp = await fetch(this.baseURL + path, {
                method,
                headers,
                body: body !== undefined ? JSON.stringify(body) : undefined,
            });
        } catch (e) {
            throw new Error(`无法连接中台 (${this.baseURL})，请检查地址和服务状态`);
        }

        if (resp.status === 401) {
            this.logout();
            let msg = '未登录或登录已失效，请重新登录';
            try {
                const data = await resp.json();
                if (data && data.msg) {
                    msg = data.msg;
                }
            } catch (e) {
                // 忽略响应体解析失败，使用默认提示
            }
            const err = new Error(msg);
            err.authRequired = true;
            throw err;
        }

        if (resp.status === 204) {
            return null;
        }

        let data = null;
        try {
            data = await resp.json();
        } catch (e) {
            // 响应体非 JSON（如网关错误页），下面按状态码报错
        }

        if (!resp.ok) {
            const msg = (data && (data.error || data.msg)) || `HTTP ${resp.status}`;
            const err = new Error(msg);
            err.status = resp.status;
            err.data = data;
            throw err;
        }

        return data;
    }

    async login(email, password) {
        const resp = await this.request('POST', '/auth/login', { email, password });
        if (!resp || resp.code !== 0 || !resp.data || !resp.data.token) {
            throw new Error((resp && resp.msg) || '登录失败');
        }
        this.token = resp.data.token;
        localStorage.setItem('mc_token', this.token);
        return resp.data;
    }

    // 返回 { "data_id:key": {data_id, key, title, description, fields, updated_at}, ... }
    getAllSchemas() {
        return this.request('GET', '/v2/marketing/config/schema');
    }

    itemPath(dataId, key, id, suffix = '') {
        return this.entryPath(dataId, key, `/items/${id}${suffix}`);
    }

    // 列出该配置位下全部条目，返回 {total, entries: [...]}；无条目时 entries 为空数组
    async listEntries(dataId, key) {
        const resp = await this.request('GET', this.entryPath(dataId, key));
        return (resp && resp.entries) || [];
    }

    createEntry(dataId, key, payload) {
        return this.request('POST', this.entryPath(dataId, key), payload);
    }

    updateEntry(dataId, key, entryId, payload) {
        return this.request('PUT', this.itemPath(dataId, key, entryId), payload);
    }

    publishEntry(dataId, key, entryId) {
        return this.request('POST', this.itemPath(dataId, key, entryId, '/publish'));
    }

    // 签发图片直传 S3 的 STS 临时凭证（image srv）。
    // path 为字段在 payload 中的路径（可带数组下标，如 sub_options[2].icon）；
    // format 为 png|jpg|jpeg|webp。返回 {access_key_id, secret_access_key,
    // session_token, region, bucket, key}，直传成功后把 key 写入字段值。
    issueImageUploadToken(dataId, key, path, format) {
        return this.request('POST', this.entryPath(dataId, key, '/image/upload-token'), { path, format });
    }

}

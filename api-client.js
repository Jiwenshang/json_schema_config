// 中台（tripo-marketing-center）OpenAPI 客户端
// 接口约定见 tripo-marketing-center/internal/router/router.go：
//   POST /auth/login                                    登录换取 JWT（响应 {code, msg, data:{token}}）
//   GET  /v2/marketing/config/schema                    获取所有配置 Schema（公开，无需认证）
//   GET  /v2/marketing/config/entry/:data_id/:key       获取配置条目（需认证）
//   POST /v2/marketing/config/entry/:data_id/:key       创建配置条目（需认证）
//   PUT  /v2/marketing/config/entry/:data_id/:key       更新配置条目草稿（需认证）
//   POST /v2/marketing/config/entry/:data_id/:key/publish 发布配置条目（需认证）
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

    async getEntry(dataId, key) {
        try {
            return await this.request('GET', this.entryPath(dataId, key));
        } catch (e) {
            if (e.status === 404) {
                return null;
            }
            throw e;
        }
    }

    createEntry(dataId, key, payload) {
        return this.request('POST', this.entryPath(dataId, key), payload);
    }

    updateEntry(dataId, key, payload) {
        return this.request('PUT', this.entryPath(dataId, key), payload);
    }

    publishEntry(dataId, key) {
        return this.request('POST', this.entryPath(dataId, key, '/publish'));
    }

    // 存在则更新草稿，不存在则创建
    async saveEntry(dataId, key, payload) {
        const existing = await this.getEntry(dataId, key);
        if (existing) {
            const entry = await this.updateEntry(dataId, key, payload);
            return { entry, created: false };
        }
        const entry = await this.createEntry(dataId, key, payload);
        return { entry, created: true };
    }
}

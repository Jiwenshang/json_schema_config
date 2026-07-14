// S3 浏览器直传（AWS Signature V4，WebCrypto 实现，无 SDK 依赖）
// 配合中台 image srv：POST .../image/upload-token 签发的 STS 临时凭证只允许
// PUT 单个确定 key，本模块负责用该凭证把文件直传到 S3。
//
// 用法：
//   const key = await S3DirectUploader.put(tokenResult, file);
//   tokenResult 即中台接口原样返回：
//   { access_key_id, secret_access_key, session_token, region, bucket, key }
const S3DirectUploader = (() => {
    const enc = new TextEncoder();

    async function sha256Hex(data) {
        const buf = await crypto.subtle.digest('SHA-256', typeof data === 'string' ? enc.encode(data) : data);
        return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async function hmac(keyBytes, msg) {
        const cryptoKey = await crypto.subtle.importKey(
            'raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
        return new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(msg)));
    }

    // SigV4 密钥派生链：AWS4+secret → date → region → service → aws4_request
    async function signingKey(secret, dateStamp, region) {
        let k = enc.encode('AWS4' + secret);
        for (const part of [dateStamp, region, 's3', 'aws4_request']) {
            k = await hmac(k, part);
        }
        return k;
    }

    // S3 canonical URI：按段 percent-encode，保留 '/'
    function canonicalUri(key) {
        return '/' + key.split('/').map(seg =>
            encodeURIComponent(seg).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase())
        ).join('/');
    }

    async function put(creds, file) {
        const { access_key_id, secret_access_key, session_token, region, bucket, key } = creds;
        if (!access_key_id || !secret_access_key || !session_token || !region || !bucket || !key) {
            throw new Error('上传凭证不完整');
        }

        const host = `${bucket}.s3.${region}.amazonaws.com`;
        const uri = canonicalUri(key);
        const url = `https://${host}${uri}`;

        const now = new Date();
        const amzDate = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); // 20260101T000000Z
        const dateStamp = amzDate.slice(0, 8);
        const contentType = file.type || 'application/octet-stream';
        const payloadHash = 'UNSIGNED-PAYLOAD'; // HTTPS 下 S3 允许不签名 body，免去对大文件做 SHA-256

        const headers = {
            'content-type': contentType,
            'host': host,
            'x-amz-content-sha256': payloadHash,
            'x-amz-date': amzDate,
            'x-amz-security-token': session_token,
        };
        const signedHeaderNames = Object.keys(headers).sort();
        const canonicalHeaders = signedHeaderNames.map(h => `${h}:${headers[h]}\n`).join('');
        const signedHeaders = signedHeaderNames.join(';');

        const canonicalRequest = ['PUT', uri, '', canonicalHeaders, signedHeaders, payloadHash].join('\n');
        const scope = `${dateStamp}/${region}/s3/aws4_request`;
        const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, await sha256Hex(canonicalRequest)].join('\n');
        const sigKey = await signingKey(secret_access_key, dateStamp, region);
        const signature = [...await hmac(sigKey, stringToSign)].map(b => b.toString(16).padStart(2, '0')).join('');

        const resp = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': contentType,
                'x-amz-content-sha256': payloadHash,
                'x-amz-date': amzDate,
                'x-amz-security-token': session_token,
                'Authorization': `AWS4-HMAC-SHA256 Credential=${access_key_id}/${scope}, ` +
                    `SignedHeaders=${signedHeaders}, Signature=${signature}`,
            },
            body: file,
        });

        if (!resp.ok) {
            const text = await resp.text().catch(() => '');
            const codeMatch = text.match(/<Code>([^<]+)<\/Code>/);
            throw new Error(`S3 直传失败 (HTTP ${resp.status}${codeMatch ? ' ' + codeMatch[1] : ''})`);
        }
        return key;
    }

    return { put };
})();

class FormValidator {
    constructor(schema) {
        this.schema = schema;
        this.errors = [];
    }

    validate(data) {
        this.errors = [];
        this.validateObject(data, this.schema.properties, this.schema.required || []);
        return this.errors;
    }

    validateObject(data, properties, required) {
        if (!properties) return;

        Object.keys(properties).forEach(key => {
            const property = properties[key];
            const value = data[key];
            const isRequired = required.includes(key);

            if (isRequired && (value === undefined || value === null || value === '')) {
                this.errors.push({
                    field: key,
                    message: `${property.description || key} 是必填字段`
                });
            }

            if (value !== undefined && value !== null && value !== '') {
                this.validateProperty(key, value, property);
            }
        });
    }

    validateProperty(key, value, property) {
        // 验证字符串长度
        if (property.type === 'string') {
            if (property.minLength && value.length < property.minLength) {
                this.errors.push({
                    field: key,
                    message: `${property.description || key} 最少需要 ${property.minLength} 个字符`
                });
            }
            if (property.maxLength && value.length > property.maxLength) {
                this.errors.push({
                    field: key,
                    message: `${property.description || key} 最多只能 ${property.maxLength} 个字符`
                });
            }
            if (property.format === 'uri') {
                try {
                    new URL(value);
                } catch {
                    this.errors.push({
                        field: key,
                        message: `${property.description || key} 必须是有效的 URL`
                    });
                }
            }
        }

        // 验证数组
        if (property.type === 'array') {
            if (!Array.isArray(value)) {
                this.errors.push({
                    field: key,
                    message: `${property.description || key} 必须是数组`
                });
            } else {
                if (property.minItems && value.length < property.minItems) {
                    this.errors.push({
                        field: key,
                        message: `${property.description || key} 最少需要 ${property.minItems} 项`
                    });
                }
                if (property.maxItems && value.length > property.maxItems) {
                    this.errors.push({
                        field: key,
                        message: `${property.description || key} 最多只能 ${property.maxItems} 项`
                    });
                }
                if (property.uniqueItems && new Set(value.map(JSON.stringify)).size !== value.length) {
                    this.errors.push({
                        field: key,
                        message: `${property.description || key} 中存在重复项`
                    });
                }
            }
        }

        // 验证枚举值
        if (property.enum && !property.enum.includes(value)) {
            this.errors.push({
                field: key,
                message: `${property.description || key} 的值必须是以下之一: ${property.enum.join(', ')}`
            });
        }

        // 验证数字范围
        if (property.type === 'number') {
            if (property.minimum !== undefined && value < property.minimum) {
                this.errors.push({
                    field: key,
                    message: `${property.description || key} 必须大于等于 ${property.minimum}`
                });
            }
            if (property.maximum !== undefined && value > property.maximum) {
                this.errors.push({
                    field: key,
                    message: `${property.description || key} 必须小于等于 ${property.maximum}`
                });
            }
        }
    }

    getErrorsByField(field) {
        return this.errors.filter(e => e.field === field);
    }

    hasErrors() {
        return this.errors.length > 0;
    }

    getErrorCount() {
        return this.errors.length;
    }

    getErrorMessage() {
        if (this.errors.length === 0) return '';
        return this.errors.map(e => `• ${e.message}`).join('\n');
    }
}

class FormValueValidator {
    static isValidEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    static isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    static isValidDate(date) {
        return !isNaN(Date.parse(date));
    }

    static isValidPhone(phone) {
        const regex = /^[\d\-\(\)\+\s]+$/;
        return regex.test(phone) && phone.length >= 7;
    }

    static isValidCreditCard(card) {
        const digits = card.replace(/\D/g, '');
        if (digits.length < 13 || digits.length > 19) return false;

        let sum = 0;
        for (let i = 0; i < digits.length; i++) {
            let digit = parseInt(digits[digits.length - 1 - i]);
            if (i % 2 === 1) {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }
            sum += digit;
        }
        return sum % 10 === 0;
    }
}

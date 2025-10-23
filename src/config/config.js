class Config {
    constructor() {
        this.config = {
            bot: {
                name: process.env.BOT_NAME || 'Advanced WhatsApp Bot',
                version: process.env.BOT_VERSION || '1.0.0',
                adminPhone: process.env.ADMIN_PHONE_NUMBER,
                adminPassword: process.env.ADMIN_PASSWORD || 'admin123'
            },
            server: {
                port: process.env.PORT || 3000,
                nodeEnv: process.env.NODE_ENV || 'development'
            },
            database: {
                path: process.env.DB_PATH || './data/bot.db'
            },
            features: {
                autoReply: process.env.ENABLE_AUTO_REPLY === 'true',
                scheduledMessages: process.env.ENABLE_SCHEDULED_MESSAGES === 'true',
                fileHandling: process.env.ENABLE_FILE_HANDLING === 'true',
                groupManagement: process.env.ENABLE_GROUP_MANAGEMENT === 'true',
                adminPanel: process.env.ENABLE_ADMIN_PANEL === 'true'
            },
            apis: {
                openai: process.env.OPENAI_API_KEY,
                weather: process.env.WEATHER_API_KEY
            },
            rateLimit: {
                windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
                maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
            }
        };
    }

    get(key) {
        const keys = key.split('.');
        let value = this.config;
        
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return undefined;
            }
        }
        
        return value;
    }

    set(key, value) {
        const keys = key.split('.');
        let current = this.config;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const k = keys[i];
            if (!(k in current) || typeof current[k] !== 'object') {
                current[k] = {};
            }
            current = current[k];
        }
        
        current[keys[keys.length - 1]] = value;
    }

    getAll() {
        return this.config;
    }

    // Validate configuration
    validate() {
        const errors = [];
        
        // Check required environment variables
        if (!process.env.ADMIN_PHONE_NUMBER) {
            errors.push('ADMIN_PHONE_NUMBER environment variable is required');
        }
        
        // Check feature dependencies
        if (this.config.features.autoReply && !this.config.database.path) {
            errors.push('Database path is required for auto-reply feature');
        }
        
        if (this.config.features.scheduledMessages && !this.config.database.path) {
            errors.push('Database path is required for scheduled messages feature');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // Get configuration for admin panel
    getAdminConfig() {
        return {
            bot: this.config.bot,
            features: this.config.features,
            server: {
                port: this.config.server.port,
                nodeEnv: this.config.server.nodeEnv
            }
        };
    }
}

module.exports = Config;
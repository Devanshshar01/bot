const winston = require('winston');
const path = require('path');
const fs = require('fs-extra');

class Logger {
    constructor() {
        // Ensure logs directory exists
        const logsDir = path.join(__dirname, '../../logs');
        fs.ensureDirSync(logsDir);
        
        this.logger = winston.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: winston.format.combine(
                winston.format.timestamp({
                    format: 'YYYY-MM-DD HH:mm:ss'
                }),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            defaultMeta: { service: 'whatsapp-bot' },
            transports: [
                // Write all logs with level 'error' and below to error.log
                new winston.transports.File({
                    filename: path.join(logsDir, 'error.log'),
                    level: 'error',
                    maxsize: 5242880, // 5MB
                    maxFiles: 5
                }),
                // Write all logs with level 'info' and below to combined.log
                new winston.transports.File({
                    filename: path.join(logsDir, 'combined.log'),
                    maxsize: 5242880, // 5MB
                    maxFiles: 5
                })
            ]
        });

        // If we're not in production, log to the console as well
        if (process.env.NODE_ENV !== 'production') {
            this.logger.add(new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.simple()
                )
            }));
        }
    }

    info(message, meta = {}) {
        this.logger.info(message, meta);
    }

    error(message, meta = {}) {
        this.logger.error(message, meta);
    }

    warn(message, meta = {}) {
        this.logger.warn(message, meta);
    }

    debug(message, meta = {}) {
        this.logger.debug(message, meta);
    }

    // Get recent logs
    async getRecentLogs(level = 'info', limit = 100) {
        try {
            const logFile = level === 'error' ? 'error.log' : 'combined.log';
            const logPath = path.join(__dirname, '../../logs', logFile);
            
            if (!await fs.pathExists(logPath)) {
                return [];
            }
            
            const content = await fs.readFile(logPath, 'utf8');
            const lines = content.trim().split('\n').filter(line => line.trim());
            
            return lines
                .slice(-limit)
                .map(line => {
                    try {
                        return JSON.parse(line);
                    } catch (e) {
                        return { message: line, timestamp: new Date().toISOString() };
                    }
                });
        } catch (error) {
            this.error('Failed to get recent logs:', error);
            return [];
        }
    }
}

module.exports = Logger;
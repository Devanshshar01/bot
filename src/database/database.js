const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs-extra');

class Database {
    constructor() {
        this.dbPath = process.env.DB_PATH || './data/bot.db';
        this.db = null;
    }

    async initialize() {
        try {
            // Ensure data directory exists
            await fs.ensureDir(path.dirname(this.dbPath));
            
            this.db = new sqlite3.Database(this.dbPath);
            
            await this.createTables();
            this.logger.info('Database initialized successfully');
        } catch (error) {
            console.error('Database initialization failed:', error);
            throw error;
        }
    }

    createTables() {
        return new Promise((resolve, reject) => {
            const tables = [
                // Users table
                `CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    phone_number TEXT UNIQUE NOT NULL,
                    name TEXT,
                    is_admin BOOLEAN DEFAULT 0,
                    is_blocked BOOLEAN DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
                )`,
                
                // Messages table
                `CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    chat_id TEXT,
                    message_id TEXT,
                    content TEXT,
                    message_type TEXT DEFAULT 'text',
                    is_from_bot BOOLEAN DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )`,
                
                // Auto-replies table
                `CREATE TABLE IF NOT EXISTS auto_replies (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    trigger_text TEXT NOT NULL,
                    reply_text TEXT NOT NULL,
                    is_active BOOLEAN DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`,
                
                // Scheduled messages table
                `CREATE TABLE IF NOT EXISTS scheduled_messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    chat_id TEXT NOT NULL,
                    message TEXT NOT NULL,
                    scheduled_time DATETIME NOT NULL,
                    is_sent BOOLEAN DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`,
                
                // Bot settings table
                `CREATE TABLE IF NOT EXISTS bot_settings (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`,
                
                // Commands table
                `CREATE TABLE IF NOT EXISTS commands (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    command TEXT UNIQUE NOT NULL,
                    description TEXT,
                    handler_function TEXT NOT NULL,
                    is_active BOOLEAN DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`
            ];

            let completed = 0;
            tables.forEach((sql, index) => {
                this.db.run(sql, (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    completed++;
                    if (completed === tables.length) {
                        resolve();
                    }
                });
            });
        });
    }

    // User management
    async addUser(phoneNumber, name = null, isAdmin = false) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT OR REPLACE INTO users (phone_number, name, is_admin) VALUES (?, ?, ?)`;
            this.db.run(sql, [phoneNumber, name, isAdmin], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    async getUser(phoneNumber) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM users WHERE phone_number = ?`;
            this.db.get(sql, [phoneNumber], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    async updateUserLastSeen(phoneNumber) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE phone_number = ?`;
            this.db.run(sql, [phoneNumber], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    // Message logging
    async logMessage(userId, chatId, messageId, content, messageType = 'text', isFromBot = false) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO messages (user_id, chat_id, message_id, content, message_type, is_from_bot) VALUES (?, ?, ?, ?, ?, ?)`;
            this.db.run(sql, [userId, chatId, messageId, content, messageType, isFromBot], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    // Auto-replies
    async addAutoReply(triggerText, replyText) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO auto_replies (trigger_text, reply_text) VALUES (?, ?)`;
            this.db.run(sql, [triggerText, replyText], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    async getAutoReplies() {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM auto_replies WHERE is_active = 1`;
            this.db.all(sql, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Scheduled messages
    async addScheduledMessage(chatId, message, scheduledTime) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO scheduled_messages (chat_id, message, scheduled_time) VALUES (?, ?, ?)`;
            this.db.run(sql, [chatId, message, scheduledTime], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    async getPendingScheduledMessages() {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM scheduled_messages WHERE is_sent = 0 AND scheduled_time <= CURRENT_TIMESTAMP`;
            this.db.all(sql, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async markScheduledMessageAsSent(id) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE scheduled_messages SET is_sent = 1 WHERE id = ?`;
            this.db.run(sql, [id], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    // Bot settings
    async setSetting(key, value) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT OR REPLACE INTO bot_settings (key, value) VALUES (?, ?)`;
            this.db.run(sql, [key, value], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    async getSetting(key, defaultValue = null) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT value FROM bot_settings WHERE key = ?`;
            this.db.get(sql, [key], (err, row) => {
                if (err) reject(err);
                else resolve(row ? row.value : defaultValue);
            });
        });
    }

    // Commands
    async addCommand(command, description, handlerFunction) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT OR REPLACE INTO commands (command, description, handler_function) VALUES (?, ?, ?)`;
            this.db.run(sql, [command, description, handlerFunction], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    async getCommands() {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM commands WHERE is_active = 1`;
            this.db.all(sql, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Statistics
    async getStats() {
        return new Promise((resolve, reject) => {
            const queries = [
                'SELECT COUNT(*) as total_users FROM users',
                'SELECT COUNT(*) as total_messages FROM messages',
                'SELECT COUNT(*) as auto_replies FROM auto_replies WHERE is_active = 1',
                'SELECT COUNT(*) as scheduled_messages FROM scheduled_messages WHERE is_sent = 0'
            ];

            const stats = {};
            let completed = 0;

            queries.forEach((query, index) => {
                this.db.get(query, [], (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    const key = Object.keys(row)[0];
                    stats[key] = row[key];
                    completed++;
                    
                    if (completed === queries.length) {
                        resolve(stats);
                    }
                });
            });
        });
    }

    close() {
        if (this.db) {
            this.db.close();
        }
    }
}

module.exports = Database;
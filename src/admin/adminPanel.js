const express = require('express');
const path = require('path');
const fs = require('fs-extra');

class AdminPanel {
    constructor(bot) {
        this.bot = bot;
        this.router = express.Router();
    }

    setup() {
        // Serve static files
        this.bot.app.use('/admin', express.static(path.join(__dirname, '../public/admin')));
        
        // API routes
        this.setupApiRoutes();
        
        // Serve admin panel HTML
        this.bot.app.get('/admin', (req, res) => {
            res.sendFile(path.join(__dirname, '../public/admin/index.html'));
        });
    }

    setupApiRoutes() {
        // Get bot status
        this.bot.app.get('/api/admin/status', async (req, res) => {
            try {
                const stats = await this.bot.db.getStats();
                res.json({
                    status: this.bot.isReady ? 'ready' : 'disconnected',
                    uptime: process.uptime(),
                    memoryUsage: process.memoryUsage(),
                    stats: stats
                });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Get all chats
        this.bot.app.get('/api/admin/chats', async (req, res) => {
            try {
                const chats = await this.bot.client.getChats();
                const chatData = chats.map(chat => ({
                    id: chat.id._serialized,
                    name: chat.name,
                    isGroup: chat.isGroup,
                    unreadCount: chat.unreadCount,
                    lastMessage: chat.lastMessage ? {
                        body: chat.lastMessage.body,
                        timestamp: chat.lastMessage.timestamp
                    } : null
                }));
                res.json(chatData);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Get users
        this.bot.app.get('/api/admin/users', async (req, res) => {
            try {
                // This would require implementing a getUsers method in the database
                res.json([]);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Get auto-replies
        this.bot.app.get('/api/admin/auto-replies', async (req, res) => {
            try {
                const autoReplies = await this.bot.db.getAutoReplies();
                res.json(autoReplies);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Add auto-reply
        this.bot.app.post('/api/admin/auto-replies', async (req, res) => {
            try {
                const { trigger, reply } = req.body;
                if (!trigger || !reply) {
                    return res.status(400).json({ error: 'Trigger and reply are required' });
                }
                
                await this.bot.db.addAutoReply(trigger, reply);
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Get scheduled messages
        this.bot.app.get('/api/admin/scheduled-messages', async (req, res) => {
            try {
                // This would require implementing a getScheduledMessages method
                res.json([]);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Schedule message
        this.bot.app.post('/api/admin/schedule-message', async (req, res) => {
            try {
                const { chatId, message, scheduledTime } = req.body;
                if (!chatId || !message || !scheduledTime) {
                    return res.status(400).json({ error: 'Chat ID, message, and scheduled time are required' });
                }
                
                await this.bot.db.addScheduledMessage(chatId, message, new Date(scheduledTime));
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Send message
        this.bot.app.post('/api/admin/send-message', async (req, res) => {
            try {
                const { chatId, message } = req.body;
                if (!chatId || !message) {
                    return res.status(400).json({ error: 'Chat ID and message are required' });
                }
                
                await this.bot.sendMessage(chatId, message);
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Broadcast message
        this.bot.app.post('/api/admin/broadcast', async (req, res) => {
            try {
                const { message } = req.body;
                if (!message) {
                    return res.status(400).json({ error: 'Message is required' });
                }
                
                const result = await this.bot.automationManager.broadcastMessage(message);
                res.json({ success: true, result });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Get bot settings
        this.bot.app.get('/api/admin/settings', async (req, res) => {
            try {
                const settings = {
                    botName: process.env.BOT_NAME || 'Advanced WhatsApp Bot',
                    botVersion: process.env.BOT_VERSION || '1.0.0',
                    enableAutoReply: process.env.ENABLE_AUTO_REPLY === 'true',
                    enableScheduledMessages: process.env.ENABLE_SCHEDULED_MESSAGES === 'true',
                    enableFileHandling: process.env.ENABLE_FILE_HANDLING === 'true',
                    enableGroupManagement: process.env.ENABLE_GROUP_MANAGEMENT === 'true',
                    enableAdminPanel: process.env.ENABLE_ADMIN_PANEL === 'true'
                };
                res.json(settings);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Update bot settings
        this.bot.app.post('/api/admin/settings', async (req, res) => {
            try {
                const { key, value } = req.body;
                if (!key || value === undefined) {
                    return res.status(400).json({ error: 'Key and value are required' });
                }
                
                await this.bot.db.setSetting(key, value);
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Get logs
        this.bot.app.get('/api/admin/logs', async (req, res) => {
            try {
                const { level = 'info', limit = 100 } = req.query;
                // This would require implementing a getLogs method
                res.json([]);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Restart bot
        this.bot.app.post('/api/admin/restart', async (req, res) => {
            try {
                res.json({ success: true, message: 'Bot restart initiated' });
                setTimeout(() => {
                    process.exit(0);
                }, 1000);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }
}

module.exports = AdminPanel;
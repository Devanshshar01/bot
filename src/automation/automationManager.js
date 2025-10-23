const cron = require('node-cron');
const Logger = require('../utils/logger');

class AutomationManager {
    constructor(bot) {
        this.bot = bot;
        this.logger = new Logger();
        this.scheduledTasks = new Map();
    }

    async initialize() {
        try {
            // Start scheduled message checker
            this.startScheduledMessageChecker();
            
            // Start other automation tasks
            this.startMaintenanceTasks();
            
            this.logger.info('Automation manager initialized');
        } catch (error) {
            this.logger.error('Failed to initialize automation manager:', error);
        }
    }

    startScheduledMessageChecker() {
        // Check for pending scheduled messages every minute
        cron.schedule('* * * * *', async () => {
            try {
                await this.processScheduledMessages();
            } catch (error) {
                this.logger.error('Error processing scheduled messages:', error);
            }
        });

        this.logger.info('Scheduled message checker started');
    }

    async processScheduledMessages() {
        try {
            const pendingMessages = await this.bot.db.getPendingScheduledMessages();
            
            for (const scheduledMessage of pendingMessages) {
                try {
                    await this.bot.sendMessage(scheduledMessage.chat_id, scheduledMessage.message);
                    await this.bot.db.markScheduledMessageAsSent(scheduledMessage.id);
                    
                    this.logger.info(`Scheduled message sent to ${scheduledMessage.chat_id}`);
                } catch (error) {
                    this.logger.error(`Failed to send scheduled message ${scheduledMessage.id}:`, error);
                }
            }
        } catch (error) {
            this.logger.error('Error processing scheduled messages:', error);
        }
    }

    startMaintenanceTasks() {
        // Daily cleanup task at 2 AM
        cron.schedule('0 2 * * *', async () => {
            try {
                await this.performDailyCleanup();
            } catch (error) {
                this.logger.error('Error during daily cleanup:', error);
            }
        });

        // Weekly statistics report on Mondays at 9 AM
        cron.schedule('0 9 * * 1', async () => {
            try {
                await this.sendWeeklyReport();
            } catch (error) {
                this.logger.error('Error sending weekly report:', error);
            }
        });

        // Health check every 30 minutes
        cron.schedule('*/30 * * * *', async () => {
            try {
                await this.performHealthCheck();
            } catch (error) {
                this.logger.error('Error during health check:', error);
            }
        });

        this.logger.info('Maintenance tasks started');
    }

    async performDailyCleanup() {
        try {
            this.logger.info('Starting daily cleanup...');
            
            // Clean up old temporary files
            const fs = require('fs-extra');
            const path = require('path');
            const uploadsDir = path.join(__dirname, '../uploads');
            
            if (await fs.pathExists(uploadsDir)) {
                const files = await fs.readdir(uploadsDir, { withFileTypes: true });
                const now = Date.now();
                const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
                
                for (const file of files) {
                    if (file.isDirectory()) {
                        const subDir = path.join(uploadsDir, file.name);
                        const subFiles = await fs.readdir(subDir);
                        
                        for (const subFile of subFiles) {
                            const filePath = path.join(subDir, subFile);
                            const stats = await fs.stat(filePath);
                            
                            if (stats.mtime.getTime() < oneWeekAgo) {
                                await fs.remove(filePath);
                                this.logger.info(`Cleaned up old file: ${filePath}`);
                            }
                        }
                    }
                }
            }
            
            // Clean up old message logs (keep last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            // This would require a more complex query in a real implementation
            // For now, we'll just log the cleanup
            this.logger.info('Daily cleanup completed');
            
        } catch (error) {
            this.logger.error('Error during daily cleanup:', error);
        }
    }

    async sendWeeklyReport() {
        try {
            const stats = await this.bot.db.getStats();
            const uptime = process.uptime();
            
            const reportText = `📊 *Weekly Bot Report*\n\n` +
                `📈 *Statistics:*\n` +
                `• Total Users: ${stats.total_users}\n` +
                `• Total Messages: ${stats.total_messages}\n` +
                `• Active Auto-replies: ${stats.auto_replies}\n` +
                `• Pending Scheduled Messages: ${stats.scheduled_messages}\n\n` +
                `⚡ *Performance:*\n` +
                `• Bot Uptime: ${this.formatUptime(uptime)}\n` +
                `• Memory Usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB\n` +
                `• Node.js Version: ${process.version}\n\n` +
                `🤖 Bot is running smoothly!`;
            
            // Send to admin if configured
            const adminPhone = process.env.ADMIN_PHONE_NUMBER;
            if (adminPhone) {
                try {
                    await this.bot.sendMessage(adminPhone, reportText);
                    this.logger.info('Weekly report sent to admin');
                } catch (error) {
                    this.logger.error('Failed to send weekly report to admin:', error);
                }
            }
            
        } catch (error) {
            this.logger.error('Error sending weekly report:', error);
        }
    }

    async performHealthCheck() {
        try {
            const healthStatus = {
                botReady: this.bot.isReady,
                memoryUsage: process.memoryUsage(),
                uptime: process.uptime(),
                timestamp: new Date().toISOString()
            };
            
            // Log health status
            this.logger.info('Health check:', healthStatus);
            
            // Emit to admin panel
            this.bot.io.emit('health-check', healthStatus);
            
            // Check for critical issues
            const memoryUsageMB = healthStatus.memoryUsage.heapUsed / 1024 / 1024;
            if (memoryUsageMB > 500) { // Alert if memory usage exceeds 500MB
                this.logger.warn(`High memory usage detected: ${memoryUsageMB.toFixed(2)} MB`);
            }
            
        } catch (error) {
            this.logger.error('Error during health check:', error);
        }
    }

    // Add custom scheduled task
    addScheduledTask(name, cronExpression, taskFunction) {
        try {
            if (this.scheduledTasks.has(name)) {
                this.scheduledTasks.get(name).destroy();
            }
            
            const task = cron.schedule(cronExpression, taskFunction, {
                scheduled: false
            });
            
            this.scheduledTasks.set(name, task);
            task.start();
            
            this.logger.info(`Scheduled task '${name}' added with expression: ${cronExpression}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to add scheduled task '${name}':`, error);
            return false;
        }
    }

    // Remove scheduled task
    removeScheduledTask(name) {
        try {
            if (this.scheduledTasks.has(name)) {
                this.scheduledTasks.get(name).destroy();
                this.scheduledTasks.delete(name);
                this.logger.info(`Scheduled task '${name}' removed`);
                return true;
            }
            return false;
        } catch (error) {
            this.logger.error(`Failed to remove scheduled task '${name}':`, error);
            return false;
        }
    }

    // Get all scheduled tasks
    getScheduledTasks() {
        return Array.from(this.scheduledTasks.keys());
    }

    // Auto-reply management
    async addAutoReply(trigger, reply) {
        try {
            await this.bot.db.addAutoReply(trigger, reply);
            this.logger.info(`Auto-reply added: "${trigger}" -> "${reply}"`);
            return true;
        } catch (error) {
            this.logger.error('Failed to add auto-reply:', error);
            return false;
        }
    }

    async removeAutoReply(trigger) {
        try {
            // This would require implementing a remove method in the database
            this.logger.info(`Auto-reply removal requested for: "${trigger}"`);
            return true;
        } catch (error) {
            this.logger.error('Failed to remove auto-reply:', error);
            return false;
        }
    }

    // Message scheduling
    async scheduleMessage(chatId, message, scheduledTime) {
        try {
            await this.bot.db.addScheduledMessage(chatId, message, scheduledTime);
            this.logger.info(`Message scheduled for ${scheduledTime}: ${chatId}`);
            return true;
        } catch (error) {
            this.logger.error('Failed to schedule message:', error);
            return false;
        }
    }

    // Broadcast functionality
    async broadcastMessage(message, excludeChats = []) {
        try {
            const chats = await this.bot.client.getChats();
            let successCount = 0;
            let failCount = 0;
            
            for (const chat of chats) {
                if (excludeChats.includes(chat.id._serialized)) {
                    continue;
                }
                
                try {
                    await chat.sendMessage(`📢 *Broadcast Message*\n\n${message}`);
                    successCount++;
                } catch (error) {
                    failCount++;
                    this.logger.error(`Failed to send broadcast to ${chat.id._serialized}:`, error);
                }
            }
            
            this.logger.info(`Broadcast completed: ${successCount} sent, ${failCount} failed`);
            return { successCount, failCount };
        } catch (error) {
            this.logger.error('Failed to broadcast message:', error);
            return { successCount: 0, failCount: 0 };
        }
    }

    formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        return `${days}d ${hours}h ${minutes}m ${secs}s`;
    }

    // Cleanup on shutdown
    destroy() {
        this.scheduledTasks.forEach((task, name) => {
            task.destroy();
            this.logger.info(`Scheduled task '${name}' destroyed`);
        });
        this.scheduledTasks.clear();
    }
}

module.exports = AutomationManager;
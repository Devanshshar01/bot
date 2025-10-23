const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs-extra');
require('dotenv').config();

const Database = require('./database/database');
const MessageHandler = require('./handlers/messageHandler');
const CommandProcessor = require('./commands/commandProcessor');
const AutomationManager = require('./automation/automationManager');
const AdminPanel = require('./admin/adminPanel');
const Logger = require('./utils/logger');
const Config = require('./config/config');

class WhatsAppBot {
    constructor() {
        this.client = new Client({
            authStrategy: new LocalAuth(),
            puppeteer: {
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            }
        });
        
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        
        this.db = new Database();
        this.messageHandler = new MessageHandler(this);
        this.commandProcessor = new CommandProcessor(this);
        this.automationManager = new AutomationManager(this);
        this.adminPanel = new AdminPanel(this);
        this.logger = new Logger();
        this.config = new Config();
        
        this.isReady = false;
        this.setupEventHandlers();
        this.setupExpress();
    }

    async initialize() {
        try {
            this.logger.info('Initializing WhatsApp Bot...');
            
            // Initialize database
            await this.db.initialize();
            
            // Setup admin panel
            this.adminPanel.setup();
            
            // Initialize automation manager
            await this.automationManager.initialize();
            
            // Start WhatsApp client
            await this.client.initialize();
            
            this.logger.info('Bot initialized successfully!');
        } catch (error) {
            this.logger.error('Failed to initialize bot:', error);
            process.exit(1);
        }
    }

    setupEventHandlers() {
        // WhatsApp client events
        this.client.on('qr', (qr) => {
            this.logger.info('QR Code generated. Scan with your WhatsApp mobile app.');
            qrcode.generate(qr, { small: true });
        });

        this.client.on('ready', () => {
            this.logger.info('WhatsApp client is ready!');
            this.isReady = true;
            this.io.emit('bot-status', { status: 'ready' });
        });

        this.client.on('authenticated', () => {
            this.logger.info('WhatsApp client authenticated!');
        });

        this.client.on('auth_failure', (msg) => {
            this.logger.error('Authentication failed:', msg);
        });

        this.client.on('disconnected', (reason) => {
            this.logger.warn('WhatsApp client disconnected:', reason);
            this.isReady = false;
            this.io.emit('bot-status', { status: 'disconnected' });
        });

        // Message events
        this.client.on('message', async (message) => {
            try {
                await this.messageHandler.handleMessage(message);
            } catch (error) {
                this.logger.error('Error handling message:', error);
            }
        });

        // Socket.IO events
        this.io.on('connection', (socket) => {
            this.logger.info('Admin panel connected');
            
            socket.emit('bot-status', { 
                status: this.isReady ? 'ready' : 'disconnected' 
            });

            socket.on('send-message', async (data) => {
                try {
                    await this.sendMessage(data.chatId, data.message);
                    socket.emit('message-sent', { success: true });
                } catch (error) {
                    socket.emit('message-sent', { success: false, error: error.message });
                }
            });

            socket.on('get-chats', async () => {
                try {
                    const chats = await this.client.getChats();
                    socket.emit('chats-list', chats);
                } catch (error) {
                    socket.emit('chats-list', []);
                }
            });
        });
    }

    setupExpress() {
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, '../public')));
        
        // API routes
        this.app.get('/api/status', (req, res) => {
            res.json({ 
                status: this.isReady ? 'ready' : 'disconnected',
                uptime: process.uptime()
            });
        });

        this.app.get('/api/chats', async (req, res) => {
            try {
                const chats = await this.client.getChats();
                res.json(chats);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.post('/api/send-message', async (req, res) => {
            try {
                const { chatId, message } = req.body;
                await this.sendMessage(chatId, message);
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Serve admin panel
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, '../public/index.html'));
        });
    }

    async sendMessage(chatId, message) {
        if (!this.isReady) {
            throw new Error('Bot is not ready');
        }

        try {
            const chat = await this.client.getChatById(chatId);
            await chat.sendMessage(message);
            this.logger.info(`Message sent to ${chatId}: ${message}`);
        } catch (error) {
            this.logger.error('Failed to send message:', error);
            throw error;
        }
    }

    async sendMedia(chatId, mediaPath, caption = '') {
        if (!this.isReady) {
            throw new Error('Bot is not ready');
        }

        try {
            const media = MessageMedia.fromFilePath(mediaPath);
            const chat = await this.client.getChatById(chatId);
            await chat.sendMessage(media, { caption });
            this.logger.info(`Media sent to ${chatId}: ${mediaPath}`);
        } catch (error) {
            this.logger.error('Failed to send media:', error);
            throw error;
        }
    }

    async start() {
        const port = process.env.PORT || 3000;
        this.server.listen(port, () => {
            this.logger.info(`Server running on port ${port}`);
            this.logger.info(`Admin panel available at http://localhost:${port}`);
        });
    }
}

// Start the bot
const bot = new WhatsAppBot();
bot.initialize().then(() => {
    bot.start();
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nShutting down bot...');
    await bot.client.destroy();
    process.exit(0);
});

module.exports = WhatsAppBot;
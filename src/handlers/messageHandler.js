const Logger = require('../utils/logger');

class MessageHandler {
    constructor(bot) {
        this.bot = bot;
        this.logger = new Logger();
    }

    async handleMessage(message) {
        try {
            const contact = await message.getContact();
            const chat = await message.getChat();
            
            // Log user activity
            await this.bot.db.updateUserLastSeen(contact.number);
            
            // Log message
            const user = await this.bot.db.getUser(contact.number);
            if (user) {
                await this.bot.db.logMessage(
                    user.id,
                    chat.id._serialized,
                    message.id._serialized,
                    message.body,
                    message.type,
                    false
                );
            }

            // Check if message is from a group
            const isGroup = chat.isGroup;
            
            // Check for auto-replies
            await this.checkAutoReplies(message, contact, chat);
            
            // Check for commands
            if (message.body.startsWith('/') || message.body.startsWith('!')) {
                await this.bot.commandProcessor.processCommand(message, contact, chat);
                return;
            }

            // Handle different message types
            switch (message.type) {
                case 'image':
                    await this.handleImageMessage(message, contact, chat);
                    break;
                case 'document':
                    await this.handleDocumentMessage(message, contact, chat);
                    break;
                case 'audio':
                    await this.handleAudioMessage(message, contact, chat);
                    break;
                case 'video':
                    await this.handleVideoMessage(message, contact, chat);
                    break;
                case 'sticker':
                    await this.handleStickerMessage(message, contact, chat);
                    break;
                case 'location':
                    await this.handleLocationMessage(message, contact, chat);
                    break;
                default:
                    await this.handleTextMessage(message, contact, chat);
            }

            // Emit to admin panel
            this.bot.io.emit('new-message', {
                contact: {
                    name: contact.name || contact.pushname || contact.number,
                    number: contact.number
                },
                chat: {
                    id: chat.id._serialized,
                    name: chat.name,
                    isGroup: isGroup
                },
                message: {
                    id: message.id._serialized,
                    body: message.body,
                    type: message.type,
                    timestamp: message.timestamp
                }
            });

        } catch (error) {
            this.logger.error('Error handling message:', error);
        }
    }

    async checkAutoReplies(message, contact, chat) {
        try {
            const autoReplies = await this.bot.db.getAutoReplies();
            
            for (const autoReply of autoReplies) {
                if (message.body.toLowerCase().includes(autoReply.trigger_text.toLowerCase())) {
                    await chat.sendMessage(autoReply.reply_text);
                    this.logger.info(`Auto-reply sent to ${contact.number}: ${autoReply.reply_text}`);
                    break;
                }
            }
        } catch (error) {
            this.logger.error('Error checking auto-replies:', error);
        }
    }

    async handleTextMessage(message, contact, chat) {
        // Basic text message handling
        const text = message.body.toLowerCase();
        
        // Welcome message for new users
        if (text.includes('hello') || text.includes('hi') || text.includes('hey')) {
            await chat.sendMessage(`Hello ${contact.name || contact.pushname || 'there'}! 👋\n\nI'm an advanced WhatsApp bot. Type /help to see what I can do!`);
        }
        
        // Help message
        if (text.includes('help') || text.includes('what can you do')) {
            await chat.sendMessage(`🤖 *Bot Commands:*\n\n/help - Show this help message\n/status - Check bot status\n/time - Get current time\n/weather [city] - Get weather info\n/quote - Get a random quote\n/joke - Get a random joke\n/calc [expression] - Calculate math expressions\n/translate [text] - Translate text\n\n*Admin Commands:*\n/admin - Access admin panel\n/stats - View bot statistics\n/auto-reply [trigger] [reply] - Add auto-reply\n/schedule [time] [message] - Schedule a message`);
        }
    }

    async handleImageMessage(message, contact, chat) {
        try {
            const media = await message.downloadMedia();
            
            // Save image to file system
            const fs = require('fs-extra');
            const path = require('path');
            const filename = `image_${Date.now()}.${media.mimetype.split('/')[1]}`;
            const filepath = path.join(__dirname, '../uploads/images', filename);
            
            await fs.ensureDir(path.dirname(filepath));
            await fs.writeFile(filepath, media.data, 'base64');
            
            this.logger.info(`Image saved: ${filepath}`);
            
            // Send confirmation
            await chat.sendMessage(`📸 Image received and saved!`);
            
        } catch (error) {
            this.logger.error('Error handling image:', error);
            await chat.sendMessage('❌ Sorry, I couldn\'t process your image.');
        }
    }

    async handleDocumentMessage(message, contact, chat) {
        try {
            const media = await message.downloadMedia();
            
            // Save document
            const fs = require('fs-extra');
            const path = require('path');
            const filename = `document_${Date.now()}.${media.mimetype.split('/')[1]}`;
            const filepath = path.join(__dirname, '../uploads/documents', filename);
            
            await fs.ensureDir(path.dirname(filepath));
            await fs.writeFile(filepath, media.data, 'base64');
            
            this.logger.info(`Document saved: ${filepath}`);
            
            // Send confirmation
            await chat.sendMessage(`📄 Document received and saved!`);
            
        } catch (error) {
            this.logger.error('Error handling document:', error);
            await chat.sendMessage('❌ Sorry, I couldn\'t process your document.');
        }
    }

    async handleAudioMessage(message, contact, chat) {
        try {
            const media = await message.downloadMedia();
            
            // Save audio
            const fs = require('fs-extra');
            const path = require('path');
            const filename = `audio_${Date.now()}.${media.mimetype.split('/')[1]}`;
            const filepath = path.join(__dirname, '../uploads/audio', filename);
            
            await fs.ensureDir(path.dirname(filepath));
            await fs.writeFile(filepath, media.data, 'base64');
            
            this.logger.info(`Audio saved: ${filepath}`);
            
            // Send confirmation
            await chat.sendMessage(`🎵 Audio received and saved!`);
            
        } catch (error) {
            this.logger.error('Error handling audio:', error);
            await chat.sendMessage('❌ Sorry, I couldn\'t process your audio.');
        }
    }

    async handleVideoMessage(message, contact, chat) {
        try {
            const media = await message.downloadMedia();
            
            // Save video
            const fs = require('fs-extra');
            const path = require('path');
            const filename = `video_${Date.now()}.${media.mimetype.split('/')[1]}`;
            const filepath = path.join(__dirname, '../uploads/videos', filename);
            
            await fs.ensureDir(path.dirname(filepath));
            await fs.writeFile(filepath, media.data, 'base64');
            
            this.logger.info(`Video saved: ${filepath}`);
            
            // Send confirmation
            await chat.sendMessage(`🎥 Video received and saved!`);
            
        } catch (error) {
            this.logger.error('Error handling video:', error);
            await chat.sendMessage('❌ Sorry, I couldn\'t process your video.');
        }
    }

    async handleStickerMessage(message, contact, chat) {
        await chat.sendMessage(`😄 Nice sticker!`);
    }

    async handleLocationMessage(message, contact, chat) {
        const location = message.location;
        await chat.sendMessage(`📍 Location received: ${location.latitude}, ${location.longitude}`);
    }
}

module.exports = MessageHandler;
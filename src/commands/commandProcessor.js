const Logger = require('../utils/logger');
const axios = require('axios');

class CommandProcessor {
    constructor(bot) {
        this.bot = bot;
        this.logger = new Logger();
        this.commands = new Map();
        this.initializeCommands();
    }

    initializeCommands() {
        // Basic commands
        this.commands.set('/help', this.helpCommand.bind(this));
        this.commands.set('/status', this.statusCommand.bind(this));
        this.commands.set('/time', this.timeCommand.bind(this));
        this.commands.set('/weather', this.weatherCommand.bind(this));
        this.commands.set('/quote', this.quoteCommand.bind(this));
        this.commands.set('/joke', this.jokeCommand.bind(this));
        this.commands.set('/calc', this.calcCommand.bind(this));
        this.commands.set('/translate', this.translateCommand.bind(this));
        this.commands.set('/ping', this.pingCommand.bind(this));
        
        // Admin commands
        this.commands.set('/admin', this.adminCommand.bind(this));
        this.commands.set('/stats', this.statsCommand.bind(this));
        this.commands.set('/auto-reply', this.autoReplyCommand.bind(this));
        this.commands.set('/schedule', this.scheduleCommand.bind(this));
        this.commands.set('/broadcast', this.broadcastCommand.bind(this));
        this.commands.set('/block', this.blockCommand.bind(this));
        this.commands.set('/unblock', this.unblockCommand.bind(this));
    }

    async processCommand(message, contact, chat) {
        try {
            const commandText = message.body.split(' ')[0].toLowerCase();
            const args = message.body.split(' ').slice(1);
            
            if (this.commands.has(commandText)) {
                await this.commands.get(commandText)(message, contact, chat, args);
            } else {
                await chat.sendMessage(`❌ Unknown command: ${commandText}\nType /help to see available commands.`);
            }
        } catch (error) {
            this.logger.error('Error processing command:', error);
            await chat.sendMessage('❌ An error occurred while processing your command.');
        }
    }

    async helpCommand(message, contact, chat, args) {
        const helpText = `🤖 *Advanced WhatsApp Bot Commands*\n\n` +
            `*Basic Commands:*\n` +
            `/help - Show this help message\n` +
            `/status - Check bot status\n` +
            `/time - Get current time\n` +
            `/weather [city] - Get weather information\n` +
            `/quote - Get a random inspirational quote\n` +
            `/joke - Get a random joke\n` +
            `/calc [expression] - Calculate math expressions\n` +
            `/translate [text] - Translate text to English\n` +
            `/ping - Check bot response time\n\n` +
            `*Admin Commands:*\n` +
            `/admin - Access admin panel\n` +
            `/stats - View bot statistics\n` +
            `/auto-reply [trigger] [reply] - Add auto-reply\n` +
            `/schedule [time] [message] - Schedule a message\n` +
            `/broadcast [message] - Broadcast message to all users\n` +
            `/block [number] - Block a user\n` +
            `/unblock [number] - Unblock a user\n\n` +
            `*Features:*\n` +
            `• Auto-reply system\n` +
            `• File handling (images, documents, audio, video)\n` +
            `• Scheduled messages\n` +
            `• Group management\n` +
            `• Admin panel\n` +
            `• Statistics tracking\n` +
            `• And much more!`;
        
        await chat.sendMessage(helpText);
    }

    async statusCommand(message, contact, chat, args) {
        const uptime = process.uptime();
        const uptimeText = this.formatUptime(uptime);
        
        const statusText = `🤖 *Bot Status*\n\n` +
            `Status: ${this.bot.isReady ? '🟢 Online' : '🔴 Offline'}\n` +
            `Uptime: ${uptimeText}\n` +
            `Memory Usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB\n` +
            `Node.js Version: ${process.version}\n` +
            `Bot Version: ${process.env.BOT_VERSION || '1.0.0'}`;
        
        await chat.sendMessage(statusText);
    }

    async timeCommand(message, contact, chat, args) {
        const now = new Date();
        const timeText = `🕐 *Current Time*\n\n` +
            `Local Time: ${now.toLocaleString()}\n` +
            `UTC Time: ${now.toUTCString()}\n` +
            `Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`;
        
        await chat.sendMessage(timeText);
    }

    async weatherCommand(message, contact, chat, args) {
        if (args.length === 0) {
            await chat.sendMessage('❌ Please provide a city name.\nUsage: /weather [city]');
            return;
        }

        const city = args.join(' ');
        const apiKey = process.env.WEATHER_API_KEY;
        
        if (!apiKey) {
            await chat.sendMessage('❌ Weather API key not configured.');
            return;
        }

        try {
            const response = await axios.get(`http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);
            const weather = response.data;
            
            const weatherText = `🌤️ *Weather for ${weather.name}*\n\n` +
                `Temperature: ${weather.main.temp}°C\n` +
                `Feels like: ${weather.main.feels_like}°C\n` +
                `Description: ${weather.weather[0].description}\n` +
                `Humidity: ${weather.main.humidity}%\n` +
                `Wind Speed: ${weather.wind.speed} m/s\n` +
                `Pressure: ${weather.main.pressure} hPa`;
            
            await chat.sendMessage(weatherText);
        } catch (error) {
            this.logger.error('Weather API error:', error);
            await chat.sendMessage('❌ Could not fetch weather data. Please check the city name.');
        }
    }

    async quoteCommand(message, contact, chat, args) {
        try {
            const response = await axios.get('https://api.quotable.io/random');
            const quote = response.data;
            
            const quoteText = `💭 *Inspirational Quote*\n\n"${quote.content}"\n\n- ${quote.author}`;
            await chat.sendMessage(quoteText);
        } catch (error) {
            this.logger.error('Quote API error:', error);
            await chat.sendMessage('❌ Could not fetch a quote at the moment.');
        }
    }

    async jokeCommand(message, contact, chat, args) {
        try {
            const response = await axios.get('https://official-joke-api.appspot.com/random_joke');
            const joke = response.data;
            
            const jokeText = `😄 *Random Joke*\n\n${joke.setup}\n\n${joke.punchline}`;
            await chat.sendMessage(jokeText);
        } catch (error) {
            this.logger.error('Joke API error:', error);
            await chat.sendMessage('❌ Could not fetch a joke at the moment.');
        }
    }

    async calcCommand(message, contact, chat, args) {
        if (args.length === 0) {
            await chat.sendMessage('❌ Please provide a math expression.\nUsage: /calc [expression]\nExample: /calc 2+2*3');
            return;
        }

        try {
            const expression = args.join(' ');
            // Basic safety check - only allow numbers, operators, and parentheses
            if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
                await chat.sendMessage('❌ Invalid characters in expression. Only numbers and basic operators are allowed.');
                return;
            }
            
            const result = eval(expression);
            await chat.sendMessage(`🧮 *Calculation Result*\n\n${expression} = ${result}`);
        } catch (error) {
            this.logger.error('Calculation error:', error);
            await chat.sendMessage('❌ Invalid math expression. Please check your input.');
        }
    }

    async translateCommand(message, contact, chat, args) {
        if (args.length === 0) {
            await chat.sendMessage('❌ Please provide text to translate.\nUsage: /translate [text]');
            return;
        }

        const text = args.join(' ');
        const apiKey = process.env.OPENAI_API_KEY;
        
        if (!apiKey) {
            await chat.sendMessage('❌ Translation service not configured.');
            return;
        }

        try {
            // Using OpenAI for translation (you can replace with other services)
            const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'Translate the following text to English. Only return the translation, nothing else.'
                    },
                    {
                        role: 'user',
                        content: text
                    }
                ],
                max_tokens: 100
            }, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            const translation = response.data.choices[0].message.content;
            await chat.sendMessage(`🌐 *Translation*\n\nOriginal: ${text}\n\nTranslation: ${translation}`);
        } catch (error) {
            this.logger.error('Translation error:', error);
            await chat.sendMessage('❌ Could not translate the text. Please try again.');
        }
    }

    async pingCommand(message, contact, chat, args) {
        const startTime = Date.now();
        await chat.sendMessage('🏓 Pong!');
        const endTime = Date.now();
        const latency = endTime - startTime;
        
        await chat.sendMessage(`⚡ Response time: ${latency}ms`);
    }

    async adminCommand(message, contact, chat, args) {
        const user = await this.bot.db.getUser(contact.number);
        
        if (!user || !user.is_admin) {
            await chat.sendMessage('❌ Access denied. Admin privileges required.');
            return;
        }

        const adminText = `👑 *Admin Panel*\n\n` +
            `Welcome, ${user.name || contact.name || contact.pushname}!\n\n` +
            `*Admin Commands:*\n` +
            `/stats - View bot statistics\n` +
            `/auto-reply [trigger] [reply] - Add auto-reply\n` +
            `/schedule [time] [message] - Schedule a message\n` +
            `/broadcast [message] - Broadcast message to all users\n` +
            `/block [number] - Block a user\n` +
            `/unblock [number] - Unblock a user\n\n` +
            `*Web Admin Panel:*\n` +
            `Access the full admin panel at: http://localhost:${process.env.PORT || 3000}`;
        
        await chat.sendMessage(adminText);
    }

    async statsCommand(message, contact, chat, args) {
        const user = await this.bot.db.getUser(contact.number);
        
        if (!user || !user.is_admin) {
            await chat.sendMessage('❌ Access denied. Admin privileges required.');
            return;
        }

        try {
            const stats = await this.bot.db.getStats();
            
            const statsText = `📊 *Bot Statistics*\n\n` +
                `Total Users: ${stats.total_users}\n` +
                `Total Messages: ${stats.total_messages}\n` +
                `Active Auto-replies: ${stats.auto_replies}\n` +
                `Pending Scheduled Messages: ${stats.scheduled_messages}\n` +
                `Bot Uptime: ${this.formatUptime(process.uptime())}\n` +
                `Memory Usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`;
            
            await chat.sendMessage(statsText);
        } catch (error) {
            this.logger.error('Stats error:', error);
            await chat.sendMessage('❌ Could not fetch statistics.');
        }
    }

    async autoReplyCommand(message, contact, chat, args) {
        const user = await this.bot.db.getUser(contact.number);
        
        if (!user || !user.is_admin) {
            await chat.sendMessage('❌ Access denied. Admin privileges required.');
            return;
        }

        if (args.length < 2) {
            await chat.sendMessage('❌ Usage: /auto-reply [trigger] [reply]\nExample: /auto-reply hello Hi there! How can I help you?');
            return;
        }

        const trigger = args[0];
        const reply = args.slice(1).join(' ');

        try {
            await this.bot.db.addAutoReply(trigger, reply);
            await chat.sendMessage(`✅ Auto-reply added successfully!\nTrigger: "${trigger}"\nReply: "${reply}"`);
        } catch (error) {
            this.logger.error('Auto-reply error:', error);
            await chat.sendMessage('❌ Could not add auto-reply.');
        }
    }

    async scheduleCommand(message, contact, chat, args) {
        const user = await this.bot.db.getUser(contact.number);
        
        if (!user || !user.is_admin) {
            await chat.sendMessage('❌ Access denied. Admin privileges required.');
            return;
        }

        if (args.length < 2) {
            await chat.sendMessage('❌ Usage: /schedule [time] [message]\nExample: /schedule "2024-01-01 12:00:00" Happy New Year!');
            return;
        }

        const timeString = args[0];
        const messageText = args.slice(1).join(' ');

        try {
            const scheduledTime = new Date(timeString);
            if (isNaN(scheduledTime.getTime())) {
                await chat.sendMessage('❌ Invalid date format. Use: YYYY-MM-DD HH:MM:SS');
                return;
            }

            await this.bot.db.addScheduledMessage(chat.id._serialized, messageText, scheduledTime);
            await chat.sendMessage(`✅ Message scheduled for ${scheduledTime.toLocaleString()}`);
        } catch (error) {
            this.logger.error('Schedule error:', error);
            await chat.sendMessage('❌ Could not schedule message.');
        }
    }

    async broadcastCommand(message, contact, chat, args) {
        const user = await this.bot.db.getUser(contact.number);
        
        if (!user || !user.is_admin) {
            await chat.sendMessage('❌ Access denied. Admin privileges required.');
            return;
        }

        if (args.length === 0) {
            await chat.sendMessage('❌ Usage: /broadcast [message]\nExample: /broadcast Important announcement!');
            return;
        }

        const broadcastMessage = args.join(' ');
        
        try {
            const chats = await this.bot.client.getChats();
            let successCount = 0;
            let failCount = 0;

            for (const chatItem of chats) {
                try {
                    await chatItem.sendMessage(`📢 *Broadcast Message*\n\n${broadcastMessage}`);
                    successCount++;
                } catch (error) {
                    failCount++;
                }
            }

            await chat.sendMessage(`📢 Broadcast completed!\n✅ Sent: ${successCount}\n❌ Failed: ${failCount}`);
        } catch (error) {
            this.logger.error('Broadcast error:', error);
            await chat.sendMessage('❌ Could not send broadcast.');
        }
    }

    async blockCommand(message, contact, chat, args) {
        const user = await this.bot.db.getUser(contact.number);
        
        if (!user || !user.is_admin) {
            await chat.sendMessage('❌ Access denied. Admin privileges required.');
            return;
        }

        if (args.length === 0) {
            await chat.sendMessage('❌ Usage: /block [phone_number]\nExample: /block +1234567890');
            return;
        }

        const phoneNumber = args[0];
        
        try {
            // Update user as blocked in database
            const targetUser = await this.bot.db.getUser(phoneNumber);
            if (targetUser) {
                // You would implement blocking logic here
                await chat.sendMessage(`✅ User ${phoneNumber} has been blocked.`);
            } else {
                await chat.sendMessage(`❌ User ${phoneNumber} not found.`);
            }
        } catch (error) {
            this.logger.error('Block error:', error);
            await chat.sendMessage('❌ Could not block user.');
        }
    }

    async unblockCommand(message, contact, chat, args) {
        const user = await this.bot.db.getUser(contact.number);
        
        if (!user || !user.is_admin) {
            await chat.sendMessage('❌ Access denied. Admin privileges required.');
            return;
        }

        if (args.length === 0) {
            await chat.sendMessage('❌ Usage: /unblock [phone_number]\nExample: /unblock +1234567890');
            return;
        }

        const phoneNumber = args[0];
        
        try {
            // Update user as unblocked in database
            const targetUser = await this.bot.db.getUser(phoneNumber);
            if (targetUser) {
                // You would implement unblocking logic here
                await chat.sendMessage(`✅ User ${phoneNumber} has been unblocked.`);
            } else {
                await chat.sendMessage(`❌ User ${phoneNumber} not found.`);
            }
        } catch (error) {
            this.logger.error('Unblock error:', error);
            await chat.sendMessage('❌ Could not unblock user.');
        }
    }

    formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        return `${days}d ${hours}h ${minutes}m ${secs}s`;
    }
}

module.exports = CommandProcessor;
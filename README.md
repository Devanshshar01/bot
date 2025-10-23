# Advanced WhatsApp Automation Bot

A powerful and feature-rich WhatsApp automation bot built with Node.js, featuring an intuitive admin panel, auto-replies, scheduled messages, file handling, and much more.

## 🚀 Features

### Core Features
- **WhatsApp Integration**: Built with `whatsapp-web.js` for reliable WhatsApp Web integration
- **Real-time Communication**: Socket.IO for real-time updates and admin panel communication
- **Database Storage**: SQLite database for persistent data storage
- **Admin Panel**: Beautiful web-based admin interface for bot management
- **Auto-replies**: Intelligent auto-reply system with customizable triggers
- **Scheduled Messages**: Schedule messages to be sent at specific times
- **File Handling**: Support for images, documents, audio, video, and other media types
- **Group Management**: Advanced group management capabilities
- **Statistics**: Comprehensive bot usage statistics and analytics

### Bot Commands
- `/help` - Show available commands
- `/status` - Check bot status and uptime
- `/time` - Get current time and timezone
- `/weather [city]` - Get weather information
- `/quote` - Get inspirational quotes
- `/joke` - Get random jokes
- `/calc [expression]` - Calculate math expressions
- `/translate [text]` - Translate text to English
- `/ping` - Check bot response time

### Admin Commands
- `/admin` - Access admin panel
- `/stats` - View bot statistics
- `/auto-reply [trigger] [reply]` - Add auto-reply
- `/schedule [time] [message]` - Schedule a message
- `/broadcast [message]` - Broadcast message to all users
- `/block [number]` - Block a user
- `/unblock [number]` - Unblock a user

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- WhatsApp mobile app (for QR code scanning)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd advanced-whatsapp-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   # WhatsApp Bot Configuration
   BOT_NAME=Advanced WhatsApp Bot
   BOT_VERSION=1.0.0
   
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   
   # Database Configuration
   DB_PATH=./data/bot.db
   
   # Admin Configuration
   ADMIN_PHONE_NUMBER=+1234567890
   ADMIN_PASSWORD=admin123
   
   # API Keys (optional)
   OPENAI_API_KEY=your_openai_api_key_here
   WEATHER_API_KEY=your_weather_api_key_here
   
   # Bot Features
   ENABLE_AUTO_REPLY=true
   ENABLE_SCHEDULED_MESSAGES=true
   ENABLE_FILE_HANDLING=true
   ENABLE_GROUP_MANAGEMENT=true
   ENABLE_ADMIN_PANEL=true
   ```

4. **Start the bot**
   ```bash
   npm start
   ```

5. **Scan QR Code**
   - Open WhatsApp on your mobile device
   - Go to Settings > Linked Devices
   - Tap "Link a Device"
   - Scan the QR code displayed in the terminal

6. **Access Admin Panel**
   - Open your browser and go to `http://localhost:3000`
   - Use the admin panel to manage your bot

## 📁 Project Structure

```
advanced-whatsapp-bot/
├── src/
│   ├── index.js                 # Main bot entry point
│   ├── database/
│   │   └── database.js          # Database operations
│   ├── handlers/
│   │   └── messageHandler.js    # Message handling logic
│   ├── commands/
│   │   └── commandProcessor.js  # Command processing
│   ├── automation/
│   │   └── automationManager.js # Automation features
│   ├── admin/
│   │   └── adminPanel.js        # Admin panel API
│   ├── utils/
│   │   ├── logger.js            # Logging utility
│   │   └── config.js            # Configuration management
│   └── config/
│       └── config.js            # Bot configuration
├── public/
│   ├── index.html               # Main admin panel
│   └── admin/
│       └── index.html           # Admin interface
├── data/                        # Database files
├── logs/                        # Log files
├── uploads/                     # Uploaded files
│   ├── images/
│   ├── documents/
│   ├── audio/
│   └── videos/
├── package.json
├── .env.example
└── README.md
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BOT_NAME` | Bot display name | Advanced WhatsApp Bot |
| `BOT_VERSION` | Bot version | 1.0.0 |
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment | development |
| `DB_PATH` | Database file path | ./data/bot.db |
| `ADMIN_PHONE_NUMBER` | Admin phone number | Required |
| `ADMIN_PASSWORD` | Admin password | admin123 |
| `OPENAI_API_KEY` | OpenAI API key | Optional |
| `WEATHER_API_KEY` | Weather API key | Optional |

### Feature Toggles

| Feature | Environment Variable | Description |
|---------|---------------------|-------------|
| Auto-replies | `ENABLE_AUTO_REPLY` | Enable/disable auto-reply system |
| Scheduled Messages | `ENABLE_SCHEDULED_MESSAGES` | Enable/disable message scheduling |
| File Handling | `ENABLE_FILE_HANDLING` | Enable/disable file processing |
| Group Management | `ENABLE_GROUP_MANAGEMENT` | Enable/disable group features |
| Admin Panel | `ENABLE_ADMIN_PANEL` | Enable/disable web admin panel |

## 📊 Admin Panel Features

### Dashboard
- Real-time bot status monitoring
- Usage statistics and metrics
- System health information
- Recent activity feed

### Chat Management
- View all active chats
- Send messages to specific chats
- Monitor chat activity

### Auto-replies
- Add/edit/remove auto-reply rules
- Test auto-reply triggers
- View auto-reply statistics

### Scheduled Messages
- Schedule messages for future delivery
- Manage pending scheduled messages
- View delivery status

### Settings
- Configure bot behavior
- Toggle features on/off
- Update bot settings

### Logs
- View bot logs in real-time
- Filter logs by level
- Download log files

## 🔌 API Endpoints

### Bot Status
- `GET /api/status` - Get bot status
- `GET /api/chats` - Get all chats
- `POST /api/send-message` - Send message

### Admin Panel
- `GET /api/admin/status` - Get detailed bot status
- `GET /api/admin/chats` - Get chat information
- `GET /api/admin/users` - Get user information
- `GET /api/admin/auto-replies` - Get auto-replies
- `POST /api/admin/auto-replies` - Add auto-reply
- `GET /api/admin/scheduled-messages` - Get scheduled messages
- `POST /api/admin/schedule-message` - Schedule message
- `POST /api/admin/send-message` - Send message
- `POST /api/admin/broadcast` - Broadcast message
- `GET /api/admin/settings` - Get bot settings
- `POST /api/admin/settings` - Update settings
- `GET /api/admin/logs` - Get bot logs

## 🚀 Usage Examples

### Basic Bot Usage
1. Start the bot and scan the QR code
2. Send `/help` to any chat to see available commands
3. Use `/status` to check bot status
4. Send `/time` to get current time

### Admin Features
1. Access admin panel at `http://localhost:3000`
2. Add auto-replies for common questions
3. Schedule important announcements
4. Monitor bot activity and statistics

### File Handling
1. Send images, documents, or media to the bot
2. Files are automatically saved to the uploads directory
3. Bot confirms receipt of files

## 🔒 Security Features

- Rate limiting to prevent spam
- Input validation and sanitization
- Secure file handling
- Admin authentication
- SQL injection protection

## 📝 Logging

The bot includes comprehensive logging:
- Error logs saved to `logs/error.log`
- Combined logs saved to `logs/combined.log`
- Console logging in development mode
- Log rotation and size limits

## 🛠️ Development

### Running in Development Mode
```bash
npm run dev
```

### Running Tests
```bash
npm test
```

### Code Structure
- Modular architecture for easy maintenance
- Separation of concerns
- Comprehensive error handling
- Extensive logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the documentation
- Review the logs for error messages
- Open an issue on GitHub

## 🔄 Updates

The bot automatically handles:
- Database migrations
- Configuration updates
- Feature toggles
- Log rotation

## 📈 Performance

- Optimized for high message volume
- Efficient database operations
- Memory usage monitoring
- Automatic cleanup tasks

## 🌟 Advanced Features

- Custom command creation
- Plugin system for extensions
- Webhook support
- Multi-language support
- Advanced analytics

---

**Note**: This bot is for educational and personal use. Please ensure you comply with WhatsApp's Terms of Service and applicable laws when using this bot.
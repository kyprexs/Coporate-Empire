# 🏢 Corporate Empire Bot

A comprehensive Discord bot game where players create and manage companies in a competitive economic simulation with real-time market dynamics, stock trading, and complex business interactions.

![Corporate Empire Bot](https://img.shields.io/badge/Discord-Bot-7289da?style=for-the-badge&logo=discord&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)

## 🎮 Game Features

### 🏢 Company Management
- **Company Creation**: Apply to create and manage your own company
- **Industry Specialization**: Choose from multiple industry sectors
- **Employee Management**: Hire, fire, and manage your workforce
- **Financial Planning**: Manage cash flow, investments, and budgets

### 📈 Stock Market System
- **Real-time Trading**: Buy and sell company stocks
- **Market Analysis**: Track industry trends and company performance
- **IPO Process**: Take your company public when ready
- **Portfolio Management**: Track your investment performance

### 🤝 Business Interactions
- **Contracts**: Create and manage business agreements
- **Partnerships**: Form strategic alliances with other companies
- **Legal System**: Handle disputes and lawsuits
- **Patents & Research**: Develop and protect intellectual property

### 🏛️ Economic Systems
- **Central Banking**: Government-controlled monetary policy
- **Insurance**: Protect your business against risks
- **Loans**: Access capital for business expansion
- **Economic Events**: Random market events affect all players

## 🚀 Getting Started

### Prerequisites
- Node.js 18.0.0 or higher
- Discord Bot Token
- MongoDB Atlas account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kyprexs/Coporate-Empire.git
   cd Coporate-Empire
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   DISCORD_TOKEN=your_discord_bot_token
   CLIENT_ID=your_discord_client_id
   GUILD_ID=your_discord_guild_id
   MONGODB_URI=your_mongodb_atlas_connection_string
   ADMIN_ROLE_ID=your_admin_role_id
   STARTING_CAPITAL_MIN=50000
   STARTING_CAPITAL_MAX=500000
   ```

4. **Deploy Commands**
   ```bash
   npm run deploy
   ```

5. **Start the Bot**
   ```bash
   npm start
   ```

## 📋 Bot Commands

### 🎯 Essential Commands
- `/onboarding` - Get started with the bot
- `/start` - Begin your corporate journey
- `/help` - View all available commands
- `/dashboard portfolio` - View your financial overview

### 🏢 Company Commands
- `/company create` - Apply to create a new company
- `/company my` - View your company details
- `/company list` - Browse all companies
- `/company info [name]` - Get company information

### 📊 Market Commands
- `/stock market` - View current market status
- `/industry analysis [sector]` - Industry performance data
- `/ipo list` - View upcoming public offerings

### 💼 Management Commands
- `/employees list` - Manage your workforce
- `/contracts list` - View active contracts
- `/patents list` - Manage intellectual property
- `/loans status` - View loan information

### 🎭 Game Events
- `/events current` - View active economic events
- `/lawsuit list` - Legal system interactions
- `/insurance list` - Risk management options

### 👑 Admin Commands
- `/admin economy_status` - Economic system overview
- `/research list` - Research & development tracking

## 🏗️ Architecture

### Database (MongoDB Atlas)
- **Users**: Player profiles and financial data
- **Companies**: Business entities and performance metrics
- **Stocks**: Market data and trading history
- **Economic Events**: Random events affecting the economy
- **Applications**: Company creation requests

### Core Systems
- **Economic Scheduler**: Automated market cycles (1 real day = 1 game month)
- **Stock Price Engine**: Dynamic pricing based on company performance
- **Event System**: Random economic events and market fluctuations
- **Permission System**: Role-based access control

## 📁 Project Structure

```
corporate-empire-bot/
├── src/
│   ├── commands/          # Slash command implementations
│   ├── events/           # Discord event handlers
│   ├── handlers/         # Business logic handlers
│   ├── database/         # MongoDB models and adapter
│   ├── utils/           # Utility functions
│   └── index.js         # Main bot entry point
├── sample_documents/     # Application examples and guides
├── scripts/             # Utility scripts for testing/deployment
└── README.md           # This file
```

## 🎯 Game Mechanics

### Economic Simulation
- **Real-time Economy**: Market conditions change based on player actions
- **Supply & Demand**: Company values fluctuate based on performance
- **Economic Cycles**: Automated boom/bust cycles affect all businesses
- **Government Intervention**: Central bank policies impact the economy

### Company Progression
1. **Application Phase**: Submit detailed business plan
2. **Startup Phase**: Manage initial capital and hiring
3. **Growth Phase**: Expand operations and market presence
4. **Maturity Phase**: Consider IPO and acquisitions
5. **Empire Phase**: Dominate industries and influence economy

### Winning Conditions
- **Market Capitalization**: Highest total company value
- **Portfolio Wealth**: Most successful investment portfolio
- **Industry Dominance**: Control significant market share
- **Economic Influence**: Shape market conditions

## 🛠️ Development

### Testing
```bash
# Test all commands
node test-all-commands.js

# Test Discord connection
node test-discord.js

# Check command deployment
node check-commands.js
```

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 Documentation

- **[Sample Company Application](sample_documents/SAMPLE_COMPANY_APPLICATION.md)** - Example application
- **[Setup Guide](docs/SETUP.md)** - Detailed installation instructions
- **[Game Rules](docs/GAME_RULES.md)** - Complete gameplay mechanics
- **[API Documentation](docs/API.md)** - MongoDB adapter methods

## ⚡ Performance

- **MongoDB Atlas**: Cloud-native database for global accessibility
- **Efficient Caching**: Optimized queries for real-time performance
- **Scalable Architecture**: Supports hundreds of concurrent players
- **Economic Engine**: Processes thousands of transactions per day

## 🔧 Configuration

### Environment Variables
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DISCORD_TOKEN` | Discord bot token | - | ✅ |
| `CLIENT_ID` | Discord application ID | - | ✅ |
| `GUILD_ID` | Discord server ID | - | ✅ |
| `MONGODB_URI` | MongoDB connection string | - | ✅ |
| `ADMIN_ROLE_ID` | Discord admin role ID | - | ✅ |
| `STARTING_CAPITAL_MIN` | Minimum starting capital | 50000 | ❌ |
| `STARTING_CAPITAL_MAX` | Maximum starting capital | 500000 | ❌ |

## 🐛 Troubleshooting

### Common Issues
1. **Commands not appearing**: Run `npm run deploy` to register commands
2. **Database connection errors**: Check MongoDB Atlas whitelist and credentials
3. **Permission errors**: Ensure bot has proper Discord permissions
4. **Economic scheduler not running**: Check server timezone settings

### Support
- Create an issue on GitHub
- Join our Discord server for live support
- Check the troubleshooting documentation

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Discord.js community for excellent documentation
- MongoDB team for robust cloud database solutions
- The open-source community for inspiration and tools

---

**🎮 Ready to build your corporate empire? Get started with `/onboarding`!**

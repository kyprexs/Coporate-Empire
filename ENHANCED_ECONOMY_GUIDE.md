# Corporate Empire Bot - Enhanced Economic System

## 🎮 Overview

The Corporate Empire Bot now features a comprehensive economic simulation with:

- **Worker Management**: Hire NPC workers (1x productivity) or real Discord users (2.5x productivity)
- **Time System**: 1 real day = 1 in-game month with automated processing
- **Patent System**: Submit patents for additional monthly revenue
- **Banking System**: Apply for loans from the Central Bank with credit-based interest rates
- **Tax System**: Automatic 8% taxation on all company revenues
- **Default Companies**: Admin-controlled essential services (Central Bank, Insurance, Stock Exchange, Law Firm)

## 🚀 Setup Instructions

### 1. Environment Configuration

Copy `.env.example` to `.env` and configure:

```env
# Required Discord Configuration
DISCORD_TOKEN=your_bot_token_here
ADMIN_ROLE_ID=your_admin_role_id_here
BOT_ADMIN_ID=your_discord_user_id_here

# Economic System Settings (optional, defaults provided)
TAX_RATE=0.08
CENTRAL_BANK_STARTING_BALANCE=50000000
MAX_LOANS_PER_COMPANY=3
DEFAULT_PATENT_REVENUE=5000
```

### 2. Database Migration

The new schema will automatically apply when you start the bot. The enhanced database includes:

- `employees` - Worker management (NPC/Player with productivity multipliers)
- `patents` - Intellectual property with revenue generation
- `loans` - Banking system with credit scoring
- `tax_records` - Government revenue tracking
- `economic_cycles` - Monthly processing history
- `default_companies` - Admin-controlled essential services

### 3. Discord Slash Commands

Deploy the new commands to Discord:

```bash
npm run deploy
```

## 📋 New Commands

### Employee Management (`/employees`)

- `/employees hire` - Hire NPC workers or real Discord users
- `/employees fire` - Terminate employees by ID
- `/employees list` - View company roster and productivity

### Patent System (`/patent`)

- `/patent submit` - Submit patent applications
- `/patent list` - View company patents and revenue
- `/patent approve` - (Admin) Approve pending patents
- `/patent reject` - (Admin) Reject patent applications
- `/patent pending` - (Admin) View all pending patents

### Banking System (`/loan`)

- `/loan request` - Apply for loans from Central Bank
- `/loan status` - View active loans and payment schedules
- `/loan repay` - Make early loan payments
- `/loan bank_status` - (Admin) View Central Bank status

### Admin Tools (`/admin`)

- `/admin economy_status` - Comprehensive economic overview
- `/admin trigger_cycle` - Manually trigger monthly processing
- `/admin default_companies` - Manage government companies
- `/admin scheduler_status` - View economic scheduler status

## 🏛️ Default Companies

The system automatically creates these admin-controlled companies:

1. **Central Bank of Corporate Empire** 🏛️
   - Issues loans with variable interest rates (5-25% based on credit score)
   - Collects all tax revenue (8% of company revenues)
   - Starting balance: $50,000,000

2. **Empire Insurance Corporation** 🛡️
   - Government-backed insurance services
   - Future expansion: Risk management for companies

3. **Corporate Empire Stock Exchange** 📈
   - Primary trading platform for company shares
   - 4% transaction fees go to government

4. **Empire Legal Services** ⚖️
   - Government legal services until player law firms are created
   - Automatically converts to "Government Legal Department" when player competition exists

## ⚙️ Economic Mechanics

### Worker Productivity

- **NPC Workers**: 1.0x productivity multiplier
  - Cheaper to hire and maintain
  - Predictable but limited output
  - Generated revenue = Salary × 1.0

- **Player Workers**: 2.5x productivity multiplier
  - Higher maintenance cost (salaries go to real players)
  - Significantly higher revenue generation
  - Generated revenue = Salary × 2.5

### Monthly Economic Cycle (Every 24 Real Hours)

Each day at midnight, the system automatically processes:

1. **Revenue Generation**
   - Employee productivity: `salary × productivity_multiplier` for each worker
   - Patent royalties: Monthly revenue for approved patents

2. **Expenses**
   - Payroll: Salaries paid to NPC workers (deducted from company) and player workers (added to player accounts)
   - Loan payments: Principal + interest for all active loans
   - Taxes: 8% of total revenue sent to Central Bank

3. **Company Updates**
   - Net income calculation: Revenue - Taxes - Payroll - Loan Payments
   - Valuation adjustment: Based on monthly performance
   - Financial records updated

4. **Government Processing**
   - Central Bank balance updated with tax revenue and loan interest
   - Economic cycle statistics recorded
   - Monthly reports sent to company owners

### Credit Scoring & Loans

Companies receive credit scores (300-850) based on:
- **Company Age**: Longer operational history = higher score
- **Valuation Growth**: Current vs. starting valuation
- **Profitability**: Average monthly profit history

Interest rates vary by credit score:
- 750+: 5% annually
- 700-749: 8% annually  
- 650-699: 12% annually
- 600-649: 15% annually
- 500-599: 18% annually
- Below 500: 25% annually

### Patent Revenue

Approved patents generate passive monthly income:
- Default: $5,000/month (admin configurable)
- Duration: 20 years from approval
- Revenue scales with patent importance (admin discretion)

## 🎯 Game Strategy Tips

### For Company Owners

1. **Early Game**: Start with NPC workers to establish cash flow
2. **Growth Phase**: Hire player workers for 2.5x productivity boost
3. **Innovation**: Submit patents for passive income streams
4. **Expansion**: Use loans strategically for rapid growth
5. **Optimization**: Balance payroll costs vs. productivity gains

### Economic Balance

- **NPC vs Player Workers**: Players cost more but generate 150% more value
- **Loan Strategy**: Good credit scores enable cheap expansion capital
- **Patent Portfolio**: Diversify income sources beyond employee productivity
- **Tax Planning**: 8% tax on all revenue - factor into pricing strategies

## 🔧 Admin Management

### Daily Operations

- Monitor economic cycle processing via `/admin scheduler_status`
- Review patent applications with `/patent pending`
- Check Central Bank health with `/loan bank_status`
- View economy-wide statistics with `/admin economy_status`

### Testing & Debugging

- Manually trigger economic cycles with `/admin trigger_cycle`
- Reinitialize default companies if needed
- Monitor server logs for processing errors

### Balancing

Adjust these values in environment variables:
- `TAX_RATE` - Government revenue percentage
- `DEFAULT_PATENT_REVENUE` - Base patent monthly income
- `CENTRAL_BANK_STARTING_BALANCE` - Government starting funds
- Productivity multipliers (in database methods)

## 🚀 Deployment

1. Install dependencies: `npm install`
2. Configure environment variables in `.env`
3. Set `BOT_ADMIN_ID` to your Discord user ID
4. Start the bot: `npm start`
5. The system will automatically:
   - Create database tables
   - Initialize default companies
   - Start the economic scheduler
   - Begin processing monthly cycles every 24 hours

## 📊 Monitoring

The bot logs all economic activities:
- Company revenue processing
- Tax collection
- Loan payments and defaults
- Patent revenue distribution
- System errors and warnings

Monitor the console output and consider setting up log aggregation for production deployments.

## 🔮 Future Enhancements

Potential expansions:
- Insurance claim system
- Stock market price fluctuations
- Contract negotiations between companies
- Economic events and market crashes
- Mergers and acquisitions
- IPO system for going public

---

**Note**: This enhanced economic system transforms the Discord bot into a sophisticated business simulation. Players will experience realistic economic cycles, financial decision-making, and competitive dynamics that mirror real-world business operations.

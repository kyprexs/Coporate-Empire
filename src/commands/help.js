const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Get help and tutorials for Corporate Empire')
        .addStringOption(option =>
            option
                .setName('topic')
                .setDescription('Specific help topic')
                .setRequired(false)
                .addChoices(
                    { name: 'Getting Started', value: 'start' },
                    { name: 'Companies', value: 'companies' },
                    { name: 'Employees', value: 'employees' },
                    { name: 'Stock Trading', value: 'stocks' },
                    { name: 'Patents', value: 'patents' },
                    { name: 'Loans & Banking', value: 'loans' },
                    { name: 'Economic Cycle', value: 'economy' }
                )
        ),

    async execute(interaction, client) {
        const topic = interaction.options.getString('topic');

        if (topic) {
            await this.handleSpecificTopic(interaction, client, topic);
        } else {
            await this.handleMainHelp(interaction, client);
        }
    },

    async handleMainHelp(interaction, client) {
        const embed = new EmbedBuilder()
            .setTitle('🎮 Welcome to Corporate Empire!')
            .setColor(0x0099FF)
            .setDescription('A sophisticated business simulation where you build and manage companies in a competitive economy.')
            .addFields(
                { name: '🏢 Core Gameplay', value: '• Create and manage companies\\n• Hire NPC workers or real players\\n• Trade stocks on the exchange\\n• File patents for passive income\\n• Apply for loans to expand', inline: true },
                { name: '⏰ Time System', value: '• 1 real day = 1 game month\\n• Monthly economic cycles\\n• Automatic revenue processing\\n• Employee salary payments\\n• Tax collection (8%)', inline: true },
                { name: '💰 Economic Features', value: '• Stock market with real pricing\\n• Credit-based loan system\\n• Patent royalties\\n• Government taxation\\n• Player vs NPC productivity', inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'Corporate Empire Bot | Use buttons below for detailed guides' });

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('help_start')
                    .setLabel('🚀 Getting Started')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('help_companies')
                    .setLabel('🏢 Companies')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('help_stocks')
                    .setLabel('📈 Stock Trading')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('help_economy')
                    .setLabel('🏛️ Economy')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.reply({ embeds: [embed], components: [buttons] });
    },

    async handleSpecificTopic(interaction, client, topic) {
        const topics = {
            start: {
                title: '🚀 Getting Started Guide',
                color: 0x00FF00,
                description: 'Step-by-step guide to begin your corporate empire',
                fields: [
                    { name: '1️⃣ Check Your Cash', value: 'Start with $100,000. View with any command or `/stock portfolio`', inline: false },
                    { name: '2️⃣ Create a Company', value: 'Use `/company create` to submit an application. Admins will review and approve.', inline: false },
                    { name: '3️⃣ Hire Your First Employees', value: 'Use `/employees hire` to hire NPCs (1x productivity) or players (2.5x productivity)', inline: false },
                    { name: '4️⃣ Submit Patents', value: 'Use `/patent submit` to create intellectual property for passive income', inline: false },
                    { name: '5️⃣ Start Trading', value: 'Buy shares in other companies with `/stock buy` to grow your wealth', inline: false },
                    { name: '⏰ Wait for Monthly Cycle', value: 'Every 24 hours (1 game month), earn revenue from employees and patents!', inline: false }
                ]
            },
            companies: {
                title: '🏢 Company Management',
                color: 0x4169E1,
                description: 'Everything about creating and managing companies',
                fields: [
                    { name: 'Creating Companies', value: '`/company create` - Submit application\\n`/company my` - View your companies\\n`/company info` - View any company details', inline: false },
                    { name: 'Company Mechanics', value: '• Companies start with approved capital\\n• Valuation changes based on monthly performance\\n• Can hire employees for productivity\\n• Subject to 8% monthly tax on revenue', inline: false },
                    { name: 'Going Public', value: 'Companies can eventually go public to raise capital by selling shares to other players (IPO system)', inline: false }
                ]
            },
            employees: {
                title: '👥 Employee Management',
                color: 0xFF6B35,
                description: 'Understanding the worker productivity system',
                fields: [
                    { name: 'Employee Types', value: '**NPC Workers:** 1x productivity, lower cost\\n**Player Workers:** 2.5x productivity, higher cost (salaries paid to real users)', inline: false },
                    { name: 'Commands', value: '`/employees hire` - Hire new workers\\n`/employees fire` - Terminate employees\\n`/employees list` - View company roster', inline: false },
                    { name: 'Revenue Formula', value: '**Monthly Revenue = Σ(Employee Salary × Productivity Multiplier)**\\nNPCs generate salary × 1.0\\nPlayers generate salary × 2.5', inline: false },
                    { name: '💡 Strategy Tip', value: 'Player workers cost more but generate 150% more value - recruit wisely!', inline: false }
                ]
            },
            stocks: {
                title: '📈 Stock Trading Guide',
                color: 0x32CD32,
                description: 'Learn how to trade and invest in the stock market',
                fields: [
                    { name: 'Trading Commands', value: '`/stock buy` - Purchase shares\\n`/stock sell` - Sell your holdings\\n`/stock market` - View all prices\\n`/stock portfolio` - Your investments\\n`/stock price` - Check specific stock', inline: false },
                    { name: 'Pricing Model', value: 'Stock Price = Company Valuation ÷ Outstanding Shares\\n+ Market volatility (±5% random fluctuation)', inline: false },
                    { name: 'Trading Fees', value: '4% exchange fee on all transactions (goes to government)', inline: false },
                    { name: 'Investment Strategy', value: '• Research company fundamentals\\n• Monitor monthly performance reports\\n• Diversify your portfolio\\n• Time your trades with economic cycles', inline: false }
                ]
            },
            patents: {
                title: '📋 Patent System',
                color: 0x9370DB,
                description: 'Generate passive income through intellectual property',
                fields: [
                    { name: 'Patent Types', value: '**Utility:** Inventions and processes\\n**Design:** Appearance and aesthetics\\n**Software:** Algorithms and systems', inline: false },
                    { name: 'Commands', value: '`/patent submit` - File new patent\\n`/patent list` - View company patents\\nAdmins: `/patent approve|reject` - Review applications', inline: false },
                    { name: 'Revenue Generation', value: 'Approved patents earn $5,000+ per month for 20 years (admin sets amount)', inline: false },
                    { name: '💡 Strategy Tip', value: 'Build a patent portfolio early - passive income compounds over time!', inline: false }
                ]
            },
            loans: {
                title: '🏦 Banking & Loans',
                color: 0x228B22,
                description: 'Access capital through the Central Bank loan system',
                fields: [
                    { name: 'Loan Commands', value: '`/loan request` - Apply for financing\\n`/loan status` - View active loans\\n`/loan repay` - Make payments', inline: false },
                    { name: 'Credit Scoring', value: 'Based on company age, valuation growth, and profitability\\n**Score Range:** 300-850\\n**Better scores = lower interest rates**', inline: false },
                    { name: 'Interest Rates', value: '750+ Credit: 5%\\n700-749: 8%\\n650-699: 12%\\n600-649: 15%\\n500-599: 18%\\nBelow 500: 25%', inline: false },
                    { name: 'Loan Limits', value: 'Maximum 3 active loans per company\\nAutomatic monthly payments during economic cycles', inline: false }
                ]
            },
            economy: {
                title: '🏛️ Economic System',
                color: 0xFFD700,
                description: 'Understanding the monthly economic cycle',
                fields: [
                    { name: '⏰ Monthly Cycle (Every 24 Hours)', value: '1. **Revenue Generation** - Employee productivity + patent royalties\\n2. **Tax Collection** - 8% of revenue to Central Bank\\n3. **Payroll** - Salaries paid to workers\\n4. **Loan Payments** - Principal + interest due\\n5. **Valuation Update** - Based on net performance', inline: false },
                    { name: '🏛️ Government Services', value: '• Central Bank (loans, taxes)\\n• Stock Exchange (trading fees)\\n• Insurance Corporation\\n• Legal Services (until player law firms exist)', inline: false },
                    { name: '📊 Economic Balance', value: 'Tax revenue funds government operations and economic stability measures', inline: false }
                ]
            }
        };

        const topicData = topics[topic];
        if (!topicData) {
            await interaction.reply({
                content: '❌ Invalid help topic.',
                ephemeral: true
            });
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle(topicData.title)
            .setColor(topicData.color)
            .setDescription(topicData.description)
            .addFields(topicData.fields)
            .setTimestamp()
            .setFooter({ text: 'Corporate Empire Help System' });

        const backButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('help_main')
                    .setLabel('← Back to Main Help')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.reply({ embeds: [embed], components: [backButton] });
    }
};

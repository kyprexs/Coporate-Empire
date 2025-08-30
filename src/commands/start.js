const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('start')
        .setDescription('Begin your Corporate Empire journey'),

    async execute(interaction, client) {
        try {
            // Ensure user exists and get their data
            await client.db.createUser(interaction.user.id, interaction.user.username);
            const user = await client.db.getUser(interaction.user.id);

            // Check if user already has companies
            const companies = await client.db.getCompaniesByOwner(interaction.user.id);
            const hasCompanies = companies.length > 0;

            // Simplified portfolio data (TODO: Implement proper stock portfolio queries for MongoDB)
            const portfolioValue = 0;
            const stockCount = 0;
            const isEmployed = false;
            const monthlyIncome = 0;

            const embed = new EmbedBuilder()
                .setTitle(`🎮 Welcome to Corporate Empire, ${interaction.user.username}!`)
                .setColor(0x00FF00)
                .setDescription(hasCompanies ? 
                    '🎉 **Welcome back, business mogul!** Here\'s your current empire status:' : 
                    '🚀 **Ready to build your business empire?** Here\'s how to get started:')
                .addFields(
                    { name: '💰 Your Cash', value: `$${user.cash.toLocaleString()}`, inline: true },
                    { name: '🏢 Companies Owned', value: companies.length.toString(), inline: true },
                    { name: '📈 Stock Portfolio', value: `${stockCount} holdings\\n$${portfolioValue.toLocaleString()} value`, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'Corporate Empire Bot' });

            if (isEmployed) {
                embed.addFields({
                    name: '👔 Employment Status',
                    value: `Working ${employment.jobs} job(s)\\nEarning $${monthlyIncome.toLocaleString()}/month`,
                    inline: true
                });
            }

            if (!hasCompanies) {
                embed.addFields({
                    name: '🎯 Getting Started Checklist',
                    value: '1️⃣ Create your first company with `/company create`\\n2️⃣ Hire employees with `/employees hire`\\n3️⃣ Submit patents with `/patent submit`\\n4️⃣ Invest in other companies with `/stock buy`\\n5️⃣ Watch your empire grow each month!',
                    inline: false
                });
            } else {
                // Show current company performance
                let totalValuation = 0;
                let companyList = '';
                
                for (const company of companies.slice(0, 3)) {
                    totalValuation += company.current_valuation;
                    companyList += `• ${company.name}: $${company.current_valuation.toLocaleString()}\\n`;
                }

                embed.addFields({
                    name: '🏢 Your Companies',
                    value: companyList + (companies.length > 3 ? `...and ${companies.length - 3} more` : ''),
                    inline: false
                });

                embed.addFields({
                    name: '💼 Total Empire Value',
                    value: `$${(user.cash + portfolioValue + totalValuation).toLocaleString()}`,
                    inline: true
                });
            }

            // Create action buttons
            const actionButtons = new ActionRowBuilder();

            if (!hasCompanies) {
                actionButtons.addComponents(
                    new ButtonBuilder()
                        .setCustomId('quick_company_create')
                        .setLabel('🏢 Create Company')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('help_start')
                        .setLabel('📚 Tutorial')
                        .setStyle(ButtonStyle.Primary)
                );
            } else {
                actionButtons.addComponents(
                    new ButtonBuilder()
                        .setCustomId('quick_stock_market')
                        .setLabel('📈 Stock Market')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('quick_company_status')
                        .setLabel('🏢 My Companies')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('help_main')
                        .setLabel('❓ Help')
                        .setStyle(ButtonStyle.Secondary)
                );
            }

            await interaction.reply({ embeds: [embed], components: [actionButtons] });

        } catch (error) {
            console.error('Error in start command:', error);
            await interaction.reply({
                content: '❌ There was an error initializing your account.',
                ephemeral: true
            });
        }
    }
};

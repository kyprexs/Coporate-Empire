const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loan')
        .setDescription('Manage company loans from the Central Bank')
        .addSubcommand(subcommand =>
            subcommand
                .setName('request')
                .setDescription('Apply for a loan from the Central Bank')
                .addStringOption(option =>
                    option
                        .setName('company')
                        .setDescription('Company name or ticker symbol')
                        .setRequired(true)
                )
                .addNumberOption(option =>
                    option
                        .setName('amount')
                        .setDescription('Loan amount requested')
                        .setRequired(true)
                        .setMinValue(10000)
                        .setMaxValue(10000000)
                )
                .addIntegerOption(option =>
                    option
                        .setName('term')
                        .setDescription('Loan term in months')
                        .setRequired(true)
                        .setMinValue(6)
                        .setMaxValue(240)
                        .addChoices(
                            { name: '6 months (Short term)', value: 6 },
                            { name: '12 months (1 year)', value: 12 },
                            { name: '24 months (2 years)', value: 24 },
                            { name: '36 months (3 years)', value: 36 },
                            { name: '60 months (5 years)', value: 60 },
                            { name: '120 months (10 years)', value: 120 }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Check loan status for your company')
                .addStringOption(option =>
                    option
                        .setName('company')
                        .setDescription('Company name or ticker symbol')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('repay')
                .setDescription('Make an early loan payment')
                .addIntegerOption(option =>
                    option
                        .setName('loan_id')
                        .setDescription('Loan ID to repay')
                        .setRequired(true)
                )
                .addNumberOption(option =>
                    option
                        .setName('amount')
                        .setDescription('Payment amount (leave empty for minimum payment)')
                        .setRequired(false)
                        .setMinValue(100)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('bank_status')
                .setDescription('View Central Bank status (Admin only)')
        ),

    async execute(interaction, client) {
        const embed = new EmbedBuilder()
            .setTitle('🚧 Feature Under MongoDB Migration')
            .setDescription(`The **/loans** system is currently being updated for MongoDB compatibility.`)
            .setColor(0xFFA500)
            .addFields(
                { name: '⏳ Status', value: 'Migration in progress', inline: true },
                { name: '🔄 Expected', value: 'Available soon', inline: true },
                { name: '💡 Alternative', value: 'Use basic commands for now', inline: true }
            )
            .setFooter({ text: 'Corporate Empire Bot - MongoDB Migration' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
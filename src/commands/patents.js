const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('patent')
        .setDescription('Manage patents and intellectual property')
        .addSubcommand(subcommand =>
            subcommand
                .setName('submit')
                .setDescription('Submit a patent application')
                .addStringOption(option =>
                    option
                        .setName('company')
                        .setDescription('Company name or ticker symbol')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('type')
                        .setDescription('Type of patent')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Utility Patent (inventions, processes)', value: 'utility' },
                            { name: 'Design Patent (appearance, aesthetics)', value: 'design' },
                            { name: 'Software Patent (algorithms, systems)', value: 'software' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List company patents')
                .addStringOption(option =>
                    option
                        .setName('company')
                        .setDescription('Company name or ticker symbol')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('approve')
                .setDescription('Approve a pending patent (Admin only)')
                .addIntegerOption(option =>
                    option
                        .setName('patent_id')
                        .setDescription('Patent ID to approve')
                        .setRequired(true)
                )
                .addNumberOption(option =>
                    option
                        .setName('monthly_revenue')
                        .setDescription('Monthly revenue this patent will generate')
                        .setRequired(false)
                        .setMinValue(1000)
                        .setMaxValue(50000)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('reject')
                .setDescription('Reject a pending patent (Admin only)')
                .addIntegerOption(option =>
                    option
                        .setName('patent_id')
                        .setDescription('Patent ID to reject')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('pending')
                .setDescription('List all pending patents (Admin only)')
        ),

    async execute(interaction, client) {
        const embed = new EmbedBuilder()
            .setTitle('🚧 Feature Under MongoDB Migration')
            .setDescription(`The **/patents** system is currently being updated for MongoDB compatibility.`)
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
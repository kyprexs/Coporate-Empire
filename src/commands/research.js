const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('research')
        .setDescription('Research & Development for innovation and technology')
        .addSubcommand(subcommand =>
            subcommand
                .setName('start')
                .setDescription('Start a new R&D project')
                .addStringOption(option =>
                    option
                        .setName('company')
                        .setDescription('Company to start R&D project for')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('category')
                        .setDescription('Research category')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Technology Innovation', value: 'technology' },
                            { name: 'Product Development', value: 'product' },
                            { name: 'Process Improvement', value: 'process' },
                            { name: 'Market Research', value: 'market' },
                            { name: 'Sustainability', value: 'sustainability' },
                            { name: 'Quality Assurance', value: 'quality' },
                            { name: 'Cost Optimization', value: 'cost' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List R&D projects for your companies')
                .addStringOption(option =>
                    option
                        .setName('status')
                        .setDescription('Filter by project status')
                        .addChoices(
                            { name: 'All', value: 'all' },
                            { name: 'Active', value: 'active' },
                            { name: 'Completed', value: 'completed' },
                            { name: 'Cancelled', value: 'cancelled' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View R&D project details')
                .addIntegerOption(option =>
                    option
                        .setName('project_id')
                        .setDescription('R&D project ID to view')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('invest')
                .setDescription('Invest additional funds in an R&D project')
                .addIntegerOption(option =>
                    option
                        .setName('project_id')
                        .setDescription('R&D project ID')
                        .setRequired(true)
                )
                .addNumberOption(option =>
                    option
                        .setName('amount')
                        .setDescription('Additional investment amount')
                        .setRequired(true)
                        .setMinValue(1000)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('cancel')
                .setDescription('Cancel an active R&D project')
                .addIntegerOption(option =>
                    option
                        .setName('project_id')
                        .setDescription('R&D project ID to cancel')
                        .setRequired(true)
                )
        ),

    async execute(interaction, client) {
        const embed = new EmbedBuilder()
            .setTitle('🚧 Feature Under MongoDB Migration')
            .setDescription(`The **/research** system is currently being updated for MongoDB compatibility.`)
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
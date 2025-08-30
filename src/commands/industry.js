const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('industry')
        .setDescription('Industry specialization and market analysis')
        .addSubcommand(subcommand =>
            subcommand
                .setName('specialize')
                .setDescription('Specialize your company in a specific industry')
                .addStringOption(option =>
                    option
                        .setName('company')
                        .setDescription('Company to specialize')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('industry_type')
                        .setDescription('Industry specialization')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Technology (1.3x revenue, high R&D benefits)', value: 'technology' },
                            { name: 'Finance (1.25x revenue, market sensitive)', value: 'finance' },
                            { name: 'Healthcare (1.2x revenue, stable demand)', value: 'healthcare' },
                            { name: 'Energy (1.15x revenue, commodity dependent)', value: 'energy' },
                            { name: 'Manufacturing (1.1x revenue, scale efficient)', value: 'manufacturing' },
                            { name: 'Retail (1.0x revenue, consumer focused)', value: 'retail' },
                            { name: 'Agriculture (0.9x revenue, weather dependent)', value: 'agriculture' },
                            { name: 'Hospitality (0.85x revenue, seasonal)', value: 'hospitality' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('analysis')
                .setDescription('View industry market analysis and trends')
                .addStringOption(option =>
                    option
                        .setName('industry_type')
                        .setDescription('Industry to analyze (optional)')
                        .addChoices(
                            { name: 'Technology', value: 'technology' },
                            { name: 'Finance', value: 'finance' },
                            { name: 'Healthcare', value: 'healthcare' },
                            { name: 'Energy', value: 'energy' },
                            { name: 'Manufacturing', value: 'manufacturing' },
                            { name: 'Retail', value: 'retail' },
                            { name: 'Agriculture', value: 'agriculture' },
                            { name: 'Hospitality', value: 'hospitality' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('leaders')
                .setDescription('View industry leaders and market share')
        ),

    async execute(interaction, client) {
        const embed = new EmbedBuilder()
            .setTitle('🚧 Feature Under MongoDB Migration')
            .setDescription(`The **/industry** system is currently being updated for MongoDB compatibility.`)
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
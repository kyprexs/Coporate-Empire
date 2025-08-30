const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('events')
        .setDescription('Market events and economic cycles')
        .addSubcommand(subcommand =>
            subcommand
                .setName('current')
                .setDescription('View current active market events')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('history')
                .setDescription('View past market events')
                .addIntegerOption(option =>
                    option
                        .setName('limit')
                        .setDescription('Number of events to show (default: 10)')
                        .setMinValue(1)
                        .setMaxValue(50)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('impact')
                .setDescription('View how market events affected your companies')
                .addStringOption(option =>
                    option
                        .setName('company')
                        .setDescription('Company name or ticker symbol (optional)')
                )
        ),

    async execute(interaction, client) {
        const embed = new EmbedBuilder()
            .setTitle('🚧 Feature Under MongoDB Migration')
            .setDescription(`The **/events** system is currently being updated for MongoDB compatibility.`)
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
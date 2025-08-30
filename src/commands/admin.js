const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin')
        .setDescription('Administrative commands for economic system management')
        .addSubcommand(subcommand =>
            subcommand
                .setName('economy_status')
                .setDescription('View overall economic system status')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('trigger_cycle')
                .setDescription('Manually trigger monthly economic cycle (for testing)')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('default_companies')
                .setDescription('View or reinitialize default companies')
                .addStringOption(option =>
                    option
                        .setName('action')
                        .setDescription('Action to perform')
                        .setRequired(false)
                        .addChoices(
                            { name: 'View current status', value: 'view' },
                            { name: 'Reinitialize all', value: 'reinit' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('scheduler_status')
                .setDescription('View economic scheduler status')
        ),

    async execute(interaction, client) {
        const embed = new EmbedBuilder()
            .setTitle('🚧 Feature Under MongoDB Migration')
            .setDescription(`The **/admin** system is currently being updated for MongoDB compatibility.`)
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
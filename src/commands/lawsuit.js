const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lawsuit')
        .setDescription('Legal system for disputes and litigation')
        .addSubcommand(subcommand =>
            subcommand
                .setName('file')
                .setDescription('File a lawsuit against a company')
                .addStringOption(option =>
                    option
                        .setName('defendant')
                        .setDescription('Company name or ticker symbol to sue')
                        .setRequired(true)
                )
                .addNumberOption(option =>
                    option
                        .setName('damages')
                        .setDescription('Requested damages amount')
                        .setRequired(true)
                        .setMinValue(1000)
                        .setMaxValue(10000000)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View details of a lawsuit')
                .addIntegerOption(option =>
                    option
                        .setName('lawsuit_id')
                        .setDescription('Lawsuit ID to view')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List lawsuits (your filed cases or cases against your companies)')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('settle')
                .setDescription('Propose a settlement for a lawsuit')
                .addIntegerOption(option =>
                    option
                        .setName('lawsuit_id')
                        .setDescription('Lawsuit ID to settle')
                        .setRequired(true)
                )
                .addNumberOption(option =>
                    option
                        .setName('amount')
                        .setDescription('Settlement amount offered')
                        .setRequired(true)
                        .setMinValue(0)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('judge')
                .setDescription('Make a ruling on a lawsuit (Admin only)')
                .addIntegerOption(option =>
                    option
                        .setName('lawsuit_id')
                        .setDescription('Lawsuit ID to rule on')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('ruling')
                        .setDescription('Court ruling')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Dismiss - No merit', value: 'dismissed' },
                            { name: 'Rule for Plaintiff - Award damages', value: 'plaintiff' },
                            { name: 'Rule for Defendant - No damages', value: 'defendant' }
                        )
                )
                .addNumberOption(option =>
                    option
                        .setName('award')
                        .setDescription('Damage award (if ruling for plaintiff)')
                        .setRequired(false)
                        .setMinValue(0)
                )
        ),

    async execute(interaction, client) {
        const embed = new EmbedBuilder()
            .setTitle('🚧 Feature Under MongoDB Migration')
            .setDescription(`The **/lawsuit** system is currently being updated for MongoDB compatibility.`)
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
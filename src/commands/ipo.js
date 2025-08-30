const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ipo')
        .setDescription('Initial Public Offering - Take your company public')
        .addSubcommand(subcommand =>
            subcommand
                .setName('launch')
                .setDescription('Launch an IPO for your company')
                .addStringOption(option =>
                    option
                        .setName('company')
                        .setDescription('Company name or ticker symbol')
                        .setRequired(true)
                )
                .addNumberOption(option =>
                    option
                        .setName('shares_to_sell')
                        .setDescription('Number of shares to sell to public (max 49% of company)')
                        .setRequired(true)
                        .setMinValue(10000)
                        .setMaxValue(490000)
                )
                .addNumberOption(option =>
                    option
                        .setName('price_per_share')
                        .setDescription('IPO price per share')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(1000)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Check IPO eligibility and company public status')
                .addStringOption(option =>
                    option
                        .setName('company')
                        .setDescription('Company name or ticker symbol')
                        .setRequired(true)
                )
        ),

    async execute(interaction, client) {
        const embed = new EmbedBuilder()
            .setTitle('🚧 Feature Under MongoDB Migration')
            .setDescription(`The **/ipo** system is currently being updated for MongoDB compatibility.`)
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
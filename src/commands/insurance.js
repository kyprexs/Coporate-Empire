const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('insurance')
        .setDescription('Business insurance and risk management')
        .addSubcommand(subcommand =>
            subcommand
                .setName('buy')
                .setDescription('Purchase insurance for your company')
                .addStringOption(option =>
                    option
                        .setName('company')
                        .setDescription('Company to insure')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('type')
                        .setDescription('Type of insurance')
                        .setRequired(true)
                        .addChoices(
                            { name: 'General Liability', value: 'liability' },
                            { name: 'Property Insurance', value: 'property' },
                            { name: 'Business Interruption', value: 'interruption' },
                            { name: 'Cyber Security', value: 'cyber' },
                            { name: 'Directors & Officers', value: 'directors' },
                            { name: 'Professional Indemnity', value: 'professional' },
                            { name: 'Comprehensive Package', value: 'comprehensive' }
                        )
                )
                .addNumberOption(option =>
                    option
                        .setName('coverage_amount')
                        .setDescription('Coverage amount in dollars')
                        .setRequired(true)
                        .setMinValue(100000)
                        .setMaxValue(100000000)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('policies')
                .setDescription('View your insurance policies')
                .addStringOption(option =>
                    option
                        .setName('company')
                        .setDescription('Company to view policies for (optional)')
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('claim')
                .setDescription('File an insurance claim')
                .addIntegerOption(option =>
                    option
                        .setName('policy_id')
                        .setDescription('Insurance policy ID')
                        .setRequired(true)
                )
                .addNumberOption(option =>
                    option
                        .setName('claim_amount')
                        .setDescription('Amount to claim')
                        .setRequired(true)
                        .setMinValue(1000)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('renew')
                .setDescription('Renew an expiring insurance policy')
                .addIntegerOption(option =>
                    option
                        .setName('policy_id')
                        .setDescription('Insurance policy ID to renew')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('cancel')
                .setDescription('Cancel an insurance policy')
                .addIntegerOption(option =>
                    option
                        .setName('policy_id')
                        .setDescription('Insurance policy ID to cancel')
                        .setRequired(true)
                )
        ),

    async execute(interaction, client) {
        const embed = new EmbedBuilder()
            .setTitle('🚧 Feature Under MongoDB Migration')
            .setDescription(`The **/insurance** system is currently being updated for MongoDB compatibility.`)
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
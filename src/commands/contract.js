const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('contract')
        .setDescription('Business contracts and agreements')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a new business contract')
                .addStringOption(option =>
                    option
                        .setName('company')
                        .setDescription('Your company creating the contract')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('counterparty')
                        .setDescription('Other company or user to contract with')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('type')
                        .setDescription('Type of contract')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Supply Agreement', value: 'supply' },
                            { name: 'Service Contract', value: 'service' },
                            { name: 'Partnership', value: 'partnership' },
                            { name: 'Licensing Deal', value: 'licensing' },
                            { name: 'Joint Venture', value: 'joint_venture' },
                            { name: 'Non-Disclosure Agreement', value: 'nda' },
                            { name: 'Employment Contract', value: 'employment' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List contracts for your companies')
                .addStringOption(option =>
                    option
                        .setName('status')
                        .setDescription('Filter by contract status')
                        .addChoices(
                            { name: 'All', value: 'all' },
                            { name: 'Pending', value: 'pending' },
                            { name: 'Active', value: 'active' },
                            { name: 'Completed', value: 'completed' },
                            { name: 'Cancelled', value: 'cancelled' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View contract details')
                .addIntegerOption(option =>
                    option
                        .setName('contract_id')
                        .setDescription('Contract ID to view')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('sign')
                .setDescription('Sign a pending contract')
                .addIntegerOption(option =>
                    option
                        .setName('contract_id')
                        .setDescription('Contract ID to sign')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('cancel')
                .setDescription('Cancel a contract (if you created it)')
                .addIntegerOption(option =>
                    option
                        .setName('contract_id')
                        .setDescription('Contract ID to cancel')
                        .setRequired(true)
                )
        ),

    async execute(interaction, client) {
        const embed = new EmbedBuilder()
            .setTitle('🚧 Feature Under MongoDB Migration')
            .setDescription(`The **/contract** system is currently being updated for MongoDB compatibility.`)
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
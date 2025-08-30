const { EmbedBuilder } = require('discord.js');

module.exports = {
    async handleContractSubmission(interaction, client) {
        try {
            // Parse custom ID to get contract details
            const parts = interaction.customId.split('_');
            const companyId = parseInt(parts[2]);
            const counterpartyId = parseInt(parts[3]);
            const counterpartyType = parts[4];
            const contractType = parts[5];

            // Get form data
            const title = interaction.fields.getTextInputValue('contract_title');
            const terms = interaction.fields.getTextInputValue('contract_terms');
            const contractValue = parseFloat(interaction.fields.getTextInputValue('contract_value'));
            const duration = parseInt(interaction.fields.getTextInputValue('contract_duration'));
            const additionalTerms = interaction.fields.getTextInputValue('contract_additional');

            // Validate inputs
            if (isNaN(contractValue) || contractValue <= 0) {
                await interaction.reply({
                    content: '❌ Please enter a valid contract value.',
                    ephemeral: true
                });
                return;
            }

            if (isNaN(duration) || duration <= 0 || duration > 60) {
                await interaction.reply({
                    content: '❌ Please enter a valid duration (1-60 months).',
                    ephemeral: true
                });
                return;
            }

            // Get company and counterparty details
            const company = await client.db.db.get('SELECT * FROM companies WHERE id = ?', [companyId]);
            
            let counterparty;
            if (counterpartyType === 'company') {
                counterparty = await client.db.db.get('SELECT * FROM companies WHERE id = ?', [counterpartyId]);
            } else {
                counterparty = await client.db.db.get('SELECT * FROM users WHERE id = ?', [counterpartyId]);
            }

            if (!company || !counterparty) {
                await interaction.reply({
                    content: '❌ Error finding company or counterparty information.',
                    ephemeral: true
                });
                return;
            }

            // Create contract
            const result = await client.db.db.run(`
                INSERT INTO contracts 
                (party_a_id, party_b_id, contract_type, title, terms, 
                 contract_value, duration_months, additional_terms, 
                 status, created_at, creator_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP, ?)
            `, [
                companyId,
                counterpartyType === 'company' ? counterpartyId : null,
                contractType,
                title,
                terms,
                contractValue,
                duration,
                additionalTerms || null,
                interaction.user.id
            ]);

            const contractId = result.lastID;

            const embed = new EmbedBuilder()
                .setTitle('📋 Contract Created Successfully!')
                .setColor(0x32CD32)
                .addFields(
                    { name: 'Contract ID', value: contractId.toString(), inline: true },
                    { name: 'Type', value: this.getContractTypeName(contractType), inline: true },
                    { name: 'Value', value: `$${contractValue.toLocaleString()}`, inline: true },
                    { name: 'Duration', value: `${duration} months`, inline: true },
                    { name: 'Party A (Creator)', value: company.name, inline: true },
                    { name: 'Party B', value: counterpartyType === 'company' ? counterparty.name : counterparty.username, inline: true }
                )
                .setDescription(`📄 **${title}**\\n\\n${terms}`)
                .setTimestamp()
                .setFooter({ text: 'Corporate Empire Legal Department' });

            if (additionalTerms) {
                embed.addFields({
                    name: 'Additional Terms',
                    value: additionalTerms,
                    inline: false
                });
            }

            await interaction.reply({ embeds: [embed] });

            // Notify counterparty
            try {
                let counterpartyUserId;
                if (counterpartyType === 'company') {
                    counterpartyUserId = counterparty.owner_id;
                } else {
                    counterpartyUserId = counterparty.discord_id;
                }

                if (counterpartyUserId && counterpartyUserId !== interaction.user.id) {
                    const counterpartyUser = await client.users.fetch(counterpartyUserId);
                    if (counterpartyUser) {
                        const notificationEmbed = new EmbedBuilder()
                            .setTitle('📋 New Contract Proposal')
                            .setColor(0x0099FF)
                            .setDescription(`You have received a new contract proposal from ${company.name}!`)
                            .addFields(
                                { name: 'Contract', value: title, inline: true },
                                { name: 'Value', value: `$${contractValue.toLocaleString()}`, inline: true },
                                { name: 'Duration', value: `${duration} months`, inline: true }
                            )
                            .setFooter({ text: `Use /contract view ${contractId} to review and sign` });

                        await counterpartyUser.send({ embeds: [notificationEmbed] });
                    }
                }
            } catch (notifyError) {
                console.log('Could not notify counterparty:', notifyError.message);
            }

        } catch (error) {
            console.error('Error handling contract submission:', error);
            await interaction.reply({
                content: '❌ There was an error creating the contract.',
                ephemeral: true
            });
        }
    },

    getContractTypeName(type) {
        const types = {
            'supply': 'Supply Agreement',
            'service': 'Service Contract', 
            'partnership': 'Partnership',
            'licensing': 'Licensing Deal',
            'joint_venture': 'Joint Venture',
            'nda': 'Non-Disclosure Agreement',
            'employment': 'Employment Contract'
        };
        return types[type] || type;
    }
};

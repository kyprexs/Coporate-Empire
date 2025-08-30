const { EmbedBuilder } = require('discord.js');

module.exports = {
    async handleLawsuitSubmission(interaction, client) {
        try {
            // Parse custom ID: lawsuit_file_{companyId}_{requestedDamages}
            const [, , companyId, requestedDamages] = interaction.customId.split('_');
            
            // Get form data
            const claim = interaction.fields.getTextInputValue('claim');
            const evidence = interaction.fields.getTextInputValue('evidence');
            
            const damages = parseFloat(requestedDamages);
            
            // Get company details
            const company = await client.db.getCompany(parseInt(companyId));
            if (!company) {
                await interaction.reply({
                    content: '❌ Company not found.',
                    ephemeral: true
                });
                return;
            }

            // Final validation - ensure user isn't suing their own company
            if (company.owner_id === interaction.user.id) {
                await interaction.reply({
                    content: '❌ You cannot sue your own company.',
                    ephemeral: true
                });
                return;
            }

            // Check filing fee again
            const filingFee = 1000;
            const user = await client.db.getUser(interaction.user.id);
            if (user.cash < filingFee) {
                await interaction.reply({
                    content: `❌ Insufficient funds for filing fee ($${filingFee.toLocaleString()}).`,
                    ephemeral: true
                });
                return;
            }

            // Create the lawsuit
            const lawsuitData = {
                plaintiffId: interaction.user.id,
                defendantCompanyId: parseInt(companyId),
                claim: `${claim}\n\n**Evidence:** ${evidence}`,
                requestedDamages: damages
            };

            const lawsuitId = await client.db.createLawsuit(lawsuitData);

            // Deduct filing fee
            await client.db.updateUserCash(interaction.user.id, -filingFee);

            const embed = new EmbedBuilder()
                .setTitle('⚖️ Lawsuit Filed Successfully')
                .setColor(0xFFA500)
                .addFields(
                    { name: 'Lawsuit ID', value: `#${lawsuitId}`, inline: true },
                    { name: 'Defendant', value: company.name, inline: true },
                    { name: 'Damages Requested', value: `$${damages.toLocaleString()}`, inline: true },
                    { name: 'Filing Fee', value: `$${filingFee.toLocaleString()} (deducted)`, inline: true },
                    { name: 'Status', value: '⏳ Pending Admin Review', inline: true },
                    { name: 'Filed Date', value: new Date().toLocaleDateString(), inline: true },
                    { name: 'Legal Claim', value: claim.length > 200 ? claim.substring(0, 200) + '...' : claim, inline: false }
                )
                .setDescription('Your lawsuit has been filed and is awaiting admin review. Both parties will be notified of any developments.')
                .setTimestamp()
                .setFooter({ text: 'Corporate Empire Legal System' });

            await interaction.reply({ embeds: [embed] });

            // Notify the defendant company owner
            try {
                const defendant = await interaction.guild.members.fetch(company.owner_id);
                const notificationEmbed = new EmbedBuilder()
                    .setTitle('⚖️ Lawsuit Filed Against Your Company')
                    .setColor(0xFF0000)
                    .addFields(
                        { name: 'Plaintiff', value: interaction.user.username, inline: true },
                        { name: 'Company', value: company.name, inline: true },
                        { name: 'Damages', value: `$${damages.toLocaleString()}`, inline: true },
                        { name: 'Claim', value: claim.substring(0, 500) + (claim.length > 500 ? '...' : ''), inline: false }
                    )
                    .setDescription(`Lawsuit #${lawsuitId} has been filed against your company. You can view details with \`/lawsuit view ${lawsuitId}\` and propose a settlement if desired.`)
                    .setTimestamp();

                await defendant.send({ embeds: [notificationEmbed] });
            } catch (dmError) {
                console.log('Could not send lawsuit notification to defendant:', dmError.message);
            }

            // Notify admins
            try {
                const adminChannel = interaction.guild.channels.cache.find(ch => 
                    ch.name === 'admin-lawsuits' || 
                    ch.name === 'admin-legal' || 
                    ch.name === 'admin-log'
                );

                if (adminChannel) {
                    const adminEmbed = new EmbedBuilder()
                        .setTitle('⚖️ New Lawsuit Filed')
                        .setColor(0xFFA500)
                        .addFields(
                            { name: 'Lawsuit ID', value: `#${lawsuitId}`, inline: true },
                            { name: 'Plaintiff', value: interaction.user.tag, inline: true },
                            { name: 'Defendant', value: company.name, inline: true },
                            { name: 'Damages', value: `$${damages.toLocaleString()}`, inline: true },
                            { name: 'Claim', value: claim.substring(0, 800) + (claim.length > 800 ? '...' : ''), inline: false }
                        )
                        .setDescription(`Use \`/lawsuit judge ${lawsuitId}\` to make a ruling on this case.`)
                        .setTimestamp();

                    await adminChannel.send({ 
                        content: `<@&${process.env.ADMIN_ROLE_ID}>`,
                        embeds: [adminEmbed] 
                    });
                }
            } catch (adminNotifyError) {
                console.log('Could not send admin notification for lawsuit:', adminNotifyError.message);
            }

        } catch (error) {
            console.error('Error in lawsuit submission:', error);
            await interaction.reply({
                content: '❌ There was an error filing your lawsuit.',
                ephemeral: true
            });
        }
    }
};

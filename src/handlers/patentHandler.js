const { EmbedBuilder } = require('discord.js');

module.exports = {
    async handlePatentSubmission(interaction, client) {
        try {
            // Parse custom ID: patent_submit_{companyId}_{patentType}
            const [, , companyId, patentType] = interaction.customId.split('_');
            
            // Get form data
            const patentTitle = interaction.fields.getTextInputValue('patent_title');
            const patentDescription = interaction.fields.getTextInputValue('patent_description');
            
            // Get company details
            const company = await client.db.getCompany(parseInt(companyId));
            if (!company) {
                await interaction.reply({
                    content: '❌ Company not found.',
                    ephemeral: true
                });
                return;
            }

            // Check if user still owns the company
            if (company.owner_id !== interaction.user.id) {
                await interaction.reply({
                    content: '❌ You no longer own this company.',
                    ephemeral: true
                });
                return;
            }

            // Check for duplicate patent titles within the company
            const existingPatent = await client.db.db.get(
                'SELECT * FROM patents WHERE company_id = ? AND LOWER(title) = LOWER(?)',
                [parseInt(companyId), patentTitle]
            );

            if (existingPatent) {
                await interaction.reply({
                    content: '❌ Your company already has a patent with this title. Please choose a different title.',
                    ephemeral: true
                });
                return;
            }

            // Submit the patent
            const patentId = await client.db.submitPatent(
                parseInt(companyId),
                patentTitle,
                patentDescription,
                patentType
            );

            const embed = new EmbedBuilder()
                .setTitle('📋 Patent Application Submitted')
                .setColor(0x9370DB)
                .addFields(
                    { name: 'Patent ID', value: `#${patentId}`, inline: true },
                    { name: 'Title', value: patentTitle, inline: true },
                    { name: 'Type', value: patentType.charAt(0).toUpperCase() + patentType.slice(1), inline: true },
                    { name: 'Company', value: company.name, inline: true },
                    { name: 'Status', value: '⏳ Pending Admin Review', inline: true },
                    { name: 'Filed Date', value: new Date().toLocaleDateString(), inline: true },
                    { name: 'Description', value: patentDescription.length > 200 ? patentDescription.substring(0, 200) + '...' : patentDescription, inline: false }
                )
                .setDescription('Your patent application has been submitted and is awaiting admin review. You will be notified when a decision is made.')
                .setTimestamp()
                .setFooter({ text: 'Corporate Empire Patent Office' });

            await interaction.reply({ embeds: [embed] });

            // Notify admins about the new patent application
            try {
                const adminRole = interaction.guild.roles.cache.get(process.env.ADMIN_ROLE_ID);
                if (adminRole) {
                    const adminNotificationEmbed = new EmbedBuilder()
                        .setTitle('📋 New Patent Application')
                        .setColor(0xFFA500)
                        .addFields(
                            { name: 'Patent ID', value: `#${patentId}`, inline: true },
                            { name: 'Company', value: company.name, inline: true },
                            { name: 'Type', value: patentType, inline: true },
                            { name: 'Title', value: patentTitle, inline: false },
                            { name: 'Description', value: patentDescription.substring(0, 500) + (patentDescription.length > 500 ? '...' : ''), inline: false }
                        )
                        .setDescription(`**Applicant:** ${interaction.user.tag}\\n\\nUse \`/patent approve ${patentId}\` or \`/patent reject ${patentId}\` to review this application.`)
                        .setTimestamp();

                    // Send to admin channel or DM admins
                    const adminChannel = interaction.guild.channels.cache.find(ch => ch.name === 'admin-patents' || ch.name === 'admin-approvals');
                    if (adminChannel) {
                        await adminChannel.send({ 
                            content: `<@&${process.env.ADMIN_ROLE_ID}>`,
                            embeds: [adminNotificationEmbed] 
                        });
                    }
                }
            } catch (adminNotifyError) {
                console.log('Could not send admin notification for patent:', adminNotifyError.message);
            }

        } catch (error) {
            console.error('Error in patent submission:', error);
            await interaction.reply({
                content: '❌ There was an error submitting your patent application.',
                ephemeral: true
            });
        }
    }
};

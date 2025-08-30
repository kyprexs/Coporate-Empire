const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class CompanyHandler {
    static async handleApplicationSubmission(interaction, client) {
        try {
            const customId = interaction.customId;
            const ticketChannelId = customId.split('_').pop();
            const ticketChannel = await interaction.guild.channels.fetch(ticketChannelId);

            // Extract form data
            const companyName = interaction.fields.getTextInputValue('company_name');
            const industry = interaction.fields.getTextInputValue('industry');
            const businessModel = interaction.fields.getTextInputValue('business_model');
            const requestedCapitalStr = interaction.fields.getTextInputValue('requested_capital');
            const businessPlan = interaction.fields.getTextInputValue('business_plan');

            // Parse and validate requested capital
            const requestedCapital = parseFloat(requestedCapitalStr.replace(/[$,]/g, ''));
            const minCapital = parseFloat(process.env.STARTING_CAPITAL_MIN) || 50000;
            const maxCapital = parseFloat(process.env.STARTING_CAPITAL_MAX) || 500000;

            if (isNaN(requestedCapital) || requestedCapital < minCapital || requestedCapital > maxCapital) {
                await interaction.reply({
                    content: `❌ Invalid capital amount. Please enter a number between $${minCapital.toLocaleString()} and $${maxCapital.toLocaleString()}.`,
                    ephemeral: true
                });
                return;
            }

            // Check if company name already exists
            const existingCompany = await client.db.searchCompanyByName(companyName);

            if (existingCompany) {
                await interaction.reply({
                    content: '❌ A company with that name already exists. Please choose a different name.',
                    ephemeral: true
                });
                return;
            }

            // Create the application data object
            const applicationData = {
                applicantId: interaction.user.id,
                companyName: companyName,
                industry: industry,
                businessModel: businessModel,
                requestedCapital: requestedCapital,
                businessPlan: businessPlan,
                ticketChannelId: ticketChannelId,
                submittedAt: new Date().toISOString()
            };

            // Save application to database
            const applicationId = await client.db.createCompanyApplication(applicationData);

            // Create application embed for admins
            const applicationEmbed = new EmbedBuilder()
                .setTitle('📋 New Company Application')
                .setColor(0xFFFF00)
                .setDescription(`**Application ID:** ${applicationId}`)
                .addFields(
                    { name: '👤 Applicant', value: `<@${interaction.user.id}> (${interaction.user.tag})`, inline: true },
                    { name: '🏢 Company Name', value: companyName, inline: true },
                    { name: '🏭 Industry', value: industry, inline: true },
                    { name: '💰 Requested Capital', value: `$${requestedCapital.toLocaleString()}`, inline: true },
                    { name: '📊 Business Model', value: businessModel.length > 1000 ? businessModel.substring(0, 1000) + '...' : businessModel, inline: false },
                    { name: '📈 Business Plan', value: businessPlan.length > 1000 ? businessPlan.substring(0, 1000) + '...' : businessPlan, inline: false }
                )
                .setTimestamp()
                .setFooter({ text: 'Corporate Empire Bot' });

            // Create approval buttons
            const approveButton = new ButtonBuilder()
                .setCustomId(`approve_company_${applicationId}`)
                .setLabel('✅ Approve')
                .setStyle(ButtonStyle.Success);

            const denyButton = new ButtonBuilder()
                .setCustomId(`deny_company_${applicationId}`)
                .setLabel('❌ Deny')
                .setStyle(ButtonStyle.Danger);

            const actionRow = new ActionRowBuilder()
                .addComponents(approveButton, denyButton);

            // Send to ticket channel
            await ticketChannel.send({
                embeds: [applicationEmbed],
                components: [actionRow]
            });

            // Update ticket channel status
            const statusEmbed = new EmbedBuilder()
                .setTitle('✅ Application Submitted')
                .setDescription(`**Applicant:** ${interaction.user.tag}\n**Status:** Under admin review\n**Application ID:** ${applicationId}`)
                .setColor(0x00FF00)
                .setTimestamp()
                .setFooter({ text: 'Corporate Empire Bot' });

            await ticketChannel.send({ embeds: [statusEmbed] });

            await interaction.reply({
                content: '✅ Your company application has been submitted successfully! Admins will review it shortly.',
                ephemeral: true
            });

        } catch (error) {
            console.error('Error handling company application submission:', error);
            await interaction.reply({
                content: '❌ There was an error submitting your application. Please try again.',
                ephemeral: true
            });
        }
    }

    static async handleApplicationDecision(interaction, client, applicationId, action) {
        try {
            await interaction.deferReply({ ephemeral: true });

            // Get application details
            const application = await client.db.getCompanyApplication(applicationId);
            
            if (!application) {
                await interaction.editReply({
                    content: '❌ Application not found.',
                });
                return;
            }

            if (application.status !== 'pending') {
                await interaction.editReply({
                    content: '❌ This application has already been processed.',
                });
                return;
            }

            const applicantId = application.applicant_id;
            const applicant = await interaction.guild.members.fetch(applicantId);
            
            if (action === 'approve') {
                // Generate ticker symbol
                const tickerSymbol = this.generateTickerSymbol(application.company_name);

                // Create the company
                const companyData = {
                    name: application.company_name,
                    ownerId: applicantId,
                    industry: application.industry,
                    subIndustry: null, // Can be expanded later
                    description: JSON.parse(application.application_data).businessModel,
                    startingCapital: application.approved_capital || application.requested_capital,
                    tickerSymbol: tickerSymbol
                };

                const companyId = await client.db.createCompany(companyData);

                // Update application status
                await client.db.updateCompanyApplicationStatus(
                    applicationId,
                    'approved',
                    interaction.user.id,
                    application.approved_capital || application.requested_capital,
                    'Application approved and company created'
                );

                // Give starting capital to the user
                await client.db.updateUserCash(applicantId, companyData.startingCapital);

                // Create approval embed
                const approvalEmbed = new EmbedBuilder()
                    .setTitle('🎉 Company Application Approved!')
                    .setColor(0x00FF00)
                    .addFields(
                        { name: '🏢 Company Name', value: application.company_name, inline: true },
                        { name: '📊 Ticker Symbol', value: tickerSymbol, inline: true },
                        { name: '💰 Starting Capital', value: `$${companyData.startingCapital.toLocaleString()}`, inline: true },
                        { name: '👑 CEO', value: `<@${applicantId}>`, inline: true },
                        { name: '🏭 Industry', value: application.industry, inline: true },
                        { name: '✅ Approved By', value: `<@${interaction.user.id}>`, inline: true }
                    )
                    .setTimestamp()
                    .setFooter({ text: 'Corporate Empire Bot' });

                // Send to ticket channel
                const ticketChannel = await interaction.guild.channels.fetch(application.ticket_channel_id);
                await ticketChannel.send({ embeds: [approvalEmbed] });

                // DM the applicant
                try {
                    await applicant.send({
                        content: `🎉 Congratulations! Your company application for **${application.company_name}** has been approved!`,
                        embeds: [approvalEmbed]
                    });
                } catch (dmError) {
                    console.log('Could not send DM to applicant:', dmError);
                }

                // Close ticket after 30 seconds
                setTimeout(async () => {
                    try {
                        await ticketChannel.send('🎫 This ticket will be deleted in 10 seconds...');
                        setTimeout(async () => {
                            await ticketChannel.delete();
                        }, 10000);
                    } catch (deleteError) {
                        console.error('Error deleting ticket channel:', deleteError);
                    }
                }, 30000);

                await interaction.editReply({
                    content: `✅ Application approved! Company **${application.company_name}** has been created with ticker symbol **${tickerSymbol}**.`
                });

            } else if (action === 'deny') {
                // Update application status
                await client.db.updateCompanyApplicationStatus(
                    applicationId,
                    'denied',
                    interaction.user.id,
                    null,
                    'Application denied by admin'
                );

                // Create denial embed
                const denialEmbed = new EmbedBuilder()
                    .setTitle('❌ Company Application Denied')
                    .setColor(0xFF0000)
                    .addFields(
                        { name: '🏢 Company Name', value: application.company_name, inline: true },
                        { name: '👤 Applicant', value: `<@${applicantId}>`, inline: true },
                        { name: '❌ Denied By', value: `<@${interaction.user.id}>`, inline: true },
                        { name: '📝 Note', value: 'You may reapply with improvements to your application.', inline: false }
                    )
                    .setTimestamp()
                    .setFooter({ text: 'Corporate Empire Bot' });

                // Send to ticket channel
                const ticketChannel = await interaction.guild.channels.fetch(application.ticket_channel_id);
                await ticketChannel.send({ embeds: [denialEmbed] });

                // DM the applicant
                try {
                    await applicant.send({
                        content: `❌ Unfortunately, your company application for **${application.company_name}** has been denied. You may improve your application and reapply.`,
                        embeds: [denialEmbed]
                    });
                } catch (dmError) {
                    console.log('Could not send DM to applicant:', dmError);
                }

                // Close ticket after 30 seconds
                setTimeout(async () => {
                    try {
                        await ticketChannel.send('🎫 This ticket will be deleted in 10 seconds...');
                        setTimeout(async () => {
                            await ticketChannel.delete();
                        }, 10000);
                    } catch (deleteError) {
                        console.error('Error deleting ticket channel:', deleteError);
                    }
                }, 30000);

                await interaction.editReply({
                    content: `❌ Application denied for **${application.company_name}**.`
                });
            }

            // Disable buttons
            const disabledRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('disabled')
                        .setLabel(action === 'approve' ? '✅ Approved' : '❌ Denied')
                        .setStyle(action === 'approve' ? ButtonStyle.Success : ButtonStyle.Danger)
                        .setDisabled(true)
                );

            await interaction.message.edit({ components: [disabledRow] });

        } catch (error) {
            console.error('Error handling application decision:', error);
            await interaction.editReply({
                content: '❌ There was an error processing the application decision.',
            });
        }
    }

    static generateTickerSymbol(companyName) {
        // Generate a ticker symbol from company name
        // Remove common words and take first letters
        const words = companyName.toUpperCase()
            .replace(/[^A-Z\s]/g, '')
            .split(' ')
            .filter(word => !['INC', 'LLC', 'CORP', 'LTD', 'THE', 'AND', 'OF', 'FOR', 'A', 'AN'].includes(word));
        
        let ticker = '';
        
        if (words.length === 1) {
            // Single word, take first 3-4 characters
            ticker = words[0].substring(0, 4);
        } else if (words.length === 2) {
            // Two words, take first 2 letters of each
            ticker = words[0].substring(0, 2) + words[1].substring(0, 2);
        } else {
            // Multiple words, take first letter of each (up to 4)
            ticker = words.slice(0, 4).map(word => word[0]).join('');
        }
        
        return ticker.padEnd(3, 'X'); // Ensure minimum 3 characters
    }
}

module.exports = CompanyHandler;

const { SlashCommandBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('company')
        .setDescription('Manage your companies')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Apply to create a new company (opens a ticket)')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('View information about a company')
                .addStringOption(option =>
                    option
                        .setName('company')
                        .setDescription('Company name or ticker symbol')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all active companies')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('my')
                .setDescription('View your companies')
        ),

    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'create':
                await this.handleCreate(interaction, client);
                break;
            case 'info':
                await this.handleInfo(interaction, client);
                break;
            case 'list':
                await this.handleList(interaction, client);
                break;
            case 'my':
                await this.handleMy(interaction, client);
                break;
        }
    },

    async handleCreate(interaction, client) {
        try {
            // Check if user already has a pending application
            const existingApplication = await client.db.getPendingApplicationByUser(interaction.user.id);

            if (existingApplication) {
                await interaction.reply({
                    content: '❌ You already have a pending company application. Please wait for it to be reviewed.',
                    ephemeral: true
                });
                return;
            }

            // Create a ticket channel for the application
            const guild = interaction.guild;
            const applicantId = interaction.user.id;
            const applicantName = interaction.user.username;

            // Create the ticket channel
            const permissionOverwrites = [
                {
                    id: guild.id,
                    deny: [PermissionFlagsBits.ViewChannel]
                },
                {
                    id: applicantId,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
                }
            ];
            
            // Add admin role permissions if admin role is configured
            if (process.env.ADMIN_ROLE_ID && process.env.ADMIN_ROLE_ID !== 'your_admin_role_id_here') {
                permissionOverwrites.push({
                    id: process.env.ADMIN_ROLE_ID,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages]
                });
            }
            
            const ticketChannel = await guild.channels.create({
                name: `company-app-${applicantName}`,
                type: ChannelType.GuildText,
                parent: null,
                permissionOverwrites
            });

            // Create the application modal
            const modal = new ModalBuilder()
                .setCustomId(`company_application_${ticketChannel.id}`)
                .setTitle('Company Registration Application');

            // Company Name
            const companyName = new TextInputBuilder()
                .setCustomId('company_name')
                .setLabel('Company Name')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Enter your company name')
                .setRequired(true)
                .setMaxLength(100);

            // Industry
            const industry = new TextInputBuilder()
                .setCustomId('industry')
                .setLabel('Industry Category')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Technology, Manufacturing, Financial, etc.')
                .setRequired(true)
                .setMaxLength(50);

            // Business Model
            const businessModel = new TextInputBuilder()
                .setCustomId('business_model')
                .setLabel('Business Model & Services')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Describe your business model, products/services, and target market')
                .setRequired(true)
                .setMaxLength(1000);

            // Requested Capital
            const requestedCapital = new TextInputBuilder()
                .setCustomId('requested_capital')
                .setLabel('Requested Starting Capital')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Amount between $50,000 - $500,000')
                .setRequired(true)
                .setMaxLength(10);

            // Business Plan
            const businessPlan = new TextInputBuilder()
                .setCustomId('business_plan')
                .setLabel('Executive Summary & Growth Strategy')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Provide an executive summary and your growth strategy (see sample document for format)')
                .setRequired(true)
                .setMaxLength(2000);

            // Add components to modal
            const row1 = new ActionRowBuilder().addComponents(companyName);
            const row2 = new ActionRowBuilder().addComponents(industry);
            const row3 = new ActionRowBuilder().addComponents(businessModel);
            const row4 = new ActionRowBuilder().addComponents(requestedCapital);
            const row5 = new ActionRowBuilder().addComponents(businessPlan);

            modal.addComponents(row1, row2, row3, row4, row5);

            // Show the modal
            await interaction.showModal(modal);

            // Send initial message to the ticket channel
            const embed = new EmbedBuilder()
                .setTitle('🎫 Company Application Ticket')
                .setDescription(`**Applicant:** ${interaction.user.tag}\n**Status:** Waiting for application submission`)
                .setColor(0xFFA500)
                .setTimestamp()
                .setFooter({ text: 'Corporate Empire Bot' });

            const sampleButton = new ButtonBuilder()
                .setLabel('📄 View Sample Application')
                .setStyle(ButtonStyle.Link)
                .setURL('https://github.com/kyprexs/Coporate-Empire/blob/main/sample_documents/SAMPLE_COMPANY_APPLICATION.md');

            const actionRow = new ActionRowBuilder().addComponents(sampleButton);

            // Send message with or without admin role mention
            const mentionContent = process.env.ADMIN_ROLE_ID && process.env.ADMIN_ROLE_ID !== 'your_admin_role_id_here' 
                ? `<@${applicantId}> <@&${process.env.ADMIN_ROLE_ID}>` 
                : `<@${applicantId}>`;
            
            await ticketChannel.send({ 
                content: mentionContent,
                embeds: [embed],
                components: [actionRow]
            });

        } catch (error) {
            console.error('Error creating company application ticket:', error);
            await interaction.reply({
                content: '❌ There was an error creating your application ticket. Please try again later.',
                ephemeral: true
            });
        }
    },

    async handleInfo(interaction, client) {
        const companyQuery = interaction.options.getString('company');
        
        try {
            // Search for company by name or ticker symbol
            const company = await client.db.searchCompanyByName(companyQuery);

            if (!company) {
                await interaction.reply({
                    content: '❌ No active company found with that name or ticker symbol.',
                    ephemeral: true
                });
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle(`🏢 ${company.name}`)
                .setColor(0x00FF00)
                .addFields(
                    { name: '📊 Ticker Symbol', value: company.ticker_symbol || 'N/A', inline: true },
                    { name: '🏭 Industry', value: company.industry, inline: true },
                    { name: '👑 Owner', value: company.owner_username, inline: true },
                    { name: '💰 Starting Capital', value: `$${company.starting_capital.toLocaleString()}`, inline: true },
                    { name: '📈 Current Valuation', value: `$${company.current_valuation.toLocaleString()}`, inline: true },
                    { name: '📅 Founded', value: new Date(company.founded_date).toLocaleDateString(), inline: true },
                    { name: '📝 Description', value: company.description || 'No description available', inline: false }
                )
                .setTimestamp()
                .setFooter({ text: 'Corporate Empire Bot' });

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error retrieving company info:', error);
            await interaction.reply({
                content: '❌ There was an error retrieving company information.',
                ephemeral: true
            });
        }
    },

    async handleList(interaction, client) {
        try {
            const companies = await client.db.getAllActiveCompanies();

            if (companies.length === 0) {
                await interaction.reply({
                    content: '📊 No active companies found. Be the first to create one with `/company create`!',
                    ephemeral: true
                });
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle('🏢 Active Companies')
                .setColor(0x0099FF)
                .setDescription('All currently active companies in the Corporate Empire')
                .setTimestamp()
                .setFooter({ text: 'Corporate Empire Bot' });

            // Add top companies (limit to first 25 due to embed field limits)
            const displayCompanies = companies.slice(0, 25);
            
            for (const company of displayCompanies) {
                embed.addFields({
                    name: `${company.name} (${company.ticker_symbol || 'N/A'})`,
                    value: `**Owner:** ${company.owner_username}\n**Industry:** ${company.industry}\n**Valuation:** $${company.current_valuation.toLocaleString()}`,
                    inline: true
                });
            }

            if (companies.length > 25) {
                embed.addFields({
                    name: 'ℹ️ Note',
                    value: `Showing top 25 companies. Total active companies: ${companies.length}`,
                    inline: false
                });
            }

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error retrieving company list:', error);
            await interaction.reply({
                content: '❌ There was an error retrieving the company list.',
                ephemeral: true
            });
        }
    },

    async handleMy(interaction, client) {
        try {
            const companies = await client.db.getCompaniesByOwner(interaction.user.id);

            if (companies.length === 0) {
                await interaction.reply({
                    content: '🏢 You don\'t own any companies yet. Create one with `/company create`!',
                    ephemeral: true
                });
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle('🏢 Your Companies')
                .setColor(0x00FF00)
                .setDescription(`You own ${companies.length} company(ies)`)
                .setTimestamp()
                .setFooter({ text: 'Corporate Empire Bot' });

            for (const company of companies) {
                embed.addFields({
                    name: `${company.name} (${company.ticker_symbol || 'N/A'})`,
                    value: `**Industry:** ${company.industry}\n**Founded:** ${new Date(company.founded_date).toLocaleDateString()}\n**Valuation:** $${company.current_valuation.toLocaleString()}\n**Status:** ${company.status}`,
                    inline: true
                });
            }

            await interaction.reply({ embeds: [embed], ephemeral: true });

        } catch (error) {
            console.error('Error retrieving user companies:', error);
            await interaction.reply({
                content: '❌ There was an error retrieving your companies.',
                ephemeral: true
            });
        }
    }
};

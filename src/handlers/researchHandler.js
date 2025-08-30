const { EmbedBuilder } = require('discord.js');

module.exports = {
    async handleResearchSubmission(interaction, client) {
        try {
            // Parse custom ID to get research details
            const parts = interaction.customId.split('_');
            const companyId = parseInt(parts[2]);
            const category = parts[3];

            // Get form data
            const projectTitle = interaction.fields.getTextInputValue('project_title');
            const description = interaction.fields.getTextInputValue('project_description');
            const budget = parseFloat(interaction.fields.getTextInputValue('project_budget'));
            const timeline = parseInt(interaction.fields.getTextInputValue('project_timeline'));
            const expectedOutcomes = interaction.fields.getTextInputValue('project_goals');

            // Validate inputs
            if (isNaN(budget) || budget < 10000) {
                await interaction.reply({
                    content: '❌ Please enter a valid budget (minimum $10,000).',
                    ephemeral: true
                });
                return;
            }

            if (isNaN(timeline) || timeline <= 0 || timeline > 24) {
                await interaction.reply({
                    content: '❌ Please enter a valid timeline (1-24 months).',
                    ephemeral: true
                });
                return;
            }

            // Get company details
            const company = await client.db.db.get('SELECT * FROM companies WHERE id = ?', [companyId]);
            if (!company) {
                await interaction.reply({
                    content: '❌ Company not found.',
                    ephemeral: true
                });
                return;
            }

            // Check if company has sufficient funds
            if (company.cash < budget) {
                await interaction.reply({
                    content: `❌ ${company.name} doesn't have enough cash. Required: $${budget.toLocaleString()}, Available: $${company.cash.toLocaleString()}`,
                    ephemeral: true
                });
                return;
            }

            // Process R&D project creation
            await client.db.db.run('BEGIN TRANSACTION');

            try {
                // Create R&D project
                const result = await client.db.db.run(`
                    INSERT INTO research_development 
                    (company_id, project_name, description, category, budget, 
                     estimated_duration_months, expected_outcomes, status, start_date)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP)
                `, [
                    companyId,
                    projectTitle,
                    description,
                    category,
                    budget,
                    timeline,
                    expectedOutcomes || null
                ]);

                // Deduct budget from company cash
                await client.db.db.run(`
                    UPDATE companies 
                    SET cash = cash - ?
                    WHERE id = ?
                `, [budget, companyId]);

                await client.db.db.run('COMMIT');

                const projectId = result.lastID;

                const embed = new EmbedBuilder()
                    .setTitle('🔬 R&D Project Started!')
                    .setColor(0x9932CC)
                    .addFields(
                        { name: 'Project ID', value: projectId.toString(), inline: true },
                        { name: 'Company', value: company.name, inline: true },
                        { name: 'Category', value: this.getCategoryName(category), inline: true },
                        { name: 'Budget', value: `$${budget.toLocaleString()}`, inline: true },
                        { name: 'Timeline', value: `${timeline} months`, inline: true },
                        { name: 'Remaining Cash', value: `$${(company.cash - budget).toLocaleString()}`, inline: true }
                    )
                    .setDescription(`🧪 **${projectTitle}**\\n\\n${description}`)
                    .setTimestamp()
                    .setFooter({ text: 'Corporate Empire R&D Department' });

                if (expectedOutcomes) {
                    embed.addFields({
                        name: '🎯 Expected Outcomes',
                        value: expectedOutcomes,
                        inline: false
                    });
                }

                await interaction.reply({ embeds: [embed] });

            } catch (error) {
                await client.db.db.run('ROLLBACK');
                throw error;
            }

        } catch (error) {
            console.error('Error handling research submission:', error);
            await interaction.reply({
                content: '❌ There was an error starting the R&D project.',
                ephemeral: true
            });
        }
    },

    getCategoryName(category) {
        const categories = {
            'technology': 'Technology Innovation',
            'product': 'Product Development',
            'process': 'Process Improvement',
            'market': 'Market Research',
            'sustainability': 'Sustainability',
            'quality': 'Quality Assurance',
            'cost': 'Cost Optimization'
        };
        return categories[category] || category;
    }
};

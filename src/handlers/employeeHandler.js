const { EmbedBuilder } = require('discord.js');

module.exports = {
    async handleHireSubmission(interaction, client) {
        try {
            // Parse custom ID: hire_employee_{companyId}_{employeeType}_{userId|npc}
            const [, , companyId, employeeType, userIdOrNpc] = interaction.customId.split('_');
            
            // Get form data
            const employeeName = interaction.fields.getTextInputValue('employee_name');
            const position = interaction.fields.getTextInputValue('position');
            const salaryInput = interaction.fields.getTextInputValue('salary');
            
            // Validate salary
            const salary = parseFloat(salaryInput);
            if (isNaN(salary) || salary <= 0) {
                await interaction.reply({
                    content: '❌ Invalid salary amount. Please enter a valid number.',
                    ephemeral: true
                });
                return;
            }

            if (salary < 1000 || salary > 50000) {
                await interaction.reply({
                    content: '❌ Salary must be between $1,000 and $50,000 per month.',
                    ephemeral: true
                });
                return;
            }

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

            // Check if company has enough cash for at least one month of salary
            const owner = await client.db.getUser(company.owner_id);
            if (owner.cash < salary) {
                await interaction.reply({
                    content: `❌ Insufficient funds to hire this employee. You need at least $${salary.toLocaleString()} to cover their first month's salary.`,
                    ephemeral: true
                });
                return;
            }

            // For player employees, validate the user exists
            let employeeUserId = null;
            if (employeeType === 'player') {
                employeeUserId = userIdOrNpc !== 'npc' ? userIdOrNpc : null;
                if (!employeeUserId) {
                    await interaction.reply({
                        content: '❌ Invalid player employee data.',
                        ephemeral: true
                    });
                    return;
                }

                // Ensure the target user exists in our database
                try {
                    const targetUser = await interaction.guild.members.fetch(employeeUserId);
                    await client.db.createUser(employeeUserId, targetUser.user.username);
                } catch (fetchError) {
                    await interaction.reply({
                        content: '❌ Could not find the specified user in this server.',
                        ephemeral: true
                    });
                    return;
                }
            }

            // Hire the employee
            const employeeId = await client.db.hireEmployee(
                parseInt(companyId),
                employeeType,
                employeeUserId,
                employeeName,
                position,
                salary
            );

            // Deduct first month's salary from company owner
            await client.db.updateUserCash(company.owner_id, -salary);

            const embed = new EmbedBuilder()
                .setTitle('🎉 Employee Hired Successfully!')
                .setColor(0x00FF00)
                .addFields(
                    { name: 'Employee ID', value: `#${employeeId}`, inline: true },
                    { name: 'Name', value: employeeName, inline: true },
                    { name: 'Position', value: position, inline: true },
                    { name: 'Type', value: employeeType === 'npc' ? 'NPC Worker (1.0x productivity)' : 'Player Worker (2.5x productivity)', inline: true },
                    { name: 'Monthly Salary', value: `$${salary.toLocaleString()}`, inline: true },
                    { name: 'Company', value: company.name, inline: true },
                    { name: '💡 Note', value: 'First month\\'s salary has been deducted from your account. Future salaries will be processed during monthly cycles.', inline: false }
                )
                .setTimestamp()
                .setFooter({ text: 'Corporate Empire Bot' });

            await interaction.reply({ embeds: [embed] });

            // If hiring a player, send them a notification
            if (employeeType === 'player' && employeeUserId) {
                try {
                    const targetUser = await interaction.guild.members.fetch(employeeUserId);
                    const notificationEmbed = new EmbedBuilder()
                        .setTitle('🎉 You\\'ve Been Hired!')
                        .setColor(0x00FF00)
                        .addFields(
                            { name: 'Company', value: company.name, inline: true },
                            { name: 'Position', value: position, inline: true },
                            { name: 'Monthly Salary', value: `$${salary.toLocaleString()}`, inline: true }
                        )
                        .setDescription(`Congratulations! You have been hired by ${company.name} as a ${position}. Your productivity multiplier is 2.5x!`)
                        .setTimestamp();

                    await targetUser.send({ embeds: [notificationEmbed] });
                } catch (dmError) {
                    console.log('Could not send hire notification DM:', dmError.message);
                }
            }

        } catch (error) {
            console.error('Error in employee hire submission:', error);
            await interaction.reply({
                content: '❌ There was an error hiring the employee.',
                ephemeral: true
            });
        }
    }
};

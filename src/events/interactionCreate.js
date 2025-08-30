module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        // Handle slash commands
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                // Ensure user exists in database
                await client.db.createUser(interaction.user.id, interaction.user.username);
                
                // Execute the command
                await command.execute(interaction, client);
            } catch (error) {
                console.error('Error executing command:', error);
                
                const errorResponse = {
                    content: '❌ There was an error executing this command. Please try again later.',
                    ephemeral: true
                };

                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorResponse);
                } else {
                    await interaction.reply(errorResponse);
                }
            }
        }
        
        // Handle button interactions
        else if (interaction.isButton()) {
            try {
                const customId = interaction.customId;
                
                // Handle company application approval/denial
                if (customId.startsWith('approve_company_') || customId.startsWith('deny_company_')) {
                    const action = customId.startsWith('approve_company_') ? 'approve' : 'deny';
                    const applicationId = customId.split('_').pop();
                    
                    // Check if user is admin
                    const adminRoleId = process.env.ADMIN_ROLE_ID;
                    const hasAdminRole = interaction.member.roles.cache.has(adminRoleId);
                    
                    if (!hasAdminRole) {
                        await interaction.reply({
                            content: '❌ You do not have permission to perform this action.',
                            ephemeral: true
                        });
                        return;
                    }
                    
                    // Handle the approval/denial
                    const companyHandler = require('../handlers/companyHandler');
                    await companyHandler.handleApplicationDecision(interaction, client, applicationId, action);
                }
                
                // Handle lawsuit approval/denial
                else if (customId.startsWith('approve_lawsuit_') || customId.startsWith('deny_lawsuit_')) {
                    const action = customId.startsWith('approve_lawsuit_') ? 'approve' : 'deny';
                    const lawsuitId = customId.split('_').pop();
                    
                    // Check if user is admin
                    const adminRoleId = process.env.ADMIN_ROLE_ID;
                    const hasAdminRole = interaction.member.roles.cache.has(adminRoleId);
                    
                    if (!hasAdminRole) {
                        await interaction.reply({
                            content: '❌ You do not have permission to perform this action.',
                            ephemeral: true
                        });
                        return;
                    }
                    
                    // Handle the approval/denial
                    const lawsuitHandler = require('../handlers/lawsuitHandler');
                    await lawsuitHandler.handleLawsuitDecision(interaction, client, lawsuitId, action);
                }
            
            // Handle onboarding navigation
            else if (customId.startsWith('onboarding_')) {
                const onboardingCommand = require('../commands/onboarding');
                
                if (customId === 'onboarding_exit') {
                    await interaction.update({
                        content: '✅ Tutorial completed! Use `/help` anytime for additional guidance.',
                        embeds: [],
                        components: []
                    });
                } else {
                    const step = parseInt(customId.split('_')[1]);
                    await onboardingCommand.showOnboardingStep(interaction, step);
                }
            }
        } catch (error) {
                console.error('Error handling button interaction:', error);
                
                const errorResponse = {
                    content: '❌ There was an error processing your request. Please try again later.',
                    ephemeral: true
                };

                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorResponse);
                } else {
                    await interaction.reply(errorResponse);
                }
            }
        }
        
        // Handle modal submissions
        else if (interaction.isModalSubmit()) {
            try {
                const customId = interaction.customId;
                
                if (customId.startsWith('company_application_')) {
                    const companyHandler = require('../handlers/companyHandler');
                    await companyHandler.handleApplicationSubmission(interaction, client);
                }
                // Handle employee hiring modal
                else if (customId.startsWith('hire_employee_')) {
                    const employeeHandler = require('../handlers/employeeHandler');
                    await employeeHandler.handleHireSubmission(interaction, client);
                }
                // Handle patent submission modal
                else if (customId.startsWith('patent_submit_')) {
                    const patentHandler = require('../handlers/patentHandler');
                    await patentHandler.handlePatentSubmission(interaction, client);
                }
                // Handle loan request modal
                else if (customId.startsWith('loan_request_')) {
                    const loanHandler = require('../handlers/loanHandler');
                    await loanHandler.handleLoanSubmission(interaction, client);
                }
                // Handle lawsuit filing modal
                else if (customId.startsWith('lawsuit_file_')) {
                    const lawsuitHandler = require('../handlers/lawsuitHandler');
                    await lawsuitHandler.handleLawsuitSubmission(interaction, client);
                }
                // Handle contract creation modal
                else if (customId.startsWith('contract_create_')) {
                    const contractHandler = require('../handlers/contractHandler');
                    await contractHandler.handleContractSubmission(interaction, client);
                }
                // Handle research project modal
                else if (customId.startsWith('research_start_')) {
                    const researchHandler = require('../handlers/researchHandler');
                    await researchHandler.handleResearchSubmission(interaction, client);
                }
                // Handle insurance claim modal
                else if (customId.startsWith('insurance_claim_')) {
                    const insuranceHandler = require('../handlers/insuranceHandler');
                    await insuranceHandler.handleClaimSubmission(interaction, client);
                }
            } catch (error) {
                console.error('Error handling modal submission:', error);
                
                const errorResponse = {
                    content: '❌ There was an error processing your submission. Please try again later.',
                    ephemeral: true
                };

                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorResponse);
                } else {
                    await interaction.reply(errorResponse);
                }
            }
        }
    }
};

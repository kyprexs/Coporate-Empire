const { EmbedBuilder } = require('discord.js');

module.exports = {
    async handleLoanSubmission(interaction, client) {
        try {
            // Parse custom ID: loan_request_{companyId}_{amount}_{termMonths}
            const [, , companyId, amount, termMonths] = interaction.customId.split('_');
            
            // Get form data
            const collateralDescription = interaction.fields.getTextInputValue('collateral');
            
            const loanAmount = parseFloat(amount);
            const loanTermMonths = parseInt(termMonths);
            
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

            // Final validation of loan limits
            const existingLoans = await client.db.getCompanyLoans(parseInt(companyId));
            const activeLoans = existingLoans.filter(loan => loan.status === 'active');

            if (activeLoans.length >= 3) {
                await interaction.reply({
                    content: '❌ Your company already has the maximum number of active loans (3).',
                    ephemeral: true
                });
                return;
            }

            // Create the loan
            const loanId = await client.db.createLoanApplication(
                parseInt(companyId),
                loanAmount,
                loanTermMonths,
                collateralDescription
            );

            // Get the created loan details
            const loan = await client.db.db.get('SELECT * FROM loans WHERE id = ?', [loanId]);

            // Add the loan amount to company owner's cash
            await client.db.updateUserCash(company.owner_id, loanAmount);

            // Update Central Bank balance
            const currentPeriod = new Date().toISOString().substring(0, 7); // YYYY-MM format
            await client.db.updateCentralBankBalance(currentPeriod, 0, 0, loanAmount);

            const embed = new EmbedBuilder()
                .setTitle('✅ Loan Approved and Disbursed')
                .setColor(0x00FF00)
                .addFields(
                    { name: 'Loan ID', value: `#${loanId}`, inline: true },
                    { name: 'Company', value: company.name, inline: true },
                    { name: 'Amount', value: `$${loanAmount.toLocaleString()}`, inline: true },
                    { name: 'Interest Rate', value: `${(loan.interest_rate * 100).toFixed(2)}% annually`, inline: true },
                    { name: 'Term', value: `${loanTermMonths} months`, inline: true },
                    { name: 'Monthly Payment', value: `$${loan.monthly_payment.toLocaleString()}`, inline: true },
                    { name: 'Credit Score', value: loan.credit_score.toString(), inline: true },
                    { name: 'Total Interest', value: `$${((loan.monthly_payment * loanTermMonths) - loanAmount).toLocaleString()}`, inline: true },
                    { name: 'First Payment Due', value: new Date(loan.next_payment_date).toLocaleDateString(), inline: true },
                    { name: 'Collateral', value: collateralDescription, inline: false }
                )
                .setDescription(`🎉 **Congratulations!** Your loan has been approved and $${loanAmount.toLocaleString()} has been added to your account.\\n\\n⚠️ **Important:** Your first payment of $${loan.monthly_payment.toLocaleString()} is due on ${new Date(loan.next_payment_date).toLocaleDateString()}.`)
                .setTimestamp()
                .setFooter({ text: 'Central Bank of Corporate Empire' });

            await interaction.reply({ embeds: [embed] });

            // Log the loan approval for admins
            try {
                const adminChannel = interaction.guild.channels.cache.find(ch => ch.name === 'admin-loans' || ch.name === 'admin-log');
                if (adminChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setTitle('🏦 Loan Approved')
                        .setColor(0x32CD32)
                        .addFields(
                            { name: 'Loan ID', value: `#${loanId}`, inline: true },
                            { name: 'Company', value: company.name, inline: true },
                            { name: 'Owner', value: interaction.user.tag, inline: true },
                            { name: 'Amount', value: `$${loanAmount.toLocaleString()}`, inline: true },
                            { name: 'Rate', value: `${(loan.interest_rate * 100).toFixed(2)}%`, inline: true },
                            { name: 'Credit Score', value: loan.credit_score.toString(), inline: true }
                        )
                        .setTimestamp();

                    await adminChannel.send({ embeds: [logEmbed] });
                }
            } catch (logError) {
                console.log('Could not send admin log for loan:', logError.message);
            }

        } catch (error) {
            console.error('Error in loan submission:', error);
            await interaction.reply({
                content: '❌ There was an error processing your loan application.',
                ephemeral: true
            });
        }
    }
};

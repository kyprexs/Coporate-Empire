const { EmbedBuilder } = require('discord.js');

module.exports = {
    async handleClaimSubmission(interaction, client) {
        try {
            // Parse custom ID to get claim details
            const parts = interaction.customId.split('_');
            const policyId = parseInt(parts[2]);
            const claimAmount = parseFloat(parts[3]);

            // Get form data
            const incidentDescription = interaction.fields.getTextInputValue('incident_description');
            const incidentDate = interaction.fields.getTextInputValue('incident_date');
            const evidence = interaction.fields.getTextInputValue('evidence');

            // Validate incident date
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(incidentDate)) {
                await interaction.reply({
                    content: '❌ Please enter a valid date in YYYY-MM-DD format.',
                    ephemeral: true
                });
                return;
            }

            const parsedDate = new Date(incidentDate);
            if (parsedDate > new Date()) {
                await interaction.reply({
                    content: '❌ Incident date cannot be in the future.',
                    ephemeral: true
                });
                return;
            }

            // Get policy details
            const policy = await client.db.db.get(`
                SELECT 
                    ip.*,
                    c.name as company_name, c.owner_id
                FROM insurance_policies ip
                JOIN companies c ON ip.company_id = c.id
                WHERE ip.id = ? AND ip.status = 'active'
            `, [policyId]);

            if (!policy) {
                await interaction.reply({
                    content: '❌ Insurance policy not found or not active.',
                    ephemeral: true
                });
                return;
            }

            // Verify incident occurred during policy period
            const policyStart = new Date(policy.policy_start_date);
            if (parsedDate < policyStart) {
                await interaction.reply({
                    content: '❌ Incident date is before policy start date.',
                    ephemeral: true
                });
                return;
            }

            // Process insurance claim
            const result = await this.processInsuranceClaim(
                client, 
                policyId, 
                claimAmount, 
                incidentDescription, 
                evidence,
                incidentDate
            );

            if (!result.success) {
                await interaction.reply({
                    content: `❌ ${result.message}`,
                    ephemeral: true
                });
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle(result.approved ? '✅ Insurance Claim Approved!' : '❌ Insurance Claim Denied')
                .setColor(result.approved ? 0x32CD32 : 0xFF6B6B)
                .addFields(
                    { name: 'Policy ID', value: policyId.toString(), inline: true },
                    { name: 'Claim Amount', value: `$${claimAmount.toLocaleString()}`, inline: true },
                    { name: 'Deductible', value: `$${result.deductible.toLocaleString()}`, inline: true },
                    { name: 'Company', value: policy.company_name, inline: true },
                    { name: 'Incident Date', value: parsedDate.toLocaleDateString(), inline: true }
                )
                .setDescription(incidentDescription)
                .setTimestamp()
                .setFooter({ text: 'Corporate Empire Insurance Services' });

            if (result.approved) {
                embed.addFields({
                    name: '💰 Payout Amount',
                    value: `$${result.payout.toLocaleString()}`,
                    inline: true
                });
                embed.setDescription(`✅ **Claim Approved**\\n\\n${incidentDescription}\\n\\n💰 Payout has been credited to your account.`);
            } else {
                embed.setDescription(`❌ **Claim Denied**\\n\\n${incidentDescription}\\n\\n${result.message}`);
            }

            if (evidence) {
                embed.addFields({
                    name: '📋 Evidence Submitted',
                    value: evidence,
                    inline: false
                });
            }

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error handling insurance claim submission:', error);
            await interaction.reply({
                content: '❌ There was an error processing your insurance claim.',
                ephemeral: true
            });
        }
    },

    async processInsuranceClaim(client, policyId, claimAmount, description, evidence, incidentDate) {
        try {
            // Get policy details
            const policy = await client.db.db.get(`
                SELECT 
                    ip.*,
                    c.name as company_name, c.owner_id
                FROM insurance_policies ip
                JOIN companies c ON ip.company_id = c.id
                WHERE ip.id = ?
            `, [policyId]);

            if (!policy) {
                return { success: false, message: 'Policy not found' };
            }

            // Calculate payout (claim amount minus deductible)
            const payout = Math.max(0, claimAmount - policy.deductible);

            // Insurance companies may approve/deny based on risk assessment
            const approvalChance = this.calculateClaimApprovalChance(policy, claimAmount, description);
            const approved = Math.random() < approvalChance;

            // Record the claim
            const claimResult = await client.db.db.run(`
                INSERT INTO insurance_claims 
                (policy_id, claim_amount, incident_description, evidence, 
                 incident_date, status, filed_date, payout_amount)
                VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
            `, [
                policyId,
                claimAmount,
                description,
                evidence || null,
                incidentDate,
                approved ? 'approved' : 'denied',
                approved ? payout : 0
            ]);

            if (approved && payout > 0) {
                // Pay claim to company owner
                await client.db.updateUserCash(policy.owner_id, payout);

                // Insurance company pays out
                const insuranceCompany = await client.db.db.get(`
                    SELECT * FROM default_companies WHERE company_type = 'insurance'
                `);
                if (insuranceCompany) {
                    await client.db.updateUserCash(insuranceCompany.owner_id, -payout);
                }
            }

            return {
                success: true,
                approved,
                payout,
                deductible: policy.deductible,
                claimId: claimResult.lastID,
                message: approved ? 
                    `Claim approved! Payout: $${payout.toLocaleString()}` : 
                    'Claim denied after review of incident details and policy terms'
            };

        } catch (error) {
            console.error('Error processing insurance claim:', error);
            return { success: false, message: 'Error processing claim' };
        }
    },

    calculateClaimApprovalChance(policy, claimAmount, description) {
        let baseChance = 0.75; // 75% base approval rate

        // Adjust based on claim size relative to coverage
        const claimRatio = claimAmount / policy.coverage_amount;
        if (claimRatio > 0.8) baseChance -= 0.3; // Large claims less likely
        else if (claimRatio > 0.5) baseChance -= 0.15;
        else if (claimRatio < 0.1) baseChance += 0.1; // Small claims more likely

        // Adjust based on description quality (simple heuristic)
        if (description.length > 200) baseChance += 0.1; // Detailed descriptions help
        if (description.toLowerCase().includes('negligence')) baseChance -= 0.2;
        if (description.toLowerCase().includes('accident')) baseChance += 0.1;
        if (description.toLowerCase().includes('damage')) baseChance += 0.05;
        if (description.toLowerCase().includes('theft')) baseChance += 0.05;

        return Math.max(0.1, Math.min(0.95, baseChance));
    }
};

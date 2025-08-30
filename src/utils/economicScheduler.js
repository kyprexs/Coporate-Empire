const { EmbedBuilder } = require('discord.js');

class EconomicScheduler {
    constructor(client) {
        this.client = client;
        this.isProcessing = false;
        this.scheduledInterval = null;
        this.CYCLE_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds (1 real day = 1 game month)
    }

    start() {
        console.log('Starting Economic Scheduler (1 real day = 1 game month)');
        
        // Start the first cycle immediately for testing (remove in production)
        // setTimeout(() => this.processMonthlyEconomicCycle(), 5000);
        
        // Schedule daily processing (every 24 hours)
        this.scheduledInterval = setInterval(() => {
            this.processMonthlyEconomicCycle();
        }, this.CYCLE_INTERVAL);

        console.log('Economic Scheduler started - next cycle in 24 hours');
    }

    stop() {
        if (this.scheduledInterval) {
            clearInterval(this.scheduledInterval);
            this.scheduledInterval = null;
            console.log('Economic Scheduler stopped');
        }
    }

    async processMonthlyEconomicCycle() {
        if (this.isProcessing) {
            console.log('Economic cycle already in progress, skipping...');
            return;
        }

        this.isProcessing = true;
        console.log('🏛️ Starting monthly economic cycle processing...');

        try {
            const currentDate = new Date();
            const period = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;

            // Initialize economic cycle record
            await this.initializeEconomicCycle(period);

            // Process all companies
            const companies = await this.client.db.getAllActiveCompanies();
            console.log(`Processing ${companies.length} active companies...`);

            let totalTaxes = 0;
            let totalLoanInterest = 0;
            let totalPatentRevenue = 0;
            let totalCompanyRevenue = 0;

            for (const company of companies) {
                try {
                    const companyResults = await this.processCompanyMonth(company, period);
                    totalTaxes += companyResults.taxes;
                    totalLoanInterest += companyResults.loanInterest;
                    totalPatentRevenue += companyResults.patentRevenue;
                    totalCompanyRevenue += companyResults.revenue;
                } catch (error) {
                    console.error(`Error processing company ${company.name}:`, error);
                }
            }

            // Process loan payments
            await this.processLoanPayments(period);

            // Process R&D project completions
            await this.processRDCompletions(period);

            // Process contract expirations
            await this.processContractExpirations(period);

            // Process insurance policy renewals and claims
            await this.processInsuranceRenewals(period);

            // Generate random market events
            await this.processMarketEvents(period);

            // Update Central Bank balance
            await this.client.db.updateCentralBankBalance(period, totalTaxes, totalLoanInterest, 0);

            // Complete the economic cycle
            await this.completeEconomicCycle(period, {
                totalCompanyRevenue,
                totalTaxes,
                totalLoanInterest,
                totalPatentRevenue,
                activeCompanies: companies.length
            });

            // Send summary to admin channel
            await this.sendMonthlySummary(period, {
                totalCompanyRevenue,
                totalTaxes,
                totalLoanInterest,
                totalPatentRevenue,
                activeCompanies: companies.length
            });

            console.log(`✅ Monthly economic cycle for ${period} completed successfully`);

        } catch (error) {
            console.error('Error in economic cycle processing:', error);
        } finally {
            this.isProcessing = false;
        }
    }

    async initializeEconomicCycle(period) {
        const startDate = new Date();
        const endDate = new Date(startDate.getTime() + this.CYCLE_INTERVAL);

        await this.client.db.db.run(`
            INSERT OR IGNORE INTO economic_cycles 
            (cycle_period, start_date, end_date, status)
            VALUES (?, ?, ?, 'active')
        `, [period, startDate.toISOString(), endDate.toISOString()]);
    }

    async processCompanyMonth(company, period) {
        console.log(`Processing company: ${company.name}`);

        // Calculate employee productivity revenue
        const productivityData = await this.client.db.calculateCompanyMonthlyRevenue(company.id);
        const employeeRevenue = productivityData.total_productivity || 0;

        // Calculate patent revenue
        const patents = await this.client.db.db.all(`
            SELECT * FROM patents 
            WHERE company_id = ? AND status = 'approved' 
            AND (expiry_date IS NULL OR expiry_date > CURRENT_TIMESTAMP)
        `, [company.id]);

        let patentRevenue = 0;
        for (const patent of patents) {
            patentRevenue += patent.monthly_revenue;
            // Update patent total revenue
            await this.client.db.db.run(`
                UPDATE patents 
                SET total_revenue = total_revenue + ?
                WHERE id = ?
            `, [patent.monthly_revenue, patent.id]);
        }

        const totalRevenue = employeeRevenue + patentRevenue;

        // Calculate and process taxes (8%)
        let taxes = 0;
        if (totalRevenue > 0) {
            taxes = await this.client.db.processTaxes(company.id, totalRevenue, period);
        }

        // Calculate payroll expenses
        const employees = await this.client.db.getCompanyEmployees(company.id);
        let payrollExpenses = 0;
        for (const employee of employees) {
            payrollExpenses += employee.salary;
            
            // Pay player employees directly
            if (employee.employee_type === 'player' && employee.employee_id) {
                await this.client.db.updateUserCash(employee.employee_id, employee.salary);
            }
        }

        // Calculate net income
        const netIncome = totalRevenue - taxes - payrollExpenses;

        // Update company owner's cash with net income
        await this.client.db.updateUserCash(company.owner_id, netIncome);

        // Record company performance
        await this.client.db.db.run(`
            INSERT OR REPLACE INTO company_performance 
            (company_id, period, employee_productivity, patent_income, tax_burden, net_monthly_income)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [company.id, period, employeeRevenue, patentRevenue, taxes, netIncome]);

        // Update company valuation based on performance
        const valuationChange = netIncome * 0.1; // Simple valuation model
        const newValuation = Math.max(1000, company.current_valuation + valuationChange);
        
        await this.client.db.db.run(`
            UPDATE companies 
            SET current_valuation = ?
            WHERE id = ?
        `, [newValuation, company.id]);

        // Send monthly report to company owner
        await this.sendCompanyMonthlyReport(company, period, {
            revenue: totalRevenue,
            employeeRevenue,
            patentRevenue,
            taxes,
            payrollExpenses,
            netIncome,
            newValuation,
            employees: employees.length
        });

        return {
            revenue: totalRevenue,
            taxes,
            loanInterest: 0, // Will be calculated separately
            patentRevenue
        };
    }

    async processLoanPayments(period) {
        // Get all active loans due for payment
        const dueLoans = await this.client.db.db.all(`
            SELECT l.*, c.name as company_name, c.owner_id
            FROM loans l
            JOIN companies c ON l.company_id = c.id
            WHERE l.status = 'active' AND date(l.next_payment_date) <= date('now')
        `);

        for (const loan of dueLoans) {
            try {
                // Check if company owner has enough cash
                const owner = await this.client.db.getUser(loan.owner_id);
                
                if (owner.cash >= loan.monthly_payment) {
                    // Process payment
                    const monthlyInterest = (loan.remaining_balance * loan.interest_rate) / 12;
                    const principalPayment = loan.monthly_payment - monthlyInterest;
                    const newBalance = Math.max(0, loan.remaining_balance - principalPayment);
                    const newStatus = newBalance <= 0 ? 'paid_off' : 'active';

                    // Update loan
                    const nextPaymentDate = new Date();
                    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

                    await this.client.db.db.run(`
                        UPDATE loans 
                        SET remaining_balance = ?, status = ?, next_payment_date = ?
                        WHERE id = ?
                    `, [newBalance, newStatus, nextPaymentDate.toISOString(), loan.id]);

                    // Record payment
                    await this.client.db.db.run(`
                        INSERT INTO loan_payments (loan_id, payment_amount, principal_amount, interest_amount, payment_type)
                        VALUES (?, ?, ?, ?, 'monthly')
                    `, [loan.id, loan.monthly_payment, principalPayment, monthlyInterest]);

                    // Deduct payment from owner
                    await this.client.db.updateUserCash(loan.owner_id, -loan.monthly_payment);

                    console.log(`Processed loan payment for ${loan.company_name}: $${loan.monthly_payment}`);
                } else {
                    // Company cannot afford payment - handle default
                    await this.client.db.db.run(`
                        UPDATE loans 
                        SET status = 'defaulted'
                        WHERE id = ?
                    `, [loan.id]);

                    console.log(`Loan default for ${loan.company_name} - insufficient funds`);
                    
                    // TODO: Add company bankruptcy logic if needed
                }
            } catch (error) {
                console.error(`Error processing loan payment for loan ${loan.id}:`, error);
            }
        }
    }

    async completeEconomicCycle(period, stats) {
        await this.client.db.db.run(`
            UPDATE economic_cycles 
            SET total_company_revenue = ?, total_taxes_collected = ?, 
                total_loan_interest = ?, total_patent_revenue = ?, 
                active_companies = ?, status = 'completed', processed_at = CURRENT_TIMESTAMP
            WHERE cycle_period = ?
        `, [
            stats.totalCompanyRevenue,
            stats.totalTaxes,
            stats.totalLoanInterest,
            stats.totalPatentRevenue,
            stats.activeCompanies,
            period
        ]);
    }

    async sendCompanyMonthlyReport(company, period, results) {
        try {
            const owner = await this.client.guilds.cache.first()?.members.fetch(company.owner_id);
            if (!owner) return;

            const embed = new EmbedBuilder()
                .setTitle(`📊 ${company.name} - Monthly Report`)
                .setColor(results.netIncome >= 0 ? 0x00FF00 : 0xFF0000)
                .addFields(
                    { name: '📅 Period', value: period, inline: true },
                    { name: '👥 Employees', value: results.employees.toString(), inline: true },
                    { name: '💼 Employee Revenue', value: `$${results.employeeRevenue.toLocaleString()}`, inline: true },
                    { name: '📋 Patent Revenue', value: `$${results.patentRevenue.toLocaleString()}`, inline: true },
                    { name: '🏛️ Taxes Paid', value: `$${results.taxes.toLocaleString()}`, inline: true },
                    { name: '💰 Payroll Expenses', value: `$${results.payrollExpenses.toLocaleString()}`, inline: true },
                    { name: '📈 Net Income', value: `$${results.netIncome.toLocaleString()}`, inline: true },
                    { name: '🏢 New Valuation', value: `$${results.newValuation.toLocaleString()}`, inline: true }
                )
                .setDescription(results.netIncome >= 0 
                    ? '🎉 Profitable month! Your company grew and your valuation increased.' 
                    : '⚠️ Your company had losses this month. Consider optimizing operations.')
                .setTimestamp()
                .setFooter({ text: 'Corporate Empire Monthly Report' });

            await owner.send({ embeds: [embed] });
        } catch (error) {
            console.log(`Could not send monthly report to ${company.name} owner:`, error.message);
        }
    }

    async sendMonthlySummary(period, stats) {
        try {
            const guild = this.client.guilds.cache.first();
            if (!guild) return;

            const adminChannel = guild.channels.cache.find(ch => 
                ch.name === 'admin-economy' || 
                ch.name === 'economic-reports' || 
                ch.name === 'admin-log'
            );

            if (!adminChannel) return;

            const embed = new EmbedBuilder()
                .setTitle('🏛️ Monthly Economic Summary')
                .setColor(0x228B22)
                .addFields(
                    { name: '📅 Period', value: period, inline: true },
                    { name: '🏢 Active Companies', value: stats.activeCompanies.toString(), inline: true },
                    { name: '💼 Total Company Revenue', value: `$${stats.totalCompanyRevenue.toLocaleString()}`, inline: true },
                    { name: '🏛️ Tax Revenue', value: `$${stats.totalTaxes.toLocaleString()}`, inline: true },
                    { name: '🏦 Loan Interest', value: `$${stats.totalLoanInterest.toLocaleString()}`, inline: true },
                    { name: '📋 Patent Revenue', value: `$${stats.totalPatentRevenue.toLocaleString()}`, inline: true }
                )
                .setDescription('Monthly economic cycle completed. All company revenues processed, taxes collected, and loan payments due.')
                .setTimestamp()
                .setFooter({ text: 'Economic Cycle Processor' });

            // Get Central Bank balance
            const bankBalance = await this.client.db.db.get(`
                SELECT closing_balance FROM central_bank_balance 
                WHERE period = ? 
                ORDER BY last_updated DESC 
                LIMIT 1
            `, [period]);

            if (bankBalance) {
                embed.addFields({
                    name: '🏛️ Central Bank Balance',
                    value: `$${(bankBalance.closing_balance || 0).toLocaleString()}`,
                    inline: false
                });
            }

            await adminChannel.send({ embeds: [embed] });

        } catch (error) {
            console.error('Error sending monthly summary:', error);
        }
    }

    // Manual trigger for testing
    async triggerEconomicCycle() {
        if (this.isProcessing) {
            return { success: false, message: 'Economic cycle already in progress' };
        }

        try {
            await this.processMonthlyEconomicCycle();
            return { success: true, message: 'Economic cycle completed successfully' };
        } catch (error) {
            console.error('Error in manual economic cycle trigger:', error);
            return { success: false, message: 'Error processing economic cycle' };
        }
    }

    // Get next cycle time for status commands
    getNextCycleTime() {
        const now = new Date();
        const nextCycle = new Date(now);
        nextCycle.setHours(24, 0, 0, 0); // Next day at midnight
        
        if (nextCycle <= now) {
            nextCycle.setDate(nextCycle.getDate() + 1);
        }
        
        return nextCycle;
    }

    getTimeUntilNextCycle() {
        const nextCycle = this.getNextCycleTime();
        const now = new Date();
        const timeLeft = nextCycle.getTime() - now.getTime();
        
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${hours}h ${minutes}m`;
    }

    async processRDCompletions(period) {
        try {
            // Check for R&D projects that should be completed
            const completableProjects = await this.client.db.db.all(`
                SELECT rd.*, c.name as company_name, c.owner_id
                FROM research_development rd
                JOIN companies c ON rd.company_id = c.id
                WHERE rd.status = 'active' 
                AND datetime(rd.start_date, '+' || rd.estimated_duration_months || ' months') <= datetime('now')
            `);

            for (const project of completableProjects) {
                // Calculate R&D benefits
                const benefits = this.calculateRDBenefits(project);

                // Apply benefits to company
                await this.client.db.db.run(`
                    UPDATE companies 
                    SET current_valuation = current_valuation * ?,
                        efficiency_rating = COALESCE(efficiency_rating, 1.0) * ?
                    WHERE id = ?
                `, [benefits.valuationMultiplier, benefits.efficiencyMultiplier, project.company_id]);

                // Mark project as completed
                await this.client.db.db.run(`
                    UPDATE research_development 
                    SET status = 'completed', completion_date = CURRENT_TIMESTAMP, results = ?
                    WHERE id = ?
                `, [benefits.description, project.id]);

                console.log(`Completed R&D project: ${project.project_name} for ${project.company_name}`);

                // Notify company owner
                try {
                    const owner = await this.client.users.fetch(project.owner_id);
                    if (owner) {
                        const embed = new EmbedBuilder()
                            .setTitle('🎉 R&D Project Completed!')
                            .setColor(0x32CD32)
                            .setDescription(`Your R&D project "${project.project_name}" has been completed!`)
                            .addFields(
                                { name: 'Company', value: project.company_name, inline: true },
                                { name: 'Results', value: benefits.description, inline: false }
                            );
                        await owner.send({ embeds: [embed] });
                    }
                } catch (notifyError) {
                    console.log('Could not notify R&D completion:', notifyError.message);
                }
            }

        } catch (error) {
            console.error('Error processing R&D completions:', error);
        }
    }

    async processContractExpirations(period) {
        try {
            // Check for contracts that should expire
            const expiringContracts = await this.client.db.db.all(`
                SELECT c.*, 
                    ca.name as party_a_name, ca.owner_id as party_a_owner,
                    cb.name as party_b_name, cb.owner_id as party_b_owner
                FROM contracts c
                JOIN companies ca ON c.party_a_id = ca.id
                JOIN companies cb ON c.party_b_id = cb.id
                WHERE c.status = 'active' AND c.end_date <= datetime('now')
            `);

            for (const contract of expiringContracts) {
                // Mark contract as completed
                await this.client.db.db.run(`
                    UPDATE contracts 
                    SET status = 'completed'
                    WHERE id = ?
                `, [contract.id]);

                console.log(`Contract expired: ${contract.title} (${contract.party_a_name} ↔ ${contract.party_b_name})`);

                // Notify both parties
                const parties = [contract.party_a_owner, contract.party_b_owner];
                for (const ownerId of parties) {
                    try {
                        const owner = await this.client.users.fetch(ownerId);
                        if (owner) {
                            const embed = new EmbedBuilder()
                                .setTitle('📋 Contract Completed')
                                .setColor(0x32CD32)
                                .setDescription(`Contract "${contract.title}" has reached its end date and is now completed.`)
                                .addFields(
                                    { name: 'Contract ID', value: contract.id.toString(), inline: true },
                                    { name: 'Value', value: `$${contract.contract_value.toLocaleString()}`, inline: true }
                                );
                            await owner.send({ embeds: [embed] });
                        }
                    } catch (notifyError) {
                        console.log('Could not notify contract completion:', notifyError.message);
                    }
                }
            }

        } catch (error) {
            console.error('Error processing contract expirations:', error);
        }
    }

    async processInsuranceRenewals(period) {
        try {
            // Check for insurance policies expiring in the next 7 days
            const expiringPolicies = await this.client.db.db.all(`
                SELECT ip.*, c.name as company_name, c.owner_id
                FROM insurance_policies ip
                JOIN companies c ON ip.company_id = c.id
                WHERE ip.status = 'active' 
                AND date(ip.policy_end_date) BETWEEN date('now') AND date('now', '+7 days')
            `);

            for (const policy of expiringPolicies) {
                try {
                    const owner = await this.client.users.fetch(policy.owner_id);
                    if (owner) {
                        const embed = new EmbedBuilder()
                            .setTitle('⚠️ Insurance Policy Expiring Soon')
                            .setColor(0xFFD700)
                            .setDescription(`Your insurance policy for ${policy.company_name} expires soon!`)
                            .addFields(
                                { name: 'Policy Type', value: this.getInsuranceTypeName(policy.insurance_type), inline: true },
                                { name: 'Expiry Date', value: new Date(policy.policy_end_date).toLocaleDateString(), inline: true },
                                { name: 'Coverage', value: `$${policy.coverage_amount.toLocaleString()}`, inline: true }
                            )
                            .setFooter({ text: 'Use /insurance renew to extend your coverage' });
                        await owner.send({ embeds: [embed] });
                    }
                } catch (notifyError) {
                    console.log('Could not notify insurance expiry:', notifyError.message);
                }
            }

        } catch (error) {
            console.error('Error processing insurance renewals:', error);
        }
    }

    async processMarketEvents(period) {
        try {
            // End expired market events
            const eventsCommand = require('../commands/events');
            await eventsCommand.endExpiredEvents(this.client);

            // 20% chance to generate a new market event each month
            if (Math.random() < 0.2) {
                const eventData = eventsCommand.generateRandomEvent();
                const eventId = await eventsCommand.createMarketEvent(this.client, eventData);
                
                if (eventId) {
                    console.log(`Generated new market event: ${eventData.name}`);
                    
                    // Announce new market event
                    try {
                        const guild = this.client.guilds.cache.first();
                        const announcementChannel = guild?.channels.cache.find(ch => 
                            ch.name === 'market-announcements' || 
                            ch.name === 'general' ||
                            ch.name === 'economy'
                        );

                        if (announcementChannel) {
                            const embed = new EmbedBuilder()
                                .setTitle('🚨 Market Event Alert!')
                                .setColor(0xFF6600)
                                .setDescription(`**${eventData.name}**\n\n${eventData.description}`)
                                .addFields(
                                    { name: 'Impact Multiplier', value: `${eventData.impact}x`, inline: true },
                                    { name: 'Duration', value: `${eventData.duration} months`, inline: true },
                                    { name: 'Severity', value: eventData.severity.toUpperCase(), inline: true }
                                );
                            
                            if (eventData.industries) {
                                embed.addFields({
                                    name: 'Affected Industries',
                                    value: eventData.industries,
                                    inline: false
                                });
                            }

                            await announcementChannel.send({ embeds: [embed] });
                        }
                    } catch (announceError) {
                        console.log('Could not announce market event:', announceError.message);
                    }
                }
            }

        } catch (error) {
            console.error('Error processing market events:', error);
        }
    }

    calculateRDBenefits(project) {
        const baseBenefits = {
            'technology': { valuationMultiplier: 1.15, efficiencyMultiplier: 1.20 },
            'product': { valuationMultiplier: 1.20, efficiencyMultiplier: 1.10 },
            'process': { valuationMultiplier: 1.10, efficiencyMultiplier: 1.25 },
            'market': { valuationMultiplier: 1.12, efficiencyMultiplier: 1.15 },
            'sustainability': { valuationMultiplier: 1.18, efficiencyMultiplier: 1.12 },
            'quality': { valuationMultiplier: 1.16, efficiencyMultiplier: 1.18 },
            'cost': { valuationMultiplier: 1.08, efficiencyMultiplier: 1.30 }
        };

        const base = baseBenefits[project.category] || { valuationMultiplier: 1.10, efficiencyMultiplier: 1.10 };
        
        // Budget impact (higher budget = better results)
        const budgetMultiplier = Math.min(1 + (project.budget / 100000), 1.5); // Max 1.5x boost
        
        return {
            valuationMultiplier: base.valuationMultiplier * budgetMultiplier,
            efficiencyMultiplier: base.efficiencyMultiplier * budgetMultiplier,
            description: `Successful ${this.getCategoryName(project.category)} project! Company valuation increased by ${((base.valuationMultiplier * budgetMultiplier - 1) * 100).toFixed(1)}% and efficiency improved by ${((base.efficiencyMultiplier * budgetMultiplier - 1) * 100).toFixed(1)}%.`
        };
    }

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

    getInsuranceTypeName(type) {
        const types = {
            'liability': 'General Liability',
            'property': 'Property Insurance',
            'interruption': 'Business Interruption',
            'cyber': 'Cyber Security',
            'directors': 'Directors & Officers',
            'professional': 'Professional Indemnity',
            'comprehensive': 'Comprehensive Package'
        };
        return types[type] || type;
    }
}

module.exports = EconomicScheduler;

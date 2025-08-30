const MongoDatabase = require('./mongodb');
const User = require('./models/User');
const Company = require('./models/Company');
const CompanyApplication = require('./models/CompanyApplication');
const Employee = require('./models/Employee');
const Patent = require('./models/Patent');
const Loan = require('./models/Loan');
const { 
    StockHolding, StockTransaction, Lawsuit, StockExchange, Contract,
    FinancialRecord, RDProject, MarketEvent, DefaultCompany,
    CompanyPerformance, TaxRecord, EconomicCycle, LoanPayment, CentralBankBalance
} = require('./models/index');

class MongoAdapter {
    constructor() {
        this.mongoDb = new MongoDatabase();
    }

    async connect() {
        await this.mongoDb.connect();
        console.log('🎮 MongoDB adapter ready for Corporate Empire Bot');
    }

    async close() {
        await this.mongoDb.disconnect();
    }

    // User management methods
    async createUser(discordId, username) {
        try {
            const existingUser = await User.findOne({ discordId });
            if (existingUser) {
                return existingUser._id;
            }

            const user = new User({
                discordId,
                username,
                cash: 100000 // Starting capital
            });
            await user.save();
            return user._id;
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    async getUser(discordId) {
        try {
            const user = await User.findOne({ discordId });
            return user ? {
                id: user._id,
                discord_id: user.discordId,
                username: user.username,
                cash: user.cash,
                created_at: user.createdAt,
                last_active: user.lastActive
            } : null;
        } catch (error) {
            console.error('Error getting user:', error);
            throw error;
        }
    }

    async updateUserCash(discordId, amount) {
        try {
            const result = await User.updateOne(
                { discordId },
                { $inc: { cash: amount }, lastActive: new Date() }
            );
            return result.modifiedCount;
        } catch (error) {
            console.error('Error updating user cash:', error);
            throw error;
        }
    }

    // Company application management
    async getPendingApplicationByUser(userId) {
        try {
            const application = await CompanyApplication.findOne({ 
                applicantId: userId, 
                status: 'pending' 
            });
            return application ? {
                id: application._id,
                applicant_id: application.applicantId,
                company_name: application.companyName,
                industry: application.industry,
                status: application.status,
                submitted_at: application.submittedAt
            } : null;
        } catch (error) {
            console.error('Error getting pending application by user:', error);
            throw error;
        }
    }

    async createCompanyApplication(applicationData) {
        try {
            const application = new CompanyApplication({
                applicantId: applicationData.applicantId,
                companyName: applicationData.companyName,
                industry: applicationData.industry,
                applicationData: JSON.stringify(applicationData),
                requestedCapital: applicationData.requestedCapital,
                ticketChannelId: applicationData.ticketChannelId
            });
            await application.save();
            return application._id;
        } catch (error) {
            console.error('Error creating company application:', error);
            throw error;
        }
    }

    async getCompanyApplication(applicationId) {
        try {
            const application = await CompanyApplication.findById(applicationId);
            return application ? {
                id: application._id,
                applicant_id: application.applicantId,
                company_name: application.companyName,
                industry: application.industry,
                application_data: application.applicationData,
                ticket_channel_id: application.ticketChannelId,
                status: application.status,
                requested_capital: application.requestedCapital,
                approved_capital: application.approvedCapital,
                reviewer_id: application.reviewerId,
                submitted_at: application.submittedAt,
                reviewed_at: application.reviewedAt,
                admin_notes: application.adminNotes
            } : null;
        } catch (error) {
            console.error('Error getting company application:', error);
            throw error;
        }
    }

    async updateCompanyApplicationStatus(applicationId, status, reviewerId, approvedCapital = null, notes = null) {
        try {
            const result = await CompanyApplication.updateOne(
                { _id: applicationId },
                {
                    status,
                    reviewerId,
                    approvedCapital,
                    adminNotes: notes,
                    reviewedAt: new Date()
                }
            );
            return result.modifiedCount;
        } catch (error) {
            console.error('Error updating company application status:', error);
            throw error;
        }
    }

    // Company management
    async createCompany(companyData) {
        try {
            const company = new Company({
                name: companyData.name,
                ownerId: companyData.ownerId,
                industry: companyData.industry,
                subIndustry: companyData.subIndustry,
                description: companyData.description,
                startingCapital: companyData.startingCapital,
                currentValuation: companyData.startingCapital, // Initial valuation equals starting capital
                tickerSymbol: companyData.tickerSymbol
            });
            await company.save();
            return company._id;
        } catch (error) {
            console.error('Error creating company:', error);
            throw error;
        }
    }

    async getCompany(companyId) {
        try {
            const company = await Company.findById(companyId);
            return company ? {
                id: company._id,
                name: company.name,
                owner_id: company.ownerId,
                industry: company.industry,
                sub_industry: company.subIndustry,
                description: company.description,
                starting_capital: company.startingCapital,
                current_valuation: company.currentValuation,
                shares_outstanding: company.sharesOutstanding,
                shares_available: company.sharesAvailable,
                founded_date: company.foundedDate,
                status: company.status,
                ticker_symbol: company.tickerSymbol,
                // Industry specialization fields
                specialized_industry: company.specializedIndustry,
                specialization_level: company.specializationLevel,
                specialization_cost: company.specializationCost,
                specialization_date: company.specializationDate,
                revenue_multiplier: company.revenueMultiplier,
                efficiency_bonus: company.efficiencyBonus,
                valuation_multiplier: company.valuationMultiplier,
                specialization_monthly_cost: company.specializationMonthlyCost
            } : null;
        } catch (error) {
            console.error('Error getting company:', error);
            throw error;
        }
    }

    async getCompaniesByOwner(ownerId) {
        try {
            const companies = await Company.find({ ownerId, status: 'active' });
            return companies.map(company => ({
                id: company._id,
                name: company.name,
                owner_id: company.ownerId,
                industry: company.industry,
                sub_industry: company.subIndustry,
                description: company.description,
                starting_capital: company.startingCapital,
                current_valuation: company.currentValuation,
                shares_outstanding: company.sharesOutstanding,
                shares_available: company.sharesAvailable,
                founded_date: company.foundedDate,
                status: company.status,
                ticker_symbol: company.tickerSymbol,
                // Industry specialization fields
                specialized_industry: company.specializedIndustry,
                specialization_level: company.specializationLevel,
                specialization_cost: company.specializationCost,
                specialization_date: company.specializationDate,
                revenue_multiplier: company.revenueMultiplier,
                efficiency_bonus: company.efficiencyBonus,
                valuation_multiplier: company.valuationMultiplier,
                specialization_monthly_cost: company.specializationMonthlyCost
            }));
        } catch (error) {
            console.error('Error getting companies by owner:', error);
            throw error;
        }
    }

    async searchCompanyByName(query) {
        try {
            const companies = await Company.find({
                $or: [
                    { name: { $regex: query, $options: 'i' } },
                    { tickerSymbol: { $regex: query, $options: 'i' } }
                ],
                status: 'active'
            }).limit(1);
            
            if (companies.length === 0) return null;
            
            const company = companies[0];
            const owner = await User.findOne({ discordId: company.ownerId });
            
            return {
                id: company._id,
                name: company.name,
                owner_id: company.ownerId,
                owner_username: owner?.username || 'Unknown',
                industry: company.industry,
                sub_industry: company.subIndustry,
                description: company.description,
                starting_capital: company.startingCapital,
                current_valuation: company.currentValuation,
                shares_outstanding: company.sharesOutstanding,
                shares_available: company.sharesAvailable,
                founded_date: company.foundedDate,
                status: company.status,
                ticker_symbol: company.tickerSymbol,
                specialized_industry: company.specializedIndustry,
                specialization_level: company.specializationLevel
            };
        } catch (error) {
            console.error('Error searching company by name:', error);
            throw error;
        }
    }

    async getAllActiveCompanies() {
        try {
            const companies = await Company.find({ status: 'active' })
                .sort({ currentValuation: -1 });
            
            // Manually get owner usernames
            const result = [];
            for (const company of companies) {
                const owner = await User.findOne({ discordId: company.ownerId });
                result.push({
                    id: company._id,
                    name: company.name,
                    owner_id: company.ownerId,
                    owner_username: owner?.username || 'Unknown',
                    industry: company.industry,
                    sub_industry: company.subIndustry,
                    current_valuation: company.currentValuation,
                    shares_outstanding: company.sharesOutstanding,
                    ticker_symbol: company.tickerSymbol,
                    specialized_industry: company.specializedIndustry,
                    specialization_level: company.specializationLevel
                });
            }
            
            return result;
        } catch (error) {
            console.error('Error getting all active companies:', error);
            throw error;
        }
    }

    // Employee Management
    async hireEmployee(companyId, employeeType, employeeId, name, position, salary) {
        try {
            const productivityMultiplier = employeeType === 'player' ? 2.5 : 1.0;
            const employee = new Employee({
                companyId,
                employeeType,
                employeeId,
                name,
                position,
                salary,
                productivityMultiplier
            });
            await employee.save();
            return employee._id;
        } catch (error) {
            console.error('Error hiring employee:', error);
            throw error;
        }
    }

    async fireEmployee(employeeId) {
        try {
            const result = await Employee.updateOne(
                { _id: employeeId },
                { status: 'fired' }
            );
            return result.modifiedCount;
        } catch (error) {
            console.error('Error firing employee:', error);
            throw error;
        }
    }

    async getCompanyEmployees(companyId) {
        try {
            const employees = await Employee.find({ companyId, status: 'active' })
                .sort({ hireDate: 1 });
            
            // Manually populate user data for player employees
            const result = [];
            for (const emp of employees) {
                let discordUsername = null;
                if (emp.employeeType === 'player' && emp.employeeId) {
                    const user = await User.findOne({ discordId: emp.employeeId });
                    discordUsername = user?.username || null;
                }
                
                result.push({
                    id: emp._id,
                    company_id: emp.companyId,
                    employee_type: emp.employeeType,
                    employee_id: emp.employeeId,
                    name: emp.name,
                    position: emp.position,
                    salary: emp.salary,
                    productivity_multiplier: emp.productivityMultiplier,
                    hire_date: emp.hireDate,
                    status: emp.status,
                    monthly_performance: emp.monthlyPerformance,
                    discord_username: discordUsername
                });
            }
            
            return result;
        } catch (error) {
            console.error('Error getting company employees:', error);
            throw error;
        }
    }

    async calculateCompanyMonthlyRevenue(companyId) {
        try {
            const revenue = await Employee.calculateCompanyRevenue(companyId);
            const employees = await Employee.findByCompany(companyId);
            
            return {
                total_productivity: revenue,
                employee_count: employees.length
            };
        } catch (error) {
            console.error('Error calculating company monthly revenue:', error);
            throw error;
        }
    }

    // Patent Management
    async submitPatent(companyId, title, description, patentType = 'utility') {
        try {
            const patent = new Patent({
                companyId,
                title,
                description,
                patentType
            });
            await patent.save();
            return patent._id;
        } catch (error) {
            console.error('Error submitting patent:', error);
            throw error;
        }
    }

    async approvePatent(patentId, adminId, monthlyRevenue = 5000) {
        try {
            const patent = await Patent.findById(patentId);
            if (!patent) throw new Error('Patent not found');
            
            await patent.approve(adminId, monthlyRevenue);
            return 1;
        } catch (error) {
            console.error('Error approving patent:', error);
            throw error;
        }
    }

    async getCompanyPatents(companyId) {
        try {
            const patents = await Patent.find({ companyId }).sort({ filingDate: -1 });
            return patents.map(patent => ({
                id: patent._id,
                company_id: patent.companyId,
                title: patent.title,
                description: patent.description,
                filing_date: patent.filingDate,
                approval_date: patent.approvalDate,
                expiry_date: patent.expiryDate,
                status: patent.status,
                monthly_revenue: patent.monthlyRevenue,
                total_revenue: patent.totalRevenue,
                approval_admin_id: patent.approvalAdminId,
                patent_type: patent.patentType
            }));
        } catch (error) {
            console.error('Error getting company patents:', error);
            throw error;
        }
    }

    async getPendingPatents() {
        try {
            const patents = await Patent.find({ status: 'pending' })
                .populate('companyId', 'name')
                .sort({ filingDate: 1 });
            
            return patents.map(patent => ({
                id: patent._id,
                company_id: patent.companyId._id,
                company_name: patent.companyId.name,
                title: patent.title,
                description: patent.description,
                filing_date: patent.filingDate,
                patent_type: patent.patentType
            }));
        } catch (error) {
            console.error('Error getting pending patents:', error);
            throw error;
        }
    }

    // Loan Management
    async createLoanApplication(companyId, principalAmount, termMonths, collateralDescription) {
        try {
            const creditScore = await this.calculateCompanyCreditScore(companyId);
            const interestRate = this.calculateInterestRate(creditScore);
            const monthlyPayment = this.calculateMonthlyPayment(principalAmount, interestRate, termMonths);
            
            const nextPaymentDate = new Date();
            nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
            
            const loan = new Loan({
                companyId,
                principalAmount,
                remainingBalance: principalAmount,
                interestRate,
                termMonths,
                monthlyPayment,
                creditScore,
                collateralDescription,
                nextPaymentDate
            });
            
            await loan.save();
            return loan._id;
        } catch (error) {
            console.error('Error creating loan application:', error);
            throw error;
        }
    }

    async calculateCompanyCreditScore(companyId) {
        try {
            const company = await Company.findById(companyId);
            if (!company) return 500;

            // Simple credit score calculation (300-850 range)
            let score = 500; // Base score
            
            // Valuation factor (up to +150 points)
            const valuationRatio = company.currentValuation / company.startingCapital;
            score += Math.min(150, valuationRatio * 50);
            
            // Age factor (up to +100 points) 
            const ageInDays = (new Date() - company.foundedDate) / (1000 * 60 * 60 * 24);
            const ageInMonths = ageInDays / 30;
            score += Math.min(100, ageInMonths * 2);
            
            // Industry specialization bonus (up to +50 points)
            if (company.specializationLevel > 0) {
                score += company.specializationLevel * 15;
            }
            
            return Math.max(300, Math.min(850, Math.round(score)));
        } catch (error) {
            console.error('Error calculating credit score:', error);
            return 500;
        }
    }

    calculateInterestRate(creditScore) {
        // Interest rate based on credit score (5% to 25% annually)
        if (creditScore >= 750) return 0.05; // 5%
        if (creditScore >= 700) return 0.08; // 8%
        if (creditScore >= 650) return 0.12; // 12%
        if (creditScore >= 600) return 0.15; // 15%
        if (creditScore >= 500) return 0.18; // 18%
        return 0.25; // 25% for poor credit
    }

    calculateMonthlyPayment(principal, annualRate, termMonths) {
        const monthlyRate = annualRate / 12;
        if (monthlyRate === 0) return principal / termMonths;
        
        const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
                       (Math.pow(1 + monthlyRate, termMonths) - 1);
        return Math.round(payment * 100) / 100;
    }

    async getCompanyLoans(companyId) {
        try {
            const loans = await Loan.find({ companyId }).sort({ approvalDate: -1 });
            return loans.map(loan => ({
                id: loan._id,
                company_id: loan.companyId,
                principal_amount: loan.principalAmount,
                remaining_balance: loan.remainingBalance,
                interest_rate: loan.interestRate,
                term_months: loan.termMonths,
                monthly_payment: loan.monthlyPayment,
                status: loan.status,
                approval_date: loan.approvalDate,
                next_payment_date: loan.nextPaymentDate,
                approved_by_admin_id: loan.approvedByAdminId,
                credit_score: loan.creditScore,
                collateral_description: loan.collateralDescription
            }));
        } catch (error) {
            console.error('Error getting company loans:', error);
            throw error;
        }
    }

    // Industry Specialization Methods (NEW)
    async updateCompanySpecialization(companyId, specializationData) {
        try {
            const result = await Company.updateOne(
                { _id: companyId },
                {
                    specializedIndustry: specializationData.industry,
                    specializationLevel: specializationData.level,
                    specializationCost: specializationData.cost,
                    specializationDate: new Date(),
                    revenueMultiplier: specializationData.revenueMultiplier,
                    efficiencyBonus: specializationData.efficiencyBonus,
                    valuationMultiplier: specializationData.valuationMultiplier,
                    specializationMonthlyCost: specializationData.monthlyCost
                }
            );
            return result.modifiedCount;
        } catch (error) {
            console.error('Error updating company specialization:', error);
            throw error;
        }
    }

    async getCompaniesBySpecialization(industry, level = null) {
        try {
            const filter = { specializedIndustry: industry, status: 'active' };
            if (level !== null) {
                filter.specializationLevel = level;
            }
            
            const companies = await Company.find(filter)
                .populate('ownerId', 'username')
                .sort({ currentValuation: -1 });
            
            return companies.map(company => this.formatCompanyForResponse(company));
        } catch (error) {
            console.error('Error getting companies by specialization:', error);
            throw error;
        }
    }

    // Helper method to format company data consistently
    formatCompanyForResponse(company) {
        return {
            id: company._id,
            name: company.name,
            owner_id: company.ownerId,
            owner_username: company.ownerId?.username || 'Unknown',
            industry: company.industry,
            sub_industry: company.subIndustry,
            current_valuation: company.currentValuation,
            shares_outstanding: company.sharesOutstanding,
            ticker_symbol: company.tickerSymbol,
            specialized_industry: company.specializedIndustry,
            specialization_level: company.specializationLevel,
            revenue_multiplier: company.revenueMultiplier,
            efficiency_bonus: company.efficiencyBonus,
            valuation_multiplier: company.valuationMultiplier,
            specialization_monthly_cost: company.specializationMonthlyCost
        };
    }

    // Placeholder methods for remaining functionality
    async createLawsuit(lawsuitData) {
        // Implementation needed
        throw new Error('Method not yet implemented for MongoDB');
    }

    async updateLawsuitStatus(lawsuitId, status, judgeId = null) {
        // Implementation needed
        throw new Error('Method not yet implemented for MongoDB');
    }

    async createStockExchange(name, ownerId, feePercentage = 0.04) {
        // Implementation needed
        throw new Error('Method not yet implemented for MongoDB');
    }

    async getMainStockExchange() {
        // Implementation needed
        throw new Error('Method not yet implemented for MongoDB');
    }

    async processTaxes(companyId, revenue, taxPeriod) {
        // Implementation needed
        throw new Error('Method not yet implemented for MongoDB');
    }

    async updateCentralBankBalance(period, taxIncome, loanInterest, loansIssued) {
        // Implementation needed
        throw new Error('Method not yet implemented for MongoDB');
    }

    async ensureDefaultCompany(companyType, name, industry, description, adminId) {
        try {
            // Check if default company already exists
            let company = await Company.findOne({ 
                name: name,
                ownerId: adminId,
                status: 'active'
            });
            
            if (!company) {
                // Create the default company
                const companyData = {
                    name: name,
                    ownerId: adminId,
                    industry: industry,
                    description: description,
                    startingCapital: 50000000, // Large starting capital for system companies
                    currentValuation: 50000000,
                    sharesOutstanding: 1000000,
                    sharesAvailable: 0, // System companies don't trade shares
                    tickerSymbol: this.generateTickerSymbol(name),
                    status: 'active'
                };
                
                company = new Company(companyData);
                await company.save();
                
                console.log(`✅ Created default company: ${name}`);
            } else {
                console.log(`✅ Default company already exists: ${name}`);
            }
            
            return company;
        } catch (error) {
            console.error(`Error ensuring default company ${name}:`, error);
            // Don't throw error - just log it to prevent startup failure
            return null;
        }
    }
    
    // Helper method to generate ticker symbols for system companies
    generateTickerSymbol(companyName) {
        // Generate ticker based on company name
        const words = companyName.toUpperCase().split(' ');
        if (words.length >= 2) {
            return words.map(word => word.charAt(0)).join('').substring(0, 4);
        } else {
            return companyName.toUpperCase().substring(0, 4);
        }
    }
}

module.exports = MongoAdapter;

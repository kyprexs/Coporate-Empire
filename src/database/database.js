const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

class Database {
    constructor(dbPath = process.env.DB_PATH || './data/corporate_empire.db') {
        this.dbPath = dbPath;
        this.db = null;
        
        // Ensure data directory exists
        const dataDir = path.dirname(dbPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
    }

    async connect() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Error opening database:', err);
                    reject(err);
                } else {
                    console.log('Connected to SQLite database');
                    this.initializeSchema().then(resolve).catch(reject);
                }
            });
        });
    }

    async initializeSchema() {
        return new Promise((resolve, reject) => {
            const schemaPath = path.join(__dirname, 'schema.sql');
            const schema = fs.readFileSync(schemaPath, 'utf8');
            
            this.db.exec(schema, (err) => {
                if (err) {
                    console.error('Error initializing schema:', err);
                    reject(err);
                } else {
                    console.log('Database schema initialized successfully');
                    resolve();
                }
            });
        });
    }

    // User management
    async createUser(discordId, username) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT OR IGNORE INTO users (discord_id, username, cash)
                VALUES (?, ?, 100000)
            `;
            this.db.run(query, [discordId, username], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    async getUser(discordId) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM users WHERE discord_id = ?';
            this.db.get(query, [discordId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    async updateUserCash(discordId, amount) {
        return new Promise((resolve, reject) => {
            const query = 'UPDATE users SET cash = cash + ? WHERE discord_id = ?';
            this.db.run(query, [amount, discordId], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    // Company application management
    async createCompanyApplication(applicationData) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO company_applications 
                (applicant_id, company_name, industry, application_data, requested_capital, ticket_channel_id)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            const { applicantId, companyName, industry, requestedCapital, ticketChannelId } = applicationData;
            
            this.db.run(query, [
                applicantId,
                companyName,
                industry,
                JSON.stringify(applicationData),
                requestedCapital,
                ticketChannelId
            ], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    async getCompanyApplication(applicationId) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM company_applications WHERE id = ?';
            this.db.get(query, [applicationId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    async updateCompanyApplicationStatus(applicationId, status, reviewerId, approvedCapital = null, notes = null) {
        return new Promise((resolve, reject) => {
            const query = `
                UPDATE company_applications 
                SET status = ?, reviewer_id = ?, approved_capital = ?, admin_notes = ?, reviewed_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;
            this.db.run(query, [status, reviewerId, approvedCapital, notes, applicationId], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    // Company management
    async createCompany(companyData) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO companies 
                (name, owner_id, industry, sub_industry, description, starting_capital, current_valuation, ticker_symbol)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const { name, ownerId, industry, subIndustry, description, startingCapital, tickerSymbol } = companyData;
            
            this.db.run(query, [
                name,
                ownerId,
                industry,
                subIndustry,
                description,
                startingCapital,
                startingCapital, // Initial valuation equals starting capital
                tickerSymbol
            ], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    async getCompany(companyId) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM companies WHERE id = ?';
            this.db.get(query, [companyId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    async getCompaniesByOwner(ownerId) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM companies WHERE owner_id = ? AND status = "active"';
            this.db.all(query, [ownerId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Lawsuit management
    async createLawsuit(lawsuitData) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO lawsuits 
                (plaintiff_id, defendant_company_id, claim, requested_damages)
                VALUES (?, ?, ?, ?)
            `;
            const { plaintiffId, defendantCompanyId, claim, requestedDamages } = lawsuitData;
            
            this.db.run(query, [plaintiffId, defendantCompanyId, claim, requestedDamages], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    async updateLawsuitStatus(lawsuitId, status, judgeId = null) {
        return new Promise((resolve, reject) => {
            const query = 'UPDATE lawsuits SET status = ?, judge_id = ? WHERE id = ?';
            this.db.run(query, [status, judgeId, lawsuitId], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    async getLawsuit(lawsuitId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT l.*, c.name as defendant_company_name, u.username as plaintiff_username
                FROM lawsuits l
                JOIN companies c ON l.defendant_company_id = c.id
                JOIN users u ON l.plaintiff_id = u.discord_id
                WHERE l.id = ?
            `;
            this.db.get(query, [lawsuitId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    async getPendingLawsuits() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT l.*, c.name as defendant_company_name, u.username as plaintiff_username
                FROM lawsuits l
                JOIN companies c ON l.defendant_company_id = c.id
                JOIN users u ON l.plaintiff_id = u.discord_id
                WHERE l.status = 'pending'
                ORDER BY l.filed_at DESC
            `;
            this.db.all(query, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Stock exchange management
    async createStockExchange(name, ownerId, feePercentage = 0.04) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO stock_exchanges (name, owner_id, fee_percentage)
                VALUES (?, ?, ?)
            `;
            this.db.run(query, [name, ownerId, feePercentage], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    async getMainStockExchange() {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM stock_exchanges WHERE status = "active" ORDER BY id LIMIT 1';
            this.db.get(query, [], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    // Utility methods
    async close() {
        if (this.db) {
            return new Promise((resolve, reject) => {
                this.db.close((err) => {
                    if (err) reject(err);
                    else {
                        console.log('Database connection closed');
                        resolve();
                    }
                });
            });
        }
    }

    // Get all active companies for market display
    async getAllActiveCompanies() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT c.*, u.username as owner_username
                FROM companies c
                JOIN users u ON c.owner_id = u.discord_id
                WHERE c.status = 'active'
                ORDER BY c.current_valuation DESC
            `;
            this.db.all(query, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Get user's company by name or ticker
    async getUserCompany(userId, companyQuery) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM companies 
                WHERE owner_id = ? 
                AND (LOWER(name) LIKE LOWER(?) OR LOWER(ticker_symbol) LIKE LOWER(?))
                AND status = 'active'
                ORDER BY current_valuation DESC
                LIMIT 1
            `;
            this.db.get(query, [userId, `%${companyQuery}%`, `%${companyQuery}%`], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    // Employee Management
    async hireEmployee(companyId, employeeType, employeeId, name, position, salary) {
        return new Promise((resolve, reject) => {
            const productivityMultiplier = employeeType === 'player' ? 2.5 : 1.0;
            const query = `
                INSERT INTO employees 
                (company_id, employee_type, employee_id, name, position, salary, productivity_multiplier)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            this.db.run(query, [companyId, employeeType, employeeId, name, position, salary, productivityMultiplier], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    async fireEmployee(employeeId) {
        return new Promise((resolve, reject) => {
            const query = 'UPDATE employees SET status = "fired" WHERE id = ?';
            this.db.run(query, [employeeId], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    async getCompanyEmployees(companyId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT e.*, u.username as discord_username
                FROM employees e
                LEFT JOIN users u ON e.employee_id = u.discord_id
                WHERE e.company_id = ? AND e.status = 'active'
                ORDER BY e.hire_date
            `;
            this.db.all(query, [companyId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async calculateCompanyMonthlyRevenue(companyId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    SUM(e.salary * e.productivity_multiplier) as total_productivity,
                    COUNT(*) as employee_count
                FROM employees e
                WHERE e.company_id = ? AND e.status = 'active'
            `;
            this.db.get(query, [companyId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    // Patent Management
    async submitPatent(companyId, title, description, patentType = 'utility') {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO patents (company_id, title, description, patent_type)
                VALUES (?, ?, ?, ?)
            `;
            this.db.run(query, [companyId, title, description, patentType], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    async approvePatent(patentId, adminId, monthlyRevenue = 5000) {
        return new Promise((resolve, reject) => {
            const approvalDate = new Date();
            const expiryDate = new Date(approvalDate.getTime() + (20 * 365 * 24 * 60 * 60 * 1000)); // 20 years
            
            const query = `
                UPDATE patents 
                SET status = 'approved', approval_admin_id = ?, approval_date = ?, 
                    expiry_date = ?, monthly_revenue = ?
                WHERE id = ?
            `;
            this.db.run(query, [adminId, approvalDate.toISOString(), expiryDate.toISOString(), monthlyRevenue, patentId], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    async getCompanyPatents(companyId) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM patents WHERE company_id = ? ORDER BY filing_date DESC';
            this.db.all(query, [companyId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async getPendingPatents() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT p.*, c.name as company_name
                FROM patents p
                JOIN companies c ON p.company_id = c.id
                WHERE p.status = 'pending'
                ORDER BY p.filing_date
            `;
            this.db.all(query, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Loan Management
    async createLoanApplication(companyId, principalAmount, termMonths, collateralDescription) {
        return new Promise((resolve, reject) => {
            // Calculate credit score based on company performance
            this.calculateCompanyCreditScore(companyId).then(creditScore => {
                const interestRate = this.calculateInterestRate(creditScore);
                const monthlyPayment = this.calculateMonthlyPayment(principalAmount, interestRate, termMonths);
                
                const query = `
                    INSERT INTO loans 
                    (company_id, principal_amount, remaining_balance, interest_rate, term_months, 
                     monthly_payment, credit_score, collateral_description, next_payment_date)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                
                const nextPaymentDate = new Date();
                nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
                
                this.db.run(query, [
                    companyId, principalAmount, principalAmount, interestRate, termMonths,
                    monthlyPayment, creditScore, collateralDescription, nextPaymentDate.toISOString()
                ], function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                });
            }).catch(reject);
        });
    }

    async calculateCompanyCreditScore(companyId) {
        return new Promise((resolve, reject) => {
            // Simple credit score based on company age, valuation, and financial history
            const query = `
                SELECT 
                    c.current_valuation,
                    c.starting_capital,
                    julianday('now') - julianday(c.founded_date) as days_active,
                    COALESCE(AVG(fr.profit), 0) as avg_profit
                FROM companies c
                LEFT JOIN financial_records fr ON c.id = fr.company_id
                WHERE c.id = ?
                GROUP BY c.id
            `;
            this.db.get(query, [companyId], (err, row) => {
                if (err) reject(err);
                else {
                    if (!row) {
                        resolve(500); // Default score
                        return;
                    }
                    
                    // Calculate score (300-850 range)
                    let score = 500; // Base score
                    
                    // Valuation factor (up to +150 points)
                    const valuationRatio = row.current_valuation / row.starting_capital;
                    score += Math.min(150, valuationRatio * 50);
                    
                    // Age factor (up to +100 points)
                    const ageInMonths = row.days_active / 30;
                    score += Math.min(100, ageInMonths * 2);
                    
                    // Profitability factor (up to +100 points)
                    if (row.avg_profit > 0) {
                        score += Math.min(100, (row.avg_profit / 10000) * 20);
                    } else if (row.avg_profit < 0) {
                        score -= Math.min(100, Math.abs(row.avg_profit / 10000) * 20);
                    }
                    
                    resolve(Math.max(300, Math.min(850, Math.round(score))));
                }
            });
        });
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
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM loans WHERE company_id = ? ORDER BY approval_date DESC';
            this.db.all(query, [companyId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Tax and Economic Cycle Management
    async processTaxes(companyId, revenue, taxPeriod) {
        return new Promise((resolve, reject) => {
            const taxRate = 0.08; // 8%
            const taxAmount = revenue * taxRate;
            
            const query = `
                INSERT INTO tax_records (company_id, tax_period, revenue_subject_to_tax, tax_amount)
                VALUES (?, ?, ?, ?)
            `;
            this.db.run(query, [companyId, taxPeriod, revenue, taxAmount], function(err) {
                if (err) reject(err);
                else resolve(taxAmount);
            });
        });
    }

    async updateCentralBankBalance(period, taxIncome, loanInterest, loansIssued) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT OR REPLACE INTO central_bank_balance 
                (period, tax_income, loan_interest_income, loans_issued, closing_balance, last_updated)
                VALUES (?, ?, ?, ?, 
                        COALESCE((SELECT closing_balance FROM central_bank_balance WHERE period = ?), 0) + ? + ? - ?,
                        CURRENT_TIMESTAMP)
            `;
            this.db.run(query, [period, taxIncome, loanInterest, loansIssued, period, taxIncome, loanInterest, loansIssued], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    // Default Company Management
    async ensureDefaultCompany(companyType, name, industry, description, adminId) {
        return new Promise((resolve, reject) => {
            // Check if default company already exists
            const checkQuery = 'SELECT * FROM default_companies WHERE company_type = ?';
            this.db.get(checkQuery, [companyType], (err, existing) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (existing) {
                    resolve(existing.company_id);
                    return;
                }

                // Create the company
                const createCompanyQuery = `
                    INSERT INTO companies 
                    (name, owner_id, industry, description, starting_capital, current_valuation, ticker_symbol)
                    VALUES (?, ?, ?, ?, 10000000, 10000000, ?)
                `;
                
                const tickerSymbol = companyType.toUpperCase().replace('_', '');
                
                this.db.run(createCompanyQuery, [name, adminId, industry, description, tickerSymbol], function(err) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    const companyId = this.lastID;
                    
                    // Register as default company
                    const registerQuery = `
                        INSERT INTO default_companies (company_type, company_id, special_permissions)
                        VALUES (?, ?, ?)
                    `;
                    
                    const permissions = JSON.stringify(this.getDefaultCompanyPermissions(companyType));
                    
                    this.db.run(registerQuery, [companyType, companyId, permissions], function(err) {
                        if (err) reject(err);
                        else resolve(companyId);
                    });
                });
            });
        });
    }

    getDefaultCompanyPermissions(companyType) {
        const permissions = {
            'central_bank': ['issue_loans', 'collect_taxes', 'monetary_policy'],
            'insurance': ['underwrite_policies', 'process_claims'],
            'stock_exchange': ['list_companies', 'process_trades', 'collect_fees'],
            'law_firm': ['handle_disputes', 'represent_clients', 'government_contracts']
        };
        return permissions[companyType] || [];
    }

    async getDefaultCompany(companyType) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT dc.*, c.* 
                FROM default_companies dc
                JOIN companies c ON dc.company_id = c.id
                WHERE dc.company_type = ?
            `;
            this.db.get(query, [companyType], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }
}

module.exports = Database;

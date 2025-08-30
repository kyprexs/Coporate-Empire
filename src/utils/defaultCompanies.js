class DefaultCompaniesManager {
    constructor(client) {
        this.client = client;
        this.adminId = process.env.BOT_ADMIN_ID || 'ADMIN_USER_ID_HERE'; // Set in .env
    }

    async initializeDefaultCompanies() {
        console.log('🏛️ Initializing default admin-controlled companies...');

        try {
            // Ensure admin user exists in database
            await this.client.db.createUser(this.adminId, 'System Admin');

            const defaultCompanies = [
                {
                    type: 'central_bank',
                    name: 'Central Bank of Corporate Empire',
                    industry: 'Financial Services',
                    description: 'The primary monetary authority responsible for issuing loans, collecting taxes, and maintaining economic stability in the Corporate Empire.'
                },
                {
                    type: 'insurance',
                    name: 'Empire Insurance Corporation',
                    industry: 'Insurance',
                    description: 'Government-backed insurance provider offering comprehensive coverage for businesses and individuals across the Corporate Empire.'
                },
                {
                    type: 'stock_exchange',
                    name: 'Corporate Empire Stock Exchange',
                    industry: 'Financial Services',
                    description: 'The primary securities exchange facilitating the trading of company shares and financial instruments.'
                },
                {
                    type: 'law_firm',
                    name: 'Empire Legal Services',
                    industry: 'Legal Services',
                    description: 'Government legal entity responsible for dispute resolution, corporate law, and regulatory enforcement until private law firms are established.'
                }
            ];

            for (const companyDef of defaultCompanies) {
                try {
                    const companyId = await this.client.db.ensureDefaultCompany(
                        companyDef.type,
                        companyDef.name,
                        companyDef.industry,
                        companyDef.description,
                        this.adminId
                    );

                    console.log(`✅ Initialized ${companyDef.name} (ID: ${companyId?._id || companyId})`);

                    // Special setup for Central Bank
                    if (companyDef.type === 'central_bank') {
                        await this.initializeCentralBankBalance();
                    }

                    // Special setup for Stock Exchange
                    if (companyDef.type === 'stock_exchange') {
                        await this.initializeStockExchange(companyId);
                    }

                } catch (error) {
                    console.error(`Error initializing ${companyDef.name}:`, error);
                }
            }

            console.log('✅ Default companies initialization completed');

        } catch (error) {
            console.error('Error in default companies initialization:', error);
        }
    }

    async initializeCentralBankBalance() {
        try {
            // MongoDB implementation for Central Bank balance initialization
            console.log('✅ Central Bank balance initialization (MongoDB implementation pending)');
            // This feature will be implemented when financial tracking is fully migrated
        } catch (error) {
            console.error('Error initializing Central Bank balance:', error);
        }
    }

    async initializeStockExchange(exchangeCompanyId) {
        try {
            // MongoDB implementation for Stock Exchange initialization
            console.log('✅ Stock Exchange initialization (MongoDB implementation pending)');
            // This feature will be implemented when trading system is fully migrated
        } catch (error) {
            console.error('Error initializing Stock Exchange:', error);
        }
    }

    async checkForPlayerCompetitors() {
        // Check if any player has created a law firm to compete with government services
        const playerLawFirms = await this.client.db.db.all(`
            SELECT c.* FROM companies c
            WHERE c.industry = 'Legal Services' 
            AND c.owner_id != ? 
            AND c.status = 'active'
        `, [this.adminId]);

        if (playerLawFirms.length > 0) {
            // Transfer admin law firm to government control
            await this.convertToGovernmentEntity();
        }

        return playerLawFirms.length > 0;
    }

    async convertToGovernmentEntity() {
        try {
            // Update the admin law firm to be explicitly government-controlled
            await this.client.db.db.run(`
                UPDATE companies 
                SET name = 'Corporate Empire Government Legal Department',
                    description = 'Government legal entity responsible for regulatory enforcement and public legal services.'
                WHERE owner_id = ? AND industry = 'Legal Services'
            `, [this.adminId]);

            console.log('✅ Converted admin law firm to government entity due to player competition');
        } catch (error) {
            console.error('Error converting to government entity:', error);
        }
    }

    async getDefaultCompanyInfo() {
        const defaultCompanies = await this.client.db.db.all(`
            SELECT dc.company_type, dc.is_admin_controlled, c.*
            FROM default_companies dc
            JOIN companies c ON dc.company_id = c.id
        `);

        return defaultCompanies;
    }

    // Manual admin command to reset/reinitialize default companies
    async reinitializeDefaults() {
        try {
            await this.initializeDefaultCompanies();
            return { success: true, message: 'Default companies reinitialized successfully' };
        } catch (error) {
            console.error('Error reinitializing defaults:', error);
            return { success: false, message: 'Error reinitializing default companies' };
        }
    }
}

module.exports = DefaultCompaniesManager;

module.exports = {
    name: 'clientReady',
    once: true,
    async execute(client) {
        console.log(`🚀 Corporate Empire Bot is ready! Logged in as ${client.user.tag}`);
        console.log(`📊 Serving ${client.guilds.cache.size} guild(s)`);
        
        // Set bot status
        client.user.setActivity('Corporate Empire | /help', { type: 0 }); // 0 = Playing
        
        // Initialize economic systems
        try {
            console.log('🏛️ Initializing economic systems...');
            
            // Initialize default companies
            const DefaultCompaniesManager = require('../utils/defaultCompanies');
            client.defaultCompaniesManager = new DefaultCompaniesManager(client);
            await client.defaultCompaniesManager.initializeDefaultCompanies();
            
            // Start economic scheduler
            const EconomicScheduler = require('../utils/economicScheduler');
            client.economicScheduler = new EconomicScheduler(client);
            client.economicScheduler.start();
            
            console.log('✅ Economic systems initialized successfully');
        } catch (error) {
            console.error('Error initializing economic systems:', error);
        }
        
        console.log('🎮 Corporate Empire Bot is fully operational!');
    }
};

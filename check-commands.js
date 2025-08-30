require('dotenv').config();
const { REST, Routes } = require('discord.js');

async function checkCommandStatus() {
    console.log('🔍 Checking Discord command deployment status...\n');
    
    try {
        const rest = new REST().setToken(process.env.DISCORD_TOKEN);
        const clientId = process.env.CLIENT_ID;
        
        // Check global commands
        console.log('📡 Checking global commands...');
        const globalCommands = await rest.get(Routes.applicationCommands(clientId));
        console.log(`✅ Found ${globalCommands.length} global commands deployed`);
        
        if (globalCommands.length > 0) {
            console.log('\n📋 Global Commands:');
            globalCommands.forEach(cmd => {
                console.log(`   • /${cmd.name} - ${cmd.description}`);
            });
        }
        
        // Check if guild ID is set for guild-specific commands
        if (process.env.GUILD_ID && process.env.GUILD_ID !== 'your_guild_id_here') {
            console.log('\n📡 Checking guild-specific commands...');
            const guildCommands = await rest.get(Routes.applicationGuildCommands(clientId, process.env.GUILD_ID));
            console.log(`✅ Found ${guildCommands.length} guild commands deployed`);
            
            if (guildCommands.length > 0) {
                console.log('\n📋 Guild Commands:');
                guildCommands.forEach(cmd => {
                    console.log(`   • /${cmd.name} - ${cmd.description}`);
                });
            }
        } else {
            console.log('\n⚠️ No GUILD_ID set - commands deployed globally (may take up to 1 hour to appear)');
            console.log('💡 To deploy instantly to your server, provide your Discord server ID');
        }
        
    } catch (error) {
        console.error('❌ Error checking command status:', error);
    }
}

checkCommandStatus();

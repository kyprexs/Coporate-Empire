require('dotenv').config();
const { REST, Routes } = require('discord.js');

async function clearAndRedeploy() {
    console.log('🧹 Clearing existing commands and redeploying...\n');
    
    try {
        const rest = new REST().setToken(process.env.DISCORD_TOKEN);
        const clientId = process.env.CLIENT_ID;
        const guildId = process.env.GUILD_ID;
        
        // Clear guild commands first
        if (guildId) {
            console.log('🗑️ Clearing guild commands...');
            await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] });
            console.log('✅ Guild commands cleared');
        }
        
        // Clear global commands
        console.log('🗑️ Clearing global commands...');
        await rest.put(Routes.applicationCommands(clientId), { body: [] });
        console.log('✅ Global commands cleared');
        
        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Now redeploy to guild only
        const fs = require('fs');
        const path = require('path');
        
        const commands = [];
        const commandsPath = path.join(__dirname, 'src', 'commands');
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        
        for (const file of commandFiles) {
            try {
                const command = require(`./src/commands/${file}`);
                if (command.data && command.execute) {
                    commands.push(command.data.toJSON());
                    console.log(`✅ Loaded command: ${command.data.name}`);
                }
            } catch (error) {
                console.log(`❌ Failed to load ${file}: ${error.message}`);
            }
        }
        
        console.log(`\n🚀 Deploying ${commands.length} commands to your server...`);
        
        const data = await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands }
        );
        
        console.log(`✅ Successfully deployed ${data.length} commands to your Discord server!`);
        console.log('\n📋 Available Commands:');
        commands.forEach(cmd => {
            console.log(`   • /${cmd.name} - ${cmd.description}`);
        });
        
    } catch (error) {
        console.error('❌ Error clearing/redeploying commands:', error);
    }
}

clearAndRedeploy();

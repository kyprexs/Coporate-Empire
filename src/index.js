require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
// Choose database adapter based on environment
const useMongoDb = process.env.MONGODB_URI && process.env.MONGODB_URI !== 'mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const Database = useMongoDb ? require('./database/mongoAdapter') : require('./database/database');

// Create Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Initialize database
const db = new Database();
client.db = db;

console.log(`🎮 Corporate Empire Bot starting with ${useMongoDb ? 'MongoDB Atlas' : 'SQLite'} database`);

// Initialize economic systems
const EconomicScheduler = require('./utils/economicScheduler');
const DefaultCompaniesManager = require('./utils/defaultCompanies');

client.economicScheduler = null;
client.defaultCompaniesManager = null;

// Load commands
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');

if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            console.log(`Loaded command: ${command.data.name}`);
        } else {
            console.warn(`Command at ${filePath} is missing required "data" or "execute" property.`);
        }
    }
}

// Load event handlers
const eventsPath = path.join(__dirname, 'events');

if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    
    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);
        
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
        console.log(`Loaded event: ${event.name}`);
    }
}

// Global error handling
process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
    console.error('Uncaught exception:', error);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down gracefully...');
    
    // Stop economic scheduler
    if (client.economicScheduler) {
        client.economicScheduler.stop();
    }
    
    await db.close();
    client.destroy();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    
    // Stop economic scheduler
    if (client.economicScheduler) {
        client.economicScheduler.stop();
    }
    
    await db.close();
    client.destroy();
    process.exit(0);
});

// Connect to database and start bot
async function startBot() {
    try {
        await db.connect();
        console.log('Database connected successfully');
        
        await client.login(process.env.DISCORD_TOKEN);
        console.log('Bot logged in successfully');
    } catch (error) {
        console.error('Error starting bot:', error);
        process.exit(1);
    }
}

startBot();

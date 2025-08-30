const mongoose = require('mongoose');

class MongoDatabase {
    constructor() {
        this.connection = null;
        this.models = {};
    }

    async connect() {
        try {
            const mongoUri = process.env.MONGODB_URI;
            const dbName = process.env.DB_NAME || 'corporate_empire';

            if (!mongoUri) {
                throw new Error('MONGODB_URI environment variable is not set');
            }

            console.log('🔗 Connecting to MongoDB Atlas...');
            
            this.connection = await mongoose.connect(mongoUri, {
                dbName: dbName,
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            });

            console.log('✅ Connected to MongoDB Atlas successfully!');
            console.log(`📊 Database: ${dbName}`);

            // Load all models
            this.loadModels();

            return this.connection;
        } catch (error) {
            console.error('❌ MongoDB connection error:', error);
            throw error;
        }
    }

    loadModels() {
        // Import all schema models
        this.models.User = require('./models/User');
        this.models.Company = require('./models/Company');
        this.models.CompanyApplication = require('./models/CompanyApplication');
        this.models.Employee = require('./models/Employee');
        this.models.Patent = require('./models/Patent');
        this.models.Loan = require('./models/Loan');
        
        // Import remaining models from index
        const additionalModels = require('./models/index');
        Object.assign(this.models, additionalModels);

        console.log('📦 All MongoDB models loaded successfully');
        console.log(`📊 Total models loaded: ${Object.keys(this.models).length}`);
    }

    async disconnect() {
        if (this.connection) {
            await mongoose.disconnect();
            console.log('📡 Disconnected from MongoDB');
        }
    }

    // Health check
    async isConnected() {
        return mongoose.connection.readyState === 1;
    }

    // Get connection status
    getConnectionStatus() {
        const states = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting'
        };
        return states[mongoose.connection.readyState] || 'unknown';
    }

    // Database info
    async getDatabaseInfo() {
        if (!this.isConnected()) {
            throw new Error('Database not connected');
        }

        const admin = mongoose.connection.db.admin();
        const stats = await mongoose.connection.db.stats();
        
        return {
            name: mongoose.connection.name,
            status: this.getConnectionStatus(),
            collections: Object.keys(this.models).length,
            dataSize: stats.dataSize,
            storageSize: stats.storageSize,
            indexes: stats.indexes,
            objects: stats.objects
        };
    }
}

module.exports = MongoDatabase;

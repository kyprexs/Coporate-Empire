const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    ownerId: {
        type: String,
        required: true,
        ref: 'User'
    },
    industry: {
        type: String,
        required: true
    },
    subIndustry: {
        type: String
    },
    description: {
        type: String
    },
    startingCapital: {
        type: Number,
        required: true
    },
    currentValuation: {
        type: Number
    },
    sharesOutstanding: {
        type: Number,
        default: 1000000
    },
    sharesAvailable: {
        type: Number,
        default: 0
    },
    foundedDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        default: 'active',
        enum: ['active', 'bankrupt', 'merged', 'acquired']
    },
    tickerSymbol: {
        type: String,
        unique: true,
        sparse: true
    },
    
    // Industry specialization fields
    specializedIndustry: {
        type: String,
        enum: ['technology', 'finance', 'energy', 'retail', 'manufacturing', 
               'healthcare', 'automotive', 'aerospace', 'entertainment', 'agriculture'],
        default: null
    },
    specializationLevel: {
        type: Number,
        min: 0,
        max: 3,
        default: 0
    },
    specializationCost: {
        type: Number,
        default: 0
    },
    specializationDate: {
        type: Date,
        default: null
    },
    revenueMultiplier: {
        type: Number,
        default: 1.0,
        min: 0.1,
        max: 5.0
    },
    efficiencyBonus: {
        type: Number,
        default: 0.0,
        min: 0.0,
        max: 1.0
    },
    valuationMultiplier: {
        type: Number,
        default: 1.0,
        min: 0.1,
        max: 5.0
    },
    specializationMonthlyCost: {
        type: Number,
        default: 0,
        min: 0
    }
}, {
    timestamps: true,
    collection: 'companies'
});

// Indexes
companySchema.index({ ownerId: 1 });
companySchema.index({ status: 1 });
companySchema.index({ specializedIndustry: 1 });
companySchema.index({ specializationLevel: 1 });
companySchema.index({ industry: 1 });
companySchema.index({ foundedDate: -1 });

// Virtual for calculating monthly specialization costs
companySchema.virtual('monthlySpecializationCost').get(function() {
    return this.specializationMonthlyCost;
});

// Methods
companySchema.methods.getSpecializationInfo = function() {
    if (!this.specializedIndustry) {
        return {
            specialized: false,
            industry: null,
            level: 0,
            benefits: {
                revenueMultiplier: 1.0,
                efficiencyBonus: 0.0,
                valuationMultiplier: 1.0
            },
            costs: {
                totalInvestment: 0,
                monthlyCost: 0
            }
        };
    }

    return {
        specialized: true,
        industry: this.specializedIndustry,
        level: this.specializationLevel,
        benefits: {
            revenueMultiplier: this.revenueMultiplier,
            efficiencyBonus: this.efficiencyBonus,
            valuationMultiplier: this.valuationMultiplier
        },
        costs: {
            totalInvestment: this.specializationCost,
            monthlyCost: this.specializationMonthlyCost
        },
        since: this.specializationDate
    };
};

// Static methods
companySchema.statics.findByOwner = function(ownerId) {
    return this.find({ ownerId: ownerId, status: 'active' });
};

companySchema.statics.findByIndustry = function(industry) {
    return this.find({ specializedIndustry: industry, status: 'active' });
};

companySchema.statics.findBySpecializationLevel = function(level) {
    return this.find({ specializationLevel: level, status: 'active' });
};

module.exports = mongoose.model('Company', companySchema);

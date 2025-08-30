const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    employeeType: {
        type: String,
        required: true,
        enum: ['npc', 'player']
    },
    employeeId: {
        type: String,
        ref: 'User',
        default: null // NULL for NPCs, discord_id for players
    },
    name: {
        type: String,
        required: true
    },
    position: {
        type: String,
        required: true
    },
    salary: {
        type: Number,
        required: true,
        min: 0
    },
    productivityMultiplier: {
        type: Number,
        default: 1.0,
        min: 0.1,
        max: 10.0
    },
    hireDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        default: 'active',
        enum: ['active', 'fired', 'quit']
    },
    monthlyPerformance: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    collection: 'employees'
});

// Indexes
employeeSchema.index({ companyId: 1 });
employeeSchema.index({ employeeType: 1 });
employeeSchema.index({ employeeId: 1 });
employeeSchema.index({ status: 1 });

// Virtual for calculating monthly revenue contribution
employeeSchema.virtual('monthlyRevenue').get(function() {
    return this.salary * this.productivityMultiplier;
});

// Methods
employeeSchema.methods.calculateMonthlyContribution = function() {
    return this.salary * this.productivityMultiplier;
};

// Static methods
employeeSchema.statics.findByCompany = function(companyId) {
    return this.find({ companyId: companyId, status: 'active' });
};

employeeSchema.statics.findByType = function(employeeType) {
    return this.find({ employeeType: employeeType, status: 'active' });
};

employeeSchema.statics.calculateCompanyPayroll = async function(companyId) {
    const employees = await this.find({ companyId: companyId, status: 'active' });
    return employees.reduce((total, emp) => total + emp.salary, 0);
};

employeeSchema.statics.calculateCompanyRevenue = async function(companyId) {
    const employees = await this.find({ companyId: companyId, status: 'active' });
    return employees.reduce((total, emp) => total + emp.calculateMonthlyContribution(), 0);
};

module.exports = mongoose.model('Employee', employeeSchema);

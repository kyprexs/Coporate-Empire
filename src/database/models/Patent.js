const mongoose = require('mongoose');

const patentSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    filingDate: {
        type: Date,
        default: Date.now
    },
    approvalDate: {
        type: Date,
        default: null
    },
    expiryDate: {
        type: Date,
        default: null // 20 years from approval typically
    },
    status: {
        type: String,
        default: 'pending',
        enum: ['pending', 'approved', 'rejected', 'expired']
    },
    monthlyRevenue: {
        type: Number,
        default: 0,
        min: 0
    },
    totalRevenue: {
        type: Number,
        default: 0,
        min: 0
    },
    approvalAdminId: {
        type: String,
        ref: 'User',
        default: null
    },
    patentType: {
        type: String,
        default: 'utility',
        enum: ['utility', 'design', 'software']
    }
}, {
    timestamps: true,
    collection: 'patents'
});

// Indexes
patentSchema.index({ companyId: 1 });
patentSchema.index({ status: 1 });
patentSchema.index({ approvalDate: -1 });
patentSchema.index({ expiryDate: 1 });

// Virtual for checking if patent is active
patentSchema.virtual('isActive').get(function() {
    return this.status === 'approved' && (!this.expiryDate || this.expiryDate > new Date());
});

// Virtual for years remaining
patentSchema.virtual('yearsRemaining').get(function() {
    if (!this.expiryDate) return null;
    const now = new Date();
    const timeDiff = this.expiryDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24 * 365.25)));
});

// Methods
patentSchema.methods.approve = function(adminId, monthlyRevenue = 5000) {
    this.status = 'approved';
    this.approvalDate = new Date();
    this.expiryDate = new Date(Date.now() + (20 * 365.25 * 24 * 60 * 60 * 1000)); // 20 years
    this.monthlyRevenue = monthlyRevenue;
    this.approvalAdminId = adminId;
    return this.save();
};

patentSchema.methods.reject = function(adminId) {
    this.status = 'rejected';
    this.approvalAdminId = adminId;
    return this.save();
};

patentSchema.methods.addRevenue = function(amount) {
    this.totalRevenue += amount;
    return this.save();
};

// Static methods
patentSchema.statics.findActiveByCompany = function(companyId) {
    const now = new Date();
    return this.find({
        companyId: companyId,
        status: 'approved',
        $or: [
            { expiryDate: null },
            { expiryDate: { $gt: now } }
        ]
    });
};

patentSchema.statics.calculateCompanyPatentRevenue = async function(companyId) {
    const activePatents = await this.findActiveByCompany(companyId);
    return activePatents.reduce((total, patent) => total + patent.monthlyRevenue, 0);
};

patentSchema.statics.findExpiring = function(withinDays = 30) {
    const futureDate = new Date(Date.now() + (withinDays * 24 * 60 * 60 * 1000));
    return this.find({
        status: 'approved',
        expiryDate: {
            $gte: new Date(),
            $lte: futureDate
        }
    });
};

module.exports = mongoose.model('Patent', patentSchema);

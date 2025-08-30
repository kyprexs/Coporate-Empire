const mongoose = require('mongoose');

const companyApplicationSchema = new mongoose.Schema({
    applicantId: {
        type: String,
        ref: 'User',
        required: true
    },
    companyName: {
        type: String,
        required: true
    },
    industry: {
        type: String,
        required: true
    },
    applicationData: {
        type: String,
        required: true // JSON string with all application data
    },
    ticketChannelId: {
        type: String
    },
    status: {
        type: String,
        default: 'pending',
        enum: ['pending', 'approved', 'denied', 'under_review']
    },
    requestedCapital: {
        type: Number
    },
    approvedCapital: {
        type: Number
    },
    reviewerId: {
        type: String,
        ref: 'User'
    },
    submittedAt: {
        type: Date,
        default: Date.now
    },
    reviewedAt: {
        type: Date
    },
    adminNotes: {
        type: String
    }
}, {
    timestamps: true,
    collection: 'company_applications'
});

// Indexes
companyApplicationSchema.index({ applicantId: 1 });
companyApplicationSchema.index({ status: 1 });
companyApplicationSchema.index({ submittedAt: -1 });

module.exports = mongoose.model('CompanyApplication', companyApplicationSchema);

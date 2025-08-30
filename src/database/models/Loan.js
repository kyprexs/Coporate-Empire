const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    principalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    remainingBalance: {
        type: Number,
        required: true,
        min: 0
    },
    interestRate: {
        type: Number,
        required: true,
        min: 0,
        max: 1
    },
    termMonths: {
        type: Number,
        required: true,
        min: 1
    },
    monthlyPayment: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        default: 'active',
        enum: ['active', 'paid_off', 'defaulted']
    },
    approvalDate: {
        type: Date,
        default: Date.now
    },
    nextPaymentDate: {
        type: Date,
        required: true
    },
    approvedByAdminId: {
        type: String,
        ref: 'User',
        default: null
    },
    creditScore: {
        type: Number,
        min: 300,
        max: 850
    },
    collateralDescription: {
        type: String
    }
}, {
    timestamps: true,
    collection: 'loans'
});

// Indexes
loanSchema.index({ companyId: 1 });
loanSchema.index({ status: 1 });
loanSchema.index({ nextPaymentDate: 1 });
loanSchema.index({ approvalDate: -1 });

// Virtual for calculating total payments made
loanSchema.virtual('totalPaid').get(function() {
    return this.principalAmount - this.remainingBalance;
});

// Virtual for calculating progress percentage
loanSchema.virtual('paymentProgress').get(function() {
    return (this.totalPaid / this.principalAmount) * 100;
});

// Methods
loanSchema.methods.makePayment = function(paymentAmount) {
    const monthlyInterest = this.remainingBalance * (this.interestRate / 12);
    const principalPayment = Math.max(0, paymentAmount - monthlyInterest);
    
    this.remainingBalance = Math.max(0, this.remainingBalance - principalPayment);
    
    // Update next payment date
    this.nextPaymentDate = new Date(this.nextPaymentDate.getTime() + (30 * 24 * 60 * 60 * 1000));
    
    // Check if loan is paid off
    if (this.remainingBalance <= 0.01) {
        this.status = 'paid_off';
        this.remainingBalance = 0;
    }
    
    return {
        principalPayment: principalPayment,
        interestPayment: monthlyInterest,
        remainingBalance: this.remainingBalance,
        paidOff: this.status === 'paid_off'
    };
};

loanSchema.methods.calculateMonthlyInterest = function() {
    return this.remainingBalance * (this.interestRate / 12);
};

loanSchema.methods.markDefault = function() {
    this.status = 'defaulted';
    return this.save();
};

// Static methods
loanSchema.statics.findActiveByCompany = function(companyId) {
    return this.find({ companyId: companyId, status: 'active' });
};

loanSchema.statics.findDuePayments = function(beforeDate = new Date()) {
    return this.find({
        status: 'active',
        nextPaymentDate: { $lte: beforeDate }
    });
};

loanSchema.statics.calculateCompanyLoanPayments = async function(companyId) {
    const activeLoans = await this.find({ companyId: companyId, status: 'active' });
    return activeLoans.reduce((total, loan) => total + loan.monthlyPayment, 0);
};

loanSchema.statics.calculateTotalInterestIncome = async function() {
    const activeLoans = await this.find({ status: 'active' });
    return activeLoans.reduce((total, loan) => total + loan.calculateMonthlyInterest(), 0);
};

module.exports = mongoose.model('Loan', loanSchema);

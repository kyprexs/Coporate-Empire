const mongoose = require('mongoose');

// Simple schemas for remaining models - these can be expanded later

const StockHolding = mongoose.model('StockHolding', new mongoose.Schema({
    userId: { type: String, ref: 'User', required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    shares: { type: Number, required: true },
    averageCost: { type: Number, required: true },
    acquiredDate: { type: Date, default: Date.now }
}, { collection: 'stock_holdings' }));

const StockTransaction = mongoose.model('StockTransaction', new mongoose.Schema({
    buyerId: { type: String, ref: 'User' },
    sellerId: { type: String, ref: 'User' },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    shares: { type: Number, required: true },
    pricePerShare: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    exchangeFee: { type: Number, required: true },
    exchangeOwnerId: { type: String, ref: 'User' },
    transactionType: { type: String, required: true, enum: ['buy', 'sell', 'ipo', 'dividend'] },
    timestamp: { type: Date, default: Date.now }
}, { collection: 'stock_transactions' }));

const Lawsuit = mongoose.model('Lawsuit', new mongoose.Schema({
    plaintiffId: { type: String, ref: 'User', required: true },
    defendantCompanyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    claim: { type: String, required: true },
    requestedDamages: { type: Number, required: true },
    status: { type: String, default: 'pending', enum: ['pending', 'active', 'settled', 'dismissed', 'ruled'] },
    filingFee: { type: Number, default: 1000 },
    settlementAmount: { type: Number },
    ruling: { type: String },
    judgeId: { type: String, ref: 'User' },
    filedAt: { type: Date, default: Date.now },
    resolvedAt: { type: Date },
    evidenceChannelId: { type: String }
}, { collection: 'lawsuits' }));

const StockExchange = mongoose.model('StockExchange', new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    ownerId: { type: String, ref: 'User', required: true },
    feePercentage: { type: Number, default: 0.04 },
    totalVolume: { type: Number, default: 0 },
    totalFeesCollected: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    status: { type: String, default: 'active', enum: ['active', 'closed'] }
}, { collection: 'stock_exchanges' }));

const Contract = mongoose.model('Contract', new mongoose.Schema({
    companyAId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    companyBId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    contractType: { type: String, required: true, enum: ['supply', 'partnership', 'licensing', 'merger'] },
    terms: { type: String, required: true },
    value: { type: Number, required: true },
    durationMonths: { type: Number },
    status: { type: String, default: 'pending', enum: ['pending', 'active', 'completed', 'cancelled', 'disputed'] },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date }
}, { collection: 'contracts' }));

const FinancialRecord = mongoose.model('FinancialRecord', new mongoose.Schema({
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    quarter: { type: Number, required: true },
    year: { type: Number, required: true },
    revenue: { type: Number, default: 0 },
    expenses: { type: Number, default: 0 },
    profit: { type: Number, default: 0 },
    cashOnHand: { type: Number, default: 0 },
    assets: { type: Number, default: 0 },
    liabilities: { type: Number, default: 0 },
    recordedAt: { type: Date, default: Date.now }
}, { collection: 'financial_records' }));

const RDProject = mongoose.model('RDProject', new mongoose.Schema({
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    projectName: { type: String, required: true },
    description: { type: String },
    investmentAmount: { type: Number, required: true },
    expectedDurationMonths: { type: Number },
    progressPercentage: { type: Number, default: 0 },
    status: { type: String, default: 'active', enum: ['active', 'completed', 'cancelled', 'failed'] },
    technologyType: { type: String },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date }
}, { collection: 'rd_projects' }));

const MarketEvent = mongoose.model('MarketEvent', new mongoose.Schema({
    eventType: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    affectedIndustries: { type: String }, // JSON array of affected industries
    impactModifier: { type: Number, default: 1.0 },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    createdBy: { type: String, ref: 'User' },
    active: { type: Boolean, default: true }
}, { collection: 'market_events' }));

const DefaultCompany = mongoose.model('DefaultCompany', new mongoose.Schema({
    companyType: { type: String, required: true, unique: true, enum: ['central_bank', 'insurance', 'stock_exchange', 'law_firm'] },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    isAdminControlled: { type: Boolean, default: true },
    specialPermissions: { type: String } // JSON array of special abilities
}, { collection: 'default_companies' }));

const CompanyPerformance = mongoose.model('CompanyPerformance', new mongoose.Schema({
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    period: { type: String, required: true }, // YYYY-MM format
    employeeProductivity: { type: Number, default: 0 },
    patentIncome: { type: Number, default: 0 },
    taxBurden: { type: Number, default: 0 },
    loanPayments: { type: Number, default: 0 },
    netMonthlyIncome: { type: Number, default: 0 },
    calculatedAt: { type: Date, default: Date.now }
}, { collection: 'company_performance' }));

const TaxRecord = mongoose.model('TaxRecord', new mongoose.Schema({
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    taxPeriod: { type: String, required: true }, // format: YYYY-MM
    revenueSubjectToTax: { type: Number, required: true },
    taxRate: { type: Number, default: 0.08 },
    taxAmount: { type: Number, required: true },
    paymentDate: { type: Date, default: Date.now },
    status: { type: String, default: 'paid', enum: ['paid', 'pending', 'overdue'] }
}, { collection: 'tax_records' }));

const EconomicCycle = mongoose.model('EconomicCycle', new mongoose.Schema({
    cyclePeriod: { type: String, required: true, unique: true }, // format: YYYY-MM
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalCompanyRevenue: { type: Number, default: 0 },
    totalTaxesCollected: { type: Number, default: 0 },
    totalLoanInterest: { type: Number, default: 0 },
    totalPatentRevenue: { type: Number, default: 0 },
    activeCompanies: { type: Number, default: 0 },
    activeEmployees: { type: Number, default: 0 },
    status: { type: String, default: 'active', enum: ['active', 'completed'] },
    processedAt: { type: Date }
}, { collection: 'economic_cycles' }));

const LoanPayment = mongoose.model('LoanPayment', new mongoose.Schema({
    loanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan', required: true },
    paymentAmount: { type: Number, required: true },
    principalAmount: { type: Number, required: true },
    interestAmount: { type: Number, required: true },
    paymentDate: { type: Date, default: Date.now },
    paymentType: { type: String, default: 'monthly', enum: ['monthly', 'early', 'final'] }
}, { collection: 'loan_payments' }));

const CentralBankBalance = mongoose.model('CentralBankBalance', new mongoose.Schema({
    period: { type: String, required: true, unique: true }, // YYYY-MM format
    openingBalance: { type: Number, default: 0 },
    taxIncome: { type: Number, default: 0 },
    loanInterestIncome: { type: Number, default: 0 },
    loansIssued: { type: Number, default: 0 },
    operatingExpenses: { type: Number, default: 0 },
    closingBalance: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
}, { collection: 'central_bank_balance' }));

// Export all models
module.exports = {
    StockHolding,
    StockTransaction,
    Lawsuit,
    StockExchange,
    Contract,
    FinancialRecord,
    RDProject,
    MarketEvent,
    DefaultCompany,
    CompanyPerformance,
    TaxRecord,
    EconomicCycle,
    LoanPayment,
    CentralBankBalance
};

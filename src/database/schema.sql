-- Corporate Empire Bot Database Schema

-- Users table to track Discord users and their game data
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    discord_id TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    cash REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_active DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Companies table for registered companies
CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    owner_id TEXT NOT NULL,
    industry TEXT NOT NULL,
    sub_industry TEXT,
    description TEXT,
    starting_capital REAL NOT NULL,
    current_valuation REAL,
    shares_outstanding INTEGER DEFAULT 1000000,
    shares_available INTEGER DEFAULT 0,
    founded_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'active', -- active, bankrupt, merged, acquired
    ticker_symbol TEXT UNIQUE,
    -- Industry specialization fields
    specialized_industry TEXT DEFAULT NULL, -- technology, finance, energy, retail, manufacturing, healthcare, automotive, aerospace, entertainment, agriculture
    specialization_level INTEGER DEFAULT 0, -- 0=none, 1=basic, 2=advanced, 3=expert
    specialization_cost REAL DEFAULT 0, -- total amount spent on specialization
    specialization_date DATETIME DEFAULT NULL, -- when specialization was acquired/last upgraded
    revenue_multiplier REAL DEFAULT 1.0, -- industry-specific revenue boost
    efficiency_bonus REAL DEFAULT 0.0, -- operational efficiency improvement
    valuation_multiplier REAL DEFAULT 1.0, -- market valuation boost
    specialization_monthly_cost REAL DEFAULT 0, -- ongoing monthly maintenance cost
    FOREIGN KEY (owner_id) REFERENCES users(discord_id)
);

-- Company applications pending admin approval
CREATE TABLE IF NOT EXISTS company_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    applicant_id TEXT NOT NULL,
    company_name TEXT NOT NULL,
    industry TEXT NOT NULL,
    application_data TEXT NOT NULL, -- JSON string with all application data
    ticket_channel_id TEXT,
    status TEXT DEFAULT 'pending', -- pending, approved, denied, under_review
    requested_capital REAL,
    approved_capital REAL,
    reviewer_id TEXT,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME,
    admin_notes TEXT,
    FOREIGN KEY (applicant_id) REFERENCES users(discord_id)
);

-- Stock ownership tracking
CREATE TABLE IF NOT EXISTS stock_holdings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    company_id INTEGER NOT NULL,
    shares INTEGER NOT NULL,
    average_cost REAL NOT NULL,
    acquired_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(discord_id),
    FOREIGN KEY (company_id) REFERENCES companies(id),
    UNIQUE(user_id, company_id)
);

-- Stock transactions log
CREATE TABLE IF NOT EXISTS stock_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    buyer_id TEXT,
    seller_id TEXT,
    company_id INTEGER NOT NULL,
    shares INTEGER NOT NULL,
    price_per_share REAL NOT NULL,
    total_amount REAL NOT NULL,
    exchange_fee REAL NOT NULL,
    exchange_owner_id TEXT,
    transaction_type TEXT NOT NULL, -- buy, sell, ipo, dividend
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (buyer_id) REFERENCES users(discord_id),
    FOREIGN KEY (seller_id) REFERENCES users(discord_id),
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (exchange_owner_id) REFERENCES users(discord_id)
);

-- Lawsuits table
CREATE TABLE IF NOT EXISTS lawsuits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plaintiff_id TEXT NOT NULL,
    defendant_company_id INTEGER NOT NULL,
    claim TEXT NOT NULL,
    requested_damages REAL NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, active, settled, dismissed, ruled
    filing_fee REAL DEFAULT 1000,
    settlement_amount REAL,
    ruling TEXT,
    judge_id TEXT, -- admin who handles the case
    filed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    evidence_channel_id TEXT,
    FOREIGN KEY (plaintiff_id) REFERENCES users(discord_id),
    FOREIGN KEY (defendant_company_id) REFERENCES companies(id),
    FOREIGN KEY (judge_id) REFERENCES users(discord_id)
);

-- Stock Exchange entities (player-owned exchanges)
CREATE TABLE IF NOT EXISTS stock_exchanges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    owner_id TEXT NOT NULL,
    fee_percentage REAL DEFAULT 0.04,
    total_volume REAL DEFAULT 0,
    total_fees_collected REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'active', -- active, closed
    FOREIGN KEY (owner_id) REFERENCES users(discord_id)
);

-- Contracts between companies
CREATE TABLE IF NOT EXISTS contracts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_a_id INTEGER NOT NULL,
    company_b_id INTEGER NOT NULL,
    contract_type TEXT NOT NULL, -- supply, partnership, licensing, merger
    terms TEXT NOT NULL,
    value REAL NOT NULL,
    duration_months INTEGER,
    status TEXT DEFAULT 'pending', -- pending, active, completed, cancelled, disputed
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    FOREIGN KEY (company_a_id) REFERENCES companies(id),
    FOREIGN KEY (company_b_id) REFERENCES companies(id)
);

-- Company financial records
CREATE TABLE IF NOT EXISTS financial_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    quarter INTEGER NOT NULL,
    year INTEGER NOT NULL,
    revenue REAL DEFAULT 0,
    expenses REAL DEFAULT 0,
    profit REAL DEFAULT 0,
    cash_on_hand REAL DEFAULT 0,
    assets REAL DEFAULT 0,
    liabilities REAL DEFAULT 0,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    UNIQUE(company_id, quarter, year)
);

-- Research & Development projects
CREATE TABLE IF NOT EXISTS rd_projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    project_name TEXT NOT NULL,
    description TEXT,
    investment_amount REAL NOT NULL,
    expected_duration_months INTEGER,
    progress_percentage INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active', -- active, completed, cancelled, failed
    technology_type TEXT,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Market events that affect the economy
CREATE TABLE IF NOT EXISTS market_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    affected_industries TEXT, -- JSON array of affected industries
    impact_modifier REAL DEFAULT 1.0, -- multiplier for market effects
    start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_date DATETIME,
    created_by TEXT, -- admin who created the event
    active BOOLEAN DEFAULT 1
);

-- Employees table for both NPC and real players working at companies
CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    employee_type TEXT NOT NULL, -- 'npc' or 'player'
    employee_id TEXT, -- NULL for NPCs, discord_id for players
    name TEXT NOT NULL,
    position TEXT NOT NULL,
    salary REAL NOT NULL,
    productivity_multiplier REAL DEFAULT 1.0, -- 1.0 for NPC, 2.5 for players
    hire_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'active', -- active, fired, quit
    monthly_performance REAL DEFAULT 0, -- calculated monthly
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (employee_id) REFERENCES users(discord_id)
);

-- Patents table for intellectual property
CREATE TABLE IF NOT EXISTS patents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    filing_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    approval_date DATETIME,
    expiry_date DATETIME, -- 20 years from approval typically
    status TEXT DEFAULT 'pending', -- pending, approved, rejected, expired
    monthly_revenue REAL DEFAULT 0,
    total_revenue REAL DEFAULT 0,
    approval_admin_id TEXT,
    patent_type TEXT DEFAULT 'utility', -- utility, design, software
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (approval_admin_id) REFERENCES users(discord_id)
);

-- Loans table for company borrowing
CREATE TABLE IF NOT EXISTS loans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    principal_amount REAL NOT NULL,
    remaining_balance REAL NOT NULL,
    interest_rate REAL NOT NULL, -- annual percentage
    term_months INTEGER NOT NULL,
    monthly_payment REAL NOT NULL,
    status TEXT DEFAULT 'active', -- active, paid_off, defaulted
    approval_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    next_payment_date DATETIME,
    approved_by_admin_id TEXT,
    credit_score REAL, -- company credit score at time of approval
    collateral_description TEXT,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (approved_by_admin_id) REFERENCES users(discord_id)
);

-- Loan payments tracking
CREATE TABLE IF NOT EXISTS loan_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    loan_id INTEGER NOT NULL,
    payment_amount REAL NOT NULL,
    principal_amount REAL NOT NULL,
    interest_amount REAL NOT NULL,
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    payment_type TEXT DEFAULT 'monthly', -- monthly, early, final
    FOREIGN KEY (loan_id) REFERENCES loans(id)
);

-- Tax records for tracking government revenue
CREATE TABLE IF NOT EXISTS tax_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    tax_period TEXT NOT NULL, -- format: YYYY-MM
    revenue_subject_to_tax REAL NOT NULL,
    tax_rate REAL DEFAULT 0.08,
    tax_amount REAL NOT NULL,
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'paid', -- paid, pending, overdue
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Monthly economic cycles tracking
CREATE TABLE IF NOT EXISTS economic_cycles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cycle_period TEXT UNIQUE NOT NULL, -- format: YYYY-MM
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    total_company_revenue REAL DEFAULT 0,
    total_taxes_collected REAL DEFAULT 0,
    total_loan_interest REAL DEFAULT 0,
    total_patent_revenue REAL DEFAULT 0,
    active_companies INTEGER DEFAULT 0,
    active_employees INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active', -- active, completed
    processed_at DATETIME
);

-- Default companies managed by admins
CREATE TABLE IF NOT EXISTS default_companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_type TEXT UNIQUE NOT NULL, -- 'central_bank', 'insurance', 'stock_exchange', 'law_firm'
    company_id INTEGER,
    is_admin_controlled BOOLEAN DEFAULT 1,
    special_permissions TEXT, -- JSON array of special abilities
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Company performance metrics calculated monthly
CREATE TABLE IF NOT EXISTS company_performance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    period TEXT NOT NULL, -- YYYY-MM format
    employee_productivity REAL DEFAULT 0,
    patent_income REAL DEFAULT 0,
    tax_burden REAL DEFAULT 0,
    loan_payments REAL DEFAULT 0,
    net_monthly_income REAL DEFAULT 0,
    calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    UNIQUE(company_id, period)
);

-- Central bank balance tracking
CREATE TABLE IF NOT EXISTS central_bank_balance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    period TEXT UNIQUE NOT NULL, -- YYYY-MM format
    opening_balance REAL DEFAULT 0,
    tax_income REAL DEFAULT 0,
    loan_interest_income REAL DEFAULT 0,
    loans_issued REAL DEFAULT 0,
    operating_expenses REAL DEFAULT 0,
    closing_balance REAL DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_discord_id ON users(discord_id);
CREATE INDEX IF NOT EXISTS idx_companies_owner ON companies(owner_id);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_specialized_industry ON companies(specialized_industry);
CREATE INDEX IF NOT EXISTS idx_companies_specialization_level ON companies(specialization_level);
CREATE INDEX IF NOT EXISTS idx_stock_holdings_user ON stock_holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_timestamp ON stock_transactions(timestamp);
CREATE INDEX IF NOT EXISTS idx_lawsuits_status ON lawsuits(status);
CREATE INDEX IF NOT EXISTS idx_company_applications_status ON company_applications(status);
CREATE INDEX IF NOT EXISTS idx_employees_company ON employees(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_type ON employees(employee_type);
CREATE INDEX IF NOT EXISTS idx_patents_status ON patents(status);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_tax_records_period ON tax_records(tax_period);
CREATE INDEX IF NOT EXISTS idx_economic_cycles_period ON economic_cycles(cycle_period);

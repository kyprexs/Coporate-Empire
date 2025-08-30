const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stock')
        .setDescription('Trade company stocks on the Corporate Empire Stock Exchange')
        .addSubcommand(subcommand =>
            subcommand
                .setName('buy')
                .setDescription('Buy shares of a company')
                .addStringOption(option =>
                    option
                        .setName('company')
                        .setDescription('Company name or ticker symbol')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option
                        .setName('shares')
                        .setDescription('Number of shares to buy')
                        .setRequired(true)
                        .setMinValue(1)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('sell')
                .setDescription('Sell shares you own')
                .addStringOption(option =>
                    option
                        .setName('company')
                        .setDescription('Company name or ticker symbol')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option
                        .setName('shares')
                        .setDescription('Number of shares to sell')
                        .setRequired(true)
                        .setMinValue(1)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('market')
                .setDescription('View current market prices and trends')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('portfolio')
                .setDescription('View your stock portfolio')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('price')
                .setDescription('Get current stock price for a company')
                .addStringOption(option =>
                    option
                        .setName('company')
                        .setDescription('Company name or ticker symbol')
                        .setRequired(true)
                )
        ),

    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();

        // Temporary notice for MongoDB compatibility
        await interaction.reply({
            content: '🚧 **Stock trading system is being updated for MongoDB compatibility.**\n\nThis feature will be available soon! Use `/onboarding` to learn about other game features.',
            ephemeral: true
        });
        return;

        // TODO: Implement MongoDB-compatible stock trading
        switch (subcommand) {
            case 'buy':
                await this.handleBuy(interaction, client);
                break;
            case 'sell':
                await this.handleSell(interaction, client);
                break;
            case 'market':
                await this.handleMarket(interaction, client);
                break;
            case 'portfolio':
                await this.handlePortfolio(interaction, client);
                break;
            case 'price':
                await this.handlePrice(interaction, client);
                break;
        }
    },

    async handleBuy(interaction, client) {
        try {
            const companyQuery = interaction.options.getString('company');
            const sharesToBuy = interaction.options.getInteger('shares');

            // Find the company
            const company = await client.db.db.get(`
                SELECT c.*, u.username as owner_username 
                FROM companies c
                JOIN users u ON c.owner_id = u.discord_id
                WHERE (LOWER(c.name) LIKE LOWER(?) OR LOWER(c.ticker_symbol) LIKE LOWER(?))
                AND c.status = 'active'
            `, [`%${companyQuery}%`, `%${companyQuery}%`]);

            if (!company) {
                await interaction.reply({
                    content: '❌ No active company found with that name or ticker symbol.',
                    ephemeral: true
                });
                return;
            }

            // Calculate current stock price based on valuation and outstanding shares
            const stockPrice = this.calculateStockPrice(company);
            const totalCost = stockPrice * sharesToBuy;

            // Get stock exchange for fees
            const exchange = await client.db.getMainStockExchange();
            const exchangeFee = totalCost * (exchange?.fee_percentage || 0.04);
            const totalWithFees = totalCost + exchangeFee;

            // Check if user has enough cash
            const buyer = await client.db.getUser(interaction.user.id);
            if (buyer.cash < totalWithFees) {
                await interaction.reply({
                    content: `❌ Insufficient funds. You need $${totalWithFees.toLocaleString()} but have $${buyer.cash.toLocaleString()}.`,
                    ephemeral: true
                });
                return;
            }

            // Check if enough shares are available
            if (sharesToBuy > company.shares_available) {
                await interaction.reply({
                    content: `❌ Not enough shares available. Only ${company.shares_available} shares are available for purchase.`,
                    ephemeral: true
                });
                return;
            }

            // Process the transaction
            await client.db.db.run('BEGIN TRANSACTION');

            try {
                // Update buyer's cash
                await client.db.updateUserCash(interaction.user.id, -totalWithFees);

                // Update company's available shares
                await client.db.db.run(`
                    UPDATE companies 
                    SET shares_available = shares_available - ?
                    WHERE id = ?
                `, [sharesToBuy, company.id]);

                // Update or create stock holding
                await client.db.db.run(`
                    INSERT INTO stock_holdings (user_id, company_id, shares, average_cost)
                    VALUES (?, ?, ?, ?)
                    ON CONFLICT(user_id, company_id) DO UPDATE SET
                        shares = shares + ?,
                        average_cost = ((average_cost * shares) + (? * ?)) / (shares + ?)
                `, [interaction.user.id, company.id, sharesToBuy, stockPrice, sharesToBuy, stockPrice, sharesToBuy, sharesToBuy]);

                // Record transaction
                await client.db.db.run(`
                    INSERT INTO stock_transactions 
                    (buyer_id, company_id, shares, price_per_share, total_amount, exchange_fee, 
                     exchange_owner_id, transaction_type)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'buy')
                `, [interaction.user.id, company.id, sharesToBuy, stockPrice, totalCost, exchangeFee, exchange?.owner_id]);

                // Update exchange volume and fees
                if (exchange) {
                    await client.db.db.run(`
                        UPDATE stock_exchanges 
                        SET total_volume = total_volume + ?, total_fees_collected = total_fees_collected + ?
                        WHERE id = ?
                    `, [totalCost, exchangeFee, exchange.id]);

                    // Pay exchange fees to exchange owner (government)
                    await client.db.updateUserCash(exchange.owner_id, exchangeFee);
                }

                await client.db.db.run('COMMIT');

                const embed = new EmbedBuilder()
                    .setTitle('📈 Stock Purchase Successful')
                    .setColor(0x00FF00)
                    .addFields(
                        { name: 'Company', value: `${company.name} (${company.ticker_symbol})`, inline: true },
                        { name: 'Shares Purchased', value: sharesToBuy.toLocaleString(), inline: true },
                        { name: 'Price per Share', value: `$${stockPrice.toFixed(2)}`, inline: true },
                        { name: 'Total Cost', value: `$${totalCost.toLocaleString()}`, inline: true },
                        { name: 'Exchange Fee (4%)', value: `$${exchangeFee.toLocaleString()}`, inline: true },
                        { name: 'Total Paid', value: `$${totalWithFees.toLocaleString()}`, inline: true },
                        { name: 'Remaining Cash', value: `$${(buyer.cash - totalWithFees).toLocaleString()}`, inline: false }
                    )
                    .setTimestamp()
                    .setFooter({ text: 'Corporate Empire Stock Exchange' });

                await interaction.reply({ embeds: [embed] });

            } catch (error) {
                await client.db.db.run('ROLLBACK');
                throw error;
            }

        } catch (error) {
            console.error('Error in stock buy command:', error);
            await interaction.reply({
                content: '❌ There was an error processing your stock purchase.',
                ephemeral: true
            });
        }
    },

    async handleSell(interaction, client) {
        try {
            const companyQuery = interaction.options.getString('company');
            const sharesToSell = interaction.options.getInteger('shares');

            // Find the company
            const company = await client.db.db.get(`
                SELECT c.*, u.username as owner_username 
                FROM companies c
                JOIN users u ON c.owner_id = u.discord_id
                WHERE (LOWER(c.name) LIKE LOWER(?) OR LOWER(c.ticker_symbol) LIKE LOWER(?))
                AND c.status = 'active'
            `, [`%${companyQuery}%`, `%${companyQuery}%`]);

            if (!company) {
                await interaction.reply({
                    content: '❌ No active company found with that name or ticker symbol.',
                    ephemeral: true
                });
                return;
            }

            // Check if user owns shares
            const holding = await client.db.db.get(`
                SELECT * FROM stock_holdings 
                WHERE user_id = ? AND company_id = ?
            `, [interaction.user.id, company.id]);

            if (!holding || holding.shares < sharesToSell) {
                await interaction.reply({
                    content: `❌ You don't own enough shares. You have ${holding?.shares || 0} shares but tried to sell ${sharesToSell}.`,
                    ephemeral: true
                });
                return;
            }

            // Calculate current stock price and proceeds
            const stockPrice = this.calculateStockPrice(company);
            const totalProceeds = stockPrice * sharesToSell;

            // Get stock exchange for fees
            const exchange = await client.db.getMainStockExchange();
            const exchangeFee = totalProceeds * (exchange?.fee_percentage || 0.04);
            const netProceeds = totalProceeds - exchangeFee;

            // Process the transaction
            await client.db.db.run('BEGIN TRANSACTION');

            try {
                // Update seller's cash
                await client.db.updateUserCash(interaction.user.id, netProceeds);

                // Update company's available shares
                await client.db.db.run(`
                    UPDATE companies 
                    SET shares_available = shares_available + ?
                    WHERE id = ?
                `, [sharesToSell, company.id]);

                // Update stock holding
                if (holding.shares === sharesToSell) {
                    // Delete holding if selling all shares
                    await client.db.db.run(`
                        DELETE FROM stock_holdings 
                        WHERE user_id = ? AND company_id = ?
                    `, [interaction.user.id, company.id]);
                } else {
                    // Reduce share count
                    await client.db.db.run(`
                        UPDATE stock_holdings 
                        SET shares = shares - ?
                        WHERE user_id = ? AND company_id = ?
                    `, [sharesToSell, interaction.user.id, company.id]);
                }

                // Record transaction
                await client.db.db.run(`
                    INSERT INTO stock_transactions 
                    (seller_id, company_id, shares, price_per_share, total_amount, exchange_fee, 
                     exchange_owner_id, transaction_type)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'sell')
                `, [interaction.user.id, company.id, sharesToSell, stockPrice, totalProceeds, exchangeFee, exchange?.owner_id]);

                // Update exchange volume and fees
                if (exchange) {
                    await client.db.db.run(`
                        UPDATE stock_exchanges 
                        SET total_volume = total_volume + ?, total_fees_collected = total_fees_collected + ?
                        WHERE id = ?
                    `, [totalProceeds, exchangeFee, exchange.id]);

                    // Pay exchange fees to exchange owner
                    await client.db.updateUserCash(exchange.owner_id, exchangeFee);
                }

                await client.db.db.run('COMMIT');

                // Calculate profit/loss
                const costBasis = holding.average_cost * sharesToSell;
                const profitLoss = totalProceeds - costBasis;

                const embed = new EmbedBuilder()
                    .setTitle('📉 Stock Sale Successful')
                    .setColor(profitLoss >= 0 ? 0x00FF00 : 0xFF0000)
                    .addFields(
                        { name: 'Company', value: `${company.name} (${company.ticker_symbol})`, inline: true },
                        { name: 'Shares Sold', value: sharesToSell.toLocaleString(), inline: true },
                        { name: 'Price per Share', value: `$${stockPrice.toFixed(2)}`, inline: true },
                        { name: 'Total Proceeds', value: `$${totalProceeds.toLocaleString()}`, inline: true },
                        { name: 'Exchange Fee (4%)', value: `$${exchangeFee.toLocaleString()}`, inline: true },
                        { name: 'Net Received', value: `$${netProceeds.toLocaleString()}`, inline: true },
                        { name: 'Profit/Loss', value: `${profitLoss >= 0 ? '+' : ''}$${profitLoss.toLocaleString()}`, inline: true },
                        { name: 'Remaining Shares', value: (holding.shares - sharesToSell).toLocaleString(), inline: true }
                    )
                    .setTimestamp()
                    .setFooter({ text: 'Corporate Empire Stock Exchange' });

                await interaction.reply({ embeds: [embed] });

            } catch (error) {
                await client.db.db.run('ROLLBACK');
                throw error;
            }

        } catch (error) {
            console.error('Error in stock sell command:', error);
            await interaction.reply({
                content: '❌ There was an error processing your stock sale.',
                ephemeral: true
            });
        }
    },

    async handleMarket(interaction, client) {
        try {
            const companies = await client.db.getAllActiveCompanies();

            if (companies.length === 0) {
                await interaction.reply({
                    content: '📊 No companies are currently trading on the stock exchange.',
                    ephemeral: true
                });
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle('📈 Corporate Empire Stock Market')
                .setColor(0x0099FF)
                .setDescription('Current market prices and trading information')
                .setTimestamp()
                .setFooter({ text: 'Corporate Empire Stock Exchange' });

            // Calculate market statistics
            let totalMarketCap = 0;
            const tradingCompanies = [];

            for (const company of companies.slice(0, 15)) { // Limit for embed space
                const stockPrice = this.calculateStockPrice(company);
                const marketCap = stockPrice * company.shares_outstanding;
                totalMarketCap += marketCap;

                // Get recent trading volume
                const volume = await client.db.db.get(`
                    SELECT COUNT(*) as transactions, SUM(total_amount) as volume
                    FROM stock_transactions 
                    WHERE company_id = ? AND timestamp > datetime('now', '-1 day')
                `, [company.id]);

                tradingCompanies.push({
                    ...company,
                    stock_price: stockPrice,
                    market_cap: marketCap,
                    daily_volume: volume.volume || 0,
                    daily_transactions: volume.transactions || 0
                });

                embed.addFields({
                    name: `${company.ticker_symbol || company.name.substring(0, 4).toUpperCase()}`,
                    value: `**${company.name}**\\n$${stockPrice.toFixed(2)}/share\\nCap: $${this.formatNumber(marketCap)}\\nAvailable: ${company.shares_available.toLocaleString()}`,
                    inline: true
                });
            }

            // Add market summary
            embed.addFields({
                name: '📊 Market Summary',
                value: `**Total Market Cap:** $${this.formatNumber(totalMarketCap)}\\n**Companies Trading:** ${companies.length}\\n**Exchange Fee:** 4%`,
                inline: false
            });

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in stock market command:', error);
            await interaction.reply({
                content: '❌ There was an error retrieving market data.',
                ephemeral: true
            });
        }
    },

    async handlePortfolio(interaction, client) {
        try {
            const holdings = await client.db.db.all(`
                SELECT sh.*, c.name, c.ticker_symbol, c.current_valuation, c.shares_outstanding
                FROM stock_holdings sh
                JOIN companies c ON sh.company_id = c.id
                WHERE sh.user_id = ? AND c.status = 'active'
                ORDER BY sh.shares * (c.current_valuation / c.shares_outstanding) DESC
            `, [interaction.user.id]);

            if (holdings.length === 0) {
                await interaction.reply({
                    content: '📈 You don\'t own any stocks yet. Use `/stock buy` to start investing!',
                    ephemeral: true
                });
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle('💼 Your Stock Portfolio')
                .setColor(0x4169E1)
                .setDescription(`You own shares in ${holdings.length} company(ies)`)
                .setTimestamp()
                .setFooter({ text: 'Corporate Empire Stock Exchange' });

            let totalPortfolioValue = 0;
            let totalCostBasis = 0;

            for (const holding of holdings) {
                const currentPrice = this.calculateStockPrice(holding);
                const currentValue = currentPrice * holding.shares;
                const costBasis = holding.average_cost * holding.shares;
                const profitLoss = currentValue - costBasis;
                const profitLossPercent = ((profitLoss / costBasis) * 100);

                totalPortfolioValue += currentValue;
                totalCostBasis += costBasis;

                embed.addFields({
                    name: `${holding.name} (${holding.ticker_symbol || 'N/A'})`,
                    value: `**Shares:** ${holding.shares.toLocaleString()}\\n**Current:** $${currentPrice.toFixed(2)}\\n**Value:** $${currentValue.toLocaleString()}\\n**P&L:** ${profitLoss >= 0 ? '+' : ''}$${profitLoss.toLocaleString()} (${profitLoss >= 0 ? '+' : ''}${profitLossPercent.toFixed(1)}%)`,
                    inline: true
                });
            }

            const totalProfitLoss = totalPortfolioValue - totalCostBasis;
            const totalProfitLossPercent = ((totalProfitLoss / totalCostBasis) * 100);

            embed.addFields({
                name: '💰 Portfolio Summary',
                value: `**Total Value:** $${totalPortfolioValue.toLocaleString()}\\n**Cost Basis:** $${totalCostBasis.toLocaleString()}\\n**Total P&L:** ${totalProfitLoss >= 0 ? '+' : ''}$${totalProfitLoss.toLocaleString()} (${totalProfitLoss >= 0 ? '+' : ''}${totalProfitLossPercent.toFixed(1)}%)`,
                inline: false
            });

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in portfolio command:', error);
            await interaction.reply({
                content: '❌ There was an error retrieving your portfolio.',
                ephemeral: true
            });
        }
    },

    async handlePrice(interaction, client) {
        try {
            const companyQuery = interaction.options.getString('company');

            // Find the company
            const company = await client.db.db.get(`
                SELECT c.*, u.username as owner_username 
                FROM companies c
                JOIN users u ON c.owner_id = u.discord_id
                WHERE (LOWER(c.name) LIKE LOWER(?) OR LOWER(c.ticker_symbol) LIKE LOWER(?))
                AND c.status = 'active'
            `, [`%${companyQuery}%`, `%${companyQuery}%`]);

            if (!company) {
                await interaction.reply({
                    content: '❌ No active company found with that name or ticker symbol.',
                    ephemeral: true
                });
                return;
            }

            const stockPrice = this.calculateStockPrice(company);
            const marketCap = stockPrice * company.shares_outstanding;

            // Get recent trading activity
            const recentActivity = await client.db.db.all(`
                SELECT transaction_type, shares, price_per_share, timestamp
                FROM stock_transactions 
                WHERE company_id = ? 
                ORDER BY timestamp DESC 
                LIMIT 5
            `, [company.id]);

            const embed = new EmbedBuilder()
                .setTitle(`📊 ${company.name} Stock Information`)
                .setColor(0x0099FF)
                .addFields(
                    { name: 'Ticker Symbol', value: company.ticker_symbol || 'N/A', inline: true },
                    { name: 'Current Price', value: `$${stockPrice.toFixed(2)}`, inline: true },
                    { name: 'Market Cap', value: `$${this.formatNumber(marketCap)}`, inline: true },
                    { name: 'Shares Outstanding', value: company.shares_outstanding.toLocaleString(), inline: true },
                    { name: 'Shares Available', value: company.shares_available.toLocaleString(), inline: true },
                    { name: 'Company Valuation', value: `$${company.current_valuation.toLocaleString()}`, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'Corporate Empire Stock Exchange' });

            if (recentActivity.length > 0) {
                const activityText = recentActivity.map(tx => 
                    `${tx.transaction_type === 'buy' ? '🟢' : '🔴'} ${tx.shares} @ $${tx.price_per_share.toFixed(2)}`
                ).join('\\n');

                embed.addFields({
                    name: '📈 Recent Activity',
                    value: activityText,
                    inline: false
                });
            }

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in stock price command:', error);
            await interaction.reply({
                content: '❌ There was an error retrieving stock price.',
                ephemeral: true
            });
        }
    },

    // Helper method to calculate current stock price
    calculateStockPrice(company) {
        // Simple pricing model: valuation / outstanding shares
        // Add some volatility based on recent performance
        const basePrice = company.current_valuation / company.shares_outstanding;
        
        // Add small random fluctuation (±5%) to simulate market volatility
        const volatility = 0.95 + (Math.random() * 0.1); // 0.95 to 1.05
        
        return Math.max(0.01, basePrice * volatility);
    },

    // Helper method to format large numbers
    formatNumber(num) {
        if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
        return num.toLocaleString();
    }
};

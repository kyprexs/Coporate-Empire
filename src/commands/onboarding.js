const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('onboarding')
        .setDescription('Complete step-by-step tutorial for new players'),

    async execute(interaction, client) {
        await this.showOnboardingStep(interaction, 1);
    },

    async showOnboardingStep(interaction, step) {
        const steps = {
            1: {
                title: '🎮 Welcome to Corporate Empire!',
                color: 0x0099FF,
                description: 'You\'re about to enter a sophisticated business simulation where **every action matters** and **real money changes hands** between players.',
                fields: [
                    { 
                        name: '🎯 Your Mission', 
                        value: '• Build a corporate empire from the ground up\n• Compete against real players in a dynamic economy\n• Make strategic decisions that affect your wealth\n• Master the art of business management', 
                        inline: false 
                    },
                    { 
                        name: '💰 Starting Capital', 
                        value: 'You begin with **$100,000** in cash. This is your seed money to start your journey to becoming a business mogul.', 
                        inline: false 
                    },
                    { 
                        name: '⏰ Time System', 
                        value: '**1 real day = 1 game month**\nEvery 24 hours, the economy processes automatically:\n• Companies earn revenue\n• Employees get paid\n• Taxes are collected\n• Stock prices fluctuate', 
                        inline: false 
                    }
                ]
            },
            2: {
                title: '🏢 Step 1: Create Your Company',
                color: 0x4169E1,
                description: 'Your first step is creating a company. This is your primary vehicle for generating income.',
                fields: [
                    { 
                        name: '📝 Application Process', 
                        value: '1. Use `/company create` to start your application\n2. Choose your industry and provide details\n3. Request starting capital (usually $50k-$200k)\n4. Wait for admin approval (typically within 24 hours)', 
                        inline: false 
                    },
                    { 
                        name: '🎯 Industry Selection', 
                        value: 'Choose wisely! Your industry affects:\n• Available specializations\n• Market vulnerability\n• Partnership opportunities\n• Regulatory requirements', 
                        inline: false 
                    },
                    { 
                        name: '💡 Pro Tips', 
                        value: '• Write a compelling business plan\n• Request reasonable capital (don\'t be greedy)\n• Choose an industry you understand\n• Pick a memorable company name', 
                        inline: false 
                    }
                ]
            },
            3: {
                title: '👥 Step 2: Build Your Workforce',
                color: 0xFF6B35,
                description: 'Employees are your revenue engine. Choose between NPC workers and real players.',
                fields: [
                    { 
                        name: '🤖 NPC Employees', 
                        value: '• **Productivity:** 1.0x multiplier\n• **Cost:** You set the salary\n• **Revenue:** Salary × 1.0 = monthly income\n• **Best for:** Stable, predictable workforce', 
                        inline: true 
                    },
                    { 
                        name: '🧑‍💼 Player Employees', 
                        value: '• **Productivity:** 2.5x multiplier\n• **Cost:** Higher salaries (paid to real users)\n• **Revenue:** Salary × 2.5 = monthly income\n• **Best for:** Maximum growth potential', 
                        inline: true 
                    },
                    { 
                        name: '📊 Example Calculation', 
                        value: 'NPC at $5,000/month = $5,000 revenue\nPlayer at $5,000/month = $12,500 revenue\n**Net gain with player:** +$7,500/month', 
                        inline: false 
                    },
                    { 
                        name: '🎯 Hiring Strategy', 
                        value: '• Start with NPCs for steady income\n• Recruit players for growth phases\n• Balance salary costs with productivity gains\n• Use `/employees hire` to add workers', 
                        inline: false 
                    }
                ]
            },
            4: {
                title: '📋 Step 3: File Your First Patent',
                color: 0x9370DB,
                description: 'Patents provide steady passive income for 20 years once approved.',
                fields: [
                    { 
                        name: '📝 Patent Process', 
                        value: '1. Use `/patent submit` to file your application\n2. Choose patent type (Utility, Design, Software)\n3. Write clear title and description\n4. Wait for admin review and approval\n5. Start earning monthly royalties!', 
                        inline: false 
                    },
                    { 
                        name: '💰 Revenue Potential', 
                        value: '• Typical patent: **$5,000/month**\n• High-value patents: **$10,000+/month**\n• Duration: **20 years** from approval\n• Total potential: **$1.2M+ per patent**', 
                        inline: false 
                    },
                    { 
                        name: '🎯 Patent Strategy', 
                        value: '• File patents early and often\n• Build a diverse IP portfolio\n• Focus on your company\'s industry\n• Quality descriptions get better revenue', 
                        inline: false 
                    }
                ]
            },
            5: {
                title: '📈 Step 4: Enter the Stock Market',
                color: 0x32CD32,
                description: 'Grow your wealth by investing in other companies and trading stocks.',
                fields: [
                    { 
                        name: '📊 Stock Mechanics', 
                        value: '• **Price = Company Valuation ÷ Shares Outstanding**\n• Prices update after monthly cycles\n• ±5% random market volatility\n• 4% exchange fee on all trades', 
                        inline: false 
                    },
                    { 
                        name: '💼 Investment Commands', 
                        value: '`/stock market` - View all available stocks\n`/stock buy` - Purchase shares\n`/stock sell` - Sell holdings\n`/stock portfolio` - Your investments\n`/stock price` - Check specific company', 
                        inline: false 
                    },
                    { 
                        name: '🎯 Investment Strategy', 
                        value: '• Research company fundamentals\n• Look for growing companies with good management\n• Diversify across industries\n• Buy low, sell high (classic!)\n• Monitor monthly performance reports', 
                        inline: false 
                    }
                ]
            },
            6: {
                title: '🏦 Step 5: Secure Financing',
                color: 0x228B22,
                description: 'Use the Central Bank loan system to access additional capital for expansion.',
                fields: [
                    { 
                        name: '📊 Credit Scoring', 
                        value: 'Your creditworthiness determines interest rates:\n• **750+ Credit:** 5% interest\n• **700-749:** 8% interest\n• **650-699:** 12% interest\n• **Below 650:** 15-25% interest', 
                        inline: false 
                    },
                    { 
                        name: '💰 Loan Commands', 
                        value: '`/loan request` - Apply for financing\n`/loan status` - View active loans\n`/loan repay` - Make early payments\nMax 3 active loans per company', 
                        inline: false 
                    },
                    { 
                        name: '🎯 Credit Building', 
                        value: '• Maintain positive monthly income\n• Grow company valuation consistently\n• Make loan payments on time\n• Build longer company history', 
                        inline: false 
                    }
                ]
            },
            7: {
                title: '⚡ Step 6: Industry Specialization',
                color: 0xFF4500,
                description: 'Specialize your company in a specific industry for competitive advantages.',
                fields: [
                    { 
                        name: '🎯 Available Industries', 
                        value: '• **Technology** - Innovation focus\n• **Finance** - Market expertise\n• **Healthcare** - Stability premium\n• **Energy** - Resource advantages\n• **Manufacturing** - Efficiency gains\n• **And 5 more industries!**', 
                        inline: false 
                    },
                    { 
                        name: '📈 Specialization Benefits', 
                        value: '• **Revenue Multiplier:** Up to 1.5x income boost\n• **Efficiency Bonus:** Lower operational costs\n• **Valuation Premium:** Higher company worth\n• **Market Recognition:** Industry leadership', 
                        inline: false 
                    },
                    { 
                        name: '💼 Specialization Commands', 
                        value: '`/industry specialize` - Choose your specialty\n`/industry upgrade` - Improve specialization level\n`/industry info` - View industry details\n`/industry market` - See industry trends', 
                        inline: false 
                    },
                    { 
                        name: '🎯 Strategy', 
                        value: '• Specialize early for maximum benefit\n• Upgrade specialization as you grow\n• Monitor industry market events\n• Budget for monthly maintenance costs', 
                        inline: false 
                    }
                ]
            },
            8: {
                title: '🎯 Step 7: Advanced Strategies',
                color: 0x8B4513,
                description: 'Master advanced gameplay mechanics to dominate the market.',
                fields: [
                    { 
                        name: '📊 Performance Monitoring', 
                        value: '• Use `/company performance` for detailed metrics\n• Track revenue trends and efficiency\n• Monitor competitor performance\n• Analyze market share data', 
                        inline: false 
                    },
                    { 
                        name: '🤝 Business Relationships', 
                        value: '• Form partnerships with other companies\n• Create supplier/customer contracts\n• Build strategic alliances\n• Use `/contract create` for formal agreements', 
                        inline: false 
                    },
                    { 
                        name: '🔬 Research & Development', 
                        value: '• Invest in R&D projects with `/research start`\n• Develop new technologies\n• Create intellectual property\n• Stay ahead of competitors', 
                        inline: false 
                    },
                    { 
                        name: '⚖️ Legal System', 
                        value: '• Protect your interests with lawsuits\n• Use `/lawsuit file` against bad actors\n• Settle disputes professionally\n• Build reputation through fair dealing', 
                        inline: false 
                    }
                ]
            },
            9: {
                title: '🏆 You\'re Ready to Play!',
                color: 0xFFD700,
                description: 'You now understand the core mechanics of Corporate Empire. Time to build your business empire!',
                fields: [
                    { 
                        name: '🎯 Quick Start Checklist', 
                        value: '✅ Create your first company\n✅ Hire initial employees\n✅ Submit your first patent\n✅ Make your first stock investment\n✅ Monitor monthly performance\n✅ Plan your industry specialization', 
                        inline: false 
                    },
                    { 
                        name: '📚 Additional Resources', 
                        value: '• Use `/help` for detailed command guides\n• Use `/dashboard` to monitor your empire\n• Join community discussions about strategy\n• Ask experienced players for advice', 
                        inline: false 
                    },
                    { 
                        name: '🚀 Success Tips', 
                        value: '• **Start small** and grow systematically\n• **Think long-term** - compound growth is powerful\n• **Learn from failures** - every mistake teaches\n• **Network actively** - relationships drive success\n• **Stay informed** - market conditions change', 
                        inline: false 
                    },
                    { 
                        name: '🎮 Most Important Advice', 
                        value: '**Have fun and play fair!** Corporate Empire rewards strategic thinking, ethical business practices, and collaborative gameplay. Your reputation matters more than quick profits.', 
                        inline: false 
                    }
                ]
            }
        };

        const stepData = steps[step];
        if (!stepData) {
            await interaction.reply({
                content: '❌ Invalid onboarding step.',
                ephemeral: true
            });
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle(stepData.title)
            .setColor(stepData.color)
            .setDescription(stepData.description)
            .addFields(stepData.fields)
            .setTimestamp()
            .setFooter({ text: `Onboarding Step ${step} of 9 | Corporate Empire Tutorial` });

        // Create navigation buttons
        const buttons = new ActionRowBuilder();
        
        if (step > 1) {
            buttons.addComponents(
                new ButtonBuilder()
                    .setCustomId(`onboarding_${step - 1}`)
                    .setLabel('← Previous')
                    .setStyle(ButtonStyle.Secondary)
            );
        }

        if (step < 9) {
            buttons.addComponents(
                new ButtonBuilder()
                    .setCustomId(`onboarding_${step + 1}`)
                    .setLabel('Next →')
                    .setStyle(ButtonStyle.Primary)
            );
        }

        buttons.addComponents(
            new ButtonBuilder()
                .setCustomId('onboarding_exit')
                .setLabel('Exit Tutorial')
                .setStyle(ButtonStyle.Danger)
        );

        const components = buttons.components.length > 0 ? [buttons] : [];

        if (interaction.replied || interaction.deferred) {
            await interaction.editReply({ embeds: [embed], components });
        } else {
            await interaction.reply({ embeds: [embed], components });
        }
    }
};

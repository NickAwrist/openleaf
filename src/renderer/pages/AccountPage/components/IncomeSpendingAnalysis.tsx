import React, { useMemo, useState } from "react";
import { PlaidTransaction, PlaidAccount } from "src/types/plaidTypes";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface IncomeSpendingAnalysisProps {
    transactions: PlaidTransaction[];
    currencyCode: string;
    account: PlaidAccount;
}

interface MonthlyData {
    month: string;
    income: number;
    spending: number;
    net: number;
    transactionCount: number;
}

type TimeFrame = '1M' | '3M' | '6M' | 'YTD' | 'ALL';

const IncomeSpendingAnalysis: React.FC<IncomeSpendingAnalysisProps> = ({ 
    transactions, 
    currencyCode,
    account
}) => {
    const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrame>('6M');

    const timeFrameOptions = [
        { value: '1M' as TimeFrame, label: '1 Month' },
        { value: '3M' as TimeFrame, label: '3 Months' },
        { value: '6M' as TimeFrame, label: '6 Months' },
        { value: 'YTD' as TimeFrame, label: 'YTD' },
        { value: 'ALL' as TimeFrame, label: 'All Time' }
    ];

    const getFilteredTransactions = useMemo(() => {
        const now = new Date();
        const currentYear = now.getFullYear();
        
        let cutoffDate: Date;
        
        switch (selectedTimeFrame) {
            case '1M':
                cutoffDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                break;
            case '3M':
                cutoffDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
                break;
            case '6M':
                cutoffDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
                break;
            case 'YTD':
                cutoffDate = new Date(currentYear, 0, 1); // January 1st of current year
                break;
            case 'ALL':
            default:
                return transactions;
        }
        
        return transactions.filter(transaction => {
            const transactionDate = new Date(transaction.date);
            return transactionDate >= cutoffDate;
        });
    }, [transactions, selectedTimeFrame]);

    const monthlyData = useMemo(() => {
        const monthlyMap = new Map<string, MonthlyData>();
        
        getFilteredTransactions.forEach(transaction => {
            const date = new Date(transaction.date);
            const year = date.getFullYear();
            const month = date.getMonth() + 1; // 1-12
            const monthKey = `${year}-${String(month).padStart(2, '0')}`;
            const monthName = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
            
            if (!monthlyMap.has(monthKey)) {
                monthlyMap.set(monthKey, {
                    month: monthName,
                    income: 0,
                    spending: 0,
                    net: 0,
                    transactionCount: 0
                });
            }
            
            const monthData = monthlyMap.get(monthKey)!;
            monthData.transactionCount++;
            
            // Handle different account types
            const isCreditAccount = account.type === 'credit';
            
            if (isCreditAccount) {
                // For credit cards:
                // - Negative amounts are payments TO the card (reduce debt) = income/positive cash flow
                // - Positive amounts are purchases (increase debt) = spending/negative cash flow
                if (transaction.amount < 0) {
                    monthData.income += Math.abs(transaction.amount);
                } else {
                    monthData.spending += transaction.amount;
                }
            } else {
                // For bank accounts (checking, savings, etc.):
                // - Positive amounts are debits (money going out) = spending
                // - Negative amounts are credits (money coming in) = income
                if (transaction.amount > 0) {
                    monthData.spending += transaction.amount;
                } else {
                    monthData.income += Math.abs(transaction.amount);
                }
            }
        });
        
        // Calculate net for each month
        monthlyMap.forEach(data => {
            data.net = data.income - data.spending;
        });
        
        // Sort by month key (newest first) - using the YYYY-MM format for proper sorting
        return Array.from(monthlyMap.entries())
            .sort((a, b) => b[0].localeCompare(a[0])) 
            .map(([key, data]) => data); 
    }, [getFilteredTransactions, account.type]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currencyCode || 'USD',
        }).format(amount);
    };

    const totalIncome = monthlyData.reduce((sum, data) => sum + data.income, 0);
    const totalSpending = monthlyData.reduce((sum, data) => sum + data.spending, 0);
    const totalNet = totalIncome - totalSpending;

    // Data for pie chart
    const pieData = [
        { name: 'Income', value: totalIncome, color: '#10b981' },
        { name: 'Spending', value: totalSpending, color: '#ef4444' }
    ];

    // Data for bar chart (reverse order for chart display - oldest to newest)
    const chartData = [...monthlyData].reverse();

    return (
        <div className="space-y-6">
            {/* Time Frame Filter */}
            <div className="card bg-base-100 shadow-sm border border-base-200">
                <div className="card-body">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="card-title text-base">Time Range</h3>
                        <div className="badge badge-outline">
                            {getFilteredTransactions.length} transactions
                        </div>
                    </div>
                    
                    <div className="join w-full">
                        {timeFrameOptions.map((option) => (
                            <input
                                key={option.value}
                                className="join-item btn btn-sm"
                                type="radio"
                                name="timeframe"
                                aria-label={option.label}
                                checked={selectedTimeFrame === option.value}
                                onChange={() => setSelectedTimeFrame(option.value)}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Monthly Table */}
            <div className="card bg-base-100 shadow-sm border border-base-200">
                <div className="card-body">
                    <h3 className="card-title text-base mb-4">Monthly Breakdown</h3>
                    <div className="overflow-x-auto">
                        <table className="table table-sm">
                            <thead>
                                <tr>
                                    <th>Month</th>
                                    <th className="text-right">Income</th>
                                    <th className="text-right">Spending</th>
                                    <th className="text-right">Net</th>
                                    <th className="text-right">Transactions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {monthlyData.map((data, index) => (
                                    <tr key={index} className="hover">
                                        <td className="font-medium">{data.month}</td>
                                        <td className="text-right text-success">
                                            {formatCurrency(data.income)}
                                        </td>
                                        <td className="text-right text-error">
                                            {formatCurrency(data.spending)}
                                        </td>
                                        <td className={`text-right font-medium ${data.net >= 0 ? 'text-success' : 'text-error'}`}>
                                            {formatCurrency(data.net)}
                                        </td>
                                        <td className="text-right text-base-content/70">
                                            {data.transactionCount}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {monthlyData.length === 0 && (
                        <div className="text-center py-8 text-base-content/70">
                            No transaction data available for the selected time range
                        </div>
                    )}
                </div>
            </div>

            {/* Charts */}
            <div className="space-y-6">
                {/* Bar Chart */}
                <div className="card bg-base-100 shadow-sm border border-base-200">
                    <div className="card-body">
                        <h3 className="card-title text-base">Monthly Trends</h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis 
                                        dataKey="month" 
                                        fontSize={12}
                                        angle={-45}
                                        textAnchor="end"
                                        height={60}
                                    />
                                    <YAxis fontSize={12} />
                                    <Tooltip 
                                        formatter={(value: number) => formatCurrency(value)}
                                        labelStyle={{ color: 'hsl(var(--bc))' }}
                                        contentStyle={{ 
                                            backgroundColor: 'grey', 
                                            border: '1px solid var(--border-base-200)',
                                            borderRadius: '8px',
                                        }}
                                        cursor={{fill: 'transparent'}}
                                    />
                                    <Legend />
                                    <Bar 
                                        dataKey="income" 
                                        fill="#10b981" 
                                        name="Income"
                                        activeBar={{ fill: '#10b981', stroke: '#059669', strokeWidth: 2 }}
                                    />
                                    <Bar 
                                        dataKey="spending" 
                                        fill="#ef4444" 
                                        name="Spending"
                                        activeBar={{ fill: '#ef4444', stroke: '#dc2626', strokeWidth: 2 }}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Pie Chart */}
                <div className="card bg-base-100 shadow-sm border border-base-200">
                    <div className="card-body">
                        <h3 className="card-title text-base">Income vs Spending</h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={120}
                                        dataKey="value"
                                        label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                                        labelLine={false}
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IncomeSpendingAnalysis; 
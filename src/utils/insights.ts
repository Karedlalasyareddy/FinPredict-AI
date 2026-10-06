/**
 * Financial Insights Generator
 * Generates educational, realistic budget guidance derived strictly from user's data.
 */

import { FinancialInsight, Transaction } from '../types';
import { aggregateMonthlyData } from './mlEngine';
import { formatINR } from './format';

export function generateInsights(transactions: Transaction[]): FinancialInsight[] {
  const insights: FinancialInsight[] = [];
  const monthly = aggregateMonthlyData(transactions);

  if (!transactions || transactions.length === 0) {
    return [
      {
        id: 'no-data',
        type: 'info',
        title: 'Start Your Personal Finance Journal',
        message: 'Add your salary/income and recurring expenses to unlock automated budget health analysis and machine learning trends.',
      },
    ];
  }

  // 1. Month-over-Month Expense Changes
  if (monthly.length >= 2) {
    const latest = monthly[monthly.length - 1];
    const prev = monthly[monthly.length - 2];
    const change = latest.expense - prev.expense;
    const pctChange = prev.expense > 0 ? (change / prev.expense) * 100 : 0;

    if (pctChange > 5) {
      insights.push({
        id: 'mom-increase',
        type: 'warning',
        title: 'Monthly Spending Surge',
        message: `Your spending in ${latest.monthLabel} increased by ${pctChange.toFixed(1)}% compared to ${prev.monthLabel} (${formatINR(latest.expense)} vs ${formatINR(prev.expense)}). Review recent lifestyle or impulse purchases.`,
      });
    } else if (pctChange < -5) {
      insights.push({
        id: 'mom-decrease',
        type: 'success',
        title: 'Improved Spending Thrift',
        message: `Outstanding! In ${latest.monthLabel}, you reduced expenses by ${Math.abs(pctChange).toFixed(1)}% compared to ${prev.monthLabel}. Keep sustaining this positive buffer.`,
      });
    } else {
      insights.push({
        id: 'mom-stable',
        type: 'info',
        title: 'Consistent Spending Rhythm',
        message: `Your expenditure in ${latest.monthLabel} (${formatINR(latest.expense)}) was steady with ${prev.monthLabel}. Consistent baseline expenses make future forecasting reliable.`,
      });
    }
  }

  // 2. Category Concentration Analysis
  const expenseTxns = transactions.filter(t => t.type === 'Expense');
  if (expenseTxns.length > 0) {
    const catMap = new Map<string, number>();
    let totalExpense = 0;

    for (const t of expenseTxns) {
      catMap.set(t.category, (catMap.get(t.category) || 0) + t.amount);
      totalExpense += t.amount;
    }

    const sortedCats = Array.from(catMap.entries()).sort((a, b) => b[1] - a[1]);
    if (sortedCats.length > 0) {
      const [topCat, topAmt] = sortedCats[0];
      const share = totalExpense > 0 ? (topAmt / totalExpense) * 100 : 0;

      if (share >= 35) {
        insights.push({
          id: 'cat-dominant',
          type: 'alert',
          title: `Heavy Outflow in ${topCat}`,
          message: `${topCat} makes up ${share.toFixed(1)}% of your total expenditure (${formatINR(topAmt)}). Look for potential subscription audits or cost optimizations in this area.`,
        });
      } else {
        insights.push({
          id: 'cat-balanced',
          type: 'info',
          title: 'Diversified Expense Allocation',
          message: `Your highest expense category is ${topCat} at ${share.toFixed(1)}%, indicating a healthy distribution across life necessities and leisure.`,
        });
      }
    }
  }

  // 3. Savings Rate & Cash Flow Health
  let totalIncome = 0;
  let totalExpenses = 0;
  for (const t of transactions) {
    if (t.type === 'Income') totalIncome += t.amount;
    else totalExpenses += t.amount;
  }

  const netBalance = totalIncome - totalExpenses;
  if (totalIncome > 0) {
    const savingsRate = (netBalance / totalIncome) * 100;

    if (savingsRate < 0) {
      insights.push({
        id: 'deficit-alert',
        type: 'alert',
        title: 'Expenditure Exceeds Inflow',
        message: `Total recorded expenses exceed total income by ${formatINR(Math.abs(netBalance))}. Strive to cap non-essential outflows until your cash reserves recover.`,
      });
    } else if (savingsRate < 15) {
      insights.push({
        id: 'low-savings',
        type: 'warning',
        title: 'Moderate Emergency Cushion',
        message: `Your current net savings rate is ${savingsRate.toFixed(1)}%. Financial planners in India commonly recommend targeting an emergency reserve equal to 3 to 6 months of living expenses.`,
      });
    } else {
      insights.push({
        id: 'healthy-savings',
        type: 'success',
        title: 'Strong Financial Buffer',
        message: `You are saving ${savingsRate.toFixed(1)}% of all income! Maintaining this discipline will steadily compound your emergency and long-term security.`,
      });
    }
  }

  return insights;
}

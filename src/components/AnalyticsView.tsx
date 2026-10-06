/**
 * Personal Finance Analytics View
 * Renders monthly cash flows, savings curve, category distribution,
 * month-to-month delta indicators, and educational insights.
 */

import React, { useState } from 'react';
import { Transaction } from '../types';
import { aggregateMonthlyData } from '../utils/mlEngine';
import { formatINR } from '../utils/format';
import { generateInsights } from '../utils/insights';
import { TrendingUp, TrendingDown, Info, AlertCircle, CheckCircle, BarChart3 } from 'lucide-react';

interface AnalyticsViewProps {
  transactions: Transaction[];
  onOpenAddModal: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ transactions, onOpenAddModal }) => {
  const monthly = aggregateMonthlyData(transactions);
  const insights = generateInsights(transactions);

  // Compute key metrics
  let totalIncome = 0;
  let totalExpenses = 0;
  const categoryTotals = new Map<string, number>();

  for (const t of transactions) {
    if (t.type === 'Income') totalIncome += t.amount;
    else {
      totalExpenses += t.amount;
      categoryTotals.set(t.category, (categoryTotals.get(t.category) || 0) + t.amount);
    }
  }

  const monthsCount = Math.max(1, monthly.length);
  const avgMonthlyIncome = totalIncome / monthsCount;
  const avgMonthlyExpense = totalExpenses / monthsCount;
  const cumulativeSavings = Math.max(0, totalIncome - totalExpenses);
  const overallSavingsRate = totalIncome > 0 ? (cumulativeSavings / totalIncome) * 100 : 0;

  // Highest spending category
  const sortedCategories = Array.from(categoryTotals.entries())
    .map(([cat, amt]) => ({
      category: cat,
      amount: amt,
      percentage: totalExpenses > 0 ? (amt / totalExpenses) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const highestCat = sortedCategories.length > 0 ? sortedCategories[0] : null;

  // Month-over-month change
  let momDeltaPct: number | null = null;
  if (monthly.length >= 2) {
    const curr = monthly[monthly.length - 1].expense;
    const prev = monthly[monthly.length - 2].expense;
    if (prev > 0) {
      momDeltaPct = ((curr - prev) / prev) * 100;
    }
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 text-center max-w-lg mx-auto my-12">
        <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">
          No financial data available yet.
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          Add your income and expenses to start your analysis. Trends and visual analytics will appear once transactions are recorded.
        </p>
        <button
          onClick={onOpenAddModal}
          className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
        >
          Add First Transaction
        </button>
      </div>
    );
  }

  // Find max value for chart scaling
  const maxCashFlow = Math.max(1, ...monthly.map(m => Math.max(m.income, m.expense)));

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Personal Finance Analytics
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Empirical evaluation of your cash flow trends, savings velocity, and spending distribution
        </p>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Avg Monthly Income */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">
            Avg. Monthly Income
          </div>
          <div className="text-xl font-bold font-mono-num text-slate-900">
            {formatINR(avgMonthlyIncome)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Across {monthly.length} recorded month(s)
          </div>
        </div>

        {/* Avg Monthly Expense */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">
            Avg. Monthly Expense
          </div>
          <div className="text-xl font-bold font-mono-num text-slate-900">
            {formatINR(avgMonthlyExpense)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Monthly burn baseline
          </div>
        </div>

        {/* Overall Savings Rate */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">
            Net Savings Rate
          </div>
          <div className="text-xl font-bold font-mono-num text-emerald-600">
            {overallSavingsRate.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {formatINR(cumulativeSavings)} net retained
          </div>
        </div>

        {/* Top Spending Category */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">
            Top Outflow Category
          </div>
          <div className="text-xl font-bold text-slate-900 truncate">
            {highestCat ? highestCat.category : 'None'}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-mono-num">
            {highestCat ? `${highestCat.percentage.toFixed(1)}% of all expenses` : 'No expenses logged'}
          </div>
        </div>
      </div>

      {/* SVG Interactive Chart 1: Monthly Cash Flow Bar Comparison */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Monthly Cash Flow Comparison</h2>
            <p className="text-xs text-slate-500">Side-by-side comparison of Income vs Expenses by month (₹ INR)</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-emerald-600 inline-block" />
              <span>Income</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-rose-500 inline-block" />
              <span>Expense</span>
            </span>
          </div>
        </div>

        {/* Bar chart container */}
        <div className="h-64 flex items-end gap-4 sm:gap-8 pt-6 pb-2 border-b border-slate-200 overflow-x-auto">
          {monthly.map(m => {
            const incHeight = (m.income / maxCashFlow) * 100;
            const expHeight = (m.expense / maxCashFlow) * 100;
            return (
              <div key={m.yearMonth} className="flex-1 min-w-[70px] flex flex-col items-center h-full justify-end group">
                <div className="w-full flex items-end justify-center gap-1.5 h-full relative">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-12 bg-slate-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
                    Income: {formatINR(m.income)}<br />
                    Expense: {formatINR(m.expense)}
                  </div>

                  {/* Income bar */}
                  <div
                    className="w-1/2 max-w-[28px] bg-emerald-600 rounded-t-sm transition-all duration-300 group-hover:bg-emerald-500"
                    style={{ height: `${Math.max(4, incHeight)}%` }}
                    title={`Income: ${formatINR(m.income)}`}
                  />
                  {/* Expense bar */}
                  <div
                    className="w-1/2 max-w-[28px] bg-rose-500 rounded-t-sm transition-all duration-300 group-hover:bg-rose-400"
                    style={{ height: `${Math.max(4, expHeight)}%` }}
                    title={`Expense: ${formatINR(m.expense)}`}
                  />
                </div>
                <span className="text-[11px] font-medium text-slate-600 mt-2 whitespace-nowrap">
                  {m.monthLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Row: Savings Trend Curve & Category Horizontal Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Savings Trend */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900">Net Monthly Savings Curve</h2>
            <p className="text-xs text-slate-500">Savings trend across observed billing periods</p>
          </div>

          <div className="h-48 flex items-end gap-3 pt-4 pb-2 border-b border-slate-200">
            {monthly.map((m, idx) => {
              const maxSavingsScale = Math.max(1, ...monthly.map(item => Math.abs(item.savings)));
              const heightPct = (Math.abs(m.savings) / maxSavingsScale) * 90;
              const isPositive = m.savings >= 0;

              return (
                <div key={m.yearMonth} className="flex-1 flex flex-col items-center justify-end h-full">
                  <div
                    className={`w-full max-w-[32px] rounded-t-sm ${
                      isPositive ? 'bg-indigo-600' : 'bg-rose-500'
                    }`}
                    style={{ height: `${Math.max(6, heightPct)}%` }}
                    title={`${m.monthLabel}: ${formatINR(m.savings)}`}
                  />
                  <span className="text-[10px] font-mono-num text-slate-600 mt-2 truncate w-full text-center">
                    {m.monthLabel}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 text-xs text-slate-500 flex justify-between">
            <span>Cumulative Recorded Savings:</span>
            <span className="font-bold font-mono-num text-slate-900">{formatINR(cumulativeSavings)}</span>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900">Category-Wise Spend Distribution</h2>
            <p className="text-xs text-slate-500">Top allocation areas ranked by cumulative expenditure</p>
          </div>

          {sortedCategories.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">No expenses recorded.</p>
          ) : (
            <div className="space-y-3">
              {sortedCategories.slice(0, 5).map(cat => (
                <div key={cat.category} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-800">{cat.category}</span>
                    <span className="font-mono-num text-slate-600">
                      {formatINR(cat.amount)} ({cat.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-900 rounded-full"
                      style={{ width: `${Math.min(100, Math.max(4, cat.percentage))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Monthly Summary Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-sm font-bold text-slate-900">Monthly Aggregates Data Table</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-2.5 px-4">Period</th>
                <th className="py-2.5 px-4 text-right">Income (₹)</th>
                <th className="py-2.5 px-4 text-right">Expenses (₹)</th>
                <th className="py-2.5 px-4 text-right">Net Savings (₹)</th>
                <th className="py-2.5 px-4 text-right">Savings Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monthly.map(m => (
                <tr key={m.yearMonth} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-semibold text-slate-800">{m.monthLabel}</td>
                  <td className="py-3 px-4 font-mono-num text-right text-emerald-700">
                    {formatINR(m.income)}
                  </td>
                  <td className="py-3 px-4 font-mono-num text-right text-rose-600">
                    {formatINR(m.expense)}
                  </td>
                  <td className="py-3 px-4 font-mono-num text-right font-semibold text-slate-900">
                    {formatINR(m.savings)}
                  </td>
                  <td className="py-3 px-4 font-mono-num text-right text-slate-600">
                    {m.savingsRate.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Financial Health Insights Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 mb-1">Financial Health Observations</h2>
        <p className="text-xs text-slate-500 mb-4">
          Automated rule-based insights grounded in your actual inflow and outflow data
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {insights.map(item => (
            <div
              key={item.id}
              className={`p-4 rounded-lg border text-xs ${
                item.type === 'alert'
                  ? 'bg-rose-50/50 border-rose-200 text-rose-900'
                  : item.type === 'warning'
                  ? 'bg-amber-50/50 border-amber-200 text-amber-900'
                  : item.type === 'success'
                  ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <div className="font-semibold mb-1 flex items-center gap-1.5">
                {item.type === 'alert' && <AlertCircle className="w-3.5 h-3.5 text-rose-600" />}
                {item.type === 'warning' && <AlertCircle className="w-3.5 h-3.5 text-amber-600" />}
                {item.type === 'success' && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                {item.type === 'info' && <Info className="w-3.5 h-3.5 text-slate-600" />}
                <span>{item.title}</span>
              </div>
              <p className="leading-relaxed opacity-90">{item.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

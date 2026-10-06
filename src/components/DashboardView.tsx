/**
 * Personal Dashboard View
 * Renders real-time financial metrics, recent transactions, category breakdown,
 * and latest AI forecast summary.
 */

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Transaction, PredictionRecord } from '../types';
import { formatINR, formatDateIN } from '../utils/format';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Wallet, PieChart as PieIcon, Sparkles, PlusCircle } from 'lucide-react';

interface DashboardViewProps {
  transactions: Transaction[];
  latestPrediction: PredictionRecord | null;
  onNavigate: (tab: string) => void;
  onOpenAddModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  transactions,
  latestPrediction,
  onNavigate,
  onOpenAddModal,
}) => {
  const { user } = useAuth();

  // Financial aggregates calculated from user's transactions only
  let totalIncome = 0;
  let totalExpenses = 0;
  const expenseByCategory = new Map<string, number>();

  for (const t of transactions) {
    if (t.type === 'Income') {
      totalIncome += t.amount;
    } else {
      totalExpenses += t.amount;
      expenseByCategory.set(t.category, (expenseByCategory.get(t.category) || 0) + t.amount);
    }
  }

  const balance = totalIncome - totalExpenses;
  const savings = Math.max(0, balance);
  const savingsPercentage = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

  // Latest month activity
  const now = new Date();
  const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  // Find current or most recent month in transactions
  const months = Array.from(new Set(transactions.map(t => t.date.substring(0, 7)))).sort();
  const activeYM = months.includes(currentYM) ? currentYM : months[months.length - 1];

  let monthlyIncome = 0;
  let monthlyExpenses = 0;
  if (activeYM) {
    const monthTxns = transactions.filter(t => t.date.startsWith(activeYM));
    for (const t of monthTxns) {
      if (t.type === 'Income') monthlyIncome += t.amount;
      else monthlyExpenses += t.amount;
    }
  }

  const recentTransactions = transactions.slice(0, 7);

  // Sorted category breakdown
  const categoryList = Array.from(expenseByCategory.entries())
    .map(([cat, amt]) => ({
      category: cat,
      amount: amt,
      percentage: totalExpenses > 0 ? (amt / totalExpenses) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome, {user?.name}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {user?.email} <span aria-hidden="true">·</span> Personal Financial Dashboard <span aria-hidden="true">·</span> All figures in ₹ INR
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Mandatory Empty State Handling */}
      {transactions.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center max-w-xl mx-auto my-8">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">
            No financial data available yet.
          </h2>
          <p className="text-sm text-slate-600 mb-6">
            Add your income and expenses to start your analysis. You can also import past statements from your profile.
          </p>
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Record Your First Transaction</span>
          </button>
        </div>
      ) : (
        <>
          {/* Top KPI Cards: All-Time Totals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Income */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
                <span>TOTAL INCOME</span>
                <span className="p-1 rounded bg-emerald-50 text-emerald-600">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-2xl font-bold font-mono-num text-slate-900">
                {formatINR(totalIncome)}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                From all recorded inflows
              </div>
            </div>

            {/* Total Expenses */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
                <span>TOTAL EXPENSES</span>
                <span className="p-1 rounded bg-rose-50 text-rose-600">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-2xl font-bold font-mono-num text-slate-900">
                {formatINR(totalExpenses)}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Across {categoryList.length} categories
              </div>
            </div>

            {/* Current Balance */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
                <span>CURRENT BALANCE</span>
                <span className="p-1 rounded bg-blue-50 text-blue-600">
                  <Wallet className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className={`text-2xl font-bold font-mono-num ${balance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                {formatINR(balance)}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {balance >= 0 ? 'Net positive liquidity' : 'Deficit across entries'}
              </div>
            </div>

            {/* Savings Rate */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
                <span>SAVINGS RATE</span>
                <span className="p-1 rounded bg-indigo-50 text-indigo-600">
                  <TrendingUp className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-2xl font-bold font-mono-num text-slate-900">
                {savingsPercentage.toFixed(1)}%
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {formatINR(savings)} cumulative savings
              </div>
            </div>
          </div>

          {/* Monthly Pulse Row */}
          <div className="bg-slate-900 text-white rounded-xl p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-300">
                  Monthly Financial Pulse ({activeYM ? formatMonthYear(activeYM) : 'Recent'})
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time cash flow overview for this active billing period
                </p>
              </div>
              <button
                onClick={() => onNavigate('analytics')}
                className="text-xs font-medium text-emerald-400 hover:text-emerald-300 underline underline-offset-4"
              >
                View detailed trends →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800">
              <div>
                <span className="text-xs text-slate-400 block mb-1">Monthly Income</span>
                <span className="text-xl font-bold font-mono-num text-emerald-400">
                  {formatINR(monthlyIncome)}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-1">Monthly Expenses</span>
                <span className="text-xl font-bold font-mono-num text-rose-400">
                  {formatINR(monthlyExpenses)}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-1">Monthly Net Savings</span>
                <span className="text-xl font-bold font-mono-num text-white">
                  {formatINR(monthlyIncome - monthlyExpenses)}
                </span>
              </div>
            </div>
          </div>

          {/* Secondary Layout: Category Breakdown & AI Prediction Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Category Breakdown (2 columns on large screen) */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Expense Category Breakdown</h2>
                  <p className="text-xs text-slate-500">Distribution of your real spending</p>
                </div>
                <button
                  onClick={() => onNavigate('analytics')}
                  className="text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  All Analytics
                </button>
              </div>

              {categoryList.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">No expense transactions recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {categoryList.slice(0, 6).map(item => (
                    <div key={item.category} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-800">{item.category}</span>
                        <span className="font-mono-num text-slate-600">
                          {formatINR(item.amount)} ({item.percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(3, item.percentage))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Prediction Summary Widget */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="p-1 rounded bg-indigo-50 text-indigo-600">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <h2 className="text-sm font-bold text-slate-900">AI Financial Prediction</h2>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  Machine learning forecast based on your historical cash flows
                </p>

                {latestPrediction ? (
                  <div className="space-y-3 bg-slate-50 rounded-lg p-3.5 border border-slate-200">
                    <div>
                      <span className="text-xs text-slate-500 block">Forecast For</span>
                      <span className="text-sm font-semibold text-slate-900">
                        {latestPrediction.prediction_date}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600">Expected Expenses:</span>
                      <span className="font-bold font-mono-num text-rose-600">
                        {formatINR(latestPrediction.predicted_expense)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600">Expected Savings:</span>
                      <span className="font-bold font-mono-num text-emerald-600">
                        {formatINR(latestPrediction.predicted_savings)}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 text-xs text-slate-500 flex justify-between">
                      <span>Model:</span>
                      <span className="font-mono text-slate-700">{latestPrediction.model_name}</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-lg p-4 text-center border border-dashed border-slate-300">
                    <p className="text-xs text-slate-600 mb-3">
                      Run regression models on your monthly spending to project next-month outflows.
                    </p>
                    <button
                      onClick={() => onNavigate('predictor')}
                      className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                    >
                      Open AI Predictor →
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={() => onNavigate('predictor')}
                  className="w-full py-2 text-xs font-semibold text-center text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  {latestPrediction ? 'Retrain & View Full ML Report →' : 'Generate Prediction →'}
                </button>
              </div>
            </div>
          </div>

          {/* Recent Transactions Section */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Recent Transactions</h2>
                <p className="text-xs text-slate-500">Your latest logged entries</p>
              </div>
              <button
                onClick={() => onNavigate('transactions')}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
              >
                View all ({transactions.length}) →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2.5 px-3 font-semibold">Date</th>
                    <th className="py-2.5 px-3 font-semibold">Type</th>
                    <th className="py-2.5 px-3 font-semibold">Category</th>
                    <th className="py-2.5 px-3 font-semibold">Description</th>
                    <th className="py-2.5 px-3 font-semibold">Method</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentTransactions.map(row => (
                    <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3 text-slate-600 font-mono-num whitespace-nowrap">
                        {formatDateIN(row.date)}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`font-semibold ${
                            row.type === 'Income' ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {row.type}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-900 font-medium whitespace-nowrap">
                        {row.category}
                      </td>
                      <td className="py-3 px-3 text-slate-600 max-w-[200px] truncate">
                        {row.description || '—'}
                      </td>
                      <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                        {row.payment_method || '—'}
                      </td>
                      <td className="py-3 px-3 font-mono-num font-semibold text-right whitespace-nowrap">
                        <span className={row.type === 'Income' ? 'text-emerald-700' : 'text-slate-900'}>
                          {row.type === 'Income' ? '+' : '-'} {formatINR(row.amount)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

function formatMonthYear(ym: string): string {
  try {
    const [year, month] = ym.split('-');
    const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  } catch {
    return ym;
  }
}

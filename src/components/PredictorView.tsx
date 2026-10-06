/**
 * AI Finance Predictor View
 * Executes machine learning regression & time-series models on user's real transactions.
 * Calculates validation metrics and projects next month's financial metrics.
 */

import React, { useState } from 'react';
import { Transaction, PredictionRecord } from '../types';
import { runAIPrediction } from '../utils/mlEngine';
import { formatINR } from '../utils/format';
import { generateInsights } from '../utils/insights';
import { Sparkles, BrainCircuit, TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle, BarChart2 } from 'lucide-react';

interface PredictorViewProps {
  transactions: Transaction[];
  onSavePrediction: (pred: {
    prediction_date: string;
    predicted_expense: number;
    predicted_savings: number;
    model_name: string;
  }) => void;
  onOpenAddModal: () => void;
}

export const PredictorView: React.FC<PredictorViewProps> = ({
  transactions,
  onSavePrediction,
  onOpenAddModal,
}) => {
  const [isTraining, setIsTraining] = useState(false);
  const [lastTrainedResult, setLastTrainedResult] = useState<ReturnType<typeof runAIPrediction> | null>(() => {
    // Attempt initial evaluation
    return runAIPrediction(transactions);
  });

  const handleTrainModels = () => {
    setIsTraining(true);
    setTimeout(() => {
      const res = runAIPrediction(transactions);
      setLastTrainedResult(res);
      setIsTraining(false);

      if (res.sufficient) {
        onSavePrediction({
          prediction_date: res.nextMonthLabel,
          predicted_expense: res.predictedExpense,
          predicted_savings: res.predictedSavings,
          model_name: res.selectedModel,
        });
      }
    }, 400);
  };

  const result = lastTrainedResult || runAIPrediction(transactions);
  const insights = generateInsights(transactions);

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span>AI Finance Predictor</span>
            <span className="p-1 rounded bg-indigo-50 text-indigo-600">
              <BrainCircuit className="w-5 h-5" />
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Machine learning regression and time-series modeling trained on your personal financial history
          </p>
        </div>

        {result.sufficient && (
          <button
            onClick={handleTrainModels}
            disabled={isTraining}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors shadow-xs"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isTraining ? 'Training Algorithms...' : 'Retrain AI Models'}</span>
          </button>
        )}
      </div>

      {/* Check Data Sufficiency */}
      {!result.sufficient ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-2xl mx-auto shadow-xs text-center space-y-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900 mb-2">
              {result.message}
            </h2>
            <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
              Machine learning algorithms (Linear Regression, Polynomial Regression, and Exponential Smoothing) calculate lag correlations, moving averages, and spending velocity.
              Currently, your account contains data across <strong>{result.historicalMonthsCount} month(s)</strong>.
              A minimum of <strong>3 distinct calendar months</strong> is required to train reliable predictive models without fabricating synthetic assumptions.
            </p>
          </div>

          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
            >
              Add New Transaction
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Main Forecast Banner */}
          <div className="bg-indigo-950 text-white rounded-xl p-6 shadow-md border border-indigo-900">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-indigo-900/60">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-300">
                  Optimal ML Forecast Target
                </span>
                <h2 className="text-xl font-bold text-white mt-0.5">
                  {result.nextMonthLabel} Outlook
                </h2>
                <p className="text-xs text-indigo-300 mt-1">
                  Selected Algorithm: <span className="font-mono text-white font-medium">{result.selectedModel}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-indigo-300">Spending Direction:</span>
                <span
                  className={`px-2.5 py-1 rounded text-xs font-bold inline-flex items-center gap-1 ${
                    result.spendingTrend === 'Increasing'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : result.spendingTrend === 'Decreasing'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  }`}
                >
                  {result.spendingTrend === 'Increasing' && <TrendingUp className="w-3.5 h-3.5" />}
                  {result.spendingTrend === 'Decreasing' && <TrendingDown className="w-3.5 h-3.5" />}
                  {result.spendingTrend === 'Stable' && <Minus className="w-3.5 h-3.5" />}
                  <span>{result.spendingTrend}</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-5">
              <div>
                <span className="text-xs text-indigo-300 block mb-1">Expected Expenses (₹)</span>
                <span className="text-2xl sm:text-3xl font-bold font-mono-num text-rose-300">
                  {formatINR(result.predictedExpense)}
                </span>
                <span className="text-[11px] text-indigo-400 block mt-1">
                  Targeted monthly burn
                </span>
              </div>

              <div>
                <span className="text-xs text-indigo-300 block mb-1">Expected Savings (₹)</span>
                <span className="text-2xl sm:text-3xl font-bold font-mono-num text-emerald-400">
                  {formatINR(result.predictedSavings)}
                </span>
                <span className="text-[11px] text-indigo-400 block mt-1">
                  Surplus after projected outflows
                </span>
              </div>

              <div>
                <span className="text-xs text-indigo-300 block mb-1">Estimated Inflow (₹)</span>
                <span className="text-2xl sm:text-3xl font-bold font-mono-num text-white">
                  {formatINR(result.expectedIncome)}
                </span>
                <span className="text-[11px] text-indigo-400 block mt-1">
                  Projected revenue baseline
                </span>
              </div>
            </div>
          </div>

          {/* Model Comparison & Evaluation Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Model Benchmark Table (2 cols) */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-900">Machine Learning Algorithm Benchmark</h3>
                <p className="text-xs text-slate-500">
                  Models trained and validated against historical spending residuals. Lowest MAE selected.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <th className="py-2.5 px-3">Model Candidate</th>
                      <th className="py-2.5 px-3 text-right">MAE (₹)</th>
                      <th className="py-2.5 px-3 text-right">RMSE (₹)</th>
                      <th className="py-2.5 px-3 text-right">R² Score</th>
                      <th className="py-2.5 px-3 text-right">Forecast (₹)</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.comparisonTable.map(cand => {
                      const isSelected = cand.name === result.selectedModel;
                      return (
                        <tr
                          key={cand.name}
                          className={isSelected ? 'bg-indigo-50/50 font-semibold' : 'hover:bg-slate-50/60'}
                        >
                          <td className="py-3 px-3 text-slate-900">
                            {cand.name}
                          </td>
                          <td className="py-3 px-3 font-mono-num text-right text-slate-700">
                            ₹{cand.mae.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3 font-mono-num text-right text-slate-700">
                            ₹{cand.rmse.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3 font-mono-num text-right text-slate-700">
                            {cand.r2.toFixed(3)}
                          </td>
                          <td className="py-3 px-3 font-mono-num text-right text-slate-900">
                            {formatINR(cand.predictedExpense)}
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            {isSelected ? (
                              <span className="text-[11px] text-indigo-700 font-bold bg-indigo-100 px-2 py-0.5 rounded">
                                Selected
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">Evaluated</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                <p>
                  <strong>MAE (Mean Absolute Error):</strong> Average expected variance in ₹ INR between model forecast and actual spending.
                </p>
                <p>
                  <strong>R² Score:</strong> Proportion of variance explained by model trend features.
                </p>
              </div>
            </div>

            {/* Projected Major Categories */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-900">Future Expense Allocations</h3>
                <p className="text-xs text-slate-500">Projected category weights for next month</p>
              </div>

              {result.futureCategories.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">No category data available.</p>
              ) : (
                <div className="space-y-3">
                  {result.futureCategories.map(cat => (
                    <div key={cat.category} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-800">{cat.category}</span>
                        <span className="font-mono-num text-slate-600">
                          {formatINR(cat.projectedAmount)} ({cat.percentage}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(5, cat.percentage))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* AI Financial Health Insights */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-1">AI Financial Health Insights</h3>
            <p className="text-xs text-slate-500 mb-4">
              Contextual budgeting guidance generated from your predicted and historical trajectory
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {insights.map(item => (
                <div
                  key={item.id}
                  className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 text-xs"
                >
                  <div className="font-semibold text-slate-900 mb-1">
                    {item.title}
                  </div>
                  <p className="text-slate-600 leading-relaxed">{item.message}</p>
                </div>
              ))}
            </div>

            <p className="mt-4 text-[11px] text-slate-400 italic">
              Disclaimer: All algorithmic models and insights provide educational budgeting support based on past trends. They do not constitute certified financial or securities advisory.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

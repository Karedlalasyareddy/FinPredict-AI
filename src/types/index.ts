/**
 * Core type definitions for AI-Based Personal Finance Prediction
 */

export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  created_at: string;
}

export type SafeUser = Omit<User, 'password_hash'>;

export type TransactionType = 'Income' | 'Expense';

export interface Transaction {
  id: number;
  user_id: number;
  date: string; // YYYY-MM-DD
  type: TransactionType;
  category: string;
  amount: number;
  description: string;
  payment_method: string;
  created_at: string;
}

export interface PredictionRecord {
  id: number;
  user_id: number;
  prediction_date: string;
  predicted_expense: number;
  predicted_savings: number;
  model_name: string;
  created_at: string;
}

export interface MonthlyAggregate {
  yearMonth: string; // YYYY-MM
  monthLabel: string; // e.g. "Jan 2026"
  income: number;
  expense: number;
  savings: number;
  savingsRate: number; // percentage
}

export interface CategoryBreakdownItem {
  category: string;
  amount: number;
  percentage: number;
}

export interface ModelCandidateResult {
  name: string;
  mae: number;
  rmse: number;
  r2: number;
  predictedExpense: number;
}

export interface PredictionResult {
  sufficient: boolean;
  message?: string;
  nextMonthLabel: string;
  predictedExpense: number;
  predictedSavings: number;
  expectedIncome: number;
  spendingTrend: 'Increasing' | 'Decreasing' | 'Stable';
  trendDescription: string;
  selectedModel: string;
  metrics: {
    mae: number;
    rmse: number;
    r2: number;
  };
  comparisonTable: ModelCandidateResult[];
  futureCategories: {
    category: string;
    percentage: number;
    projectedAmount: number;
  }[];
  historicalMonthsCount: number;
}

export interface FinancialInsight {
  id: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  title: string;
  message: string;
}

export interface DashboardMetrics {
  hasData: boolean;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  savings: number;
  savingsPercentage: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  recentMonthLabel: string | null;
  transactionCount: number;
}

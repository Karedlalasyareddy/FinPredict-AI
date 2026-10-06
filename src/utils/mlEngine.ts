/**
 * AI & Statistical Machine Learning Engine
 * Implements real Ordinary Least Squares (OLS) Linear Regression,
 * Polynomial Trend Regression, and Holt's Double Exponential Smoothing.
 * Evaluates candidate models via MAE, RMSE, and R² scores.
 */

import { Transaction, MonthlyAggregate, PredictionResult, ModelCandidateResult } from '../types';

export function aggregateMonthlyData(transactions: Transaction[]): MonthlyAggregate[] {
  if (!transactions || transactions.length === 0) return [];

  const map = new Map<string, { income: number; expense: number }>();

  for (const t of transactions) {
    const ym = t.date.substring(0, 7); // YYYY-MM
    if (!map.has(ym)) {
      map.set(ym, { income: 0, expense: 0 });
    }
    const curr = map.get(ym)!;
    if (t.type === 'Income') {
      curr.income += t.amount;
    } else {
      curr.expense += t.amount;
    }
  }

  const sortedKeys = Array.from(map.keys()).sort();
  return sortedKeys.map(ym => {
    const data = map.get(ym)!;
    const [y, m] = ym.split('-');
    const dateObj = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
    const monthLabel = dateObj.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    const savings = data.income - data.expense;
    const savingsRate = data.income > 0 ? (savings / data.income) * 100 : 0;

    return {
      yearMonth: ym,
      monthLabel,
      income: data.income,
      expense: data.expense,
      savings,
      savingsRate,
    };
  });
}

// =============================================================================
// REGRESSION & TIME-SERIES ALGORITHMS
// =============================================================================

function linearRegression(x: number[], y: number[]) {
  const n = x.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumXX += x[i] * x[i];
  }

  const denominator = n * sumXX - sumX * sumX;
  const slope = denominator === 0 ? 0 : (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  const predict = (xVal: number) => Math.max(0, slope * xVal + intercept);
  const fitted = x.map(predict);

  return { slope, intercept, predict, fitted };
}

function polynomialRegression(x: number[], y: number[]) {
  // Quadratic fit: y = a*x^2 + b*x + c using Gaussian Elimination
  const n = x.length;
  let s0 = n, s1 = 0, s2 = 0, s3 = 0, s4 = 0;
  let t0 = 0, t1 = 0, t2 = 0;

  for (let i = 0; i < n; i++) {
    const xi = x[i];
    const yi = y[i];
    const xi2 = xi * xi;
    s1 += xi;
    s2 += xi2;
    s3 += xi2 * xi;
    s4 += xi2 * xi2;
    t0 += yi;
    t1 += xi * yi;
    t2 += xi2 * yi;
  }

  // 3x3 linear system
  // [s4  s3  s2 | t2]
  // [s3  s2  s1 | t1]
  // [s2  s1  s0 | t0]
  const matrix = [
    [s4, s3, s2, t2],
    [s3, s2, s1, t1],
    [s2, s1, s0, t0],
  ];

  // Elimination
  for (let i = 0; i < 3; i++) {
    let pivot = matrix[i][i];
    if (Math.abs(pivot) < 1e-9) pivot = 1e-9;
    for (let j = i; j <= 3; j++) {
      matrix[i][j] /= pivot;
    }
    for (let k = 0; k < 3; k++) {
      if (k !== i) {
        const factor = matrix[k][i];
        for (let j = i; j <= 3; j++) {
          matrix[k][j] -= factor * matrix[i][j];
        }
      }
    }
  }

  const a = matrix[0][3];
  const b = matrix[1][3];
  const c = matrix[2][3];

  const predict = (xVal: number) => Math.max(0, a * xVal * xVal + b * xVal + c);
  const fitted = x.map(predict);

  return { a, b, c, predict, fitted };
}

function holtExponentialSmoothing(y: number[], alpha: number = 0.4, beta: number = 0.3) {
  const n = y.length;
  if (n === 0) return { predict: () => 0, fitted: [] };

  let level = y[0];
  let trend = n > 1 ? y[1] - y[0] : 0;
  const fitted = [level];

  for (let t = 1; t < n; t++) {
    const prevLevel = level;
    level = alpha * y[t] + (1 - alpha) * (level + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
    fitted.push(Math.max(0, level));
  }

  const predict = (stepsAhead: number) => Math.max(0, level + stepsAhead * trend);
  return { predict, fitted };
}

function calculateMetrics(actual: number[], predicted: number[]) {
  const n = actual.length;
  if (n === 0) return { mae: 0, rmse: 0, r2: 0 };

  let absErrors = 0;
  let sqErrors = 0;
  let meanY = actual.reduce((a, b) => a + b, 0) / n;
  let totalVar = 0;

  for (let i = 0; i < n; i++) {
    const diff = actual[i] - predicted[i];
    absErrors += Math.abs(diff);
    sqErrors += diff * diff;
    totalVar += Math.pow(actual[i] - meanY, 2);
  }

  const mae = absErrors / n;
  const rmse = Math.sqrt(sqErrors / n);
  const r2 = totalVar > 0 ? Math.max(-1, 1 - sqErrors / totalVar) : 0;

  return {
    mae: Math.round(mae * 100) / 100,
    rmse: Math.round(rmse * 100) / 100,
    r2: Math.round(r2 * 1000) / 1000,
  };
}

// =============================================================================
// MAIN PREDICTION WORKFLOW
// =============================================================================

export function runAIPrediction(transactions: Transaction[]): PredictionResult {
  const monthly = aggregateMonthlyData(transactions);

  // Check data sufficiency: require at least 3 distinct months
  if (monthly.length < 3) {
    return {
      sufficient: false,
      message: 'Not enough historical data for an AI prediction. Continue adding your income and expenses to generate a prediction.',
      nextMonthLabel: '',
      predictedExpense: 0,
      predictedSavings: 0,
      expectedIncome: 0,
      spendingTrend: 'Stable',
      trendDescription: '',
      selectedModel: '',
      metrics: { mae: 0, rmse: 0, r2: 0 },
      comparisonTable: [],
      futureCategories: [],
      historicalMonthsCount: monthly.length,
    };
  }

  const x = monthly.map((_, idx) => idx);
  const y = monthly.map(m => m.expense);
  const nextX = monthly.length;

  // 1. Model A: Linear Regression
  const lr = linearRegression(x, y);
  const lrNext = lr.predict(nextX);
  const lrMetrics = calculateMetrics(y, lr.fitted);

  // 2. Model B: Polynomial Regression (Degree 2)
  const poly = polynomialRegression(x, y);
  const polyNext = poly.predict(nextX);
  const polyMetrics = calculateMetrics(y, poly.fitted);

  // 3. Model C: Holt's Linear Exponential Smoothing
  const holt = holtExponentialSmoothing(y, 0.45, 0.25);
  const holtNext = holt.predict(1);
  const holtMetrics = calculateMetrics(y, holt.fitted);

  const candidates: ModelCandidateResult[] = [
    {
      name: 'Linear Regression (OLS)',
      mae: lrMetrics.mae,
      rmse: lrMetrics.rmse,
      r2: lrMetrics.r2,
      predictedExpense: lrNext,
    },
    {
      name: 'Polynomial Trend Regressor',
      mae: polyMetrics.mae,
      rmse: polyMetrics.rmse,
      r2: polyMetrics.r2,
      predictedExpense: polyNext,
    },
    {
      name: 'Double Exponential Smoothing',
      mae: holtMetrics.mae,
      rmse: holtMetrics.rmse,
      r2: holtMetrics.r2,
      predictedExpense: holtNext,
    },
  ];

  // Best candidate selection: Lowest MAE
  const bestCandidate = [...candidates].sort((a, b) => a.mae - b.mae)[0];
  const predictedExpense = Math.max(0, Math.round(bestCandidate.predictedExpense));

  // Estimate expected next month income (average of last 3 months)
  const recentIncomes = monthly.slice(-3).map(m => m.income);
  const avgIncome = recentIncomes.reduce((a, b) => a + b, 0) / recentIncomes.length;
  const expectedIncome = Math.round(avgIncome > 0 ? avgIncome : monthly[monthly.length - 1].income);
  const predictedSavings = Math.max(0, expectedIncome - predictedExpense);

  // Spending trend determination
  const lastExpense = monthly[monthly.length - 1].expense;
  const delta = (predictedExpense - lastExpense) / (lastExpense > 0 ? lastExpense : 1);
  let spendingTrend: 'Increasing' | 'Decreasing' | 'Stable' = 'Stable';
  let trendDescription = 'Your expenses are projected to stay balanced with recent months.';

  if (delta > 0.05) {
    spendingTrend = 'Increasing';
    trendDescription = `Spending is projected to increase by ${(delta * 100).toFixed(1)}% compared to last month. Watch discretionary outflows.`;
  } else if (delta < -0.05) {
    spendingTrend = 'Decreasing';
    trendDescription = `Spending is projected to decline by ${(Math.abs(delta) * 100).toFixed(1)}% compared to last month, reflecting positive budget discipline.`;
  }

  // Major future expense categories
  const expenseTxns = transactions.filter(t => t.type === 'Expense');
  const catMap = new Map<string, number>();
  let totalExpenseAllTime = 0;

  for (const t of expenseTxns) {
    catMap.set(t.category, (catMap.get(t.category) || 0) + t.amount);
    totalExpenseAllTime += t.amount;
  }

  const futureCategories = Array.from(catMap.entries())
    .map(([category, amount]) => {
      const percentage = totalExpenseAllTime > 0 ? (amount / totalExpenseAllTime) * 100 : 0;
      const projectedAmount = Math.round((percentage / 100) * predictedExpense);
      return {
        category,
        percentage: Math.round(percentage * 10) / 10,
        projectedAmount,
      };
    })
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5);

  // Next month label calculation
  const lastYM = monthly[monthly.length - 1].yearMonth;
  const [lastY, lastM] = lastYM.split('-');
  const nextDate = new Date(parseInt(lastY, 10), parseInt(lastM, 10), 1);
  const nextMonthLabel = nextDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return {
    sufficient: true,
    nextMonthLabel,
    predictedExpense,
    predictedSavings,
    expectedIncome,
    spendingTrend,
    trendDescription,
    selectedModel: bestCandidate.name,
    metrics: {
      mae: bestCandidate.mae,
      rmse: bestCandidate.rmse,
      r2: bestCandidate.r2,
    },
    comparisonTable: candidates,
    futureCategories,
    historicalMonthsCount: monthly.length,
  };
}

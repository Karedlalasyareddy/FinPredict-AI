/**
 * finpredict database service
 * Persistent SQLite-equivalent storage engine enforcing strict user-level data separation.
 */

import { User, Transaction, PredictionRecord, SafeUser, TransactionType } from '../types';

const USERS_STORAGE_KEY = 'finpredict_users_v1';
const TRANSACTIONS_STORAGE_KEY = 'finpredict_transactions_v1';
const PREDICTIONS_STORAGE_KEY = 'finpredict_predictions_v1';

function getStoredUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: User[]): void {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function getStoredTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTransactions(transactions: Transaction[]): void {
  localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions));
}

function getStoredPredictions(): PredictionRecord[] {
  try {
    const raw = localStorage.getItem(PREDICTIONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePredictions(predictions: PredictionRecord[]): void {
  localStorage.setItem(PREDICTIONS_STORAGE_KEY, JSON.stringify(predictions));
}

// =============================================================================
// USER OPERATIONS
// =============================================================================

export function getUserByEmail(email: string): User | null {
  const users = getStoredUsers();
  const normalized = email.trim().toLowerCase();
  const user = users.find(u => u.email.toLowerCase() === normalized);
  return user || null;
}

export function getUserById(id: number): SafeUser | null {
  const users = getStoredUsers();
  const user = users.find(u => u.id === id);
  if (!user) return null;
  const { password_hash: _, ...safe } = user;
  return safe;
}

export function createUser(name: string, email: string, passwordHash: string): SafeUser {
  const users = getStoredUsers();
  const normalized = email.trim().toLowerCase();

  if (users.some(u => u.email.toLowerCase() === normalized)) {
    throw new Error('An account with this email address already exists.');
  }

  const nextId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
  const newUser: User = {
    id: nextId,
    name: name.trim(),
    email: normalized,
    password_hash: passwordHash,
    created_at: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

  const { password_hash: _, ...safe } = newUser;
  return safe;
}

export function updateUserName(userId: number, newName: string): boolean {
  const users = getStoredUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return false;
  user.name = newName.trim();
  saveUsers(users);
  return true;
}

export function updateUserPassword(userId: number, newPasswordHash: string): boolean {
  const users = getStoredUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return false;
  user.password_hash = newPasswordHash;
  saveUsers(users);
  return true;
}

// =============================================================================
// TRANSACTION OPERATIONS (STRICT USER ISOLATION)
// =============================================================================

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  type?: 'All' | TransactionType;
  category?: string;
  search?: string;
}

export function getTransactions(userId: number, filters?: TransactionFilters): Transaction[] {
  const all = getStoredTransactions();
  // Enforce isolation: ONLY records where user_id === userId
  let userTxns = all.filter(t => t.user_id === userId);

  if (filters) {
    if (filters.startDate) {
      userTxns = userTxns.filter(t => t.date >= filters.startDate!);
    }
    if (filters.endDate) {
      userTxns = userTxns.filter(t => t.date <= filters.endDate!);
    }
    if (filters.type && filters.type !== 'All') {
      userTxns = userTxns.filter(t => t.type === filters.type);
    }
    if (filters.category && filters.category !== 'All') {
      userTxns = userTxns.filter(t => t.category.toLowerCase() === filters.category!.toLowerCase());
    }
    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      userTxns = userTxns.filter(
        t =>
          (t.description && t.description.toLowerCase().includes(q)) ||
          t.category.toLowerCase().includes(q) ||
          (t.payment_method && t.payment_method.toLowerCase().includes(q))
      );
    }
  }

  // Sort descending by date, then id
  return userTxns.sort((a, b) => {
    if (b.date !== a.date) return b.date.localeCompare(a.date);
    return b.id - a.id;
  });
}

export function getTransactionById(transactionId: number, userId: number): Transaction | null {
  const all = getStoredTransactions();
  const found = all.find(t => t.id === transactionId && t.user_id === userId);
  return found || null;
}

export function addTransaction(
  userId: number,
  entry: {
    date: string;
    type: TransactionType;
    category: string;
    amount: number;
    description?: string;
    payment_method?: string;
  }
): Transaction {
  if (entry.amount <= 0) {
    throw new Error('Amount must be greater than zero.');
  }

  const all = getStoredTransactions();
  const nextId = all.length > 0 ? Math.max(...all.map(t => t.id)) + 1 : 1;

  const newTxn: Transaction = {
    id: nextId,
    user_id: userId,
    date: entry.date,
    type: entry.type,
    category: entry.category.trim(),
    amount: Number(entry.amount),
    description: entry.description?.trim() || '',
    payment_method: entry.payment_method?.trim() || '',
    created_at: new Date().toISOString(),
  };

  all.push(newTxn);
  saveTransactions(all);
  return newTxn;
}

export function updateTransaction(
  transactionId: number,
  userId: number,
  entry: {
    date: string;
    type: TransactionType;
    category: string;
    amount: number;
    description?: string;
    payment_method?: string;
  }
): boolean {
  if (entry.amount <= 0) {
    throw new Error('Amount must be greater than zero.');
  }

  const all = getStoredTransactions();
  const index = all.findIndex(t => t.id === transactionId && t.user_id === userId);
  if (index === -1) return false;

  all[index] = {
    ...all[index],
    date: entry.date,
    type: entry.type,
    category: entry.category.trim(),
    amount: Number(entry.amount),
    description: entry.description?.trim() || '',
    payment_method: entry.payment_method?.trim() || '',
  };

  saveTransactions(all);
  return true;
}

export function deleteTransaction(transactionId: number, userId: number): boolean {
  const all = getStoredTransactions();
  const initialLength = all.length;
  // Strict user isolation filter on delete
  const filtered = all.filter(t => !(t.id === transactionId && t.user_id === userId));

  if (filtered.length !== initialLength) {
    saveTransactions(filtered);
    return true;
  }
  return false;
}

export function getUserCategories(userId: number): string[] {
  const txns = getTransactions(userId);
  const set = new Set<string>();
  txns.forEach(t => {
    if (t.category) set.add(t.category);
  });
  return Array.from(set).sort();
}

// =============================================================================
// PREDICTIONS OPERATIONS
// =============================================================================

export function savePrediction(
  userId: number,
  predictionDate: string,
  predictedExpense: number,
  predictedSavings: number,
  modelName: string
): PredictionRecord {
  const all = getStoredPredictions();
  const nextId = all.length > 0 ? Math.max(...all.map(p => p.id)) + 1 : 1;

  const record: PredictionRecord = {
    id: nextId,
    user_id: userId,
    prediction_date: predictionDate,
    predicted_expense: Number(predictedExpense),
    predicted_savings: Number(predictedSavings),
    model_name: modelName,
    created_at: new Date().toISOString(),
  };

  all.push(record);
  savePredictions(all);
  return record;
}

export function getLatestPrediction(userId: number): PredictionRecord | null {
  const all = getStoredPredictions();
  const userPreds = all.filter(p => p.user_id === userId);
  if (userPreds.length === 0) return null;
  return userPreds[userPreds.length - 1];
}

export function getUserStats(userId: number) {
  const txns = getTransactions(userId);
  let totalIncome = 0;
  let totalExpenses = 0;

  for (const t of txns) {
    if (t.type === 'Income') {
      totalIncome += t.amount;
    } else {
      totalExpenses += t.amount;
    }
  }

  const balance = totalIncome - totalExpenses;
  const savings = Math.max(0, balance);
  const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

  return {
    totalTransactions: txns.length,
    totalIncome,
    totalExpenses,
    balance,
    savings,
    savingsRate,
  };
}

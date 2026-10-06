/**
 * Main Application Component for "AI-Based Personal Finance Prediction"
 * Indian Personal Finance Management with Machine Learning Forecasting · ₹ INR
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { AuthScreen } from './components/AuthScreen';
import { DashboardView } from './components/DashboardView';
import { TransactionsView } from './components/TransactionsView';
import { AnalyticsView } from './components/AnalyticsView';
import { PredictorView } from './components/PredictorView';
import { ProfileView } from './components/ProfileView';
import { AddTransactionModal } from './components/AddTransactionModal';
import { PythonInfoModal } from './components/PythonInfoModal';
import { Transaction, PredictionRecord, TransactionType } from './types';
import * as db from './services/db';

function MainApp() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'transactions' | 'analytics' | 'predictor' | 'profile'>('dashboard');

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [latestPrediction, setLatestPrediction] = useState<PredictionRecord | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPythonModalOpen, setIsPythonModalOpen] = useState(false);

  // Load user data strictly belonging to authenticated user ID
  const refreshUserData = () => {
    if (!user) {
      setTransactions([]);
      setLatestPrediction(null);
      return;
    }
    const userTxns = db.getTransactions(user.id);
    const userPred = db.getLatestPrediction(user.id);
    setTransactions(userTxns);
    setLatestPrediction(userPred);
  };

  useEffect(() => {
    refreshUserData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Loading FinPredict AI...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <AuthScreen />;
  }

  const handleAddTransaction = (entry: {
    date: string;
    type: TransactionType;
    category: string;
    amount: number;
    description: string;
    payment_method: string;
  }) => {
    db.addTransaction(user.id, entry);
    refreshUserData();
  };

  const handleUpdateTransaction = (
    id: number,
    entry: {
      date: string;
      type: TransactionType;
      category: string;
      amount: number;
      description: string;
      payment_method: string;
    }
  ) => {
    db.updateTransaction(id, user.id, entry);
    refreshUserData();
  };

  const handleDeleteTransaction = (id: number) => {
    db.deleteTransaction(id, user.id);
    refreshUserData();
  };

  const handleSavePrediction = (pred: {
    prediction_date: string;
    predicted_expense: number;
    predicted_savings: number;
    model_name: string;
  }) => {
    const saved = db.savePrediction(
      user.id,
      pred.prediction_date,
      pred.predicted_expense,
      pred.predicted_savings,
      pred.model_name
    );
    setLatestPrediction(saved);
  };

  const handleImportTransactions = (imported: Array<{
    date: string;
    type: TransactionType;
    category: string;
    amount: number;
    description: string;
    payment_method: string;
  }>) => {
    for (const item of imported) {
      db.addTransaction(user.id, item);
    }
    refreshUserData();
  };

  const existingCategories = db.getUserCategories(user.id);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Header
        currentTab={currentTab}
        onSelectTab={tab => setCurrentTab(tab as any)}
        onOpenPythonModal={() => setIsPythonModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'dashboard' && (
          <DashboardView
            transactions={transactions}
            latestPrediction={latestPrediction}
            onNavigate={tab => setCurrentTab(tab as any)}
            onOpenAddModal={() => setIsAddModalOpen(true)}
          />
        )}

        {currentTab === 'transactions' && (
          <TransactionsView
            transactions={transactions}
            onAddTransaction={handleAddTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            onDeleteTransaction={handleDeleteTransaction}
          />
        )}

        {currentTab === 'analytics' && (
          <AnalyticsView
            transactions={transactions}
            onOpenAddModal={() => setIsAddModalOpen(true)}
          />
        )}

        {currentTab === 'predictor' && (
          <PredictorView
            transactions={transactions}
            onSavePrediction={handleSavePrediction}
            onOpenAddModal={() => setIsAddModalOpen(true)}
          />
        )}

        {currentTab === 'profile' && (
          <ProfileView
            transactions={transactions}
            onImportTransactions={handleImportTransactions}
          />
        )}
      </main>

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddTransaction={handleAddTransaction}
        existingCategories={existingCategories}
      />

      {/* Python Streamlit Instructions Modal */}
      <PythonInfoModal
        isOpen={isPythonModalOpen}
        onClose={() => setIsPythonModalOpen(false)}
      />

      {/* Quiet, Clean Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>AI-Based Personal Finance Prediction · Made for Indian Users (₹ INR)</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsPythonModalOpen(true)}
              className="text-slate-600 hover:text-slate-900 hover:underline"
            >
              Python 3.11 Streamlit Code
            </button>
            <span>·</span>
            <span>Local Database Isolation Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

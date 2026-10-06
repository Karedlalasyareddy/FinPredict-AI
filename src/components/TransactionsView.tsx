/**
 * Transaction Management View
 * Implements Add, Edit, Delete, Search, and Filtering with full validation.
 */

import React, { useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { formatINR, formatDateIN } from '../utils/format';
import {
  Search,
  Filter,
  PlusCircle,
  Edit2,
  Trash2,
  X,
  Check,
  Calendar,
  AlertTriangle,
} from 'lucide-react';

interface TransactionsViewProps {
  transactions: Transaction[];
  onAddTransaction: (entry: {
    date: string;
    type: TransactionType;
    category: string;
    amount: number;
    description: string;
    payment_method: string;
  }) => void;
  onUpdateTransaction: (
    id: number,
    entry: {
      date: string;
      type: TransactionType;
      category: string;
      amount: number;
      description: string;
      payment_method: string;
    }
  ) => void;
  onDeleteTransaction: (id: number) => void;
}

const DEFAULT_CATEGORIES = [
  'Food',
  'Travel',
  'Shopping',
  'Education',
  'Bills',
  'Rent',
  'Healthcare',
  'Entertainment',
  'Subscriptions',
  'Salary',
  'Freelance',
  'Business',
  'Investments',
  'Other',
];

const PAYMENT_METHODS = [
  'UPI',
  'Net Banking',
  'Credit Card',
  'Debit Card',
  'Cash',
  'Other',
];

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
}) => {
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | TransactionType>('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals & form states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Form inputs for Add
  const [formDate, setFormDate] = useState(new Date().toISOString().substring(0, 10));
  const [formType, setFormType] = useState<TransactionType>('Expense');
  const [formCategory, setFormCategory] = useState('Food');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryText, setCustomCategoryText] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPaymentMethod, setFormPaymentMethod] = useState('UPI');
  const [formError, setFormError] = useState('');

  // Collect all unique categories available
  const existingCategories = Array.from(new Set(transactions.map(t => t.category)));
  const allCategories = Array.from(new Set([...DEFAULT_CATEGORIES, ...existingCategories])).sort();

  // Filter application
  const filtered = transactions.filter(t => {
    if (typeFilter !== 'All' && t.type !== typeFilter) return false;
    if (categoryFilter !== 'All' && t.category !== categoryFilter) return false;
    if (startDate && t.date < startDate) return false;
    if (endDate && t.date > endDate) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchDesc = t.description && t.description.toLowerCase().includes(q);
      const matchCat = t.category.toLowerCase().includes(q);
      const matchMethod = t.payment_method && t.payment_method.toLowerCase().includes(q);
      if (!matchDesc && !matchCat && !matchMethod) return false;
    }
    return true;
  });

  const resetAddForm = () => {
    setFormDate(new Date().toISOString().substring(0, 10));
    setFormType('Expense');
    setFormCategory('Food');
    setIsCustomCategory(false);
    setCustomCategoryText('');
    setFormAmount('');
    setFormDescription('');
    setFormPaymentMethod('UPI');
    setFormError('');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const amt = parseFloat(formAmount);
    if (isNaN(amt) || amt <= 0) {
      setFormError('Please enter a valid amount greater than zero.');
      return;
    }

    const finalCategory = isCustomCategory ? customCategoryText.trim() : formCategory;
    if (!finalCategory) {
      setFormError('Please provide a category name.');
      return;
    }

    if (!formDate) {
      setFormError('Please select a valid date.');
      return;
    }

    onAddTransaction({
      date: formDate,
      type: formType,
      category: finalCategory,
      amount: amt,
      description: formDescription.trim(),
      payment_method: formPaymentMethod,
    });

    resetAddForm();
    setIsAddOpen(false);
  };

  const startEdit = (t: Transaction) => {
    setEditingTxn(t);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTxn) return;

    if (editingTxn.amount <= 0 || isNaN(editingTxn.amount)) {
      alert('Amount must be greater than zero.');
      return;
    }
    if (!editingTxn.category.trim()) {
      alert('Category cannot be blank.');
      return;
    }

    onUpdateTransaction(editingTxn.id, {
      date: editingTxn.date,
      type: editingTxn.type,
      category: editingTxn.category.trim(),
      amount: editingTxn.amount,
      description: editingTxn.description,
      payment_method: editingTxn.payment_method,
    });

    setEditingTxn(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Transaction Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Add, filter, and inspect your income and expenditure in ₹ INR
          </p>
        </div>

        <button
          onClick={() => {
            resetAddForm();
            setIsAddOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Transaction</span>
        </button>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search description, category, payment method..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="All">All Types</option>
              <option value="Income">Income Only</option>
              <option value="Expense">Expense Only</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="All">All Categories</option>
              {allCategories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          <div>
            <button
              onClick={() => {
                setSearchQuery('');
                setTypeFilter('All');
                setCategoryFilter('All');
                setStartDate('');
                setEndDate('');
              }}
              className="w-full py-2 px-3 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Date Range Sub-filter */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Date Filter:</span>
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="px-2 py-1 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="px-2 py-1 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="text-slate-400 hover:text-slate-700 text-xs underline ml-1"
            >
              Clear dates
            </button>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing <strong className="text-slate-900 font-semibold">{filtered.length}</strong> of {transactions.length} total entries
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="p-10 text-center text-slate-500 text-sm">
            {transactions.length === 0 ? (
              <div>
                <p className="font-semibold text-slate-800 mb-1">No transactions recorded yet.</p>
                <p className="text-xs text-slate-500 mb-4">Click "Add Transaction" above to start logging your finances.</p>
                <button
                  onClick={() => setIsAddOpen(true)}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
                >
                  Log First Entry
                </button>
              </div>
            ) : (
              <p>No transactions match your search or filter criteria.</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono-num text-slate-700 whitespace-nowrap">
                      {formatDateIN(t.date)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`font-semibold ${
                          t.type === 'Income' ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {t.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
                      {t.category}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {t.description || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {t.payment_method || '—'}
                    </td>
                    <td className="py-3 px-4 font-mono-num font-semibold text-right whitespace-nowrap">
                      <span className={t.type === 'Income' ? 'text-emerald-700' : 'text-slate-900'}>
                        {t.type === 'Income' ? '+' : '-'} {formatINR(t.amount)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => startEdit(t)}
                          className="p-1 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                          title="Edit transaction"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingId(t.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Delete transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD TRANSACTION MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Add New Transaction</h2>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Transaction Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormType('Expense')}
                    className={`py-2 text-xs font-semibold rounded-lg border transition-colors ${
                      formType === 'Expense'
                        ? 'bg-rose-50 border-rose-600 text-rose-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType('Income')}
                    className={`py-2 text-xs font-semibold rounded-lg border transition-colors ${
                      formType === 'Income'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Income
                  </button>
                </div>
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Amount (₹ INR) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="e.g. 2500"
                    value={formAmount}
                    onChange={e => setFormAmount(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              {/* Category & Custom Category */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">Category *</label>
                  <button
                    type="button"
                    onClick={() => setIsCustomCategory(!isCustomCategory)}
                    className="text-xs text-indigo-600 hover:text-indigo-800"
                  >
                    {isCustomCategory ? 'Pick from standard list' : '+ Create custom category'}
                  </button>
                </div>

                {isCustomCategory ? (
                  <input
                    type="text"
                    placeholder="Enter custom category name (e.g. Pet Care)"
                    value={customCategoryText}
                    onChange={e => setCustomCategoryText(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                ) : (
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    {allCategories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={formPaymentMethod}
                  onChange={e => setFormPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  {PAYMENT_METHODS.map(m => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Weekly organic vegetables & fruits"
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                Edit Transaction #{editingTxn.id}
              </h2>
              <button
                onClick={() => setEditingTxn(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTxn({ ...editingTxn, type: 'Expense' })}
                  className={`py-2 text-xs font-semibold rounded-lg border transition-colors ${
                    editingTxn.type === 'Expense'
                      ? 'bg-rose-50 border-rose-600 text-rose-700'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setEditingTxn({ ...editingTxn, type: 'Income' })}
                  className={`py-2 text-xs font-semibold rounded-lg border transition-colors ${
                    editingTxn.type === 'Income'
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-700'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  Income
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Amount (₹ INR) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={editingTxn.amount}
                    onChange={e =>
                      setEditingTxn({ ...editingTxn, amount: parseFloat(e.target.value) || 0 })
                    }
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={editingTxn.date}
                    onChange={e => setEditingTxn({ ...editingTxn, date: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={editingTxn.category}
                  onChange={e => setEditingTxn({ ...editingTxn, category: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={editingTxn.payment_method}
                  onChange={e =>
                    setEditingTxn({ ...editingTxn, payment_method: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  {PAYMENT_METHODS.map(m => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={editingTxn.description || ''}
                  onChange={e =>
                    setEditingTxn({ ...editingTxn, description: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTxn(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl border border-slate-200 text-center">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Delete Transaction?</h3>
            <p className="text-xs text-slate-500 mb-5">
              This action cannot be undone. This record will be permanently deleted from your personal database.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteTransaction(deletingId);
                  setDeletingId(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

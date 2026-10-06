/**
 * Add Transaction Modal
 * Reusable modal for adding income or expense entries
 */

import React, { useState } from 'react';
import { TransactionType } from '../types';
import { X } from 'lucide-react';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (entry: {
    date: string;
    type: TransactionType;
    category: string;
    amount: number;
    description: string;
    payment_method: string;
  }) => void;
  existingCategories: string[];
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

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onAddTransaction,
  existingCategories,
}) => {
  const [formDate, setFormDate] = useState(new Date().toISOString().substring(0, 10));
  const [formType, setFormType] = useState<TransactionType>('Expense');
  const [formCategory, setFormCategory] = useState('Food');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryText, setCustomCategoryText] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPaymentMethod, setFormPaymentMethod] = useState('UPI');
  const [formError, setFormError] = useState('');

  if (!isOpen) return null;

  const allCategories = Array.from(new Set([...DEFAULT_CATEGORIES, ...existingCategories])).sort();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const amt = parseFloat(formAmount);
    if (isNaN(amt) || amt <= 0) {
      setFormError('Please enter an amount greater than zero.');
      return;
    }

    const finalCategory = isCustomCategory ? customCategoryText.trim() : formCategory;
    if (!finalCategory) {
      setFormError('Please select or specify a category.');
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

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Add Transaction</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {formError && (
          <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Amount (₹ INR) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="e.g. 5000"
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

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">Category *</label>
              <button
                type="button"
                onClick={() => setIsCustomCategory(!isCustomCategory)}
                className="text-xs text-indigo-600 hover:text-indigo-800"
              >
                {isCustomCategory ? 'Select from list' : '+ Custom category'}
              </button>
            </div>

            {isCustomCategory ? (
              <input
                type="text"
                placeholder="Enter custom category name"
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description / Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Monthly apartment maintenance"
              value={formDescription}
              onChange={e => setFormDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
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
  );
};

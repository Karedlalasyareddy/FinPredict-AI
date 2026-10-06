/**
 * User Profile & Account Management View
 * Shows user details, stats, name update form, password change,
 * CSV export, and real transaction statement import tool.
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Transaction } from '../types';
import { formatINR, formatDateIN } from '../utils/format';
import { User, Shield, Download, Upload, Check, AlertCircle } from 'lucide-react';

interface ProfileViewProps {
  transactions: Transaction[];
  onImportTransactions: (imported: Array<{
    date: string;
    type: 'Income' | 'Expense';
    category: string;
    amount: number;
    description: string;
    payment_method: string;
  }>) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ transactions, onImportTransactions }) => {
  const { user, updateName, changePassword, logout } = useAuth();

  // Name update state
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [nameMsg, setNameMsg] = useState<{ text: string; error?: boolean } | null>(null);

  // Password update state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState<{ text: string; error?: boolean } | null>(null);

  // Import state
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Stats calculation
  let totalIncome = 0;
  let totalExpenses = 0;
  for (const t of transactions) {
    if (t.type === 'Income') totalIncome += t.amount;
    else totalExpenses += t.amount;
  }
  const balance = totalIncome - totalExpenses;

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameMsg(null);
    if (!nameInput.trim() || nameInput.trim().length < 2) {
      setNameMsg({ text: 'Name must be at least 2 characters.', error: true });
      return;
    }

    const success = await updateName(nameInput.trim());
    if (success) {
      setNameMsg({ text: '✓ Name updated successfully!' });
    } else {
      setNameMsg({ text: 'Failed to update name.', error: true });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);

    if (newPassword.length < 6) {
      setPwdMsg({ text: 'Password must be at least 6 characters long.', error: true });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdMsg({ text: 'Passwords do not match.', error: true });
      return;
    }

    const success = await changePassword(newPassword);
    if (success) {
      setPwdMsg({ text: '✓ Password changed successfully!' });
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPwdMsg({ text: 'Failed to update password.', error: true });
    }
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      alert('No transactions recorded to export.');
      return;
    }

    const headers = ['id', 'date', 'type', 'category', 'amount', 'description', 'payment_method'];
    const rows = transactions.map(t => [
      t.id,
      t.date,
      t.type,
      `"${t.category.replace(/"/g, '""')}"`,
      t.amount,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      `"${(t.payment_method || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `finpredict_${user?.email || 'user'}_transactions.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus('Parsing statement...');
    const reader = new FileReader();
    reader.onload = event => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
        if (lines.length < 2) {
          setImportStatus('CSV is empty or missing headers.');
          return;
        }

        const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        const dateIdx = headers.findIndex(h => h.includes('date'));
        const typeIdx = headers.findIndex(h => h.includes('type'));
        const catIdx = headers.findIndex(h => h.includes('cat'));
        const amtIdx = headers.findIndex(h => h.includes('amount') || h.includes('inr'));
        const descIdx = headers.findIndex(h => h.includes('desc') || h.includes('note') || h.includes('narration'));
        const methIdx = headers.findIndex(h => h.includes('method') || h.includes('mode'));

        if (dateIdx === -1 || amtIdx === -1) {
          setImportStatus('Error: CSV must contain at least "date" and "amount" columns.');
          return;
        }

        const parsedEntries: any[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
          if (cols.length <= Math.max(dateIdx, amtIdx)) continue;

          const date = cols[dateIdx];
          const rawAmt = parseFloat(cols[amtIdx]);
          if (isNaN(rawAmt) || rawAmt <= 0) continue;

          let type: 'Income' | 'Expense' = 'Expense';
          if (typeIdx !== -1 && cols[typeIdx]) {
            const rawType = cols[typeIdx].toLowerCase();
            if (rawType.includes('inc') || rawType.includes('cr') || rawType.includes('credit')) {
              type = 'Income';
            }
          }

          const category = catIdx !== -1 && cols[catIdx] ? cols[catIdx] : (type === 'Income' ? 'Salary' : 'General');
          const description = descIdx !== -1 && cols[descIdx] ? cols[descIdx] : '';
          const payment_method = methIdx !== -1 && cols[methIdx] ? cols[methIdx] : 'UPI';

          parsedEntries.push({
            date,
            type,
            category,
            amount: rawAmt,
            description,
            payment_method,
          });
        }

        if (parsedEntries.length === 0) {
          setImportStatus('No valid transaction rows found in file.');
          return;
        }

        onImportTransactions(parsedEntries);
        setImportStatus(`✓ Successfully imported ${parsedEntries.length} transactions into your account!`);
      } catch (err: any) {
        setImportStatus(`Import failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          User Account & Profile
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review your account metrics, update credentials, and manage data exports
        </p>
      </div>

      {/* Account KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">
            Total Transactions
          </div>
          <div className="text-2xl font-bold font-mono-num text-slate-900">
            {transactions.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Stored under your user ID</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">
            Total Income
          </div>
          <div className="text-2xl font-bold font-mono-num text-emerald-600">
            {formatINR(totalIncome)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Recorded earnings</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">
            Total Expenses
          </div>
          <div className="text-2xl font-bold font-mono-num text-rose-600">
            {formatINR(totalExpenses)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Cumulative outflows</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">
            Net Balance
          </div>
          <div className={`text-2xl font-bold font-mono-num ${balance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
            {formatINR(balance)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Current personal balance</div>
        </div>
      </div>

      {/* Account Info & Updates Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <span className="p-1 rounded bg-slate-100 text-slate-700">
              <User className="w-4 h-4" />
            </span>
            <h2 className="text-sm font-bold text-slate-900">Profile Information</h2>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Email ID:</span>
              <span className="font-semibold text-slate-900 font-mono">{user?.email}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">User ID:</span>
              <span className="font-semibold text-slate-900 font-mono">#{user?.id}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Account Created:</span>
              <span className="text-slate-700">
                {user?.created_at ? formatDateIN(user.created_at.substring(0, 10)) : 'N/A'}
              </span>
            </div>
          </div>

          {/* Edit Name Form */}
          <form onSubmit={handleUpdateName} className="pt-2 space-y-3">
            <label className="block text-xs font-semibold text-slate-700">
              Update Display Name
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                placeholder="Full name"
                required
              />
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
              >
                Save
              </button>
            </div>
            {nameMsg && (
              <p
                className={`text-xs ${
                  nameMsg.error ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {nameMsg.text}
              </p>
            )}
          </form>
        </div>

        {/* Password Security Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <span className="p-1 rounded bg-slate-100 text-slate-700">
              <Shield className="w-4 h-4" />
            </span>
            <h2 className="text-sm font-bold text-slate-900">Security & Password</h2>
          </div>

          <p className="text-xs text-slate-500">
            Passwords are encrypted using PBKDF2 with SHA-256 and unique cryptographic salt.
          </p>

          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
            >
              Update Password
            </button>

            {pwdMsg && (
              <p
                className={`text-xs ${
                  pwdMsg.error ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {pwdMsg.text}
              </p>
            )}
          </form>
        </div>
      </div>

      {/* Data Management: Export & Import */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900">Data Management & Statement Importer</h2>
        <p className="text-xs text-slate-500">
          Export your complete financial records as CSV or upload bank statements to test the AI models immediately.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Export Box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Download className="w-4 h-4 text-slate-700" />
                <h3 className="text-xs font-bold text-slate-900">Export Transactions</h3>
              </div>
              <p className="text-xs text-slate-600 mb-4">
                Download a complete, offline CSV archive of your recorded financial items.
              </p>
            </div>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV File</span>
            </button>
          </div>

          {/* Import Box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Upload className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-900">Import Real Statement CSV</h3>
              </div>
              <p className="text-xs text-slate-600 mb-3">
                Import CSV files containing your real monthly transactions (columns: date, type, category, amount, description).
              </p>
            </div>
            <div>
              <label className="inline-flex items-center justify-center gap-1.5 w-full px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Statement CSV</span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>
              {importStatus && (
                <p className="text-xs text-indigo-700 font-medium mt-2">{importStatus}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

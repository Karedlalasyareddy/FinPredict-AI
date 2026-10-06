/**
 * Python Streamlit Info Modal
 * Displays the project structure, exact Windows installation commands,
 * and instructions to run the Streamlit application.
 */

import React, { useState } from 'react';
import { X, Copy, Check, Terminal, FolderTree } from 'lucide-react';

interface PythonInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PythonInfoModal: React.FC<PythonInfoModalProps> = ({ isOpen, onClose }) => {
  const [copiedCmd, setCopiedCmd] = useState(false);

  if (!isOpen) return null;

  const windowsCommands = `cd finpredict_ai
python -m venv venv
venv\\Scripts\\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
streamlit run app.py`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(windowsCommands);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <Terminal className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">Python 3.11 Streamlit Application</h2>
              <p className="text-xs text-slate-500">Standalone repository files located in /finpredict_ai</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          {/* Quick summary */}
          <p className="text-slate-600 leading-relaxed">
            The complete Python backend repository has been built with strict adherence to your specifications.
            It uses <strong>Python 3.11.9</strong>, <strong>Streamlit 1.40.2</strong>, <strong>scikit-learn</strong>, <strong>XGBoost</strong>, and <strong>statsmodels</strong>.
          </p>

          {/* Windows Commands Box */}
          <div className="bg-slate-950 text-slate-200 rounded-xl p-4 font-mono">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
              <span className="text-[11px] text-slate-400">Windows Command Prompt / PowerShell:</span>
              <button
                onClick={copyToClipboard}
                className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300"
              >
                {copiedCmd ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCmd ? 'Copied' : 'Copy Commands'}</span>
              </button>
            </div>
            <pre className="text-xs leading-relaxed overflow-x-auto text-emerald-400">
              {windowsCommands}
            </pre>
          </div>

          {/* Architecture Tree */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
              <FolderTree className="w-4 h-4 text-slate-500" />
              <span>Modular Structure in /finpredict_ai</span>
            </h3>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 font-mono text-[11px] text-slate-700 leading-relaxed">
              <div>finpredict_ai/</div>
              <div>├── app.py &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Streamlit main entry point & router</div>
              <div>├── requirements.txt &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Pinned dependencies</div>
              <div>├── .env &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Database configuration</div>
              <div>├── database.py &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# SQLite persistence (WHERE user_id = ?)</div>
              <div>├── auth.py &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# PBKDF2 password hashing & session state</div>
              <div>├── models.py &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Dataclasses & format_inr() utility</div>
              <div>├── predictor.py &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# scikit-learn & XGBoost regression</div>
              <div>├── analytics.py &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Aggregations & insights</div>
              <div>├── views/</div>
              <div>│ &nbsp;&nbsp;├── dashboard.py &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# KPI metrics & recent records</div>
              <div>│ &nbsp;&nbsp;├── transactions.py &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# CRUD operations & filters</div>
              <div>│ &nbsp;&nbsp;├── analytics.py &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Cash flow charts & tables</div>
              <div>│ &nbsp;&nbsp;├── predictor.py &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# AI forecast & evaluation table</div>
              <div>│ &nbsp;&nbsp;└── profile.py &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# Profile, password change, CSV export</div>
              <div>└── data/finpredict.db &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# SQLite database</div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

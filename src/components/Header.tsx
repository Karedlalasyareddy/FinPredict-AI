/**
 * Top Bar Navigation Header
 * Adheres strictly to the 3-zone Top Bar Contract from the Frontend Design Constitution.
 */

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon, Code2 } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenPythonModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onSelectTab, onOpenPythonModal }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'predictor', label: 'AI Predictor' },
    { id: 'profile', label: 'Profile' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <button
          onClick={() => onSelectTab('dashboard')}
          className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            ₹
          </span>
          <span className="truncate">FinPredict AI</span>
        </button>

        {/* Zone 2: Navigation Links (Single-line text controls) */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(item => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`px-3.5 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Actions (Python Code reference, User identity & Logout) */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenPythonModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            title="View Python Streamlit instructions & commands"
          >
            <Code2 className="w-3.5 h-3.5 text-slate-600" />
            <span>Python Files</span>
          </button>

          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <button
                onClick={() => onSelectTab('profile')}
                className="flex items-center gap-2 text-left hover:bg-slate-50 p-1.5 rounded-md transition-colors"
                title="View Account Profile"
              >
                <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden lg:block text-xs">
                  <div className="font-medium text-slate-900 truncate max-w-[130px]">{user.name}</div>
                  <div className="text-slate-500 truncate max-w-[130px]">{user.email}</div>
                </div>
              </button>

              <button
                onClick={logout}
                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                title="Sign Out"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex items-center overflow-x-auto px-4 py-2 bg-slate-50 border-t border-slate-200 gap-1 text-xs">
        {navItems.map(item => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap shrink-0 font-medium ${
                isActive ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};

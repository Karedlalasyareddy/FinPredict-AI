/**
 * Authentication Screen (Sign In & Register)
 * Enforces email validation, secure password hashing, and user isolation.
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, User as UserIcon, AlertCircle } from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (str: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!validateEmail(email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (isRegister) {
      if (!name.trim() || name.trim().length < 2) {
        setErrorMsg('Please enter your full name (minimum 2 characters).');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (isRegister) {
        const res = await register(name, email, password);
        if (!res.success) {
          setErrorMsg(res.error || 'Failed to create account.');
        }
      } else {
        const res = await login(email, password);
        if (!res.success) {
          setErrorMsg(res.error || 'Invalid email or password.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Icon */}
        <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white text-xl font-bold mx-auto mb-3 shadow-sm">
          ₹
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          AI-Based Personal Finance Prediction
        </h1>
        <p className="mt-1 text-xs text-slate-600">
          Indian Personal Finance Management with Machine Learning Forecasting · ₹ INR
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
          {/* Segmented Tab Switcher */}
          <div className="flex border-b border-slate-200 mb-6">
            <button
              onClick={() => {
                setIsRegister(false);
                setErrorMsg('');
              }}
              className={`flex-1 pb-3 text-xs font-semibold text-center transition-colors border-b-2 ${
                !isRegister
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsRegister(true);
                setErrorMsg('');
              }}
              className={`flex-1 pb-3 text-xs font-semibold text-center transition-colors border-b-2 ${
                isRegister
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Create Account
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    required={isRegister}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    required={isRegister}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs mt-2 disabled:opacity-60"
            >
              {isLoading
                ? 'Processing...'
                : isRegister
                ? 'Register Account'
                : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-[11px] text-slate-500">
            {isRegister ? (
              <p>
                Already have an account?{' '}
                <button
                  onClick={() => setIsRegister(false)}
                  className="font-semibold text-slate-900 hover:underline"
                >
                  Sign in here
                </button>
              </p>
            ) : (
              <p>
                New to FinPredict AI?{' '}
                <button
                  onClick={() => setIsRegister(true)}
                  className="font-semibold text-slate-900 hover:underline"
                >
                  Create an account
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

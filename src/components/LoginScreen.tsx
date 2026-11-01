import React, { useState } from 'react';
import { useBEMS } from '../context/BEMSContext';
import { Lock, User, AlertCircle, ArrowRight, Building2, Check, Globe } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login, startupImage, units, activeUnitCode } = useBEMS();
  const [unitCode, setUnitCode] = useState<string>('ALL');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!unitCode.trim()) {
      setErrorMessage('Please enter or select a Unit Code (e.g. ALL for Super-Admin, or TN01, SM00)');
      return;
    }

    if (!username.trim() || !password.trim()) {
      setErrorMessage('Please enter both Username and Password.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const result = login(username, password, unitCode.trim().toUpperCase());
      if (!result.success) {
        setErrorMessage(result.error || 'Invalid Unit Code, Username, or Password');
      }
      setIsLoading(false);
    }, 200);
  };

  return (
    <div id="login-container" className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-sky-100 via-[#eef7fb] to-teal-100 px-4 py-8 relative overflow-hidden font-sans">
      {/* Background Subtle Ambience */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-teal-200/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-sky-200/50 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white/95 border border-sky-200/90 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden z-10">
        {/* Startup Image Area */}
        <div className="relative h-44 w-full bg-sky-100 overflow-hidden border-b border-sky-100">
          <img
            src={startupImage}
            alt="Multi-Property Banquet Enterprise"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent" />
          <div className="absolute bottom-3 left-6 right-6 flex items-end justify-between">
            <div>
              <p className="text-teal-700 text-[11px] font-bold tracking-widest uppercase mb-0.5">
                Hospitality Enterprise Operations
              </p>
              <h1 className="text-xl font-bold text-slate-800 tracking-wide">
                Banquet Enquiry Management System
              </h1>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 font-bold">
                {unitCode.toUpperCase() === 'ALL' ? 'GLOBAL (ALL)' : `UNIT: ${unitCode.toUpperCase()}`}
              </span>
            </div>
          </div>
        </div>

        {/* Form Area */}
        <div className="p-6 sm:p-8">
          {/* Inline Visual Error Banner */}
          {errorMessage && (
            <div
              id="login-error-banner"
              className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-xs sm:text-sm animate-shake"
            >
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. Unit Code Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="unit-code-input" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Hotel Unit / Access Code
                </label>
                <span className="text-[11px] text-teal-600 font-medium">ALL or 2 Letters + 2 Digits</span>
              </div>
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-teal-600">
                  <Building2 className="w-4 h-4" />
                </div>
                <input
                  id="unit-code-input"
                  type="text"
                  maxLength={4}
                  value={unitCode}
                  onChange={(e) => {
                    setUnitCode(e.target.value.toUpperCase());
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="e.g. ALL, TN01, SM00"
                  className="w-full pl-10 pr-4 py-2.5 bg-sky-50/50 border border-sky-200 rounded-xl text-slate-800 font-mono font-bold uppercase placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors text-sm"
                  autoComplete="off"
                />
              </div>

              {/* Property Unit Selectors */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {/* Option for ALL - SuperAdmin */}
                <button
                  type="button"
                  onClick={() => {
                    setUnitCode('ALL');
                    if (errorMessage) setErrorMessage('');
                  }}
                  className={`text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
                    unitCode.toUpperCase() === 'ALL'
                      ? 'bg-teal-700 text-white border-teal-700 font-bold shadow-xs'
                      : 'bg-white text-slate-600 border-sky-200 hover:bg-sky-50'
                  }`}
                >
                  <Globe className="w-3 h-3" />
                  <span className="font-mono">ALL</span>
                  <span>•</span>
                  <span>Super-Admin</span>
                </button>

                {units.map((u) => {
                  const isSelected = unitCode.toUpperCase() === u.code.toUpperCase();
                  return (
                    <button
                      key={u.code}
                      type="button"
                      onClick={() => {
                        setUnitCode(u.code);
                        if (errorMessage) setErrorMessage('');
                      }}
                      className={`text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-teal-600 text-white border-teal-600 font-bold shadow-xs'
                          : 'bg-white text-slate-600 border-sky-200 hover:bg-sky-50'
                      }`}
                    >
                      {isSelected ? <Check className="w-3 h-3" /> : null}
                      <span className="font-mono">{u.code}</span>
                      <span>•</span>
                      <span className="truncate max-w-[120px]">{u.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Username Input */}
            <div>
              <label htmlFor="username-input" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-teal-600">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="username-input"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="Enter username"
                  className="w-full pl-10 pr-4 py-2.5 bg-sky-50/50 border border-sky-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors text-sm"
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            {/* 3. Password Input */}
            <div>
              <label htmlFor="password-input" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-teal-600">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password-input"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-sky-50/50 border border-sky-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors text-sm"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 py-3 px-4 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-bold rounded-xl shadow-md shadow-teal-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useBEMS } from '../context/BEMSContext';
import { KeyRound, ShieldAlert, Check, X } from 'lucide-react';

interface PINChangeModalProps {
  onClose?: () => void;
}

export const PINChangeModal: React.FC<PINChangeModalProps> = ({ onClose }) => {
  const { currentUser, updateUserPin } = useBEMS();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!currentUser) {
    return null;
  }

  const isMandatory = currentUser.mustChangePassword;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!/^\d{4}$/.test(pin)) {
      setError('PIN must be exactly 4 numeric digits (0-9).');
      return;
    }

    if (pin !== confirmPin) {
      setError('PIN confirmation does not match.');
      return;
    }

    updateUserPin(currentUser.id, pin);
    setSuccess(true);
    setTimeout(() => {
      if (onClose) onClose();
    }, 1000);
  };

  return (
    <div id="pin-change-modal-overlay" className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md bg-white border border-sky-200 rounded-2xl p-6 shadow-2xl relative">
        {!isMandatory && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-sky-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-700">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {isMandatory ? 'First-Time PIN Setup' : 'Update Security PIN'}
            </h2>
            <p className="text-xs text-slate-500">Set your 4-digit security PIN for fast operational sign-in</p>
          </div>
        </div>

        <div className="p-3.5 bg-teal-50/70 border border-teal-200 rounded-xl mb-5 text-xs text-teal-900 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <span>
            {isMandatory ? (
              <>Welcome <strong>{currentUser.name}</strong> ({currentUser.role}). As part of security policy, please create your 4-digit numeric PIN.</>
            ) : (
              <>Updating PIN for <strong>{currentUser.name}</strong> ({currentUser.role}). Enter a new 4-digit numeric code.</>
            )}
          </span>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>PIN successfully updated!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              New 4-Digit Numeric PIN
            </label>
            <input
              type="password"
              maxLength={4}
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full text-center tracking-[1em] text-2xl font-mono py-3 bg-sky-50/50 border border-sky-200 rounded-xl text-teal-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 shadow-2xs"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Confirm 4-Digit PIN
            </label>
            <input
              type="password"
              maxLength={4}
              value={confirmPin}
              onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full text-center tracking-[1em] text-2xl font-mono py-3 bg-sky-50/50 border border-sky-200 rounded-xl text-teal-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 shadow-2xs"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>{isMandatory ? 'Save Security PIN & Enter System' : 'Update Security PIN'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};


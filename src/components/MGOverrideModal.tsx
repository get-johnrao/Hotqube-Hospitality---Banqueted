import React, { useState } from 'react';
import { AlertTriangle, Check, X } from 'lucide-react';

interface MGOverrideModalProps {
  hallName: string;
  seatingArrangement: string;
  configuredMG: number;
  enteredPax: number;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export const MGOverrideModal: React.FC<MGOverrideModalProps> = ({
  hallName,
  seatingArrangement,
  configuredMG,
  enteredPax,
  onConfirm,
  onCancel,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const minChars = 20;
  const currentChars = reason.trim().length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentChars < minChars) {
      setError(`Written justification must contain at least ${minChars} characters (currently ${currentChars}).`);
      return;
    }
    onConfirm(reason.trim());
  };

  return (
    <div id="mg-override-modal-overlay" className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-lg bg-white border border-rose-200 rounded-2xl p-6 shadow-2xl relative">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-sky-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Minimum Guarantee (MG) Override Warning</h2>
            <p className="text-xs text-rose-600 font-medium">Headcount below venue baseline threshold</p>
          </div>
        </div>

        <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl mb-5 text-xs text-rose-950 space-y-2">
          <p>
            You entered Guaranteed Pax of <strong className="text-slate-900 text-sm">{enteredPax}</strong> for{' '}
            <strong className="text-teal-700">{hallName}</strong> ({seatingArrangement} Layout).
          </p>
          <p>
            The master configured Minimum Guarantee (MG) for this space is{' '}
            <strong className="text-slate-900 text-sm">{configuredMG} Pax</strong>.
          </p>
          <p className="text-[11px] text-slate-600">
            To override this operational policy, management requires a mandatory justification audit record (minimum 20 characters).
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-100 border border-rose-300 rounded-xl text-rose-800 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Management Justification (Required)
              </label>
              <span className={`text-[11px] font-mono ${currentChars >= minChars ? 'text-emerald-700 font-bold' : 'text-amber-700'}`}>
                {currentChars} / {minChars} chars
              </span>
            </div>
            <textarea
              rows={3}
              value={reason}
              onChange={e => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. Approved by Director Operations as special VIP client with premium high-tea package..."
              className="w-full p-3 bg-white border border-slate-300 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 shadow-xs"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Reset to MG ({configuredMG} Pax)
            </button>
            <button
              type="submit"
              disabled={currentChars < minChars}
              className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 disabled:from-slate-200 disabled:to-slate-300 disabled:text-slate-400 text-white font-bold rounded-xl shadow-md flex items-center gap-2 hover:from-rose-500 hover:to-rose-600 transition-all text-xs"
            >
              <Check className="w-4 h-4" />
              <span>Authorize MG Override</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

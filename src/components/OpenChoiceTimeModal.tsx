import React, { useState } from 'react';
import { Clock, Check, X } from 'lucide-react';

interface OpenChoiceTimeModalProps {
  initialTime?: string;
  onSelect: (timeRange: string) => void;
  onClose: () => void;
}

export const OpenChoiceTimeModal: React.FC<OpenChoiceTimeModalProps> = ({
  initialTime = '10:00-16:00',
  onSelect,
  onClose,
}) => {
  const [startTime, setStartTime] = useState(() => {
    if (initialTime.includes('-')) {
      return initialTime.split('-')[0];
    }
    return '10:00';
  });

  const [endTime, setEndTime] = useState(() => {
    if (initialTime.includes('-')) {
      return initialTime.split('-')[1];
    }
    return '16:00';
  });

  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!startTime || !endTime) {
      setError('Both start and end time must be specified.');
      return;
    }
    if (startTime >= endTime) {
      setError('End time must be after start time.');
      return;
    }
    onSelect(`${startTime}-${endTime}`);
  };

  return (
    <div id="open-choice-time-modal-overlay" className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-sm bg-white border border-sky-200 rounded-2xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-sky-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-700">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Custom Session Timing</h2>
            <p className="text-xs text-slate-500">Interactive Open Choice time picker</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
            {error}
          </div>
        )}

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Event Start Time (24h)
            </label>
            <input
              type="time"
              value={startTime}
              onChange={e => {
                setStartTime(e.target.value);
                if (error) setError('');
              }}
              className="w-full p-3 bg-white border border-sky-200 rounded-xl text-slate-800 font-mono text-center text-lg focus:outline-none focus:border-teal-500 shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Event End Time (24h)
            </label>
            <input
              type="time"
              value={endTime}
              onChange={e => {
                setEndTime(e.target.value);
                if (error) setError('');
              }}
              className="w-full p-3 bg-white border border-sky-200 rounded-xl text-slate-800 font-mono text-center text-lg focus:outline-none focus:border-teal-500 shadow-xs"
            />
          </div>

          <div className="p-3 bg-sky-50/60 rounded-xl border border-sky-100 text-center">
            <span className="text-xs text-slate-500">Selected Slot: </span>
            <strong className="text-sm font-mono text-teal-700">{startTime} - {endTime}</strong>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-bold rounded-xl shadow-md flex items-center gap-2 hover:from-teal-500 hover:to-cyan-500 transition-all text-xs"
          >
            <Check className="w-4 h-4" />
            <span>Apply Custom Slot</span>
          </button>
        </div>
      </div>
    </div>
  );
};

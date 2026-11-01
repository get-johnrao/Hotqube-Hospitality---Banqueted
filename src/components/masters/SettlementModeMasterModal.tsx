import React, { useState } from 'react';
import { useBEMS } from '../../context/BEMSContext';
import { SettlementModeMaster, SettlementMode } from '../../types';
import {
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  X,
  Search,
  CheckCircle2,
  DollarSign,
} from 'lucide-react';

interface SettlementModeMasterModalProps {
  onClose: () => void;
  onSelectTab?: (tab: string) => void;
}

const DEFAULT_MODES: SettlementMode[] = [
  'Cash',
  'Credit Card',
  'Debit Card',
  'UPI / QR',
  'Direct Bank Transfer (NEFT/RTGS)',
  'Bill to Company (BTC)',
];

export const SettlementModeMasterModal: React.FC<SettlementModeMasterModalProps> = ({ onClose, onSelectTab }) => {
  const { settlementModesMaster, addSettlementMode, updateSettlementMode, deleteSettlementMode, currentUser } = useBEMS();
  const canEdit = currentUser?.role === 'Admin' || currentUser?.role === 'Editor';

  const [searchQuery, setSearchQuery] = useState('');
  const [editingMode, setEditingMode] = useState<SettlementModeMaster | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'error' | 'success' } | null>(null);

  // Form Fields
  const [name, setName] = useState<SettlementMode>('Cash');
  const [glCode, setGlCode] = useState('');
  const [chargePercentage, setChargePercentage] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [notes, setNotes] = useState('');

  const startCreate = () => {
    setEditingMode(null);
    setIsCreating(true);
    setName('Cash');
    setGlCode('GL-1010-CASH');
    setChargePercentage(0);
    setIsActive(true);
    setNotes('');
    setNotification(null);
  };

  const startEdit = (mode: SettlementModeMaster) => {
    setEditingMode(mode);
    setIsCreating(false);
    setName(mode.name);
    setGlCode(mode.glCode);
    setChargePercentage(mode.chargePercentage || 0);
    setIsActive(mode.isActive);
    setNotes(mode.notes || '');
    setNotification(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!glCode.trim()) {
      setNotification({ message: 'General Ledger (GL) Code is required.', type: 'error' });
      return;
    }

    if (editingMode) {
      updateSettlementMode({
        ...editingMode,
        name,
        glCode: glCode.trim().toUpperCase(),
        chargePercentage: Number(chargePercentage),
        isActive,
        notes: notes.trim(),
      });
      setNotification({ message: `Settlement mode "${name}" updated.`, type: 'success' });
    } else {
      addSettlementMode({
        name,
        glCode: glCode.trim().toUpperCase(),
        chargePercentage: Number(chargePercentage),
        isActive,
        notes: notes.trim(),
      });
      setNotification({ message: `Settlement mode "${name}" created.`, type: 'success' });
    }

    setIsCreating(false);
    setEditingMode(null);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDelete = (id: string, modeName: string) => {
    if (window.confirm(`Are you sure you want to delete settlement mode "${modeName}"?`)) {
      const res = deleteSettlementMode(id);
      if (res.success) {
        setNotification({ message: res.message, type: 'success' });
      } else {
        setNotification({ message: res.message, type: 'error' });
      }
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const filtered = settlementModesMaster.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.glCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-sky-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-sky-100 bg-gradient-to-r from-teal-50 via-cyan-50/50 to-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-600 text-white shadow-sm">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-800">
                  Settlement Modes & GL Accounts Master
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                  {settlementModesMaster.length} Modes
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Configure payment channels, General Ledger (GL) posting codes, and merchant discount rates (MDR).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && !isCreating && !editingMode && (
              <button
                onClick={startCreate}
                className="px-3.5 py-1.5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-xs font-semibold rounded-xl hover:from-teal-700 hover:to-cyan-700 shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Settlement Mode</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Master Sub-Navigation */}
        {onSelectTab && (
          <div className="px-6 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-xs shrink-0">
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">All Masters:</span>
            <button onClick={() => onSelectTab('venues')} className="px-2.5 py-1 rounded-md text-slate-600 hover:bg-white transition-colors">Venues</button>
            <button onClick={() => onSelectTab('menuPackages')} className="px-2.5 py-1 rounded-md text-slate-600 hover:bg-white transition-colors">Menu Packages</button>
            <button onClick={() => onSelectTab('inclusions')} className="px-2.5 py-1 rounded-md text-slate-600 hover:bg-white transition-colors">Inclusions</button>
            <button onClick={() => onSelectTab('eventTypes')} className="px-2.5 py-1 rounded-md text-slate-600 hover:bg-white transition-colors">Event Types</button>
            <button onClick={() => onSelectTab('corporateClients')} className="px-2.5 py-1 rounded-md text-slate-600 hover:bg-white transition-colors">Corporate Clients</button>
            <button onClick={() => onSelectTab('leadSources')} className="px-2.5 py-1 rounded-md text-slate-600 hover:bg-white transition-colors">Lead Sources</button>
            <button onClick={() => onSelectTab('accountHandlers')} className="px-2.5 py-1 rounded-md text-slate-600 hover:bg-white transition-colors">KAMs</button>
            <button onClick={() => onSelectTab('settlementModes')} className="px-2.5 py-1 rounded-md bg-teal-600 text-white font-bold transition-colors shadow-xs">Settlement Modes</button>
            <button onClick={() => onSelectTab('invoiceSeries')} className="px-2.5 py-1 rounded-md text-slate-600 hover:bg-white transition-colors">Invoice Series</button>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {notification && (
            <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              notification.type === 'error'
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}>
              <span>{notification.message}</span>
            </div>
          )}

          {/* Form */}
          {(isCreating || editingMode) && (
            <form onSubmit={handleSave} className="p-4 bg-sky-50/50 border border-sky-200 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {editingMode ? 'Edit Settlement Mode' : 'New Settlement Mode'}
                </h4>
                <button
                  type="button"
                  onClick={() => { setIsCreating(false); setEditingMode(null); }}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Payment Mode Name</label>
                  <select
                    value={name}
                    onChange={e => setName(e.target.value as SettlementMode)}
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-semibold"
                  >
                    {DEFAULT_MODES.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">GL Account Code *</label>
                  <input
                    type="text"
                    value={glCode}
                    onChange={e => setGlCode(e.target.value.toUpperCase())}
                    placeholder="GL-1020-CARD"
                    required
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-mono uppercase font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">MDR / Charge (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={chargePercentage}
                    onChange={e => setChargePercentage(Number(e.target.value))}
                    placeholder="e.g. 1.8"
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Status</label>
                  <select
                    value={isActive ? 'Active' : 'Inactive'}
                    onChange={e => setIsActive(e.target.value === 'Active')}
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white"
                  >
                    <option value="Active">Active (Available at Cashier)</option>
                    <option value="Inactive">Inactive / Suspended</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold text-xs">Notes / Clearing Account</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Settled next day via HDFC Merchant Gateway"
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsCreating(false); setEditingMode(null); }}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
                >
                  Save Mode
                </button>
              </div>
            </form>
          )}

          {/* Search bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search settlement modes by name or GL code..."
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Settlement Channel</th>
                  <th className="px-4 py-3">General Ledger Code</th>
                  <th className="px-4 py-3 text-right">MDR / Charge</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Notes</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(mode => (
                  <tr key={mode.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-semibold text-slate-800 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-teal-600" />
                      <span>{mode.name}</span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-700">{mode.glCode}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">
                      {mode.chargePercentage ? `${mode.chargePercentage}%` : '0% (Direct)'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        mode.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {mode.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-[11px] max-w-xs truncate">{mode.notes || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {canEdit && (
                          <button
                            onClick={() => startEdit(mode)}
                            className="p-1 hover:bg-slate-100 text-slate-600 rounded"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canEdit && (
                          <button
                            onClick={() => handleDelete(mode.id, mode.name)}
                            className="p-1 hover:bg-red-50 text-red-600 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

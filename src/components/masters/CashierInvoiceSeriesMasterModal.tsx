import React, { useState } from 'react';
import { useBEMS } from '../../context/BEMSContext';
import { CashierInvoiceSeriesMaster } from '../../types';
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  X,
  Search,
  Hash,
} from 'lucide-react';

interface CashierInvoiceSeriesMasterModalProps {
  onClose: () => void;
  onSelectTab?: (tab: string) => void;
}

export const CashierInvoiceSeriesMasterModal: React.FC<CashierInvoiceSeriesMasterModalProps> = ({ onClose, onSelectTab }) => {
  const { cashierInvoiceSeriesMaster, addCashierInvoiceSeries, updateCashierInvoiceSeries, deleteCashierInvoiceSeries, currentUser, activeUnit } = useBEMS();
  const canEdit = currentUser?.role === 'Admin' || currentUser?.role === 'Editor';

  const [searchQuery, setSearchQuery] = useState('');
  const [editingSeries, setEditingSeries] = useState<CashierInvoiceSeriesMaster | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'error' | 'success' } | null>(null);

  // Form Fields
  const [seriesPrefix, setSeriesPrefix] = useState(`INV-${activeUnit.code}-2026`);
  const [currentSequence, setCurrentSequence] = useState<number>(1);
  const [financialYear, setFinancialYear] = useState('2026-2027');
  const [cashierCounter, setCashierCounter] = useState('COUNTER-1');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [notes, setNotes] = useState('');

  const startCreate = () => {
    setEditingSeries(null);
    setIsCreating(true);
    setSeriesPrefix(`INV-${activeUnit.code}-2026`);
    setCurrentSequence(1);
    setFinancialYear('2026-2027');
    setCashierCounter('COUNTER-1');
    setIsActive(true);
    setNotes('');
    setNotification(null);
  };

  const startEdit = (series: CashierInvoiceSeriesMaster) => {
    setEditingSeries(series);
    setIsCreating(false);
    setSeriesPrefix(series.seriesPrefix);
    setCurrentSequence(series.currentSequence);
    setFinancialYear(series.financialYear);
    setCashierCounter(series.cashierCounter);
    setIsActive(series.isActive);
    setNotes(series.notes || '');
    setNotification(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!seriesPrefix.trim()) {
      setNotification({ message: 'Series prefix is required.', type: 'error' });
      return;
    }

    if (editingSeries) {
      updateCashierInvoiceSeries({
        ...editingSeries,
        seriesPrefix: seriesPrefix.trim().toUpperCase(),
        currentSequence: Number(currentSequence),
        financialYear,
        cashierCounter,
        isActive,
        notes: notes.trim(),
      });
      setNotification({ message: `Series "${seriesPrefix}" updated.`, type: 'success' });
    } else {
      addCashierInvoiceSeries({
        seriesPrefix: seriesPrefix.trim().toUpperCase(),
        currentSequence: Number(currentSequence),
        financialYear,
        cashierCounter,
        isActive,
        notes: notes.trim(),
      });
      setNotification({ message: `Series "${seriesPrefix}" created.`, type: 'success' });
    }

    setIsCreating(false);
    setEditingSeries(null);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDelete = (id: string, prefix: string) => {
    if (window.confirm(`Are you sure you want to delete invoice series "${prefix}"?`)) {
      const res = deleteCashierInvoiceSeries(id);
      if (res.success) {
        setNotification({ message: res.message, type: 'success' });
      } else {
        setNotification({ message: res.message, type: 'error' });
      }
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const filtered = cashierInvoiceSeriesMaster.filter(s =>
    s.seriesPrefix.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.cashierCounter.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-sky-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-sky-100 bg-gradient-to-r from-teal-50 via-cyan-50/50 to-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-600 text-white shadow-sm">
              <Hash className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-800">
                  Cashier & Invoice Numbering Series Master
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                  {cashierInvoiceSeriesMaster.length} Series
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Manage GST sequential invoice prefixes, cashier counter registers, and fiscal year sequence resets.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && !isCreating && !editingSeries && (
              <button
                onClick={startCreate}
                className="px-3.5 py-1.5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-xs font-semibold rounded-xl hover:from-teal-700 hover:to-cyan-700 shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Series</span>
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
            <button onClick={() => onSelectTab('settlementModes')} className="px-2.5 py-1 rounded-md text-slate-600 hover:bg-white transition-colors">Settlement Modes</button>
            <button onClick={() => onSelectTab('invoiceSeries')} className="px-2.5 py-1 rounded-md bg-teal-600 text-white font-bold transition-colors shadow-xs">Invoice Series</button>
          </div>
        )}

        {/* Content */}
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
          {(isCreating || editingSeries) && (
            <form onSubmit={handleSave} className="p-4 bg-sky-50/50 border border-sky-200 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {editingSeries ? 'Edit Invoice Series' : 'New Invoice Numbering Series'}
                </h4>
                <button
                  type="button"
                  onClick={() => { setIsCreating(false); setEditingSeries(null); }}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Series Prefix *</label>
                  <input
                    type="text"
                    value={seriesPrefix}
                    onChange={e => setSeriesPrefix(e.target.value.toUpperCase())}
                    placeholder="INV-TN01-2026"
                    required
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-mono uppercase font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Current Sequence</label>
                  <input
                    type="number"
                    value={currentSequence}
                    onChange={e => setCurrentSequence(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Financial Year</label>
                  <input
                    type="text"
                    value={financialYear}
                    onChange={e => setFinancialYear(e.target.value)}
                    placeholder="2026-2027"
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Cashier Counter</label>
                  <select
                    value={cashierCounter}
                    onChange={e => setCashierCounter(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-semibold"
                  >
                    <option value="COUNTER-1">COUNTER-1 (Banquet Sales Desk)</option>
                    <option value="COUNTER-2">COUNTER-2 (Front Desk Main)</option>
                    <option value="ACCOUNTS-DESK">ACCOUNTS-DESK (Finance Hub)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold text-xs">Notes / Fiscal Audit Description</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Standard GST Tax Invoices Series for Property Banquet Sales"
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsCreating(false); setEditingSeries(null); }}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
                >
                  Save Series
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
                placeholder="Search invoice numbering series..."
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Series Prefix</th>
                  <th className="px-4 py-3">Next Invoice # Preview</th>
                  <th className="px-4 py-3">Fiscal Year</th>
                  <th className="px-4 py-3">Counter Station</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(series => (
                  <tr key={series.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{series.seriesPrefix}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-teal-700">
                      {series.seriesPrefix}-{String(series.currentSequence).padStart(4, '0')}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{series.financialYear}</td>
                    <td className="px-4 py-3 text-slate-700 font-medium">{series.cashierCounter}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        series.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {series.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {canEdit && (
                          <button
                            onClick={() => startEdit(series)}
                            className="p-1 hover:bg-slate-100 text-slate-600 rounded"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canEdit && (
                          <button
                            onClick={() => handleDelete(series.id, series.seriesPrefix)}
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

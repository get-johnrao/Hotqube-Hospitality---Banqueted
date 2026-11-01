import React, { useState, useMemo } from 'react';
import { useBEMS } from '../../context/BEMSContext';
import { InclusionMaster } from '../../types';
import { formatINR, calculateFromInclusiveRate } from '../../utils/formatters';
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  SlidersHorizontal,
  Info,
  CheckCircle2,
  Tv,
  Layers,
} from 'lucide-react';

interface InclusionMasterModalProps {
  onClose: () => void;
  onSelectTab?: (tab: string) => void;
}

const INCLUSION_CATEGORIES: InclusionMaster['category'][] = [
  'AV & Sound',
  'Decor & Stage',
  'Amenities',
  'F&B Counters',
  'Meeting Support',
  'Other',
];

export const InclusionMasterModal: React.FC<InclusionMasterModalProps> = ({ onClose, onSelectTab }) => {
  const { inclusionsMaster, addInclusion, updateInclusion, deleteInclusion, currentUser } = useBEMS();
  const canEdit = currentUser?.role === 'Admin' || currentUser?.role === 'Editor';

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterPricing, setFilterPricing] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  const [editingInc, setEditingInc] = useState<InclusionMaster | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'error' | 'success' } | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState<InclusionMaster['category']>('AV & Sound');
  const [pricingType, setPricingType] = useState<'Complimentary' | 'Chargeable'>('Complimentary');
  const [defaultRate, setDefaultRate] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

  // All-inclusive rate entry state
  const [isInclusiveMode, setIsInclusiveMode] = useState<boolean>(false);
  const [inclusiveRate, setInclusiveRate] = useState<number | ''>('');
  const [inclusiveTaxRate, setInclusiveTaxRate] = useState<number>(18.0);

  const handleInclusiveRateChange = (valStr: string, taxR: number = inclusiveTaxRate) => {
    if (valStr === '') {
      setInclusiveRate('');
      return;
    }
    const val = parseFloat(valStr) || 0;
    setInclusiveRate(val);
    const { baseRate } = calculateFromInclusiveRate(val, taxR);
    setDefaultRate(baseRate);
  };

  const startCreate = () => {
    setEditingInc(null);
    setIsCreating(true);
    setName('');
    setCategory('AV & Sound');
    setPricingType('Complimentary');
    setDefaultRate(0);
    setDescription('');
    setStatus('Active');
    setIsInclusiveMode(false);
    setInclusiveRate('');
    setNotification(null);
  };

  const startEdit = (inc: InclusionMaster) => {
    setEditingInc(inc);
    setIsCreating(false);
    setName(inc.name);
    setCategory(inc.category);
    setPricingType(inc.pricingType);
    setDefaultRate(inc.defaultRate);
    setDescription(inc.description || '');
    setStatus(inc.status);
    setIsInclusiveMode(false);
    setInclusiveRate('');
    setNotification(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNotification({ message: 'Item name is required.', type: 'error' });
      return;
    }

    if (isCreating) {
      addInclusion({
        name: name.trim(),
        category,
        pricingType,
        defaultRate: pricingType === 'Complimentary' ? 0 : Number(defaultRate),
        description: description.trim(),
        status,
      });
      setNotification({ message: `Inclusion "${name.trim()}" successfully created.`, type: 'success' });
    } else if (editingInc) {
      updateInclusion({
        ...editingInc,
        name: name.trim(),
        category,
        pricingType,
        defaultRate: pricingType === 'Complimentary' ? 0 : Number(defaultRate),
        description: description.trim(),
        status,
      });
      setNotification({ message: `Inclusion "${name.trim()}" updated successfully.`, type: 'success' });
    }

    setIsCreating(false);
    setEditingInc(null);
  };

  const handleDelete = (id: string, incName: string) => {
    if (!window.confirm(`Are you sure you want to delete inclusion "${incName}"?`)) return;
    const res = deleteInclusion(id);
    if (res.success) {
      setNotification({ message: res.message, type: 'success' });
    } else {
      setNotification({ message: res.message, type: 'error' });
    }
  };

  const filteredInclusions = useMemo(() => {
    return inclusionsMaster.filter(inc => {
      const matchesSearch =
        inc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inc.description && inc.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = filterCategory === 'All' || inc.category === filterCategory;
      const matchesPricing = filterPricing === 'All' || inc.pricingType === filterPricing;
      const matchesStatus = filterStatus === 'All' || inc.status === filterStatus;
      return matchesSearch && matchesCategory && matchesPricing && matchesStatus;
    });
  }, [inclusionsMaster, searchQuery, filterCategory, filterPricing, filterStatus]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-sky-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-sky-100 bg-gradient-to-r from-teal-50 via-cyan-50/50 to-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-600 text-white shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-800">
                  Inclusions & Add-On Equipment Master
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                  {inclusionsMaster.length} Items
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Configure complimentary ballroom amenities, chargeable AV rentals, decor, and live station add-ons.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && !isCreating && !editingInc && (
              <button
                onClick={startCreate}
                className="px-3.5 py-1.5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-xs font-semibold rounded-xl hover:from-teal-700 hover:to-cyan-700 shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Inclusion Item</span>
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
          <div className="px-6 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-xs">
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">All Masters:</span>
            <button onClick={() => onSelectTab('venues')} className="px-2.5 py-1 rounded-md text-slate-600 hover:bg-white transition-colors">Venues</button>
            <button onClick={() => onSelectTab('menuPackages')} className="px-2.5 py-1 rounded-md text-slate-600 hover:bg-white transition-colors">Menu Packages</button>
            <button className="px-2.5 py-1 rounded-md bg-teal-600 text-white font-bold shadow-xs">Inclusions & Add-Ons</button>
            <button onClick={() => onSelectTab('eventTypes')} className="px-2.5 py-1 rounded-md text-slate-600 hover:bg-white transition-colors">Event Types</button>
            <button onClick={() => onSelectTab('corporateClients')} className="px-2.5 py-1 rounded-md text-slate-600 hover:bg-white transition-colors">Corporate Clients</button>
            <button onClick={() => onSelectTab('leadSources')} className="px-2.5 py-1 rounded-md text-slate-600 hover:bg-white transition-colors">Lead Sources</button>
          </div>
        )}

        {/* Notification Banner */}
        {notification && (
          <div
            className={`px-6 py-2.5 flex items-center justify-between text-xs font-medium ${
              notification.type === 'error'
                ? 'bg-red-50 text-red-700 border-b border-red-200'
                : notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border-b border-emerald-200'
                : 'bg-sky-50 text-sky-700 border-b border-sky-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <Info className="w-4 h-4 shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {/* Create or Edit Form */}
          {(isCreating || editingInc) && canEdit ? (
            <form onSubmit={handleSave} className="p-5 bg-sky-50/50 border border-sky-200 rounded-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-sky-200/80">
                <div className="flex items-center gap-2">
                  <Tv className="w-4 h-4 text-teal-600" />
                  <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide">
                    {isCreating ? 'Create New Inclusion / Equipment Item' : `Edit Item: ${editingInc?.name}`}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingInc(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-bold mb-1">Item Title / Equipment Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. LED Video Wall (8x12 ft P3 HD Display)"
                    className="w-full p-2 bg-white border border-sky-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="w-full p-2 bg-white border border-sky-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                  >
                    {INCLUSION_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Pricing Model *</label>
                  <select
                    value={pricingType}
                    onChange={e => {
                      const newPricing = e.target.value as 'Complimentary' | 'Chargeable';
                      setPricingType(newPricing);
                      if (newPricing === 'Complimentary') setDefaultRate(0);
                    }}
                    className="w-full p-2 bg-white border border-sky-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                  >
                    <option value="Complimentary">Complimentary (Free with hall booking)</option>
                    <option value="Chargeable">Chargeable (Billed as add-on)</option>
                  </select>
                </div>

                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-slate-700 font-bold text-xs">
                      {isInclusiveMode ? 'All-Inclusive Net Tariff *' : `Standard Tariff (INR) ${pricingType === 'Complimentary' ? '(₹0 Free)' : ''}`}
                    </label>
                    {pricingType === 'Chargeable' && (
                      <label className="flex items-center gap-1.5 cursor-pointer select-none text-[11px] font-semibold text-teal-700">
                        <input
                          type="checkbox"
                          checked={isInclusiveMode}
                          onChange={e => {
                            const checked = e.target.checked;
                            setIsInclusiveMode(checked);
                            if (checked) {
                              const inc = Math.round(defaultRate * (1 + inclusiveTaxRate / 100));
                              setInclusiveRate(inc);
                            }
                          }}
                          className="w-3.5 h-3.5 rounded text-teal-600 border-teal-300 focus:ring-teal-500"
                        />
                        <span>All-Inclusive Rate</span>
                      </label>
                    )}
                  </div>

                  {pricingType === 'Chargeable' && isInclusiveMode ? (
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-2 text-teal-600 font-bold">₹</span>
                          <input
                            type="number"
                            value={inclusiveRate}
                            placeholder="e.g. 1239"
                            onChange={e => handleInclusiveRateChange(e.target.value)}
                            className="w-full pl-7 pr-3 py-2 bg-white border border-teal-300 rounded-lg text-teal-950 font-mono font-bold focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                            min={0}
                            step={1}
                            required
                          />
                        </div>
                        <select
                          value={inclusiveTaxRate}
                          onChange={e => {
                            const newR = parseFloat(e.target.value);
                            setInclusiveTaxRate(newR);
                            if (inclusiveRate !== '') {
                              handleInclusiveRateChange(String(inclusiveRate), newR);
                            }
                          }}
                          className="py-2 px-2.5 bg-white border border-teal-300 rounded-lg text-xs font-mono font-bold text-teal-800 outline-none"
                        >
                          <option value="18.0">18.0% Tax</option>
                          <option value="21.0">21.0% Tax</option>
                          <option value="23.9">23.9% Tax</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between text-[11px] bg-teal-50/80 p-2 rounded-lg border border-teal-100 font-mono">
                        <span className="text-teal-700">Calculated Base:</span>
                        <strong className="text-teal-900 font-bold">
                          ₹{defaultRate} + ₹{Math.round(defaultRate * (inclusiveTaxRate / 100))} Tax
                        </strong>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        value={defaultRate}
                        onChange={e => setDefaultRate(Number(e.target.value))}
                        disabled={pricingType === 'Complimentary'}
                        className="w-full pl-7 pr-3 py-2 bg-white border border-sky-200 rounded-lg text-slate-800 font-mono font-bold disabled:bg-slate-100 disabled:text-slate-400 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                        min={0}
                        step={500}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Status *</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full p-2 bg-white border border-sky-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                  >
                    <option value="Active">Active (Visible in enquiries)</option>
                    <option value="Inactive">Inactive (Unavailable)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Specifications & Vendor Operational Notes</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  placeholder="e.g. Requires 3-phase 16A power connection, includes on-site AV technician..."
                  className="w-full p-2 bg-white border border-sky-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingInc(null);
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl hover:bg-white font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {isCreating ? 'Save New Inclusion' : 'Update Item'}
                </button>
              </div>
            </form>
          ) : null}

          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search equipment, sound, decor or amenities..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-1.5 text-slate-500">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="font-semibold text-[11px]">Filter:</span>
              </div>
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 text-xs font-medium"
              >
                <option value="All">All Categories</option>
                {INCLUSION_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <select
                value={filterPricing}
                onChange={e => setFilterPricing(e.target.value)}
                className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 text-xs font-medium"
              >
                <option value="All">All Pricing</option>
                <option value="Complimentary">Complimentary</option>
                <option value="Chargeable">Chargeable</option>
              </select>

              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 text-xs font-medium"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active Only</option>
                <option value="Inactive">Inactive Only</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="p-3">Inclusion Item</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-center">Type</th>
                  <th className="p-3 text-right">Standard Rate</th>
                  <th className="p-3">Specifications</th>
                  <th className="p-3 text-center">Status</th>
                  {canEdit && <th className="p-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 bg-white">
                {filteredInclusions.length === 0 ? (
                  <tr>
                    <td colSpan={canEdit ? 7 : 6} className="p-8 text-center text-slate-400">
                      No inclusion items found matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredInclusions.map(inc => (
                    <tr key={inc.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 font-bold text-slate-800">
                        {inc.name}
                      </td>
                      <td className="p-3">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                          {inc.category}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          inc.pricingType === 'Complimentary'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {inc.pricingType}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-800">
                        {inc.pricingType === 'Complimentary' ? (
                          <span className="text-emerald-600 font-semibold">Included (₹0)</span>
                        ) : (
                          <span className="text-teal-700">{formatINR(inc.defaultRate)}</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-500 max-w-xs text-[11px]">
                        {inc.description || '—'}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          inc.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {inc.status}
                        </span>
                      </td>
                      {canEdit && (
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => startEdit(inc)}
                              className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Item"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(inc.id, inc.name)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <strong className="text-slate-700">{filteredInclusions.length}</strong> of{' '}
            <strong className="text-slate-700">{inclusionsMaster.length}</strong> inclusion items configured
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

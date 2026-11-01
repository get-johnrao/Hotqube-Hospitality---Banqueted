import React, { useState, useMemo } from 'react';
import { useBEMS } from '../../context/BEMSContext';
import { MenuPackageMaster, MenuCategory } from '../../types';
import { MENU_CATEGORIES } from '../../data/initialData';
import { formatINR, calculateFromInclusiveRate } from '../../utils/formatters';
import {
  UtensilsCrossed,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  SlidersHorizontal,
  Info,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface MenuPackageMasterModalProps {
  onClose: () => void;
  onSelectTab?: (tab: string) => void;
}

export const MenuPackageMasterModal: React.FC<MenuPackageMasterModalProps> = ({ onClose, onSelectTab }) => {
  const { menuPackages, addMenuPackage, updateMenuPackage, deleteMenuPackage, currentUser } = useBEMS();
  const canEdit = currentUser?.role === 'Admin' || currentUser?.role === 'Editor';

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  const [editingPkg, setEditingPkg] = useState<MenuPackageMaster | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'error' | 'success' } | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState<MenuCategory>('Veg');
  const [baseRatePerPax, setBaseRatePerPax] = useState<number>(1500);
  const [minimumPax, setMinimumPax] = useState<number>(50);
  const [courseDetails, setCourseDetails] = useState('');
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
    setBaseRatePerPax(baseRate);
  };

  const startCreate = () => {
    setEditingPkg(null);
    setIsCreating(true);
    setName('');
    setCategory('Veg');
    setBaseRatePerPax(1600);
    setMinimumPax(50);
    setCourseDetails('');
    setDescription('');
    setStatus('Active');
    setIsInclusiveMode(false);
    setInclusiveRate('');
    setNotification(null);
  };

  const startEdit = (pkg: MenuPackageMaster) => {
    setEditingPkg(pkg);
    setIsCreating(false);
    setName(pkg.name);
    setCategory(pkg.category);
    setBaseRatePerPax(pkg.baseRatePerPax);
    setMinimumPax(pkg.minimumPax);
    setCourseDetails(pkg.courseDetails);
    setDescription(pkg.description || '');
    setStatus(pkg.status);
    setIsInclusiveMode(false);
    setInclusiveRate('');
    setNotification(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNotification({ message: 'Package Name is required.', type: 'error' });
      return;
    }
    if (baseRatePerPax <= 0) {
      setNotification({ message: 'Base Rate per Pax must be greater than 0.', type: 'error' });
      return;
    }

    if (isCreating) {
      addMenuPackage({
        name: name.trim(),
        category,
        baseRatePerPax: Number(baseRatePerPax),
        minimumPax: Number(minimumPax) || 25,
        courseDetails: courseDetails.trim() || 'Standard multi-course banquet menu.',
        description: description.trim(),
        status,
      });
      setNotification({ message: `Package "${name.trim()}" successfully created.`, type: 'success' });
    } else if (editingPkg) {
      updateMenuPackage({
        ...editingPkg,
        name: name.trim(),
        category,
        baseRatePerPax: Number(baseRatePerPax),
        minimumPax: Number(minimumPax) || 25,
        courseDetails: courseDetails.trim() || 'Standard multi-course banquet menu.',
        description: description.trim(),
        status,
      });
      setNotification({ message: `Package "${name.trim()}" updated successfully.`, type: 'success' });
    }

    setIsCreating(false);
    setEditingPkg(null);
  };

  const handleDelete = (id: string, pkgName: string) => {
    if (!window.confirm(`Are you sure you want to delete menu package "${pkgName}"?`)) return;
    const res = deleteMenuPackage(id);
    if (res.success) {
      setNotification({ message: res.message, type: 'success' });
    } else {
      setNotification({ message: res.message, type: 'error' });
    }
  };

  const filteredPackages = useMemo(() => {
    return menuPackages.filter(pkg => {
      const matchesSearch =
        pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pkg.courseDetails.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (pkg.description && pkg.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = filterCategory === 'All' || pkg.category === filterCategory;
      const matchesStatus = filterStatus === 'All' || pkg.status === filterStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [menuPackages, searchQuery, filterCategory, filterStatus]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-sky-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-sky-100 bg-gradient-to-r from-teal-50 via-cyan-50/50 to-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-600 text-white shadow-sm">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-800">
                  F&B Menu Package & Rate Master
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                  {menuPackages.length} Packages
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Manage banquet catering packages, course compositions, minimum guarantees & per-pax pricing.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && !isCreating && !editingPkg && (
              <button
                onClick={startCreate}
                className="px-3.5 py-1.5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-xs font-semibold rounded-xl hover:from-teal-700 hover:to-cyan-700 shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Package</span>
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

        {/* Master Sub-Navigation (if parent provides tab switching) */}
        {onSelectTab && (
          <div className="px-6 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-xs">
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">All Masters:</span>
            <button onClick={() => onSelectTab('venues')} className="px-2.5 py-1 rounded-md text-slate-600 hover:bg-white transition-colors">Venues</button>
            <button className="px-2.5 py-1 rounded-md bg-teal-600 text-white font-bold shadow-xs">Menu Packages</button>
            <button onClick={() => onSelectTab('inclusions')} className="px-2.5 py-1 rounded-md text-slate-600 hover:bg-white transition-colors">Inclusions & Add-Ons</button>
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
          {(isCreating || editingPkg) && canEdit ? (
            <form onSubmit={handleSave} className="p-5 bg-sky-50/50 border border-sky-200 rounded-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-sky-200/80">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide">
                    {isCreating ? 'Create New F&B Menu Package' : `Edit Package: ${editingPkg?.name}`}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingPkg(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Package Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Royal South Indian Feast"
                    className="w-full p-2 bg-white border border-sky-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">F&B Classification *</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as MenuCategory)}
                    className="w-full p-2 bg-white border border-sky-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                  >
                    {MENU_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-slate-700 font-bold text-xs">
                      {isInclusiveMode ? 'All-Inclusive Net Rate Per Pax *' : 'Base Rate Per Pax (INR) *'}
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none text-[11px] font-semibold text-teal-700">
                      <input
                        type="checkbox"
                        checked={isInclusiveMode}
                        onChange={e => {
                          const checked = e.target.checked;
                          setIsInclusiveMode(checked);
                          if (checked) {
                            const inc = Math.round(baseRatePerPax * (1 + inclusiveTaxRate / 100));
                            setInclusiveRate(inc);
                          }
                        }}
                        className="w-3.5 h-3.5 rounded text-teal-600 border-teal-300 focus:ring-teal-500"
                      />
                      <span>All-Inclusive Rate</span>
                    </label>
                  </div>

                  {isInclusiveMode ? (
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
                            min={100}
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
                          ₹{baseRatePerPax} + ₹{Math.round(baseRatePerPax * (inclusiveTaxRate / 100))} Tax
                        </strong>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        value={baseRatePerPax}
                        onChange={e => setBaseRatePerPax(Number(e.target.value))}
                        className="w-full pl-7 pr-3 py-2 bg-white border border-sky-200 rounded-lg text-slate-800 font-mono font-bold focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                        min={100}
                        step={50}
                        required
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Minimum Pax Commitment</label>
                  <input
                    type="number"
                    value={minimumPax}
                    onChange={e => setMinimumPax(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-sky-200 rounded-lg text-slate-800 font-mono focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                    min={10}
                    step={5}
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Status *</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full p-2 bg-white border border-sky-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                  >
                    <option value="Active">Active (Available for Quoting)</option>
                    <option value="Inactive">Inactive (Archived)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Target Function Type</label>
                  <input
                    type="text"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="e.g. Auspicious receptions, Corporate dinners"
                    className="w-full p-2 bg-white border border-sky-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Course Details & Inclusions Composition *</label>
                <textarea
                  value={courseDetails}
                  onChange={e => setCourseDetails(e.target.value)}
                  rows={3}
                  placeholder="Detail starters, soups, mains, rice varieties, live counters, desserts & beverages included in this package..."
                  className="w-full p-2.5 bg-white border border-sky-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingPkg(null);
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl hover:bg-white font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {isCreating ? 'Save New Package' : 'Update Package'}
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
                placeholder="Search packages by title, dish or description..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
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
                {MENU_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
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

          {/* Packages Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="p-3">Package Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-right">Base Rate / Pax</th>
                  <th className="p-3 text-center">Min. Pax</th>
                  <th className="p-3">Courses & Composition</th>
                  <th className="p-3 text-center">Status</th>
                  {canEdit && <th className="p-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 bg-white">
                {filteredPackages.length === 0 ? (
                  <tr>
                    <td colSpan={canEdit ? 7 : 6} className="p-8 text-center text-slate-400">
                      No menu packages found matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredPackages.map(pkg => (
                    <tr key={pkg.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 font-bold text-slate-800">
                        <div>{pkg.name}</div>
                        {pkg.description && (
                          <div className="text-[10px] text-slate-400 font-normal mt-0.5 line-clamp-1">{pkg.description}</div>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          pkg.category === 'Veg'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : pkg.category === 'Mixed Nonveg'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}>
                          {pkg.category}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-teal-700">
                        {formatINR(pkg.baseRatePerPax)}
                      </td>
                      <td className="p-3 text-center font-mono text-slate-600">
                        {pkg.minimumPax} pax
                      </td>
                      <td className="p-3 text-slate-600 max-w-xs">
                        <p className="line-clamp-2 text-[11px] leading-relaxed" title={pkg.courseDetails}>
                          {pkg.courseDetails}
                        </p>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          pkg.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {pkg.status}
                        </span>
                      </td>
                      {canEdit && (
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => startEdit(pkg)}
                              className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Package Parameters"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(pkg.id, pkg.name)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Package"
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
            Showing <strong className="text-slate-700">{filteredPackages.length}</strong> of{' '}
            <strong className="text-slate-700">{menuPackages.length}</strong> packages configured
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

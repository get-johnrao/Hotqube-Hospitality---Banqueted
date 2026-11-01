import React, { useState } from 'react';
import { useBEMS } from '../context/BEMSContext';
import { HotelUnit } from '../types';
import {
  Building2,
  Plus,
  X,
  Check,
  AlertCircle,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface PropertyManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PropertyManagementModal: React.FC<PropertyManagementModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    units,
    activeUnitCode,
    switchUnit,
    createUnit,
    updateUnit,
    resetSampleUnit,
    exportUnitBackupJSON,
    importUnitBackupJSON,
    currentUser,
  } = useBEMS();

  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'backup'>('list');
  const [editingUnit, setEditingUnit] = useState<HotelUnit | null>(null);

  // New Unit Form State
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Backup file state
  const [backupMessage, setBackupMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const isSuperAdmin = currentUser?.role === 'SuperAdmin' || currentUser?.assignedUnitCode === 'ALL';

  const handleCreateUnit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!newCode.trim() || !newName.trim()) {
      setFormError('Unit Code and Property Name are required.');
      return;
    }

    const result = createUnit({
      code: newCode.trim().toUpperCase(),
      name: newName.trim(),
      subtitle: newSubtitle.trim() || `${newName.trim()} Banquets & Events`,
      address: newAddress.trim() || 'Hotel Address',
      phone: newPhone.trim() || '+91 98401 23456',
      email: newEmail.trim() || 'banquets@hotel.com',
      status: 'Active',
      createdAt: new Date().toISOString(),
    });

    if (result.success) {
      setFormSuccess(result.message);
      setNewCode('');
      setNewName('');
      setNewSubtitle('');
      setNewAddress('');
      setNewPhone('');
      setNewEmail('');
      setTimeout(() => {
        setActiveTab('list');
        setFormSuccess('');
      }, 1200);
    } else {
      setFormError(result.message);
    }
  };

  const handleDownloadUnitBackup = (code: string) => {
    try {
      const jsonStr = exportUnitBackupJSON(code);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BEMS_Unit_${code}_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setBackupMessage({ type: 'success', text: `Backup exported for Unit ${code}.` });
    } catch (e) {
      setBackupMessage({ type: 'error', text: 'Export failed: ' + (e as Error).message });
    }
  };

  const handleImportUnitBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const result = importUnitBackupJSON(text);
        if (result.success) {
          setBackupMessage({ type: 'success', text: result.message });
        } else {
          setBackupMessage({ type: 'error', text: result.message });
        }
      } catch (err) {
        setBackupMessage({ type: 'error', text: 'Error reading file: ' + (err as Error).message });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetTrial = () => {
    if (window.confirm('Reset TrialHall (SM00) to pristine blank state? All pitch enquiries in SM00 will be permanently purged.')) {
      resetSampleUnit();
      setBackupMessage({ type: 'success', text: 'TrialHall (SM00) purged. Fresh zero-booking pitch state restored.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-sky-200 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-sky-100 flex items-center justify-between bg-gradient-to-r from-sky-50 via-white to-teal-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 text-teal-800 rounded-xl">
              <Building2 className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                Multi-Property & Hotel Units Registry
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-bold">
                  {units.length} Units
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                {isSuperAdmin
                  ? 'Super-Admin Operations • Switch units, register new properties, or manage unit backups'
                  : `Scoped to Unit ${activeUnitCode} • View property info`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-sky-100 px-6 bg-sky-50/40 text-xs">
          <button
            onClick={() => setActiveTab('list')}
            className={`py-3 px-4 font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'list'
                ? 'border-teal-600 text-teal-700 font-bold bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Hotel Units ({units.length})</span>
          </button>

          {isSuperAdmin && (
            <button
              onClick={() => setActiveTab('add')}
              className={`py-3 px-4 font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'add'
                  ? 'border-teal-600 text-teal-700 font-bold bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Register New Property</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('backup')}
            className={`py-3 px-4 font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'backup'
                ? 'border-teal-600 text-teal-700 font-bold bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Unit Backup & Restore</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {backupMessage && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                backupMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {backupMessage.type === 'success' ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
              <span>{backupMessage.text}</span>
            </div>
          )}

          {/* TAB 1: LIST PROPERTIES */}
          {activeTab === 'list' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3">
                {units.map((unit) => {
                  const isActive = unit.code.toUpperCase() === activeUnitCode.toUpperCase();
                  return (
                    <div
                      key={unit.code}
                      className={`p-4 rounded-xl border transition-all ${
                        isActive
                          ? 'bg-teal-50/70 border-teal-300 ring-2 ring-teal-500/20 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-sky-300'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-sm shrink-0 ${
                              unit.isSampleUnit
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-teal-100 text-teal-800 border border-teal-300'
                            }`}
                          >
                            {unit.code}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-slate-800 text-sm">{unit.name}</h3>
                              {isActive && (
                                <span className="text-[10px] bg-teal-600 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  Current Active Unit
                                </span>
                              )}
                              {unit.isSampleUnit && (
                                <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-amber-600" />
                                  Sales Pitch Blank Unit
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5">{unit.subtitle}</p>
                            <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap gap-x-3">
                              <span>📍 {unit.address}</span>
                              <span>📞 {unit.phone}</span>
                              <span>✉️ {unit.email}</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          {isSuperAdmin && !isActive && (
                            <button
                              onClick={() => {
                                switchUnit(unit.code);
                                onClose();
                              }}
                              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <span>Switch to {unit.code}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => handleDownloadUnitBackup(unit.code)}
                            className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-sky-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                            title={`Export JSON Backup for ${unit.code}`}
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {unit.isSampleUnit && (
                            <button
                              onClick={handleResetTrial}
                              className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Reset SM00 to blank zero-booking state for live sales pitches"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                              <span>Reset Blank Pitch</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: REGISTER NEW PROPERTY (SuperAdmin only) */}
          {activeTab === 'add' && isSuperAdmin && (
            <form onSubmit={handleCreateUnit} className="space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              {formSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unit Code (2 Letters + 2 Digits) *
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    placeholder="e.g. KA01, DL02, MH01"
                    className="w-full px-3 py-2 border border-sky-200 rounded-xl font-mono uppercase text-sm focus:outline-none focus:border-teal-500"
                    required
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Nomenclature: 2 alphabets followed by 2 digits.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hotel Property Name *
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. The Residency Towers Bengaluru"
                    className="w-full px-3 py-2 border border-sky-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subtitle / Branding Description
                  </label>
                  <input
                    type="text"
                    value={newSubtitle}
                    onChange={(e) => setNewSubtitle(e.target.value)}
                    placeholder="e.g. Richmond Circle • Ultra Luxury Banquets & Convention Center"
                    className="w-full px-3 py-2 border border-sky-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Property Address
                  </label>
                  <input
                    type="text"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    placeholder="e.g. Residency Road, Central Bengaluru, Karnataka 560025"
                    className="w-full px-3 py-2 border border-sky-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Phone Number
                  </label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+91 80 4123 4567"
                    className="w-full px-3 py-2 border border-sky-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Official Banquets Email
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="banquets@blr.theresidency.com"
                    className="w-full px-3 py-2 border border-sky-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-sky-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-500/20 cursor-pointer"
                >
                  Register Unit
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: BACKUP & RESTORE PER UNIT */}
          {activeTab === 'backup' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl">
                <h4 className="font-bold text-slate-800 text-sm mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  Unit Data Isolation & Backup Portability
                </h4>
                <p className="text-slate-600 leading-relaxed">
                  As confirmed, each hotel unit maintains independent enquiries, banquet hall allocations, and quotation letterheads.
                  You can export and restore individual JSON backup packages for any specific unit without affecting other properties.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Export Card */}
                <div className="p-4 border border-slate-200 rounded-xl bg-white space-y-3">
                  <div className="font-bold text-slate-800 flex items-center gap-2">
                    <Download className="w-4 h-4 text-teal-600" />
                    <span>Export Active Unit ({activeUnitCode})</span>
                  </div>
                  <p className="text-slate-500">
                    Generates a complete standalone backup JSON file containing all banquet records, layouts, and masters for {activeUnitCode}.
                  </p>
                  <button
                    onClick={() => handleDownloadUnitBackup(activeUnitCode)}
                    className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download {activeUnitCode} Backup</span>
                  </button>
                </div>

                {/* Import Card */}
                <div className="p-4 border border-slate-200 rounded-xl bg-white space-y-3">
                  <div className="font-bold text-slate-800 flex items-center gap-2">
                    <Upload className="w-4 h-4 text-teal-600" />
                    <span>Restore Unit from Backup</span>
                  </div>
                  <p className="text-slate-500">
                    Upload a previously exported unit JSON backup file to restore records for this or a newly defined unit.
                  </p>
                  <label className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 text-center">
                    <Upload className="w-3.5 h-3.5 text-slate-600" />
                    <span>Select Backup JSON File</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportUnitBackup}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

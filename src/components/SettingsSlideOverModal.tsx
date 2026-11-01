import React, { useState } from 'react';
import { useBEMS } from '../context/BEMSContext';
import { MasterTabType } from './masters/BanquetMastersHubModal';
import {
  Settings,
  X,
  Building2,
  UtensilsCrossed,
  Sparkles,
  CalendarDays,
  Briefcase,
  Compass,
  UserCheck,
  CreditCard,
  FileText,
  Table,
  FileSpreadsheet,
  Download,
  Upload,
  ShieldAlert,
  KeyRound,
  LogOut,
  ChevronRight,
  ExternalLink,
  RotateCcw,
  RefreshCw,
  Coins,
  CheckCircle2,
} from 'lucide-react';
import { formatINR } from '../utils/formatters';

interface SettingsSlideOverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMaster: (tab: MasterTabType) => void;
  onOpenGoogleSheets: () => void;
  onOpenQuotationSettings: () => void;
  onOpenAuditLogs: () => void;
  onOpenPINChange: () => void;
  onOpenPropertyManagement: () => void;
}

export const SettingsSlideOverModal: React.FC<SettingsSlideOverModalProps> = ({
  isOpen,
  onClose,
  onOpenMaster,
  onOpenGoogleSheets,
  onOpenQuotationSettings,
  onOpenAuditLogs,
  onOpenPINChange,
  onOpenPropertyManagement,
}) => {
  const {
    currentUser,
    logout,
    activeUnit,
    activeUnitCode,
    googleSheetConfig,
    triggerGoogleSheetSync,
    exportUnitBackupJSON,
    importUnitBackupJSON,
    resetSampleUnit,
    cashierTallies,
  } = useBEMS();

  const [activeCategory, setActiveCategory] = useState<'masters' | 'billing' | 'sheets' | 'system'>('masters');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  if (!isOpen) return null;

  const isSuperAdmin = currentUser?.role === 'SuperAdmin' || currentUser?.assignedUnitCode === 'ALL';
  const isAdminOrEditor = currentUser?.role === 'Admin' || currentUser?.role === 'Editor' || isSuperAdmin;

  const handleExportBackup = () => {
    const json = exportUnitBackupJSON(activeUnitCode);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BEMS_Backup_${activeUnitCode}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const res = importUnitBackupJSON(text, activeUnitCode);
        if (res.success) {
          setImportStatus('Backup restored successfully!');
        } else {
          setImportStatus(`Restore failed: ${res.message}`);
        }
      } catch (err: any) {
        setImportStatus(`Invalid JSON file: ${err?.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleManualSyncNow = async () => {
    setIsSyncing(true);
    try {
      await triggerGoogleSheetSync(true);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col border-l border-sky-200 animate-in slide-in-from-right duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-sky-200/80 bg-gradient-to-r from-teal-900 via-cyan-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300">
              <Settings className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base tracking-tight text-white">Operations & System Masters</h2>
                <span className="font-mono text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-teal-500/30 text-teal-200 border border-teal-400/30">
                  {activeUnitCode}
                </span>
              </div>
              <p className="text-xs text-sky-200/80">
                {activeUnit.name} • {currentUser?.name} ({currentUser?.role})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-sky-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close Settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Navigation Bar */}
        <div className="flex border-b border-sky-100 bg-sky-50/60 text-xs px-4 pt-2 gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveCategory('masters')}
            className={`pb-2.5 px-3 font-semibold transition-all flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
              activeCategory === 'masters'
                ? 'border-teal-600 text-teal-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Banquet Masters</span>
          </button>

          <button
            onClick={() => setActiveCategory('billing')}
            className={`pb-2.5 px-3 font-semibold transition-all flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
              activeCategory === 'billing'
                ? 'border-teal-600 text-teal-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Billing & Cashier</span>
          </button>

          <button
            onClick={() => setActiveCategory('sheets')}
            className={`pb-2.5 px-3 font-semibold transition-all flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
              activeCategory === 'sheets'
                ? 'border-teal-600 text-teal-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sheets & Backup</span>
          </button>

          <button
            onClick={() => setActiveCategory('system')}
            className={`pb-2.5 px-3 font-semibold transition-all flex items-center gap-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
              activeCategory === 'system'
                ? 'border-teal-600 text-teal-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Units & Security</span>
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-sm">
          {/* CATEGORY 1: BANQUET MASTERS */}
          {activeCategory === 'masters' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-sky-100">
                <span className="text-xs uppercase font-extrabold tracking-wider text-teal-800">
                  Operational Banquet Masters
                </span>
                <span className="text-[11px] text-slate-500">Unit-Isolated Database</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  onClick={() => {
                    onClose();
                    onOpenMaster('venues');
                  }}
                  className="p-3 bg-white hover:bg-teal-50/60 border border-sky-200 rounded-xl text-left flex items-center justify-between transition-all group shadow-2xs cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-100/70 text-teal-700 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block text-xs group-hover:text-teal-900">
                        Venues & Layouts
                      </span>
                      <span className="text-[10px] text-slate-500">Capacities & Slots</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenMaster('menuPackages');
                  }}
                  className="p-3 bg-white hover:bg-teal-50/60 border border-sky-200 rounded-xl text-left flex items-center justify-between transition-all group shadow-2xs cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100/70 text-emerald-700 flex items-center justify-center shrink-0">
                      <UtensilsCrossed className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block text-xs group-hover:text-teal-900">
                        F&B Menu Packages
                      </span>
                      <span className="text-[10px] text-slate-500">Per-Pax Rates & Buffets</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenMaster('inclusions');
                  }}
                  className="p-3 bg-white hover:bg-teal-50/60 border border-sky-200 rounded-xl text-left flex items-center justify-between transition-all group shadow-2xs cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-100/70 text-cyan-700 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block text-xs group-hover:text-teal-900">
                        Inclusions & AV Equipment
                      </span>
                      <span className="text-[10px] text-slate-500">Sound, LED & Decors</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenMaster('eventTypes');
                  }}
                  className="p-3 bg-white hover:bg-teal-50/60 border border-sky-200 rounded-xl text-left flex items-center justify-between transition-all group shadow-2xs cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100/70 text-amber-700 flex items-center justify-center shrink-0">
                      <CalendarDays className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block text-xs group-hover:text-teal-900">
                        Event Types
                      </span>
                      <span className="text-[10px] text-slate-500">Weddings, AGMs, Birthdays</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenMaster('corporateClients');
                  }}
                  className="p-3 bg-white hover:bg-teal-50/60 border border-sky-200 rounded-xl text-left flex items-center justify-between transition-all group shadow-2xs cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100/70 text-indigo-700 flex items-center justify-center shrink-0">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block text-xs group-hover:text-teal-900">
                        Corporate Clients & Agencies
                      </span>
                      <span className="text-[10px] text-slate-500">Corporate Master & GSTINs</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenMaster('leadSources');
                  }}
                  className="p-3 bg-white hover:bg-teal-50/60 border border-sky-200 rounded-xl text-left flex items-center justify-between transition-all group shadow-2xs cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-100/70 text-rose-700 flex items-center justify-center shrink-0">
                      <Compass className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block text-xs group-hover:text-teal-900">
                        Lead Sources & Channels
                      </span>
                      <span className="text-[10px] text-slate-500">Walk-ins, OTAs, Web</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenMaster('accountHandlers');
                  }}
                  className="p-3 bg-white hover:bg-teal-50/60 border border-sky-200 rounded-xl text-left flex items-center justify-between transition-all group shadow-2xs cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-100/70 text-purple-700 flex items-center justify-center shrink-0">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block text-xs group-hover:text-teal-900">
                        Key Account Managers (KAM)
                      </span>
                      <span className="text-[10px] text-slate-500">Sales Executives</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenQuotationSettings();
                  }}
                  className="p-3 bg-white hover:bg-teal-50/60 border border-sky-200 rounded-xl text-left flex items-center justify-between transition-all group shadow-2xs cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-sky-100/70 text-sky-700 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block text-xs group-hover:text-teal-900">
                        Quotation Letterhead & Terms
                      </span>
                      <span className="text-[10px] text-slate-500">5 Rich Sections & Logo</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
                </button>
              </div>
            </div>
          )}

          {/* CATEGORY 2: BILLING & CASHIER TALLY */}
          {activeCategory === 'billing' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-sky-100">
                <span className="text-xs uppercase font-extrabold tracking-wider text-teal-800">
                  Billing, Invoice Series & Cashier Settlement
                </span>
                <span className="text-[11px] text-slate-500">POS & Ledger Integration</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  onClick={() => {
                    onClose();
                    onOpenMaster('settlementModes');
                  }}
                  className="p-3 bg-white hover:bg-teal-50/60 border border-sky-200 rounded-xl text-left flex items-center justify-between transition-all group shadow-2xs cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-100/70 text-teal-700 flex items-center justify-center shrink-0">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block text-xs group-hover:text-teal-900">
                        Settlement Modes Master
                      </span>
                      <span className="text-[10px] text-slate-500">Cash, Cards, UPI, NEFT</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenMaster('invoiceSeries');
                  }}
                  className="p-3 bg-white hover:bg-teal-50/60 border border-sky-200 rounded-xl text-left flex items-center justify-between transition-all group shadow-2xs cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-100/70 text-cyan-700 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block text-xs group-hover:text-teal-900">
                        Cashier Invoice Series Master
                      </span>
                      <span className="text-[10px] text-slate-500">Prefixes & Auto-Counters</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
                </button>
              </div>

              {/* Cashier Tally Overview */}
              <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-teal-600" />
                    Cashier Shift Reconciliations ({cashierTallies.length})
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">Shift-End Audited</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Shift tallies are automatically generated and balanced whenever advance receipts or final settlement invoices are posted in the Function Prospectus (FP) and Billing module.
                </p>
              </div>
            </div>
          )}

          {/* CATEGORY 3: SHEETS & BACKUPS */}
          {activeCategory === 'sheets' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-sky-100">
                <span className="text-xs uppercase font-extrabold tracking-wider text-teal-800">
                  Google Sheets Hub & Data Isolation
                </span>
                <span className="text-[11px] text-slate-500">20s Idle Auto-Sync</span>
              </div>

              {/* Master Google Sheet Status Card */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
                    <div>
                      <span className="font-bold text-emerald-950 text-xs block">
                        Master Google Sheets Connection
                      </span>
                      <span className="text-[10px] text-emerald-800 font-mono">
                        Status: {googleSheetConfig.syncStatus.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleManualSyncNow}
                    disabled={isSyncing}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-emerald-200/60 text-xs">
                  <a
                    href={googleSheetConfig.sheetUrl || 'https://docs.google.com/spreadsheets'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 bg-white hover:bg-emerald-100/50 text-emerald-900 border border-emerald-300 rounded-lg font-semibold flex items-center gap-1 transition-colors"
                  >
                    <span>Open Master Sheet</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <button
                    onClick={() => {
                      onClose();
                      onOpenGoogleSheets();
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-100/50 text-emerald-900 border border-emerald-300 rounded-lg font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Table className="w-3 h-3 text-emerald-700" />
                    <span>Configure Connection & Scripts</span>
                  </button>
                </div>
              </div>

              {/* Unit-Level JSON Backup Export & Import */}
              <div className="p-4 bg-white border border-sky-200 rounded-xl space-y-3 shadow-2xs">
                <div>
                  <span className="font-bold text-slate-800 text-xs block">
                    Unit-Isolated JSON Backup & Restore
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Export or import dedicated offline snapshots strictly for Unit [{activeUnitCode}].
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleExportBackup}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Unit [{activeUnitCode}] Backup</span>
                  </button>

                  <label className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-teal-800 border border-sky-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Restore Backup JSON</span>
                    <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
                  </label>
                </div>

                {importStatus && (
                  <p className="text-xs font-semibold text-teal-800 bg-teal-50 p-2 rounded-lg border border-teal-200">
                    {importStatus}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* CATEGORY 4: SYSTEM & UNITS */}
          {activeCategory === 'system' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-sky-100">
                <span className="text-xs uppercase font-extrabold tracking-wider text-teal-800">
                  Properties, Security & Audit
                </span>
                <span className="text-[11px] text-slate-500">Super-Admin Rights</span>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    onClose();
                    onOpenPropertyManagement();
                  }}
                  className="w-full p-3 bg-white hover:bg-sky-50 border border-sky-200 rounded-xl text-left flex items-center justify-between transition-all group shadow-2xs cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block text-xs group-hover:text-teal-900">
                        Multi-Unit Property Management
                      </span>
                      <span className="text-[10px] text-slate-500">Register new hotels, assign unit codes</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-all" />
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenAuditLogs();
                  }}
                  className="w-full p-3 bg-white hover:bg-sky-50 border border-sky-200 rounded-xl text-left flex items-center justify-between transition-all group shadow-2xs cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block text-xs group-hover:text-teal-900">
                        Security & Audit Logs
                      </span>
                      <span className="text-[10px] text-slate-500">Immutable chronological activity ledger</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-all" />
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenPINChange();
                  }}
                  className="w-full p-3 bg-white hover:bg-sky-50 border border-sky-200 rounded-xl text-left flex items-center justify-between transition-all group shadow-2xs cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block text-xs group-hover:text-teal-900">
                        Change Security PIN / Password
                      </span>
                      <span className="text-[10px] text-slate-500">Update operator access credentials</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-all" />
                </button>

                {activeUnit.isSampleUnit && (
                  <button
                    onClick={() => {
                      if (window.confirm('Reset TrialHall (SM00) to pristine blank state? All pitch enquiries in SM00 will be permanently purged.')) {
                        resetSampleUnit();
                        onClose();
                      }
                    }}
                    className="w-full p-3 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-xl text-left flex items-center justify-between transition-all group shadow-2xs cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
                        <RotateCcw className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-amber-950 block text-xs">
                          Reset Blank Pitch Sandbox (SM00)
                        </span>
                        <span className="text-[10px] text-amber-800">Clear all demo data for clean sales presentation</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-amber-600 transition-all" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-sky-200/80 bg-sky-50/50 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            {activeUnit.name} • Version 2.2
          </div>
          <button
            onClick={() => {
              onClose();
              logout();
            }}
            className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

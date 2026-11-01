import React, { useState } from 'react';
import { BEMSProvider, useBEMS } from './context/BEMSContext';
import { LoginScreen } from './components/LoginScreen';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { EnquiriesList } from './components/EnquiriesList';
import { HallAvailabilityMatrix } from './components/HallAvailabilityMatrix';
import { AddEditEnquiryModal } from './components/AddEditEnquiryModal';
import { EnquiryDetailModal } from './components/EnquiryDetailModal';
import { TaxCalculationModal } from './components/TaxCalculationModal';
import { VenueMasterModal } from './components/VenueMasterModal';
import { BanquetMastersHubModal, MasterTabType } from './components/masters/BanquetMastersHubModal';
import { AuditLogModal } from './components/AuditLogModal';
import { PINChangeModal } from './components/PINChangeModal';
import { GoogleSheetIntegrationModal } from './components/GoogleSheetIntegrationModal';
import { QuotationSettingsModal } from './components/QuotationSettingsModal';
import { BEOModal } from './components/BEOModal';
import { FollowUpCommandCenter } from './components/FollowUpCommandCenter';
import { MuhurthamCalendarView } from './components/MuhurthamCalendarView';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PropertyManagementModal } from './components/PropertyManagementModal';
import { SettingsSlideOverModal } from './components/SettingsSlideOverModal';
import { Enquiry } from './types';
import {
  FileText,
  Building2,
  TrendingUp,
  ListOrdered,
  Calendar,
  Plus,
  CreditCard,
  Settings,
  ShieldAlert,
  LogOut,
  KeyRound,
  Calculator,
  RefreshCw,
  Sparkles,
  Wifi,
  Cloud,
  CheckCircle2,
  Sliders,
  Table,
  UtensilsCrossed,
  CalendarDays,
  Briefcase,
  Compass,
  Layers,
  FileSpreadsheet,
  ExternalLink,
  Clock,
  Flame,
  UserCheck,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';

const BEMSAppContent: React.FC = () => {
  const {
    currentUser,
    logout,
    googleSheetConfig,
    triggerGoogleSheetSync,
    enquiries,
    venues,
    units,
    activeUnit,
    activeUnitCode,
    switchUnit,
    resetSampleUnit,
  } = useBEMS();

  // Navigation View: 2 Major Pages ('analytics' | 'availability')
  const [currentView, setCurrentView] = useState<'analytics' | 'availability'>('analytics');

  // Modal States
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingEnquiry, setEditingEnquiry] = useState<Enquiry | null>(null);
  const [initialSlotForNew, setInitialSlotForNew] = useState<{ hallId?: string; date?: string; session?: string }>({});

  const [selectedEnquiryForDetail, setSelectedEnquiryForDetail] = useState<Enquiry | null>(null);
  const [selectedEnquiryForBEO, setSelectedEnquiryForBEO] = useState<Enquiry | null>(null);
  const [isBEOModalOpen, setIsBEOModalOpen] = useState(false);
  const [isTaxCalcOpen, setIsTaxCalcOpen] = useState(false);
  const [isVenueMasterOpen, setIsVenueMasterOpen] = useState(false);
  const [masterModalTab, setMasterModalTab] = useState<MasterTabType | null>(null);
  const [isAuditLogOpen, setIsAuditLogOpen] = useState(false);
  const [isPINChangeOpen, setIsPINChangeOpen] = useState(false);
  const [isGoogleSheetModalOpen, setIsGoogleSheetModalOpen] = useState(false);
  const [isQuotationSettingsOpen, setIsQuotationSettingsOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [isUnitSwitcherOpen, setIsUnitSwitcherOpen] = useState(false);

  // Urgent Follow-Up Count for Navigation Counter
  const urgentFollowUpCount = React.useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return enquiries.filter(e => {
      if (['Confirmed', 'Completed', 'Cancelled', 'Function Completed', 'Function Completed and Gift Sent'].includes(e.status)) return false;
      const fDate = e.followUp3Date || e.followUp2Date || e.followUp1Date;
      return fDate && fDate <= today;
    }).length;
  }, [enquiries]);

  // If not logged in, show Login Screen
  if (!currentUser) {
    return <LoginScreen />;
  }

  const isSuperAdmin = currentUser.role === 'SuperAdmin' || currentUser.assignedUnitCode === 'ALL';
  const isCollaborator = currentUser.role === 'Collaborator';
  const isCommenter = currentUser.role === 'Commenter';
  const isAdminOrEditor = currentUser.role === 'Admin' || currentUser.role === 'Editor' || isSuperAdmin;

  const handleOpenNewEnquiry = (slot?: { hallId?: string; date?: string; session?: string }) => {
    setEditingEnquiry(null);
    setInitialSlotForNew(slot || {});
    setIsAddEditModalOpen(true);
  };

  const handleOpenEditEnquiry = (enquiry: Enquiry) => {
    setEditingEnquiry(enquiry);
    setInitialSlotForNew({});
    setIsAddEditModalOpen(true);
  };

  return (
    <div id="bems-root-app" className="min-h-screen bg-[#f0f7fb] text-slate-800 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      {/* Top Header / Operational Command Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-sky-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Brand Logo & Hotel Identification */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-teal-400 via-teal-500 to-cyan-600 p-0.5 shadow-md shadow-teal-500/20 flex items-center justify-center shrink-0">
                <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center text-teal-600">
                  <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-serif tracking-wider text-xs sm:text-sm font-extrabold uppercase bg-gradient-to-r from-teal-700 via-cyan-800 to-teal-700 bg-clip-text text-transparent">
                    {activeUnit.name}
                  </span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200 font-bold">
                    {activeUnit.code}
                  </span>
                  {activeUnit.isSampleUnit && (
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 hidden sm:inline-block">
                      Pitch Sandbox
                    </span>
                  )}
                </div>
                <h1 className="text-xs sm:text-sm font-bold text-slate-600 tracking-tight truncate max-w-[200px] sm:max-w-none">
                  {activeUnit.subtitle || 'Banquet Enquiry Management System'}
                </h1>
              </div>
            </div>

            {/* Middle Nav Switches: 2 Major Interactive Workspaces */}
            <nav className="hidden sm:flex items-center gap-1.5 p-1 bg-sky-100/90 rounded-2xl border border-sky-200 text-xs shadow-2xs">
              <button
                onClick={() => setCurrentView('analytics')}
                className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  currentView === 'analytics'
                    ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md shadow-teal-600/20'
                    : 'text-slate-600 hover:text-teal-900 hover:bg-white/80'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs">Analytics & Yield</span>
              </button>

              <button
                onClick={() => setCurrentView('availability')}
                className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  currentView === 'availability'
                    ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md shadow-teal-600/20'
                    : 'text-slate-600 hover:text-teal-900 hover:bg-white/80'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span className="text-xs">Availability & Bookings</span>
              </button>
            </nav>

            {/* Right Action Bar */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              {/* Unit Selector Drop-Down (Active for SuperAdmin, Inactive for Unit Admins & Staff) */}
              <div className="relative">
                {isSuperAdmin ? (
                  <>
                    <button
                      onClick={() => setIsUnitSwitcherOpen(!isUnitSwitcherOpen)}
                      className="p-2 sm:px-3 sm:py-2 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer group"
                      title="Super-Admin: Switch active hotel property unit"
                    >
                      <Building2 className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                      <span className="font-mono bg-teal-100 px-1.5 py-0.5 rounded text-teal-900">{activeUnitCode}</span>
                      <span className="hidden xl:inline max-w-[120px] truncate">• {activeUnit.name}</span>
                      <ChevronDown className="w-3 h-3 text-teal-700 shrink-0 group-hover:translate-y-0.5 transition-transform" />
                    </button>

                    {isUnitSwitcherOpen && (
                      <div className="absolute right-0 mt-2 w-72 bg-white border border-sky-200 rounded-xl shadow-2xl p-2 z-50 text-xs space-y-1">
                        <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                          <span>Select Hotel Unit</span>
                          <span className="font-mono text-teal-600">{units.length} Units</span>
                        </div>
                        {units.map((u) => {
                          const isCurrent = u.code.toUpperCase() === activeUnitCode.toUpperCase();
                          return (
                            <button
                              key={u.code}
                              onClick={() => {
                                switchUnit(u.code);
                                setIsUnitSwitcherOpen(false);
                              }}
                              className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                                isCurrent ? 'bg-teal-600 text-white font-bold shadow-xs' : 'hover:bg-sky-50 text-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-bold ${isCurrent ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-700'}`}>
                                  {u.code}
                                </span>
                                <span className="truncate">{u.name}</span>
                              </div>
                              {u.isSampleUnit && (
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${isCurrent ? 'bg-amber-300 text-amber-950' : 'bg-amber-100 text-amber-900'}`}>
                                  Pitch
                                </span>
                              )}
                            </button>
                          );
                        })}

                        <div className="border-t border-sky-100 pt-1 mt-1">
                          <button
                            onClick={() => {
                              setIsUnitSwitcherOpen(false);
                              setIsPropertyModalOpen(true);
                            }}
                            className="w-full text-left px-2.5 py-1.5 text-teal-700 hover:bg-sky-50 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Manage / Register Properties</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* Inactive / Locked Unit Selector for Unit Admin & Staff */
                  <div
                    className="p-2 sm:px-3 sm:py-2 bg-slate-100 text-slate-500 border border-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-not-allowed select-none opacity-85"
                    title={`Unit locked to ${activeUnitCode} (${activeUnit.name}). Super-Admin privilege required to switch units.`}
                  >
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[11px] font-bold">{activeUnitCode}</span>
                    <span className="hidden xl:inline max-w-[120px] truncate">• {activeUnit.name}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400 shrink-0 opacity-50" />
                    <span className="text-[10px] font-normal text-slate-400 border-l border-slate-300 pl-1.5 hidden sm:inline">Locked</span>
                  </div>
                )}
              </div>

              {/* PWA In-App Install Button */}
              <PWAInstallButton />

              {/* Standalone Tax Calculator Trigger */}
              <button
                onClick={() => setIsTaxCalcOpen(true)}
                className="p-2 sm:px-3 sm:py-2 bg-white hover:bg-sky-50 text-teal-700 border border-sky-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                title="Open 18% GST + Service Tax Calculator"
              >
                <Calculator className="w-4 h-4" />
                <span className="hidden lg:inline">Tax Calculator</span>
              </button>

              {/* Quick + Add Enquiry Button (Shown only on non-enquiries tabs to prevent duplicate icon on enquiries page) */}
              {currentView !== 'enquiries' && !isCommenter && (
                <button
                  onClick={() => handleOpenNewEnquiry()}
                  className="px-3.5 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-bold rounded-xl text-xs shadow-md shadow-teal-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Create new banquet enquiry"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">New Enquiry</span>
                </button>
              )}

              {/* Settings Slide-Over Trigger */}
              <button
                onClick={() => setIsSettingsModalOpen(true)}
                className="p-2 sm:px-2.5 sm:py-2 bg-white hover:bg-sky-50 text-slate-700 hover:text-teal-900 border border-sky-200 rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                title="Master Configuration, Cashier Tally & Google Sheets Settings"
              >
                <Settings className="w-4 h-4 text-teal-700" />
                <span className="hidden xl:inline text-xs font-semibold">Settings</span>
              </button>
            </div>
          </div>

          {/* Mobile Navigation Tabs: 2 Major Pages */}
          <div className="flex lg:hidden items-center justify-around py-2 border-t border-sky-200/80 text-xs">
            <button
              onClick={() => setCurrentView('analytics')}
              className={`flex-1 py-1.5 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                currentView === 'analytics' ? 'text-teal-800 bg-sky-100 shadow-2xs' : 'text-slate-600'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-teal-600" />
              <span>Analytics & Yield</span>
            </button>

            <button
              onClick={() => setCurrentView('availability')}
              className={`flex-1 py-1.5 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                currentView === 'availability' ? 'text-teal-800 bg-sky-100 shadow-2xs' : 'text-slate-600'
              }`}
            >
              <Calendar className="w-4 h-4 text-teal-600" />
              <span>Availability & Bookings</span>
            </button>
          </div>
        </div>
      </header>

      {/* Sales Pitch Sandbox Alert Banner for SM00 TrialHall */}
      {activeUnit.isSampleUnit && (
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500 text-white text-xs px-4 sm:px-6 lg:px-8 py-2.5 shadow-sm">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-200 shrink-0" />
              <span className="font-bold">Sales Pitch Sandbox Active ({activeUnit.code} • {activeUnit.name}):</span>
              <span className="text-amber-100 text-[11px] sm:text-xs">
                Pristine sandbox for client presentations. Enquiries created here are completely isolated.
              </span>
            </div>
            <button
              onClick={() => {
                if (window.confirm('Reset TrialHall (SM00) to pristine blank state? All pitch enquiries in SM00 will be permanently purged.')) {
                  resetSampleUnit();
                }
              }}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white font-bold rounded-lg border border-white/40 text-[11px] flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 self-end sm:self-auto"
              title="Purge demo bookings and restore zero-state pitch"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Blank Pitch State</span>
            </button>
          </div>
        </div>
      )}

      {/* Sub-header / System Status Bar */}
      <div className="bg-sky-50/80 border-b border-sky-200/60 px-4 sm:px-6 lg:px-8 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-[11px]">
          <div className="flex items-center gap-4">
            {/* Active Property Badge */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-teal-100/70 border border-teal-300 text-teal-900 font-bold">
              <Building2 className="w-3.5 h-3.5 text-teal-700" />
              <span className="font-mono">[{activeUnit.code}]</span>
              <span className="truncate max-w-[150px]">{activeUnit.name}</span>
            </div>

            {/* User Chip */}
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              <span className="text-slate-600">
                Logged in as <strong className="text-slate-800 font-semibold">{currentUser.name}</strong>
              </span>
              <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                currentUser.role === 'SuperAdmin'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : currentUser.role === 'Admin'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : currentUser.role === 'Editor'
                  ? 'bg-teal-50 text-teal-700 border border-teal-200'
                  : currentUser.role === 'Commenter'
                  ? 'bg-sky-50 text-sky-700 border border-sky-200'
                  : 'bg-purple-50 text-purple-700 border border-purple-200'
              }`}>
                {currentUser.role}
              </span>
            </div>

            {/* Offline-First Engine */}
            <div className="hidden sm:flex items-center gap-1.5 text-slate-500">
              <Wifi className="w-3.5 h-3.5 text-teal-600" />
              <span>Offline-First Engine Active (Local Cache Persisted)</span>
            </div>
          </div>

          {/* Sync status */}
          <div className="flex items-center gap-2 text-slate-500">
            <Cloud className="w-3.5 h-3.5 text-teal-600" />
            <span>
              Google Sheets 2-Way Sync:{' '}
              <strong
                className={
                  googleSheetConfig.syncStatus === 'synced'
                    ? 'text-teal-700 font-mono font-bold'
                    : googleSheetConfig.syncStatus === 'syncing'
                    ? 'text-sky-600 font-mono font-bold animate-pulse'
                    : 'text-rose-600 font-mono font-bold'
                }
              >
                {googleSheetConfig.syncStatus}
              </strong>
            </span>
            <a
              href={googleSheetConfig.sheetUrl || 'https://docs.google.com/spreadsheets'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold transition-colors ml-1 shadow-2xs"
              title="Open Google Sheet directly in new tab"
            >
              <FileSpreadsheet className="w-3 h-3 text-emerald-700" />
              <span>Open Sheet</span>
              <ExternalLink className="w-2.5 h-2.5 text-emerald-700" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Content Area: 2 Major Interactive Workspaces */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {currentView === 'analytics' && (
          <AnalyticsDashboard
            onSelectEnquiry={enq => setSelectedEnquiryForDetail(enq)}
            onNewEnquiry={() => handleOpenNewEnquiry()}
            onOpenBEO={enq => {
              setSelectedEnquiryForBEO(enq);
              setIsBEOModalOpen(true);
            }}
            onEditEnquiry={enq => handleOpenEditEnquiry(enq)}
          />
        )}

        {currentView === 'availability' && (
          <HallAvailabilityMatrix
            onSelectSlot={(hallId, date, session) => handleOpenNewEnquiry({ hallId, date, session })}
            onSelectEnquiry={enq => setSelectedEnquiryForDetail(enq)}
            onOpenBEO={enq => {
              setSelectedEnquiryForBEO(enq);
              setIsBEOModalOpen(true);
            }}
            onOpenGoogleSheets={() => setIsGoogleSheetModalOpen(true)}
          />
        )}
      </main>

      {/* Modals */}
      {isAddEditModalOpen && (
        <AddEditEnquiryModal
          initialEnquiry={editingEnquiry || undefined}
          enquiryToEdit={editingEnquiry || undefined}
          initialSlot={initialSlotForNew}
          onClose={() => {
            setIsAddEditModalOpen(false);
            setEditingEnquiry(null);
          }}
          onOpenTaxCalculator={() => setIsTaxCalcOpen(true)}
        />
      )}

      {selectedEnquiryForDetail && (
        <EnquiryDetailModal
          enquiry={selectedEnquiryForDetail}
          onEdit={enq => handleOpenEditEnquiry(enq)}
          onClose={() => setSelectedEnquiryForDetail(null)}
        />
      )}

      {isTaxCalcOpen && (
        <TaxCalculationModal onClose={() => setIsTaxCalcOpen(false)} />
      )}

      {masterModalTab && (
        <BanquetMastersHubModal
          initialTab={masterModalTab}
          onClose={() => setMasterModalTab(null)}
        />
      )}

      {isVenueMasterOpen && (
        <BanquetMastersHubModal
          initialTab="venues"
          onClose={() => setIsVenueMasterOpen(false)}
        />
      )}

      {isAuditLogOpen && (
        <AuditLogModal onClose={() => setIsAuditLogOpen(false)} />
      )}

      {isPINChangeOpen && (
        <PINChangeModal onClose={() => setIsPINChangeOpen(false)} />
      )}

      <GoogleSheetIntegrationModal
        isOpen={isGoogleSheetModalOpen}
        onClose={() => setIsGoogleSheetModalOpen(false)}
      />

      {isQuotationSettingsOpen && (
        <QuotationSettingsModal onClose={() => setIsQuotationSettingsOpen(false)} />
      )}

      {isBEOModalOpen && selectedEnquiryForBEO && (
        <BEOModal
          isOpen={isBEOModalOpen}
          onClose={() => {
            setIsBEOModalOpen(false);
            setSelectedEnquiryForBEO(null);
          }}
          enquiry={selectedEnquiryForBEO}
          venue={venues.find(v => v.id === selectedEnquiryForBEO.hallId)}
        />
      )}

      {/* Hotel Property & Multi-Unit Registry Modal */}
      <PropertyManagementModal
        isOpen={isPropertyModalOpen}
        onClose={() => setIsPropertyModalOpen(false)}
      />

      {/* Settings & Masters Slide-Over Modal */}
      <SettingsSlideOverModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onOpenMaster={tab => setMasterModalTab(tab)}
        onOpenGoogleSheets={() => setIsGoogleSheetModalOpen(true)}
        onOpenQuotationSettings={() => setIsQuotationSettingsOpen(true)}
        onOpenAuditLogs={() => setIsAuditLogOpen(true)}
        onOpenPINChange={() => setIsPINChangeOpen(true)}
        onOpenPropertyManagement={() => setIsPropertyModalOpen(true)}
      />

      {/* Offline Connectivity Indicator */}
      <OfflineIndicator />

      {/* Footer */}
      <footer className="bg-white border-t border-sky-200 py-4 text-center text-xs text-slate-500">
        <p>{activeUnit.name} ({activeUnit.code}) • Banquet Enquiry Management System • Multi-Property Platform</p>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <BEMSProvider>
      <BEMSAppContent />
    </BEMSProvider>
  );
}

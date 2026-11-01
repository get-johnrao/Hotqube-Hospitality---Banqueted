import React, { useState, useMemo } from 'react';
import { useBEMS } from '../context/BEMSContext';
import { Enquiry, PipelineStage } from '../types';
import { PIPELINE_STAGES, BUSINESS_SOURCES } from '../data/initialData';
import {
  formatINR,
  formatDisplayDate,
  isOverdueOrToday,
  formatIndianNumber,
} from '../utils/formatters';
import {
  Search,
  Filter,
  Calendar,
  Layers,
  Archive,
  Clock,
  Trash2,
  Edit,
  Eye,
  Lock,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Download,
  AlertTriangle,
  Plus,
  FileSpreadsheet,
  ExternalLink,
  Send,
  FileDown,
  FileText,
  Flame,
  RefreshCw,
} from 'lucide-react';
import { QuotationSendHubModal } from './QuotationSendHubModal';
import { BEOModal } from './BEOModal';
import { StageTransitionModal } from './StageTransitionModal';
import { FunctionProspectusBillingCard } from './FunctionProspectusBillingCard';
import { generateBanquetQuotationPdf } from '../utils/pdfQuotationGenerator';

interface EnquiriesListProps {
  onSelectEnquiry: (enquiry: Enquiry) => void;
  onEditEnquiry: (enquiry: Enquiry) => void;
  onNewEnquiry: () => void;
  initialFilterStage?: string;
  onClearInitialFilterStage?: () => void;
}

export const EnquiriesList: React.FC<EnquiriesListProps> = ({
  onSelectEnquiry,
  onEditEnquiry,
  onNewEnquiry,
  initialFilterStage,
  onClearInitialFilterStage,
}) => {
  const {
    enquiries,
    venues,
    currentUser,
    deleteEnquiry,
    advanceEnquiryStage,
    exportEnquiriesCSV,
    downloadMultiSheetMaster,
    googleSheetConfig,
    quotationSettings,
    recordQuotationSend,
    idleSecondsRemaining,
    isIdleAutoSyncActive,
    toggleIdleAutoSync,
    triggerGoogleSheetSync,
    activeUnit,
  } = useBEMS();

  const [quotationSendEnquiry, setQuotationSendEnquiry] = useState<Enquiry | null>(null);
  const [beoEnquiry, setBeoEnquiry] = useState<Enquiry | null>(null);
  const [stageTransitionEnquiry, setStageTransitionEnquiry] = useState<Enquiry | null>(null);
  const [stageTransitionTarget, setStageTransitionTarget] = useState<PipelineStage | null>(null);
  const [isMasterSheetsHubOpen, setIsMasterSheetsHubOpen] = useState<boolean>(false);
  const [isSyncingNow, setIsSyncingNow] = useState<boolean>(false);
  const [expandedBillingEnquiryId, setExpandedBillingEnquiryId] = useState<string | null>(null);

  const handleOpenStageTransition = (enquiry: Enquiry, targetStage: PipelineStage, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setStageTransitionEnquiry(enquiry);
    setStageTransitionTarget(targetStage);
  };

  const handleManualSync = async () => {
    setIsSyncingNow(true);
    try {
      await triggerGoogleSheetSync(true);
    } finally {
      setIsSyncingNow(false);
    }
  };

  const handleDownloadQuotationPdf = (enquiry: Enquiry, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const venue = venues.find(v => v.id === enquiry.hallId);
    generateBanquetQuotationPdf(enquiry, venue, quotationSettings, { download: true });
    recordQuotationSend(enquiry.id, {
      channel: 'PDF Download',
      recipient: enquiry.guestMobileMain || enquiry.guestName,
      status: 'Downloaded',
      notes: 'Downloaded from Enquiries List row',
    });
  };

  const isCollaborator = currentUser?.role === 'Collaborator';
  const isCommenter = currentUser?.role === 'Commenter';
  const canDelete = currentUser?.role === 'Admin' || currentUser?.role === 'Editor';

  // Active Tab: 'active' | 'kanban' | 'waitlisted' | 'archived'
  const [activeTab, setActiveTab] = useState<'active' | 'kanban' | 'waitlisted' | 'archived'>('active');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterHall, setFilterHall] = useState('ALL');
  const [filterStage, setFilterStage] = useState(initialFilterStage || 'ALL');
  const [filterSource, setFilterSource] = useState('ALL');

  // Sync initialFilterStage if passed
  React.useEffect(() => {
    if (initialFilterStage) {
      setFilterStage(initialFilterStage);
      if (activeTab === 'kanban') {
        setActiveTab('active');
      }
    }
  }, [initialFilterStage]);

  // Categorize Enquiries
  const activeEnquiriesList = useMemo(() => {
    return enquiries.filter(
      e =>
        !e.isWaitlisted &&
        e.status !== 'Function Completed and Gift Sent' &&
        e.finalStatus !== 'Archived' &&
        e.status !== 'Cancelled'
    );
  }, [enquiries]);

  const waitlistedEnquiriesList = useMemo(() => {
    return enquiries.filter(e => e.isWaitlisted || (e.status === 'Cancelled' && e.waitlistedReason));
  }, [enquiries]);

  const archivedEnquiriesList = useMemo(() => {
    return enquiries.filter(
      e =>
        e.status === 'Function Completed and Gift Sent' ||
        e.finalStatus === 'Archived' ||
        e.status === 'Cancelled'
    );
  }, [enquiries]);

  // Current Dataset based on Tab (or all enquiries if specific stage filter is active)
  const currentTabDataset = useMemo(() => {
    if (filterStage !== 'ALL') {
      return enquiries;
    }
    if (activeTab === 'waitlisted') return waitlistedEnquiriesList;
    if (activeTab === 'archived') return archivedEnquiriesList;
    return activeEnquiriesList;
  }, [activeTab, filterStage, enquiries, activeEnquiriesList, waitlistedEnquiriesList, archivedEnquiriesList]);

  // Filtered dataset
  const filteredList = useMemo(() => {
    return currentTabDataset.filter(e => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesRef = e.refNo.toLowerCase().includes(q);
        const matchesGuest = e.guestName.toLowerCase().includes(q);
        const matchesCompany = e.companyName.toLowerCase().includes(q);
        const matchesContact = (e.firstContactPerson || '').toLowerCase().includes(q);
        if (!matchesRef && !matchesGuest && !matchesCompany && !matchesContact) {
          return false;
        }
      }

      // Hall filter
      if (filterHall !== 'ALL' && e.hallId !== filterHall) {
        return false;
      }

      // Stage filter
      if (filterStage !== 'ALL' && e.status !== filterStage) {
        return false;
      }

      // Business Source filter
      if (filterSource !== 'ALL' && e.businessSource !== filterSource) {
        return false;
      }

      return true;
    });
  }, [currentTabDataset, searchQuery, filterHall, filterStage, filterSource]);

  const handleDownloadCSV = () => {
    const csvData = exportEnquiriesCSV();
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `TRT_Banquet_Enquiries_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = (id: string, refNo: string) => {
    if (window.confirm(`Are you sure you want to permanently delete Enquiry Ref #${refNo}? This action is recorded in the system audit log.`)) {
      deleteEnquiry(id);
    }
  };

  return (
    <div id="enquiries-list-view" className="space-y-5">
      {/* Top Header & Navigation Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white border border-sky-200/80 rounded-2xl shadow-sm">
        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-sky-100/70 rounded-xl border border-sky-200 text-xs">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-3.5 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'active'
                ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Active Enquiries ({activeEnquiriesList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('kanban')}
            className={`px-3.5 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'kanban'
                ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Pipeline</span>
          </button>

          <button
            onClick={() => setActiveTab('waitlisted')}
            className={`px-3.5 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'waitlisted'
                ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Waitlisted Cards ({waitlistedEnquiriesList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('archived')}
            className={`px-3.5 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'archived'
                ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Archive className="w-4 h-4" />
            <span>Archived Enquiries ({archivedEnquiriesList.length})</span>
          </button>
        </div>

        {/* Action Buttons - Consolidated Clean Toolbar */}
        <div className="flex items-center gap-2">
          {/* Unified Master Google Sheets & Exports Hub */}
          <div className="relative">
            <button
              onClick={() => setIsMasterSheetsHubOpen(prev => !prev)}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer group"
              title="Master Google Sheets & Exports Hub (With 20s Idle Auto-Sync)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 group-hover:scale-105 transition-transform" />
              <span className="hidden sm:inline">Master Google Sheets</span>
              <span className="sm:hidden">Sheets Hub</span>

              {/* Real-time 20-Second Idle Auto-Sync Badge */}
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                isIdleAutoSyncActive
                  ? idleSecondsRemaining <= 3
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isIdleAutoSyncActive ? 'bg-emerald-600 animate-ping' : 'bg-slate-400'}`} />
                {isIdleAutoSyncActive ? `${idleSecondsRemaining}s idle` : 'Paused'}
              </span>
            </button>

            {/* Dropdown Panel */}
            {isMasterSheetsHubOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-40 p-3 space-y-2 text-xs animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <span className="font-bold text-slate-900 block">Master Google Sheets Hub</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Unit: {activeUnit.name} ({activeUnit.code})
                    </span>
                  </div>
                  <button
                    onClick={() => setIsMasterSheetsHubOpen(false)}
                    className="text-slate-400 hover:text-slate-700 p-1"
                  >
                    ×
                  </button>
                </div>

                {/* Master Index Sheet Link */}
                <a
                  href={googleSheetConfig.sheetUrl || 'https://docs.google.com/spreadsheets'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full p-2.5 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 rounded-xl text-left block transition-colors group"
                >
                  <div className="flex items-center justify-between font-bold text-emerald-950">
                    <span className="flex items-center gap-1.5">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      Open Master Index Sheet
                    </span>
                    <ExternalLink className="w-3 h-3 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-[11px] text-emerald-800 mt-1 leading-snug">
                    Master index sheet with hyperlinked single-line rows navigating to individual enquiry breakdown sheets & audit logs.
                  </p>
                </a>

                {/* Sync Now button */}
                <button
                  onClick={handleManualSync}
                  disabled={isSyncingNow}
                  className="w-full p-2 bg-slate-900 text-white rounded-xl font-semibold flex items-center justify-center gap-1.5 hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingNow ? 'animate-spin' : ''}`} />
                  <span>{isSyncingNow ? 'Syncing...' : 'Sync Now with Google Sheet'}</span>
                </button>

                {/* Multi Sheet Excel Download */}
                <button
                  onClick={() => {
                    downloadMultiSheetMaster();
                    setIsMasterSheetsHubOpen(false);
                  }}
                  className="w-full p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl font-semibold text-left flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" />
                    Download Multi-Sheet Excel (.xlsx)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Master Index</span>
                </button>

                {/* CSV Export */}
                <button
                  onClick={() => {
                    handleDownloadCSV();
                    setIsMasterSheetsHubOpen(false);
                  }}
                  className="w-full p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl font-semibold text-left flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    Export CSV Register
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Table View</span>
                </button>

                {/* 20s Idle Auto-Sync Toggle */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-800 block text-[11px]">20s Idle Auto-Sync</span>
                    <span className="text-[10px] text-slate-400 block">
                      Syncs automatically after 20s of idleness
                    </span>
                  </div>
                  <button
                    onClick={toggleIdleAutoSync}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-colors ${
                      isIdleAutoSyncActive
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-100 text-slate-500 border border-slate-300'
                    }`}
                  >
                    {isIdleAutoSyncActive ? 'Enabled' : 'Paused'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Primary + Add Enquiry Button */}
          {!isCommenter && (
            <button
              onClick={onNewEnquiry}
              className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-bold rounded-xl text-xs shadow-md shadow-teal-500/20 hover:from-teal-600 hover:to-cyan-700 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Enquiry</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar (For Table, Waitlisted, Archived Views) */}
      {activeTab !== 'kanban' && (
        <div className="p-4 bg-white border border-sky-200 rounded-2xl space-y-3 shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-teal-600">
                <Search className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search Ref, Guest, Company..."
                className="w-full pl-9 pr-3 py-2 bg-sky-50/50 border border-sky-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>

            {/* Hall Filter */}
            <div>
              <select
                value={filterHall}
                onChange={e => setFilterHall(e.target.value)}
                className="w-full py-2 px-3 bg-sky-50/50 border border-sky-200 rounded-xl text-slate-800 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              >
                <option value="ALL">All Venues / Halls</option>
                {venues.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>

            {/* Pipeline Stage Filter */}
            <div>
              <select
                value={filterStage}
                onChange={e => setFilterStage(e.target.value)}
                className="w-full py-2 px-3 bg-sky-50/50 border border-sky-200 rounded-xl text-slate-800 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              >
                <option value="ALL">All Pipeline Stages</option>
                {PIPELINE_STAGES.map(s => (
                  <option key={s} value={s}>
                    {s === 'Advance Paid (EXCLUSIVE LOCK)' ? 'Advance Paid and Event Confirmed' : s}
                  </option>
                ))}
              </select>
            </div>

            {/* Business Source Filter */}
            <div>
              <select
                value={filterSource}
                onChange={e => setFilterSource(e.target.value)}
                className="w-full py-2 px-3 bg-sky-50/50 border border-sky-200 rounded-xl text-slate-800 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              >
                <option value="ALL">All Business Sources</option>
                {BUSINESS_SOURCES.map(bs => (
                  <option key={bs} value={bs}>{bs}</option>
                ))}
              </select>
            </div>
          </div>

          {filterStage !== 'ALL' && (
            <div className="flex items-center justify-between p-2.5 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-800">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
                <span>
                  Showing enquiries for status: <strong>{filterStage === 'Advance Paid (EXCLUSIVE LOCK)' ? 'Advance Paid and Event Confirmed' : filterStage}</strong> ({filteredList.length} booking{filteredList.length === 1 ? '' : 's'} found). Click on any booking row to view its complete operational details.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFilterStage('ALL');
                  onClearInitialFilterStage?.();
                }}
                className="px-2.5 py-1 bg-white hover:bg-teal-100 border border-teal-300 rounded-lg text-teal-700 font-bold transition-colors text-[11px]"
              >
                Clear Status Filter
              </button>
            </div>
          )}
        </div>
      )}

      {/* VIEW: Pipeline Board */}
      {activeTab === 'kanban' ? (
        <div className="overflow-x-auto pb-6">
          <div className="flex gap-4 min-w-[1200px]">
            {PIPELINE_STAGES.slice(0, 9).map((stage, sIdx) => {
              const stageEnquiries = activeEnquiriesList.filter(e => e.status === stage);
              const stageTotalValue = stageEnquiries.reduce((acc, curr) => acc + (curr.finalBillValue || curr.quotedBaseRate || 0), 0);

              return (
                <div
                  key={stage}
                  className="w-72 bg-white border border-sky-200 rounded-2xl p-3 flex flex-col shrink-0 max-h-[75vh] shadow-xs"
                >
                  <div className="pb-2 mb-2 border-b border-sky-100 flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono text-teal-700 font-bold block">
                        STAGE {sIdx + 1}
                      </span>
                      <h4 className="text-xs font-bold text-slate-800 leading-snug line-clamp-2">
                        {stage === 'Advance Paid (EXCLUSIVE LOCK)' ? 'Advance Paid and Event Confirmed' : stage.replace(' (EXCLUSIVE LOCK)', '')}
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-teal-700 font-mono font-bold text-[10px]">
                      {stageEnquiries.length}
                    </span>
                  </div>

                  <div className="text-[10px] font-mono text-slate-500 mb-2">
                    Total: {formatINR(stageTotalValue)}
                  </div>

                  {/* Cards */}
                  <div className="space-y-2.5 overflow-y-auto flex-1 pr-1">
                    {stageEnquiries.length === 0 ? (
                      <div className="p-4 text-center text-slate-400 text-[11px] border border-dashed border-sky-200 rounded-xl">
                        No enquiries in this stage
                      </div>
                    ) : (
                      stageEnquiries.map(enq => (
                        <div
                          key={enq.id}
                          onClick={() => onSelectEnquiry(enq)}
                          className="p-3 bg-sky-50/40 border border-sky-200 hover:border-teal-400 hover:bg-white rounded-xl cursor-pointer transition-all shadow-xs group"
                        >
                          <div className="flex justify-between items-start mb-1 text-[11px]">
                            <span className="font-mono font-bold text-teal-700">
                              #{enq.refNo}
                            </span>
                            <span className="font-mono text-slate-400 text-[10px]">
                              {formatDisplayDate(enq.eventDate)}
                            </span>
                          </div>

                          <h5 className="text-xs font-bold text-slate-800 mb-0.5 truncate group-hover:text-teal-700">
                            {enq.guestName}
                          </h5>
                          <p className="text-[10px] text-slate-500 truncate mb-1">
                            {enq.companyName}
                          </p>
                          <div className="text-[10px] text-teal-700 font-medium truncate mb-2">
                            👤 {enq.accountHandler || enq.firstContactPerson || 'Staff'}
                          </div>

                          <div className="flex justify-between items-center text-[10px] pt-2 border-t border-sky-100 font-mono">
                            <span className="text-slate-600 font-medium truncate max-w-[120px]">
                              {enq.hallName}
                            </span>
                            <span className="text-teal-700 font-bold">
                              {isCollaborator ? '—' : formatINR(enq.finalBillValue || enq.quotedBaseRate)}
                            </span>
                          </div>

                          {/* Quick stage stepper buttons (Advance and Retract) */}
                          <div className="flex gap-1 mt-2">
                            {sIdx > 0 && !isCommenter && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenStageTransition(enq, PIPELINE_STAGES[sIdx - 1], e);
                                }}
                                className="flex-1 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-0.5 border border-sky-200 transition-colors cursor-pointer"
                                title="Retract to previous stage ceremony"
                              >
                                <ChevronLeft className="w-3 h-3" />
                                <span>Retract</span>
                              </button>
                            )}
                            {sIdx < PIPELINE_STAGES.length - 1 && !isCommenter && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenStageTransition(enq, PIPELINE_STAGES[sIdx + 1], e);
                                }}
                                className="flex-1 py-1 bg-white hover:bg-teal-50 text-teal-700 hover:text-teal-800 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-0.5 border border-sky-200 transition-colors cursor-pointer"
                                title="Advance to next stage ceremony"
                              >
                                <span>Advance</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : activeTab === 'waitlisted' ? (
        /* VIEW: Waitlisted Cards */
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-950 mb-0.5">Waitlisted Enquiries Management</p>
              <p className="text-amber-800">
                When another client pays an advance deposit on a conflicting slot, the system automatically marks competing tentative holds as Cancelled and moves them here. If the primary booking is cancelled or postponed, you can reinstate these enquiries.
              </p>
            </div>
          </div>

          {filteredList.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-white border border-sky-200 rounded-2xl text-xs">
              No waitlisted enquiries found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredList.map(item => (
                <div
                  key={item.id}
                  className="p-4 bg-white border border-sky-200 rounded-2xl space-y-3 shadow-sm"
                >
                  <div className="flex justify-between items-start text-xs">
                    <span className="font-mono font-bold text-teal-700">Ref #{item.refNo}</span>
                    <span className="px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 rounded font-mono text-[10px]">
                      Waitlisted
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{item.guestName}</h4>
                    <p className="text-xs text-slate-500">{item.companyName}</p>
                  </div>

                  <div className="p-2.5 bg-sky-50/60 rounded-xl border border-sky-200 text-xs space-y-1">
                    <div className="flex justify-between text-slate-600">
                      <span>Venue Slot:</span>
                      <span className="text-slate-800 font-semibold">{item.hallName}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Date & Session:</span>
                      <span className="text-teal-700 font-mono font-semibold">{formatDisplayDate(item.eventDate)} ({item.session})</span>
                    </div>
                  </div>

                  {item.waitlistedReason && (
                    <p className="text-[11px] text-rose-700 italic bg-rose-50 p-2 rounded-lg border border-rose-200">
                      {item.waitlistedReason}
                    </p>
                  )}

                  <div className="flex gap-2 pt-2 border-t border-sky-100">
                    <button
                      onClick={() => onSelectEnquiry(item)}
                      className="flex-1 py-1.5 bg-sky-50 hover:bg-sky-100 text-slate-700 border border-sky-200 rounded-lg text-xs font-semibold"
                    >
                      View Details
                    </button>
                    {!isCommenter && (
                      <button
                        onClick={() => onEditEnquiry(item)}
                        className="flex-1 py-1.5 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-bold rounded-lg text-xs shadow-xs"
                      >
                        Edit / Reassign
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* VIEW: Standard & Archived Table */
        <div className="bg-white border border-sky-200 rounded-2xl shadow-sm overflow-hidden">
          {filteredList.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No enquiries match the specified filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-sky-50/90 border-b border-sky-200 text-slate-700 font-bold uppercase tracking-wider">
                    <th className="py-3 px-3.5">Ref No</th>
                    <th className="py-3 px-3">Guest & Company</th>
                    <th className="py-3 px-3">Venue & Seating</th>
                    <th className="py-3 px-3">Event Date & Slot</th>
                    <th className="py-3 px-3 text-right">G. Pax / Exp</th>
                    <th className="py-3 px-3 text-right">Billed Value (₹)</th>
                    <th className="py-3 px-3 text-center">Pipeline Stage</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-100">
                  {filteredList.map(enq => {
                    const isExclusiveLock = enq.status === 'Advance Paid (EXCLUSIVE LOCK)' || enq.finalStatus === 'Exclusive Lock';
                    const isConfirmed = enq.status === 'Balance Paid' || enq.finalStatus === 'Confirmed';
                    const isArchived = enq.status === 'Function Completed and Gift Sent' || enq.finalStatus === 'Archived';

                    return (
                      <React.Fragment key={enq.id}>
                        <tr
                          onClick={() => onSelectEnquiry(enq)}
                          className="hover:bg-sky-50/60 cursor-pointer transition-colors"
                        >
                        <td className="py-3.5 px-3.5 font-mono font-bold text-teal-700 whitespace-nowrap">
                          {enq.refNo}
                        </td>
                        <td className="py-3.5 px-3 max-w-[210px]">
                          <strong className="text-slate-800 block truncate">{enq.guestName}</strong>
                          <span className="text-[11px] text-slate-500 truncate block">{enq.companyName}</span>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="text-[10px] text-teal-700 font-semibold truncate bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
                              👤 {enq.accountHandler || enq.firstContactPerson || 'Staff'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">Src: {enq.businessSource}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-slate-800 font-medium block">{enq.hallName}</span>
                            {enq.secondaryHalls && enq.secondaryHalls.length > 0 && (
                              <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 px-1 py-0.2 rounded" title={`Composite halls: ${enq.secondaryHalls.map(h => h.hallName).join(', ')}`}>
                                +{enq.secondaryHalls.length} halls
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500">{enq.seatingArrangement}</span>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-slate-800 font-mono font-semibold block">{formatDisplayDate(enq.eventDate)}</span>
                            {enq.isMuhurthamDate && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300" title="Auspicious Tamil Nadu Subha Muhurtham Date">
                                <Flame className="w-2.5 h-2.5 text-amber-600" />
                                Muhurtham
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-teal-700 font-mono font-medium">{enq.session}</span>
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono">
                          <strong className="text-slate-800">{formatIndianNumber(enq.gPax)}</strong>
                          <span className="text-slate-400 text-[10px] block">/ {formatIndianNumber(enq.expPax)} exp</span>
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono font-bold text-teal-700">
                          {isCollaborator ? (
                            <span className="text-slate-400 font-normal italic">Redacted</span>
                          ) : (
                            formatINR(enq.finalBillValue || enq.quotedBaseRate)
                          )}
                        </td>
                        <td className="py-3 px-3 text-center" onClick={e => e.stopPropagation()}>
                          <div className="inline-flex items-center gap-0.5 bg-white border border-teal-200 rounded-lg p-0.5 shadow-2xs">
                            {/* Retract button */}
                            <button
                              type="button"
                              disabled={isCommenter || PIPELINE_STAGES.indexOf(enq.status) <= 0}
                              onClick={(e) => {
                                e.stopPropagation();
                                const currentIdx = PIPELINE_STAGES.indexOf(enq.status);
                                if (currentIdx > 0) {
                                  handleOpenStageTransition(enq, PIPELINE_STAGES[currentIdx - 1], e);
                                }
                              }}
                              className="p-1 rounded text-slate-400 hover:text-teal-700 hover:bg-slate-100 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                              title="Retract stage ceremony"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>

                            {/* Stage Transition Trigger Button */}
                            <button
                              type="button"
                              disabled={isCommenter}
                              onClick={(e) => handleOpenStageTransition(enq, enq.status, e)}
                              className={`text-[10px] font-bold py-0.5 px-2 rounded cursor-pointer border-none focus:outline-none transition-all ${
                                isExclusiveLock
                                  ? 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                                  : isConfirmed
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : isArchived
                                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                  : enq.status === 'Portfolio Creation'
                                  ? 'bg-amber-100 text-amber-900 font-extrabold hover:bg-amber-200'
                                  : 'bg-teal-100 text-teal-900 hover:bg-teal-200'
                              }`}
                              title="Click to execute high-impact Stage Transition Ceremony"
                            >
                              {enq.status === 'Advance Paid (EXCLUSIVE LOCK)' ? 'Advance Paid / Locked' : enq.status}
                            </button>

                            {/* Advance button */}
                            <button
                              type="button"
                              disabled={isCommenter || PIPELINE_STAGES.indexOf(enq.status) >= PIPELINE_STAGES.length - 1}
                              onClick={(e) => {
                                e.stopPropagation();
                                const currentIdx = PIPELINE_STAGES.indexOf(enq.status);
                                if (currentIdx >= 0 && currentIdx < PIPELINE_STAGES.length - 1) {
                                  handleOpenStageTransition(enq, PIPELINE_STAGES[currentIdx + 1], e);
                                }
                              }}
                              className="p-1 rounded text-slate-400 hover:text-teal-700 hover:bg-slate-100 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                              title="Advance stage ceremony"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Function Prospectus & Billing Module Trigger */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedBillingEnquiryId(expandedBillingEnquiryId === enq.id ? null : enq.id);
                              }}
                              className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                                expandedBillingEnquiryId === enq.id
                                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                                  : (enq.advancePaidAmount && enq.advancePaidAmount > 0) || isExclusiveLock || isConfirmed
                                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                                  : 'bg-sky-50 hover:bg-sky-100 text-slate-700 border-sky-200'
                              }`}
                              title="Function Prospectus (FP), Advance Payments & Tax Invoices"
                            >
                              <FileText className="w-3.5 h-3.5 text-amber-600" />
                              <span className="hidden xl:inline text-[11px] font-bold">FP & Billing</span>
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setBeoEnquiry(enq);
                              }}
                              className="p-1.5 bg-sky-50 hover:bg-sky-100 text-teal-800 border border-teal-200 rounded-lg transition-colors cursor-pointer"
                              title="Function Prospectus (FP) Document & Kitchen Function Sheet"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setQuotationSendEnquiry(enq);
                              }}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                              title="1-Click Send Quotation (WhatsApp / Gmail / Telegram)"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={(e) => handleDownloadQuotationPdf(enq, e)}
                              className="p-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-lg transition-colors cursor-pointer"
                              title="Download Quotation PDF"
                            >
                              <FileDown className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => onSelectEnquiry(enq)}
                              className="p-1.5 bg-sky-50 hover:bg-sky-100 text-slate-600 hover:text-slate-900 border border-sky-200 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => onEditEnquiry(enq)}
                              className="p-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-lg transition-colors"
                              title="Edit Enquiry"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            {canDelete && (
                              <button
                                onClick={() => handleDelete(enq.id, enq.refNo)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg transition-colors"
                                title="Delete Enquiry (Admin/Editor)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Function Prospectus & Billing Module Row */}
                      {expandedBillingEnquiryId === enq.id && (
                        <tr key={`billing-card-${enq.id}`} className="bg-slate-50/70">
                          <td colSpan={8} className="p-4 border-b border-sky-200">
                            <FunctionProspectusBillingCard
                              enquiry={enq}
                              onOpenFPModal={() => setBeoEnquiry(enq)}
                            />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )}

      {quotationSendEnquiry && (
        <QuotationSendHubModal
          enquiry={quotationSendEnquiry}
          onClose={() => setQuotationSendEnquiry(null)}
        />
      )}

      {beoEnquiry && (
        <BEOModal
          isOpen={Boolean(beoEnquiry)}
          onClose={() => setBeoEnquiry(null)}
          enquiry={beoEnquiry}
          venue={venues.find(v => v.id === beoEnquiry.hallId)}
        />
      )}

      {stageTransitionEnquiry && (
        <StageTransitionModal
          isOpen={Boolean(stageTransitionEnquiry)}
          onClose={() => setStageTransitionEnquiry(null)}
          enquiry={stageTransitionEnquiry}
          targetStage={stageTransitionTarget}
        />
      )}
    </div>
  );
};

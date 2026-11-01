import React, { useState, useMemo } from 'react';
import { useBEMS } from '../context/BEMSContext';
import { Enquiry, PipelineStage, VenueHall } from '../types';
import { PIPELINE_STAGES } from '../data/initialData';
import {
  formatINR,
  formatDisplayDate,
  formatIndianNumber,
} from '../utils/formatters';
import {
  X,
  Search,
  Filter,
  Layers,
  Calendar,
  Building2,
  Users,
  CreditCard,
  FileText,
  FileSpreadsheet,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  Phone,
  Mail,
  Receipt,
  Download,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { StageTransitionModal } from './StageTransitionModal';
import { FunctionProspectusBillingCard } from './FunctionProspectusBillingCard';
import { generateBanquetQuotationPdf } from '../utils/pdfQuotationGenerator';

interface AnalyticsEnquiriesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  filterStage?: PipelineStage | 'ALL';
  filterHallId?: string | 'ALL';
  customFilteredEnquiries?: Enquiry[];
  onSelectEnquiry: (enquiry: Enquiry) => void;
  onOpenBEO: (enquiry: Enquiry) => void;
  onEditEnquiry?: (enquiry: Enquiry) => void;
}

export const AnalyticsEnquiriesDrawer: React.FC<AnalyticsEnquiriesDrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  filterStage = 'ALL',
  filterHallId = 'ALL',
  customFilteredEnquiries,
  onSelectEnquiry,
  onOpenBEO,
  onEditEnquiry,
}) => {
  const { enquiries, venues, quotationSettings, recordQuotationSend } = useBEMS();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>(filterStage);
  const [selectedHallFilter, setSelectedHallFilter] = useState<string>(filterHallId);
  const [sortBy, setSortBy] = useState<'date' | 'revenue' | 'ref'>('date');

  // Stage Transition modal state
  const [stageTransitionEnquiry, setStageTransitionEnquiry] = useState<Enquiry | null>(null);
  const [stageTransitionTarget, setStageTransitionTarget] = useState<PipelineStage | null>(null);

  // Expanded inline Function Prospectus / Billing row
  const [expandedBillingId, setExpandedBillingId] = useState<string | null>(null);

  // Sync props when opening
  React.useEffect(() => {
    setSelectedStageFilter(filterStage);
    setSelectedHallFilter(filterHallId);
  }, [filterStage, filterHallId, isOpen]);

  // Base list of enquiries
  const baseList = useMemo(() => {
    return customFilteredEnquiries || enquiries;
  }, [customFilteredEnquiries, enquiries]);

  // Filtered & sorted list
  const filteredList = useMemo(() => {
    return baseList.filter(e => {
      if (selectedStageFilter !== 'ALL' && e.status !== selectedStageFilter) {
        return false;
      }
      if (selectedHallFilter !== 'ALL' && e.hallId !== selectedHallFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesRef = e.refNo.toLowerCase().includes(q);
        const matchesName = e.guestName.toLowerCase().includes(q);
        const matchesCompany = (e.companyName || '').toLowerCase().includes(q);
        const matchesPhone = (e.guestMobileMain || '').toLowerCase().includes(q);
        if (!matchesRef && !matchesName && !matchesCompany && !matchesPhone) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'date') {
        return (a.eventDate || '').localeCompare(b.eventDate || '');
      }
      if (sortBy === 'revenue') {
        const revA = a.finalBillValue || a.quotedBaseRate || 0;
        const revB = b.finalBillValue || b.quotedBaseRate || 0;
        return revB - revA;
      }
      return b.refNo.localeCompare(a.refNo);
    });
  }, [baseList, selectedStageFilter, selectedHallFilter, searchQuery, sortBy]);

  // Aggregate metrics for this drawer view
  const drawerStats = useMemo(() => {
    let totalRevenue = 0;
    let totalPax = 0;
    let confirmedCount = 0;

    filteredList.forEach(e => {
      totalRevenue += e.finalBillValue || e.quotedBaseRate || 0;
      totalPax += e.gPax || e.expPax || 0;
      if (['Confirmed', 'Function Completed', 'Function Completed and Gift Sent'].includes(e.status)) {
        confirmedCount++;
      }
    });

    return {
      count: filteredList.length,
      totalRevenue,
      totalPax,
      confirmedCount,
    };
  }, [filteredList]);

  if (!isOpen) return null;

  const handleDownloadQuotation = (enquiry: Enquiry, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const venue = venues.find(v => v.id === enquiry.hallId);
    generateBanquetQuotationPdf(enquiry, venue, quotationSettings, { download: true });
    recordQuotationSend(enquiry.id, {
      channel: 'PDF Download',
      recipient: enquiry.guestMobileMain || enquiry.guestName,
      status: 'Downloaded',
      notes: 'Downloaded via Analytics Enquiry Drawer',
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
        <div
          className="w-full max-w-3xl bg-white h-full shadow-2xl flex flex-col border-l border-sky-200 animate-in slide-in-from-right duration-200"
          role="dialog"
          aria-modal="true"
        >
          {/* Drawer Header */}
          <div className="p-5 border-b border-sky-200/80 bg-gradient-to-r from-teal-900 via-cyan-900 to-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-base tracking-tight text-white">{title}</h2>
                  <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-teal-500/30 text-teal-200 border border-teal-400/30 font-bold">
                    {drawerStats.count} Enquiries
                  </span>
                </div>
                <p className="text-xs text-sky-200/80">
                  {subtitle || 'Interactive drill-down with direct FP, billing, quotation and stage transitions'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-sky-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close Drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Aggregate Stats Ribbon */}
          <div className="bg-sky-50 border-b border-sky-200/70 px-5 py-2.5 grid grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Pipeline Value</span>
              <span className="font-mono font-extrabold text-teal-800 text-sm">
                {formatINR(drawerStats.totalRevenue)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Pax Projected</span>
              <span className="font-mono font-bold text-slate-800 text-sm">
                {formatIndianNumber(drawerStats.totalPax)} Guests
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Confirmed Ratio</span>
              <span className="font-mono font-bold text-emerald-700 text-sm">
                {drawerStats.confirmedCount} / {drawerStats.count} ({drawerStats.count > 0 ? Math.round((drawerStats.confirmedCount / drawerStats.count) * 100) : 0}%)
              </span>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="p-4 border-b border-sky-100 bg-white flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search guest, ref #, company, mobile..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-teal-500 text-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Stage filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-semibold">Stage:</span>
              <select
                value={selectedStageFilter}
                onChange={e => setSelectedStageFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-medium"
              >
                <option value="ALL">All Stages ({baseList.length})</option>
                {PIPELINE_STAGES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Hall filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-semibold">Hall:</span>
              <select
                value={selectedHallFilter}
                onChange={e => setSelectedHallFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-medium"
              >
                <option value="ALL">All Halls</option>
                {venues.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-semibold">Sort:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-medium"
              >
                <option value="date">Event Date</option>
                <option value="revenue">Revenue (High to Low)</option>
                <option value="ref">Ref No</option>
              </select>
            </div>
          </div>

          {/* Enquiries List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8fbfe]">
            {filteredList.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-sky-100 p-8 shadow-xs">
                <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h3 className="font-bold text-slate-700 text-sm">No enquiries match this filter</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Try clearing your search query or selecting "All Stages" from the filter toolbar above.
                </p>
              </div>
            ) : (
              filteredList.map(enquiry => {
                const venue = venues.find(v => v.id === enquiry.hallId);
                const revenue = enquiry.finalBillValue || enquiry.quotedBaseRate || 0;
                const isBillingExpanded = expandedBillingId === enquiry.id;

                return (
                  <div
                    key={enquiry.id}
                    className="bg-white border border-sky-200/80 rounded-2xl p-4 shadow-xs hover:border-teal-400 transition-all space-y-3"
                  >
                    {/* Top Row: Ref, Guest Name, Stage Badge */}
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-teal-800 text-xs bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                            {enquiry.refNo}
                          </span>
                          <h4 className="font-bold text-slate-800 text-sm">
                            {enquiry.guestName}
                          </h4>
                          {enquiry.companyName && (
                            <span className="text-xs text-slate-500 font-medium">
                              • {enquiry.companyName}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1 font-mono text-slate-700 font-semibold">
                            <Calendar className="w-3.5 h-3.5 text-teal-600" />
                            {formatDisplayDate(enquiry.eventDate)} ({enquiry.session})
                          </span>

                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-teal-600" />
                            {enquiry.hallName}
                          </span>

                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-teal-600" />
                            {enquiry.gPax || enquiry.expPax || 0} Pax
                          </span>
                        </div>
                      </div>

                      {/* Right: Revenue and Stage */}
                      <div className="text-right">
                        <span className="font-mono font-extrabold text-slate-900 text-sm block">
                          {formatINR(revenue)}
                        </span>
                        <button
                          onClick={() => {
                            setStageTransitionEnquiry(enquiry);
                            setStageTransitionTarget(enquiry.status);
                          }}
                          className="mt-1 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-800 border border-sky-200 hover:bg-teal-50 hover:border-teal-300 transition-colors cursor-pointer"
                          title="Click to transition stage or record advance"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                          <span>{enquiry.status}</span>
                          <ChevronRight className="w-3 h-3 text-slate-400" />
                        </button>
                      </div>
                    </div>

                    {/* Action Toolbar for this enquiry */}
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* Function Prospectus (FP) / BEO Trigger */}
                        <button
                          onClick={() => onOpenBEO(enquiry)}
                          className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Open Function Prospectus (FP) and Kitchen Worksheets"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" />
                          <span>Function Prospectus (FP)</span>
                        </button>

                        {/* Inline Billing & Advance Trigger */}
                        <button
                          onClick={() => setExpandedBillingId(isBillingExpanded ? null : enquiry.id)}
                          className={`px-2.5 py-1 border rounded-lg font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                            isBillingExpanded
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border-indigo-200'
                          }`}
                          title="Open Advance Payments, Settlement & Invoicing"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>Billing & Advances</span>
                          <ChevronDown className={`w-3 h-3 transition-transform ${isBillingExpanded ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Quotation Download */}
                        <button
                          onClick={e => handleDownloadQuotation(enquiry, e)}
                          className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-slate-700 border border-sky-200 rounded-lg font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Download branded banquet quotation PDF"
                        >
                          <Download className="w-3.5 h-3.5 text-sky-600" />
                          <span>Quote PDF</span>
                        </button>
                      </div>

                      {/* View / Edit Modal Trigger */}
                      <button
                        onClick={() => onSelectEnquiry(enquiry)}
                        className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                      >
                        <span>Full Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Inline Billing & Function Prospectus Inspector (if expanded) */}
                    {isBillingExpanded && (
                      <div className="pt-2 animate-in fade-in duration-150">
                        <FunctionProspectusBillingCard
                          enquiry={enquiry}
                          onOpenFP={() => onOpenBEO(enquiry)}
                          onOpenQuotation={e => handleDownloadQuotation(e)}
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Stage Transition Dialog */}
      {stageTransitionEnquiry && stageTransitionTarget && (
        <StageTransitionModal
          isOpen={true}
          onClose={() => {
            setStageTransitionEnquiry(null);
            setStageTransitionTarget(null);
          }}
          enquiry={stageTransitionEnquiry}
          targetStage={stageTransitionTarget}
          onSuccess={() => {
            setStageTransitionEnquiry(null);
            setStageTransitionTarget(null);
          }}
        />
      )}
    </>
  );
};

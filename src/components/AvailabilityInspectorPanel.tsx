import React, { useState } from 'react';
import { useBEMS } from '../context/BEMSContext';
import { Enquiry, VenueHall, PipelineStage } from '../types';
import {
  formatINR,
  formatDisplayDate,
  formatIndianNumber,
} from '../utils/formatters';
import {
  X,
  Calendar,
  Building2,
  Users,
  CreditCard,
  FileText,
  FileSpreadsheet,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Clock,
  Sparkles,
  Phone,
  Mail,
  Receipt,
  Download,
  AlertCircle,
  Plus,
  Maximize2,
  ExternalLink,
  ShieldCheck,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';
import { StageTransitionModal } from './StageTransitionModal';
import { FunctionProspectusBillingCard } from './FunctionProspectusBillingCard';
import { generateBanquetQuotationPdf } from '../utils/pdfQuotationGenerator';

interface AvailabilityInspectorPanelProps {
  selectedBooking: Enquiry | null;
  selectedSlot: { hallId: string; hallName: string; date: string; session: string } | null;
  selectedDate: string;
  dayBookings: Enquiry[];
  onClose: () => void;
  onSelectBooking: (booking: Enquiry) => void;
  onOpenNewEnquiry: (slot: { hallId?: string; date?: string; session?: string }) => void;
  onOpenEnquiryDetail: (enquiry: Enquiry) => void;
  onOpenBEO: (enquiry: Enquiry) => void;
  onEditEnquiry?: (enquiry: Enquiry) => void;
}

export const AvailabilityInspectorPanel: React.FC<AvailabilityInspectorPanelProps> = ({
  selectedBooking,
  selectedSlot,
  selectedDate,
  dayBookings,
  onClose,
  onSelectBooking,
  onOpenNewEnquiry,
  onOpenEnquiryDetail,
  onOpenBEO,
  onEditEnquiry,
}) => {
  const { venues, quotationSettings, recordQuotationSend } = useBEMS();

  // Tab: 'inspector' | 'daySchedule'
  const [activeTab, setActiveTab] = useState<'inspector' | 'daySchedule'>('inspector');

  // Stage transition modal
  const [stageTransitionEnquiry, setStageTransitionEnquiry] = useState<Enquiry | null>(null);
  const [stageTransitionTarget, setStageTransitionTarget] = useState<PipelineStage | null>(null);

  // Expanded billing section
  const [showBillingCard, setShowBillingCard] = useState(false);

  const handleDownloadQuotation = (enquiry: Enquiry, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const venue = venues.find(v => v.id === enquiry.hallId);
    generateBanquetQuotationPdf(enquiry, venue, quotationSettings, { download: true });
    recordQuotationSend(enquiry.id, {
      channel: 'PDF Download',
      recipient: enquiry.guestMobileMain || enquiry.guestName,
      status: 'Downloaded',
      notes: 'Downloaded via Availability Split-Screen Inspector',
    });
  };

  return (
    <>
      <aside
        id="availability-split-inspector"
        className="w-full lg:w-[420px] xl:w-[460px] bg-white border border-sky-200/90 rounded-2xl shadow-sm flex flex-col shrink-0 h-full max-h-[850px] overflow-hidden animate-in fade-in duration-150"
      >
        {/* Panel Top Header */}
        <div className="p-3.5 bg-gradient-to-r from-teal-900 via-cyan-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs tracking-tight text-white block">
                Booking Inspector & Actions
              </span>
              <span className="text-[10px] text-teal-200 font-mono">
                {formatDisplayDate(selectedDate)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-sky-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close side inspector"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-sky-100 bg-sky-50/70 text-xs px-3 pt-2 gap-1">
          <button
            onClick={() => setActiveTab('inspector')}
            className={`pb-2 px-3 font-semibold transition-all flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === 'inspector'
                ? 'border-teal-600 text-teal-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Selected Event</span>
          </button>

          <button
            onClick={() => setActiveTab('daySchedule')}
            className={`pb-2 px-3 font-semibold transition-all flex items-center gap-1.5 border-b-2 cursor-pointer ${
              activeTab === 'daySchedule'
                ? 'border-teal-600 text-teal-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-teal-600" />
            <span>Day Events ({dayBookings.length})</span>
          </button>
        </div>

        {/* Panel Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {activeTab === 'inspector' && (
            <>
              {/* Scenario 1: A booking is selected */}
              {selectedBooking ? (
                <div className="space-y-4 animate-in fade-in duration-100">
                  {/* Header card with Ref, Status & Pax */}
                  <div className="p-3.5 bg-gradient-to-br from-teal-50 to-sky-50 border border-teal-200/70 rounded-xl space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono font-extrabold text-teal-900 text-xs bg-white px-2 py-0.5 rounded border border-teal-200">
                          {selectedBooking.refNo}
                        </span>
                        <h3 className="font-bold text-slate-900 text-sm mt-1">
                          {selectedBooking.guestName}
                        </h3>
                        {selectedBooking.companyName && (
                          <span className="text-[11px] text-slate-600 font-medium block">
                            {selectedBooking.companyName}
                          </span>
                        )}
                      </div>

                      {/* Stage button */}
                      <button
                        onClick={() => {
                          setStageTransitionEnquiry(selectedBooking);
                          setStageTransitionTarget(selectedBooking.status);
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-teal-50 text-teal-800 border border-teal-300 rounded-full font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                        title="Click to transition stage or record advance"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                        <span>{selectedBooking.status}</span>
                        <ChevronRight className="w-3 h-3 text-slate-400" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-teal-200/50 text-[11px]">
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Hall & Session</span>
                        <span className="font-bold text-slate-800 block">{selectedBooking.hallName}</span>
                        <span className="font-mono text-teal-700">{selectedBooking.session}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Guests / Pax</span>
                        <span className="font-bold text-slate-800 block">
                          {selectedBooking.gPax || selectedBooking.expPax || 0} Pax
                        </span>
                        <span className="text-slate-500 text-[10px]">
                          MG: {selectedBooking.mgPax || 'None'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contact details */}
                  <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Client Contact Info
                    </span>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-slate-700">
                      <div className="flex items-center gap-1.5 font-mono">
                        <Phone className="w-3.5 h-3.5 text-teal-600" />
                        <span>{selectedBooking.guestMobileMain || 'No phone'}</span>
                      </div>
                      {selectedBooking.guestEmail && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-teal-600" />
                          <span className="truncate max-w-[180px]">{selectedBooking.guestEmail}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        Financials & Billing
                      </span>
                      <span className="font-mono font-extrabold text-slate-900 text-sm">
                        {formatINR(selectedBooking.finalBillValue || selectedBooking.quotedBaseRate || 0)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-100">
                      <div>
                        <span className="text-slate-500">Base Quoted:</span>
                        <span className="font-mono font-semibold text-slate-800 ml-1">
                          {formatINR(selectedBooking.quotedBaseRate || 0)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500">Advance Paid:</span>
                        <span className="font-mono font-semibold text-emerald-700 ml-1">
                          {formatINR(selectedBooking.advanceAmountPaid || 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Operational Action Buttons */}
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-2 gap-2">
                      {/* Function Prospectus (FP) */}
                      <button
                        onClick={() => onOpenBEO(selectedBooking)}
                        className="p-2.5 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-300 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                        title="Open Function Prospectus (FP) and Kitchen Instructions"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-teal-700" />
                        <span>Open FP Sheet</span>
                      </button>

                      {/* Branded Quotation PDF */}
                      <button
                        onClick={e => handleDownloadQuotation(selectedBooking, e)}
                        className="p-2.5 bg-sky-50 hover:bg-sky-100 text-slate-800 border border-sky-300 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                        title="Download quotation PDF"
                      >
                        <Download className="w-4 h-4 text-sky-700" />
                        <span>Quote PDF</span>
                      </button>
                    </div>

                    {/* Billing & Settlement Accordion */}
                    <button
                      onClick={() => setShowBillingCard(!showBillingCard)}
                      className={`w-full p-2.5 rounded-xl font-bold flex items-center justify-between transition-colors border cursor-pointer ${
                        showBillingCard
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border-indigo-200'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Receipt className="w-4 h-4" />
                        <span>Billing, Receipts & Cashier Invoices</span>
                      </span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${showBillingCard ? 'rotate-180' : ''}`} />
                    </button>

                    {showBillingCard && (
                      <div className="pt-2">
                        <FunctionProspectusBillingCard
                          enquiry={selectedBooking}
                          onOpenFP={() => onOpenBEO(selectedBooking)}
                          onOpenQuotation={e => handleDownloadQuotation(e)}
                        />
                      </div>
                    )}

                    {/* Full Enquiry Modal Trigger */}
                    <button
                      onClick={() => onOpenEnquiryDetail(selectedBooking)}
                      className="w-full p-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                    >
                      <span>Open Full Enquiry Card & Audit</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : selectedSlot ? (
                /* Scenario 2: An available slot was clicked */
                <div className="p-5 bg-teal-50/70 border border-teal-200 rounded-2xl text-center space-y-3 animate-in fade-in duration-100">
                  <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mx-auto">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">
                      {selectedSlot.hallName} is Available
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Date: <strong className="font-mono">{formatDisplayDate(selectedSlot.date)}</strong>
                    </p>
                    <span className="text-[11px] font-mono text-teal-700 bg-white px-2 py-0.5 rounded border border-teal-200 inline-block mt-1">
                      {selectedSlot.session}
                    </span>
                  </div>

                  <button
                    onClick={() => onOpenNewEnquiry(selectedSlot)}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-teal-500/20 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Booking for This Slot</span>
                  </button>
                </div>
              ) : (
                /* Scenario 3: Nothing selected yet */
                <div className="text-center py-16 text-slate-400 bg-sky-50/40 rounded-2xl border border-sky-100 p-6">
                  <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <h3 className="font-bold text-slate-700 text-sm">Select Any Hall Slot</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Click on any booking block to inspect guest details, FP, and billing, or click an empty hall slot to book it instantly.
                  </p>
                </div>
              )}
            </>
          )}

          {/* TAB 2: DAY SCHEDULE OVERVIEW */}
          {activeTab === 'daySchedule' && (
            <div className="space-y-3 animate-in fade-in duration-100">
              <div className="flex items-center justify-between pb-1 border-b border-sky-100">
                <span className="text-xs font-bold text-slate-700">
                  All Events on {formatDisplayDate(selectedDate)}
                </span>
                <span className="text-[10px] font-mono font-bold text-teal-700">
                  {dayBookings.length} Total
                </span>
              </div>

              {dayBookings.length === 0 ? (
                <div className="text-center py-12 text-slate-400 bg-sky-50/40 rounded-xl border border-sky-100 p-4">
                  <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                  <p className="font-semibold text-slate-700">No events scheduled for this day</p>
                  <p className="text-[11px] text-slate-500 mt-1">All banquet halls are available.</p>
                </div>
              ) : (
                dayBookings.map(enq => {
                  const isSelected = selectedBooking?.id === enq.id;
                  return (
                    <div
                      key={enq.id}
                      onClick={() => {
                        onSelectBooking(enq);
                        setActiveTab('inspector');
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-teal-50 border-teal-400 shadow-xs'
                          : 'bg-white hover:bg-sky-50 border-sky-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-[10px] text-teal-800 bg-white px-1.5 py-0.2 rounded border border-teal-200">
                            {enq.refNo}
                          </span>
                          <strong className="text-slate-800 truncate max-w-[160px]">
                            {enq.guestName}
                          </strong>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-sky-100 text-sky-800">
                          {enq.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5">
                        <span className="font-semibold text-slate-700">{enq.hallName}</span>
                        <span className="font-mono text-teal-700">{enq.session}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </aside>

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

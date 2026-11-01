import React, { useState, useEffect } from 'react';
import { useBEMS } from '../context/BEMSContext';
import { Enquiry, PipelineStage } from '../types';
import { PIPELINE_STAGES } from '../data/initialData';
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
  Clock,
  Calculator,
  Lock,
  Edit,
  ShieldCheck,
  CheckCircle,
  FileText,
  Phone,
  Mail,
  Tag,
  Plus,
  Trash2,
  Save,
  Send,
  FileDown,
  Share2,
  History,
  ChevronLeft,
  ChevronRight,
  Gift,
} from 'lucide-react';
import { QuotationSendHubModal } from './QuotationSendHubModal';
import { BEOModal } from './BEOModal';
import { generateBanquetQuotationPdf } from '../utils/pdfQuotationGenerator';

interface EnquiryDetailModalProps {
  enquiry: Enquiry;
  onEdit: (enquiry: Enquiry) => void;
  onClose: () => void;
}

export const EnquiryDetailModal: React.FC<EnquiryDetailModalProps> = ({
  enquiry,
  onEdit,
  onClose,
}) => {
  const { currentUser, updateEnquiry, advanceEnquiryStage, venues, quotationSettings, recordQuotationSend } = useBEMS();
  const [isSendHubOpen, setIsSendHubOpen] = useState(false);
  const [isBEOOpen, setIsBEOOpen] = useState(false);
  const [currentEnquiryState, setCurrentEnquiryState] = useState<Enquiry>(enquiry);
  const isCollaborator = currentUser?.role === 'Collaborator';
  const isCommenter = currentUser?.role === 'Commenter';

  const venue = venues.find(v => v.id === currentEnquiryState.hallId);

  const currentStageIdx = PIPELINE_STAGES.indexOf(currentEnquiryState.status);

  const handleStageChange = (newStage: PipelineStage) => {
    advanceEnquiryStage(currentEnquiryState.id, newStage);
    setCurrentEnquiryState(prev => ({
      ...prev,
      status: newStage,
    }));
  };

  const handleRetractStage = () => {
    if (currentStageIdx > 0) {
      handleStageChange(PIPELINE_STAGES[currentStageIdx - 1]);
    }
  };

  const handleAdvanceStage = () => {
    if (currentStageIdx < PIPELINE_STAGES.length - 1) {
      handleStageChange(PIPELINE_STAGES[currentStageIdx + 1]);
    }
  };

  const handleDownloadPdf = () => {
    generateBanquetQuotationPdf(currentEnquiryState, venue, quotationSettings, { download: true });
    const record = recordQuotationSend(currentEnquiryState.id, {
      channel: 'PDF Download',
      recipient: currentEnquiryState.guestMobileMain || currentEnquiryState.guestName,
      status: 'Downloaded',
      notes: 'Downloaded from Enquiry Details Modal',
    });
    setCurrentEnquiryState(prev => ({
      ...prev,
      quotationSendHistory: [record, ...(prev.quotationSendHistory || [])],
    }));
  };

  // Remarks & Follow-ups editable state
  const [initialRemark, setInitialRemark] = useState(enquiry.remarks || '');
  const [isEditingRemarks, setIsEditingRemarks] = useState(false);
  const [detailFollowUps, setDetailFollowUps] = useState<Array<{ id: string; index: number; date: string; remark: string }>>(() => {
    if (enquiry.followUps && enquiry.followUps.length > 0) {
      return enquiry.followUps.map((fu, idx) => ({
        id: fu.id || `fu-${idx + 1}`,
        index: idx + 1,
        date: fu.date || '',
        remark: fu.remark || '',
      }));
    }
    const list: Array<{ id: string; index: number; date: string; remark: string }> = [];
    if (enquiry.followUp1Date || enquiry.remarks1) {
      list.push({
        id: 'fu-1',
        index: 1,
        date: enquiry.followUp1Date || '',
        remark: enquiry.remarks1 || '',
      });
    }
    if (enquiry.followUp2Date || enquiry.remarks2) {
      list.push({
        id: 'fu-2',
        index: 2,
        date: enquiry.followUp2Date || '',
        remark: enquiry.remarks2 || '',
      });
    }
    if (enquiry.followUp3Date || enquiry.remarks3) {
      list.push({
        id: 'fu-3',
        index: 3,
        date: enquiry.followUp3Date || '',
        remark: enquiry.remarks3 || '',
      });
    }
    if (list.length === 0) {
      list.push({
        id: 'fu-1',
        index: 1,
        date: enquiry.followUp1Date || '',
        remark: enquiry.remarks1 || '',
      });
    }
    return list;
  });

  // Keep state synchronized with enquiry updates
  useEffect(() => {
    setInitialRemark(enquiry.remarks || '');
    if (enquiry.followUps && enquiry.followUps.length > 0) {
      setDetailFollowUps(
        enquiry.followUps.map((fu, idx) => ({
          id: fu.id || `fu-${idx + 1}`,
          index: idx + 1,
          date: fu.date || '',
          remark: fu.remark || '',
        }))
      );
    } else {
      const list: Array<{ id: string; index: number; date: string; remark: string }> = [];
      if (enquiry.followUp1Date || enquiry.remarks1) {
        list.push({
          id: 'fu-1',
          index: 1,
          date: enquiry.followUp1Date || '',
          remark: enquiry.remarks1 || '',
        });
      }
      if (enquiry.followUp2Date || enquiry.remarks2) {
        list.push({
          id: 'fu-2',
          index: 2,
          date: enquiry.followUp2Date || '',
          remark: enquiry.remarks2 || '',
        });
      }
      if (enquiry.followUp3Date || enquiry.remarks3) {
        list.push({
          id: 'fu-3',
          index: 3,
          date: enquiry.followUp3Date || '',
          remark: enquiry.remarks3 || '',
        });
      }
      if (list.length === 0) {
        list.push({
          id: 'fu-1',
          index: 1,
          date: enquiry.followUp1Date || '',
          remark: enquiry.remarks1 || '',
        });
      }
      setDetailFollowUps(list);
    }
  }, [enquiry]);

  const [isSaved, setIsSaved] = useState(false);

  const handleUpdateDetailFollowUp = (id: string, field: 'date' | 'remark', value: string) => {
    setDetailFollowUps(prev =>
      prev.map(item => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleAddDetailFollowUp = () => {
    const nextIndex = detailFollowUps.length + 1;
    setDetailFollowUps(prev => [
      ...prev,
      {
        id: 'fu-' + Math.random().toString(36).substring(2, 9),
        index: nextIndex,
        date: new Date().toISOString().split('T')[0],
        remark: '',
      },
    ]);
  };

  const handleRemoveDetailFollowUp = (id: string) => {
    if (detailFollowUps.length <= 1) return;
    setDetailFollowUps(prev =>
      prev.filter(item => item.id !== id).map((item, idx) => ({ ...item, index: idx + 1 }))
    );
  };

  const handleSaveRemarks = (e: React.FormEvent) => {
    e.preventDefault();
    updateEnquiry({
      ...enquiry,
      remarks: initialRemark.trim(),
      remarks1: (detailFollowUps[0]?.remark || '').trim(),
      remarks2: (detailFollowUps[1]?.remark || '').trim(),
      remarks3: (detailFollowUps[2]?.remark || '').trim(),
      followUps: detailFollowUps.map(item => ({
        ...item,
        remark: item.remark.trim(),
      })),
      followUp1Date: detailFollowUps[0]?.date || '',
      followUp2Date: detailFollowUps[1]?.date || '',
      followUp3Date: detailFollowUps[2]?.date || '',
    });
    setIsSaved(true);
    setIsEditingRemarks(false);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div id="enquiry-detail-modal" className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-50 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white border border-sky-200 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-sky-50/80 border-b border-sky-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-xl text-teal-700">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-800">
                  Enquiry Record Ref #{currentEnquiryState.refNo}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
                  {currentEnquiryState.status === 'Advance Paid (EXCLUSIVE LOCK)' ? 'Advance Paid and Event Confirmed' : currentEnquiryState.status}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Created on {formatDisplayDate(currentEnquiryState.enquiryDate)} by {currentEnquiryState.createdBy || 'Operations'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSendHubOpen(true)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              title="1-Click Send via WhatsApp, Gmail, Telegram with multi-send history"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Quotation</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              className="px-3 py-1.5 bg-white hover:bg-sky-50 text-teal-700 border border-teal-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              title="Download Branded PDF Quotation File"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Quotation PDF</span>
            </button>

            <button
              onClick={() => setIsBEOOpen(true)}
              className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              title="Open Banquet Event Order (BEO) & Kitchen Function Sheet"
            >
              <FileText className="w-3.5 h-3.5 text-teal-700" />
              <span>BEO Order</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onEdit(currentEnquiryState);
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Edit Details</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-sky-100/50 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Workflow Stage Control Bar with Retract & Advance Buttons */}
        <div className="bg-sky-50/50 px-6 py-2.5 border-b border-sky-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Workflow Progress:</span>
            <div className="inline-flex items-center gap-1 bg-white border border-teal-200 rounded-xl p-1 shadow-2xs">
              <button
                type="button"
                disabled={isCommenter || currentStageIdx <= 0}
                onClick={handleRetractStage}
                className="px-2 py-1 rounded-lg text-slate-600 hover:text-teal-800 hover:bg-teal-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 font-semibold text-xs transition-colors"
                title="Retract to previous stage"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Retract</span>
              </button>

              <select
                value={currentEnquiryState.status}
                disabled={isCommenter}
                onChange={e => handleStageChange(e.target.value as PipelineStage)}
                className="text-xs font-bold py-1 px-2.5 bg-teal-50 text-teal-900 border border-teal-200 rounded-lg cursor-pointer focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                {PIPELINE_STAGES.map((st, idx) => (
                  <option key={st} value={st}>
                    {idx + 1}. {st === 'Advance Paid (EXCLUSIVE LOCK)' ? 'Advance Paid and Event Confirmed' : st}
                  </option>
                ))}
              </select>

              <button
                type="button"
                disabled={isCommenter || currentStageIdx >= PIPELINE_STAGES.length - 1}
                onClick={handleAdvanceStage}
                className="px-2 py-1 rounded-lg text-teal-700 hover:text-teal-900 hover:bg-teal-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 font-semibold text-xs transition-colors"
                title="Advance to next stage"
              >
                <span className="hidden sm:inline">Advance</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-500">
              Stage {currentStageIdx + 1} of {PIPELINE_STAGES.length}
            </span>
            {currentEnquiryState.status === 'Portfolio Creation' && (
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded">
                Initial Portfolio Stage
              </span>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
          {/* Main 2-Column Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left: Client & Event */}
            <div className="p-4 bg-sky-50/30 border border-sky-100 rounded-xl space-y-3">
              <h3 className="text-xs font-bold text-teal-700 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>Client & Event Profile</span>
              </h3>

              <div className="space-y-2">
                <div className="flex justify-between border-b border-sky-100 pb-1.5">
                  <span className="text-slate-500">Guest / Host Name:</span>
                  <strong className="text-slate-900 text-sm">{currentEnquiryState.guestName}</strong>
                </div>

                <div className="flex justify-between border-b border-sky-100 pb-1.5">
                  <span className="text-slate-500">Company / Family:</span>
                  <span className="text-slate-800 font-medium">{currentEnquiryState.companyName}</span>
                </div>

                <div className="flex justify-between border-b border-sky-100 pb-1.5">
                  <span className="text-slate-500">Event Category:</span>
                  <span className="text-teal-700 font-semibold">{currentEnquiryState.eventType}</span>
                </div>

                <div className="flex justify-between border-b border-sky-100 pb-1.5">
                  <span className="text-slate-500">Business Source:</span>
                  <span className="text-slate-700">{currentEnquiryState.businessSource}</span>
                </div>

                <div className="flex justify-between border-b border-sky-100 pb-1.5">
                  <span className="text-slate-500">Account Handler:</span>
                  <span className="text-slate-800 font-semibold flex items-center gap-1.5">
                    <span className="bg-teal-50 text-teal-800 px-2 py-0.5 rounded border border-teal-200">
                      👤 {currentEnquiryState.accountHandler || currentEnquiryState.firstContactPerson || 'Staff'}
                    </span>
                    {currentEnquiryState.accountHandlerMobile && (
                      <span className="text-[10px] text-teal-700 font-mono">
                        {currentEnquiryState.accountHandlerMobile}
                      </span>
                    )}
                  </span>
                </div>

                <div className="pt-1">
                  <span className="text-slate-500 block mb-1">Welcome Board Display:</span>
                  <p className="p-2.5 bg-white rounded-lg text-slate-800 font-mono text-[11px] border border-sky-200 shadow-2xs font-medium">
                    {currentEnquiryState.boardToRead || currentEnquiryState.functionBanner || '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Venue & Operational Setup */}
            <div className="p-4 bg-sky-50/30 border border-sky-100 rounded-xl space-y-3">
              <h3 className="text-xs font-bold text-teal-700 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                <span>Venue Setup & Logistics</span>
              </h3>

              <div className="space-y-2">
                <div className="flex justify-between border-b border-sky-100 pb-1.5">
                  <span className="text-slate-500">Venue Hall:</span>
                  <strong className="text-teal-800 text-sm">{currentEnquiryState.hallName}</strong>
                </div>

                <div className="flex justify-between border-b border-sky-100 pb-1.5">
                  <span className="text-slate-500">Event Date:</span>
                  <strong className="text-slate-800 font-mono">{formatDisplayDate(currentEnquiryState.eventDate)}</strong>
                </div>

                <div className="flex justify-between border-b border-sky-100 pb-1.5">
                  <span className="text-slate-500">Session Time Slot:</span>
                  <span className="text-teal-700 font-mono font-bold">{currentEnquiryState.session}</span>
                </div>

                <div className="flex justify-between border-b border-sky-100 pb-1.5">
                  <span className="text-slate-500">Seating Arrangement:</span>
                  <span className="text-slate-800 font-medium">{currentEnquiryState.seatingArrangement}</span>
                </div>

                <div className="flex justify-between border-b border-sky-100 pb-1.5">
                  <span className="text-slate-500">Headcounts (G.Pax / Exp):</span>
                  <span className="text-slate-800 font-mono font-bold">
                    {formatIndianNumber(currentEnquiryState.gPax)} Guaranteed / {formatIndianNumber(currentEnquiryState.expPax)} Expected
                  </span>
                </div>

                <div className="flex justify-between border-b border-sky-100 pb-1.5">
                  <span className="text-slate-500">Menu & Billing:</span>
                  <span className="text-slate-700">{currentEnquiryState.menu} Menu • {currentEnquiryState.rateBillingType}</span>
                </div>

                <div className="pt-2 border-t border-sky-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-slate-500 font-medium">Package Inclusions & Amenities:</span>
                    {(currentEnquiryState.totalFocSavings || 0) > 0 && (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded flex items-center gap-1">
                        <Gift className="w-3 h-3 text-emerald-600" />
                        <span>FOC Savings: {formatINR(currentEnquiryState.totalFocSavings || 0)}</span>
                      </span>
                    )}
                  </div>

                  {currentEnquiryState.detailedInclusions && currentEnquiryState.detailedInclusions.length > 0 ? (
                    <div className="space-y-1.5">
                      {currentEnquiryState.detailedInclusions.map(inc => (
                        <div
                          key={inc.id || inc.name}
                          className="flex items-center justify-between p-2 bg-white rounded-lg border border-sky-100 text-xs shadow-2xs"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-teal-600 font-bold">✓</span>
                            <span className="text-slate-800 font-medium">{inc.name}</span>
                          </div>
                          <div className="flex items-center gap-2 font-mono">
                            {inc.isFOC ? (
                              <>
                                <span className="line-through text-slate-400 text-[11px]">
                                  {formatINR(inc.standardRate)}
                                </span>
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded border border-emerald-300">
                                  FOC (Complimentary)
                                </span>
                              </>
                            ) : (
                              <span className="text-slate-700 text-[11px] font-semibold">
                                {inc.standardRate > 0 ? formatINR(inc.standardRate) : 'Included'}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : currentEnquiryState.inclusions && currentEnquiryState.inclusions.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {currentEnquiryState.inclusions.map(inc => {
                        const isFoc = (currentEnquiryState.focInclusions || []).includes(inc);
                        return (
                          <span
                            key={inc}
                            className={`px-2 py-0.5 rounded border text-[10px] font-medium flex items-center gap-1 ${
                              isFoc
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-white text-teal-800 border-sky-200 shadow-2xs'
                            }`}
                          >
                            <span>✓ {inc}</span>
                            {isFoc && (
                              <span className="font-bold text-[9px] bg-emerald-200 text-emerald-900 px-1 rounded">
                                FOC
                              </span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">No inclusions specified</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sensitive Section (Redacted for Collaborators) */}
          {!isCollaborator ? (
            <div className="p-4 bg-sky-50/40 border border-sky-100 rounded-xl space-y-4">
              <h3 className="text-xs font-bold text-teal-700 uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5" />
                <span>Financial Billing & Contact Info</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                <div className="p-3 bg-white rounded-xl border border-sky-100 shadow-2xs">
                  <span className="text-slate-500 text-[11px] block">
                    {currentEnquiryState.isAllInclusiveRate ? 'Quoted Base Rate (Derived):' : 'Quoted Base Rate:'}
                  </span>
                  <strong className="text-slate-800 font-mono text-base">{formatINR(currentEnquiryState.quotedBaseRate)}</strong>
                  {currentEnquiryState.isAllInclusiveRate && currentEnquiryState.allInclusiveRate && (
                    <span className="text-[10px] text-teal-700 font-mono block mt-0.5">
                      Spoken Net: ₹{currentEnquiryState.allInclusiveRate.toLocaleString('en-IN')}/pax
                    </span>
                  )}
                </div>

                <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-200 shadow-2xs">
                  <span className="text-teal-700 text-[11px] block font-medium">Final Billed Value (with Tax):</span>
                  <strong className="text-teal-900 font-mono text-base">{formatINR(currentEnquiryState.finalBillValue)}</strong>
                  {currentEnquiryState.taxRatePercent && (
                    <span className="text-[10px] text-teal-700 font-mono block mt-0.5">
                      Incl. {currentEnquiryState.taxRatePercent}% Tax ({formatINR(currentEnquiryState.taxAmount || Math.round((currentEnquiryState.finalBillValue || 0) - (currentEnquiryState.quotedBaseRate || 0) * (currentEnquiryState.gPax || 1)))})
                    </span>
                  )}
                </div>

                <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 shadow-2xs">
                  <span className="text-emerald-800 text-[11px] block font-medium">FOC Privileges Value:</span>
                  <strong className="text-emerald-950 font-mono text-base">
                    {formatINR(currentEnquiryState.totalFocSavings || 0)}
                  </strong>
                  <span className="text-[10px] text-emerald-700 block mt-0.5 font-medium">
                    {(currentEnquiryState.focInclusions?.length || 0)} complimentary inclusion{(currentEnquiryState.focInclusions?.length || 0) === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-sky-100 shadow-2xs">
                  <span className="text-slate-500 text-[11px] block">Primary Guest Contact:</span>
                  <strong className="text-slate-800 font-mono">{currentEnquiryState.guestMobileMain || '—'}</strong>
                  <span className="text-[10px] text-slate-500 block truncate">{currentEnquiryState.email}</span>
                </div>
              </div>

              {/* Follow-up Tracking Dates */}
              {enquiry.status === 'Confirmed' ||
              enquiry.status === 'Advance Paid (EXCLUSIVE LOCK)' ||
              enquiry.status === 'Balance Paid' ||
              enquiry.status === 'Function Completed' ||
              enquiry.status === 'Function Completed and Gift Sent' ||
              enquiry.finalStatus === 'Confirmed' ||
              enquiry.finalStatus === 'Exclusive Lock' ||
              enquiry.finalStatus === 'Completed' ||
              enquiry.finalStatus === 'Archived' ? (
                <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 shadow-2xs">
                  <h4 className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Follow-Up Status</span>
                  </h4>
                  <p className="text-xs text-emerald-700">
                    Function is confirmed – no sales follow-up required.
                  </p>
                </div>
              ) : null}

              {/* Follow-up Tracking Dates & Operational Remarks */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-teal-600" />
                    <span>Follow-Up Schedule & Operational Remarks</span>
                  </h4>
                  {!isEditingRemarks && !isCollaborator && (
                    <button
                      type="button"
                      onClick={() => setIsEditingRemarks(true)}
                      className="px-2.5 py-1 text-teal-700 hover:text-teal-900 bg-white hover:bg-teal-50 border border-teal-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Edit Remarks</span>
                    </button>
                  )}
                </div>

                {isEditingRemarks ? (
                  /* Form for editing all remarks with Update button */
                  <form onSubmit={handleSaveRemarks} className="p-4 bg-sky-50/70 border border-teal-200 rounded-xl space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-sky-200/60">
                      <div>
                        <strong className="text-slate-800 text-xs block">
                          Edit Follow-Up Remarks & Dates
                        </strong>
                        <span className="text-[11px] text-slate-500">
                          Every entry is editable. You can add unlimited follow-up milestones.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddDetailFollowUp}
                        className="px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Add Follow-Up Remark</span>
                      </button>
                    </div>

                    {/* Initial Remarks */}
                    <div>
                      <label className="block text-slate-700 font-semibold text-[11px] mb-1">
                        Initial Remarks / Client Preferences:
                      </label>
                      <textarea
                        rows={2}
                        value={initialRemark}
                        onChange={e => setInitialRemark(e.target.value)}
                        placeholder="Initial intake remarks..."
                        className="w-full p-2 bg-white border border-sky-200 rounded-lg text-slate-800 text-xs shadow-2xs focus:border-teal-500 focus:outline-none"
                      />
                    </div>

                    {/* Unrestricted Follow-up Entries */}
                    <div className="space-y-3">
                      {detailFollowUps.map((item, idx) => (
                        <div
                          key={item.id}
                          className="p-3 bg-white rounded-lg border border-sky-200 space-y-2 shadow-2xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-teal-800">
                              Follow-Up {item.index}
                            </span>
                            {detailFollowUps.length > 1 && idx > 0 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveDetailFollowUp(item.id)}
                                className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50"
                                title="Remove this follow-up"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                            <div className="sm:col-span-4">
                              <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">
                                Milestone Date:
                              </label>
                              <input
                                type="date"
                                value={item.date}
                                onChange={e => handleUpdateDetailFollowUp(item.id, 'date', e.target.value)}
                                className="w-full p-1.5 bg-slate-50 border border-sky-200 rounded text-slate-800 font-mono text-xs"
                              />
                            </div>
                            <div className="sm:col-span-8">
                              <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">
                                Remarks.{item.index} Notes:
                              </label>
                              <input
                                type="text"
                                value={item.remark}
                                onChange={e => handleUpdateDetailFollowUp(item.id, 'remark', e.target.value)}
                                placeholder={`Enter discussion points for Follow-Up #${item.index}...`}
                                className="w-full p-1.5 bg-slate-50 border border-sky-200 rounded text-slate-800 text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-sky-200/60">
                      <button
                        type="button"
                        onClick={handleAddDetailFollowUp}
                        className="text-teal-700 hover:text-teal-900 text-xs font-semibold flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Another Follow-Up (No limit)</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingRemarks(false)}
                          className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Update</span>
                        </button>
                      </div>
                    </div>
                  </form>
                ) : (
                  /* Display Mode */
                  <div className="space-y-3">
                    {/* Follow-up dates card */}
                    <div className="p-3 bg-white rounded-xl border border-sky-100 shadow-2xs">
                      <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Follow-Up Schedule ({detailFollowUps.length} Milestones)
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 font-mono text-xs">
                        {detailFollowUps.map(item => (
                          <div key={item.id} className="p-2 bg-sky-50/50 rounded-lg border border-sky-100">
                            <span className="text-slate-500 block text-[10px]">Follow-Up {item.index}:</span>
                            <strong className={item.date ? 'text-teal-700' : 'text-slate-400'}>
                              {item.date ? formatDisplayDate(item.date) : 'Not scheduled'}
                            </strong>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Remarks notes */}
                    <div className="space-y-2">
                      <div className="p-2.5 bg-white rounded-lg border border-sky-100 text-[11px]">
                        <span className="text-slate-600 font-bold block mb-0.5">Initial Remarks:</span>
                        <p className="text-slate-700 whitespace-pre-wrap">{enquiry.remarks || '—'}</p>
                      </div>

                      {detailFollowUps.map(item => (
                        item.remark ? (
                          <div key={item.id} className="p-2.5 bg-white rounded-lg border border-teal-100 text-[11px]">
                            <span className="text-teal-700 font-bold block mb-0.5">
                              Remarks.{item.index} (Follow-Up {item.index} Note {item.date ? `• ${formatDisplayDate(item.date)}` : ''}):
                            </span>
                            <p className="text-slate-700 whitespace-pre-wrap">{item.remark}</p>
                          </div>
                        ) : null
                      ))}
                    </div>

                    {isSaved && (
                      <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>Remarks updated successfully!</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Quotation & Multi-Send History Card */}
          <div className="p-4 bg-teal-50/40 border border-teal-200/80 rounded-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-teal-200/60">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-teal-700" />
                <h3 className="text-xs font-bold text-teal-900 uppercase tracking-wider">
                  Quotation & 1-Click Multi-Channel Dispatch History
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSendHubOpen(true)}
                  className="px-3 py-1 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                  <span>Send Quotation Again</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="px-3 py-1 bg-white hover:bg-teal-50 text-teal-800 border border-teal-300 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileDown className="w-3 h-3 text-teal-600" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>

            {(!currentEnquiryState.quotationSendHistory || currentEnquiryState.quotationSendHistory.length === 0) ? (
              <p className="text-xs text-slate-500 italic py-1">
                No quotations have been dispatched yet for Ref #{currentEnquiryState.refNo}. Click "Send Quotation" above to dispatch via WhatsApp, Gmail, Telegram or download PDF.
              </p>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-teal-800 font-semibold mb-1">
                  <span>Dispatched {currentEnquiryState.quotationSendHistory.length} times to guest</span>
                  <span>Latest: {currentEnquiryState.quotationSendHistory[0].timestamp}</span>
                </div>
                {currentEnquiryState.quotationSendHistory.map(record => (
                  <div
                    key={record.id}
                    className="p-2.5 bg-white border border-teal-100 rounded-xl flex items-center justify-between text-xs shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                          record.channel === 'WhatsApp'
                            ? 'bg-emerald-100 text-emerald-800'
                            : record.channel === 'Gmail'
                            ? 'bg-rose-100 text-rose-800'
                            : record.channel === 'Telegram'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-teal-100 text-teal-800'
                        }`}
                      >
                        {record.channel}
                      </span>
                      <span className="text-slate-700">To: <strong>{record.recipient}</strong></span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500">By: {record.sentBy}</span>
                      {record.notes && (
                        <span className="text-slate-500 italic text-[11px]">({record.notes})</span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{record.timestamp}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-sky-50/80 border-t border-sky-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white hover:bg-sky-100 border border-sky-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {isSendHubOpen && (
        <QuotationSendHubModal
          enquiry={currentEnquiryState}
          onClose={() => setIsSendHubOpen(false)}
          onQuotationUpdated={updated => setCurrentEnquiryState(updated)}
        />
      )}

      {isBEOOpen && (
        <BEOModal
          isOpen={isBEOOpen}
          onClose={() => setIsBEOOpen(false)}
          enquiry={currentEnquiryState}
          venue={venue}
        />
      )}
    </div>
  );
};

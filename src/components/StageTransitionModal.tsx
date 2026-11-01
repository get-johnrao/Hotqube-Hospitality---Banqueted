import React, { useState, useEffect } from 'react';
import { Enquiry, PipelineStage, SettlementMode } from '../types';
import { useBEMS } from '../context/BEMSContext';

interface StageTransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  enquiry: Enquiry | null;
  targetStage?: PipelineStage | null;
  onTransitionSuccess?: () => void;
}

const PIPELINE_ORDER: PipelineStage[] = [
  'Portfolio Creation',
  'Quote Shared',
  'Initial Discussion - Quote Sharing (Tentative)',
  'Venue Walkthrough Completed (Tentative)',
  'Expression of Interest (Tentative)',
  'Negotiation (Tentative)',
  'Negotiation',
  'Food Trial',
  'Advance Paid (EXCLUSIVE LOCK)',
  'Confirmed',
  'Balance Paid',
  'Function Completed',
  'Function Completed and Gift Sent',
  'Postponed',
  'Cancelled',
];

export const StageTransitionModal: React.FC<StageTransitionModalProps> = ({
  isOpen,
  onClose,
  enquiry,
  targetStage,
  onTransitionSuccess,
}) => {
  const { executeStageTransition, settlementModesMaster, activeUnit } = useBEMS();

  const [selectedStage, setSelectedStage] = useState<PipelineStage>('Confirmed');
  const [transitionNotes, setTransitionNotes] = useState<string>('');
  const [retractionReason, setRetractionReason] = useState<string>('Client Requested Revision');

  // Advance Payment State
  const [recordAdvance, setRecordAdvance] = useState<boolean>(false);
  const [advanceAmount, setAdvanceAmount] = useState<number>(0);
  const [settlementMode, setSettlementMode] = useState<SettlementMode>('Bank Transfer' as SettlementMode);
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (targetStage) {
      setSelectedStage(targetStage);
    } else if (enquiry) {
      // Suggest next logical stage
      const currentIdx = PIPELINE_ORDER.indexOf(enquiry.status);
      if (currentIdx >= 0 && currentIdx < PIPELINE_ORDER.length - 1) {
        setSelectedStage(PIPELINE_ORDER[currentIdx + 1]);
      } else {
        setSelectedStage('Confirmed');
      }
    }
  }, [targetStage, enquiry, isOpen]);

  useEffect(() => {
    if (enquiry) {
      const estimatedBill = enquiry.finalBillValue || (enquiry.quotedBaseRate || 1000) * (enquiry.gPax || 50);
      const suggestedAdvance = Math.round(estimatedBill * 0.3); // 30% standard banquet advance
      setAdvanceAmount(suggestedAdvance);

      const isLockStage = selectedStage === 'Confirmed' || selectedStage === 'Advance Paid (EXCLUSIVE LOCK)';
      setRecordAdvance(isLockStage && (enquiry.advancePaidAmount || 0) <= 0);

      const activeModes = settlementModesMaster.filter(m => m.isActive);
      if (activeModes.length > 0) {
        setSettlementMode(activeModes[0].name);
      }
    }
  }, [enquiry, selectedStage, settlementModesMaster]);

  if (!isOpen || !enquiry) return null;

  const currentIdx = PIPELINE_ORDER.indexOf(enquiry.status);
  const targetIdx = PIPELINE_ORDER.indexOf(selectedStage);
  const isRetraction = (currentIdx >= 8 && targetIdx < 8) || selectedStage === 'Cancelled' || selectedStage === 'Postponed';
  const isLockProgression = selectedStage === 'Confirmed' || selectedStage === 'Advance Paid (EXCLUSIVE LOCK)';

  const handleExecute = async () => {
    setErrorMsg(null);

    if (isRetraction && !transitionNotes.trim()) {
      setErrorMsg('A detailed audit note is required when retracting pipeline status or cancelling.');
      return;
    }

    if (recordAdvance && (!advanceAmount || advanceAmount <= 0)) {
      setErrorMsg('Please enter a valid advance payment amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      const notes = isRetraction
        ? `[Reason: ${retractionReason}] ${transitionNotes}`
        : transitionNotes;

      const advancePayload = recordAdvance && advanceAmount > 0 ? {
        amount: Number(advanceAmount),
        settlementMode,
        transactionRef,
        notes: paymentNotes || `Advance payment recorded at stage change to ${selectedStage}`,
      } : undefined;

      const res = executeStageTransition(
        enquiry.id,
        selectedStage,
        notes,
        advancePayload
      );

      if (res.success) {
        onTransitionSuccess?.();
        onClose();
      } else {
        setErrorMsg(res.message || 'Failed to update pipeline stage.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unexpected transition error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 shadow-2xl rounded-xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded">
                Ref #{enquiry.refNo}
              </span>
              <span className="text-xs text-slate-300 font-medium">
                {activeUnit.name} ({activeUnit.code})
              </span>
            </div>
            <h2 className="text-lg font-semibold tracking-tight mt-1">
              Pipeline Stage Transition Ceremony
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-start gap-2">
              <svg className="w-5 h-5 shrink-0 text-red-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Current vs Target Stage Banner */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Ceremonial Milestone Transition
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-7 gap-3 items-center">
              <div className="sm:col-span-3 p-3 bg-white border border-slate-200 rounded-lg">
                <div className="text-xs text-slate-400 uppercase font-medium">From Stage</div>
                <div className="font-semibold text-slate-800 text-sm mt-0.5 truncate">{enquiry.status}</div>
                <div className="text-xs text-slate-500 mt-1">Status: {enquiry.finalStatus || 'Tentative'}</div>
              </div>

              <div className="sm:col-span-1 flex justify-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  isRetraction ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {isRetraction ? '↩' : '➔'}
                </div>
              </div>

              <div className="sm:col-span-3 p-3 bg-white border border-slate-300 rounded-lg">
                <div className="text-xs text-slate-400 uppercase font-medium">Target Stage</div>
                <select
                  value={selectedStage}
                  onChange={e => setSelectedStage(e.target.value as PipelineStage)}
                  className="w-full mt-0.5 text-sm font-semibold text-slate-900 border-none p-0 focus:ring-0 bg-transparent cursor-pointer"
                >
                  {PIPELINE_ORDER.map(stage => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </select>
                <div className="text-xs text-slate-500 mt-1">
                  {isLockProgression ? 'Locks slot exclusively' : isRetraction ? 'Retracts booking status' : 'Standard progression'}
                </div>
              </div>
            </div>
          </div>

          {/* Summary Checklist */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Event Booking Verification
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block">Guest / Host</span>
                <span className="font-medium text-slate-800">{enquiry.guestName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Hall & Session</span>
                <span className="font-medium text-slate-800">{enquiry.hallName} ({enquiry.session})</span>
              </div>
              <div>
                <span className="text-slate-400 block">Event Date</span>
                <span className="font-medium text-slate-800">{enquiry.eventDate}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Guaranteed Pax</span>
                <span className="font-medium text-slate-800">{enquiry.gPax || 0} pax</span>
              </div>
            </div>
          </div>

          {/* Retraction Reason (if stepping backward or cancelling) */}
          {isRetraction && (
            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-lg space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-medium text-sm">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Stage Retraction Audit Requirements</span>
              </div>
              <p className="text-xs text-amber-800">
                Moving backward from a locked or confirmed stage requires logging the official business reason for hospitality auditing.
              </p>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Primary Retraction Reason
                </label>
                <select
                  value={retractionReason}
                  onChange={e => setRetractionReason(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Client Requested Revision">Client Requested Revision / Postponement</option>
                  <option value="Date / Slot Rescheduled">Date / Slot Rescheduled to Alternate Date</option>
                  <option value="Budget Negotiation Stalemate">Budget Negotiation Stalemate</option>
                  <option value="Competitor Alternative Chosen">Competitor Alternative Chosen</option>
                  <option value="Booking Cancelled by Guest">Booking Cancelled by Guest</option>
                  <option value="Force Majeure / Management Decision">Force Majeure / Management Decision</option>
                </select>
              </div>
            </div>
          )}

          {/* Advance Payment Module (if locking into confirmed status) */}
          {isLockProgression && (
            <div className="border border-slate-200 rounded-lg p-4 space-y-4 bg-slate-50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    Advance Payment Receipt
                  </div>
                  <div className="text-xs text-slate-500">
                    {enquiry.advancePaidAmount && enquiry.advancePaidAmount > 0
                      ? `Existing advance recorded: ₹${enquiry.advancePaidAmount.toLocaleString('en-IN')}`
                      : 'Recommended to record advance payment to solidify exclusive hall lock.'}
                  </div>
                </div>
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={recordAdvance}
                    onChange={e => setRecordAdvance(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {recordAdvance && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                      Advance Amount (₹) *
                    </label>
                    <input
                      type="number"
                      value={advanceAmount || ''}
                      onChange={e => setAdvanceAmount(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 font-semibold text-slate-900"
                      placeholder="e.g. 50000"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                      Settlement Mode *
                    </label>
                    <select
                      value={settlementMode}
                      onChange={e => setSettlementMode(e.target.value as SettlementMode)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                    >
                      {settlementModesMaster
                        .filter(m => m.isActive)
                        .map(m => (
                          <option key={m.id} value={m.name}>
                            {m.name} (GL: {m.glCode})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                      Transaction / Cheque / UTR Ref
                    </label>
                    <input
                      type="text"
                      value={transactionRef}
                      onChange={e => setTransactionRef(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                      placeholder="e.g. UTR-98234123 / Cheque #88120"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                      Payment Note
                    </label>
                    <input
                      type="text"
                      value={paymentNotes}
                      onChange={e => setPaymentNotes(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                      placeholder="e.g. 30% Token Advance"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Audit Trail Note */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Transition Audit Log & Remarks {isRetraction ? '(Mandatory) *' : '(Optional)'}
            </label>
            <textarea
              rows={3}
              value={transitionNotes}
              onChange={e => setTransitionNotes(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
              placeholder={
                isRetraction
                  ? 'Describe in detail the justification for retracting this booking or cancelling...'
                  : 'Enter any banquet manager remarks, client agreements, or conditions for this milestone...'
              }
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleExecute}
            disabled={isSubmitting}
            className={`px-5 py-2 rounded-lg text-sm font-semibold text-white shadow-sm transition-all flex items-center gap-2 ${
              isRetraction
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-slate-900 hover:bg-slate-800'
            }`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Committing Transition...
              </>
            ) : (
              <>
                <span>Commit Stage Transition</span>
                <span>➔</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

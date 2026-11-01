import React, { useState } from 'react';
import { Enquiry, PaymentReceipt, TaxInvoice, TaxInvoiceLineItem, SettlementMode } from '../types';
import { useBEMS } from '../context/BEMSContext';

interface FunctionProspectusBillingCardProps {
  enquiry: Enquiry;
  onOpenFPModal: (enquiry: Enquiry) => void;
  onRecordPaymentSuccess?: () => void;
}

export const FunctionProspectusBillingCard: React.FC<FunctionProspectusBillingCardProps> = ({
  enquiry,
  onOpenFPModal,
  onRecordPaymentSuccess,
}) => {
  const {
    activeUnit,
    currentUser,
    settlementModesMaster,
    recordPaymentReceipt,
    generateTaxInvoice,
    recordCashierTally,
  } = useBEMS();

  // Tab navigation inside card
  const [activeTab, setActiveTab] = useState<'fp' | 'payments' | 'invoices' | 'tally'>('fp');

  // Payment Recording State
  const [showAddPayment, setShowAddPayment] = useState<boolean>(false);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payType, setPayType] = useState<PaymentReceipt['paymentType']>('Advance');
  const [payMode, setPayMode] = useState<SettlementMode>('Bank Transfer' as SettlementMode);
  const [payTxRef, setPayTxRef] = useState<string>('');
  const [payNotes, setPayNotes] = useState<string>('');
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);

  // Invoice Generation State
  const [showCreateInvoice, setShowCreateInvoice] = useState<boolean>(false);
  const [invoiceType, setInvoiceType] = useState<'Proforma' | 'Tax Invoice'>('Tax Invoice');
  const [billingAddress, setBillingAddress] = useState<string>(enquiry.billingAddress || `${enquiry.guestName}, ${activeUnit.name}`);
  const [gstin, setGstin] = useState<string>(enquiry.gstin || '');
  const [lineItems, setLineItems] = useState<TaxInvoiceLineItem[]>([
    {
      id: 'item-1',
      description: `Banquet Hall Rental - ${enquiry.hallName} (${enquiry.session})`,
      sacCode: '997212',
      quantity: 1,
      rate: enquiry.hallRent || (enquiry.quotedBaseRate || 1000) * 0.4 * (enquiry.gPax || 50),
      amount: enquiry.hallRent || (enquiry.quotedBaseRate || 1000) * 0.4 * (enquiry.gPax || 50),
    },
    {
      id: 'item-2',
      description: `Banquet F&B Catering & Food Package (${enquiry.menuCategory || 'Banquet Buffet'})`,
      sacCode: '996331',
      quantity: enquiry.gPax || 50,
      rate: (enquiry.quotedBaseRate || 1000) * 0.6,
      amount: (enquiry.gPax || 50) * ((enquiry.quotedBaseRate || 1000) * 0.6),
    },
  ]);

  // Cashier Tally State
  const [showTallyModal, setShowTallyModal] = useState<boolean>(false);
  const [counterNo, setCounterNo] = useState<string>('COUNTER-1');
  const [shift, setShift] = useState<'Morning' | 'Evening' | 'Full Day'>('Evening');
  const [tallySuccessMsg, setTallySuccessMsg] = useState<string | null>(null);

  // Calculations for Invoice
  const subtotal = lineItems.reduce((acc, item) => acc + (item.amount || 0), 0);
  const cgstAmount = Math.round(subtotal * 0.09); // 9%
  const sgstAmount = Math.round(subtotal * 0.09); // 9%
  const totalTaxAmount = cgstAmount + sgstAmount; // 18%
  const invoiceTotal = subtotal + totalTaxAmount;
  const totalAdvancesPaid = enquiry.advancePaidAmount || enquiry.advanceAmount || 0;
  const netDue = Math.max(0, invoiceTotal - totalAdvancesPaid);

  // Active check
  const todayStr = new Date().toISOString().split('T')[0];
  const isFunctionDay = enquiry.eventDate === todayStr;
  const hasAdvancePaid = (enquiry.advancePaidAmount && enquiry.advancePaidAmount > 0) || (enquiry.advanceAmount && enquiry.advanceAmount > 0);
  const isConfirmed = enquiry.status === 'Confirmed' || enquiry.status === 'Advance Paid (EXCLUSIVE LOCK)' || enquiry.status === 'Balance Paid';
  const isActivated = hasAdvancePaid || (isFunctionDay && isConfirmed);

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payAmount || payAmount <= 0) return;

    const res = recordPaymentReceipt({
      enquiryId: enquiry.id,
      enquiryRefNo: enquiry.refNo,
      guestName: enquiry.guestName,
      companyName: enquiry.companyName,
      paymentType: payType,
      amount: Number(payAmount),
      settlementMode: payMode,
      transactionRef: payTxRef,
      notes: payNotes,
    });

    if (res.success && res.receipt) {
      setPaymentSuccessMsg(`Receipt #${res.receipt.receiptNo} recorded for ₹${payAmount.toLocaleString('en-IN')}`);
      setShowAddPayment(false);
      setPayAmount(0);
      setPayTxRef('');
      setPayNotes('');
      onRecordPaymentSuccess?.();
      setTimeout(() => setPaymentSuccessMsg(null), 4000);
    }
  };

  const handleGenerateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date().toISOString().split('T')[0];
    const res = generateTaxInvoice({
      invoiceType,
      enquiryId: enquiry.id,
      enquiryRefNo: enquiry.refNo,
      guestName: enquiry.guestName,
      companyName: enquiry.companyName,
      billingAddress,
      gstin,
      invoiceDate: today,
      dueDate: today,
      lineItems,
      subtotal,
      cgstRate: 9,
      cgstAmount,
      sgstRate: 9,
      sgstAmount,
      totalAmount: invoiceTotal,
      advanceAdjusted: totalAdvancesPaid,
      netPayable: netDue,
      status: 'Issued',
    });

    if (res.success && res.invoice) {
      setShowCreateInvoice(false);
      setActiveTab('invoices');
    }
  };

  const handleCashierTallyCommit = () => {
    const receipts = enquiry.paymentReceipts || [];
    let cash = 0;
    let cards = 0;
    let upi = 0;
    let bank = 0;
    let btc = 0;

    receipts.forEach(r => {
      if (r.settlementMode === 'Cash') cash += r.amount;
      else if (r.settlementMode === 'Credit Card' || r.settlementMode === 'Debit Card') cards += r.amount;
      else if (r.settlementMode === 'UPI / QR') upi += r.amount;
      else if (r.settlementMode === 'Direct Bank Transfer (NEFT/RTGS)') bank += r.amount;
      else if (r.settlementMode === 'Bill to Company (BTC)') btc += r.amount;
      else bank += r.amount;
    });

    const total = cash + cards + upi + bank + btc;

    const res = recordCashierTally({
      date: new Date().toISOString().split('T')[0],
      shift,
      counterNo,
      totalCash: cash,
      totalCards: cards,
      totalUPI: upi,
      totalBank: bank,
      totalBTC: btc,
      totalCollection: total,
      receiptCount: receipts.length,
      reconciled: true,
      notes: `Settlement reconciliation for event Ref #${enquiry.refNo} (${enquiry.guestName})`,
    });

    if (res.success) {
      setTallySuccessMsg(`Shift handover tally #${res.tally?.tallyNo} committed.`);
      setShowTallyModal(false);
      setActiveTab('tally');
      setTimeout(() => setTallySuccessMsg(null), 4000);
    }
  };

  if (!isActivated) {
    return (
      <div className="mt-4 p-4 border border-dashed border-slate-300 rounded-xl bg-slate-50/70 text-slate-500 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs uppercase tracking-wider">
            FP / Bill
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-700">
              Function Prospectus (FP) & Billing Desk
            </div>
            <div className="text-xs text-slate-500">
              Activates automatically once an advance payment is recorded or on the function date ({enquiry.eventDate}) for confirmed bookings.
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            setPayType('Advance');
            setPayAmount(Math.round((enquiry.finalBillValue || 50000) * 0.3));
            setShowAddPayment(true);
            setActiveTab('payments');
          }}
          className="px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors shrink-0"
        >
          + Record Advance Now
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
      {/* Top Banner */}
      <div className="px-5 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 bg-amber-500 text-slate-950 font-mono font-bold text-xs rounded tracking-wider">
            FP & BILLING DESK
          </span>
          <span className="text-sm font-semibold tracking-tight">
            Function Prospectus & Commercial Lifecycle
          </span>
          {isFunctionDay && (
            <span className="px-2 py-0.5 bg-rose-600 text-white text-[11px] font-bold rounded animate-pulse">
              TODAY'S EVENT
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenFPModal(enquiry)}
            className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <span>📜</span>
            <span>View Function Prospectus (FP)</span>
          </button>
          <button
            onClick={() => {
              setShowAddPayment(true);
              setActiveTab('payments');
            }}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            + Record Payment
          </button>
          <button
            onClick={() => {
              setShowCreateInvoice(true);
              setActiveTab('invoices');
            }}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            + Raise Tax Invoice
          </button>
        </div>
      </div>

      {/* Financial Health Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-100 bg-slate-50 border-b border-slate-200 text-xs">
        <div className="p-3">
          <span className="text-slate-500 block font-medium">Final Bill Estimate</span>
          <span className="text-sm font-bold text-slate-900">
            ₹{(enquiry.finalBillValue || 0).toLocaleString('en-IN')}
          </span>
        </div>
        <div className="p-3">
          <span className="text-slate-500 block font-medium">Advance Paid</span>
          <span className="text-sm font-bold text-emerald-700">
            ₹{totalAdvancesPaid.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="p-3">
          <span className="text-slate-500 block font-medium">Balance Due</span>
          <span className={`text-sm font-bold ${(enquiry.balanceDueAmount || 0) > 0 ? 'text-amber-700' : 'text-slate-600'}`}>
            ₹{(enquiry.balanceDueAmount ?? Math.max(0, (enquiry.finalBillValue || 0) - totalAdvancesPaid)).toLocaleString('en-IN')}
          </span>
        </div>
        <div className="p-3">
          <span className="text-slate-500 block font-medium">Receipts & Invoices</span>
          <span className="text-sm font-bold text-slate-800">
            {(enquiry.paymentReceipts || []).length} receipts / {(enquiry.invoices || []).length} invoices
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 px-4 gap-2 pt-2 text-xs font-semibold bg-slate-50/50">
        <button
          onClick={() => setActiveTab('fp')}
          className={`pb-2.5 px-3 border-b-2 transition-colors ${
            activeTab === 'fp'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Function Prospectus (FP) Specs
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-2.5 px-3 border-b-2 transition-colors ${
            activeTab === 'payments'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Payment Receipts ({(enquiry.paymentReceipts || []).length})
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`pb-2.5 px-3 border-b-2 transition-colors ${
            activeTab === 'invoices'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Tax Invoices & GST ({(enquiry.invoices || []).length})
        </button>
        <button
          onClick={() => setActiveTab('tally')}
          className={`pb-2.5 px-3 border-b-2 transition-colors ${
            activeTab === 'tally'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Cashier Settlement & Tally
        </button>
      </div>

      {paymentSuccessMsg && (
        <div className="m-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center justify-between">
          <span>✓ {paymentSuccessMsg}</span>
          <button onClick={() => setPaymentSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">×</button>
        </div>
      )}

      {tallySuccessMsg && (
        <div className="m-4 p-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-lg flex items-center justify-between">
          <span>✓ {tallySuccessMsg}</span>
          <button onClick={() => setTallySuccessMsg(null)} className="text-blue-700 hover:text-blue-900 font-bold">×</button>
        </div>
      )}

      {/* Tab 1: FP Details Overview */}
      {activeTab === 'fp' && (
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Kitchen & Catering */}
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
              <div className="font-semibold text-slate-800 flex items-center gap-1.5 mb-2">
                <span>🍽️</span>
                <span>F&B / Kitchen Service</span>
              </div>
              <div className="space-y-1 text-slate-600">
                <div><span className="font-medium text-slate-700">Package:</span> {enquiry.menuCategory || 'Standard Buffet'}</div>
                <div><span className="font-medium text-slate-700">Guaranteed Pax:</span> {enquiry.gPax || 50} pax</div>
                <div><span className="font-medium text-slate-700">Expected Pax:</span> {enquiry.expPax || enquiry.gPax || 50} pax</div>
                <div><span className="font-medium text-slate-700">Food Trial:</span> {enquiry.status === 'Food Trial' ? 'Completed' : 'Not Requested'}</div>
                {enquiry.fpDetails?.chefNotes && (
                  <div className="mt-1 pt-1 border-t border-slate-200 text-slate-500 italic">"{enquiry.fpDetails.chefNotes}"</div>
                )}
              </div>
            </div>

            {/* Hall Setup & Layout */}
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
              <div className="font-semibold text-slate-800 flex items-center gap-1.5 mb-2">
                <span>🏛️</span>
                <span>Hall Setup & Engineering</span>
              </div>
              <div className="space-y-1 text-slate-600">
                <div><span className="font-medium text-slate-700">Venue:</span> {enquiry.hallName}</div>
                <div><span className="font-medium text-slate-700">Session:</span> {enquiry.session}</div>
                <div><span className="font-medium text-slate-700">Seating:</span> {enquiry.seatingArrangement || 'Theatre'}</div>
                <div><span className="font-medium text-slate-700">AC Pre-Cool:</span> {enquiry.fpDetails?.airConditionPreCoolTime || '60 mins prior'}</div>
                <div><span className="font-medium text-slate-700">Stage Dimensions:</span> {enquiry.fpDetails?.stageDimensions || 'Standard Hotel Podium'}</div>
              </div>
            </div>

            {/* AV & Department Sign-Offs */}
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
              <div className="font-semibold text-slate-800 flex items-center gap-1.5 mb-2">
                <span>🔊</span>
                <span>AV & Sign-Offs</span>
              </div>
              <div className="space-y-1 text-slate-600">
                <div><span className="font-medium text-slate-700">Mics / AV:</span> {enquiry.fpDetails?.cordlessMicsCount || 2} Cordless / 1 Podium</div>
                <div><span className="font-medium text-slate-700">Projector:</span> {enquiry.fpDetails?.projectorScreensCount ? `${enquiry.fpDetails.projectorScreensCount} Screen(s)` : 'Available'}</div>
                <div><span className="font-medium text-slate-700">Banquet Mgr:</span> {enquiry.fpDetails?.banquetManagerSign || 'Staff Signed'}</div>
                <div><span className="font-medium text-slate-700">Dispatches:</span> {(enquiry.fpSendHistory || enquiry.beoSendHistory || []).length} department logs</div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-xs text-slate-500">
              Function Prospectus (FP) acts as the single operational truth across Kitchen, Service, and Engineering.
            </span>
            <button
              onClick={() => onOpenFPModal(enquiry)}
              className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              Open Full Function Prospectus Editor ➔
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Payments & Receipts */}
      {activeTab === 'payments' && (
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Payment Receipts Ledger
            </span>
            <button
              onClick={() => setShowAddPayment(prev => !prev)}
              className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              {showAddPayment ? 'Cancel' : '+ New Payment Receipt'}
            </button>
          </div>

          {/* Form to add payment */}
          {showAddPayment && (
            <form onSubmit={handleRecordPayment} className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <div className="font-semibold text-xs text-slate-800 uppercase tracking-wider">
                Record New Payment Receipt
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Type</label>
                  <select
                    value={payType}
                    onChange={e => setPayType(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white"
                  >
                    <option value="Advance">Advance</option>
                    <option value="Part Payment">Part Payment</option>
                    <option value="Final Settlement">Final Settlement</option>
                    <option value="Security Deposit">Security Deposit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Amount (₹) *</label>
                  <input
                    type="number"
                    value={payAmount || ''}
                    onChange={e => setPayAmount(Number(e.target.value))}
                    required
                    placeholder="e.g. 50000"
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Settlement Mode</label>
                  <select
                    value={payMode}
                    onChange={e => setPayMode(e.target.value as SettlementMode)}
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white"
                  >
                    {settlementModesMaster.filter(m => m.isActive).map(m => (
                      <option key={m.id} value={m.name}>
                        {m.name} ({m.glCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Transaction / UTR Ref</label>
                  <input
                    type="text"
                    value={payTxRef}
                    onChange={e => setPayTxRef(e.target.value)}
                    placeholder="e.g. UTR-182390123"
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium text-xs">Payment Notes</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={e => setPayNotes(e.target.value)}
                  placeholder="e.g. 2nd instalment paid by cheque"
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddPayment(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700"
                >
                  Save Payment Receipt
                </button>
              </div>
            </form>
          )}

          {/* Receipts list */}
          {(enquiry.paymentReceipts || []).length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs">
              No payments recorded yet for Ref #{enquiry.refNo}. Click "+ New Payment Receipt" to record the first advance.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-lg overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2">Receipt #</th>
                    <th className="px-3 py-2">Date & Time</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Mode</th>
                    <th className="px-3 py-2">Tx Ref</th>
                    <th className="px-3 py-2 text-right">Amount (₹)</th>
                    <th className="px-3 py-2">Cashier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {enquiry.paymentReceipts?.map(rcpt => (
                    <tr key={rcpt.id} className="hover:bg-slate-50/50">
                      <td className="px-3 py-2 font-mono font-bold text-slate-900">{rcpt.receiptNo}</td>
                      <td className="px-3 py-2 text-slate-600">{rcpt.timestamp}</td>
                      <td className="px-3 py-2">
                        <span className="px-2 py-0.5 rounded font-medium bg-slate-100 text-slate-800">
                          {rcpt.paymentType}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-700 font-medium">{rcpt.settlementMode}</td>
                      <td className="px-3 py-2 text-slate-500 font-mono">{rcpt.transactionRef || '—'}</td>
                      <td className="px-3 py-2 text-right font-bold text-emerald-700">
                        ₹{rcpt.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-slate-500">{rcpt.receivedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Tax Invoices & GST */}
      {activeTab === 'invoices' && (
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tax Invoices & Proforma Invoices (GST 18%)
            </span>
            <button
              onClick={() => setShowCreateInvoice(prev => !prev)}
              className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors"
            >
              {showCreateInvoice ? 'Cancel' : '+ Generate Tax Invoice'}
            </button>
          </div>

          {/* Form to raise Tax Invoice */}
          {showCreateInvoice && (
            <form onSubmit={handleGenerateInvoice} className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <div className="font-semibold text-xs text-slate-800 uppercase tracking-wider">
                Generate Indian GST Tax Invoice
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Invoice Document Type</label>
                  <select
                    value={invoiceType}
                    onChange={e => setInvoiceType(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-semibold"
                  >
                    <option value="Tax Invoice">Official GST Tax Invoice</option>
                    <option value="Proforma">Proforma Estimate Invoice</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Client GSTIN (Optional)</label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={e => setGstin(e.target.value.toUpperCase())}
                    placeholder="33AAAAA0000A1Z5"
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Billing Address</label>
                  <input
                    type="text"
                    value={billingAddress}
                    onChange={e => setBillingAddress(e.target.value)}
                    placeholder="Client or Company Address"
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white"
                  />
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-2 pt-2">
                <div className="text-xs font-medium text-slate-700">Tax Invoice Line Items (SAC Codes)</div>
                {lineItems.map((item, idx) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-center text-xs">
                    <input
                      type="text"
                      value={item.description}
                      onChange={e => {
                        const updated = [...lineItems];
                        updated[idx].description = e.target.value;
                        setLineItems(updated);
                      }}
                      className="col-span-5 border border-slate-300 rounded px-2 py-1 bg-white"
                    />
                    <input
                      type="text"
                      value={item.sacCode}
                      onChange={e => {
                        const updated = [...lineItems];
                        updated[idx].sacCode = e.target.value;
                        setLineItems(updated);
                      }}
                      placeholder="SAC"
                      className="col-span-2 border border-slate-300 rounded px-2 py-1 bg-white font-mono"
                    />
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={e => {
                        const updated = [...lineItems];
                        updated[idx].quantity = Number(e.target.value);
                        updated[idx].amount = updated[idx].quantity * updated[idx].rate;
                        setLineItems(updated);
                      }}
                      placeholder="Qty"
                      className="col-span-1 border border-slate-300 rounded px-2 py-1 bg-white"
                    />
                    <input
                      type="number"
                      value={item.rate}
                      onChange={e => {
                        const updated = [...lineItems];
                        updated[idx].rate = Number(e.target.value);
                        updated[idx].amount = updated[idx].quantity * updated[idx].rate;
                        setLineItems(updated);
                      }}
                      placeholder="Rate"
                      className="col-span-2 border border-slate-300 rounded px-2 py-1 bg-white"
                    />
                    <div className="col-span-2 font-semibold text-slate-900 text-right">
                      ₹{item.amount.toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Tax Computation Summary */}
              <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs space-y-1.5 max-w-sm ml-auto">
                <div className="flex justify-between text-slate-600">
                  <span>Taxable Subtotal:</span>
                  <span className="font-semibold text-slate-900">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>CGST @ 9%:</span>
                  <span className="font-semibold text-slate-900">₹{cgstAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>SGST @ 9%:</span>
                  <span className="font-semibold text-slate-900">₹{sgstAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-100">
                  <span>Total Invoice Value:</span>
                  <span>₹{invoiceTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Less Advance Adjusted:</span>
                  <span>- ₹{totalAdvancesPaid.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between font-bold text-rose-700 pt-1 border-t border-slate-200 text-sm">
                  <span>Net Payable Amount:</span>
                  <span>₹{netDue.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateInvoice(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
                >
                  Commit & Issue {invoiceType}
                </button>
              </div>
            </form>
          )}

          {/* Invoices List */}
          {(enquiry.invoices || []).length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs">
              No tax invoices issued yet. Click "+ Generate Tax Invoice" to create a GST compliant invoice.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-lg overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2">Invoice #</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2 text-right">Taxable</th>
                    <th className="px-3 py-2 text-right">GST (18%)</th>
                    <th className="px-3 py-2 text-right">Total (₹)</th>
                    <th className="px-3 py-2 text-right">Advance Adj</th>
                    <th className="px-3 py-2 text-right">Net Due (₹)</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {enquiry.invoices?.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50/50">
                      <td className="px-3 py-2 font-mono font-bold text-slate-900">{inv.invoiceNo}</td>
                      <td className="px-3 py-2">
                        <span className="px-2 py-0.5 rounded font-medium bg-slate-100 text-slate-800">
                          {inv.invoiceType}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-600">{inv.invoiceDate}</td>
                      <td className="px-3 py-2 text-right font-medium text-slate-700">
                        ₹{inv.subtotal.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-600">
                        ₹{(inv.cgstAmount + inv.sgstAmount).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-slate-900">
                        ₹{inv.totalAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-right text-emerald-700">
                        ₹{inv.advanceAdjusted.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-rose-700">
                        ₹{inv.netPayable.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Cashier Settlement & Tally */}
      {activeTab === 'tally' && (
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-800">
                Front Desk & Cashier Shift Handover Tally
              </div>
              <div className="text-xs text-slate-500">
                Reconciliation breakdown across payment modes for Ref #{enquiry.refNo}
              </div>
            </div>
            <button
              onClick={() => setShowTallyModal(true)}
              className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              + Commit Shift Tally
            </button>
          </div>

          {/* Breakdown cards */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
            {['Cash', 'Credit Card', 'Debit Card', 'UPI / QR', 'Direct Bank Transfer (NEFT/RTGS)', 'Bill to Company (BTC)'].map(mode => {
              const totalForMode = (enquiry.paymentReceipts || [])
                .filter(r => r.settlementMode === mode)
                .reduce((sum, r) => sum + r.amount, 0);

              return (
                <div key={mode} className="border border-slate-200 rounded-lg p-2.5 bg-slate-50/50">
                  <span className="text-[11px] text-slate-500 truncate block font-medium">{mode}</span>
                  <span className="text-xs font-bold text-slate-900 mt-1 block">
                    ₹{totalForMode.toLocaleString('en-IN')}
                  </span>
                </div>
              );
            })}
          </div>

          {showTallyModal && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <div className="font-semibold text-xs text-slate-800 uppercase tracking-wider">
                Commit Cashier Shift Handover Tally
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Counter Station</label>
                  <select
                    value={counterNo}
                    onChange={e => setCounterNo(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white"
                  >
                    <option value="COUNTER-1">COUNTER-1 (Banquet Sales Desk)</option>
                    <option value="COUNTER-2">COUNTER-2 (Front Desk Main)</option>
                    <option value="ACCOUNTS-DESK">ACCOUNTS-DESK (Finance Hub)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Duty Shift</label>
                  <select
                    value={shift}
                    onChange={e => setShift(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white"
                  >
                    <option value="Morning">Morning Shift (07:00 - 15:30)</option>
                    <option value="Evening">Evening Shift (15:00 - 23:30)</option>
                    <option value="Full Day">Full Day Handover</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTallyModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCashierTallyCommit}
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
                >
                  Confirm & Commit Tally Entry
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

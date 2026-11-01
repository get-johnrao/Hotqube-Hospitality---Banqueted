import React, { useState } from 'react';
import { Enquiry, VenueHall, QuotationChannel } from '../types';
import { useBEMS } from '../context/BEMSContext';
import { generateBanquetQuotationPdf } from '../utils/pdfQuotationGenerator';
import { formatINR } from '../utils/formatters';
import {
  X,
  Send,
  Mail,
  MessageSquare,
  Share2,
  FileDown,
  Clock,
  CheckCircle,
  Copy,
  ExternalLink,
  History,
  AlertCircle,
  Building2,
  Calendar,
  Users,
  Eye,
  Check,
} from 'lucide-react';

interface QuotationSendHubModalProps {
  enquiry: Enquiry;
  onClose: () => void;
  onQuotationUpdated?: (updatedEnquiry: Enquiry) => void;
}

export const QuotationSendHubModal: React.FC<QuotationSendHubModalProps> = ({
  enquiry,
  onClose,
  onQuotationUpdated,
}) => {
  const { currentUser, quotationSettings, venues, recordQuotationSend } = useBEMS();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [customNotes, setCustomNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'dispatch' | 'history' | 'preview'>('dispatch');
  const [currentEnquiry, setCurrentEnquiry] = useState<Enquiry>(enquiry);

  const venue = venues.find(v => v.id === currentEnquiry.hallId);

  // Calculations
  const baseRate = currentEnquiry.quotedBaseRate || 0;
  const pax = currentEnquiry.gPax || 1;
  const isVenueWithMeal = currentEnquiry.rateBillingType === 'Venue with Meal';
  const subtotal = isVenueWithMeal ? baseRate * pax : baseRate;
  const taxAmount = currentEnquiry.taxAmount ?? Math.round(subtotal * 0.18);
  const totalAmount = currentEnquiry.finalBillValue ?? subtotal + taxAmount;

  // Formatted Executive Message for WhatsApp & Telegram
  const formattedProposalMessage = `*BANQUET QUOTATION — ${quotationSettings.hotelName.toUpperCase()}*
Ref No: *${currentEnquiry.refNo}*
━━━━━━━━━━━━━━━━━━━━━
Dear *${currentEnquiry.guestName || 'Valued Guest'}*,
Greetings from *${quotationSettings.hotelName}*, Chennai!

We are pleased to present the official quotation for your upcoming *${currentEnquiry.eventType}*:

• *Event Date:* ${currentEnquiry.eventDate}
• *Venue Hall:* ${currentEnquiry.hallName}
• *Session Timings:* ${currentEnquiry.session}
• *Guaranteed Attendance:* ${currentEnquiry.gPax} Pax (Expected: ${currentEnquiry.expPax || currentEnquiry.gPax} Pax)
• *Seating Setup:* ${currentEnquiry.seatingArrangement}
• *Catering Plan:* ${currentEnquiry.menu}
${currentEnquiry.boardToRead ? `• *Welcome Board Display:* "${currentEnquiry.boardToRead}"\n` : ''}
*COMMERCIAL TARIFF & INVESTMENT:*
• Base Rate: ₹${formatINR(baseRate)} (${isVenueWithMeal ? 'Per Pax' : 'Hall Rent'})
• GST (18%): ₹${formatINR(taxAmount)}
• *Net Quotation Value:* *₹${formatINR(totalAmount)}* (All-Inclusive)
${(currentEnquiry.totalFocSavings || 0) > 0 ? `• *Complimentary FOC Privileges & Savings:* ₹${formatINR(currentEnquiry.totalFocSavings || 0)} (Special Concession)\n` : ''}
*KEY PRIVILEGES & INCLUSIONS:*
${currentEnquiry.detailedInclusions && currentEnquiry.detailedInclusions.length > 0 
  ? currentEnquiry.detailedInclusions.map(inc => inc.isFOC ? `✓ ${inc.name} (FOC / Complimentary - Value ₹${formatINR(inc.standardRate)})` : `✓ ${inc.name}`).join('\n')
  : `✓ Complimentary Podium & Cordless Mic Audio System
✓ Dedicated Guest Registration Desk & Event Coordinator
✓ High-Speed Wi-Fi & Standard Ambient Lighting
✓ Host Wash & Change Suite & Valet Parking Assistance`}

*BOOKING CONFIRMATION:*
To exclusively secure this date and hall, a 50% advance deposit is required. Tentative reservation valid for 48 hours.

Best Regards,
*${currentEnquiry.accountHandler || currentEnquiry.firstContactPerson || currentUser?.name || 'Banquet Sales Directorate'}*
${quotationSettings.hotelName} Chennai
Tel: ${quotationSettings.hotelPhone} | Email: ${quotationSettings.hotelEmail}`;

  // Formatted Email Subject & Body for Gmail
  const emailSubject = `Banquet Quotation: ${currentEnquiry.eventType} on ${currentEnquiry.eventDate} - ${quotationSettings.hotelName} (Ref: ${currentEnquiry.refNo})`;
  const emailBody = `Dear ${currentEnquiry.guestName || 'Valued Guest'},

Warm greetings from ${quotationSettings.hotelName}, Chennai!

Thank you for your interest in hosting your ${currentEnquiry.eventType} with us. It is our distinct pleasure to share our official proposal for your consideration:

EVENT DETAILS & SCHEDULE:
- Reference Number: ${currentEnquiry.refNo}
- Event Date: ${currentEnquiry.eventDate}
- Venue Hall: ${currentEnquiry.hallName}
- Session Timings: ${currentEnquiry.session}
- Guaranteed Attendance: ${currentEnquiry.gPax} Pax (Expected: ${currentEnquiry.expPax || currentEnquiry.gPax} Pax)
- Seating Arrangement: ${currentEnquiry.seatingArrangement}
- Menu Plan: ${currentEnquiry.menu}
${currentEnquiry.boardToRead ? `- Welcome Board Display: "${currentEnquiry.boardToRead}"\n` : ''}
COMMERCIAL TARIFF:
- Base Rate: Rs. ${formatINR(baseRate)} (${isVenueWithMeal ? 'Per Pax' : 'Hall Rent'})
- GST (18%): Rs. ${formatINR(taxAmount)}
- Total Estimated Investment: Rs. ${formatINR(totalAmount)} (All-Inclusive Net Value)
${(currentEnquiry.totalFocSavings || 0) > 0 ? `- Total Complimentary FOC Privileges & Savings: Rs. ${formatINR(currentEnquiry.totalFocSavings || 0)}\n` : ''}
INCLUSIONS & PRIVILEGES:
${currentEnquiry.detailedInclusions && currentEnquiry.detailedInclusions.length > 0 
  ? currentEnquiry.detailedInclusions.map(inc => inc.isFOC ? `- ${inc.name} [FOC / COMPLIMENTARY]` : `- ${inc.name}`).join('\n')
  : `- Complimentary Podium & PA System with Cordless Mics
- Complimentary High-Speed Wi-Fi for Attendees
- Elegantly draped Registration Desk
- Host Wash & Change Room facility
- Standard banquet setup, signage board, and valet parking`}

BOOKING TERMS:
This tentative reservation is held for 48 hours. An advance deposit of 50% guarantees an Exclusive Lock on the hall.

Kindly let us know if you require any special catering customisation or AV configurations. We look forward to creating an exceptional event for you.

Warm regards,

${currentEnquiry.accountHandler || currentEnquiry.firstContactPerson || currentUser?.name || 'Banquet Sales Directorate'}
${quotationSettings.hotelName}
115, Sir Thyagaraya Road, T. Nagar, Chennai - 600017
Tel: ${quotationSettings.hotelPhone}
Email: ${quotationSettings.hotelEmail}`;

  // Log send and update state
  const logSend = (channel: QuotationChannel, recipient: string, notes?: string) => {
    const record = recordQuotationSend(currentEnquiry.id, {
      channel,
      recipient,
      status: channel === 'PDF Download' ? 'Downloaded' : 'Sent',
      notes: notes || customNotes || undefined,
    });

    const updatedHistory = [record, ...(currentEnquiry.quotationSendHistory || [])];
    const updated = {
      ...currentEnquiry,
      quotationSendHistory: updatedHistory,
    };
    setCurrentEnquiry(updated);
    if (onQuotationUpdated) {
      onQuotationUpdated(updated);
    }
  };

  // 1-Click WhatsApp Send
  const handleSendWhatsApp = () => {
    let phone = (currentEnquiry.guestMobileMain || '').replace(/[^0-9]/g, '');
    if (phone.length === 10) {
      phone = '91' + phone; // Add India country code default
    }
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(formattedProposalMessage)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    logSend('WhatsApp', currentEnquiry.guestMobileMain || 'Guest Mobile');
  };

  // 1-Click Gmail Send
  const handleSendGmail = () => {
    const toEmail = currentEnquiry.email || '';
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(toEmail)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
    logSend('Gmail', toEmail || 'Guest Email');
  };

  // Mailto Fallback
  const handleSendMailto = () => {
    const toEmail = currentEnquiry.email || '';
    const mailtoUrl = `mailto:${encodeURIComponent(toEmail)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = mailtoUrl;
    logSend('Gmail', toEmail || 'Guest Email', 'Dispatched via system mailto');
  };

  // 1-Click Telegram Send
  const handleSendTelegram = () => {
    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent('https://theresidency.com')}&text=${encodeURIComponent(formattedProposalMessage)}`;
    window.open(tgUrl, '_blank', 'noopener,noreferrer');
    logSend('Telegram', currentEnquiry.guestMobileMain || currentEnquiry.guestName);
  };

  // Re-download PDF
  const handleDownloadPdf = () => {
    generateBanquetQuotationPdf(currentEnquiry, venue, quotationSettings, { download: true });
    logSend('PDF Download', `${currentEnquiry.refNo}.pdf`, 'Downloaded to device');
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const historyList = currentEnquiry.quotationSendHistory || [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white border border-sky-200 rounded-3xl max-w-3xl w-full shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header Bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-700 via-teal-800 to-cyan-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-teal-200">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight">1-Click Quotation Dispatch Hub</h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-teal-500/30 text-teal-100 border border-teal-400/30">
                  Ref: {currentEnquiry.refNo}
                </span>
              </div>
              <p className="text-xs text-teal-100/80">
                Send official quotation via WhatsApp, Gmail, or Telegram with tracked multi-send history
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Enquiry Summary Strip */}
        <div className="px-6 py-3 bg-sky-50/80 border-b border-sky-200/70 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 text-slate-700">
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">Guest / Company</span>
              <strong className="text-slate-900">{currentEnquiry.guestName}</strong>
              {currentEnquiry.companyName && (
                <span className="text-slate-500 block text-[11px] truncate max-w-[160px]">{currentEnquiry.companyName}</span>
              )}
            </div>
            <div className="hidden sm:block h-6 w-px bg-sky-200" />
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">Event & Venue</span>
              <span className="font-semibold text-slate-800">{currentEnquiry.eventType}</span>
              <span className="text-teal-700 block text-[11px] font-medium">{currentEnquiry.hallName}</span>
            </div>
            <div className="hidden sm:block h-6 w-px bg-sky-200" />
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">Date & Pax</span>
              <span className="font-mono text-slate-800">{currentEnquiry.eventDate}</span>
              <span className="text-slate-500 block text-[11px]">{currentEnquiry.gPax} Pax ({currentEnquiry.session})</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-slate-400 block text-[10px] font-semibold uppercase">Quotation Total</span>
            <div className="text-base font-extrabold text-teal-700 font-mono">
              ₹{formatINR(totalAmount)}
            </div>
            <span className="text-[10px] text-slate-400">All-Inclusive (18% GST)</span>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="px-6 pt-3 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('dispatch')}
              className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === 'dispatch'
                  ? 'border-teal-600 text-teal-800 bg-teal-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>1-Click Send Channels</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'border-teal-600 text-teal-800 bg-teal-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Dispatch History</span>
              {historyList.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-teal-100 text-teal-800 text-[10px] font-mono">
                  {historyList.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('preview')}
              className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === 'preview'
                  ? 'border-teal-600 text-teal-800 bg-teal-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Message Preview</span>
            </button>
          </div>

          <button
            onClick={handleDownloadPdf}
            className="mb-1 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            title="Download PDF Quotation File"
          >
            <FileDown className="w-3.5 h-3.5 text-sky-600" />
            <span>Download PDF</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'dispatch' && (
            <div className="space-y-5">
              {/* Recipient Coordinates Card */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">WhatsApp Recipient</span>
                    <strong className="text-slate-800 font-mono">
                      {currentEnquiry.guestMobileMain || 'No mobile entered'}
                    </strong>
                  </div>
                  <div className="h-6 w-px bg-slate-200" />
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Gmail Recipient</span>
                    <strong className="text-slate-800 font-mono">
                      {currentEnquiry.email || 'No email entered'}
                    </strong>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 italic">
                  *History updates automatically upon every send
                </div>
              </div>

              {/* 3 Primary 1-Click Channels */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. WhatsApp Button Card */}
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex flex-col justify-between hover:border-emerald-300 transition-all shadow-xs">
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-emerald-800 font-bold text-sm">
                      <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <span>WhatsApp</span>
                    </div>
                    <p className="text-xs text-emerald-900/80 mb-3">
                      Opens WhatsApp Web with pre-formatted proposal, tariff summary, and inclusions.
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-emerald-200/60">
                    <button
                      onClick={handleSendWhatsApp}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>1-Click Send WhatsApp</span>
                    </button>
                    <button
                      onClick={() => handleCopy(formattedProposalMessage, 'whatsapp')}
                      className="w-full py-1.5 text-[11px] text-emerald-800 hover:bg-emerald-100 rounded-lg font-medium flex items-center justify-center gap-1 transition-colors"
                    >
                      {copiedKey === 'whatsapp' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'whatsapp' ? 'Copied to Clipboard!' : 'Copy WhatsApp Message'}</span>
                    </button>
                  </div>
                </div>

                {/* 2. Email (Gmail) Button Card */}
                <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-2xl flex flex-col justify-between hover:border-sky-300 transition-all shadow-xs">
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-sky-800 font-bold text-sm">
                      <div className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center">
                        <Mail className="w-4 h-4" />
                      </div>
                      <span>Email (Gmail)</span>
                    </div>
                    <p className="text-xs text-sky-900/80 mb-3">
                      Opens Gmail compose directly in browser with recipient, subject, and proposal pre-filled.
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-sky-200/60">
                    <button
                      onClick={handleSendGmail}
                      className="w-full py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>1-Click Open Gmail</span>
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleSendMailto}
                        className="flex-1 py-1.5 text-[11px] text-sky-800 hover:bg-sky-100 rounded-lg font-medium flex items-center justify-center gap-1 transition-colors"
                      >
                        <Mail className="w-3 h-3" />
                        <span>System Mail</span>
                      </button>
                      <button
                        onClick={() => handleCopy(emailBody, 'email')}
                        className="flex-1 py-1.5 text-[11px] text-sky-800 hover:bg-sky-100 rounded-lg font-medium flex items-center justify-center gap-1 transition-colors"
                      >
                        {copiedKey === 'email' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'email' ? 'Copied!' : 'Copy Body'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. Telegram Button Card */}
                <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl flex flex-col justify-between hover:border-blue-300 transition-all shadow-xs">
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-blue-800 font-bold text-sm">
                      <div className="w-7 h-7 rounded-lg bg-blue-500 text-white flex items-center justify-center">
                        <Share2 className="w-4 h-4" />
                      </div>
                      <span>Telegram</span>
                    </div>
                    <p className="text-xs text-blue-900/80 mb-3">
                      Instant message dispatch via Telegram chat share with all quotation details formatted.
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-blue-200/60">
                    <button
                      onClick={handleSendTelegram}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>1-Click Send Telegram</span>
                    </button>
                    <button
                      onClick={() => handleCopy(formattedProposalMessage, 'telegram')}
                      className="w-full py-1.5 text-[11px] text-blue-800 hover:bg-blue-100 rounded-lg font-medium flex items-center justify-center gap-1 transition-colors"
                    >
                      {copiedKey === 'telegram' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'telegram' ? 'Copied!' : 'Copy Text'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Optional Note for this Dispatch */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Optional Note for this Dispatch (Logged in History):
                </label>
                <input
                  type="text"
                  value={customNotes}
                  onChange={e => setCustomNotes(e.target.value)}
                  placeholder="e.g. Sent initial quote after phone discussion; offered complimentary podium"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-teal-500 focus:outline-none"
                />
              </div>

              {/* Recent History Snippet */}
              {historyList.length > 0 && (
                <div className="p-4 bg-teal-50/50 border border-teal-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <History className="w-4 h-4 text-teal-700" />
                    <div>
                      <span className="text-xs font-bold text-teal-900 block">
                        Last Dispatched: {historyList[0].channel} on {historyList[0].timestamp}
                      </span>
                      <span className="text-[11px] text-teal-700">
                        Recipient: {historyList[0].recipient} • By: {historyList[0].sentBy}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('history')}
                    className="text-xs font-bold text-teal-800 hover:underline"
                  >
                    View All ({historyList.length}) →
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Quotation Dispatch History Log</h4>
                  <p className="text-xs text-slate-500">
                    Audit log of all quotations generated and sent for enquiry #{currentEnquiry.refNo}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                  Total Dispatches: {historyList.length}
                </span>
              </div>

              {historyList.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl">
                  <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600">No quotation dispatches logged yet</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Click any 1-click button (WhatsApp, Gmail, Telegram, or PDF) to dispatch and record in history.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {historyList.map(record => (
                    <div
                      key={record.id}
                      className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between hover:border-teal-300 transition-colors shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 ${
                            record.channel === 'WhatsApp'
                              ? 'bg-emerald-600'
                              : record.channel === 'Gmail'
                              ? 'bg-red-600'
                              : record.channel === 'Telegram'
                              ? 'bg-blue-500'
                              : 'bg-teal-600'
                          }`}
                        >
                          {record.channel === 'WhatsApp' && <MessageSquare className="w-4 h-4" />}
                          {record.channel === 'Gmail' && <Mail className="w-4 h-4" />}
                          {record.channel === 'Telegram' && <Share2 className="w-4 h-4" />}
                          {record.channel === 'PDF Download' && <FileDown className="w-4 h-4" />}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800">{record.channel}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">
                              {record.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2">
                            <span>To: <strong>{record.recipient}</strong></span>
                            <span>•</span>
                            <span>By: {record.sentBy}</span>
                          </div>
                          {record.notes && (
                            <p className="text-[11px] text-teal-800 italic mt-0.5">Note: "{record.notes}"</p>
                          )}
                        </div>
                      </div>

                      <div className="text-right text-[11px] text-slate-400 font-mono shrink-0">
                        {record.timestamp}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Raw Message Body Preview
                </h4>
                <button
                  onClick={() => handleCopy(formattedProposalMessage, 'raw_preview')}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {copiedKey === 'raw_preview' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'raw_preview' ? 'Copied' : 'Copy Full Text'}</span>
                </button>
              </div>

              <pre className="p-4 bg-slate-900 text-teal-200 rounded-2xl text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto border border-slate-800 shadow-inner">
                {formattedProposalMessage}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            Hotel Letterhead: <strong className="text-slate-800">{quotationSettings.hotelName}</strong>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

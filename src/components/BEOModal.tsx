import React, { useState } from 'react';
import {
  X,
  FileText,
  Download,
  Share2,
  Clock,
  UtensilsCrossed,
  Tv,
  CheckCircle2,
  Calendar,
  Building2,
  Users,
  MessageCircle,
  Mail,
  Send,
  Sparkles,
  Layers,
  ChefHat,
  Volume2
} from 'lucide-react';
import { Enquiry, VenueHall, BEODetails, BEODepartment, BEOSendRecord } from '../types';
import { generateBEOPdf } from '../utils/beoPdfGenerator';
import { useBEMS } from '../context/BEMSContext';

interface BEOModalProps {
  isOpen: boolean;
  onClose: () => void;
  enquiry: Enquiry;
  venue?: VenueHall;
}

export const BEOModal: React.FC<BEOModalProps> = ({
  isOpen,
  onClose,
  enquiry,
  venue,
}) => {
  const { updateEnquiry, quotationSettings, currentUser, recordBEOSend, recordFPSend, activeUnit } = useBEMS();

  // Active sub-tab: 'details' | 'dispatch'
  const [activeTab, setActiveTab] = useState<'details' | 'dispatch'>('details');

  // Form State initialized from enquiry.beoDetails
  const [beoData, setBeoData] = useState<BEODetails>({
    hallAccessTime: enquiry.beoDetails?.hallAccessTime || '2 Hours Prior',
    guestArrivalTime: enquiry.beoDetails?.guestArrivalTime || enquiry.session?.split('-')[0] || '11:00',
    starterServiceTime: enquiry.beoDetails?.starterServiceTime || '11:30',
    buffetOpeningTime: enquiry.beoDetails?.buffetOpeningTime || '12:45',
    dessertClearanceTime: enquiry.beoDetails?.dessertClearanceTime || '15:00',
    liquorServiceStartTime: enquiry.beoDetails?.liquorServiceStartTime || '',
    liquorServiceEndTime: enquiry.beoDetails?.liquorServiceEndTime || '',

    spicinessLevel: enquiry.beoDetails?.spicinessLevel || 'Medium',
    specialDietary: enquiry.beoDetails?.specialDietary || '',
    liveCounters: enquiry.beoDetails?.liveCounters || [],
    chefNotes: enquiry.beoDetails?.chefNotes || '',

    stageDimensions: enquiry.beoDetails?.stageDimensions || '16 ft x 8 ft x 1.5 ft',
    podiumRequired: enquiry.beoDetails?.podiumRequired ?? true,
    registrationDesk: enquiry.beoDetails?.registrationDesk ?? true,
    tableClothColor: enquiry.beoDetails?.tableClothColor || 'Ivory / Beige',
    airConditionPreCoolTime: enquiry.beoDetails?.airConditionPreCoolTime || '60 Mins Prior',

    cordlessMicsCount: enquiry.beoDetails?.cordlessMicsCount ?? 2,
    collarMicsCount: enquiry.beoDetails?.collarMicsCount ?? 1,
    projectorScreensCount: enquiry.beoDetails?.projectorScreensCount ?? 1,
    laptopAudioPatch: enquiry.beoDetails?.laptopAudioPatch ?? true,
    djMusicArrangement: enquiry.beoDetails?.djMusicArrangement || 'Hotel Playlist',

    banquetManagerSign: enquiry.beoDetails?.banquetManagerSign || currentUser?.name || '',
    executiveChefSign: enquiry.beoDetails?.executiveChefSign || '',
    beverageManagerSign: enquiry.beoDetails?.beverageManagerSign || '',
    engineeringAvSign: enquiry.beoDetails?.engineeringAvSign || '',
  });

  const [liveCounterInput, setLiveCounterInput] = useState('');
  const [isSavedToast, setIsSavedToast] = useState(false);

  // Dispatch state
  const [targetDept, setTargetDept] = useState<BEODepartment>('All Departments');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [dispatchSuccess, setDispatchSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveBEO = () => {
    const updated: Enquiry = {
      ...enquiry,
      beoDetails: beoData,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser?.username || 'admin',
    };
    updateEnquiry(updated);
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 2500);
  };

  const handleDownloadPDF = () => {
    const updated: Enquiry = {
      ...enquiry,
      beoDetails: beoData,
    };
    generateBEOPdf(updated, venue, quotationSettings, { download: true });
    if (recordBEOSend) {
      recordBEOSend(enquiry.id, {
        department: targetDept,
        channel: 'PDF Download',
        recipient: 'Internal System / Download',
        status: 'Downloaded',
        notes: `BEO generated and downloaded by ${currentUser?.name || 'Staff'}`
      });
    }
  };

  // Build department-specific dispatch text
  const generateBEOText = (dept: BEODepartment): string => {
    const dateFormatted = enquiry.eventDate;
    const hallTitle = enquiry.hallName || venue?.name || 'Grand Ballroom';
    const secondaryStr = enquiry.secondaryHalls && enquiry.secondaryHalls.length > 0
      ? ` + Composite: ${enquiry.secondaryHalls.map(h => h.hallName).join(', ')}`
      : '';

    let text = `📋 *${activeUnit.name.toUpperCase()} - FUNCTION PROSPECTUS (FP)*\n`;
    text += `*Ref:* #${enquiry.refNo} | *Date:* ${dateFormatted} | *Slot:* ${enquiry.session}\n`;
    text += `*Hall:* ${hallTitle}${secondaryStr}\n`;
    text += `*Host:* ${enquiry.guestName} (${enquiry.companyName || 'Private'})\n`;
    text += `*Board:* ${enquiry.boardToRead || enquiry.guestName}\n`;
    text += `*Guaranteed Pax:* ${enquiry.gPax} Pax (Expected: ${enquiry.expPax || enquiry.gPax} Pax)\n`;
    text += `------------------------------------\n`;

    if (dept === 'Kitchen' || dept === 'All Departments') {
      text += `👨‍🍳 *KITCHEN FUNCTION SPECIFICATIONS:*\n`;
      text += `• Menu Plan: ${enquiry.menu}\n`;
      text += `• Spiciness Level: ${beoData.spicinessLevel}\n`;
      if (beoData.specialDietary) text += `• Special Dietary/Jain: ${beoData.specialDietary}\n`;
      if (beoData.liveCounters && beoData.liveCounters.length > 0) text += `• Live Counters: ${beoData.liveCounters.join(', ')}\n`;
      text += `• Starter Service Time: ${beoData.starterServiceTime}\n`;
      text += `• Buffet Opening Time: ${beoData.buffetOpeningTime}\n`;
      if (beoData.chefNotes) text += `• Chef Remarks: ${beoData.chefNotes}\n`;
      text += `------------------------------------\n`;
    }

    if (dept === 'Banquet Service' || dept === 'All Departments') {
      text += `🛎️ *BANQUET SERVICE & HALL SETUP:*\n`;
      text += `• Seating Arrangement: ${enquiry.seatingArrangement}\n`;
      text += `• Hall Access: ${beoData.hallAccessTime} | Arrival: ${beoData.guestArrivalTime}\n`;
      text += `• AC Pre-Cooling: ${beoData.airConditionPreCoolTime}\n`;
      text += `• Stage: ${beoData.stageDimensions}\n`;
      text += `• Podium: ${beoData.podiumRequired ? 'YES (Emblem required)' : 'NO'}\n`;
      text += `• Registration Table: ${beoData.registrationDesk ? 'YES' : 'NO'}\n`;
      text += `• Table Linen: ${beoData.tableClothColor}\n`;
      if (beoData.liquorServiceStartTime) {
        text += `• Bar Service: ${beoData.liquorServiceStartTime} to ${beoData.liquorServiceEndTime || 'End'}\n`;
      }
      text += `------------------------------------\n`;
    }

    if (dept === 'Engineering & AV' || dept === 'All Departments') {
      text += `🎙️ *AV & ENGINEERING TECHNICAL SPECS:*\n`;
      text += `• Cordless Mics: ${beoData.cordlessMicsCount} | Collar Mics: ${beoData.collarMicsCount}\n`;
      text += `• Projector/Screens: ${beoData.projectorScreensCount} (HDMI Audio Patch: ${beoData.laptopAudioPatch ? 'Yes' : 'No'})\n`;
      text += `• Sound/Music: ${beoData.djMusicArrangement}\n`;
      text += `------------------------------------\n`;
    }

    text += `*BEO Issued by:* ${beoData.banquetManagerSign || currentUser?.name || 'Banquet Office'}\n`;
    text += `_Please ensure full departmental readiness 30 minutes prior to guest access._`;
    return text;
  };

  const handleSendWhatsApp = () => {
    const text = generateBEOText(targetDept);
    const cleanPhone = staffPhone.replace(/[^0-9]/g, '');
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;

    if (recordBEOSend) {
      recordBEOSend(enquiry.id, {
        department: targetDept,
        channel: 'WhatsApp',
        recipient: cleanPhone || 'Staff Group',
        status: 'Sent',
        notes: `Dispatched BEO to ${targetDept} via WhatsApp`
      });
    }

    window.open(url, '_blank');
    setDispatchSuccess(`BEO dispatched to ${targetDept} via WhatsApp.`);
    setTimeout(() => setDispatchSuccess(null), 3000);
  };

  const handleSendEmail = () => {
    const text = generateBEOText(targetDept);
    const subject = `BEO #${enquiry.refNo} - ${enquiry.eventDate} - ${enquiry.hallName} (${targetDept})`;
    const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(staffEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;

    if (recordBEOSend) {
      recordBEOSend(enquiry.id, {
        department: targetDept,
        channel: 'Gmail',
        recipient: staffEmail || 'Department Distribution List',
        status: 'Sent',
        notes: `Dispatched BEO to ${targetDept} via Gmail`
      });
    }

    window.open(url, '_blank');
    setDispatchSuccess(`BEO draft opened in Gmail for ${targetDept}.`);
    setTimeout(() => setDispatchSuccess(null), 3000);
  };

  const handleSendTelegram = () => {
    const text = generateBEOText(targetDept);
    const url = `https://t.me/share/url?url=${encodeURIComponent(window.location.origin)}&text=${encodeURIComponent(text)}`;

    if (recordBEOSend) {
      recordBEOSend(enquiry.id, {
        department: targetDept,
        channel: 'Telegram',
        recipient: 'Staff Channel',
        status: 'Sent',
        notes: `Dispatched BEO to ${targetDept} via Telegram`
      });
    }

    window.open(url, '_blank');
    setDispatchSuccess(`BEO shared via Telegram.`);
    setTimeout(() => setDispatchSuccess(null), 3000);
  };

  const addLiveCounter = () => {
    if (!liveCounterInput.trim()) return;
    setBeoData(prev => ({
      ...prev,
      liveCounters: [...(prev.liveCounters || []), liveCounterInput.trim()]
    }));
    setLiveCounterInput('');
  };

  const removeLiveCounter = (index: number) => {
    setBeoData(prev => ({
      ...prev,
      liveCounters: (prev.liveCounters || []).filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-sky-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-cyan-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-teal-200 shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-mono text-teal-300 font-bold">
                  FP REF #{enquiry.refNo}
                </span>
                <span className="text-white/40">·</span>
                <span className="text-xs text-teal-100/90 font-medium">
                  {enquiry.eventDate} ({enquiry.session})
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Function Prospectus (FP) & Kitchen Function Sheet
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-sm transition-colors"
              title="Export Vector PDF"
            >
              <Download className="w-3.5 h-3.5" />
              Download FP PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-teal-200 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-lg">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-3.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'details'
                  ? 'bg-white text-teal-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Operational Specifications & Setup
            </button>
            <button
              onClick={() => setActiveTab('dispatch')}
              className={`px-3.5 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === 'dispatch'
                  ? 'bg-white text-teal-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Share2 className="w-3 h-3 text-teal-600" />
              Staff Dispatch Hub
            </button>
          </div>

          {isSavedToast && (
            <div className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 flex items-center gap-1.5 font-medium animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              BEO details saved successfully!
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-sm text-slate-700">
          {activeTab === 'details' ? (
            <>
              {/* Event Quick Summary Banner */}
              <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Host / Client</span>
                  <span className="font-bold text-slate-900">{enquiry.guestName}</span>
                  <span className="text-xs text-slate-500 block truncate">{enquiry.companyName || 'Private Patron'}</span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Primary Hall</span>
                  <span className="font-bold text-teal-800">{enquiry.hallName || venue?.name}</span>
                  <span className="text-xs text-slate-500 block">{enquiry.seatingArrangement} layout</span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Guaranteed Pax</span>
                  <span className="font-bold text-slate-900 font-mono tabular-nums">{enquiry.gPax} Pax</span>
                  <span className="text-xs text-slate-500 block font-mono">Exp: {enquiry.expPax || enquiry.gPax} Pax</span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Board to Read</span>
                  <span className="font-semibold text-slate-800 truncate block">{enquiry.boardToRead || enquiry.guestName}</span>
                  <span className="text-xs text-teal-700 font-medium">{enquiry.eventType}</span>
                </div>
              </div>

              {/* Secondary Composite Halls (if any) */}
              {enquiry.secondaryHalls && enquiry.secondaryHalls.length > 0 && (
                <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-700 shrink-0" />
                  <span className="text-xs font-semibold text-amber-900">Composite Hall Bookings:</span>
                  <div className="flex flex-wrap gap-2">
                    {enquiry.secondaryHalls.map((sh, idx) => (
                      <span key={idx} className="text-xs bg-white text-amber-800 px-2 py-0.5 rounded border border-amber-300 font-medium">
                        {sh.hallName} ({sh.purpose || 'Auxiliary'}, {sh.allocatedPax || 'All'} Pax)
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 1: Service Sequence & Timelines */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-600" />
                  1. Service Sequence & Timelines
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Hall Access for Setup</label>
                    <input
                      type="text"
                      value={beoData.hallAccessTime}
                      onChange={e => setBeoData({ ...beoData, hallAccessTime: e.target.value })}
                      placeholder="e.g. 09:00 (2 hrs prior)"
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Guest Arrival Time</label>
                    <input
                      type="text"
                      value={beoData.guestArrivalTime}
                      onChange={e => setBeoData({ ...beoData, guestArrivalTime: e.target.value })}
                      placeholder="e.g. 11:00"
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Starter Service Time</label>
                    <input
                      type="text"
                      value={beoData.starterServiceTime}
                      onChange={e => setBeoData({ ...beoData, starterServiceTime: e.target.value })}
                      placeholder="e.g. 11:30"
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Buffet Opening Time</label>
                    <input
                      type="text"
                      value={beoData.buffetOpeningTime}
                      onChange={e => setBeoData({ ...beoData, buffetOpeningTime: e.target.value })}
                      placeholder="e.g. 12:45"
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Dessert Clearance</label>
                    <input
                      type="text"
                      value={beoData.dessertClearanceTime}
                      onChange={e => setBeoData({ ...beoData, dessertClearanceTime: e.target.value })}
                      placeholder="e.g. 15:00"
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Bar / Liquor Hours</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={beoData.liquorServiceStartTime}
                        onChange={e => setBeoData({ ...beoData, liquorServiceStartTime: e.target.value })}
                        placeholder="Start"
                        className="w-1/2 text-xs px-2 py-1.5 border border-slate-300 rounded-lg"
                      />
                      <span className="text-slate-400">-</span>
                      <input
                        type="text"
                        value={beoData.liquorServiceEndTime}
                        onChange={e => setBeoData({ ...beoData, liquorServiceEndTime: e.target.value })}
                        placeholder="End"
                        className="w-1/2 text-xs px-2 py-1.5 border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Kitchen Function Sheet & Chef Instructions */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-2">
                  <ChefHat className="w-4 h-4 text-teal-600" />
                  2. Kitchen Function Sheet & F&B Specifications
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Spiciness Preference</label>
                      <select
                        value={beoData.spicinessLevel}
                        onChange={e => setBeoData({ ...beoData, spicinessLevel: e.target.value as any })}
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="Mild">Mild / Subtle</option>
                        <option value="Medium">Medium / Balanced (Hotel Standard)</option>
                        <option value="Authentic Chettinad/Spicy">Authentic Chettinad / Spicy</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Special Dietary Requirements</label>
                      <input
                        type="text"
                        value={beoData.specialDietary}
                        onChange={e => setBeoData({ ...beoData, specialDietary: e.target.value })}
                        placeholder="e.g. 20 Jain Meals, 5 Gluten-Free, Nut Allergies"
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  {/* Live Counters Builder */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Live Food Counters</label>
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        value={liveCounterInput}
                        onChange={e => setLiveCounterInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addLiveCounter())}
                        placeholder="Add counter (e.g. Live Dosa Counter, Chaat Street, Pasta Bar) and press Enter"
                        className="flex-1 text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={addLiveCounter}
                        className="px-3 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 rounded-lg text-xs font-semibold"
                      >
                        + Add Counter
                      </button>
                    </div>
                    {beoData.liveCounters && beoData.liveCounters.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {beoData.liveCounters.map((cnt, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-50 text-teal-800 rounded-md border border-teal-200 text-xs">
                            {cnt}
                            <button
                              type="button"
                              onClick={() => removeLiveCounter(i)}
                              className="text-teal-600 hover:text-red-600"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Executive Chef Instructions / Presentation Notes</label>
                    <textarea
                      rows={2}
                      value={beoData.chefNotes}
                      onChange={e => setBeoData({ ...beoData, chefNotes: e.target.value })}
                      placeholder="Specific plating requests, signature welcome drink, chafing dish arrangements, replenishment cadence..."
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Hall Setup & Technical Specifications */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-2">
                  <Tv className="w-4 h-4 text-teal-600" />
                  3. Hall Staging & Audio-Visual Checklist
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Stage Dimensions</label>
                    <input
                      type="text"
                      value={beoData.stageDimensions}
                      onChange={e => setBeoData({ ...beoData, stageDimensions: e.target.value })}
                      placeholder="e.g. 16 ft x 8 ft x 1.5 ft"
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">AC Pre-Cooling Time</label>
                    <input
                      type="text"
                      value={beoData.airConditionPreCoolTime}
                      onChange={e => setBeoData({ ...beoData, airConditionPreCoolTime: e.target.value })}
                      placeholder="e.g. 60 Mins Prior"
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Table Linen Theme</label>
                    <input
                      type="text"
                      value={beoData.tableClothColor}
                      onChange={e => setBeoData({ ...beoData, tableClothColor: e.target.value })}
                      placeholder="e.g. Ivory Gold, Silver Grey"
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Cordless Handheld Mics</label>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={beoData.cordlessMicsCount}
                      onChange={e => setBeoData({ ...beoData, cordlessMicsCount: Number(e.target.value) })}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Collar / Lapel Mics</label>
                    <input
                      type="number"
                      min={0}
                      max={5}
                      value={beoData.collarMicsCount}
                      onChange={e => setBeoData({ ...beoData, collarMicsCount: Number(e.target.value) })}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Projector & Screens</label>
                    <input
                      type="number"
                      min={0}
                      max={4}
                      value={beoData.projectorScreensCount}
                      onChange={e => setBeoData({ ...beoData, projectorScreensCount: Number(e.target.value) })}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono tabular-nums"
                    />
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-4 pt-2 border-t border-slate-100">
                  <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={beoData.podiumRequired}
                      onChange={e => setBeoData({ ...beoData, podiumRequired: e.target.checked })}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    Podium / Lectern with Hotel Emblem
                  </label>
                  <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={beoData.registrationDesk}
                      onChange={e => setBeoData({ ...beoData, registrationDesk: e.target.checked })}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    Registration Desk at Entrance
                  </label>
                  <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={beoData.laptopAudioPatch}
                      onChange={e => setBeoData({ ...beoData, laptopAudioPatch: e.target.checked })}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    Laptop Audio & HDMI Patch Cable
                  </label>
                </div>
              </div>

              {/* Departmental Sign-off Names */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-teal-600" />
                  4. Departmental Accountability & Sign-Off Names
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Banquet Manager / Host</label>
                    <input
                      type="text"
                      value={beoData.banquetManagerSign}
                      onChange={e => setBeoData({ ...beoData, banquetManagerSign: e.target.value })}
                      placeholder="e.g. John Rao"
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Executive Chef</label>
                    <input
                      type="text"
                      value={beoData.executiveChefSign}
                      onChange={e => setBeoData({ ...beoData, executiveChefSign: e.target.value })}
                      placeholder="e.g. Chef Murugan"
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Banquet Service Captain</label>
                    <input
                      type="text"
                      value={beoData.beverageManagerSign}
                      onChange={e => setBeoData({ ...beoData, beverageManagerSign: e.target.value })}
                      placeholder="e.g. Captain Ramesh"
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">AV / Engineering Lead</label>
                    <input
                      type="text"
                      value={beoData.engineeringAvSign}
                      onChange={e => setBeoData({ ...beoData, engineeringAvSign: e.target.value })}
                      placeholder="e.g. Karthik (AV)"
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* DISPATCH HUB TAB */
            <div className="space-y-6">
              <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-4">
                <h3 className="text-sm font-bold text-teal-900 mb-1 flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-teal-700" />
                  Direct Multi-Department Staff Dispatch
                </h3>
                <p className="text-xs text-slate-600">
                  Instantly dispatch formatted BEO function slips to Kitchen, Service Captains, or AV Engineering via WhatsApp, Gmail, or Telegram.
                </p>
              </div>

              {dispatchSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {dispatchSuccess}
                </div>
              )}

              {/* Department Target Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Target Department:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['All Departments', 'Kitchen', 'Banquet Service', 'Engineering & AV'] as BEODepartment[]).map(dept => (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => setTargetDept(dept)}
                      className={`px-3 py-2.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                        targetDept === dept
                          ? 'bg-teal-800 text-white border-teal-800 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className="block">{dept}</span>
                      <span className="text-[10px] font-normal opacity-75">
                        {dept === 'Kitchen' ? 'KFS & Dietary' : dept === 'Engineering & AV' ? 'Mics & Screens' : dept === 'Banquet Service' ? 'Timelines & Layout' : 'Full Operational Sheet'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipient inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Staff Phone / WhatsApp (Optional):
                  </label>
                  <input
                    type="text"
                    value={staffPhone}
                    onChange={e => setStaffPhone(e.target.value)}
                    placeholder="e.g. +91 98401 23456 or leave empty for contact picker"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Staff Email / Dept Group (Optional):
                  </label>
                  <input
                    type="text"
                    value={staffEmail}
                    onChange={e => setStaffEmail(e.target.value)}
                    placeholder="e.g. kitchen.trt@residency.com"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* 1-Click Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  Dispatch via WhatsApp
                </button>
                <button
                  type="button"
                  onClick={handleSendEmail}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-bold shadow-sm transition"
                >
                  <Mail className="w-4 h-4" />
                  Dispatch via Gmail
                </button>
                <button
                  type="button"
                  onClick={handleSendTelegram}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                >
                  <Send className="w-4 h-4" />
                  Share via Telegram
                </button>
              </div>

              {/* Live Dispatch Preview */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
                  Dispatch Message Preview ({targetDept}):
                </span>
                <pre className="text-[11px] font-mono text-slate-700 bg-white p-3 rounded-lg border border-slate-200 whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {generateBEOText(targetDept)}
                </pre>
              </div>

              {/* Historical BEO Dispatch Records */}
              {enquiry.beoSendHistory && enquiry.beoSendHistory.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    BEO Transmission History
                  </h4>
                  <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white overflow-hidden">
                    {enquiry.beoSendHistory.map(rec => (
                      <div key={rec.id} className="p-2.5 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{rec.department}</span>
                          <span className="text-slate-400">·</span>
                          <span className="text-teal-700 font-medium">{rec.channel}</span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-500 truncate max-w-xs">{rec.recipient}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} by {rec.sentBy}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            {enquiry.beoDetails ? 'BEO configured and ready for service' : 'Fill required service parameters before saving'}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
            >
              Close
            </button>
            <button
              onClick={handleSaveBEO}
              className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-bold shadow-sm transition"
            >
              Save BEO Specifications
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-700 hover:from-teal-700 hover:to-cyan-800 text-white rounded-lg text-xs font-bold shadow-sm transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Download BEO PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import {
  Clock,
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Filter,
  MessageCircle,
  Phone,
  Search,
  User,
  Building2,
  ArrowRight,
  PlusCircle,
  FileText,
  CalendarPlus,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { Enquiry, PipelineStage } from '../types';
import { useBEMS } from '../context/BEMSContext';

interface FollowUpCommandCenterProps {
  onOpenEnquiryDetail: (enquiry: Enquiry) => void;
  onOpenBEO: (enquiry: Enquiry) => void;
  onOpenQuotationSend: (enquiry: Enquiry) => void;
}

type FollowUpCategory = 'all' | 'overdue' | 'today' | 'upcoming' | 'expiringHolds';

export const FollowUpCommandCenter: React.FC<FollowUpCommandCenterProps> = ({
  onOpenEnquiryDetail,
  onOpenBEO,
  onOpenQuotationSend,
}) => {
  const { enquiries, updateEnquiry, currentUser } = useBEMS();

  const [activeCategory, setActiveCategory] = useState<FollowUpCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [quickRemarkEnquiryId, setQuickRemarkEnquiryId] = useState<string | null>(null);
  const [quickRemarkText, setQuickRemarkText] = useState('');
  const [quickNextDate, setQuickNextDate] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Today's Date formatted YYYY-MM-DD
  const todayStr = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  // Compute categories
  const { overdueList, todayList, upcomingList, expiringHoldsList } = useMemo(() => {
    const overdue: Enquiry[] = [];
    const today: Enquiry[] = [];
    const upcoming: Enquiry[] = [];
    const expiring: Enquiry[] = [];

    const now = new Date();
    const todayDate = new Date(todayStr);

    enquiries.forEach(e => {
      // Exclude confirmed, completed, or cancelled
      if (['Confirmed', 'Completed', 'Cancelled', 'Function Completed', 'Function Completed and Gift Sent'].includes(e.status)) {
        return;
      }

      // Check tentative hold expiration
      if (e.tentativeHoldExpiresAt) {
        const holdDate = new Date(e.tentativeHoldExpiresAt);
        const diffDays = Math.ceil((holdDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 3 && diffDays >= -7) {
          expiring.push(e);
        }
      } else if (e.status.toLowerCase().includes('tentative')) {
        // If tentative hold date not set, check enquiry date older than 3 days
        const enqDate = new Date(e.enquiryDate);
        const ageDays = Math.ceil((todayDate.getTime() - enqDate.getTime()) / (1000 * 60 * 60 * 24));
        if (ageDays >= 3) {
          expiring.push(e);
        }
      }

      // Determine most urgent follow up date
      const fDate = e.followUp3Date || e.followUp2Date || e.followUp1Date;
      if (!fDate) {
        // If no follow up date scheduled, treat as overdue if created more than 2 days ago
        const enqDate = new Date(e.enquiryDate);
        if (enqDate < todayDate) {
          overdue.push(e);
        }
        return;
      }

      const target = new Date(fDate);
      if (fDate < todayStr) {
        overdue.push(e);
      } else if (fDate === todayStr) {
        today.push(e);
      } else {
        const diffDays = Math.ceil((target.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 7) {
          upcoming.push(e);
        }
      }
    });

    return {
      overdueList: overdue,
      todayList: today,
      upcomingList: upcoming,
      expiringHoldsList: expiring,
    };
  }, [enquiries, todayStr]);

  // Filter list by selected tab
  const displayedEnquiries = useMemo(() => {
    let list: Enquiry[] = [];
    if (activeCategory === 'overdue') list = overdueList;
    else if (activeCategory === 'today') list = todayList;
    else if (activeCategory === 'upcoming') list = upcomingList;
    else if (activeCategory === 'expiringHolds') list = expiringHoldsList;
    else {
      // 'all': deduplicate items needing follow-up
      const setIds = new Set<string>();
      [...overdueList, ...todayList, ...expiringHoldsList, ...upcomingList].forEach(item => {
        if (!setIds.has(item.id)) {
          setIds.add(item.id);
          list.push(item);
        }
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(e =>
        e.guestName.toLowerCase().includes(q) ||
        e.refNo.toLowerCase().includes(q) ||
        e.hallName.toLowerCase().includes(q) ||
        (e.companyName && e.companyName.toLowerCase().includes(q))
      );
    }

    return list;
  }, [activeCategory, overdueList, todayList, upcomingList, expiringHoldsList, searchQuery]);

  // WhatsApp 1-Click Reminder
  const triggerWhatsAppFollowUp = (enquiry: Enquiry) => {
    const cleanPhone = (enquiry.guestMobileMain || '').replace(/[^0-9]/g, '');
    const text = `Namaste ${enquiry.guestName}, warm greetings from The Residency Towers Chennai! 🌟\n\nWe are following up regarding your banquet enquiry #${enquiry.refNo} for ${enquiry.eventType} scheduled on ${enquiry.eventDate} at ${enquiry.hallName}.\n\nOur team would be delighted to customize your menu package or assist with any event specifications. Kindly let us know if you would like us to reserve this date for you.\n\nWarm regards,\nBanquet Reservations Team\nThe Residency Towers, Chennai\nPhone: +91 44 2815 6377`;

    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;

    window.open(url, '_blank');

    // Automatically record a follow-up remark in the enquiry
    const existingFollowups = enquiry.followUps || [];
    const newFollowup = {
      id: `fu_${Date.now()}`,
      index: existingFollowups.length + 1,
      date: todayStr,
      remark: `Dispatched WhatsApp follow-up reminder by ${currentUser?.name || 'Staff'}`
    };

    updateEnquiry({
      ...enquiry,
      followUps: [...existingFollowups, newFollowup],
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser?.username || 'admin',
    });

    setActionSuccessMsg(`WhatsApp reminder triggered for ${enquiry.guestName}`);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  // Quick Remark submit
  const handleSaveQuickRemark = (enquiry: Enquiry) => {
    if (!quickRemarkText.trim()) return;

    const existingFollowups = enquiry.followUps || [];
    const newFollowup = {
      id: `fu_${Date.now()}`,
      index: existingFollowups.length + 1,
      date: todayStr,
      remark: quickRemarkText.trim(),
    };

    const updated: Enquiry = {
      ...enquiry,
      followUps: [...existingFollowups, newFollowup],
      ...(quickNextDate ? { followUp2Date: quickNextDate } : {}),
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser?.username || 'admin',
    };

    updateEnquiry(updated);
    setQuickRemarkEnquiryId(null);
    setQuickRemarkText('');
    setQuickNextDate('');
    setActionSuccessMsg(`Follow-up remark recorded for #${enquiry.refNo}`);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  // Extend Hold by 3 days
  const handleExtendHold = (enquiry: Enquiry, days: number = 3) => {
    const curDate = new Date();
    curDate.setDate(curDate.getDate() + days);
    const newHoldDate = curDate.toISOString().split('T')[0];

    const updated: Enquiry = {
      ...enquiry,
      tentativeHoldExpiresAt: newHoldDate,
      remarks: `${enquiry.remarks || ''}\n[Hold Extended +${days} days till ${newHoldDate} by ${currentUser?.name || 'Staff'}]`.trim(),
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser?.username || 'admin',
    };

    updateEnquiry(updated);
    setActionSuccessMsg(`Hold extended by ${days} days for #${enquiry.refNo}`);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  // Quick Stage Advancement
  const handleAdvanceStage = (enquiry: Enquiry, nextStage: PipelineStage) => {
    const updated: Enquiry = {
      ...enquiry,
      status: nextStage,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser?.username || 'admin',
    };
    updateEnquiry(updated);
    setActionSuccessMsg(`Moved #${enquiry.refNo} to ${nextStage}`);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Title & Overview Banner */}
      <div className="bg-white rounded-2xl border border-sky-200/90 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold font-mono uppercase px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
              Pipeline Radar
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-medium">
              Today: {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Follow-Up & Tentative Hold Command Center
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            Proactively monitor client enquiry follow-ups, upcoming expiry dates, and tentative holds to prevent lost business.
          </p>
        </div>

        {actionSuccessMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3.5 py-2 rounded-xl font-semibold flex items-center gap-2 self-start md:self-auto shadow-xs animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {actionSuccessMsg}
          </div>
        )}
      </div>

      {/* Actionable Status Counter Strips */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <button
          onClick={() => setActiveCategory('all')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeCategory === 'all'
              ? 'bg-white border-teal-600 shadow-md ring-2 ring-teal-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-600">All Active Tasks</span>
            <RefreshCw className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {overdueList.length + todayList.length + upcomingList.length}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Full attention queue</span>
        </button>

        <button
          onClick={() => setActiveCategory('overdue')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeCategory === 'overdue'
              ? 'bg-red-50/50 border-red-500 shadow-md ring-2 ring-red-500/20'
              : 'bg-white border-slate-200 hover:border-red-200'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-red-700">Overdue</span>
            <AlertCircle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-700 font-mono tabular-nums">
            {overdueList.length}
          </div>
          <span className="text-[11px] text-red-600/80 mt-1 block">Requires immediate call</span>
        </button>

        <button
          onClick={() => setActiveCategory('today')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeCategory === 'today'
              ? 'bg-amber-50/50 border-amber-500 shadow-md ring-2 ring-amber-500/20'
              : 'bg-white border-slate-200 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-amber-700">Due Today</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700 font-mono tabular-nums">
            {todayList.length}
          </div>
          <span className="text-[11px] text-amber-700/80 mt-1 block">Scheduled for today</span>
        </button>

        <button
          onClick={() => setActiveCategory('expiringHolds')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeCategory === 'expiringHolds'
              ? 'bg-orange-50/50 border-orange-500 shadow-md ring-2 ring-orange-500/20'
              : 'bg-white border-slate-200 hover:border-orange-200'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-orange-800">Expiring Holds</span>
            <Calendar className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-orange-800 font-mono tabular-nums">
            {expiringHoldsList.length}
          </div>
          <span className="text-[11px] text-orange-700/80 mt-1 block">Tentative &lt; 72 hrs</span>
        </button>

        <button
          onClick={() => setActiveCategory('upcoming')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeCategory === 'upcoming'
              ? 'bg-sky-50/50 border-sky-500 shadow-md ring-2 ring-sky-500/20'
              : 'bg-white border-slate-200 hover:border-sky-200'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-sky-800">Next 7 Days</span>
            <CalendarPlus className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-sky-800 font-mono tabular-nums">
            {upcomingList.length}
          </div>
          <span className="text-[11px] text-sky-700/80 mt-1 block">Upcoming cadence</span>
        </button>
      </div>

      {/* Search & Action Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search guest, hall, or ref no..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Showing <strong className="text-slate-800 font-mono">{displayedEnquiries.length}</strong> enquiries requiring follow-up action</span>
        </div>
      </div>

      {/* Enquiries Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {displayedEnquiries.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">All Caught Up!</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              There are no pending follow-ups or expiring tentative holds in this category. All enquiries are on track.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {displayedEnquiries.map(enquiry => {
              const followUpDate = enquiry.followUp3Date || enquiry.followUp2Date || enquiry.followUp1Date;
              const isOverdue = followUpDate && followUpDate < todayStr;
              const isToday = followUpDate === todayStr;
              const isTentative = enquiry.status.toLowerCase().includes('tentative');

              return (
                <div key={enquiry.id} className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Guest & Event Info */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          #{enquiry.refNo}
                        </span>
                        <span className="font-bold text-sm text-slate-900 truncate">
                          {enquiry.guestName}
                        </span>
                        {enquiry.companyName && (
                          <span className="text-xs text-slate-500">
                            ({enquiry.companyName})
                          </span>
                        )}
                        <span className="text-slate-300">·</span>
                        <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {enquiry.status}
                        </span>
                        {isOverdue && (
                          <span className="text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                            OVERDUE
                          </span>
                        )}
                        {isToday && (
                          <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                            DUE TODAY
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1 text-slate-700 font-medium">
                          <Building2 className="w-3.5 h-3.5 text-teal-600" />
                          {enquiry.hallName}
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Event: {enquiry.eventDate} ({enquiry.session})
                        </span>
                        <span className="font-mono tabular-nums">
                          Pax: {enquiry.gPax}
                        </span>
                        {enquiry.guestMobileMain && (
                          <span className="flex items-center gap-1 font-mono text-slate-700">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {enquiry.guestMobileMain}
                          </span>
                        )}
                      </div>

                      {/* Follow-up Note / Last Remark */}
                      {enquiry.followUps && enquiry.followUps.length > 0 && (
                        <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1">
                          <span className="font-semibold text-slate-700">Last Remark ({enquiry.followUps[enquiry.followUps.length - 1].date}): </span>
                          <span>{enquiry.followUps[enquiry.followUps.length - 1].remark}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons Hub */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {/* WhatsApp 1-Click Reminder */}
                      <button
                        onClick={() => triggerWhatsAppFollowUp(enquiry)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                        title="Send WhatsApp Follow-up Reminder"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>

                      {/* Log Remark Toggle */}
                      <button
                        onClick={() => {
                          setQuickRemarkEnquiryId(quickRemarkEnquiryId === enquiry.id ? null : enquiry.id);
                          setQuickRemarkText('');
                          setQuickNextDate('');
                        }}
                        className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition"
                      >
                        + Log Remark
                      </button>

                      {/* BEO Generator */}
                      <button
                        onClick={() => onOpenBEO(enquiry)}
                        className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                        title="Open Banquet Event Order (BEO)"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>BEO</span>
                      </button>

                      {/* Extend Hold if Tentative */}
                      {isTentative && (
                        <button
                          onClick={() => handleExtendHold(enquiry, 3)}
                          className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold transition"
                          title="Extend Tentative Hold by 3 Days"
                        >
                          +3d Hold
                        </button>
                      )}

                      {/* Advance to Confirmed if ready */}
                      {enquiry.status !== 'Confirmed' && (
                        <button
                          onClick={() => handleAdvanceStage(enquiry, 'Confirmed')}
                          className="px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-lg text-xs font-semibold transition"
                          title="Advance to Confirmed"
                        >
                          Confirm
                        </button>
                      )}

                      {/* View Full Details */}
                      <button
                        onClick={() => onOpenEnquiryDetail(enquiry)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                        title="View Full Booking Details"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Inline Quick Remark Box */}
                  {quickRemarkEnquiryId === enquiry.id && (
                    <div className="mt-3 pt-3 border-t border-slate-200 bg-teal-50/40 -mx-4 -mb-4 p-4 rounded-b-2xl animate-in fade-in">
                      <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                        Add Immediate Follow-Up Note:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <input
                          type="text"
                          value={quickRemarkText}
                          onChange={e => setQuickRemarkText(e.target.value)}
                          placeholder="Client response (e.g. Discussing menu with family, will confirm by Friday)..."
                          className="sm:col-span-2 text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                        />
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">Next Date:</span>
                          <input
                            type="date"
                            value={quickNextDate}
                            onChange={e => setQuickNextDate(e.target.value)}
                            className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded-lg bg-white"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSaveQuickRemark(enquiry)}
                            className="flex-1 px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-bold transition"
                          >
                            Save Note
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuickRemarkEnquiryId(null)}
                            className="px-2.5 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

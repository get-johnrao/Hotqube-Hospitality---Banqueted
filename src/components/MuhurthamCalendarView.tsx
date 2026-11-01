import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Sparkles,
  Flame,
  Building2,
  Users,
  Search,
  Filter,
  PlusCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { Enquiry, VenueHall } from '../types';
import { TAMIL_NADU_MUHURTHAM_DATES, MuhurthamDay } from '../data/muhurthamData';
import { useBEMS } from '../context/BEMSContext';

interface MuhurthamCalendarViewProps {
  onOpenNewEnquiryForDate: (date: string) => void;
  onOpenEnquiryDetail: (enquiry: Enquiry) => void;
}

export const MuhurthamCalendarView: React.FC<MuhurthamCalendarViewProps> = ({
  onOpenNewEnquiryForDate,
  onOpenEnquiryDetail,
}) => {
  const { enquiries, venues } = useBEMS();

  const [selectedYear, setSelectedYear] = useState<'all' | '2026' | '2027'>('2026');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract unique Tamil months
  const uniqueMonths = useMemo(() => {
    const set = new Set<string>();
    TAMIL_NADU_MUHURTHAM_DATES.forEach(m => set.add(m.tamilMonth));
    return Array.from(set);
  }, []);

  // Filtered Muhurtham dates
  const filteredDates = useMemo(() => {
    return TAMIL_NADU_MUHURTHAM_DATES.filter(item => {
      if (selectedYear !== 'all' && !item.date.startsWith(selectedYear)) return false;
      if (selectedMonthFilter !== 'all' && item.tamilMonth !== selectedMonthFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.date.includes(q) ||
          item.tamilMonth.toLowerCase().includes(q) ||
          item.nakshatra.toLowerCase().includes(q) ||
          item.notes.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [selectedYear, selectedMonthFilter, searchQuery]);

  // Group enquiries by date
  const enquiriesByDate = useMemo(() => {
    const map = new Map<string, Enquiry[]>();
    enquiries.forEach(e => {
      const arr = map.get(e.eventDate) || [];
      arr.push(e);
      map.set(e.eventDate, arr);
    });
    return map;
  }, [enquiries]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-yellow-950 text-white rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-6 opacity-10 pointer-events-none">
          <Sparkles className="w-64 h-64 text-amber-200" />
        </div>

        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs uppercase tracking-widest font-mono px-2 py-0.5 rounded bg-amber-400/20 text-amber-200 border border-amber-300/30 font-bold">
              Tamil Nadu Panchangam Intelligence
            </span>
            <span className="text-amber-200/50">·</span>
            <span className="text-xs text-amber-200/80">
              Chennai Banquet Revenue Yield Management
            </span>
          </div>

          <h2 className="text-xl sm:text-3xl font-serif font-bold tracking-tight text-white mb-2">
            Subha Muhurtham & Peak-Demand Yield Calendar
          </h2>
          <p className="text-xs sm:text-sm text-amber-100/80 leading-relaxed">
            Monitor auspicious wedding dates (Valarpirai Muhurtham) across Tamil months. Optimize hall minimum guarantees, enforce peak rack rates, and manage concurrent enquiries for premium banquet spaces.
          </p>
        </div>
      </div>

      {/* Filter and Switcher Strip */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Year Segmented Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(['2026', '2027', 'all'] as const).map(yr => (
              <button
                key={yr}
                onClick={() => setSelectedYear(yr)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  selectedYear === yr
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {yr === 'all' ? 'All Years' : yr}
              </button>
            ))}
          </div>

          {/* Month Dropdown */}
          <select
            value={selectedMonthFilter}
            onChange={e => setSelectedMonthFilter(e.target.value)}
            className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-medium text-slate-700"
          >
            <option value="all">All Tamil Months</option>
            {uniqueMonths.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search date, nakshatra, month..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Muhurtham Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDates.map(item => {
          const bookedEnquiries = enquiriesByDate.get(item.date) || [];
          const isVeryHighYield = item.peakYieldLevel.includes('Very High');
          const hasBookings = bookedEnquiries.length > 0;
          const hasConfirmed = bookedEnquiries.some(b => b.status === 'Confirmed');

          return (
            <div
              key={item.date}
              className={`bg-white rounded-2xl border transition-all hover:shadow-md flex flex-col justify-between overflow-hidden ${
                isVeryHighYield
                  ? 'border-amber-300 shadow-xs'
                  : 'border-slate-200'
              }`}
            >
              <div className="p-5">
                {/* Top Badge & Date Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-xs font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded inline-block mb-1">
                      {item.tamilMonth}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 font-mono">
                      {item.date}
                    </h3>
                  </div>

                  <div className="text-right">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider inline-flex items-center gap-1 ${
                      isVeryHighYield
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {isVeryHighYield && <Flame className="w-3 h-3 text-rose-600" />}
                      {item.peakYieldLevel}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5 font-mono">
                      Min: {item.recommendedMinPax} Pax
                    </span>
                  </div>
                </div>

                {/* Nakshatra & Auspicious Timing */}
                <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1 mb-3 border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Nakshatra:</span>
                    <span className="font-semibold text-slate-800">{item.nakshatra}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Thithi:</span>
                    <span className="font-semibold text-slate-800">{item.thithi}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Auspicious Time:</span>
                    <span className="font-bold text-teal-800 font-mono">{item.auspiciousTiming}</span>
                  </div>
                </div>

                {/* Revenue & Operations Note */}
                <p className="text-xs text-slate-600 italic mb-4">
                  "{item.notes}"
                </p>

                {/* Hotel Occupancy Status for this Muhurtham Day */}
                <div className="border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-semibold text-slate-700">Hotel Hall Bookings:</span>
                    <span className="font-mono text-slate-500 font-bold">
                      {bookedEnquiries.length} {bookedEnquiries.length === 1 ? 'Booking' : 'Bookings'}
                    </span>
                  </div>

                  {bookedEnquiries.length === 0 ? (
                    <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-2 flex items-center justify-between">
                      <span className="font-medium">All halls available for peak pricing</span>
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-28 overflow-y-auto">
                      {bookedEnquiries.map(enq => (
                        <div
                          key={enq.id}
                          onClick={() => onOpenEnquiryDetail(enq)}
                          className="p-1.5 bg-slate-50 hover:bg-teal-50 border border-slate-200 rounded-lg text-xs flex items-center justify-between cursor-pointer transition"
                        >
                          <div className="truncate pr-2">
                            <span className="font-semibold text-slate-900">{enq.hallName}</span>
                            <span className="text-slate-400"> · </span>
                            <span className="text-slate-600">{enq.guestName}</span>
                          </div>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            enq.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {enq.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Quick Action */}
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => onOpenNewEnquiryForDate(item.date)}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Book / Inquire for this Muhurtham
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

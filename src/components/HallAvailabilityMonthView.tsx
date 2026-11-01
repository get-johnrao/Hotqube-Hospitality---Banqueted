import React, { useMemo } from 'react';
import { useBEMS } from '../context/BEMSContext';
import { Enquiry } from '../types';
import { STATUS_CONFIG } from './HallAvailabilityMatrix';
import {
  formatINR,
  formatIndianNumber,
  formatDisplayDate,
} from '../utils/formatters';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Building2,
  Search,
  X,
  Filter,
  Users,
  CheckCircle2,
  Clock,
  Lock,
  Sparkles,
  ArrowRight,
  Layers,
} from 'lucide-react';

interface HallAvailabilityMonthViewProps {
  currentMonth: number; // 1 - 12
  currentYear: number;
  onMonthChange: (month: number, year: number) => void;
  selectedDate: string; // YYYY-MM-DD
  onSelectDateAndSwitchToDay: (dateStr: string) => void;
  onSelectEnquiry: (enquiry: Enquiry) => void;
  hallFilter: string;
  setHallFilter: (hallId: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const HallAvailabilityMonthView: React.FC<HallAvailabilityMonthViewProps> = ({
  currentMonth,
  currentYear,
  onMonthChange,
  selectedDate,
  onSelectDateAndSwitchToDay,
  onSelectEnquiry,
  hallFilter,
  setHallFilter,
  statusFilter,
  setStatusFilter,
  searchQuery,
  setSearchQuery,
}) => {
  const { venues, enquiries } = useBEMS();

  // Today Date string
  const todayStr = useMemo(() => {
    const today = new Date();
    return `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
  }, []);

  // Filter Active Venues
  const activeVenues = useMemo(() => {
    return venues.filter(v => v.status === 'Active');
  }, [venues]);

  // Available Years for Dropdown (Current - 1 to Current + 3)
  const availableYears = useMemo(() => {
    const currentY = new Date().getFullYear();
    return [currentY - 1, currentY, currentY + 1, currentY + 2];
  }, []);

  // Shift month by offset
  const handleShiftMonth = (offset: number) => {
    let newM = currentMonth + offset;
    let newY = currentYear;
    if (newM > 12) {
      newM = 1;
      newY += 1;
    } else if (newM < 1) {
      newM = 12;
      newY -= 1;
    }
    onMonthChange(newM, newY);
  };

  // Jump to Current Month
  const handleJumpToCurrentMonth = () => {
    const now = new Date();
    onMonthChange(now.getMonth() + 1, now.getFullYear());
  };

  // Build Calendar Days Grid (Sundays through Saturdays)
  const calendarCells = useMemo(() => {
    // First day of month: 0 (Sun) to 6 (Sat)
    const firstDayIndex = new Date(currentYear, currentMonth - 1, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth - 1, 0).getDate();

    interface CalendarDayCell {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
    }

    const cells: CalendarDayCell[] = [];

    // Leading days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      let prevM = currentMonth - 1;
      let prevY = currentYear;
      if (prevM < 1) {
        prevM = 12;
        prevY -= 1;
      }
      const dStr = `${prevY}-${prevM.toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
      cells.push({
        dateStr: dStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        isSelected: dStr === selectedDate,
      });
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
      cells.push({
        dateStr: dStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dStr === todayStr,
        isSelected: dStr === selectedDate,
      });
    }

    // Trailing days from next month to complete 35 or 42 grid cells
    const remainingSlots = (7 - (cells.length % 7)) % 7;
    // ensure at least 35 cells for consistent height
    const totalNeeded = cells.length + remainingSlots < 35 ? remainingSlots + 7 : remainingSlots;
    for (let d = 1; d <= totalNeeded; d++) {
      let nextM = currentMonth + 1;
      let nextY = currentYear;
      if (nextM > 12) {
        nextM = 1;
        nextY += 1;
      }
      const dStr = `${nextY}-${nextM.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
      cells.push({
        dateStr: dStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        isSelected: dStr === selectedDate,
      });
    }

    return cells;
  }, [currentYear, currentMonth, todayStr, selectedDate]);

  // Index enquiries by date for fast O(1) lookup
  const enquiriesByDate = useMemo(() => {
    const map = new Map<string, Enquiry[]>();
    enquiries.forEach(e => {
      if (e.status === 'Cancelled') return;

      // Hall filter
      if (hallFilter !== 'ALL' && e.hallId !== hallFilter) return;

      // Status filter
      if (statusFilter !== 'ALL') {
        const matchesStatus =
          e.status === statusFilter ||
          (statusFilter === 'Confirmed' &&
            (e.status === 'Balance Paid' ||
              e.status === 'Advance Paid (EXCLUSIVE LOCK)' ||
              e.finalStatus === 'Confirmed' ||
              e.finalStatus === 'Exclusive Lock'));
        if (!matchesStatus) return;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          e.guestName.toLowerCase().includes(q) ||
          e.companyName.toLowerCase().includes(q) ||
          e.refNo.toLowerCase().includes(q) ||
          e.hallName.toLowerCase().includes(q) ||
          e.eventType.toLowerCase().includes(q);
        if (!matches) return;
      }

      const existing = map.get(e.eventDate) || [];
      existing.push(e);
      map.set(e.eventDate, existing);
    });
    return map;
  }, [enquiries, hallFilter, statusFilter, searchQuery]);

  // Monthly Overview Statistics
  const monthStats = useMemo(() => {
    let totalEvents = 0;
    let confirmedCount = 0;
    let tentativeCount = 0;
    let exclusiveCount = 0;
    let totalPax = 0;
    const daysWithEvents = new Set<string>();

    const prefix = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;

    enquiries.forEach(e => {
      if (!e.eventDate.startsWith(prefix) || e.status === 'Cancelled') return;

      if (hallFilter !== 'ALL' && e.hallId !== hallFilter) return;

      totalEvents++;
      daysWithEvents.add(e.eventDate);
      totalPax += e.gPax || e.expPax || 0;

      if (e.status === 'Advance Paid (EXCLUSIVE LOCK)' || e.finalStatus === 'Exclusive Lock') {
        exclusiveCount++;
      } else if (
        e.status === 'Confirmed' ||
        e.status === 'Balance Paid' ||
        e.finalStatus === 'Confirmed' ||
        e.finalStatus === 'Completed'
      ) {
        confirmedCount++;
      } else {
        tentativeCount++;
      }
    });

    const daysInThisMonth = new Date(currentYear, currentMonth, 0).getDate();

    return {
      totalEvents,
      confirmedCount,
      tentativeCount,
      exclusiveCount,
      totalPax,
      bookedDays: daysWithEvents.size,
      freeDays: Math.max(0, daysInThisMonth - daysWithEvents.size),
    };
  }, [enquiries, currentYear, currentMonth, hallFilter]);

  const isCurrentMonthActive =
    new Date().getFullYear() === currentYear && new Date().getMonth() + 1 === currentMonth;

  return (
    <div id="hall-availability-month-view" className="space-y-4">
      {/* Month Navigation & Filter Controls Bar */}
      <div className="p-4 bg-white border border-sky-200 rounded-2xl shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Month Indicator & Steppers */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-sky-200 shadow-xs">
              <Calendar className="w-4 h-4 text-teal-600" />
              <select
                value={currentMonth}
                onChange={e => onMonthChange(Number(e.target.value), currentYear)}
                className="bg-transparent text-sm font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>
              <select
                value={currentYear}
                onChange={e => onMonthChange(currentMonth, Number(e.target.value))}
                className="bg-transparent text-sm font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                {availableYears.map(y => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Stepper Buttons */}
            <div className="flex items-center gap-1 bg-sky-50/70 p-1 rounded-xl border border-sky-200">
              <button
                onClick={() => handleShiftMonth(-1)}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-sky-100 rounded-lg transition-colors flex items-center gap-1 text-xs cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Prev</span>
              </button>

              <button
                onClick={handleJumpToCurrentMonth}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  isCurrentMonthActive
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-xs'
                    : 'text-teal-700 hover:bg-sky-100'
                }`}
              >
                Current Month
              </button>

              <button
                onClick={() => handleShiftMonth(1)}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-sky-100 rounded-lg transition-colors flex items-center gap-1 text-xs cursor-pointer"
                title="Next Month"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Hall Filter and Status Filter */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Hall Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium hidden sm:inline">Hall:</span>
              <select
                value={hallFilter}
                onChange={e => setHallFilter(e.target.value)}
                className="py-1.5 px-3 bg-white border border-sky-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-teal-500 shadow-xs"
              >
                <option value="ALL">All Halls ({activeVenues.length})</option>
                {activeVenues.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium hidden sm:inline">Status:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="py-1.5 px-3 bg-white border border-sky-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-teal-500 shadow-xs"
              >
                <option value="ALL">All Stages</option>
                <option value="Confirmed">Confirmed / Locked</option>
                <option value="Advance Paid (EXCLUSIVE LOCK)">Exclusive Lock</option>
                <option value="Quote Shared">Quote Shared</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Food Trial">Food Trial</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-white border border-sky-200 rounded-xl pl-8 pr-6 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 shadow-xs w-36 sm:w-48"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Monthly Metrics Summary Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-sky-100 text-xs">
          <div className="flex items-center gap-2 font-mono flex-wrap">
            <span className="text-slate-500 font-semibold flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-teal-600" />
              <span>{MONTH_NAMES[currentMonth - 1]} {currentYear} Summary:</span>
            </span>
            <span className="px-2 py-0.5 rounded bg-sky-50 border border-sky-200 text-slate-800 font-bold">
              {monthStats.totalEvents} Total Event{monthStats.totalEvents === 1 ? '' : 's'}
            </span>
            {monthStats.exclusiveCount > 0 && (
              <span className="px-2 py-0.5 rounded bg-purple-50 border border-purple-200 text-purple-700 font-bold">
                {monthStats.exclusiveCount} Locked
              </span>
            )}
            {monthStats.confirmedCount > 0 && (
              <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold">
                {monthStats.confirmedCount} Confirmed
              </span>
            )}
            {monthStats.tentativeCount > 0 && (
              <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 font-bold">
                {monthStats.tentativeCount} Tentative
              </span>
            )}
            <span className="px-2 py-0.5 rounded bg-teal-50 border border-teal-200 text-teal-800 font-medium">
              {formatIndianNumber(monthStats.totalPax)} Exp./G. Pax
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span>
              <strong className="text-teal-700 font-semibold">{monthStats.bookedDays}</strong> Booked Days
            </span>
            <span>•</span>
            <span>
              <strong className="text-emerald-700 font-semibold">{monthStats.freeDays}</strong> Open Days
            </span>
            <span className="hidden md:inline text-slate-400">
              (Click any date box to open its 24-hour timeline)
            </span>
          </div>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="bg-white border border-sky-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 border-b border-sky-200 bg-sky-50/80 text-center text-xs font-bold text-slate-700 tracking-wider py-2.5">
          {WEEKDAY_NAMES.map((wd, i) => (
            <div key={wd} className={i === 0 || i === 6 ? 'text-teal-800' : 'text-slate-700'}>
              {wd}
            </div>
          ))}
        </div>

        {/* 35 or 42 Day Grid Cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-sky-100 bg-slate-50/30">
          {calendarCells.map(cell => {
            const dayEvents = enquiriesByDate.get(cell.dateStr) || [];
            const hasEvents = dayEvents.length > 0;

            const hasLocked = dayEvents.some(
              e => e.status === 'Advance Paid (EXCLUSIVE LOCK)' || e.finalStatus === 'Exclusive Lock'
            );
            const hasConfirmed = dayEvents.some(
              e =>
                e.status === 'Confirmed' ||
                e.status === 'Balance Paid' ||
                e.finalStatus === 'Confirmed' ||
                e.finalStatus === 'Completed'
            );

            return (
              <div
                key={cell.dateStr}
                onClick={() => onSelectDateAndSwitchToDay(cell.dateStr)}
                className={`min-h-[118px] sm:min-h-[134px] p-2 flex flex-col justify-between transition-all cursor-pointer group hover:bg-teal-50/60 hover:shadow-inner relative ${
                  !cell.isCurrentMonth
                    ? 'bg-slate-50/70 text-slate-400'
                    : cell.isToday
                    ? 'bg-teal-50/30 ring-1 ring-inset ring-teal-400'
                    : 'bg-white text-slate-800'
                } ${cell.isSelected ? 'border-2 border-teal-500 rounded-lg shadow-xs z-10' : ''}`}
                title={`Click to view 24-hour day schedule for ${formatDisplayDate(cell.dateStr)}`}
              >
                {/* Cell Header: Day Number & Count Badge */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs font-bold font-mono inline-flex items-center justify-center w-6 h-6 rounded-full transition-transform group-hover:scale-110 ${
                        cell.isToday
                          ? 'bg-teal-600 text-white shadow-xs'
                          : cell.isCurrentMonth
                          ? 'text-slate-800 group-hover:text-teal-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>
                    {cell.isToday && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-teal-700 bg-teal-100/70 px-1.5 py-0.2 rounded-md hidden sm:inline">
                        Today
                      </span>
                    )}
                  </div>

                  {/* Booking count chip */}
                  {hasEvents ? (
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full border ${
                        hasLocked
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : hasConfirmed
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {dayEvents.length} {dayEvents.length === 1 ? 'Event' : 'Events'}
                    </span>
                  ) : (
                    <span className="text-[9px] text-slate-300 font-mono group-hover:text-teal-600 transition-colors">
                      Free
                    </span>
                  )}
                </div>

                {/* Event Summary List for this Day */}
                <div className="flex-1 space-y-1 overflow-hidden">
                  {dayEvents.slice(0, 2).map(ev => {
                    const cfg = STATUS_CONFIG[ev.status] || {
                      bgClass: 'bg-slate-600',
                      badgeBg: 'bg-slate-50',
                      badgeText: 'text-slate-700 border-slate-200',
                      shortLabel: ev.status,
                    };

                    const isLock =
                      ev.status === 'Advance Paid (EXCLUSIVE LOCK)' || ev.finalStatus === 'Exclusive Lock';
                    const isConf =
                      ev.status === 'Confirmed' ||
                      ev.status === 'Balance Paid' ||
                      ev.finalStatus === 'Confirmed' ||
                      ev.finalStatus === 'Completed';

                    return (
                      <div
                        key={ev.id}
                        onClick={e => {
                          e.stopPropagation();
                          onSelectEnquiry(ev);
                        }}
                        className={`px-1.5 py-0.5 rounded text-[10px] truncate border font-medium flex items-center justify-between gap-1 shadow-2xs hover:brightness-95 transition-all ${
                          isLock
                            ? 'bg-purple-50 border-purple-200 text-purple-900'
                            : isConf
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                            : 'bg-sky-50 border-sky-200 text-slate-800'
                        }`}
                        title={`${ev.hallName} • ${ev.session}\n${ev.guestName} (${ev.eventType})\nStatus: ${ev.status}\nPax: ${ev.gPax || ev.expPax}`}
                      >
                        <div className="flex items-center gap-1 truncate">
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              isLock
                                ? 'bg-purple-600'
                                : isConf
                                ? 'bg-emerald-600'
                                : 'bg-amber-500'
                            }`}
                          />
                          <strong className="truncate font-semibold">{ev.hallName}</strong>
                          <span className="text-slate-500 truncate hidden sm:inline text-[9px]">
                            • {ev.guestName.split(' ')[0]}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono shrink-0 text-slate-500">
                          {ev.gPax || ev.expPax}p
                        </span>
                      </div>
                    );
                  })}

                  {/* If more than 2 events */}
                  {dayEvents.length > 2 && (
                    <div className="text-[9px] font-semibold text-teal-700 bg-teal-50 px-1 py-0.5 rounded border border-teal-200/60 text-center">
                      +{dayEvents.length - 2} more event{dayEvents.length - 2 === 1 ? '' : 's'}
                    </div>
                  )}

                  {/* Empty state hint when no events on current month day */}
                  {!hasEvents && cell.isCurrentMonth && (
                    <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] text-teal-600 font-semibold flex items-center gap-0.5">
                        <span>View Day</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  )}
                </div>

                {/* Day Footer / Subtle Indicator */}
                <div className="mt-1 pt-1 border-t border-sky-100/60 flex items-center justify-between text-[9px] text-slate-400">
                  <span className="truncate">
                    {hasEvents
                      ? `${dayEvents.reduce((acc, curr) => acc + (curr.gPax || curr.expPax || 0), 0)} Total Pax`
                      : 'All Halls Open'}
                  </span>
                  <span className="opacity-0 group-hover:opacity-100 text-teal-700 font-bold transition-opacity">
                    Open &rarr;
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

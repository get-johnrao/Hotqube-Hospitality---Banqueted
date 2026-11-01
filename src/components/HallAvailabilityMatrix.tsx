import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useBEMS } from '../context/BEMSContext';
import { Enquiry, VenueHall, PipelineStage } from '../types';
import { PIPELINE_STAGES } from '../data/initialData';
import {
  formatDisplayDate,
  formatReadableDate,
  addDaysToDate,
  parseSessionTimeSlot,
  minutesToTimeString,
  formatIndianNumber,
  formatINR,
} from '../utils/formatters';
import {
  Calendar,
  Building2,
  Lock,
  Clock,
  ChevronLeft,
  ChevronRight,
  Plus,
  Info,
  Search,
  CheckCircle2,
  Filter,
  Sparkles,
  Utensils,
  FileText,
  Eye,
  Award,
  Gift,
  AlertTriangle,
  Users,
  Maximize2,
  SlidersHorizontal,
  X,
  ExternalLink,
  FileSpreadsheet,
  HelpCircle,
  Code2,
  Copy,
  Check,
  Download,
  BookOpen,
  BarChart3,
  Flame,
  Columns2,
} from 'lucide-react';
import { GOOGLE_APPS_SCRIPT_CODE } from '../utils/googleAppsScriptTemplate';
import { HallAvailabilityMonthView } from './HallAvailabilityMonthView';
import { HallAvailabilityWeekChart } from './HallAvailabilityWeekChart';
import { MuhurthamCalendarView } from './MuhurthamCalendarView';
import { AvailabilityInspectorPanel } from './AvailabilityInspectorPanel';
import { downloadMultiSheetSpreadsheet } from '../utils/spreadsheetExport';

interface HallAvailabilityMatrixProps {
  onSelectSlot: (hallId: string, date: string, session: string) => void;
  onSelectEnquiry: (enquiry: Enquiry) => void;
  onOpenBEO?: (enquiry: Enquiry) => void;
  onOpenGoogleSheets?: () => void;
}

// 48 Half-Hour Slots from 00:00 to 24:00 (Every 30 minutes)
const TOTAL_30MIN_SLOTS = 48;
const SLOT_WIDTH_PX = 36; // Width in pixels of each 30-minute interval
const TIMELINE_WIDTH_PX = TOTAL_30MIN_SLOTS * SLOT_WIDTH_PX; // 1728px

// Status Color & Style Configurations
export const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    shortLabel: string;
    bgClass: string;
    borderClass: string;
    textClass: string;
    badgeBg: string;
    badgeText: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  'Quote Shared': {
    label: 'Quote Shared',
    shortLabel: 'Quote Shared',
    bgClass: 'bg-blue-600 hover:bg-blue-700',
    borderClass: 'border-blue-300',
    textClass: 'text-white',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700 border-blue-200',
    icon: FileText,
  },
  'Negotiation': {
    label: 'Negotiation',
    shortLabel: 'Negotiation',
    bgClass: 'bg-amber-500 hover:bg-amber-600',
    borderClass: 'border-amber-300',
    textClass: 'text-slate-900 font-bold',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800 border-amber-200',
    icon: Clock,
  },
  'Confirmed': {
    label: 'Confirmed',
    shortLabel: 'Confirmed',
    bgClass: 'bg-emerald-600 hover:bg-emerald-700',
    borderClass: 'border-emerald-300',
    textClass: 'text-white',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700 border-emerald-200',
    icon: CheckCircle2,
  },
  'Postponed': {
    label: 'Postponed',
    shortLabel: 'Postponed',
    bgClass: 'bg-slate-500 hover:bg-slate-600',
    borderClass: 'border-slate-300',
    textClass: 'text-white',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700 border-slate-200',
    icon: AlertTriangle,
  },
  'Cancelled': {
    label: 'Cancelled',
    shortLabel: 'Cancelled',
    bgClass: 'bg-rose-600 hover:bg-rose-700',
    borderClass: 'border-rose-300',
    textClass: 'text-white',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700 border-rose-200',
    icon: X,
  },

  // Legacy mappings for backwards compatibility
  'Advance Paid (EXCLUSIVE LOCK)': {
    label: 'Confirmed (Advance Paid)',
    shortLabel: 'Confirmed',
    bgClass: 'bg-emerald-600 hover:bg-emerald-700',
    borderClass: 'border-emerald-300',
    textClass: 'text-white',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700 border-emerald-200',
    icon: Lock,
  },
  'Balance Paid': {
    label: 'Confirmed (Balance Paid)',
    shortLabel: 'Confirmed',
    bgClass: 'bg-emerald-600 hover:bg-emerald-700',
    borderClass: 'border-emerald-300',
    textClass: 'text-white',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700 border-emerald-200',
    icon: CheckCircle2,
  },
  'Food Trial': {
    label: 'Food Trial',
    shortLabel: 'Food Trial',
    bgClass: 'bg-teal-600 hover:bg-teal-700',
    borderClass: 'border-teal-300',
    textClass: 'text-white',
    badgeBg: 'bg-teal-50',
    badgeText: 'text-teal-700 border-teal-200',
    icon: Utensils,
  },
  'Negotiation (Tentative)': {
    label: 'Negotiation',
    shortLabel: 'Negotiation',
    bgClass: 'bg-amber-500 hover:bg-amber-600',
    borderClass: 'border-amber-300',
    textClass: 'text-slate-900 font-bold',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800 border-amber-200',
    icon: Clock,
  },
  'Expression of Interest (Tentative)': {
    label: 'Quote Shared',
    shortLabel: 'Quote Shared',
    bgClass: 'bg-blue-600 hover:bg-blue-700',
    borderClass: 'border-blue-300',
    textClass: 'text-white',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700 border-blue-200',
    icon: Sparkles,
  },
  'Venue Walkthrough Completed (Tentative)': {
    label: 'Quote Shared',
    shortLabel: 'Quote Shared',
    bgClass: 'bg-blue-600 hover:bg-blue-700',
    borderClass: 'border-blue-300',
    textClass: 'text-white',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700 border-blue-200',
    icon: Eye,
  },
  'Initial Discussion - Quote Sharing (Tentative)': {
    label: 'Quote Shared',
    shortLabel: 'Quote Shared',
    bgClass: 'bg-blue-600 hover:bg-blue-700',
    borderClass: 'border-blue-300',
    textClass: 'text-white',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700 border-blue-200',
    icon: FileText,
  },
  'Function Completed': {
    label: 'Function Completed',
    shortLabel: 'Completed',
    bgClass: 'bg-indigo-600 hover:bg-indigo-700',
    borderClass: 'border-indigo-300',
    textClass: 'text-white',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-700 border-indigo-200',
    icon: Award,
  },
  'Function Completed and Gift Sent': {
    label: 'Function Completed & Gift Sent',
    shortLabel: 'Completed & Gifted',
    bgClass: 'bg-cyan-600 hover:bg-cyan-700',
    borderClass: 'border-cyan-300',
    textClass: 'text-white',
    badgeBg: 'bg-cyan-50',
    badgeText: 'text-cyan-700 border-cyan-200',
    icon: Gift,
  },
};

const DEFAULT_STATUS_STYLE = {
  label: 'Tentative Booking',
  shortLabel: 'Tentative',
  bgClass: 'bg-amber-600 hover:bg-amber-700',
  borderClass: 'border-amber-300',
  textClass: 'text-white',
  badgeBg: 'bg-amber-50',
  badgeText: 'text-amber-800 border-amber-200',
  icon: Clock,
};

export const HallAvailabilityMatrix: React.FC<HallAvailabilityMatrixProps> = ({
  onSelectSlot,
  onSelectEnquiry,
  onOpenBEO,
  onOpenGoogleSheets,
}) => {
  const { venues, enquiries, auditLogs, downloadMultiSheetMaster, googleSheetConfig } = useBEMS();

  // 1. Sub-divided View Mode: 'day' | 'week' | 'month' | 'muhurtham'
  const [availabilityViewMode, setAvailabilityViewMode] = useState<'day' | 'week' | 'month' | 'muhurtham'>('day');

  // Split-Screen Inspector States
  const [isSplitScreenOpen, setIsSplitScreenOpen] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 1024 : true;
  });
  const [selectedBookingForInspector, setSelectedBookingForInspector] = useState<Enquiry | null>(null);
  const [selectedSlotForInspector, setSelectedSlotForInspector] = useState<{
    hallId: string;
    hallName: string;
    date: string;
    session: string;
  } | null>(null);

  const handleInspectBooking = (booking: Enquiry) => {
    setSelectedBookingForInspector(booking);
    setSelectedSlotForInspector(null);
    setIsSplitScreenOpen(true);
  };

  const handleInspectSlot = (hallId: string, hallName: string, date: string, session: string) => {
    setSelectedSlotForInspector({ hallId, hallName, date, session });
    setSelectedBookingForInspector(null);
    setIsSplitScreenOpen(true);
  };

  // Single Day View Date State
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
  });

  // Month-wise calendar state
  const [monthViewMonth, setMonthViewMonth] = useState<number>(() => {
    const parts = selectedDate.split('-');
    return parts.length === 3 ? parseInt(parts[1], 10) : new Date().getMonth() + 1;
  });
  const [monthViewYear, setMonthViewYear] = useState<number>(() => {
    const parts = selectedDate.split('-');
    return parts.length === 3 ? parseInt(parts[0], 10) : new Date().getFullYear();
  });

  // Synchronize month calendar when selectedDate changes
  useEffect(() => {
    const parts = selectedDate.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (!isNaN(y) && !isNaN(m)) {
        setMonthViewYear(y);
        setMonthViewMonth(m);
      }
    }
  }, [selectedDate]);

  const handleSelectDateAndSwitchToDay = (dateStr: string) => {
    setSelectedDate(dateStr);
    setAvailabilityViewMode('day');
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [hallFilter, setHallFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');

  // Tooltip & Hover states
  const [hoveredBooking, setHoveredBooking] = useState<{
    booking: Enquiry;
    x: number;
    y: number;
  } | null>(null);

  const [quickBookModal, setQuickBookModal] = useState<{
    hallId: string;
    hallName: string;
    startTime: string;
    endTime: string;
  } | null>(null);

  // Google Sheets Admin Guide Modal & Script Copy State
  const [showSheetsAdminGuide, setShowSheetsAdminGuide] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  const handleCopyScriptFromMatrix = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleDownloadScriptFile = () => {
    const blob = new Blob([GOOGLE_APPS_SCRIPT_CODE], { type: 'text/javascript;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Code.gs';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const timelineContainerRef = useRef<HTMLDivElement>(null);

  // Today Date string
  const todayStr = useMemo(() => {
    const today = new Date();
    return `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
  }, []);

  const isToday = selectedDate === todayStr;

  // Active Venues Filtered
  const activeVenues = useMemo(() => {
    return venues.filter(v => {
      if (v.status !== 'Active') return false;
      if (hallFilter !== 'ALL' && v.id !== hallFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesHall = v.name.toLowerCase().includes(q);
        // Check if any booking on this day in this hall matches
        const matchesBooking = enquiries.some(
          e =>
            e.hallId === v.id &&
            e.eventDate === selectedDate &&
            (e.guestName.toLowerCase().includes(q) ||
              e.companyName.toLowerCase().includes(q) ||
              e.refNo.toLowerCase().includes(q) ||
              e.eventType.toLowerCase().includes(q))
        );
        return matchesHall || matchesBooking;
      }
      return true;
    });
  }, [venues, hallFilter, searchQuery, enquiries, selectedDate]);

  // Bookings on the selected single day
  const dayBookings = useMemo(() => {
    return enquiries.filter(
      e =>
        e.eventDate === selectedDate &&
        e.status !== 'Cancelled' &&
        e.status !== 'Postponed' &&
        e.finalStatus !== 'Cancelled' &&
        e.finalStatus !== 'Postponed'
    );
  }, [enquiries, selectedDate]);

  // Day Statistics Summary
  const dayStats = useMemo(() => {
    const totalBlockedHalls = new Set(dayBookings.map(b => b.hallId)).size;
    const exclusiveCount = dayBookings.filter(
      b => b.status === 'Advance Paid (EXCLUSIVE LOCK)' || b.finalStatus === 'Exclusive Lock'
    ).length;
    const confirmedCount = dayBookings.filter(
      b => b.status === 'Confirmed' || b.status === 'Balance Paid' || b.finalStatus === 'Confirmed'
    ).length;
    const tentativeCount = Math.max(0, dayBookings.length - exclusiveCount - confirmedCount);

    return {
      totalBookings: dayBookings.length,
      totalBlockedHalls,
      exclusiveCount,
      confirmedCount,
      tentativeCount,
    };
  }, [dayBookings]);

  // Day Navigator Handlers
  const handleShiftDay = (delta: number) => {
    setSelectedDate(prev => addDaysToDate(prev, delta));
  };

  const handleJumpToToday = () => {
    setSelectedDate(todayStr);
  };

  // Scroll to Specific Hour
  const scrollToHour = (hour: number) => {
    if (timelineContainerRef.current) {
      const slotIndex = hour * 2;
      const targetScroll = slotIndex * SLOT_WIDTH_PX;
      timelineContainerRef.current.scrollTo({
        left: Math.max(0, targetScroll - 40),
        behavior: 'smooth',
      });
    }
  };

  // Auto-scroll to Prime Hour (09:00) on initial render or date change
  useEffect(() => {
    if (timelineContainerRef.current) {
      // Scroll to 07:00 to show standard daytime hours upfront
      const targetScroll = 7 * 2 * SLOT_WIDTH_PX;
      timelineContainerRef.current.scrollLeft = Math.max(0, targetScroll - 20);
    }
  }, [selectedDate]);

  // Generate 48 Half-Hour Slots Array (00:00 to 24:00)
  const halfHourSlots = useMemo(() => {
    const slots: { index: number; startMinutes: number; timeStr: string; isHourStart: boolean; hour: number }[] = [];
    for (let i = 0; i < TOTAL_30MIN_SLOTS; i++) {
      const minutes = i * 30;
      slots.push({
        index: i,
        startMinutes: minutes,
        timeStr: minutesToTimeString(minutes),
        isHourStart: i % 2 === 0,
        hour: Math.floor(i / 2),
      });
    }
    return slots;
  }, []);

  // Compute Layout Lanes for a Hall's Bookings on this Day to prevent visual overlap
  const getHallLanes = (hallId: string) => {
    const bookings = dayBookings
      .filter(e => e.hallId === hallId)
      .map(e => {
        const { startMinutes, endMinutes, durationMinutes, formatted } = parseSessionTimeSlot(e.session);
        return {
          enquiry: e,
          startMinutes,
          endMinutes,
          durationMinutes,
          formattedSession: formatted,
        };
      })
      .sort((a, b) => a.startMinutes - b.startMinutes);

    const lanes: typeof bookings[] = [];

    bookings.forEach(item => {
      let placed = false;
      for (let l = 0; l < lanes.length; l++) {
        const lastInLane = lanes[l][lanes[l].length - 1];
        if (lastInLane.endMinutes <= item.startMinutes) {
          lanes[l].push(item);
          placed = true;
          break;
        }
      }
      if (!placed) {
        lanes.push([item]);
      }
    });

    return {
      lanes,
      totalLanes: Math.max(1, lanes.length),
      allBookings: bookings,
    };
  };

  // Current time minute offset for today marker
  const currentTimeMinutes = useMemo(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }, []);

  return (
    <div id="hall-availability-view" className="space-y-4">
      {/* 1. PRIMARY VIEW HEADER: Title, Google Sheets Linking, and Sub-divided View Switcher */}
      <div className="p-4 bg-white border border-sky-200 rounded-2xl shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Header Title & Mode Indicator */}
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-700">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-slate-800 tracking-wide">
                  Hall Availability
                </h2>

                {/* Direct Open Google Sheet Button */}
                <a
                  href={googleSheetConfig.sheetUrl || 'https://docs.google.com/spreadsheets'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs group cursor-pointer"
                  title={
                    googleSheetConfig.sheetUrl
                      ? `Open Linked Google Sheet: ${googleSheetConfig.sheetName || 'Master Enquiries Register'}`
                      : 'Open Google Sheets'
                  }
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
                  <span className="hidden sm:inline">Open Google Sheet</span>
                  <ExternalLink className="w-3 h-3 text-emerald-600" />
                </a>

                {/* Small Icon & Trigger for Admin Google Sheet Linking Steps & Script Code */}
                <button
                  type="button"
                  onClick={() => setShowSheetsAdminGuide(true)}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer group"
                  title="Click to view Google Sheets embedded code & setup steps for Admin"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
                  <span className="hidden sm:inline">Google Sheet Linking</span>
                  <span className="p-0.5 rounded bg-emerald-200/80 text-emerald-950 text-[10px] font-bold flex items-center gap-0.5">
                    <HelpCircle className="w-3 h-3" />
                    <span>Steps & Code</span>
                  </span>
                </button>

                {/* Direct Multi-Sheet Excel Download Button */}
                <button
                  type="button"
                  onClick={downloadMultiSheetMaster}
                  className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                  title="Download full multi-sheet spreadsheet (Sheet 1 Master Index + Sheet 2+ Enquiry detail sheets with real-time audit trails)"
                >
                  <Download className="w-3.5 h-3.5 text-teal-600" />
                  <span className="hidden sm:inline">Export Multi-Sheet (.xlsx)</span>
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {availabilityViewMode === 'day' ? (
                  <span>
                    Day timeline & 30-min slot blocking for{' '}
                    <strong className="text-teal-700 font-semibold">{formatReadableDate(selectedDate)}</strong>
                  </span>
                ) : availabilityViewMode === 'week' ? (
                  <span>
                    D3.js interactive horizontal bar timeline of hall occupancy for the current week
                  </span>
                ) : availabilityViewMode === 'muhurtham' ? (
                  <span>
                    Tamil Nadu auspicious wedding & muhurtham dates with real-time hall availability
                  </span>
                ) : (
                  <span>
                    Monthly calendar grid overview & booking distribution (click any day to open its timeline)
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Sub-divided View Switcher + Split-Screen Inspector Toggle */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <div className="flex items-center bg-sky-100/80 p-1 rounded-xl border border-sky-200 shadow-2xs">
              <button
                type="button"
                id="view-mode-day-btn"
                onClick={() => setAvailabilityViewMode('day')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  availabilityViewMode === 'day'
                    ? 'bg-white text-teal-800 shadow-xs ring-1 ring-teal-200'
                    : 'text-slate-600 hover:text-teal-800'
                }`}
              >
                <Clock className="w-4 h-4 text-teal-600" />
                <span>Day Timeline</span>
              </button>
              <button
                type="button"
                id="view-mode-week-btn"
                onClick={() => setAvailabilityViewMode('week')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  availabilityViewMode === 'week'
                    ? 'bg-white text-teal-800 shadow-xs ring-1 ring-teal-200'
                    : 'text-slate-600 hover:text-teal-800'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-teal-600" />
                <span>Week Chart</span>
              </button>
              <button
                type="button"
                id="view-mode-month-btn"
                onClick={() => {
                  const parts = selectedDate.split('-');
                  if (parts.length === 3) {
                    setMonthViewYear(parseInt(parts[0], 10));
                    setMonthViewMonth(parseInt(parts[1], 10));
                  }
                  setAvailabilityViewMode('month');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  availabilityViewMode === 'month'
                    ? 'bg-white text-teal-800 shadow-xs ring-1 ring-teal-200'
                    : 'text-slate-600 hover:text-teal-800'
                }`}
              >
                <Calendar className="w-4 h-4 text-teal-600" />
                <span>Month Grid</span>
              </button>
              <button
                type="button"
                id="view-mode-muhurtham-btn"
                onClick={() => setAvailabilityViewMode('muhurtham')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  availabilityViewMode === 'muhurtham'
                    ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-amber-800'
                }`}
              >
                <Flame className="w-4 h-4 text-amber-500" />
                <span>Muhurtham Dates</span>
              </button>
            </div>

            {/* Split Screen Inspector Toggle Button */}
            <button
              type="button"
              onClick={() => setIsSplitScreenOpen(prev => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border shadow-2xs ${
                isSplitScreenOpen
                  ? 'bg-teal-700 text-white border-teal-800'
                  : 'bg-white hover:bg-sky-50 text-slate-700 border-sky-300'
              }`}
              title="Toggle right-hand split-screen booking inspector"
            >
              <Columns2 className="w-3.5 h-3.5" />
              <span>{isSplitScreenOpen ? 'Hide Inspector' : 'Show Inspector'}</span>
              {selectedBookingForInspector && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 items-start">
        <div className="flex-1 w-full min-w-0">
          {availabilityViewMode === 'month' ? (
            <HallAvailabilityMonthView
              currentMonth={monthViewMonth}
              currentYear={monthViewYear}
              onMonthChange={(m, y) => {
                setMonthViewMonth(m);
                setMonthViewYear(y);
              }}
              selectedDate={selectedDate}
              onSelectDateAndSwitchToDay={handleSelectDateAndSwitchToDay}
              onSelectEnquiry={handleInspectBooking}
              hallFilter={hallFilter}
              setHallFilter={setHallFilter}
              statusFilter={selectedStatusFilter}
              setStatusFilter={setSelectedStatusFilter}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          ) : availabilityViewMode === 'week' ? (
            <HallAvailabilityWeekChart
              currentDateStr={selectedDate}
              onSelectSlot={(hallId, date, session) => handleInspectSlot(hallId, venues.find(v => v.id === hallId)?.name || hallId, date, session)}
              onSelectEnquiry={handleInspectBooking}
              onJumpToDay={handleSelectDateAndSwitchToDay}
              hallFilter={hallFilter}
              setHallFilter={setHallFilter}
              statusFilter={selectedStatusFilter}
              setStatusFilter={setSelectedStatusFilter}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          ) : availabilityViewMode === 'muhurtham' ? (
            <MuhurthamCalendarView
              onOpenNewEnquiryForDate={date => handleInspectSlot('', 'Grand Ballroom', date, 'Full Day (09:00 - 23:00)')}
              onOpenEnquiryDetail={handleInspectBooking}
            />
          ) : (
            <>
              {/* DAY-WISE VIEW CONTROLS & TIMELINE */}
              <div className="p-4 bg-white border border-sky-200 rounded-2xl shadow-xs space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Day Header Title & Date Indicator */}
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-xl text-teal-700">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-800">
                      Day Schedule: {formatReadableDate(selectedDate)}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setAvailabilityViewMode('month')}
                      className="px-2 py-0.5 bg-sky-50 hover:bg-sky-100 text-teal-800 border border-sky-200 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                      title="Switch to Month-wise Calendar View"
                    >
                      <Calendar className="w-3 h-3 text-teal-600" />
                      <span>Month Calendar</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    24-hour linear timeline across 48 half-hour slots with real-time status blocking
                  </p>
                </div>
              </div>

              {/* DATE FILTER CONTROLS */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Native Date Picker */}
                <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-sky-200 shadow-xs">
                  <Calendar className="w-4 h-4 text-teal-600" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={e => e.target.value && setSelectedDate(e.target.value)}
                    className="bg-transparent text-xs text-slate-800 font-mono focus:outline-none cursor-pointer"
                    title="Select Date to View"
                  />
                </div>

                {/* Quick Day Steppers */}
                <div className="flex items-center gap-1 bg-sky-50/60 p-1 rounded-xl border border-sky-200">
                  <button
                    onClick={() => handleShiftDay(-1)}
                    className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-sky-100 rounded-lg transition-colors flex items-center gap-1 text-xs cursor-pointer"
                    title="Previous Day"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Prev</span>
                  </button>

                  <button
                    onClick={handleJumpToToday}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      isToday
                        ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-xs'
                        : 'text-teal-700 hover:bg-sky-100'
                    }`}
                  >
                    Today
                  </button>

                  <button
                    onClick={() => handleShiftDay(1)}
                    className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-sky-100 rounded-lg transition-colors flex items-center gap-1 text-xs cursor-pointer"
                    title="Next Day"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Hall Filter Dropdown */}
                <select
                  value={hallFilter}
                  onChange={e => setHallFilter(e.target.value)}
                  className="py-2 px-3 bg-white border border-sky-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-teal-500 shadow-xs"
                >
                  <option value="ALL">All Halls ({venues.filter(v => v.status === 'Active').length})</option>
                  {venues
                    .filter(v => v.status === 'Active')
                    .map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name} (MG: {v.defaultMg})
                      </option>
                    ))}
                </select>
              </div>
            </div>

        {/* Sub-bar: Search, Quick Hour Jumps, and Day Metrics */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-sky-100 text-xs">
          {/* Search Party / Guest / Ref */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Party, Guest, Ref #..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-sky-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Hour Jump Shortcuts */}
          <div className="flex flex-wrap items-center gap-1 text-[11px] text-slate-500">
            <span className="font-semibold text-slate-500 mr-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-teal-600" />
              Jump to:
            </span>
            <button
              onClick={() => scrollToHour(0)}
              className="px-2 py-1 bg-sky-50 hover:bg-sky-100 text-slate-700 rounded border border-sky-200 transition-colors"
            >
              00:00
            </button>
            <button
              onClick={() => scrollToHour(7)}
              className="px-2 py-1 bg-sky-50 hover:bg-sky-100 text-teal-700 font-semibold rounded border border-teal-200 transition-colors"
            >
              07:00 (Morn)
            </button>
            <button
              onClick={() => scrollToHour(9)}
              className="px-2 py-1 bg-sky-50 hover:bg-sky-100 text-teal-700 font-semibold rounded border border-teal-200 transition-colors"
            >
              09:00 (Full Day)
            </button>
            <button
              onClick={() => scrollToHour(13)}
              className="px-2 py-1 bg-sky-50 hover:bg-sky-100 text-teal-700 font-semibold rounded border border-teal-200 transition-colors"
            >
              13:00 (Aft)
            </button>
            <button
              onClick={() => scrollToHour(17)}
              className="px-2 py-1 bg-sky-50 hover:bg-sky-100 text-teal-700 font-semibold rounded border border-teal-200 transition-colors"
            >
              17:00 (Eve)
            </button>
            {isToday && (
              <button
                onClick={() => scrollToHour(Math.floor(currentTimeMinutes / 60))}
                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded border border-rose-300 flex items-center gap-1 transition-colors animate-pulse"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>Now ({minutesToTimeString(currentTimeMinutes)})</span>
              </button>
            )}
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex items-center gap-2 text-[11px] font-mono">
            <span className="text-slate-500">Day Summary:</span>
            <span className="px-2 py-0.5 rounded bg-sky-50 border border-sky-200 text-slate-700">
              {dayStats.totalBookings} Total Block{dayStats.totalBookings === 1 ? '' : 's'}
            </span>
            {dayStats.exclusiveCount > 0 && (
              <span className="px-2 py-0.5 rounded bg-purple-50 border border-purple-200 text-purple-700 font-bold">
                {dayStats.exclusiveCount} Locked
              </span>
            )}
            {dayStats.confirmedCount > 0 && (
              <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold">
                {dayStats.confirmedCount} Confirmed
              </span>
            )}
            {dayStats.tentativeCount > 0 && (
              <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 font-bold">
                {dayStats.tentativeCount} Tentative
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. COLOR LEGEND FOR PIPELINE STATUSES */}
      <div className="p-3 bg-white border border-sky-200 rounded-xl shadow-xs">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
          <span className="text-slate-500 font-bold flex items-center gap-1 text-[11px] uppercase tracking-wider">
            <SlidersHorizontal className="w-3.5 h-3.5 text-teal-600" />
            <span>Status Colors:</span>
          </span>

          {PIPELINE_STAGES.map(stageName => {
            const cfg = STATUS_CONFIG[stageName] || DEFAULT_STATUS_STYLE;
            const count = dayBookings.filter(
              b =>
                b.status === stageName ||
                (stageName === 'Confirmed' &&
                  (b.status === 'Balance Paid' ||
                    b.status === 'Advance Paid (EXCLUSIVE LOCK)' ||
                    b.finalStatus === 'Confirmed' ||
                    b.finalStatus === 'Exclusive Lock')) ||
                (stageName === 'Quote Shared' &&
                  (b.status === 'Initial Discussion - Quote Sharing (Tentative)' ||
                    b.status === 'Expression of Interest (Tentative)' ||
                    b.status === 'Venue Walkthrough Completed (Tentative)')) ||
                (stageName === 'Negotiation' && b.status === 'Negotiation (Tentative)')
            ).length;
            const isFilterActive = selectedStatusFilter === stageName;

            return (
              <button
                key={stageName}
                onClick={() =>
                  setSelectedStatusFilter(prev => (prev === stageName ? 'ALL' : stageName))
                }
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium transition-all border ${
                  isFilterActive
                    ? 'ring-2 ring-teal-500 scale-105 border-teal-500 bg-sky-50 text-slate-900 shadow-xs'
                    : 'border-sky-200 hover:border-teal-300 bg-white text-slate-700'
                }`}
                title={`Click to filter by ${stageName}`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${cfg.bgClass.split(' ')[0]}`} />
                <span>{stageName}</span>
                {count > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full font-mono text-[9px] font-bold bg-sky-100 text-teal-800">
                    {count}
                  </span>
                )}
              </button>
            );
          })}

          {selectedStatusFilter !== 'ALL' && (
            <button
              onClick={() => setSelectedStatusFilter('ALL')}
              className="text-[11px] text-teal-700 hover:underline flex items-center gap-1 ml-auto font-medium"
            >
              <X className="w-3 h-3" />
              <span>Clear Filter</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. MAIN TIMELINE MATRIX (00:00 - 24:00 IN 30-MINUTE INTERVALS) */}
      <div className="bg-white border border-sky-200 rounded-2xl shadow-md overflow-hidden">
        <div
          ref={timelineContainerRef}
          className="overflow-x-auto relative select-none"
          style={{ scrollbarGutter: 'stable' }}
        >
          <div style={{ minWidth: `${TIMELINE_WIDTH_PX + 240}px` }}>
            {/* A. TIMELINE HEADER: HOURS & 30-MIN SUB-TICKS */}
            <div className="flex border-b border-sky-200 bg-sky-50 sticky top-0 z-30 shadow-xs">
              {/* Sticky Top-Left Corner: Hall Header */}
              <div className="w-60 min-w-[240px] max-w-[240px] p-3.5 bg-sky-50 border-r border-sky-200 sticky left-0 z-40 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                    Venue Halls ({activeVenues.length})
                  </span>
                  <span className="text-[10px] text-teal-700 font-mono font-medium">
                    {formatDisplayDate(selectedDate)}
                  </span>
                </div>
                <Building2 className="w-4 h-4 text-teal-600" />
              </div>

              {/* Linear 24-Hour Timeline Header Tracks */}
              <div className="flex-1 relative">
                {/* Major Hours Row (00:00, 01:00, ... 23:00, 24:00) */}
                <div
                  className="grid bg-sky-50/80 border-b border-sky-200/80"
                  style={{
                    gridTemplateColumns: `repeat(24, ${SLOT_WIDTH_PX * 2}px)`,
                    width: `${TIMELINE_WIDTH_PX}px`,
                  }}
                >
                  {Array.from({ length: 24 }).map((_, h) => {
                    const isBusinessHours = h >= 7 && h < 23;
                    return (
                      <div
                        key={h}
                        className={`p-1.5 text-center border-r border-sky-200 font-mono text-xs ${
                          isBusinessHours
                            ? 'text-teal-700 font-bold bg-teal-50/50'
                            : 'text-slate-400 font-normal bg-sky-50/20'
                        }`}
                      >
                        <span>{`${h.toString().padStart(2, '0')}:00`}</span>
                      </div>
                    );
                  })}
                </div>

                {/* 30-Minute Sub-Tick Row */}
                <div
                  className="grid bg-sky-50/40 text-[10px] font-mono text-slate-400"
                  style={{
                    gridTemplateColumns: `repeat(${TOTAL_30MIN_SLOTS}, ${SLOT_WIDTH_PX}px)`,
                    width: `${TIMELINE_WIDTH_PX}px`,
                  }}
                >
                  {halfHourSlots.map(s => {
                    const isBusinessHours = s.startMinutes >= 420 && s.startMinutes < 1380;
                    return (
                      <div
                        key={s.index}
                        className={`py-0.5 text-center border-r ${
                          s.isHourStart
                            ? 'border-sky-200 text-slate-600 font-semibold'
                            : 'border-sky-100 text-slate-400'
                        } ${isBusinessHours ? 'bg-teal-50/20' : ''}`}
                      >
                        <span>{s.isHourStart ? ':00' : ':30'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* B. VENUE HALL LINES & INDIVIDUAL PARTY BLOCKINGS */}
            <div className="divide-y divide-sky-100">
              {activeVenues.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-xs">
                  No active venue halls matched the filter or search criteria.
                </div>
              ) : (
                activeVenues.map(hall => {
                  const { lanes, totalLanes, allBookings } = getHallLanes(hall.id);
                  const rowHeight = Math.max(68, totalLanes * 46 + 18);

                  return (
                    <div
                      key={hall.id}
                      className="flex hover:bg-sky-50/40 transition-colors relative group"
                      style={{ minHeight: `${rowHeight}px` }}
                    >
                      {/* 1. Left Sticky Column: Hall Name & Specs */}
                      <div
                        className="w-60 min-w-[240px] max-w-[240px] p-3 bg-white border-r border-sky-200 sticky left-0 z-20 shadow-xs flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <strong className="text-slate-800 text-xs font-bold truncate">
                              {hall.name}
                            </strong>
                            <span className="text-[10px] font-mono text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 font-medium">
                              MG: {hall.defaultMg}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {hall.areaSqFt ? `${formatIndianNumber(hall.areaSqFt)} sq ft` : ''}
                            {hall.dimensions ? ` • ${hall.dimensions}` : ''}
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-sky-100 mt-1">
                          <span className="text-[9px] font-mono text-slate-400">
                            {allBookings.length === 0
                              ? 'Fully Available'
                              : `${allBookings.length} Party Block${allBookings.length === 1 ? '' : 's'}`}
                          </span>
                          <button
                            onClick={() => onSelectSlot(hall.id, selectedDate, '09:00-18:00')}
                            className="px-2 py-0.5 rounded text-[10px] font-semibold text-teal-700 hover:text-white hover:bg-teal-600 border border-teal-300 transition-colors flex items-center gap-1 shadow-2xs"
                            title={`Add new booking in ${hall.name} for ${formatDisplayDate(selectedDate)}`}
                          >
                            <Plus className="w-2.5 h-2.5" />
                            <span>Book</span>
                          </button>
                        </div>
                      </div>

                      {/* 2. Right Timeline Grid Line & Party Blocks (00:00 to 24:00) */}
                      <div
                        className="flex-1 relative"
                        style={{
                          width: `${TIMELINE_WIDTH_PX}px`,
                          height: `${rowHeight}px`,
                        }}
                      >
                        {/* A. 30-Minute Grid Background Columns */}
                        <div
                          className="absolute inset-0 grid h-full pointer-events-none"
                          style={{
                            gridTemplateColumns: `repeat(${TOTAL_30MIN_SLOTS}, ${SLOT_WIDTH_PX}px)`,
                            width: `${TIMELINE_WIDTH_PX}px`,
                          }}
                        >
                          {halfHourSlots.map(s => {
                            const isBusinessHours = s.startMinutes >= 420 && s.startMinutes < 1380;
                            return (
                              <div
                                key={s.index}
                                className={`h-full border-r ${
                                  s.isHourStart
                                    ? 'border-sky-200'
                                    : 'border-sky-100'
                                } ${isBusinessHours ? 'bg-teal-500/[0.02]' : 'bg-transparent'}`}
                              />
                            );
                          })}
                        </div>

                        {/* B. Interactive Clickable Empty Slot Ticks (for fast booking) */}
                        <div
                          className="absolute inset-0 grid h-full"
                          style={{
                            gridTemplateColumns: `repeat(${TOTAL_30MIN_SLOTS}, ${SLOT_WIDTH_PX}px)`,
                            width: `${TIMELINE_WIDTH_PX}px`,
                          }}
                        >
                          {halfHourSlots.map(s => {
                            const nextTime = minutesToTimeString(s.startMinutes + 30);
                            return (
                              <div
                                key={s.index}
                                onClick={() => {
                                  const endHourMinutes = Math.min(s.startMinutes + 300, 1380);
                                  const formattedSession = `${s.timeStr}-${minutesToTimeString(endHourMinutes)}`;
                                  handleInspectSlot(hall.id, hall.name, selectedDate, formattedSession);
                                }}
                                onDoubleClick={() => {
                                  const endHourMinutes = Math.min(s.startMinutes + 300, 1380);
                                  const formattedSession = `${s.timeStr}-${minutesToTimeString(endHourMinutes)}`;
                                  onSelectSlot(hall.id, selectedDate, formattedSession);
                                }}
                                className="h-full hover:bg-teal-500/10 cursor-pointer transition-colors group/slot relative"
                                title={`Available: ${s.timeStr} - ${nextTime} in ${hall.name} • Click to inspect or double-click to book`}
                              >
                                <span className="opacity-0 group-hover/slot:opacity-100 absolute inset-0 flex items-center justify-center text-teal-600 transition-opacity">
                                  <Plus className="w-3.5 h-3.5 pointer-events-none" />
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* C. Current Time Vertical Line Indicator (If today) */}
                        {isToday && (
                          <div
                            className="absolute top-0 bottom-0 z-20 pointer-events-none border-l-2 border-rose-500"
                            style={{
                              left: `${(currentTimeMinutes / 30) * SLOT_WIDTH_PX}px`,
                            }}
                          >
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 block -ml-[5px] -mt-1 shadow-xs shadow-rose-500 animate-pulse" />
                          </div>
                        )}

                        {/* D. PARTY BLOCKINGS (Positioned accurately along 00:00 - 24:00 with distinct status colors) */}
                        {lanes.map((lane, laneIdx) =>
                          lane.map(item => {
                            const { enquiry, startMinutes, durationMinutes, formattedSession } = item;
                            const statusCfg = STATUS_CONFIG[enquiry.status] || DEFAULT_STATUS_STYLE;
                            const Icon = statusCfg.icon;

                            // Calculate exact horizontal position & width based on 30-min section scale
                            const leftPx = (startMinutes / 30) * SLOT_WIDTH_PX;
                            const widthPx = Math.max((durationMinutes / 30) * SLOT_WIDTH_PX, 32);
                            const topPx = laneIdx * 46 + 8;

                            const isFilteredOut =
                              selectedStatusFilter !== 'ALL' &&
                              enquiry.status !== selectedStatusFilter &&
                              !(
                                selectedStatusFilter === 'Confirmed' &&
                                (enquiry.status === 'Balance Paid' ||
                                  enquiry.status === 'Advance Paid (EXCLUSIVE LOCK)' ||
                                  enquiry.finalStatus === 'Confirmed' ||
                                  enquiry.finalStatus === 'Exclusive Lock')
                              ) &&
                              !(
                                selectedStatusFilter === 'Quote Shared' &&
                                (enquiry.status === 'Initial Discussion - Quote Sharing (Tentative)' ||
                                  enquiry.status === 'Expression of Interest (Tentative)' ||
                                  enquiry.status === 'Venue Walkthrough Completed (Tentative)')
                              ) &&
                              !(
                                selectedStatusFilter === 'Negotiation' &&
                                enquiry.status === 'Negotiation (Tentative)'
                              );

                            return (
                              <div
                                key={enquiry.id}
                                onClick={e => {
                                  e.stopPropagation();
                                  handleInspectBooking(enquiry);
                                }}
                                onDoubleClick={e => {
                                  e.stopPropagation();
                                  onSelectEnquiry(enquiry);
                                }}
                                onMouseEnter={e => {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setHoveredBooking({
                                    booking: enquiry,
                                    x: rect.left + rect.width / 2,
                                    y: rect.top,
                                  });
                                }}
                                onMouseLeave={() => setHoveredBooking(null)}
                                className={`absolute z-10 rounded-xl px-2.5 py-1.5 cursor-pointer shadow-md border transition-all ${
                                  statusCfg.bgClass
                                } ${statusCfg.borderClass} ${statusCfg.textClass} ${
                                  isFilteredOut ? 'opacity-25 grayscale' : 'opacity-100'
                                } hover:scale-[1.01] hover:z-30 hover:shadow-xl`}
                                style={{
                                  left: `${leftPx}px`,
                                  width: `${widthPx}px`,
                                  top: `${topPx}px`,
                                  height: '38px',
                                }}
                              >
                                <div className="flex items-center justify-between gap-1.5 h-full overflow-hidden">
                                  {/* Left: Icon & Ref + Guest info */}
                                  <div className="flex items-center gap-1.5 truncate">
                                    <Icon className="w-3.5 h-3.5 shrink-0" />
                                    <span className="font-mono font-bold text-[10px] shrink-0">
                                      #{enquiry.refNo}
                                    </span>
                                    <span className="font-bold text-xs truncate">
                                      {enquiry.guestName}
                                    </span>
                                    {enquiry.companyName && (
                                      <span className="text-[10px] opacity-80 truncate hidden sm:inline">
                                        ({enquiry.companyName})
                                      </span>
                                    )}
                                  </div>

                                  {/* Right: Time session + Pax badge */}
                                  <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-mono">
                                    <span className="font-semibold bg-black/20 px-1.5 py-0.5 rounded">
                                      {formattedSession}
                                    </span>
                                    <span className="bg-black/30 px-1.5 py-0.5 rounded font-bold">
                                      {enquiry.gPax} Pax
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )}
</div>

      {/* Live Split-Screen Inspector Panel */}
      {isSplitScreenOpen && (
        <AvailabilityInspectorPanel
          selectedBooking={selectedBookingForInspector}
          selectedSlot={selectedSlotForInspector}
          selectedDate={selectedDate}
          dayBookings={dayBookings}
          onClose={() => setIsSplitScreenOpen(false)}
          onSelectBooking={handleInspectBooking}
          onOpenNewEnquiry={slot => onSelectSlot(slot.hallId || '', slot.date || selectedDate, slot.session || 'Full Day (09:00 - 23:00)')}
          onOpenEnquiryDetail={onSelectEnquiry}
          onOpenBEO={enq => onOpenBEO?.(enq)}
        />
      )}
    </div>

      {/* 4. HOVER TOOLTIP FLOATING CARD */}
      {hoveredBooking && (
        <div
          className="fixed z-50 pointer-events-none -translate-x-1/2 -translate-y-full mb-3 w-80 p-4 bg-white/95 border border-sky-200 rounded-2xl shadow-2xl text-xs space-y-2 backdrop-blur-xs text-slate-800"
          style={{
            left: `${hoveredBooking.x}px`,
            top: `${hoveredBooking.y}px`,
          }}
        >
          <div className="flex justify-between items-start">
            <span className="font-mono font-bold text-teal-700">
              Ref #{hoveredBooking.booking.refNo}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                STATUS_CONFIG[hoveredBooking.booking.status]?.badgeBg || 'bg-sky-50'
              } ${STATUS_CONFIG[hoveredBooking.booking.status]?.badgeText || 'text-slate-700 border-sky-200'}`}
            >
              {hoveredBooking.booking.status}
            </span>
          </div>

          <div>
            <h4 className="font-bold text-slate-800 text-sm">
              {hoveredBooking.booking.guestName}
            </h4>
            {hoveredBooking.booking.companyName && (
              <p className="text-slate-500 text-xs">
                {hoveredBooking.booking.companyName}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 p-2 bg-sky-50/60 rounded-xl border border-sky-100 font-mono text-[11px]">
            <div>
              <span className="text-slate-500 block text-[9px] uppercase">Venue & Layout</span>
              <span className="text-slate-800 font-semibold truncate block">
                {hoveredBooking.booking.hallName}
              </span>
              <span className="text-slate-500 text-[10px]">
                {hoveredBooking.booking.seatingArrangement}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px] uppercase">Session & Pax</span>
              <span className="text-teal-700 font-semibold block">
                {hoveredBooking.booking.session}
              </span>
              <span className="text-slate-600 text-[10px]">
                {hoveredBooking.booking.gPax} Pax (Guaranteed)
              </span>
            </div>
          </div>

          <div className="flex justify-between text-[11px] text-slate-700 pt-1">
            <span>Handler: {hoveredBooking.booking.accountHandler || hoveredBooking.booking.firstContactPerson || 'Staff'}</span>
            <span className="text-teal-700 font-mono font-bold">
              {formatINR(hoveredBooking.booking.finalBillValue || hoveredBooking.booking.quotedBaseRate)}
            </span>
          </div>

          {hoveredBooking.booking.remarks && (
            <p className="text-[10px] text-slate-600 italic bg-sky-50/40 p-1.5 rounded border border-sky-100 truncate">
              "{hoveredBooking.booking.remarks}"
            </p>
          )}

          <div className="text-[9px] text-center text-teal-600 font-mono pt-1">
            Click to view full event details & edit
          </div>
        </div>
      )}

      {/* Google Sheets Linking Steps & Embedded Code Modal */}
      {showSheetsAdminGuide && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-60 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Google Sheet Linking Steps & Apps Script Code
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Embedded Apps Script code and Admin instructions for real-time 27-column synchronization
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSheetsAdminGuide(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Actions / Copy Bar */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="text-xs font-bold text-emerald-900">
                  Apps Script Code (`Code.gs`)
                </span>
                <span className="text-[10px] text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                  27 Banquet Fields Mapped
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyScriptFromMatrix}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-200" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedScript ? 'Copied to Clipboard!' : 'Copy Apps Script Code'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadScriptFile}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .gs</span>
                </button>
              </div>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="space-y-3 text-xs">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-teal-600" />
                <span>Admin Step-by-Step Guide: How to Link Your Sheet</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <span className="w-4 h-4 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px]">1</span>
                    <span>Create a Google Sheet</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Open a new Google spreadsheet. You can quickly create one by opening <code className="bg-white px-1 py-0.5 rounded border border-slate-200 font-mono text-[10px]">sheets.new</code> in your browser.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <span className="w-4 h-4 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px]">2</span>
                    <span>Open Apps Script</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Inside Google Sheets, navigate to the top menu and select: <strong className="text-slate-800">Extensions &gt; Apps Script</strong>.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <span className="w-4 h-4 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px]">3</span>
                    <span>Paste &amp; Initialize</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Delete the default template code. Click <strong>Copy Apps Script Code</strong> above, paste it into the editor, and click the disk icon to Save.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <span className="w-4 h-4 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px]">4</span>
                    <span>Deploy as Web App</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Click <strong>Deploy &gt; New deployment</strong>. Select <em>Web app</em>. Set <strong>Execute as: Me</strong> and <strong>Who has access: Anyone</strong>, then click Deploy.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-xl space-y-1">
                <div className="flex items-center gap-2 font-bold text-slate-800">
                  <span className="w-4 h-4 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px]">5</span>
                  <span>Connect Sheet URL into BEMS</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Copy your Google Sheet URL (from your browser address bar) or Web App URL, paste it into the BEMS Google Sheets Integration window, and click <strong>Connect &amp; Save Sheet Link</strong>.
                </p>
              </div>
            </div>

            {/* Embedded Script Code Display Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Embedded Script Code Preview (Code.gs):
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  Full production script with auto-schema formatting
                </span>
              </div>
              <pre className="p-3 bg-slate-900 text-emerald-300 font-mono text-[11px] rounded-xl overflow-x-auto max-h-48 border border-slate-800 select-all leading-relaxed">
                {GOOGLE_APPS_SCRIPT_CODE}
              </pre>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSheetsAdminGuide(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Close
              </button>

              {onOpenGoogleSheets && (
                <button
                  type="button"
                  onClick={() => {
                    setShowSheetsAdminGuide(false);
                    onOpenGoogleSheets();
                  }}
                  className="px-5 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Open Google Sheets Manager</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

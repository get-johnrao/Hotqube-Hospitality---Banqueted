import React, { useState, useMemo } from 'react';
import { useBEMS } from '../context/BEMSContext';
import { Enquiry, PipelineStage } from '../types';
import { PIPELINE_STAGES } from '../data/initialData';
import {
  formatINR,
  formatIndianNumber,
  formatDisplayDate,
  isOverdueOrToday,
  isWithinNextDays,
  getDaysRemaining,
} from '../utils/formatters';
import {
  TrendingUp,
  Building2,
  Calendar,
  AlertCircle,
  Users,
  Clock,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  Phone,
  Layers,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  Eye,
  Lock,
  Info,
  HelpCircle,
  History,
  CalendarDays,
  CheckCheck,
} from 'lucide-react';
import { AnalyticsEnquiriesDrawer } from './AnalyticsEnquiriesDrawer';

interface AnalyticsDashboardProps {
  onSelectEnquiry: (enquiry: Enquiry) => void;
  onNewEnquiry: () => void;
  onOpenBEO?: (enquiry: Enquiry) => void;
  onEditEnquiry?: (enquiry: Enquiry) => void;
  onFilterByStatus?: (status: PipelineStage) => void;
}

// Helper to calculate the true total revenue for an enquiry
export const getEnquiryTotalRevenue = (e: Enquiry): number => {
  if (typeof e.finalBillValue === 'number' && e.finalBillValue > 0) {
    return e.finalBillValue;
  }
  const pax = e.gPax || e.expPax || 0;
  const rate = typeof e.quotedBaseRate === 'number' ? e.quotedBaseRate : 0;
  if (pax > 0 && rate > 0) {
    const subtotal = rate * pax;
    const taxRate = typeof e.taxRatePercent === 'number' ? e.taxRatePercent : 18.0;
    const tax = Math.round(subtotal * (taxRate / 100));
    return subtotal + tax;
  }
  if (typeof e.quotedBaseRate === 'number') {
    return e.quotedBaseRate;
  }
  return 0;
};

// Helper to check if an enquiry is a completed function (Past Revenue)
export const isCompletedBooking = (e: Enquiry): boolean => {
  if (
    e.status === 'Cancelled' ||
    e.status === 'Postponed' ||
    e.finalStatus === 'Cancelled' ||
    e.finalStatus === 'Postponed'
  ) {
    return false;
  }
  return (
    e.status === 'Function Completed' ||
    e.status === 'Function Completed and Gift Sent' ||
    e.finalStatus === 'Completed' ||
    e.finalStatus === 'Archived'
  );
};

// Helper to check if an enquiry is an active upcoming/current confirmed function (Confirmed Event Revenue)
export const isActiveConfirmedBooking = (e: Enquiry): boolean => {
  if (
    e.status === 'Cancelled' ||
    e.status === 'Postponed' ||
    e.finalStatus === 'Cancelled' ||
    e.finalStatus === 'Postponed'
  ) {
    return false;
  }
  if (isCompletedBooking(e)) {
    return false;
  }
  return (
    e.status === 'Confirmed' ||
    e.status === 'Advance Paid (EXCLUSIVE LOCK)' ||
    e.status === 'Balance Paid' ||
    e.finalStatus === 'Confirmed' ||
    e.finalStatus === 'Exclusive Lock'
  );
};

// Helper to check if an enquiry is considered a confirmed function (Active or Completed)
export const isConfirmedBooking = (e: Enquiry): boolean => {
  return isActiveConfirmedBooking(e) || isCompletedBooking(e);
};

// Parse event calendar date parts strictly from eventDate (Month calendar only, not rolling from today)
export const parseEventCalendar = (dateStr: string) => {
  if (!dateStr) return null;
  const clean = dateStr.split('T')[0];
  const parts = clean.split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10); // 1 - 12
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  const quarter = Math.ceil(month / 3); // 1: Jan-Mar, 2: Apr-Jun, 3: Jul-Sep, 4: Oct-Dec
  return { year, month, day, quarter };
};

export const CALENDAR_MONTHS = [
  { value: 1, name: 'January', short: 'Jan' },
  { value: 2, name: 'February', short: 'Feb' },
  { value: 3, name: 'March', short: 'Mar' },
  { value: 4, name: 'April', short: 'Apr' },
  { value: 5, name: 'May', short: 'May' },
  { value: 6, name: 'June', short: 'Jun' },
  { value: 7, name: 'July', short: 'Jul' },
  { value: 8, name: 'August', short: 'Aug' },
  { value: 9, name: 'September', short: 'Sep' },
  { value: 10, name: 'October', short: 'Oct' },
  { value: 11, name: 'November', short: 'Nov' },
  { value: 12, name: 'December', short: 'Dec' },
];

export const CALENDAR_QUARTERS = [
  { value: 1, label: 'Q1 (Jan – Mar)', short: 'Q1' },
  { value: 2, label: 'Q2 (Apr – Jun)', short: 'Q2' },
  { value: 3, label: 'Q3 (Jul – Sep)', short: 'Q3' },
  { value: 4, label: 'Q4 (Oct – Dec)', short: 'Q4' },
];

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  onSelectEnquiry,
  onNewEnquiry,
  onOpenBEO,
  onEditEnquiry,
  onFilterByStatus,
}) => {
  const { enquiries, venues, currentUser, getRedactedEnquiry } = useBEMS();
  const isCollaborator = currentUser?.role === 'Collaborator';

  // Interactive Enquiry Drawer State
  const [drawerState, setDrawerState] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    filterStage?: PipelineStage | 'ALL';
    filterHallId?: string | 'ALL';
    customFilteredEnquiries?: Enquiry[];
  }>({
    isOpen: false,
    title: '',
  });

  // Global Pipeline Filter (Multi-select dropdown, default to all active except Cancelled)
  const defaultSelectedStages = useMemo(() => {
    return PIPELINE_STAGES.filter(s => s !== 'Cancelled');
  }, []);

  const [selectedStages, setSelectedStages] = useState<PipelineStage[]>(defaultSelectedStages);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Timeframe selector for Popular Halls: '30' | '31-60' | '61-90'
  const [popularHallsTimeframe, setPopularHallsTimeframe] = useState<'30' | '31-60' | '61-90'>('30');

  // Time horizon tab for revenues: '30' | '60' | '90' | '180' | 'all'
  const [revenueHorizon, setRevenueHorizon] = useState<'30' | '60' | '90' | '180' | 'all'>('90');

  // Independent horizon selector for Confirmed Revenue Card: default to 'all' so no confirmed bookings are hidden
  const [confirmedRevenueHorizon, setConfirmedRevenueHorizon] = useState<'30' | '60' | '90' | '180' | 'all'>('all');

  // Modal to inspect full breakdown of all confirmed events and why they are in/out of horizon
  const [showConfirmedBreakdownModal, setShowConfirmedBreakdownModal] = useState(false);

  // Past Revenue Calendar States (Month, Quarter, Year -- Month calendar only, not picking up from Today date)
  const todayObj = new Date();
  const [pastRevenuePeriodType, setPastRevenuePeriodType] = useState<'monthly' | 'quarterly' | 'yearly' | 'all'>('monthly');
  const [selectedPastYear, setSelectedPastYear] = useState<number>(todayObj.getFullYear());
  const [selectedPastMonth, setSelectedPastMonth] = useState<number>(todayObj.getMonth() + 1); // 1-12
  const [selectedPastQuarter, setSelectedPastQuarter] = useState<number>(Math.ceil((todayObj.getMonth() + 1) / 3)); // 1-4
  const [showPastRevenueModal, setShowPastRevenueModal] = useState<boolean>(false);

  // Confirmed Upcoming Functions Filter Options (Default 10 Days)
  const [upcomingTimeframe, setUpcomingTimeframe] = useState<'10' | '7' | '15' | '30' | 'all'>('10');
  const [upcomingVenueFilter, setUpcomingVenueFilter] = useState<string>('ALL');

  // Filtered Enquiries by Global Pipeline Stages
  const filteredEnquiries = useMemo(() => {
    return enquiries.filter(e => selectedStages.includes(e.status));
  }, [enquiries, selectedStages]);

  const toggleStage = (stage: PipelineStage) => {
    if (selectedStages.includes(stage)) {
      if (selectedStages.length === 1) return; // keep at least 1
      setSelectedStages(selectedStages.filter(s => s !== stage));
    } else {
      setSelectedStages([...selectedStages, stage]);
    }
  };

  const selectAllStages = () => setSelectedStages(PIPELINE_STAGES);
  const selectActiveOnly = () => setSelectedStages(PIPELINE_STAGES.filter(s => s !== 'Cancelled' && s !== 'Function Completed and Gift Sent'));

  // 1. Popular Halls Ranking Widget Calculation
  const popularHallsRanked = useMemo(() => {
    const minDays = popularHallsTimeframe === '30' ? 0 : popularHallsTimeframe === '31-60' ? 31 : 61;
    const maxDays = popularHallsTimeframe === '30' ? 30 : popularHallsTimeframe === '31-60' ? 60 : 90;

    const timeframeEnquiries = filteredEnquiries.filter(e =>
      isWithinNextDays(e.eventDate, minDays, maxDays)
    );

    const hallCounts: Record<string, { count: number; totalPax: number; totalValue: number; name: string }> = {};

    venues.forEach(v => {
      hallCounts[v.id] = { count: 0, totalPax: 0, totalValue: 0, name: v.name };
    });

    timeframeEnquiries.forEach(e => {
      if (!hallCounts[e.hallId]) {
        hallCounts[e.hallId] = { count: 0, totalPax: 0, totalValue: 0, name: e.hallName };
      }
      hallCounts[e.hallId].count += 1;
      hallCounts[e.hallId].totalPax += e.expPax || e.gPax || 0;
      hallCounts[e.hallId].totalValue += e.finalBillValue || e.quotedBaseRate || 0;
    });

    return Object.entries(hallCounts)
      .map(([id, data]) => ({ id, ...data }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [filteredEnquiries, venues, popularHallsTimeframe]);

  // 2. Estimated Pipeline Revenue Calculation (Tentative Stages)
  const pipelineRevenue = useMemo(() => {
    const daysMax =
      revenueHorizon === '30'
        ? 30
        : revenueHorizon === '60'
        ? 60
        : revenueHorizon === '90'
        ? 90
        : revenueHorizon === '180'
        ? 180
        : 99999;

    const tentativeEnquiries = enquiries.filter(e => {
      if (isConfirmedBooking(e)) return false;
      if (
        e.status === 'Cancelled' ||
        e.status === 'Postponed' ||
        e.finalStatus === 'Cancelled' ||
        e.finalStatus === 'Postponed'
      ) {
        return false;
      }
      if (revenueHorizon !== 'all' && !isWithinNextDays(e.eventDate, 0, daysMax)) {
        return false;
      }
      return (
        e.status === 'Quote Shared' ||
        e.status === 'Negotiation' ||
        e.status.includes('Tentative') ||
        e.status === 'Food Trial' ||
        e.finalStatus === 'Tentative'
      );
    });

    const totalEstimated = tentativeEnquiries.reduce(
      (sum, e) => sum + getEnquiryTotalRevenue(e),
      0
    );
    const totalExpectedPax = tentativeEnquiries.reduce(
      (sum, e) => sum + (e.expPax || e.gPax || 0),
      0
    );

    return {
      count: tentativeEnquiries.length,
      totalAmount: totalEstimated,
      totalPax: totalExpectedPax,
      tentativeEnquiries,
    };
  }, [enquiries, revenueHorizon]);

  // Available calendar years for past revenue selection
  const availableYears = useMemo(() => {
    const currentY = new Date().getFullYear();
    const yearSet = new Set<number>([currentY, currentY - 1, currentY + 1]);
    enquiries.forEach(e => {
      const c = parseEventCalendar(e.eventDate);
      if (c) yearSet.add(c.year);
    });
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [enquiries]);

  // Past Revenue Calculation: Realized from Completed Functions by Calendar Period (Month calendar only, not from Today)
  const pastRevenueData = useMemo(() => {
    const completedList = enquiries.filter(isCompletedBooking);

    const filtered = completedList.filter(e => {
      const cal = parseEventCalendar(e.eventDate);
      if (!cal) return false;

      if (pastRevenuePeriodType === 'monthly') {
        return cal.year === selectedPastYear && cal.month === selectedPastMonth;
      }
      if (pastRevenuePeriodType === 'quarterly') {
        return cal.year === selectedPastYear && cal.quarter === selectedPastQuarter;
      }
      if (pastRevenuePeriodType === 'yearly') {
        return cal.year === selectedPastYear;
      }
      if (pastRevenuePeriodType === 'all') {
        return true;
      }
      return true;
    });

    const totalAmount = filtered.reduce((acc, curr) => acc + getEnquiryTotalRevenue(curr), 0);
    const totalPax = filtered.reduce((acc, curr) => acc + (curr.gPax || curr.expPax || 0), 0);
    const allCompletedAmount = completedList.reduce((acc, curr) => acc + getEnquiryTotalRevenue(curr), 0);

    return {
      filteredBookings: filtered,
      allCompletedBookings: completedList,
      totalAmount,
      totalPax,
      count: filtered.length,
      allCount: completedList.length,
      allCompletedAmount,
    };
  }, [enquiries, pastRevenuePeriodType, selectedPastYear, selectedPastMonth, selectedPastQuarter]);

  // All active confirmed enquiries across the database (excluding completed functions which reflect in Past Revenue)
  const allActiveConfirmedEnquiries = useMemo(() => {
    return enquiries.filter(isActiveConfirmedBooking);
  }, [enquiries]);

  // 3. Confirmed Revenue Calculation (Active Confirmed, Advance Paid, Balance Paid)
  const confirmedRevenue = useMemo(() => {
    const daysMax =
      confirmedRevenueHorizon === '30'
        ? 30
        : confirmedRevenueHorizon === '60'
        ? 60
        : confirmedRevenueHorizon === '90'
        ? 90
        : confirmedRevenueHorizon === '180'
        ? 180
        : 99999;

    const inHorizonEnquiries = allActiveConfirmedEnquiries.filter(e => {
      if (confirmedRevenueHorizon === 'all') return true;
      return isWithinNextDays(e.eventDate, 0, daysMax);
    });

    const totalConfirmed = inHorizonEnquiries.reduce(
      (sum, e) => sum + getEnquiryTotalRevenue(e),
      0
    );
    const totalPax = inHorizonEnquiries.reduce(
      (sum, e) => sum + (e.gPax || e.expPax || 0),
      0
    );

    return {
      count: inHorizonEnquiries.length,
      totalAmount: totalConfirmed,
      totalPax,
      inHorizonEnquiries,
      allConfirmedCount: allActiveConfirmedEnquiries.length,
    };
  }, [allActiveConfirmedEnquiries, confirmedRevenueHorizon]);

  // 4. Pending Follow-Ups (Follow up date <= Today and event is in future/active)
  // If the FUNCTION IS CONFIRMED or COMPLETED, there needn't be any followup!
  const pendingFollowUps = useMemo(() => {
    return enquiries.filter(e => {
      if (
        isActiveConfirmedBooking(e) ||
        isCompletedBooking(e) ||
        e.status === 'Confirmed' ||
        e.status === 'Advance Paid (EXCLUSIVE LOCK)' ||
        e.status === 'Balance Paid' ||
        e.status === 'Function Completed' ||
        e.status === 'Function Completed and Gift Sent' ||
        e.finalStatus === 'Confirmed' ||
        e.finalStatus === 'Exclusive Lock' ||
        e.finalStatus === 'Completed' ||
        e.finalStatus === 'Archived' ||
        e.status === 'Cancelled' ||
        e.status === 'Postponed' ||
        e.finalStatus === 'Cancelled' ||
        e.finalStatus === 'Postponed'
      ) {
        return false;
      }
      if (e.noFollowUpRequired) return false;

      const f1 = e.followUp1Date && isOverdueOrToday(e.followUp1Date);
      const f2 = e.followUp2Date && isOverdueOrToday(e.followUp2Date);
      const f3 = e.followUp3Date && isOverdueOrToday(e.followUp3Date);

      return f1 || f2 || f3;
    });
  }, [enquiries]);

  // Confirmed Upcoming Functions Data Table (Default 10 Days, with Filter Options)
  const upcomingConfirmedFunctions = useMemo(() => {
    const daysMax =
      upcomingTimeframe === '7'
        ? 7
        : upcomingTimeframe === '10'
        ? 10
        : upcomingTimeframe === '15'
        ? 15
        : upcomingTimeframe === '30'
        ? 30
        : 99999;

    return enquiries
      .filter(e => {
        if (!isConfirmedBooking(e)) return false;

        // Venue filter
        if (upcomingVenueFilter !== 'ALL' && e.hallId !== upcomingVenueFilter) {
          return false;
        }

        // Timeframe filter
        if (upcomingTimeframe === 'all') return true;
        return isWithinNextDays(e.eventDate, 0, daysMax);
      })
      .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
  }, [enquiries, upcomingTimeframe, upcomingVenueFilter]);

  // 6. Enquiry Status & Pax Breakdown
  const statusPaxBreakdown = useMemo(() => {
    const breakdown: Record<PipelineStage, { count: number; totalExpPax: number; totalGPax: number; totalVal: number }> = {} as any;

    PIPELINE_STAGES.forEach(st => {
      breakdown[st] = { count: 0, totalExpPax: 0, totalGPax: 0, totalVal: 0 };
    });

    enquiries.forEach(e => {
      if (breakdown[e.status]) {
        breakdown[e.status].count += 1;
        breakdown[e.status].totalExpPax += e.expPax || 0;
        breakdown[e.status].totalGPax += e.gPax || 0;
        breakdown[e.status].totalVal += e.finalBillValue || e.quotedBaseRate || 0;
      }
    });

    return breakdown;
  }, [enquiries]);

  return (
    <div id="analytics-dashboard" className="space-y-6">
      {/* Top Bar: Global Pipeline Filter & Quick Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white border border-sky-200/80 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-50 border border-sky-200 rounded-xl text-teal-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 tracking-wide">
              Banquet Operations Analytics & Yield Intelligence
            </h2>
            <p className="text-xs text-slate-500">
              Live metrics across The Residency Towers banquet inventory
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto relative">
          {/* Global Pipeline Multi-select Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="px-3.5 py-2 bg-white hover:bg-sky-50 border border-sky-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors shadow-xs"
            >
              <Filter className="w-3.5 h-3.5 text-teal-600" />
              <span>Pipeline Stages ({selectedStages.length}/{PIPELINE_STAGES.length})</span>
            </button>

            {showFilterDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-sky-200 rounded-2xl p-4 shadow-xl z-40 space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-sky-100 text-xs">
                  <span className="font-bold text-slate-800">Filter Status Stages</span>
                  <div className="flex gap-2">
                    <button onClick={selectAllStages} className="text-teal-600 hover:underline text-[11px] font-medium">All</button>
                    <span className="text-slate-300">•</span>
                    <button onClick={selectActiveOnly} className="text-teal-600 hover:underline text-[11px] font-medium">Active</button>
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1.5 text-xs">
                  {PIPELINE_STAGES.map(stage => {
                    const isChecked = selectedStages.includes(stage);
                    return (
                      <label
                        key={stage}
                        className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-sky-50 cursor-pointer text-slate-700"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleStage(stage)}
                          className="rounded accent-teal-600"
                        />
                        <span className="text-[11px] truncate">{stage}</span>
                      </label>
                    );
                  })}
                </div>
                <button
                  onClick={() => setShowFilterDropdown(false)}
                  className="w-full py-1.5 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-bold rounded-lg text-xs shadow-xs"
                >
                  Apply Filter
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onNewEnquiry}
            className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-bold rounded-xl text-xs shadow-md shadow-teal-500/20 hover:from-teal-600 hover:to-cyan-700 transition-all flex items-center gap-1.5 whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>+ Add Enquiry</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Revenue & Pipeline Horizon Cards (4 Strategic Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Widget 1: Estimated Pipeline Revenue */}
        <div
          onClick={() => {
            setDrawerState({
              isOpen: true,
              title: 'Pipeline Revenue (Tentative Quotes)',
              subtitle: `Active enquiries currently in negotiation or tentative stages (${revenueHorizon === 'all' ? 'All dates' : `Next ${revenueHorizon} days`})`,
              customFilteredEnquiries: pipelineRevenue.tentativeEnquiries,
            });
          }}
          className="p-4 bg-white border border-sky-200 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-teal-400 transition-colors cursor-pointer"
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="text-xs font-bold text-teal-700 uppercase tracking-wider block">
                Pipeline Revenue
              </span>
              <p className="text-[10px] text-slate-500">Click to view tentative quotes</p>
            </div>
            {/* Horizon Switcher */}
            <div
              onClick={e => e.stopPropagation()}
              className="flex bg-sky-100 rounded-lg p-0.5 border border-sky-200 text-[10px]"
            >
              {(['30', '60', '90', '180', 'all'] as const).map(h => (
                <button
                  key={h}
                  onClick={() => setRevenueHorizon(h)}
                  className={`px-1.5 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                    revenueHorizon === h ? 'bg-teal-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title={h === 'all' ? 'All active pipeline dates' : `Next ${h} days`}
                >
                  {h === 'all' ? 'All' : `${h}D`}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-2xl font-extrabold text-teal-700 font-mono tracking-tight mb-2">
              {formatINR(pipelineRevenue.totalAmount)}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2.5 border-t border-sky-100">
              <span className="font-semibold text-teal-800">{pipelineRevenue.count} Tentative Quotes</span>
              <span>{formatIndianNumber(pipelineRevenue.totalPax)} Exp. Pax</span>
            </div>
          </div>
        </div>

        {/* Widget 2: Confirmed Event Revenue */}
        <div
          onClick={() => {
            setDrawerState({
              isOpen: true,
              title: 'Confirmed Event Bookings',
              subtitle: `Active confirmed banquet events with advance or balance paid (${confirmedRevenueHorizon === 'all' ? 'All dates' : `Next ${confirmedRevenueHorizon} days`})`,
              customFilteredEnquiries: confirmedRevenue.inHorizonEnquiries,
            });
          }}
          className="p-4 bg-white border border-sky-200 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-emerald-400 transition-all cursor-pointer"
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                  Confirmed Revenue
                </span>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setShowConfirmedBreakdownModal(true);
                  }}
                  className="text-emerald-600 hover:text-emerald-800 p-0.5 rounded hover:bg-emerald-50 transition-colors cursor-pointer"
                  title="View full audit & breakdown of active confirmed bookings"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[10px] text-slate-500">Click to view confirmed events</p>
            </div>

            {/* Independent Horizon Selector for Confirmed Revenue */}
            <div
              onClick={e => e.stopPropagation()}
              className="flex bg-emerald-50 rounded-lg p-0.5 border border-emerald-200 text-[10px]"
            >
              {(['30', '60', '90', '180', 'all'] as const).map(h => (
                <button
                  key={h}
                  onClick={() => setConfirmedRevenueHorizon(h)}
                  className={`px-1.5 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                    confirmedRevenueHorizon === h
                      ? 'bg-emerald-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-emerald-900'
                  }`}
                  title={h === 'all' ? 'All confirmed events (lifetime/all dates)' : `Next ${h} days`}
                >
                  {h === 'all' ? 'All' : `${h}D`}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <div className="text-2xl font-extrabold text-emerald-700 font-mono tracking-tight">
                {formatINR(confirmedRevenue.totalAmount)}
              </div>
              <button
                onClick={e => {
                  e.stopPropagation();
                  setShowConfirmedBreakdownModal(true);
                }}
                className="text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold underline underline-offset-2 flex items-center gap-0.5 cursor-pointer"
              >
                <span>Audit</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2.5 border-t border-sky-100">
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{confirmedRevenue.count} Confirmed</span>
              </span>
              <span>{formatIndianNumber(confirmedRevenue.totalPax)} G.Pax</span>
            </div>
          </div>
        </div>

        {/* Widget 3: Past Revenue (Calendar Month, Quarter, Year) */}
        <div
          onClick={() => {
            setDrawerState({
              isOpen: true,
              title: 'Completed Functions & Realized Revenue',
              subtitle: 'Past banquet events successfully hosted with settled revenue accounts',
              customFilteredEnquiries: pastRevenueData.filteredBookings,
            });
          }}
          className="p-4 bg-white border border-indigo-200/90 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-indigo-400 transition-all cursor-pointer"
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                  Past Revenue
                </span>
                <button
                  onClick={() => setShowPastRevenueModal(true)}
                  className="text-indigo-600 hover:text-indigo-800 p-0.5 rounded hover:bg-indigo-50 transition-colors cursor-pointer"
                  title="View full calendar audit of completed functions"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[10px] text-slate-500">Completed functions (Calendar)</p>
            </div>

            {/* Calendar Period Type Toggle: Month | Quarter | Year | All */}
            <div className="flex bg-indigo-50 rounded-lg p-0.5 border border-indigo-200 text-[10px]">
              {(['monthly', 'quarterly', 'yearly', 'all'] as const).map(pt => (
                <button
                  key={pt}
                  onClick={() => setPastRevenuePeriodType(pt)}
                  className={`px-1.5 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                    pastRevenuePeriodType === pt
                      ? 'bg-indigo-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-indigo-900'
                  }`}
                  title={
                    pt === 'monthly'
                      ? 'Calendar Month (1st to end of month)'
                      : pt === 'quarterly'
                      ? 'Calendar Quarter (Q1, Q2, Q3, Q4)'
                      : pt === 'yearly'
                      ? 'Calendar Year (Jan 1 to Dec 31)'
                      : 'All completed functions'
                  }
                >
                  {pt === 'monthly' ? 'Month' : pt === 'quarterly' ? 'Quarter' : pt === 'yearly' ? 'Year' : 'All'}
                </button>
              ))}
            </div>
          </div>

          {/* Calendar Picker Sub-Bar */}
          <div className="flex items-center justify-between bg-indigo-50/60 px-2 py-1 rounded-lg border border-indigo-100 text-[11px] mb-2 font-medium">
            {pastRevenuePeriodType === 'monthly' && (
              <>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      if (selectedPastMonth === 1) {
                        setSelectedPastMonth(12);
                        setSelectedPastYear(y => y - 1);
                      } else {
                        setSelectedPastMonth(m => m - 1);
                      }
                    }}
                    className="p-0.5 hover:bg-indigo-200/60 rounded text-indigo-700 cursor-pointer"
                    title="Previous Month"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <select
                    value={selectedPastMonth}
                    onChange={e => setSelectedPastMonth(Number(e.target.value))}
                    className="bg-transparent font-bold text-indigo-900 focus:outline-none cursor-pointer text-xs"
                  >
                    {CALENDAR_MONTHS.map(m => (
                      <option key={m.value} value={m.value}>{m.name}</option>
                    ))}
                  </select>
                  <select
                    value={selectedPastYear}
                    onChange={e => setSelectedPastYear(Number(e.target.value))}
                    className="bg-transparent font-bold text-indigo-900 focus:outline-none cursor-pointer text-xs"
                  >
                    {availableYears.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      if (selectedPastMonth === 12) {
                        setSelectedPastMonth(1);
                        setSelectedPastYear(y => y + 1);
                      } else {
                        setSelectedPastMonth(m => m + 1);
                      }
                    }}
                    className="p-0.5 hover:bg-indigo-200/60 rounded text-indigo-700 cursor-pointer"
                    title="Next Month"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <span className="text-[9px] text-indigo-700 bg-white px-1.5 py-0.5 rounded border border-indigo-200 font-semibold">
                  Cal. Month
                </span>
              </>
            )}

            {pastRevenuePeriodType === 'quarterly' && (
              <>
                <div className="flex items-center gap-1.5">
                  <select
                    value={selectedPastQuarter}
                    onChange={e => setSelectedPastQuarter(Number(e.target.value))}
                    className="bg-transparent font-bold text-indigo-900 focus:outline-none cursor-pointer text-xs"
                  >
                    {CALENDAR_QUARTERS.map(q => (
                      <option key={q.value} value={q.value}>{q.short}</option>
                    ))}
                  </select>
                  <select
                    value={selectedPastYear}
                    onChange={e => setSelectedPastYear(Number(e.target.value))}
                    className="bg-transparent font-bold text-indigo-900 focus:outline-none cursor-pointer text-xs"
                  >
                    {availableYears.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <span className="text-[9px] text-indigo-700 bg-white px-1.5 py-0.5 rounded border border-indigo-200 font-semibold">
                  Cal. Quarter
                </span>
              </>
            )}

            {pastRevenuePeriodType === 'yearly' && (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 text-xs">Year:</span>
                  <select
                    value={selectedPastYear}
                    onChange={e => setSelectedPastYear(Number(e.target.value))}
                    className="bg-transparent font-bold text-indigo-900 focus:outline-none cursor-pointer text-xs"
                  >
                    {availableYears.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <span className="text-[9px] text-indigo-700 bg-white px-1.5 py-0.5 rounded border border-indigo-200 font-semibold">
                  Cal. Year
                </span>
              </>
            )}

            {pastRevenuePeriodType === 'all' && (
              <>
                <span className="text-slate-700 font-semibold text-xs">All Completed Events</span>
                <span className="text-[9px] text-indigo-700 bg-white px-1.5 py-0.5 rounded border border-indigo-200 font-semibold">
                  Lifetime
                </span>
              </>
            )}
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <div className="text-2xl font-extrabold text-indigo-700 font-mono tracking-tight">
                {formatINR(pastRevenueData.totalAmount)}
              </div>
              <button
                onClick={() => setShowPastRevenueModal(true)}
                className="text-[11px] text-indigo-700 hover:text-indigo-900 font-semibold underline underline-offset-2 flex items-center gap-0.5 cursor-pointer"
              >
                <span>Audit</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2.5 border-t border-sky-100">
              <span className="text-indigo-700 font-semibold flex items-center gap-1">
                <CheckCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>{pastRevenueData.count} Completed</span>
              </span>
              <span>{formatIndianNumber(pastRevenueData.totalPax)} Pax Hosted</span>
            </div>
          </div>
        </div>

        {/* Widget 4: Pending Follow-Ups Alert Widget */}
        <div
          onClick={() => {
            setDrawerState({
              isOpen: true,
              title: 'Pending & Overdue Follow-Ups',
              subtitle: 'Unconfirmed banquet enquiries requiring prompt client engagement',
              customFilteredEnquiries: pendingFollowUps,
            });
          }}
          className="p-4 bg-white border border-sky-200 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-rose-400 transition-colors cursor-pointer"
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Follow-Ups</span>
              </span>
              <p className="text-[10px] text-slate-500">Unconfirmed pipeline leads</p>
            </div>
            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
              pendingFollowUps.length > 0
                ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              {pendingFollowUps.length} Overdue
            </span>
          </div>

          <div>
            {pendingFollowUps.length === 0 ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                <p className="text-xs text-emerald-700 font-medium">All enquiries follow-ups are up to date</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                {pendingFollowUps.slice(0, 3).map(pe => (
                  <div
                    key={pe.id}
                    onClick={() => onSelectEnquiry(pe)}
                    className="p-1.5 bg-sky-50/60 hover:bg-sky-100 border border-sky-200 hover:border-teal-400 rounded-xl text-xs flex justify-between items-center cursor-pointer transition-colors"
                  >
                    <div>
                      <strong className="text-slate-800 block truncate text-xs">{pe.guestName}</strong>
                      <span className="text-[10px] text-slate-500">{pe.hallName} • Ref #{pe.refNo}</span>
                    </div>
                    <span className="text-[10px] font-mono text-rose-700 font-bold bg-rose-100 px-1.5 py-0.5 rounded">
                      Due
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Middle Grid: Popular Halls Ranking & Enquiry Status / Pax Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Popular Halls Ranked List */}
        <div className="lg:col-span-6 p-5 bg-white border border-sky-200 rounded-2xl shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-sky-100">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Popular Halls & Venue Utilization Ranking
              </h3>
            </div>

            {/* Timeframe Switcher: Next 30 Days, Next 31 to 60 Days, Next 61 to 90 Days */}
            <div className="flex bg-sky-100 rounded-xl p-1 border border-sky-200 text-xs">
              <button
                onClick={() => setPopularHallsTimeframe('30')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  popularHallsTimeframe === '30'
                    ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Next 30 Days
              </button>
              <button
                onClick={() => setPopularHallsTimeframe('31-60')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  popularHallsTimeframe === '31-60'
                    ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                31 - 60 Days
              </button>
              <button
                onClick={() => setPopularHallsTimeframe('61-90')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  popularHallsTimeframe === '61-90'
                    ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                61 - 90 Days
              </button>
            </div>
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {popularHallsRanked.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs bg-sky-50/40 rounded-xl border border-sky-100">
                No banquet bookings recorded for the selected timeframe.
              </div>
            ) : (
              popularHallsRanked.map((hall, idx) => {
                const maxCount = popularHallsRanked[0]?.count || 1;
                const percent = Math.round((hall.count / maxCount) * 100);

                return (
                  <div
                    key={hall.id}
                    onClick={() => {
                      setDrawerState({
                        isOpen: true,
                        title: `${hall.name} - Banquet Bookings`,
                        subtitle: `Bookings and hall utilization records for ${hall.name}`,
                        filterHallId: hall.id,
                      });
                    }}
                    className="p-3 bg-sky-50/50 border border-sky-200 rounded-xl hover:border-teal-400 hover:bg-teal-50/40 transition-all cursor-pointer group"
                    title={`Click to inspect all bookings for ${hall.name}`}
                  >
                    <div className="flex justify-between items-center mb-1.5 text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            idx === 0
                              ? 'bg-gradient-to-r from-teal-500 to-cyan-600'
                              : idx === 1
                              ? 'bg-cyan-500'
                              : 'bg-sky-400'
                          }`}
                        />
                        <span className="font-bold text-slate-800">{hall.name}</span>
                      </div>
                      <div className="flex items-center gap-3 font-mono">
                        <span className="text-teal-700 font-bold">{hall.count} Booking(s)</span>
                        <span className="text-slate-500 text-[11px]">{formatIndianNumber(hall.totalPax)} Pax</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-sky-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-teal-500 to-cyan-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Enquiry Status & Pax Breakdown */}
        <div className="lg:col-span-6 p-5 bg-white border border-sky-200 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-sky-100">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Enquiry Status & Pax Breakdown
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Total: {enquiries.length} Enquiries
            </span>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1 text-xs">
            {PIPELINE_STAGES.map(st => {
              const data = statusPaxBreakdown[st] || { count: 0, totalExpPax: 0, totalGPax: 0, totalVal: 0 };
              if (data.count === 0 && (st === 'Postponed' || st === 'Cancelled')) {
                return null;
              }

              return (
                <div
                  key={st}
                  onClick={() => {
                    setDrawerState({
                      isOpen: true,
                      title: `${st === 'Advance Paid (EXCLUSIVE LOCK)' ? 'Advance Paid and Event Confirmed' : st} Enquiries`,
                      subtitle: `All enquiries currently at milestone: ${st}`,
                      filterStage: st as PipelineStage,
                    });
                  }}
                  className="p-2.5 bg-sky-50/50 hover:bg-teal-50/70 border border-sky-200 hover:border-teal-400 rounded-xl flex items-center justify-between transition-all cursor-pointer group"
                  title={`Click to inspect all "${st === 'Advance Paid (EXCLUSIVE LOCK)' ? 'Advance Paid and Event Confirmed' : st}" enquiries in the interactive drawer`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0 group-hover:scale-125 transition-transform" />
                    <span className="font-semibold text-slate-700 group-hover:text-teal-900 truncate">
                      {st === 'Advance Paid (EXCLUSIVE LOCK)' ? 'Advance Paid and Event Confirmed' : st}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 font-mono">
                    <span className="px-2 py-0.5 rounded bg-white border border-sky-200 text-teal-700 font-bold text-[11px] group-hover:border-teal-300">
                      {data.count} Enq
                    </span>
                    <span className="text-slate-500 text-[11px] w-16 text-right">
                      {formatIndianNumber(data.totalExpPax)} Pax
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Upcoming Functions Data Table */}
      <div className="p-5 bg-white border border-sky-200 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-sky-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Confirmed Upcoming Functions
            </h3>
            <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              {upcomingConfirmedFunctions.length} Scheduled
            </span>
          </div>

          {/* Filter Options */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Horizon Filter */}
            <div className="flex items-center gap-1 bg-sky-50 border border-sky-200 rounded-xl p-1">
              <span className="text-[10px] font-bold text-slate-500 px-1.5 uppercase">Horizon:</span>
              {(
                [
                  { id: '10', label: '10 Days' },
                  { id: '7', label: '7 Days' },
                  { id: '15', label: '15 Days' },
                  { id: '30', label: '30 Days' },
                  { id: 'all', label: 'All Upcoming' },
                ] as const
              ).map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setUpcomingTimeframe(opt.id)}
                  className={`px-2 py-1 rounded-lg font-medium transition-all ${
                    upcomingTimeframe === opt.id
                      ? 'bg-emerald-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-sky-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Venue Filter Dropdown */}
            <div className="flex items-center gap-1.5">
              <select
                value={upcomingVenueFilter}
                onChange={e => setUpcomingVenueFilter(e.target.value)}
                className="p-1.5 bg-white border border-sky-200 rounded-xl text-slate-700 text-xs focus:outline-none focus:border-teal-500"
              >
                <option value="ALL">All Venues & Halls</option>
                {venues.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {upcomingConfirmedFunctions.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs bg-sky-50/40 rounded-xl border border-sky-100">
            No confirmed banquet functions scheduled in the upcoming 10 days horizon.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-sky-200 bg-sky-50/90 text-slate-700 font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Ref No</th>
                  <th className="py-2.5 px-3">Client / Host Name</th>
                  <th className="py-2.5 px-3">Hall / Venue</th>
                  <th className="py-2.5 px-3">Event Date & Time</th>
                  <th className="py-2.5 px-3">Contact Number</th>
                  <th className="py-2.5 px-3 text-right">Guaranteed Pax</th>
                  <th className="py-2.5 px-3 text-center">Payment Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-100">
                {upcomingConfirmedFunctions.map(fn => {
                  const daysLeft = getDaysRemaining(fn.eventDate);
                  const isBalanceSettled = fn.status === 'Confirmed' || fn.status === 'Balance Paid' || fn.finalStatus === 'Confirmed';

                  return (
                    <tr
                      key={fn.id}
                      className="hover:bg-sky-50/60 transition-colors"
                    >
                      <td className="py-3 px-3 font-mono font-bold text-teal-700">
                        {fn.refNo}
                      </td>
                      <td className="py-3 px-3">
                        <strong className="text-slate-800 block">{fn.guestName}</strong>
                        <span className="text-[11px] text-slate-500 truncate block">{fn.companyName}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-700 font-medium">
                        {fn.hallName}
                        <span className="block text-[10px] text-slate-400">{fn.seatingArrangement}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-slate-800 font-mono font-bold block">{formatDisplayDate(fn.eventDate)}</span>
                        <span className="text-[10px] text-teal-700 font-mono font-medium">{fn.session} ({daysLeft === 0 ? 'Today' : `in ${daysLeft} days`})</span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700">
                        {isCollaborator ? (
                          <span className="text-slate-400 italic">Redacted (SS)</span>
                        ) : (
                          fn.guestMobileMain || '—'
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                        {formatIndianNumber(fn.gPax)} Pax
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          isBalanceSettled
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-teal-50 text-teal-700 border border-teal-200'
                        }`}>
                          {fn.status === 'Confirmed' ? '✓ Confirmed' : isBalanceSettled ? '✓ Balance Paid' : '⚡ Advance Only'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => onSelectEnquiry(fn)}
                          className="px-3 py-1 bg-sky-50 hover:bg-sky-100 text-teal-700 border border-sky-200 rounded-lg font-semibold transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Confirmed Revenue Breakdown & Audit Modal */}
      {showConfirmedBreakdownModal && (
        <div
          id="confirmed-revenue-breakdown-modal"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-emerald-200 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-sky-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-800">
                      Confirmed Event Revenue Audit & Breakdown
                    </h2>
                    <span className="text-xs bg-emerald-100 text-emerald-800 font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                      {confirmedRevenue.count} in view / {confirmedRevenue.allConfirmedCount} total
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Transparent accounting of all advance-paid, balance-paid, and locked contract revenues
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowConfirmedBreakdownModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Controls & Quick Summary */}
            <div className="p-5 border-b border-sky-100 bg-sky-50/30 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Horizon Switcher Tabs */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider mr-1">
                    Event Date Horizon:
                  </span>
                  {(
                    [
                      { id: 'all', label: 'All Dates (Lifetime)' },
                      { id: '180', label: 'Next 180 Days' },
                      { id: '90', label: 'Next 90 Days' },
                      { id: '60', label: 'Next 60 Days' },
                      { id: '30', label: 'Next 30 Days' },
                    ] as const
                  ).map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setConfirmedRevenueHorizon(tab.id)}
                      className={`px-3 py-1.5 rounded-xl font-medium text-xs transition-all cursor-pointer ${
                        confirmedRevenueHorizon === tab.id
                          ? 'bg-emerald-600 text-white font-bold shadow-xs'
                          : 'bg-white border border-sky-200 text-slate-600 hover:bg-sky-100'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Total Stats in Window */}
                <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl border border-emerald-200 text-right">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Revenue in Selected Window
                    </span>
                    <span className="text-lg font-mono font-extrabold text-emerald-700">
                      {formatINR(confirmedRevenue.totalAmount)}
                    </span>
                  </div>
                  <div className="border-l border-sky-200 pl-4">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Guaranteed Pax
                    </span>
                    <span className="text-sm font-mono font-bold text-slate-700">
                      {formatIndianNumber(confirmedRevenue.totalPax)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Explanatory Help Notice & Past Revenue Switcher */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-600 bg-emerald-50/70 p-3 rounded-xl border border-emerald-200/60">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Confirmed vs. Past Revenue:</strong> This card tracks active upcoming/locked bookings. Once a function is completed, it reflects under <strong>Past Revenue</strong>. To view functions occurring beyond 30 days, select <strong>All Dates (Lifetime)</strong>.
                  </span>
                </div>
                <button
                  onClick={() => {
                    setShowConfirmedBreakdownModal(false);
                    setShowPastRevenueModal(true);
                  }}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs transition-colors shrink-0 cursor-pointer flex items-center gap-1"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>View Past Revenue Audit</span>
                </button>
              </div>
            </div>

            {/* Bookings Table */}
            <div className="flex-1 overflow-y-auto p-5">
              {allActiveConfirmedEnquiries.length === 0 ? (
                <div className="text-center py-12 text-slate-400 bg-sky-50/40 rounded-xl border border-sky-100">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-sm text-slate-600">No active confirmed bookings found in the database.</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Bookings in 'Confirmed', 'Advance Paid (Exclusive Lock)', or 'Balance Paid' stages will appear here. Completed functions appear in Past Revenue.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-sky-200 bg-sky-50/90 text-slate-700 font-bold uppercase tracking-wider">
                      <th className="py-2.5 px-3">Ref No</th>
                      <th className="py-2.5 px-3">Client / Host</th>
                      <th className="py-2.5 px-3">Hall / Venue</th>
                      <th className="py-2.5 px-3">Event Date</th>
                      <th className="py-2.5 px-3 text-right">Guaranteed Pax</th>
                      <th className="py-2.5 px-3 text-right">Total Revenue</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-center">In Current Horizon?</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sky-100">
                    {allActiveConfirmedEnquiries.map(enq => {
                      const billVal = getEnquiryTotalRevenue(enq);
                      const isExclusiveLock =
                        enq.status === 'Advance Paid (EXCLUSIVE LOCK)' || enq.finalStatus === 'Exclusive Lock';
                      const isBalancePaid = enq.status === 'Balance Paid';

                      // Check if in active horizon
                      const daysMax =
                        confirmedRevenueHorizon === '30'
                          ? 30
                          : confirmedRevenueHorizon === '60'
                          ? 60
                          : confirmedRevenueHorizon === '90'
                          ? 90
                          : confirmedRevenueHorizon === '180'
                          ? 180
                          : 99999;
                      const inHorizon =
                        confirmedRevenueHorizon === 'all' || isWithinNextDays(enq.eventDate, 0, daysMax);

                      // Calculate days difference
                      const parts = enq.eventDate.split('T')[0].split('-');
                      const target = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      target.setHours(0, 0, 0, 0);
                      const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                      return (
                        <tr
                          key={enq.id}
                          className={`hover:bg-sky-50/60 transition-colors ${
                            inHorizon ? 'bg-white' : 'bg-slate-50/50 opacity-70'
                          }`}
                        >
                          <td className="py-3 px-3 font-mono font-bold text-teal-700 whitespace-nowrap">
                            {enq.refNo}
                          </td>
                          <td className="py-3 px-3">
                            <strong className="text-slate-800 block">{enq.guestName}</strong>
                            {enq.companyName && (
                              <span className="text-[11px] text-slate-500 block truncate">{enq.companyName}</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-slate-800 font-medium block">{enq.hallName}</span>
                            <span className="text-[11px] text-teal-700 font-mono font-medium">{enq.session}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-slate-800 font-mono font-semibold block">
                              {formatDisplayDate(enq.eventDate)}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {diffDays === 0
                                ? 'Today'
                                : diffDays > 0
                                ? `In ${diffDays} day(s)`
                                : `${Math.abs(diffDays)} day(s) ago`}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-medium text-slate-700">
                            {formatIndianNumber(enq.gPax || enq.expPax || 0)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                            {formatINR(billVal)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] whitespace-nowrap ${
                                isExclusiveLock
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : isBalancePaid
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-teal-50 text-teal-700 border border-teal-200'
                              }`}
                            >
                              {isExclusiveLock && <Lock className="w-3 h-3" />}
                              {isBalancePaid && <CheckCircle2 className="w-3 h-3" />}
                              <span>{enq.status}</span>
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            {inHorizon ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Counted in Card</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                <span>Outside {confirmedRevenueHorizon}D Window</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <button
                              onClick={() => {
                                setShowConfirmedBreakdownModal(false);
                                onSelectEnquiry(enq);
                              }}
                              className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-teal-700 border border-sky-200 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-sky-100 bg-sky-50/40 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Tip: Click <strong>All Dates (Lifetime)</strong> to include every confirmed function regardless of date.
              </div>
              <button
                onClick={() => setShowConfirmedBreakdownModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Past Revenue Audit & Calendar Breakdown Modal */}
      {showPastRevenueModal && (
        <div
          id="past-revenue-breakdown-modal"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-indigo-200 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-indigo-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 via-purple-50 to-sky-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-800">
                      Past Revenue Audit & Calendar Breakdown
                    </h2>
                    <span className="text-xs bg-indigo-100 text-indigo-800 font-mono font-bold px-2.5 py-0.5 rounded-full border border-indigo-300">
                      {pastRevenueData.count} in Period / {pastRevenueData.allCount} Total Completed
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Realized earnings from completed functions filtered by calendar month, quarter, or year (not rolling from today)
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowPastRevenueModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Period Controls & Quick Summary */}
            <div className="p-5 border-b border-indigo-100 bg-indigo-50/20 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Period Mode Selector Tabs */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider mr-1">
                    Calendar Period:
                  </span>
                  {(
                    [
                      { id: 'monthly', label: 'Monthly Calendar' },
                      { id: 'quarterly', label: 'Quarterly Calendar' },
                      { id: 'yearly', label: 'Yearly Calendar' },
                      { id: 'all', label: 'All Completed (Lifetime)' },
                    ] as const
                  ).map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setPastRevenuePeriodType(tab.id)}
                      className={`px-3 py-1.5 rounded-xl font-medium text-xs transition-all cursor-pointer ${
                        pastRevenuePeriodType === tab.id
                          ? 'bg-indigo-600 text-white font-bold shadow-xs'
                          : 'bg-white border border-sky-200 text-slate-600 hover:bg-sky-50'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Direct Dropdown Calendar Selectors */}
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-indigo-200 shadow-xs">
                  <CalendarDays className="w-4 h-4 text-indigo-600" />
                  {pastRevenuePeriodType === 'monthly' && (
                    <div className="flex items-center gap-1.5 text-xs font-medium">
                      <span className="text-slate-500">Month:</span>
                      <select
                        value={selectedPastMonth}
                        onChange={e => setSelectedPastMonth(Number(e.target.value))}
                        className="bg-indigo-50 font-bold text-indigo-900 rounded-lg px-2 py-1 border border-indigo-200 cursor-pointer"
                      >
                        {CALENDAR_MONTHS.map(m => (
                          <option key={m.value} value={m.value}>{m.name}</option>
                        ))}
                      </select>
                      <select
                        value={selectedPastYear}
                        onChange={e => setSelectedPastYear(Number(e.target.value))}
                        className="bg-indigo-50 font-bold text-indigo-900 rounded-lg px-2 py-1 border border-indigo-200 cursor-pointer"
                      >
                        {availableYears.map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {pastRevenuePeriodType === 'quarterly' && (
                    <div className="flex items-center gap-1.5 text-xs font-medium">
                      <span className="text-slate-500">Quarter:</span>
                      <select
                        value={selectedPastQuarter}
                        onChange={e => setSelectedPastQuarter(Number(e.target.value))}
                        className="bg-indigo-50 font-bold text-indigo-900 rounded-lg px-2 py-1 border border-indigo-200 cursor-pointer"
                      >
                        {CALENDAR_QUARTERS.map(q => (
                          <option key={q.value} value={q.value}>{q.label}</option>
                        ))}
                      </select>
                      <select
                        value={selectedPastYear}
                        onChange={e => setSelectedPastYear(Number(e.target.value))}
                        className="bg-indigo-50 font-bold text-indigo-900 rounded-lg px-2 py-1 border border-indigo-200 cursor-pointer"
                      >
                        {availableYears.map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {pastRevenuePeriodType === 'yearly' && (
                    <div className="flex items-center gap-1.5 text-xs font-medium">
                      <span className="text-slate-500">Year:</span>
                      <select
                        value={selectedPastYear}
                        onChange={e => setSelectedPastYear(Number(e.target.value))}
                        className="bg-indigo-50 font-bold text-indigo-900 rounded-lg px-2 py-1 border border-indigo-200 cursor-pointer"
                      >
                        {availableYears.map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {pastRevenuePeriodType === 'all' && (
                    <span className="text-xs text-indigo-800 font-semibold px-2 py-1">
                      Lifetime Realized Accounting
                    </span>
                  )}
                </div>
              </div>

              {/* 4 Summary Metric Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Realized Past Revenue
                  </span>
                  <span className="text-lg font-mono font-extrabold text-indigo-700 block mt-0.5">
                    {formatINR(pastRevenueData.totalAmount)}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Completed Functions
                  </span>
                  <span className="text-lg font-mono font-bold text-slate-800 block mt-0.5">
                    {pastRevenueData.count} Events
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Total Pax Hosted
                  </span>
                  <span className="text-lg font-mono font-bold text-slate-800 block mt-0.5">
                    {formatIndianNumber(pastRevenueData.totalPax)} Guests
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Avg Yield / Function
                  </span>
                  <span className="text-lg font-mono font-bold text-indigo-900 block mt-0.5">
                    {formatINR(pastRevenueData.count > 0 ? Math.round(pastRevenueData.totalAmount / pastRevenueData.count) : 0)}
                  </span>
                </div>
              </div>

              {/* Calendar Logic Explanatory Notice */}
              <div className="flex items-start gap-2 text-xs text-slate-600 bg-indigo-50/70 p-3 rounded-xl border border-indigo-200/60">
                <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Calendar Month / Accounting Period Logic:</strong> Completed functions are reconciled strictly by event date calendar month, quarter, or year. Unlike pipeline cards which count rolling days from today, this ensures strict alignment with hotel accounting statements and tax periods.
                </span>
              </div>
            </div>

            {/* Completed Functions Table */}
            <div className="flex-1 overflow-y-auto p-5">
              {pastRevenueData.filteredBookings.length === 0 ? (
                <div className="text-center py-12 text-slate-400 bg-indigo-50/30 rounded-xl border border-indigo-100">
                  <History className="w-8 h-8 mx-auto mb-2 text-indigo-300" />
                  <p className="font-semibold text-sm text-slate-700">
                    No completed functions found for this selected calendar period.
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {pastRevenueData.allCount > 0
                      ? `There are ${pastRevenueData.allCount} completed functions in other periods (${formatINR(pastRevenueData.allCompletedAmount)} total). Switch the month/year or select "All Completed" to inspect them.`
                      : "Once an event's pipeline stage is updated to 'Function Completed' or 'Function Completed and Gift Sent', it will appear here."}
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-indigo-200 bg-indigo-50/80 text-slate-700 font-bold uppercase tracking-wider">
                      <th className="py-2.5 px-3">Ref No</th>
                      <th className="py-2.5 px-3">Client / Host</th>
                      <th className="py-2.5 px-3">Hall & Session</th>
                      <th className="py-2.5 px-3">Event Date</th>
                      <th className="py-2.5 px-3 text-right">Pax Hosted</th>
                      <th className="py-2.5 px-3 text-right">Realized Revenue</th>
                      <th className="py-2.5 px-3 text-center">Settlement</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-indigo-100">
                    {pastRevenueData.filteredBookings.map(enq => {
                      const billVal = getEnquiryTotalRevenue(enq);
                      const cal = parseEventCalendar(enq.eventDate);

                      return (
                        <tr
                          key={enq.id}
                          className="hover:bg-indigo-50/50 bg-white transition-colors"
                        >
                          <td className="py-3 px-3 font-mono font-bold text-indigo-700 whitespace-nowrap">
                            {enq.refNo}
                          </td>
                          <td className="py-3 px-3">
                            <strong className="text-slate-800 block">{enq.guestName}</strong>
                            {enq.companyName && (
                              <span className="text-[11px] text-slate-500 block truncate">{enq.companyName}</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-slate-800 font-medium block">{enq.hallName}</span>
                            <span className="text-[11px] text-indigo-700 font-mono font-medium">{enq.session}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-slate-800 font-mono font-semibold block">
                              {formatDisplayDate(enq.eventDate)}
                            </span>
                            {cal && (
                              <span className="text-[10px] font-mono text-slate-400">
                                {CALENDAR_MONTHS[cal.month - 1]?.short} {cal.year} • Q{cal.quarter}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-medium text-slate-700">
                            {formatIndianNumber(enq.gPax || enq.expPax || 0)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-indigo-700">
                            {formatINR(billVal)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200">
                              <CheckCheck className="w-3 h-3 text-indigo-600" />
                              <span>{enq.status}</span>
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <button
                              onClick={() => {
                                setShowPastRevenueModal(false);
                                onSelectEnquiry(enq);
                              }}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-indigo-100 bg-indigo-50/40 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-600">
                Lifetime Realized Revenue across all {pastRevenueData.allCount} completed functions:{' '}
                <strong className="text-indigo-800 font-mono">{formatINR(pastRevenueData.allCompletedAmount)}</strong>
              </div>
              <button
                onClick={() => setShowPastRevenueModal(false)}
                className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Enquiries Drawer (Click-through from any KPI, Funnel, or Hall rank) */}
      <AnalyticsEnquiriesDrawer
        isOpen={drawerState.isOpen}
        onClose={() => setDrawerState(prev => ({ ...prev, isOpen: false }))}
        title={drawerState.title}
        subtitle={drawerState.subtitle}
        filterStage={drawerState.filterStage}
        filterHallId={drawerState.filterHallId}
        customFilteredEnquiries={drawerState.customFilteredEnquiries}
        onSelectEnquiry={onSelectEnquiry}
        onOpenBEO={enq => onOpenBEO?.(enq)}
        onEditEnquiry={onEditEnquiry}
      />
    </div>
  );
};

import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { useBEMS } from '../context/BEMSContext';
import { Enquiry, VenueHall } from '../types';
import { STATUS_CONFIG } from './HallAvailabilityMatrix';
import { parseSessionTimeSlot, formatDisplayDate, formatIndianNumber } from '../utils/formatters';
import { downloadMultiSheetSpreadsheet } from '../utils/spreadsheetExport';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Search,
  X,
  Filter,
  Users,
  Download,
  FileSpreadsheet,
  Layers,
  Sparkles,
  ArrowRight,
  Info,
  CheckCircle2,
} from 'lucide-react';

interface HallAvailabilityWeekChartProps {
  currentDateStr: string; // YYYY-MM-DD
  onSelectSlot: (hallId: string, date: string, session: string) => void;
  onSelectEnquiry: (enquiry: Enquiry) => void;
  onJumpToDay: (dateStr: string) => void;
  hallFilter: string;
  setHallFilter: (hallId: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

interface WeekTimelineBooking {
  enquiry: Enquiry;
  hallId: string;
  hallName: string;
  eventDate: string;
  startTime: Date;
  endTime: Date;
  durationHours: number;
  formattedTime: string;
  status: string;
  isExclusiveLock: boolean;
  isConfirmed: boolean;
}

export const HallAvailabilityWeekChart: React.FC<HallAvailabilityWeekChartProps> = ({
  currentDateStr,
  onSelectSlot,
  onSelectEnquiry,
  onJumpToDay,
  hallFilter,
  setHallFilter,
  statusFilter,
  setStatusFilter,
  searchQuery,
  setSearchQuery,
}) => {
  const { venues, enquiries, auditLogs } = useBEMS();

  // Internal week reference date (defaults to passed date or current date)
  const [activeDate, setActiveDate] = useState<Date>(() => {
    const parts = currentDateStr.split('-');
    if (parts.length === 3) {
      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
    return new Date();
  });

  // Hovered booking for floating tooltip
  const [hoveredBooking, setHoveredBooking] = useState<{
    booking: WeekTimelineBooking;
    x: number;
    y: number;
  } | null>(null);

  // Container & SVG ref for responsive width
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(1020);

  // Resize observer to ensure responsive width
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(Math.max(entry.contentRect.width, 760));
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Compute Monday (00:00:00) and Sunday (23:59:59) for the selected week
  const { weekStart, weekEnd, daysOfWeek, weekNumber } = useMemo(() => {
    const d = new Date(activeDate);
    const day = d.getDay(); // 0 is Sunday, 1 is Monday...
    const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
    
    const monday = new Date(d.getFullYear(), d.getMonth(), diffToMonday, 0, 0, 0, 0);
    const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6, 23, 59, 59, 999);

    // Build 7 consecutive days array
    const days: { date: Date; dateStr: string; dayName: string; dayNumber: number; isToday: boolean }[] = [];
    const todayStr = new Date().toISOString().split('T')[0];

    for (let i = 0; i < 7; i++) {
      const cur = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i, 12, 0, 0);
      const yyyy = cur.getFullYear();
      const mm = (cur.getMonth() + 1).toString().padStart(2, '0');
      const dd = cur.getDate().toString().padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const dayName = cur.toLocaleDateString('en-US', { weekday: 'short' });
      days.push({
        date: cur,
        dateStr,
        dayName,
        dayNumber: cur.getDate(),
        isToday: dateStr === todayStr,
      });
    }

    // Week number (ISO)
    const firstJan = new Date(monday.getFullYear(), 0, 1);
    const numberOfDays = Math.floor((monday.getTime() - firstJan.getTime()) / (24 * 60 * 60 * 1000));
    const wNum = Math.ceil((numberOfDays + firstJan.getDay() + 1) / 7);

    return { weekStart: monday, weekEnd: sunday, daysOfWeek: days, weekNumber: wNum };
  }, [activeDate]);

  // Active Halls
  const activeHalls = useMemo(() => {
    const active = venues.filter(v => v.status === 'Active');
    if (hallFilter === 'ALL') return active;
    return active.filter(v => v.id === hallFilter);
  }, [venues, hallFilter]);

  // Shift week by offset (-1 for prev, +1 for next)
  const handleShiftWeek = (offsetWeeks: number) => {
    setActiveDate(prev => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + offsetWeeks * 7);
      return next;
    });
  };

  // Jump to Current Week (today)
  const handleJumpToCurrentWeek = () => {
    setActiveDate(new Date());
  };

  // Parse bookings for this week
  const weekBookings: WeekTimelineBooking[] = useMemo(() => {
    const list: WeekTimelineBooking[] = [];
    const weekStartMs = weekStart.getTime();
    const weekEndMs = weekEnd.getTime();

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

      // Search Query
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

      // Event Date checking
      const [year, month, day] = e.eventDate.split('-').map(Number);
      if (!year || !month || !day) return;

      const { startMinutes, endMinutes, formatted } = parseSessionTimeSlot(e.session);

      const start = new Date(year, month - 1, day, Math.floor(startMinutes / 60), startMinutes % 60, 0);
      const end = new Date(year, month - 1, day, Math.floor(endMinutes / 60), endMinutes % 60, 0);

      // Check if within week range
      if (end.getTime() >= weekStartMs && start.getTime() <= weekEndMs) {
        const durationHours = Math.max(0.5, (end.getTime() - start.getTime()) / (1000 * 60 * 60));
        const isExclusiveLock =
          e.status === 'Advance Paid (EXCLUSIVE LOCK)' || e.finalStatus === 'Exclusive Lock';
        const isConfirmed =
          e.status === 'Confirmed' ||
          e.status === 'Balance Paid' ||
          e.finalStatus === 'Confirmed' ||
          e.finalStatus === 'Completed';

        list.push({
          enquiry: e,
          hallId: e.hallId,
          hallName: e.hallName,
          eventDate: e.eventDate,
          startTime: start,
          endTime: end,
          durationHours,
          formattedTime: formatted,
          status: e.status,
          isExclusiveLock,
          isConfirmed,
        });
      }
    });

    return list;
  }, [enquiries, weekStart, weekEnd, hallFilter, statusFilter, searchQuery]);

  // Weekly Statistics Summary
  const weekStats = useMemo(() => {
    let totalEvents = weekBookings.length;
    let lockedCount = 0;
    let confirmedCount = 0;
    let tentativeCount = 0;
    let totalHours = 0;
    let totalPax = 0;
    const hallHoursMap = new Map<string, number>();

    weekBookings.forEach(b => {
      totalHours += b.durationHours;
      totalPax += b.enquiry.gPax || b.enquiry.expPax || 0;
      if (b.isExclusiveLock) lockedCount++;
      else if (b.isConfirmed) confirmedCount++;
      else tentativeCount++;

      const prev = hallHoursMap.get(b.hallName) || 0;
      hallHoursMap.set(b.hallName, prev + b.durationHours);
    });

    let topHall = 'None';
    let maxHours = 0;
    hallHoursMap.forEach((hrs, hName) => {
      if (hrs > maxHours) {
        maxHours = hrs;
        topHall = hName;
      }
    });

    // Total available hall hours = activeHalls.length * 7 * 16 (assuming 16 operational hours per day)
    const availableCapacityHours = Math.max(1, activeHalls.length * 7 * 16);
    const occupancyRate = Math.min(100, Math.round((totalHours / availableCapacityHours) * 100));

    return {
      totalEvents,
      lockedCount,
      confirmedCount,
      tentativeCount,
      totalHours: Math.round(totalHours * 10) / 10,
      totalPax,
      topHall: topHall !== 'None' ? `${topHall} (${Math.round(maxHours)}h)` : 'None',
      occupancyRate,
    };
  }, [weekBookings, activeHalls]);

  // Render D3 SVG Chart
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous drawing

    // Chart Dimensions
    const margin = { top: 46, right: 24, bottom: 20, left: 168 };
    const rowHeight = 64;
    const chartWidth = Math.max(containerWidth, 800);
    const chartHeight = margin.top + margin.bottom + activeHalls.length * rowHeight;

    svg
      .attr('width', chartWidth)
      .attr('height', chartHeight)
      .attr('viewBox', `0 0 ${chartWidth} ${chartHeight}`);

    // Definitions (Clip paths, shadows)
    const defs = svg.append('defs');

    // Subtle drop shadow filter for bars
    const filter = defs.append('filter')
      .attr('id', 'd3-bar-shadow')
      .attr('x', '-5%')
      .attr('y', '-10%')
      .attr('width', '110%')
      .attr('height', '130%');
    filter.append('feDropShadow')
      .attr('dx', '0')
      .attr('dy', '1.5')
      .attr('stdDeviation', '1.5')
      .attr('flood-opacity', '0.12');

    // Clip path for main chart area
    defs.append('clipPath')
      .attr('id', 'chart-area-clip')
      .append('rect')
      .attr('x', margin.left)
      .attr('y', margin.top)
      .attr('width', chartWidth - margin.left - margin.right)
      .attr('height', activeHalls.length * rowHeight);

    // Scales
    const xScale = d3.scaleTime()
      .domain([weekStart, weekEnd])
      .range([margin.left, chartWidth - margin.right]);

    const yScale = d3.scaleBand()
      .domain(activeHalls.map(h => h.id))
      .range([margin.top, margin.top + activeHalls.length * rowHeight])
      .paddingInner(0.12);

    const mainGroup = svg.append('g').attr('class', 'chart-content');

    // 1. Background Alternating Stripes for Hall Rows
    activeHalls.forEach((hall, idx) => {
      const y = yScale(hall.id) || 0;
      const h = yScale.bandwidth();

      mainGroup.append('rect')
        .attr('x', margin.left)
        .attr('y', y)
        .attr('width', chartWidth - margin.left - margin.right)
        .attr('height', h)
        .attr('fill', idx % 2 === 0 ? '#f8fafc' : '#ffffff')
        .attr('stroke', '#e2e8f0')
        .attr('stroke-width', 0.6)
        .attr('rx', 4);
    });

    // 2. Vertical Day Division Columns & Midday (12:00) Guidelines
    daysOfWeek.forEach((dayInfo, idx) => {
      const dayStart = new Date(dayInfo.date);
      dayStart.setHours(0, 0, 0, 0);
      const dayNoon = new Date(dayInfo.date);
      dayNoon.setHours(12, 0, 0, 0);
      const dayEnd = new Date(dayInfo.date);
      dayEnd.setHours(23, 59, 59, 999);

      const x1 = xScale(dayStart);
      const xNoon = xScale(dayNoon);
      const x2 = xScale(dayEnd);

      // If today, highlight background column subtly
      if (dayInfo.isToday) {
        mainGroup.append('rect')
          .attr('x', x1)
          .attr('y', margin.top)
          .attr('width', x2 - x1)
          .attr('height', activeHalls.length * rowHeight)
          .attr('fill', '#0d9488')
          .attr('opacity', 0.04);
      }

      // Vertical Day Boundary Line
      mainGroup.append('line')
        .attr('x1', x1)
        .attr('y1', margin.top - 6)
        .attr('x2', x1)
        .attr('y2', margin.top + activeHalls.length * rowHeight)
        .attr('stroke', '#cbd5e1')
        .attr('stroke-width', 1);

      // Mid-day guideline (12:00 PM noon)
      mainGroup.append('line')
        .attr('x1', xNoon)
        .attr('y1', margin.top)
        .attr('x2', xNoon)
        .attr('y2', margin.top + activeHalls.length * rowHeight)
        .attr('stroke', '#e2e8f0')
        .attr('stroke-dasharray', '2,3')
        .attr('stroke-width', 0.8);

      // Clickable Day Column Header at Top
      const headerGroup = svg.append('g')
        .attr('class', 'day-header-group')
        .style('cursor', 'pointer')
        .on('click', () => onJumpToDay(dayInfo.dateStr));

      // Header background pill
      headerGroup.append('rect')
        .attr('x', x1 + 2)
        .attr('y', 8)
        .attr('width', Math.max(10, x2 - x1 - 4))
        .attr('height', 30)
        .attr('fill', dayInfo.isToday ? '#0d9488' : '#f1f5f9')
        .attr('rx', 6)
        .attr('stroke', dayInfo.isToday ? '#0f766e' : '#cbd5e1')
        .attr('stroke-width', 0.8);

      // Header Day Name & Date Text
      headerGroup.append('text')
        .attr('x', (x1 + x2) / 2)
        .attr('y', 23)
        .attr('text-anchor', 'middle')
        .attr('fill', dayInfo.isToday ? '#ffffff' : '#1e293b')
        .attr('font-size', '11px')
        .attr('font-weight', 'bold')
        .attr('font-family', 'sans-serif')
        .text(`${dayInfo.dayName} ${dayInfo.dayNumber}`);

      headerGroup.append('text')
        .attr('x', (x1 + x2) / 2)
        .attr('y', 33)
        .attr('text-anchor', 'middle')
        .attr('fill', dayInfo.isToday ? '#ccfbf1' : '#64748b')
        .attr('font-size', '8px')
        .attr('font-family', 'sans-serif')
        .text(dayInfo.isToday ? 'TODAY (Open)' : 'Click for 24h');
    });

    // 3. Y-Axis: Hall Labels and Capacity Badges
    activeHalls.forEach(hall => {
      const y = yScale(hall.id) || 0;
      const h = yScale.bandwidth();

      const hallGroup = svg.append('g')
        .attr('class', 'hall-label-group')
        .style('cursor', 'pointer')
        .on('click', () => {
          onSelectSlot(hall.id, daysOfWeek[0].dateStr, '09:00-18:00');
        });

      // Hall Name
      hallGroup.append('text')
        .attr('x', margin.left - 12)
        .attr('y', y + h / 2 - 4)
        .attr('text-anchor', 'end')
        .attr('fill', '#0f172a')
        .attr('font-size', '12px')
        .attr('font-weight', '700')
        .attr('font-family', 'sans-serif')
        .text(hall.name);

      // MG & Capacity Sub-text
      hallGroup.append('text')
        .attr('x', margin.left - 12)
        .attr('y', y + h / 2 + 12)
        .attr('text-anchor', 'end')
        .attr('fill', '#64748b')
        .attr('font-size', '10px')
        .attr('font-family', 'sans-serif')
        .text(`MG: ${hall.defaultMg}p | Max: ${hall.maxCapacity}p`);
    });

    // 4. Horizontal Occupancy Bars for each booking
    const barsGroup = mainGroup.append('g')
      .attr('class', 'occupancy-bars')
      .attr('clip-path', 'url(#chart-area-clip)');

    weekBookings.forEach(booking => {
      const y = yScale(booking.hallId);
      if (y === undefined) return;

      const rawX1 = xScale(booking.startTime);
      const rawX2 = xScale(booking.endTime);
      const barHeight = Math.max(28, yScale.bandwidth() - 10);
      const barY = y + (yScale.bandwidth() - barHeight) / 2;
      const barWidth = Math.max(rawX2 - rawX1, 16);

      // Color palette based on status
      let fill = '#0284c7'; // Sky for quotes
      let stroke = '#0369a1';
      let tagBg = '#bae6fd';

      if (booking.isExclusiveLock) {
        fill = '#7e22ce'; // Purple for exclusive lock
        stroke = '#6b21a8';
        tagBg = '#e9d5ff';
      } else if (booking.isConfirmed) {
        fill = '#059669'; // Emerald for confirmed
        stroke = '#047857';
        tagBg = '#a7f3d0';
      } else if (
        booking.status === 'Negotiation' ||
        booking.status === 'Food Trial'
      ) {
        fill = '#d97706'; // Amber
        stroke = '#b45309';
        tagBg = '#fde68a';
      }

      const barGroup = barsGroup.append('g')
        .attr('class', 'booking-bar-group')
        .style('cursor', 'pointer')
        .on('mouseenter', (event: MouseEvent) => {
          setHoveredBooking({
            booking,
            x: event.clientX,
            y: event.clientY,
          });
        })
        .on('mousemove', (event: MouseEvent) => {
          setHoveredBooking({
            booking,
            x: event.clientX,
            y: event.clientY,
          });
        })
        .on('mouseleave', () => {
          setHoveredBooking(null);
        })
        .on('click', () => {
          onSelectEnquiry(booking.enquiry);
        });

      // Individual Bar Rectangle
      barGroup.append('rect')
        .attr('x', rawX1)
        .attr('y', barY)
        .attr('width', barWidth)
        .attr('height', barHeight)
        .attr('fill', fill)
        .attr('stroke', stroke)
        .attr('stroke-width', 1.2)
        .attr('rx', 6)
        .attr('filter', 'url(#d3-bar-shadow)')
        .attr('opacity', 0.94);

      // Text labels inside bar (only if width is adequate)
      if (barWidth > 32) {
        // Unique clip path for this bar text
        const clipId = `clip-bar-${booking.enquiry.id}`;
        defs.append('clipPath')
          .attr('id', clipId)
          .append('rect')
          .attr('x', rawX1 + 4)
          .attr('y', barY + 2)
          .attr('width', barWidth - 8)
          .attr('height', barHeight - 4);

        const textGroup = barGroup.append('g')
          .attr('clip-path', `url(#${clipId})`);

        // Row 1: Guest Name & Company
        textGroup.append('text')
          .attr('x', rawX1 + 6)
          .attr('y', barY + (barHeight > 34 ? 15 : 17))
          .attr('fill', '#ffffff')
          .attr('font-size', '10.5px')
          .attr('font-weight', '700')
          .attr('font-family', 'sans-serif')
          .text(`${booking.enquiry.guestName} ${booking.enquiry.companyName ? '(' + booking.enquiry.companyName + ')' : ''}`);

        // Row 2: Event Type • Session Time • Pax (if bar is tall enough)
        if (barHeight > 34 && barWidth > 64) {
          textGroup.append('text')
            .attr('x', rawX1 + 6)
            .attr('y', barY + 30)
            .attr('fill', '#f1f5f9')
            .attr('font-size', '9px')
            .attr('font-family', 'sans-serif')
            .text(`${booking.enquiry.eventType} • ${booking.formattedTime} • ${booking.enquiry.gPax || booking.enquiry.expPax}p`);
        }
      }
    });

    // 5. Red Current Time Vertical Marker (if today is within this week)
    const now = new Date();
    if (now >= weekStart && now <= weekEnd) {
      const nowX = xScale(now);

      const nowGroup = svg.append('g').attr('class', 'current-time-marker');

      nowGroup.append('line')
        .attr('x1', nowX)
        .attr('y1', margin.top - 6)
        .attr('x2', nowX)
        .attr('y2', margin.top + activeHalls.length * rowHeight)
        .attr('stroke', '#ef4444')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4,2');

      // Top badge for "NOW"
      nowGroup.append('rect')
        .attr('x', nowX - 16)
        .attr('y', margin.top - 18)
        .attr('width', 32)
        .attr('height', 14)
        .attr('fill', '#ef4444')
        .attr('rx', 3);

      nowGroup.append('text')
        .attr('x', nowX)
        .attr('y', margin.top - 8)
        .attr('text-anchor', 'middle')
        .attr('fill', '#ffffff')
        .attr('font-size', '8px')
        .attr('font-weight', 'bold')
        .attr('font-family', 'sans-serif')
        .text('NOW');
    }

  }, [
    activeHalls,
    weekBookings,
    weekStart,
    weekEnd,
    daysOfWeek,
    containerWidth,
    onJumpToDay,
    onSelectEnquiry,
    onSelectSlot,
  ]);

  // Handle Download Multi-Sheet Spreadsheet
  const handleDownloadMasterSpreadsheet = () => {
    downloadMultiSheetSpreadsheet(
      enquiries,
      auditLogs,
      venues,
      `TRT_Banquet_MultiSheet_Master_${new Date().toISOString().split('T')[0]}.xlsx`
    );
  };

  const isCurrentWeek = useMemo(() => {
    const today = new Date();
    return today >= weekStart && today <= weekEnd;
  }, [weekStart, weekEnd]);

  return (
    <div id="hall-availability-week-chart" className="space-y-4">
      {/* 1. Week Navigation & Filter Controls Bar */}
      <div className="p-4 bg-white border border-sky-200 rounded-2xl shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Week Indicator & Steppers */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-sky-200 shadow-xs">
              <Calendar className="w-4 h-4 text-teal-600" />
              <span className="text-xs font-bold text-slate-800">
                {daysOfWeek[0]?.dayName} {formatDisplayDate(daysOfWeek[0]?.dateStr)} –{' '}
                {daysOfWeek[6]?.dayName} {formatDisplayDate(daysOfWeek[6]?.dateStr)}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 font-bold border border-teal-200">
                Wk {weekNumber}
              </span>
            </div>

            {/* Stepper Buttons */}
            <div className="flex items-center gap-1 bg-sky-50/70 p-1 rounded-xl border border-sky-200">
              <button
                type="button"
                onClick={() => handleShiftWeek(-1)}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-sky-100 rounded-lg transition-colors flex items-center gap-1 text-xs cursor-pointer"
                title="Previous Week"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Prev Wk</span>
              </button>

              <button
                type="button"
                onClick={handleJumpToCurrentWeek}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  isCurrentWeek
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-xs'
                    : 'text-teal-700 hover:bg-sky-100'
                }`}
              >
                Current Week
              </button>

              <button
                type="button"
                onClick={() => handleShiftWeek(1)}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-sky-100 rounded-lg transition-colors flex items-center gap-1 text-xs cursor-pointer"
                title="Next Week"
              >
                <span className="hidden sm:inline">Next Wk</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action: Hall Filter, Stage Filter, Search & Multi-Sheet Excel Download */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Hall Filter */}
            <select
              value={hallFilter}
              onChange={e => setHallFilter(e.target.value)}
              className="py-1.5 px-3 bg-white border border-sky-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-teal-500 shadow-xs"
            >
              <option value="ALL">All Halls ({venues.filter(v => v.status === 'Active').length})</option>
              {venues
                .filter(v => v.status === 'Active')
                .map(v => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
            </select>

            {/* Status Filter */}
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

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search week events..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-white border border-sky-200 rounded-xl pl-8 pr-6 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 shadow-xs w-36 sm:w-44"
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

            {/* Multi-Sheet Download Button */}
            <button
              type="button"
              onClick={handleDownloadMasterSpreadsheet}
              className="px-3 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 text-xs transition-all cursor-pointer"
              title="Download full multi-sheet spreadsheet: Sheet 1 Master Index + Sheet 2 onwards individual enquiry sheets with audit trails"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export Multi-Sheet (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Weekly Metrics Summary Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-sky-100 text-xs">
          <div className="flex items-center gap-2 font-mono flex-wrap">
            <span className="text-slate-500 font-semibold flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-teal-600" />
              <span>Week Metrics:</span>
            </span>
            <span className="px-2 py-0.5 rounded bg-sky-50 border border-sky-200 text-slate-800 font-bold">
              {weekStats.totalEvents} Total Booking{weekStats.totalEvents === 1 ? '' : 's'}
            </span>
            {weekStats.lockedCount > 0 && (
              <span className="px-2 py-0.5 rounded bg-purple-50 border border-purple-200 text-purple-700 font-bold">
                {weekStats.lockedCount} Locked
              </span>
            )}
            {weekStats.confirmedCount > 0 && (
              <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold">
                {weekStats.confirmedCount} Confirmed
              </span>
            )}
            {weekStats.tentativeCount > 0 && (
              <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 font-bold">
                {weekStats.tentativeCount} Tentative
              </span>
            )}
            <span className="px-2 py-0.5 rounded bg-teal-50 border border-teal-200 text-teal-800 font-medium">
              {formatIndianNumber(weekStats.totalPax)} Anticipated Pax
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-medium">
              {weekStats.totalHours} Booked Hours ({weekStats.occupancyRate}% Occ.)
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-purple-600 inline-block"></span>
              <span>Locked</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600 inline-block"></span>
              <span>Confirmed</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block"></span>
              <span>Tentative</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-sky-500 inline-block"></span>
              <span>Quote</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. D3 HORIZONTAL BAR CHART CONTAINER */}
      <div
        ref={containerRef}
        className="bg-white border border-sky-200 rounded-2xl shadow-sm p-3 overflow-x-auto relative"
      >
        <div className="min-w-[800px]">
          <svg ref={svgRef} className="w-full select-none" />
        </div>

        {/* Empty state if no bookings this week */}
        {weekBookings.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            <Clock className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium text-slate-600">
              No hall bookings scheduled for this week ({daysOfWeek[0]?.dayName} {daysOfWeek[0]?.dayNumber} –{' '}
              {daysOfWeek[6]?.dayName} {daysOfWeek[6]?.dayNumber}).
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Click any hall row or day header to open a date and book an event.
            </p>
          </div>
        )}
      </div>

      {/* 3. FLOATING TOOLTIP CARD FOR D3 BARS */}
      {hoveredBooking && (
        <div
          className="fixed z-50 pointer-events-none p-3.5 bg-slate-900/95 backdrop-blur-sm text-white rounded-xl shadow-xl border border-slate-700 text-xs w-72 transition-all space-y-2"
          style={{
            left: Math.min(hoveredBooking.x + 16, window.innerWidth - 300),
            top: Math.min(hoveredBooking.y + 16, window.innerHeight - 220),
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-700">
            <span className="font-mono font-bold text-teal-400">
              #{hoveredBooking.booking.enquiry.refNo}
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                hoveredBooking.booking.isExclusiveLock
                  ? 'bg-purple-900 text-purple-200 border border-purple-700'
                  : hoveredBooking.booking.isConfirmed
                  ? 'bg-emerald-900 text-emerald-200 border border-emerald-700'
                  : 'bg-amber-900 text-amber-200 border border-amber-700'
              }`}
            >
              {hoveredBooking.booking.status}
            </span>
          </div>

          {/* Body */}
          <div className="space-y-1">
            <p className="font-bold text-slate-100 text-sm truncate">
              {hoveredBooking.booking.enquiry.guestName}
            </p>
            {hoveredBooking.booking.enquiry.companyName && (
              <p className="text-slate-400 truncate text-[11px]">
                {hoveredBooking.booking.enquiry.companyName}
              </p>
            )}
            <div className="grid grid-cols-2 gap-1 pt-1 text-[11px] text-slate-300">
              <div>
                <span className="text-slate-400">Hall:</span>{' '}
                <strong className="text-slate-200">{hoveredBooking.booking.hallName}</strong>
              </div>
              <div>
                <span className="text-slate-400">Date:</span>{' '}
                <strong className="text-slate-200">{formatDisplayDate(hoveredBooking.booking.eventDate)}</strong>
              </div>
              <div>
                <span className="text-slate-400">Time:</span>{' '}
                <strong className="text-teal-300">{hoveredBooking.booking.formattedTime}</strong>
              </div>
              <div>
                <span className="text-slate-400">Pax:</span>{' '}
                <strong className="text-slate-200">
                  {hoveredBooking.booking.enquiry.gPax || hoveredBooking.booking.enquiry.expPax}p
                </strong>
              </div>
            </div>
            <div className="pt-1 text-[11px] text-slate-300">
              <span className="text-slate-400">Type:</span> {hoveredBooking.booking.enquiry.eventType}
            </div>
          </div>

          {/* Footer Click Hint */}
          <div className="pt-1 border-t border-slate-700/80 text-[10px] text-teal-400 flex items-center justify-between">
            <span>Click bar to view / edit enquiry</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      )}

      {/* 4. Multi-Sheet Spreadsheet Architecture Explanation Card */}
      <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs text-teal-900">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-teal-100/80 rounded-xl text-teal-700 shrink-0 mt-0.5">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900 text-sm">
              Real-Time Google Sheets Multi-Tab Sync & Multi-Sheet Excel Engine
            </h4>
            <p className="text-slate-600 leading-relaxed">
              <strong>Sheet 1 (Master Index):</strong> Master directory of all banquet bookings with active hyperlinks. Clicking any listed item navigates directly to its dedicated detail tab.
              <br />
              <strong>Sheet 2 onwards:</strong> Each enquiry possesses its own dedicated sheet containing full host specifications, venue logistics, commercials, and <strong>complete real-time audit trails</strong>.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDownloadMasterSpreadsheet}
          className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow-xs flex items-center gap-2 whitespace-nowrap self-start md:self-auto transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Download Multi-Sheet (.xlsx)</span>
        </button>
      </div>
    </div>
  );
};

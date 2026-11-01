import { Enquiry } from '../types';

/**
 * Formats a numeric value into the standard Indian Rupee (₹) format
 * Examples:
 * 100000 -> ₹1,00,000 (1 Lakh)
 * 10000000 -> ₹1,00,00,000 (1 Crore)
 */
export function formatINR(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '₹0';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats a plain number in the Indian numbering system without currency symbol
 */
export function formatIndianNumber(val: number | undefined | null): string {
  if (val === undefined || val === null || isNaN(val)) {
    return '0';
  }
  return new Intl.NumberFormat('en-IN').format(val);
}

/**
 * Generates an auto-incrementing Reference Number (Ref No) formatted as YYMMXXXX.
 * E.g., for August 2026, 1st enquiry is 26080001.
 */
export function generateRefNo(existingEnquiries: Enquiry[], targetDate?: Date): string {
  const date = targetDate || new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const prefix = `${year}${month}`;

  // Filter existing enquiries for current year & month prefix
  const matchingRefs = existingEnquiries
    .map(e => e.refNo)
    .filter(ref => ref && ref.startsWith(prefix))
    .map(ref => {
      const serialPart = ref.slice(4);
      const num = parseInt(serialPart, 10);
      return isNaN(num) ? 0 : num;
    });

  const maxSerial = matchingRefs.length > 0 ? Math.max(...matchingRefs) : 0;
  const nextSerial = (maxSerial + 1).toString().padStart(4, '0');

  return `${prefix}${nextSerial}`;
}

/**
 * Adds calendar days to a YYYY-MM-DD date string
 */
export function addDaysToDate(dateStr: string, days: number): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }
  const date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  date.setDate(date.getDate() + days);

  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Formats a date string into Indian display format: DD/MM/YYYY
 */
export function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return '—';
  if (dateStr === 'Indefinitely') return 'Postponed Indefinitely';
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

/**
 * Formats a date string into readable DD Mon YYYY format (e.g. 15 Aug 2026)
 */
export function formatReadableDate(dateStr?: string): string {
  if (!dateStr) return '—';
  if (dateStr === 'Indefinitely') return 'Indefinitely';
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3) {
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
  return dateStr;
}

/**
 * Checks if a date string is today or overdue (past)
 */
export function isOverdueOrToday(dateStr?: string): boolean {
  if (!dateStr || dateStr === 'Indefinitely') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parts = dateStr.split('T')[0].split('-');
  if (parts.length !== 3) return false;
  const target = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  target.setHours(0, 0, 0, 0);

  return target.getTime() <= today.getTime();
}

/**
 * Checks if targetDate is within the next N days from today
 */
export function isWithinNextDays(dateStr: string, daysMin: number, daysMax: number): boolean {
  if (!dateStr || dateStr === 'Indefinitely') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parts = dateStr.split('T')[0].split('-');
  if (parts.length !== 3) return false;
  const target = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  target.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  return diffDays >= daysMin && diffDays <= daysMax;
}

/**
 * Calculates days remaining from today
 */
export function getDaysRemaining(dateStr: string): number {
  if (!dateStr || dateStr === 'Indefinitely') return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parts = dateStr.split('T')[0].split('-');
  if (parts.length !== 3) return 0;
  const target = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  target.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Converts a time string (e.g., "09:30", "9:00", "18:00", "24:00") to total minutes from midnight (0 - 1440)
 */
export function timeStringToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const cleaned = timeStr.trim().toLowerCase();
  
  // Handle 24:00 or midnight special cases
  if (cleaned === '24:00' || cleaned === '24') return 1440;
  if (cleaned === '00:00' || cleaned === '0:00' || cleaned === '0') return 0;

  // Handle 12-hour format with am/pm
  const isPM = cleaned.includes('pm');
  const isAM = cleaned.includes('am');
  const stripped = cleaned.replace(/[apm\s]/g, '');
  const parts = stripped.split(':');
  
  let hours = parseInt(parts[0], 10) || 0;
  const minutes = parts.length > 1 ? parseInt(parts[1], 10) || 0 : 0;

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  const total = hours * 60 + minutes;
  return Math.min(Math.max(total, 0), 1440);
}

/**
 * Converts total minutes from midnight (0 - 1440) to standard 24-hour string format "HH:mm"
 */
export function minutesToTimeString(totalMinutes: number): string {
  const clamped = Math.min(Math.max(totalMinutes, 0), 1440);
  if (clamped === 1440) return '24:00';
  const hours = Math.floor(clamped / 60);
  const minutes = clamped % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Parses any session slot string (e.g. "09:00-18:00", "07:00 to 12:00", "17:00-23:00") into start & end minutes
 */
export function parseSessionTimeSlot(sessionStr?: string): {
  startMinutes: number;
  endMinutes: number;
  durationMinutes: number;
  formatted: string;
} {
  if (!sessionStr) {
    return {
      startMinutes: 540, // 09:00
      endMinutes: 1080,  // 18:00
      durationMinutes: 540,
      formatted: '09:00 - 18:00',
    };
  }

  // Pre-configured slots
  if (sessionStr === '07:00-12:00') {
    return { startMinutes: 420, endMinutes: 720, durationMinutes: 300, formatted: '07:00 - 12:00' };
  }
  if (sessionStr === '09:00-18:00') {
    return { startMinutes: 540, endMinutes: 1080, durationMinutes: 540, formatted: '09:00 - 18:00' };
  }
  if (sessionStr === '13:00-19:00') {
    return { startMinutes: 780, endMinutes: 1140, durationMinutes: 360, formatted: '13:00 - 19:00' };
  }
  if (sessionStr === '17:00-23:00') {
    return { startMinutes: 1020, endMinutes: 1380, durationMinutes: 360, formatted: '17:00 - 23:00' };
  }
  if (sessionStr === '08:00-23:00') {
    return { startMinutes: 480, endMinutes: 1380, durationMinutes: 900, formatted: '08:00 - 23:00' };
  }

  // Split by '-', 'to', '–', or spaces
  const separators = /[-–—]|(\s+to\s+)/i;
  const parts = sessionStr.split(separators).filter(Boolean);

  if (parts.length >= 2) {
    const start = timeStringToMinutes(parts[0]);
    let end = timeStringToMinutes(parts[parts.length - 1]);
    
    // If end is less than start (e.g. overnight or invalid), bump to min 1 hour
    if (end <= start) {
      end = Math.min(start + 180, 1440);
    }

    return {
      startMinutes: start,
      endMinutes: end,
      durationMinutes: end - start,
      formatted: `${minutesToTimeString(start)} - ${minutesToTimeString(end)}`,
    };
  }

  // Fallback if unable to parse properly
  return {
    startMinutes: 540,
    endMinutes: 1080,
    durationMinutes: 540,
    formatted: sessionStr,
  };
}

/**
 * Calculates pre-tax base rate and tax amount from an all-inclusive net rate.
 * Example: 1239 net with 23.9% tax -> base = 1000, tax = 239.
 * Example: 1180 net with 18.0% tax -> base = 1000, tax = 180.
 */
export function calculateFromInclusiveRate(
  inclusiveRate: number,
  taxRatePercent: number
): { baseRate: number; taxAmount: number; totalWithTax: number } {
  if (!inclusiveRate || inclusiveRate <= 0) {
    return { baseRate: 0, taxAmount: 0, totalWithTax: 0 };
  }
  const taxFactor = 1 + (taxRatePercent || 0) / 100;
  const rawBase = inclusiveRate / taxFactor;
  // If close to an integer within 0.001, snap to integer; otherwise 2 decimal places
  const baseRate = Math.abs(rawBase - Math.round(rawBase)) < 0.001
    ? Math.round(rawBase)
    : Math.round(rawBase * 100) / 100;

  const rawTax = inclusiveRate - baseRate;
  const taxAmount = Math.abs(rawTax - Math.round(rawTax)) < 0.001
    ? Math.round(rawTax)
    : Math.round(rawTax * 100) / 100;

  return {
    baseRate,
    taxAmount,
    totalWithTax: inclusiveRate,
  };
}


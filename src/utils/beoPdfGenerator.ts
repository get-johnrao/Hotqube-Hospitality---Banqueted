import { jsPDF } from 'jspdf';
import { Enquiry, VenueHall, QuotationSettingsConfig } from '../types';
import { formatINR } from './formatters';

export interface GenerateBEOOptions {
  download?: boolean;
}

export const generateBEOPdf = (
  enquiry: Enquiry,
  venue: VenueHall | undefined,
  settings?: QuotationSettingsConfig,
  options: GenerateBEOOptions = { download: true }
): { doc: jsPDF; filename: string } => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2;
  let currentY = 14;

  const beo = enquiry.beoDetails || {};

  // Top Accent Bar (Luxury Emerald/Teal)
  doc.setFillColor(15, 118, 110);
  doc.rect(marginX, currentY, contentWidth, 3, 'F');
  currentY += 8;

  // Hotel Title & Document Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 118, 110);
  doc.text(settings?.hotelName ? settings.hotelName.toUpperCase() : 'THE RESIDENCY TOWERS - CHENNAI', marginX, currentY);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('115, Sir Thyagaraya Road, T. Nagar, Chennai 600017 · F&B & Banquet Operations Department', marginX, currentY + 5);

  currentY += 12;

  // Main BEO Title Box
  doc.setFillColor(240, 249, 250);
  doc.setDrawColor(15, 118, 110);
  doc.rect(marginX, currentY, contentWidth, 9, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 118, 110);
  doc.text('OFFICIAL BANQUET EVENT ORDER (BEO) & KITCHEN FUNCTION SHEET', marginX + 4, currentY + 6);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`BEO REF: ${enquiry.refNo}`, pageWidth - marginX - 40, currentY + 6);
  currentY += 13;

  // SECTION 1: EVENT ESSENTIALS (2 Column Key-Value Table)
  const drawSectionHeader = (title: string) => {
    doc.setFillColor(226, 232, 240);
    doc.rect(marginX, currentY, contentWidth, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(title.toUpperCase(), marginX + 3, currentY + 4.2);
    currentY += 7.5;
  };

  drawSectionHeader('1. Booking & Event Specifications');

  const halfWidth = contentWidth / 2;
  const col1X = marginX + 2;
  const col2X = marginX + halfWidth + 2;

  const leftPairs: [string, string][] = [
    ['Guest / Host Name:', enquiry.guestName || 'Valued Patron'],
    ['Company / Group:', enquiry.companyName || 'Private Function'],
    ['Contact Phone / Mobile:', enquiry.guestMobileMain || 'N/A'],
    ['Function Nature / Type:', enquiry.eventType || 'Banquet Event'],
    ['Welcome Board Display:', enquiry.boardToRead || enquiry.functionBanner || enquiry.guestName],
  ];

  const rightPairs: [string, string][] = [
    ['Account Handler:', enquiry.accountHandler || enquiry.firstContactPerson || 'Banquet Sales Specialist'],
    ['Event Date:', enquiry.eventDate || 'TBD'],
    ['Session Time Slot:', enquiry.session || 'Full Day'],
    ['Primary Venue / Hall:', enquiry.hallName || venue?.name || 'Grand Ballroom'],
    ['Guaranteed Pax (G.Pax):', `${enquiry.gPax} Pax (Exp: ${enquiry.expPax || enquiry.gPax} Pax)`],
    ['Seating Layout Style:', enquiry.seatingArrangement || 'Cluster'],
  ];

  const startY = currentY;
  doc.setFontSize(8.5);
  leftPairs.forEach(([label, value], i) => {
    const y = startY + i * 5.2;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(label, col1X, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(value, col1X + 42, y);
  });

  rightPairs.forEach(([label, value], i) => {
    const y = startY + i * 5.2;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(label, col2X, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(value, col2X + 42, y);
  });

  currentY += Math.max(leftPairs.length, rightPairs.length) * 5.2 + 2;

  // Composite / Secondary Halls (if applicable)
  if (enquiry.secondaryHalls && enquiry.secondaryHalls.length > 0) {
    doc.setFillColor(254, 243, 199);
    doc.rect(marginX, currentY, contentWidth, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(146, 64, 14);
    const hallList = enquiry.secondaryHalls.map(h => `${h.hallName} (${h.purpose || 'Auxiliary'}, ${h.allocatedPax || 'All'} Pax)`).join(' · ');
    doc.text(`COMPOSITE VENUE ALLOCATIONS: ${hallList}`, marginX + 3, currentY + 4.2);
    currentY += 8;
  }

  // SECTION 2: SERVICE SEQUENCE & TIMELINES
  drawSectionHeader('2. Service Sequence & Critical Timelines');

  const timeEntries: [string, string][] = [
    ['Hall Access for Setup:', beo.hallAccessTime || '2 Hours Prior'],
    ['Guest Arrival Time:', beo.guestArrivalTime || enquiry.session.split('-')[0] || 'Scheduled'],
    ['Starter & Drink Service:', beo.starterServiceTime || 'Upon Arrival'],
    ['Buffet Service Opening:', beo.buffetOpeningTime || 'As per Schedule'],
    ['Dessert & Clearance:', beo.dessertClearanceTime || '1 Hr Prior to Session End'],
    ['Liquor / Bar Timing:', beo.liquorServiceStartTime ? `${beo.liquorServiceStartTime} - ${beo.liquorServiceEndTime || 'End'}` : 'No Bar Requested'],
  ];

  const timeColWidth = contentWidth / 3;
  timeEntries.forEach(([label, val], idx) => {
    const colIdx = idx % 3;
    const rowIdx = Math.floor(idx / 3);
    const x = marginX + colIdx * timeColWidth + 2;
    const y = currentY + rowIdx * 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(label.toUpperCase(), x, y);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 118, 110);
    doc.text(val, x, y + 4.2);
  });
  currentY += 18;

  // SECTION 3: KITCHEN FUNCTION SHEET & DIETARY INSTRUCTIONS
  drawSectionHeader('3. Kitchen Function Sheet & Chef Instructions');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Menu Package:', marginX + 2, currentY + 3.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(enquiry.menu || 'Veg & Non-Veg Deluxe Package', marginX + 30, currentY + 3.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Spiciness Preference:', marginX + halfWidth + 2, currentY + 3.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(beo.spicinessLevel || 'Medium / Balanced', marginX + halfWidth + 40, currentY + 3.5);

  currentY += 7;

  if (beo.specialDietary) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(185, 28, 28);
    doc.text('Special Dietary (Jain/Vegan/Allergens):', marginX + 2, currentY + 3.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(beo.specialDietary, marginX + 65, currentY + 3.5);
    currentY += 7;
  }

  if (beo.liveCounters && beo.liveCounters.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Live Food Counters:', marginX + 2, currentY + 3.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(beo.liveCounters.join(', '), marginX + 35, currentY + 3.5);
    currentY += 7;
  }

  if (beo.chefNotes) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Executive Chef Notes:', marginX + 2, currentY + 3.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(51, 65, 85);
    const chefLines = doc.splitTextToSize(beo.chefNotes, contentWidth - 45);
    doc.text(chefLines, marginX + 40, currentY + 3.5);
    currentY += chefLines.length * 4.5 + 2;
  } else {
    currentY += 2;
  }

  // SECTION 4: HALL SETUP & AUDIO-VISUAL TECHNICAL CHECKLIST
  drawSectionHeader('4. Hall Setup & Audio-Visual Technical Specifications');

  const setupSpecs: [string, string][] = [
    ['Stage Specifications:', beo.stageDimensions || 'Standard Hotel Risers / Stage'],
    ['Podium / Lectern:', beo.podiumRequired !== false ? 'Required with Hotel Emblem' : 'Not Required'],
    ['Registration Desk:', beo.registrationDesk !== false ? 'Required at Hall Entrance' : 'Not Required'],
    ['AC Pre-Cool Timing:', beo.airConditionPreCoolTime || '60 Mins Prior to Access'],
    ['Microphones:', `${beo.cordlessMicsCount ?? 2} Cordless, ${beo.collarMicsCount ?? 1} Collar`],
    ['Screens & Projector:', `${beo.projectorScreensCount ?? 1} Screen with HDMI & Audio Patch`],
    ['Music / Sound:', beo.djMusicArrangement || 'Hotel Ambient Playlist'],
    ['Linen & Table Theme:', beo.tableClothColor || 'Hotel Standard Ivory / Beige'],
  ];

  setupSpecs.forEach(([label, val], idx) => {
    const isCol2 = idx % 2 === 1;
    const row = Math.floor(idx / 2);
    const x = isCol2 ? marginX + halfWidth + 2 : marginX + 2;
    const y = currentY + row * 5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(label, x, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(val, x + 38, y);
  });
  currentY += Math.ceil(setupSpecs.length / 2) * 5 + 3;

  // SECTION 5: FINANCIALS & BILLING BASICS
  drawSectionHeader('5. Commercials & Advance Summary');

  const billPairs: [string, string][] = [
    ['Billing Basis:', enquiry.rateBillingType || 'Venue with Meal'],
    ['Quoted Base Rate:', enquiry.quotedBaseRate ? formatINR(enquiry.quotedBaseRate) : 'As per Contract'],
    ['Total Est. Value:', enquiry.finalBillValue ? formatINR(enquiry.finalBillValue) : 'Pending Final Settlement'],
    ['Advance Received:', enquiry.advanceAmount ? `${formatINR(enquiry.advanceAmount)} (${enquiry.advancePaidDate || 'Paid'})` : 'Nil / Pending'],
  ];

  const billColWidth = contentWidth / 4;
  billPairs.forEach(([lbl, v], i) => {
    const x = marginX + i * billColWidth + 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(lbl.toUpperCase(), x, currentY + 3.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(v, x, currentY + 8);
  });
  currentY += 13;

  // SECTION 6: DEPARTMENTAL SIGN-OFF & OPERATIONAL HANDOVER
  drawSectionHeader('6. Multi-Department Operational Sign-Off');

  const depts = [
    { title: 'Banquet Sales / Ops', name: beo.banquetManagerSign || enquiry.firstContactPerson || 'Duty Manager' },
    { title: 'Executive Chef', name: beo.executiveChefSign || 'Head Chef - Banquets' },
    { title: 'Banquet Service', name: beo.beverageManagerSign || 'Captain on Duty' },
    { title: 'Engineering & AV', name: beo.engineeringAvSign || 'AV Technician' },
  ];

  const deptColWidth = contentWidth / 4;
  depts.forEach((d, i) => {
    const x = marginX + i * deptColWidth;
    doc.setDrawColor(203, 213, 225);
    doc.line(x + 2, currentY + 12, x + deptColWidth - 4, currentY + 12);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 118, 110);
    doc.text(d.title.toUpperCase(), x + 2, currentY + 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(d.name, x + 2, currentY + 8.5);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('Signature & Date', x + 2, currentY + 16);
  });

  // Footer Disclaimer
  currentY = pageHeight - 12;
  doc.setDrawColor(226, 232, 240);
  doc.line(marginX, currentY, marginX + contentWidth, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Generated on ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} · The Residency Towers Chennai · Confidential Internal BEO`, marginX, currentY + 5);
  doc.text(`Page 1 of 1`, pageWidth - marginX - 15, currentY + 5);

  const cleanGuestName = (enquiry.guestName || 'Client').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `BEO_${enquiry.refNo}_${cleanGuestName}.pdf`;

  if (options.download) {
    doc.save(filename);
  }

  return { doc, filename };
};

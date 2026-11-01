import { jsPDF } from 'jspdf';
import { Enquiry, VenueHall, QuotationSettingsConfig } from '../types';
import { formatINR } from './formatters';

// Utility to replace placeholders in text
export const interpolateQuotationText = (
  template: string,
  enquiry: Enquiry,
  hall?: VenueHall,
  settings?: QuotationSettingsConfig
): string => {
  const baseRate = enquiry.quotedBaseRate || 0;
  const pax = enquiry.gPax || 1;
  const isVenueWithMeal = enquiry.rateBillingType === 'Venue with Meal';
  
  // Rate calculations
  let subtotal = 0;
  if (enquiry.rateItems && enquiry.rateItems.length > 0) {
    subtotal = enquiry.rateItems.reduce((acc, it) => acc + (it.amount || 0), 0);
  } else if (isVenueWithMeal) {
    subtotal = baseRate * pax;
  } else {
    subtotal = baseRate;
  }

  const taxAmount = enquiry.taxAmount ?? Math.round(subtotal * 0.18);
  const totalAmount = enquiry.finalBillValue ?? subtotal + taxAmount;

  const replacements: Record<string, string> = {
    '{{GUEST_NAME}}': enquiry.guestName || 'Valued Guest',
    '{{COMPANY_NAME}}': enquiry.companyName || 'Private Patron',
    '{{REF_NO}}': enquiry.refNo || 'REF-PENDING',
    '{{EVENT_DATE}}': enquiry.eventDate || 'TBD',
    '{{EVENT_TYPE}}': enquiry.eventType || 'Banquet Function',
    '{{VENUE_NAME}}': enquiry.hallName || hall?.name || 'Grand Ballroom',
    '{{SESSION}}': enquiry.session || 'Full Day',
    '{{G_PAX}}': String(enquiry.gPax || 0),
    '{{EXP_PAX}}': String(enquiry.expPax || enquiry.gPax || 0),
    '{{PAX}}': String(enquiry.gPax || 0),
    '{{SEATING_STYLE}}': enquiry.seatingArrangement || 'Cluster',
    '{{MENU_PLAN}}': enquiry.menu || 'Veg & Non-Veg Multi-Cuisine',
    '{{RATE_BILLING_TYPE}}': enquiry.rateBillingType || 'Venue with Meal',
    '{{BASE_RATE}}': formatINR(baseRate),
    '{{RATE_BASIS}}': isVenueWithMeal ? 'Per Pax' : 'Hall Rent',
    '{{SUBTOTAL}}': formatINR(subtotal),
    '{{GST_AMOUNT}}': formatINR(taxAmount),
    '{{TOTAL_AMOUNT}}': formatINR(totalAmount),
    '{{FIRST_CONTACT}}': enquiry.accountHandler || enquiry.firstContactPerson || 'Banquet Sales Specialist',
    '{{ACCOUNT_HANDLER}}': enquiry.accountHandler || enquiry.firstContactPerson || 'Banquet Sales Specialist',
    '{{WELCOME_BOARD}}': enquiry.boardToRead || enquiry.functionBanner || enquiry.guestName || 'Welcome',
    '{{MOBILE}}': enquiry.guestMobileMain || 'N/A',
    '{{EMAIL}}': enquiry.email || 'N/A',
    '{{HOTEL_NAME}}': settings?.hotelName || 'The Residency Towers',
    '{{HOTEL_PHONE}}': settings?.hotelPhone || '+91 44 2815 6377',
  };

  let result = template;
  for (const [key, val] of Object.entries(replacements)) {
    result = result.split(key).join(val);
  }
  return result;
};

// Strips HTML tags for simple text rendering
export const stripHtml = (html: string): string => {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

export interface GeneratePdfOptions {
  download?: boolean;
}

export const generateBanquetQuotationPdf = (
  enquiry: Enquiry,
  venue: VenueHall | undefined,
  settings: QuotationSettingsConfig,
  options: GeneratePdfOptions = { download: true }
): { doc: jsPDF; filename: string } => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 16;
  const contentWidth = pageWidth - marginX * 2;
  let currentY = 16;

  // Header Decorative Line
  doc.setFillColor(15, 118, 110); // Luxury Teal #0f766e
  doc.rect(marginX, currentY, contentWidth, 2, 'F');
  currentY += 8;

  // Brand Name & Subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 118, 110);
  doc.text(settings.hotelName.toUpperCase(), marginX, currentY);

  // Reference & Date on right side
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`REF NO: ${enquiry.refNo}`, pageWidth - marginX, currentY - 2, { align: 'right' });
  doc.text(
    `DATE: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`,
    pageWidth - marginX,
    currentY + 3,
    { align: 'right' }
  );

  currentY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(settings.hotelSubtitle, marginX, currentY);

  currentY += 4.5;
  doc.setFontSize(8);
  doc.text(`${settings.hotelAddress} | Tel: ${settings.hotelPhone}`, marginX, currentY);
  currentY += 4;
  doc.text(`Email: ${settings.hotelEmail} | GSTIN: ${settings.hotelGstin}`, marginX, currentY);

  currentY += 6;
  doc.setDrawColor(226, 232, 240);
  doc.line(marginX, currentY, pageWidth - marginX, currentY);
  currentY += 7;

  // Title: BANQUET PROPOSAL & QUOTATION
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('EXECUTIVE BANQUET PROPOSAL & TARIFF ESTIMATE', marginX, currentY);
  currentY += 6;

  // Guest & Event Details Box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.roundedRect(marginX, currentY, contentWidth, 34, 2, 2, 'FD');

  const boxY = currentY + 5;
  const col1X = marginX + 4;
  const col2X = marginX + 68;
  const col3X = marginX + 128;

  // Row 1
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('CLIENT / HOST:', col1X, boxY);
  doc.text('EVENT TYPE:', col2X, boxY);
  doc.text('EVENT DATE:', col3X, boxY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(enquiry.guestName || 'Valued Guest', col1X, boxY + 4);
  doc.text(enquiry.eventType || 'Banquet Event', col2X, boxY + 4);
  doc.text(enquiry.eventDate || 'TBD', col3X, boxY + 4);

  // Row 2
  const boxY2 = boxY + 11;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('COMPANY / ORG:', col1X, boxY2);
  doc.text('RESERVED VENUE:', col2X, boxY2);
  doc.text('SESSION & TIMINGS:', col3X, boxY2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(enquiry.companyName || 'Private Gathering', col1X, boxY2 + 4);
  doc.setFont('helvetica', 'bold');
  doc.text(enquiry.hallName || venue?.name || 'Allocated Hall', col2X, boxY2 + 4);
  doc.setFont('helvetica', 'normal');
  doc.text(enquiry.session || 'Full Day', col3X, boxY2 + 4);

  // Row 3
  const boxY3 = boxY2 + 11;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('CONTACT / MOBILE:', col1X, boxY3);
  doc.text('PAX (G / EXP):', col2X, boxY3);
  doc.text('SEATING ARRANGEMENT:', col3X, boxY3);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`${enquiry.guestMobileMain || 'N/A'}${enquiry.email ? ` | ${enquiry.email}` : ''}`, col1X, boxY3 + 4);
  doc.text(`${enquiry.gPax || 0} Guaranteed (${enquiry.expPax || enquiry.gPax || 0} Expected)`, col2X, boxY3 + 4);
  doc.text(enquiry.seatingArrangement || 'Cluster Layout', col3X, boxY3 + 4);

  currentY += 40;

  // Active Sections Rendering
  const sortedSections = [...settings.sections]
    .filter(s => s.isEnabled)
    .sort((a, b) => a.order - b.order);

  sortedSections.forEach((section, index) => {
    // Check if we need page break
    if (currentY > pageHeight - 35) {
      doc.addPage();
      currentY = 16;
      // Header on page 2
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`${settings.hotelName} — Banquet Quotation (Ref: ${enquiry.refNo})`, marginX, currentY);
      doc.line(marginX, currentY + 2, pageWidth - marginX, currentY + 2);
      currentY += 8;
    }

    // Section Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 118, 110);
    doc.text(section.title.toUpperCase(), marginX, currentY);
    currentY += 4.5;

    // Process HTML text with token interpolation
    const interpolated = interpolateQuotationText(section.contentHtml, enquiry, venue, settings);
    
    // Simple line parser: split paragraphs and list items
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = interpolated;

    const children = Array.from(tempDiv.childNodes);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);

    children.forEach(node => {
      const el = node as HTMLElement;
      const text = el.textContent?.trim() || '';
      if (!text) return;

      if (currentY > pageHeight - 25) {
        doc.addPage();
        currentY = 16;
      }

      if (el.tagName === 'UL' || el.tagName === 'OL') {
        const items = Array.from(el.querySelectorAll('li'));
        items.forEach((li, liIdx) => {
          if (currentY > pageHeight - 20) {
            doc.addPage();
            currentY = 16;
          }
          const bullet = el.tagName === 'OL' ? `${liIdx + 1}. ` : '• ';
          const lines = doc.splitTextToSize(`${bullet}${li.textContent?.trim() || ''}`, contentWidth - 4);
          doc.text(lines, marginX + 3, currentY);
          currentY += lines.length * 4.2;
        });
      } else {
        const lines = doc.splitTextToSize(text, contentWidth);
        doc.text(lines, marginX, currentY);
        currentY += lines.length * 4.2 + 2;
      }
    });

    currentY += 3;
  });

  // Financial Table Summary (Always prominently rendered)
  if (currentY > pageHeight - 50) {
    doc.addPage();
    currentY = 16;
  }

  const baseRate = enquiry.quotedBaseRate || 0;
  const pax = enquiry.gPax || 1;
  const isVenueWithMeal = enquiry.rateBillingType === 'Venue with Meal';
  const subtotal = isVenueWithMeal ? baseRate * pax : baseRate;
  const taxAmount = enquiry.taxAmount ?? Math.round(subtotal * 0.18);
  const totalAmount = enquiry.finalBillValue ?? subtotal + taxAmount;

  const focSavings = enquiry.totalFocSavings || enquiry.inclusionsDiscountTotal || 0;
  const boxHeight = focSavings > 0 ? 30 : 24;

  doc.setFillColor(240, 253, 250); // teal-50
  doc.setDrawColor(15, 118, 110);
  doc.rect(marginX, currentY, contentWidth, boxHeight, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 118, 110);
  doc.text('INVESTMENT SUMMARY & TAXATION', marginX + 4, currentY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`Base Tariff (${isVenueWithMeal ? `₹${formatINR(baseRate)} × ${pax} Pax` : 'Hall Rental'}):`, marginX + 4, currentY + 11);
  doc.text(`₹${formatINR(subtotal)}`, marginX + 90, currentY + 11, { align: 'right' });

  doc.text('Goods & Services Tax (GST 18%):', marginX + 4, currentY + 16);
  doc.text(`₹${formatINR(taxAmount)}`, marginX + 90, currentY + 16, { align: 'right' });

  if (focSavings > 0) {
    doc.setTextColor(5, 150, 105); // emerald-600
    doc.setFont('helvetica', 'bold');
    doc.text('Complimentary Privileges & FOC Savings:', marginX + 4, currentY + 21);
    doc.text(`₹${formatINR(focSavings)} (Saved)`, marginX + 90, currentY + 21, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('Total Quotation Value (Net Inclusive):', marginX + 105, currentY + 13);
  doc.setTextColor(15, 118, 110);
  doc.setFontSize(12);
  doc.text(`₹${formatINR(totalAmount)}`, pageWidth - marginX - 4, currentY + 13.5, { align: 'right' });

  currentY += boxHeight + 8;

  // Sign-off / Acceptance Footer
  if (currentY > pageHeight - 35) {
    doc.addPage();
    currentY = 16;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Warm regards,', marginX, currentY);
  currentY += 4.5;
  doc.setFont('helvetica', 'bold');
  doc.text(enquiry.accountHandler || enquiry.firstContactPerson || 'Banquet Sales Directorate', marginX, currentY);
  currentY += 4;
  doc.setFont('helvetica', 'normal');
  doc.text(`${settings.hotelName} Chennai`, marginX, currentY);

  // Client Acceptance Line on right side
  doc.text('Guest Acceptance Signature: _______________________', pageWidth - marginX, currentY, { align: 'right' });
  currentY += 4;
  doc.text(`Date of Acceptance: __________________`, pageWidth - marginX, currentY, { align: 'right' });

  // Page Numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Page ${i} of ${totalPages} | Generated via ${settings.hotelName} Banquet Operations Management`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }

  const safeGuestName = (enquiry.guestName || 'Guest').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Quotation_${enquiry.refNo || 'New'}_${safeGuestName}.pdf`;

  if (options.download) {
    doc.save(filename);
  }

  return { doc, filename };
};

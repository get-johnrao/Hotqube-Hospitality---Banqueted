import * as XLSX from 'xlsx';
import { Enquiry, AuditLogEntry, VenueHall } from '../types';
import { formatDisplayDate, formatINR } from './formatters';

/**
 * Sanitizes sheet names for Excel / Google Sheets compatibility.
 * Excel sheet names cannot exceed 31 characters and cannot contain: \ / ? * : [ ]
 */
export function sanitizeSheetName(refNo: string): string {
  const clean = refNo.replace(/[\\/?*:[\]]/g, '_').trim();
  const prefixed = clean.startsWith('TRT') ? clean : `TRT_${clean}`;
  return prefixed.substring(0, 31);
}

/**
 * Generates an official multi-sheet workbook containing:
 * - Sheet 1: "Master_Enquiries_Index" with all enquiries and clickable links to each sheet.
 * - Sheet 2 onwards: Individual sheets for each enquiry with full details, financials, and complete audit trails.
 */
export function generateMultiSheetWorkbook(
  enquiries: Enquiry[],
  auditLogs: AuditLogEntry[] = [],
  venues: VenueHall[] = []
): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  // -------------------------------------------------------------
  // SHEET 1: Master Enquiries Index
  // -------------------------------------------------------------
  const masterHeaders = [
    'Quick Link',
    'Ref No',
    'Enquiry Date',
    'Guest Name',
    'Company Name',
    'Event Date',
    'Hall / Venue',
    'Session',
    'G. Pax',
    'Exp. Pax',
    'Event Type',
    'Seating Arrangement',
    'Menu Category',
    'Billing Type',
    'Quoted Base Rate (INR)',
    'Final Bill Value (INR)',
    'Advance Paid (INR)',
    'Balance Amount (INR)',
    'Pipeline Status',
    'Final Status',
    'Business Source',
    'Account Handler',
    'Mobile Number',
    'Follow-up 1',
    'Follow-up 2',
    'Follow-up 3',
    'Audit Records Count',
    'Remarks',
  ];

  const masterRows: any[][] = [];

  // Title row & metadata in Sheet 1
  masterRows.push(['THE RESIDENCY TOWERS, CHENNAI - BANQUET ENQUIRIES MASTER INDEX']);
  masterRows.push([
    `Generated on: ${new Date().toLocaleString()} | Total Active Enquiries: ${enquiries.length}`,
  ]);
  masterRows.push(['Instructions: Click any "📂 View" link below to jump directly to that enquiry\'s dedicated sheet with full audit trails.']);
  masterRows.push([]); // blank row
  masterRows.push(masterHeaders);

  enquiries.forEach(e => {
    const sheetName = sanitizeSheetName(e.refNo);
    const relatedAuditCount = auditLogs.filter(a => a.refNo === e.refNo).length;

    masterRows.push([
      { f: `HYPERLINK("#'${sheetName}'!A1", "📂 View ${e.refNo}")` },
      e.refNo,
      e.enquiryDate || '',
      e.guestName || '',
      e.companyName || '',
      e.eventDate || '',
      e.hallName || '',
      e.session || '',
      e.gPax || 0,
      e.expPax || 0,
      e.eventType || '',
      e.seatingArrangement || '',
      e.menu || '',
      e.rateBillingType || '',
      e.quotedBaseRate || 0,
      e.finalBillValue || 0,
      e.advanceAmount || 0,
      e.balanceAmount || 0,
      e.status || '',
      e.finalStatus || '',
      e.businessSource || '',
      e.accountHandler || e.firstContactPerson || '',
      e.guestMobileMain || '',
      e.followUp1Date || '',
      e.followUp2Date || '',
      e.followUp3Date || '',
      relatedAuditCount,
      e.remarks || '',
    ]);
  });

  const masterSheet = XLSX.utils.aoa_to_sheet(masterRows);

  // Column width hints for Sheet 1
  masterSheet['!cols'] = [
    { wch: 18 }, // Quick Link
    { wch: 14 }, // Ref No
    { wch: 13 }, // Enquiry Date
    { wch: 22 }, // Guest Name
    { wch: 22 }, // Company Name
    { wch: 13 }, // Event Date
    { wch: 18 }, // Hall
    { wch: 15 }, // Session
    { wch: 9 },  // G Pax
    { wch: 9 },  // Exp Pax
    { wch: 20 }, // Event Type
    { wch: 16 }, // Seating
    { wch: 16 }, // Menu
    { wch: 18 }, // Billing Type
    { wch: 18 }, // Quoted Rate
    { wch: 18 }, // Final Bill
    { wch: 16 }, // Advance Paid
    { wch: 16 }, // Balance
    { wch: 24 }, // Pipeline Status
    { wch: 16 }, // Final Status
    { wch: 16 }, // Source
    { wch: 20 }, // Account Handler
    { wch: 15 }, // Mobile
    { wch: 13 }, // F1
    { wch: 13 }, // F2
    { wch: 13 }, // F3
    { wch: 18 }, // Audit Count
    { wch: 30 }, // Remarks
  ];

  XLSX.utils.book_append_sheet(wb, masterSheet, 'Master_Enquiries_Index');

  // -------------------------------------------------------------
  // SHEETS 2 ONWARDS: Dedicated Sheet per Enquiry with Audit Trail
  // -------------------------------------------------------------
  enquiries.forEach(e => {
    const sheetName = sanitizeSheetName(e.refNo);
    const detailRows: any[][] = [];

    // Header banner
    detailRows.push(['THE RESIDENCY TOWERS, CHENNAI - BANQUET ENQUIRY RECORD']);
    detailRows.push([
      { f: `HYPERLINK("#'Master_Enquiries_Index'!A1", "⬅ Return to Master Enquiries List (Sheet 1)")` },
    ]);
    detailRows.push([]);

    // Section 1: Core Record Overview
    detailRows.push(['1. RECORD IDENTITY & PIPELINE STATUS']);
    detailRows.push(['Ref Number:', e.refNo, 'Enquiry Date:', e.enquiryDate || '']);
    detailRows.push(['Pipeline Status:', e.status || '', 'Final Status:', e.finalStatus || '']);
    detailRows.push(['Business Source:', e.businessSource || '', 'Account Handler:', e.accountHandler || e.firstContactPerson || '']);
    detailRows.push(['Created By:', e.createdBy || '', 'Created At:', e.createdAt || '']);
    detailRows.push(['Last Updated By:', e.updatedBy || '', 'Last Updated At:', e.updatedAt || '']);
    detailRows.push([]);

    // Section 2: Host & Contact Profile
    detailRows.push(['2. HOST & ORGANIZATION DETAILS']);
    detailRows.push(['Guest Name:', e.guestName || '', 'Company Name:', e.companyName || '']);
    detailRows.push(['Primary Mobile:', e.guestMobileMain || '', 'Backup Mobile:', e.guestMobileBackup || '']);
    detailRows.push(['Email Address:', e.email || '', '', '']);
    detailRows.push([]);

    // Section 3: Event Logistics & Venue Allocation
    detailRows.push(['3. EVENT LOGISTICS & VENUE DETAILS']);
    detailRows.push(['Event Date:', e.eventDate || '', 'Hall / Venue Name:', e.hallName || '']);
    detailRows.push(['Session Slot:', e.session || '', 'Event Type:', e.eventType || '']);
    detailRows.push(['Welcome Board Display:', e.boardToRead || e.functionBanner || '', '', '']);
    detailRows.push(['Seating Arrangement:', e.seatingArrangement || '', '', '']);
    detailRows.push(['Guaranteed Pax:', e.gPax || 0, 'Expected Pax:', e.expPax || 0]);
    if (e.mgOverrideReason) {
      detailRows.push(['MG Override Reason:', e.mgOverrideReason, '', '']);
    }
    detailRows.push([]);

    // Section 4: Catering & Services
    detailRows.push(['4. CATERING & SERVICES']);
    detailRows.push(['Menu Package:', e.menu || '', 'Rate Billing Type:', e.rateBillingType || '']);
    detailRows.push([
      'Inclusions:',
      Array.isArray(e.inclusions) ? e.inclusions.join('; ') : (e.inclusions || 'None'),
      '',
      '',
    ]);
    detailRows.push([]);

    // Section 5: Financials & Payment Terms
    detailRows.push(['5. FINANCIALS, TAXES & COMMERCIALS']);
    detailRows.push(['Quoted Base Rate (INR):', e.quotedBaseRate || 0, 'Tax Rate (%):', e.taxRatePercent ? `${e.taxRatePercent}%` : 'Standard GST']);
    detailRows.push(['Tax Amount (INR):', e.taxAmount || 0, 'Final Bill Value (INR):', e.finalBillValue || 0]);
    detailRows.push(['Advance Amount Paid (INR):', e.advanceAmount || 0, 'Advance Paid Date:', e.advancePaidDate || 'Not Paid']);
    detailRows.push(['Balance Amount Due (INR):', e.balanceAmount || 0, 'Balance Paid Date:', e.balancePaidDate || 'Pending']);
    detailRows.push([]);

    // Section 6: Operational Notes & Follow-ups
    detailRows.push(['6. OPERATIONAL REMARKS & FOLLOW-UPS']);
    detailRows.push(['Follow-up 1 Date:', e.followUp1Date || 'None', 'Follow-up 2 Date:', e.followUp2Date || 'None']);
    detailRows.push(['Follow-up 3 Date:', e.followUp3Date || 'None', 'No Follow-up Required:', e.noFollowUpRequired ? 'Yes' : 'No']);
    detailRows.push(['Primary Remarks:', e.remarks || 'None', '', '']);
    if (e.followUps && e.followUps.length > 0) {
      e.followUps.forEach(fu => {
        detailRows.push([`Follow-up ${fu.index} (${fu.date || 'No Date'}):`, fu.remark || 'None', '', '']);
      });
    } else {
      if (e.remarks1) detailRows.push(['Additional Remarks 1:', e.remarks1, '', '']);
      if (e.remarks2) detailRows.push(['Additional Remarks 2:', e.remarks2, '', '']);
      if (e.remarks3) detailRows.push(['Additional Remarks 3:', e.remarks3, '', '']);
    }
    detailRows.push([]);

    // Section 7: Audit Trails & Modification Log
    detailRows.push(['7. COMPLETE AUDIT TRAIL & ACTIVITY LOG']);
    detailRows.push([
      'Timestamp',
      'Operator / User',
      'Action Type',
      'Field Modified',
      'Previous Value',
      'New Value',
    ]);

    // Find audit logs matching this enquiry
    const enquiryAudits = auditLogs.filter(a => a.refNo === e.refNo);

    if (enquiryAudits.length > 0) {
      enquiryAudits.forEach(audit => {
        detailRows.push([
          audit.systemTimestamp || '',
          audit.userId || 'SYSTEM',
          audit.actionType || '',
          audit.fieldModified || '',
          audit.previousValue || '',
          audit.newValue || '',
        ]);
      });
    } else {
      detailRows.push([
        e.createdAt || new Date().toISOString(),
        e.createdBy || 'SYSTEM',
        'CREATE',
        'ALL_FIELDS',
        'NONE',
        'INITIAL_ENQUIRY_LOGGED',
      ]);
      detailRows.push([
        'Note:',
        'No subsequent modifications recorded yet for this enquiry.',
        '',
        '',
        '',
        '',
      ]);
    }

    const detailSheet = XLSX.utils.aoa_to_sheet(detailRows);

    detailSheet['!cols'] = [
      { wch: 24 }, // Label / Timestamp
      { wch: 34 }, // Value / User
      { wch: 22 }, // Label 2 / Action
      { wch: 34 }, // Value 2 / Field
      { wch: 26 }, // Previous Value
      { wch: 26 }, // New Value
    ];

    XLSX.utils.book_append_sheet(wb, detailSheet, sheetName);
  });

  return wb;
}

/**
 * Triggers direct browser download of the multi-sheet spreadsheet
 */
export function downloadMultiSheetSpreadsheet(
  enquiries: Enquiry[],
  auditLogs: AuditLogEntry[] = [],
  venues: VenueHall[] = [],
  customFilename?: string
): void {
  const wb = generateMultiSheetWorkbook(enquiries, auditLogs, venues);
  const defaultName = `TRT_Chennai_Banquet_MultiSheet_Master_${new Date().toISOString().split('T')[0]}.xlsx`;
  const filename = customFilename || defaultName;

  XLSX.writeFile(wb, filename);
}

import { Enquiry, VenueHall, AuditLogEntry } from '../types';
import { getAccessToken, googleSignIn } from './googleDocsService';

export interface CreatedSpreadsheetResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
  enquiriesCount: number;
}

export const MASTER_SHEET_TITLE = 'Master Enquiries Register';
export const VENUES_SHEET_TITLE = 'Venues & Capacities';
export const AUDIT_SHEET_TITLE = 'Audit & Sync Trail';

/**
 * Converts a 0-based column index to A1 notation column letters (e.g. 0 -> A, 25 -> Z, 26 -> AA, 28 -> AC)
 */
export function getColumnLetter(colIndex: number): string {
  let letter = '';
  let temp = colIndex;
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

/**
 * Sanitizes a sheet name for Google Sheets / Excel compatibility.
 * Sheets cannot exceed 31 chars and cannot contain \ / ? * : [ ]
 */
export function sanitizeSheetName(refNo: string): string {
  const clean = (refNo || 'ENQ').replace(/[\\/?*:[\]]/g, '_').trim();
  const prefixed = clean.startsWith('TRT') ? clean : `TRT_${clean}`;
  return prefixed.substring(0, 31);
}

export const ENQUIRY_HEADERS = [
  'Quick Link',
  'Ref No',
  'Enquiry Date',
  'Guest Name',
  'Company Name',
  'Business Source',
  'Account Handler',
  'Mobile Number',
  'Event Date',
  'Event Type',
  'Hall / Venue',
  'Seating Arrangement',
  'G. Pax',
  'Exp. Pax',
  'Session',
  'Menu',
  'Board to Read',
  'Rate Billing Type',
  'Inclusions',
  'Quoted Base Rate (INR)',
  'Tax Amount (INR)',
  'Final Bill Value (INR)',
  'Advance Paid (INR)',
  'Balance Amount (INR)',
  'Pipeline Stage',
  'Final Status',
  'Follow-up 1 Date',
  'Follow-up 2 Date',
  'Follow-up 3 Date',
  'Special Remarks',
  'Last Updated',
];

export const VENUE_HEADERS = [
  'Hall ID',
  'Hall Name',
  'Dimensions',
  'Area Sq Ft',
  'Theater / Floating Capacity',
  'Cluster Capacity',
  'Standard Minimum Pax',
  'Tariff Base Rate (INR)',
  'Status',
];

export const AUDIT_HEADERS = [
  'Timestamp',
  'Ref No / Section',
  'Operator / User',
  'Field Name',
  'Previous Value',
  'New Value',
  'Action Type',
];

/**
 * Helper to convert Enquiry object into spreadsheet row array for the Master Register
 */
export const formatEnquiryToMasterRow = (e: Enquiry): (string | number)[] => {
  const taxAmount = (e.finalBillValue || 0) - (e.quotedBaseRate || 0);
  const safeTax = taxAmount > 0 ? taxAmount : (e.taxAmount || 0);
  const advance = e.advanceAmount || 0;
  const balance = (e.finalBillValue || 0) - advance;
  const sName = sanitizeSheetName(e.refNo);

  return [
    `=HYPERLINK("#'${sName}'!A1", "📂 View Details")`,
    e.refNo || '',
    e.enquiryDate || '',
    e.guestName || '',
    e.companyName || '',
    e.businessSource || '',
    e.accountHandler || e.firstContactPerson || '',
    e.guestMobileMain || '',
    e.eventDate || '',
    e.eventType || '',
    e.hallName || '',
    e.seatingArrangement || '',
    Number(e.gPax) || 0,
    Number(e.expPax) || 0,
    e.session || '',
    e.menu || '',
    e.boardToRead || '',
    e.rateBillingType || '',
    Array.isArray(e.inclusions) ? e.inclusions.join(', ') : (e.inclusions || ''),
    Number(e.quotedBaseRate) || 0,
    safeTax,
    Number(e.finalBillValue) || 0,
    advance,
    balance > 0 ? balance : 0,
    e.status || '',
    e.finalStatus || '',
    e.followUp1Date || '',
    e.followUp2Date || '',
    e.followUp3Date || '',
    [e.remarks, ...(e.followUps ? e.followUps.map(f => f.remark).filter(Boolean) : [e.remarks1, e.remarks2, e.remarks3].filter(Boolean))].filter(Boolean).join(' | ') || '',
    e.updatedAt || e.createdAt || new Date().toISOString(),
  ];
};

/**
 * Helper to generate comprehensive detail rows for an individual Enquiry sheet in the workbook
 */
export function generateIndividualEnquirySheetRows(
  e: Enquiry,
  auditLogs: AuditLogEntry[] = []
): (string | number)[][] {
  const detailRows: (string | number)[][] = [];

  // Header banner
  detailRows.push(['THE RESIDENCY TOWERS, CHENNAI - BANQUET ENQUIRY RECORD']);
  detailRows.push([`=HYPERLINK("#'${MASTER_SHEET_TITLE}'!A1", "⬅ Return to Master Enquiries List (Sheet 1)")`]);
  detailRows.push([]);

  // Section 1: Core Record Overview
  detailRows.push(['1. RECORD IDENTITY & PIPELINE STATUS']);
  detailRows.push(['Ref Number:', e.refNo, 'Enquiry Date:', e.enquiryDate || '']);
  detailRows.push(['Pipeline Status:', e.status || '', 'Final Status:', e.finalStatus || '']);
  detailRows.push(['Business Source:', e.businessSource || '', 'Account Handler:', e.accountHandler || e.firstContactPerson || '']);
  detailRows.push(['Created By:', e.createdBy || '', 'Created At:', e.createdAt || '']);
  detailRows.push(['Last Updated By:', e.updatedBy || '', 'Last Updated At:', e.updatedAt || '']);
  detailRows.push([]);

  // Section 2: Host & Organization Details
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
  detailRows.push(['Guaranteed Pax:', Number(e.gPax) || 0, 'Expected Pax:', Number(e.expPax) || 0]);
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
  const taxAmount = (e.finalBillValue || 0) - (e.quotedBaseRate || 0);
  const safeTax = taxAmount > 0 ? taxAmount : (e.taxAmount || 0);
  const advance = e.advanceAmount || 0;
  const balance = (e.finalBillValue || 0) - advance;

  detailRows.push(['5. FINANCIALS, TAXES & COMMERCIALS']);
  detailRows.push([
    'Quoted Base Rate (INR):',
    Number(e.quotedBaseRate) || 0,
    'Tax Rate (%):',
    e.taxRatePercent ? `${e.taxRatePercent}%` : 'Standard GST',
  ]);
  detailRows.push(['Tax Amount (INR):', safeTax, 'Final Bill Value (INR):', Number(e.finalBillValue) || 0]);
  detailRows.push(['Advance Amount Paid (INR):', advance, 'Advance Paid Date:', e.advancePaidDate || 'Not Paid']);
  detailRows.push(['Balance Amount Due (INR):', balance > 0 ? balance : 0, 'Balance Paid Date:', e.balancePaidDate || 'Pending']);
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
  }

  return detailRows;
}

/**
 * 1-Click Automated Google Sheet Creation
 * Creates a pre-formatted, multi-tab Google Sheet in the user's Google Drive with zero manual code/deployment.
 * Creates:
 *  - Sheet 1: Master Enquiries Register
 *  - Sheet 2: Venues & Capacities
 *  - Sheet 3: Audit & Sync Trail
 *  - Sheet 4+: Individual dedicated sheet for each enquiry in the workbook
 */
export const createIntegratedGoogleSpreadsheet = async (
  enquiries: Enquiry[],
  venues: VenueHall[],
  auditLogs: AuditLogEntry[],
  onProgress?: (status: string) => void
): Promise<CreatedSpreadsheetResult> => {
  let token = await getAccessToken();
  if (!token) {
    onProgress?.('Authenticating with Google Account...');
    const authResult = await googleSignIn();
    token = authResult.accessToken;
  }

  onProgress?.('Provisioning multi-sheet workbook in your Google Drive...');
  const title = `BEMS - Banquet Enquiries Master (The Residency Towers)`;

  // Build sheet definition array: 3 base sheets + 1 sheet for each enquiry
  const sheetsPayload: any[] = [
    {
      properties: {
        title: MASTER_SHEET_TITLE,
        index: 0,
        gridProperties: {
          frozenRowCount: 1,
          rowCount: Math.max(100, enquiries.length + 20),
          columnCount: ENQUIRY_HEADERS.length + 2,
        },
      },
    },
    {
      properties: {
        title: VENUES_SHEET_TITLE,
        index: 1,
        gridProperties: {
          frozenRowCount: 1,
          rowCount: Math.max(50, venues.length + 10),
          columnCount: VENUE_HEADERS.length + 2,
        },
      },
    },
    {
      properties: {
        title: AUDIT_SHEET_TITLE,
        index: 2,
        gridProperties: {
          frozenRowCount: 1,
          rowCount: Math.max(200, auditLogs.length + 20),
          columnCount: AUDIT_HEADERS.length + 2,
        },
      },
    },
  ];

  // Add individual sheet for each enquiry
  enquiries.forEach((e, idx) => {
    const sName = sanitizeSheetName(e.refNo);
    sheetsPayload.push({
      properties: {
        title: sName,
        index: 3 + idx,
        gridProperties: {
          frozenRowCount: 2,
          rowCount: 60,
          columnCount: 10,
        },
      },
    });
  });

  // 1. Create the Spreadsheet
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
      },
      sheets: sheetsPayload,
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create Google Sheet: ${createRes.status} ${errText}`);
  }

  const createdData = await createRes.json();
  const spreadsheetId: string = createdData.spreadsheetId;
  const spreadsheetUrl: string =
    createdData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  onProgress?.(`Populating Master Register and ${enquiries.length} individual enquiry sheets...`);

  // 2. Prepare value datasets
  const enquiryRows = enquiries.map(formatEnquiryToMasterRow);
  const venueRows = venues.map(v => [
    v.id,
    v.name,
    v.dimensions || '',
    v.areaSqFt || 0,
    v.layouts?.Theatre?.capacityMax || v.defaultMg || 0,
    v.layouts?.Cluster?.capacityMax || 0,
    v.defaultMg || 0,
    0,
    v.status,
  ]);
  const auditRows = auditLogs.slice(0, 100).map(a => [
    a.systemTimestamp,
    a.refNo,
    a.userId || 'SYSTEM',
    a.fieldModified,
    a.previousValue,
    a.newValue,
    a.actionType,
  ]);

  const valueDataEntries: any[] = [
    {
      range: `'${MASTER_SHEET_TITLE}'!A1`,
      values: [ENQUIRY_HEADERS],
    },
    {
      range: `'${MASTER_SHEET_TITLE}'!A2`,
      values: enquiryRows.length > 0 ? enquiryRows : [[]],
    },
    {
      range: `'${VENUES_SHEET_TITLE}'!A1`,
      values: [VENUE_HEADERS],
    },
    {
      range: `'${VENUES_SHEET_TITLE}'!A2`,
      values: venueRows.length > 0 ? venueRows : [[]],
    },
    {
      range: `'${AUDIT_SHEET_TITLE}'!A1`,
      values: [AUDIT_HEADERS],
    },
    {
      range: `'${AUDIT_SHEET_TITLE}'!A2`,
      values: auditRows.length > 0 ? auditRows : [[]],
    },
  ];

  // Append data ranges for each individual enquiry sheet
  enquiries.forEach(e => {
    const sName = sanitizeSheetName(e.refNo);
    const detailRows = generateIndividualEnquirySheetRows(e, auditLogs);
    valueDataEntries.push({
      range: `'${sName}'!A1`,
      values: detailRows,
    });
  });

  // 3. Write data to all sheets via values:batchUpdate
  const batchValuesRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: valueDataEntries,
      }),
    }
  );

  if (!batchValuesRes.ok) {
    const errText = await batchValuesRes.text();
    console.error('Values population failed:', errText);
    throw new Error(`Failed to write initial data to Google Sheet: ${batchValuesRes.status} ${errText}`);
  }

  // 4. Style headers with luxury dark teal branding and bold white typography
  try {
    onProgress?.('Applying professional formatting and column styles...');
    const sheetIds = createdData.sheets?.map((s: any) => s.properties.sheetId) || [0, 1, 2];

    const formatRequests: any[] = [];
    sheetIds.forEach((sheetId: number) => {
      formatRequests.push({
        repeatCell: {
          range: {
            sheetId,
            startRowIndex: 0,
            endRowIndex: 1,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.08, green: 0.28, blue: 0.36 }, // Dark teal
              textFormat: {
                bold: true,
                foregroundColor: { red: 1, green: 1, blue: 1 },
                fontSize: 10,
              },
              horizontalAlignment: 'CENTER',
              wrapStrategy: 'WRAP',
            },
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,wrapStrategy)',
        },
      });
    });

    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: formatRequests,
      }),
    });
  } catch (formatErr) {
    console.warn('Formatting batch update non-critical error:', formatErr);
  }

  onProgress?.('Automated multi-sheet Google workbook created and synchronized!');

  return {
    spreadsheetId,
    spreadsheetUrl,
    title,
    enquiriesCount: enquiries.length,
  };
};

/**
 * Direct Live API Push to synchronize enquiries to Google Sheet.
 * Ensures:
 *  - Master sheet has all updated rows and quick links.
 *  - Venues & Capacities is updated.
 *  - Audit & Sync Trail is updated.
 *  - Each enquiry has its own dedicated sheet (creates missing sheets dynamically if new enquiries were added).
 */
export const pushEnquiriesToGoogleSpreadsheet = async (
  spreadsheetId: string,
  enquiries: Enquiry[],
  venues: VenueHall[],
  auditLogs: AuditLogEntry[],
  interactive: boolean = false
): Promise<{ success: boolean; count: number; requiresAuth?: boolean }> => {
  let token = await getAccessToken();
  if (!token) {
    if (!interactive) {
      // Non-interactive background sync (e.g. 20s idle timer) MUST NOT prompt popup!
      return { success: false, count: 0, requiresAuth: true };
    }
    const authResult = await googleSignIn();
    token = authResult.accessToken;
  }

  // Step 1: Fetch existing sheets in the spreadsheet to detect any missing tabs
  let existingSheetTitles = new Set<string>();
  try {
    const metaRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (metaRes.ok) {
      const metaData = await metaRes.json();
      metaData.sheets?.forEach((s: any) => {
        if (s.properties?.title) {
          existingSheetTitles.add(s.properties.title);
        }
      });
    }
  } catch (metaErr) {
    console.warn('Could not inspect existing sheet titles:', metaErr);
  }

  // Step 2: Dynamically add missing sheets for any new enquiries
  const addSheetRequests: any[] = [];
  enquiries.forEach(e => {
    const sName = sanitizeSheetName(e.refNo);
    if (!existingSheetTitles.has(sName)) {
      addSheetRequests.push({
        addSheet: {
          properties: {
            title: sName,
            gridProperties: {
              frozenRowCount: 2,
              rowCount: 60,
              columnCount: 10,
            },
          },
        },
      });
      existingSheetTitles.add(sName);
    }
  });

  if (addSheetRequests.length > 0) {
    try {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests: addSheetRequests }),
      });
    } catch (addSheetErr) {
      console.warn('Could not add new enquiry sheets:', addSheetErr);
    }
  }

  // Step 3: Clear existing enquiry data rows from Master sheet to avoid leftover ghost rows
  try {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${MASTER_SHEET_TITLE}'!A2:ZZ:clear`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (clearErr) {
    console.warn('Clear existing rows warning:', clearErr);
  }

  const enquiryRows = enquiries.map(formatEnquiryToMasterRow);
  const venueRows = venues.map(v => [
    v.id,
    v.name,
    v.dimensions || '',
    v.areaSqFt || 0,
    v.layouts?.Theatre?.capacityMax || v.defaultMg || 0,
    v.layouts?.Cluster?.capacityMax || 0,
    v.defaultMg || 0,
    0,
    v.status,
  ]);
  const auditRows = auditLogs.slice(0, 100).map(a => [
    a.systemTimestamp,
    a.refNo,
    a.userId || 'SYSTEM',
    a.fieldModified,
    a.previousValue,
    a.newValue,
    a.actionType,
  ]);

  const valueDataEntries: any[] = [
    {
      range: `'${MASTER_SHEET_TITLE}'!A1`,
      values: [ENQUIRY_HEADERS],
    },
    {
      range: `'${MASTER_SHEET_TITLE}'!A2`,
      values: enquiryRows.length > 0 ? enquiryRows : [[]],
    },
    {
      range: `'${VENUES_SHEET_TITLE}'!A1`,
      values: [VENUE_HEADERS],
    },
    {
      range: `'${VENUES_SHEET_TITLE}'!A2`,
      values: venueRows.length > 0 ? venueRows : [[]],
    },
    {
      range: `'${AUDIT_SHEET_TITLE}'!A1`,
      values: [AUDIT_HEADERS],
    },
    {
      range: `'${AUDIT_SHEET_TITLE}'!A2`,
      values: auditRows.length > 0 ? auditRows : [[]],
    },
  ];

  // Add individual sheet data updates for each enquiry
  enquiries.forEach(e => {
    const sName = sanitizeSheetName(e.refNo);
    const detailRows = generateIndividualEnquirySheetRows(e, auditLogs);
    valueDataEntries.push({
      range: `'${sName}'!A1`,
      values: detailRows,
    });
  });

  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: valueDataEntries,
      }),
    }
  );

  if (!updateRes.ok) {
    const errText = await updateRes.text();
    console.error('Failed to push updates to Google Sheet:', errText);
    throw new Error(`Failed to push updates to Google Sheet: ${updateRes.status} ${errText}`);
  }

  return { success: true, count: enquiries.length };
};

/**
 * Direct Live API Pull to read enquiries from Google Sheet
 */
export const pullEnquiriesFromGoogleSpreadsheet = async (
  spreadsheetId: string,
  interactive: boolean = false
): Promise<{ success: boolean; rowsCount: number; data: any[]; requiresAuth?: boolean }> => {
  let token = await getAccessToken();
  if (!token) {
    if (!interactive) {
      return { success: false, rowsCount: 0, data: [], requiresAuth: true };
    }
    const authResult = await googleSignIn();
    token = authResult.accessToken;
  }

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${MASTER_SHEET_TITLE}'!A2:ZZ`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to pull rows from Google Sheet: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const rows = data.values || [];

  return {
    success: true,
    rowsCount: rows.length,
    data: rows,
  };
};

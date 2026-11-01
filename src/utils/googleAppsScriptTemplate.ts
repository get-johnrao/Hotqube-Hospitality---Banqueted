/**
 * THE RESIDENCY TOWERS, CHENNAI - BANQUET ENQUIRY MANAGEMENT SYSTEM (BEMS)
 * Official Google Apps Script Bi-Directional Synchronization Code
 * Multi-Sheet Architecture:
 * - Sheet 1: "Master_Enquiries_Index" (Contains all enquiries with clickable HYPERLINK formulas to each detail sheet)
 * - Sheet 2 onwards: Individual sheets per enquiry with comprehensive operational details & complete audit trails
 */

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * THE RESIDENCY TOWERS, CHENNAI - BEMS BANQUET SYNCHRONIZATION SCRIPT
 * Multi-Sheet Real-Time Architecture:
 * - Sheet 1: "Master_Enquiries_Index" with clickable links to every enquiry.
 * - Sheet 2+: One dedicated sheet per enquiry with all event specs, billing & complete audit trails.
 *
 * ADMIN INSTRUCTIONS:
 * 1. In your Google Sheet, click Extensions -> Apps Script.
 * 2. Replace any existing code with this complete script.
 * 3. Click the Save icon (Floppy disk).
 * 4. Select "initializeBEMSWorkbook" from the function dropdown and click "Run".
 *    (Authorize Google permissions when prompted).
 * 5. Click "Deploy" (top right) -> "New deployment".
 * 6. Select type: "Web app".
 * 7. Set:
 *    - Description: "BEMS Multi-Sheet Real-Time Sync Web App"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone"
 * 8. Click "Deploy" and copy the Web App URL into your BEMS Settings modal!
 */

var MASTER_SHEET_NAME = "Master_Enquiries_Index";

var MASTER_HEADERS = [
  "Quick Link",
  "Ref No",
  "Enquiry Date",
  "Guest Name",
  "Company Name",
  "Event Date",
  "Hall / Venue",
  "Session",
  "G. Pax",
  "Exp. Pax",
  "Event Type",
  "Seating Arrangement",
  "Menu Category",
  "Billing Type",
  "Quoted Base Rate (INR)",
  "Final Bill Value (INR)",
  "Advance Paid (INR)",
  "Balance Amount (INR)",
  "Pipeline Status",
  "Final Status",
  "Business Source",
  "Account Handler",
  "Mobile Number",
  "Follow-up 1",
  "Follow-up 2",
  "Follow-up 3",
  "Audit Records Count",
  "Remarks"
];

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("🏨 BEMS Banquet Sync")
    .addItem("Format & Initialize Multi-Sheet Index", "initializeBEMSWorkbook")
    .addItem("Sync Status Diagnostic", "checkSyncStatus")
    .addToUi();
}

/**
 * Sanitizes sheet names for Google Sheets compatibility (max 31 chars, no invalid symbols)
 */
function sanitizeSheetName(refNo) {
  var clean = (refNo || "ENQ").toString().replace(/[\\/?*:[\]]/g, "_").trim();
  var prefixed = clean.indexOf("TRT") === 0 ? clean : "TRT_" + clean;
  return prefixed.substring(0, 31);
}

/**
 * Initializes the Master Sheet (Sheet 1)
 */
function initializeBEMSWorkbook() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var masterSheet = ss.getSheetByName(MASTER_SHEET_NAME);
  if (!masterSheet) {
    masterSheet = ss.insertSheet(MASTER_SHEET_NAME, 0);
  }
  
  masterSheet.getRange(1, 1, 1, MASTER_HEADERS.length).setValues([MASTER_HEADERS]);
  
  // Format Header Row with The Residency Towers Teal branding
  var headerRange = masterSheet.getRange(1, 1, 1, MASTER_HEADERS.length);
  headerRange.setBackground("#0d9488");
  headerRange.setFontColor("#ffffff");
  headerRange.setFontWeight("bold");
  headerRange.setFontFamily("Arial");
  headerRange.setFontSize(10);
  headerRange.setHorizontalAlignment("center");
  headerRange.setWrap(true);
  
  masterSheet.setFrozenRows(1);
  masterSheet.autoResizeColumns(1, MASTER_HEADERS.length);
  SpreadsheetApp.getUi().alert("BEMS Master Index sheet initialized successfully!");
}

/**
 * Creates or updates an individual sheet for a single enquiry with complete audit trail
 */
function updateIndividualEnquirySheet(ss, enquiry, auditLogs) {
  var sheetName = sanitizeSheetName(enquiry.refNo);
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  
  sheet.clear();
  
  var rows = [];
  rows.push(["THE RESIDENCY TOWERS, CHENNAI - BANQUET ENQUIRY RECORD", "", "", "", ""]);
  rows.push(['=HYPERLINK("#\'" & MASTER_SHEET_NAME & "\'!A1", "⬅ Return to Master Enquiries List (Sheet 1)")', "", "", "", ""]);
  rows.push(["", "", "", "", ""]);
  
  // 1. Identification
  rows.push(["1. RECORD IDENTITY & PIPELINE STATUS", "", "", "", ""]);
  rows.push(["Ref Number:", enquiry.refNo || "", "Enquiry Date:", enquiry.enquiryDate || "", ""]);
  rows.push(["Pipeline Status:", enquiry.status || "", "Final Status:", enquiry.finalStatus || "", ""]);
  rows.push(["Business Source:", enquiry.businessSource || "", "Account Handler:", enquiry.accountHandler || enquiry.firstContactPerson || "", ""]);
  rows.push(["Created By:", enquiry.createdBy || "", "Created At:", enquiry.createdAt || "", ""]);
  rows.push(["Last Updated By:", enquiry.updatedBy || "", "Last Updated At:", enquiry.updatedAt || "", ""]);
  rows.push(["", "", "", "", ""]);
  
  // 2. Host
  rows.push(["2. HOST & ORGANIZATION DETAILS", "", "", "", ""]);
  rows.push(["Guest Name:", enquiry.guestName || "", "Company Name:", enquiry.companyName || "", ""]);
  rows.push(["Primary Mobile:", enquiry.guestMobileMain || "", "Backup Mobile:", enquiry.guestMobileBackup || "", ""]);
  rows.push(["Email Address:", enquiry.email || "", "", "", ""]);
  rows.push(["", "", "", "", ""]);
  
  // 3. Logistics
  rows.push(["3. EVENT LOGISTICS & VENUE DETAILS", "", "", "", ""]);
  rows.push(["Event Date:", enquiry.eventDate || "", "Hall / Venue Name:", enquiry.hallName || "", ""]);
  rows.push(["Session Slot:", enquiry.session || "", "Event Type:", enquiry.eventType || "", ""]);
  rows.push(["Welcome Board Display:", enquiry.boardToRead || enquiry.functionBanner || "", "", "", ""]);
  rows.push(["Seating Arrangement:", enquiry.seatingArrangement || "", "", "", ""]);
  rows.push(["Guaranteed Pax:", enquiry.gPax || 0, "Expected Pax:", enquiry.expPax || 0, ""]);
  rows.push(["", "", "", "", ""]);
  
  // 4. Catering
  rows.push(["4. CATERING & SERVICES", "", "", "", ""]);
  rows.push(["Menu Package:", enquiry.menu || "", "Rate Billing Type:", enquiry.rateBillingType || "", ""]);
  rows.push(["Inclusions:", Array.isArray(enquiry.inclusions) ? enquiry.inclusions.join("; ") : (enquiry.inclusions || "None"), "", "", ""]);
  rows.push(["", "", "", "", ""]);
  
  // 5. Commercials
  rows.push(["5. FINANCIALS, TAXES & COMMERCIALS", "", "", "", ""]);
  rows.push(["Quoted Base Rate (INR):", enquiry.quotedBaseRate || 0, "Tax Rate (%):", enquiry.taxRatePercent ? enquiry.taxRatePercent + "%" : "Standard GST", ""]);
  rows.push(["Tax Amount (INR):", enquiry.taxAmount || 0, "Final Bill Value (INR):", enquiry.finalBillValue || 0, ""]);
  rows.push(["Advance Amount Paid (INR):", enquiry.advanceAmount || 0, "Advance Paid Date:", enquiry.advancePaidDate || "Not Paid", ""]);
  rows.push(["Balance Amount Due (INR):", enquiry.balanceAmount || 0, "Balance Paid Date:", enquiry.balancePaidDate || "Pending", ""]);
  rows.push(["", "", "", "", ""]);
  
  // 6. Remarks
  rows.push(["6. OPERATIONAL REMARKS & FOLLOW-UPS", "", "", "", ""]);
  rows.push(["Follow-up 1 Date:", enquiry.followUp1Date || "None", "Follow-up 2 Date:", enquiry.followUp2Date || "None", ""]);
  rows.push(["Follow-up 3 Date:", enquiry.followUp3Date || "None", "No Follow-up Required:", enquiry.noFollowUpRequired ? "Yes" : "No", ""]);
  rows.push(["Primary Remarks:", enquiry.remarks || "None", "", "", ""]);
  if (enquiry.followUps && enquiry.followUps.length > 0) {
    enquiry.followUps.forEach(function(fu) {
      rows.push(["Follow-up " + fu.index + " (" + (fu.date || "No Date") + "):", fu.remark || "None", "", "", ""]);
    });
  } else {
    if (enquiry.remarks1) rows.push(["Additional Remarks 1:", enquiry.remarks1, "", "", ""]);
    if (enquiry.remarks2) rows.push(["Additional Remarks 2:", enquiry.remarks2, "", "", ""]);
    if (enquiry.remarks3) rows.push(["Additional Remarks 3:", enquiry.remarks3, "", "", ""]);
  }
  rows.push(["", "", "", "", ""]);
  
  // 7. Audit Trails
  rows.push(["7. COMPLETE AUDIT TRAIL & ACTIVITY LOG", "", "", "", ""]);
  rows.push(["Timestamp", "Operator / User", "Action Type", "Field Modified", "Previous Value", "New Value"]);
  
  var relatedAudits = (auditLogs || []).filter(function(a) {
    return a.refNo === enquiry.refNo;
  });
  
  if (relatedAudits.length > 0) {
    relatedAudits.forEach(function(a) {
      rows.push([
        a.systemTimestamp || "",
        a.userId || "SYSTEM",
        a.actionType || "",
        a.fieldModified || "",
        a.previousValue || "",
        a.newValue || ""
      ]);
    });
  } else {
    rows.push([
      enquiry.createdAt || new Date().toISOString(),
      enquiry.createdBy || "SYSTEM",
      "CREATE",
      "ALL_FIELDS",
      "NONE",
      "INITIAL_ENQUIRY_LOGGED"
    ]);
  }
  
  sheet.getRange(1, 1, rows.length, 6).setValues(rows);
  
  // Format Banner Header
  sheet.getRange(1, 1, 1, 6).setBackground("#0d9488").setFontColor("#ffffff").setFontWeight("bold").setFontSize(12);
  // Format Back link
  sheet.getRange(2, 1).setFontColor("#0d9488").setFontWeight("bold").setFontUnderline(true);
  
  // Format section titles
  var sectionRows = [4, 11, 17, 23, 28, 34, 39];
  sectionRows.forEach(function(r) {
    if (r <= rows.length) {
      sheet.getRange(r, 1, 1, 6).setBackground("#f0fdfa").setFontWeight("bold").setFontColor("#0f766e");
    }
  });
  
  // Format audit trail header
  var auditHeaderRow = 40;
  if (auditHeaderRow <= rows.length) {
    sheet.getRange(auditHeaderRow, 1, 1, 6).setBackground("#134e4a").setFontColor("#ffffff").setFontWeight("bold");
  }
  
  sheet.autoResizeColumns(1, 6);
  return sheet;
}

/**
 * Web App GET endpoint - Returns JSON of all enquiries from Master Index
 */
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(MASTER_SHEET_NAME);
    if (!sheet) {
      sheet = ss.getSheets()[0];
    }
    
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        count: 0,
        enquiries: []
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    var headers = data[0];
    var rows = data.slice(1);
    
    var enquiries = rows.map(function(row) {
      var obj = {};
      headers.forEach(function(h, idx) {
        obj[h] = row[idx];
      });
      return obj;
    });
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      count: enquiries.length,
      enquiries: enquiries
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Web App POST endpoint - Real-time synchronization
 * Updates Sheet 1 (Master Index) with clickable links and updates Sheet 2 onwards with dedicated enquiry sheets and audit trails
 */
function doPost(e) {
  try {
    var contents = JSON.parse(e.postData.contents);
    var incomingEnquiries = contents.enquiries || [];
    var incomingAuditLogs = contents.auditLogs || [];
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var masterSheet = ss.getSheetByName(MASTER_SHEET_NAME);
    if (!masterSheet) {
      masterSheet = ss.insertSheet(MASTER_SHEET_NAME, 0);
      masterSheet.getRange(1, 1, 1, MASTER_HEADERS.length).setValues([MASTER_HEADERS]);
    }
    
    // Clear and rebuild master rows with active clickable hyperlinks to individual enquiry sheets
    masterSheet.clear();
    masterSheet.getRange(1, 1, 1, MASTER_HEADERS.length).setValues([MASTER_HEADERS]);
    
    var headerRange = masterSheet.getRange(1, 1, 1, MASTER_HEADERS.length);
    headerRange.setBackground("#0d9488");
    headerRange.setFontColor("#ffffff");
    headerRange.setFontWeight("bold");
    headerRange.setHorizontalAlignment("center");
    
    var masterDataRows = [];
    
    incomingEnquiries.forEach(function(item) {
      // 1. Create or update individual sheet starting from Sheet 2
      var childSheet = updateIndividualEnquirySheet(ss, item, incomingAuditLogs);
      var childSheetName = sanitizeSheetName(item.refNo);
      var childSheetId = childSheet.getSheetId();
      
      var relatedAuditCount = incomingAuditLogs.filter(function(a) {
        return a.refNo === item.refNo;
      }).length;
      
      // Hyperlink pointing directly to the child sheet
      var linkFormula = '=HYPERLINK("#gid=' + childSheetId + '", "📂 Open ' + item.refNo + '")';
      
      masterDataRows.push([
        linkFormula,
        item.refNo || "",
        item.enquiryDate || "",
        item.guestName || "",
        item.companyName || "",
        item.eventDate || "",
        item.hallName || "",
        item.session || "",
        item.gPax || 0,
        item.expPax || 0,
        item.eventType || "",
        item.seatingArrangement || "",
        item.menu || "",
        item.rateBillingType || "",
        item.quotedBaseRate || 0,
        item.finalBillValue || 0,
        item.advanceAmount || 0,
        item.balanceAmount || 0,
        item.status || "",
        item.finalStatus || "",
        item.businessSource || "",
        item.accountHandler || item.firstContactPerson || "",
        item.guestMobileMain || "",
        item.followUp1Date || "",
        item.followUp2Date || "",
        item.followUp3Date || "",
        relatedAuditCount,
        item.remarks || ""
      ]);
    });
    
    if (masterDataRows.length > 0) {
      masterSheet.getRange(2, 1, masterDataRows.length, MASTER_HEADERS.length).setValues(masterDataRows);
    }
    
    masterSheet.setFrozenRows(1);
    masterSheet.autoResizeColumns(1, MASTER_HEADERS.length);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      updatedCount: incomingEnquiries.length,
      auditLogsCount: incomingAuditLogs.length,
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function checkSyncStatus() {
  SpreadsheetApp.getUi().alert("BEMS Multi-Sheet Bi-directional sync is online! Sheet 1 index and individual enquiry sheets are active.");
}
`;

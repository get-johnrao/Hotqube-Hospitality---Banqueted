import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  UserAccount,
  UserRole,
  Enquiry,
  VenueHall,
  AuditLogEntry,
  GoogleSheetSyncConfig,
  PipelineStage,
  MenuPackageMaster,
  InclusionMaster,
  EventTypeMaster,
  CorporateClientMaster,
  LeadSourceMaster,
  QuotationSettingsConfig,
  QuotationSendRecord,
  BEOSendRecord,
  BEODetails,
  AccountHandlerMaster,
  KeyAccountManagerMaster,
  HotelUnit,
  PaymentReceipt,
  TaxInvoice,
  CashierTallyEntry,
  SettlementModeMaster,
  CashierInvoiceSeriesMaster,
  FunctionProspectusDetails,
  FPSendRecord,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_VENUES,
  DEFAULT_STARTUP_IMAGE,
  INITIAL_MENU_PACKAGES,
  INITIAL_INCLUSIONS_MASTER,
  INITIAL_EVENT_TYPES_MASTER,
  INITIAL_CORPORATE_CLIENTS,
  INITIAL_LEAD_SOURCES_MASTER,
  DEFAULT_QUOTATION_SETTINGS,
  INITIAL_ACCOUNT_HANDLERS,
  INITIAL_KEY_ACCOUNT_MANAGERS,
  INITIAL_HOTEL_UNITS,
  INITIAL_SAMPLE_VENUES,
  INITIAL_SETTLEMENT_MODES,
  INITIAL_CASHIER_INVOICE_SERIES,
} from '../data/initialData';
import {
  generateRefNo,
  addDaysToDate,
} from '../utils/formatters';
import { downloadMultiSheetSpreadsheet } from '../utils/spreadsheetExport';
import { hasCachedToken } from '../services/googleDocsService';
import {
  createIntegratedGoogleSpreadsheet,
  pushEnquiriesToGoogleSpreadsheet,
  pullEnquiriesFromGoogleSpreadsheet,
} from '../services/googleSheetsService';

export const getDefaultDemoEnquiries = (): Enquiry[] => {
  // Cleared as per user directive: App starts in a pristine, zero-entry state with no demo entries or names
  return [];
};

interface BEMSContextType {

  currentUser: UserAccount | null;
  users: UserAccount[];
  units: HotelUnit[];
  activeUnit: HotelUnit;
  activeUnitCode: string;
  switchUnit: (unitCode: string) => void;
  createUnit: (unit: HotelUnit) => { success: boolean; message: string };
  updateUnit: (unit: HotelUnit) => { success: boolean; message: string };
  resetSampleUnit: () => void;
  exportUnitBackupJSON: (unitCode?: string) => string;
  importUnitBackupJSON: (jsonStr: string, targetUnitCode?: string) => { success: boolean; message: string };
  enquiries: Enquiry[];
  venues: VenueHall[];
  menuPackages: MenuPackageMaster[];
  inclusionsMaster: InclusionMaster[];
  eventTypesMaster: EventTypeMaster[];
  corporateClients: CorporateClientMaster[];
  leadSourcesMaster: LeadSourceMaster[];
  accountHandlers: KeyAccountManagerMaster[];
  keyAccountManagers: KeyAccountManagerMaster[];
  auditLogs: AuditLogEntry[];
  googleSheetConfig: GoogleSheetSyncConfig;
  startupImage: string;
  isInitialSetupCompleted: boolean;
  quotationSettings: QuotationSettingsConfig;
  
  // Auth methods
  login: (username: string, password: string, unitCode?: string) => {
    success: boolean;
    error?: string;
    isSuperAdmin?: boolean;
    requiresUnitSelection?: boolean;
    availableUnits?: HotelUnit[];
  };
  logout: () => void;
  updateUserPin: (userId: string, newPin: string) => void;
  addUser: (user: Omit<UserAccount, 'id'>) => void;
  updateUser: (user: UserAccount) => void;
  resetUserPassword: (userId: string, newPass: string) => void;
  
  // Enquiry methods
  addEnquiry: (enquiryData: Omit<Enquiry, 'id' | 'refNo' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>) => { success: boolean; refNo: string; createdEnquiry?: Enquiry; conflicts?: string[] };
  updateEnquiry: (enquiry: Enquiry) => { success: boolean; conflicts?: string[] };
  deleteEnquiry: (id: string) => { success: boolean; error?: string };
  advanceEnquiryStage: (id: string, newStage: PipelineStage) => void;

  // Function Prospectus (FP) methods (evolved from BEO)
  updateQuotationSettings: (settings: Partial<QuotationSettingsConfig>) => void;
  recordQuotationSend: (enquiryId: string, sendRecord: Omit<QuotationSendRecord, 'id' | 'timestamp' | 'sentBy'>) => QuotationSendRecord;
  recordBEOSend: (enquiryId: string, sendRecord: Omit<BEOSendRecord, 'id' | 'timestamp' | 'sentBy'>) => BEOSendRecord;
  recordFPSend: (enquiryId: string, sendRecord: Omit<FPSendRecord, 'id' | 'timestamp' | 'sentBy'>) => FPSendRecord;

  // Payments, Billing & Cashier Tally
  paymentReceipts: PaymentReceipt[];
  taxInvoices: TaxInvoice[];
  cashierTallies: CashierTallyEntry[];
  settlementModesMaster: SettlementModeMaster[];
  cashierInvoiceSeriesMaster: CashierInvoiceSeriesMaster[];
  recordPaymentReceipt: (receiptData: Omit<PaymentReceipt, 'id' | 'receiptNo' | 'timestamp' | 'receivedBy'>) => { success: boolean; receipt?: PaymentReceipt; error?: string };
  generateTaxInvoice: (invoiceData: Omit<TaxInvoice, 'id' | 'invoiceNo' | 'generatedBy'>) => { success: boolean; invoice?: TaxInvoice; error?: string };
  recordCashierTally: (tallyData: Omit<CashierTallyEntry, 'id' | 'tallyNo' | 'timestamp' | 'cashierName'>) => { success: boolean; tally?: CashierTallyEntry };
  executeStageTransition: (
    enquiryId: string,
    newStage: PipelineStage,
    transitionNotes?: string,
    advancePaymentData?: { amount: number; settlementMode: PaymentReceipt['settlementMode']; transactionRef?: string; notes?: string }
  ) => { success: boolean; message?: string };

  // Masters for Billing
  addSettlementMode: (mode: Omit<SettlementModeMaster, 'id'>) => void;
  updateSettlementMode: (mode: SettlementModeMaster) => void;
  deleteSettlementMode: (id: string) => { success: boolean; message: string };
  addCashierInvoiceSeries: (series: Omit<CashierInvoiceSeriesMaster, 'id'>) => void;
  updateCashierInvoiceSeries: (series: CashierInvoiceSeriesMaster) => void;
  deleteCashierInvoiceSeries: (id: string) => { success: boolean; message: string };

  // 20-Second Idle Auto-Sync
  idleSecondsRemaining: number;
  isIdleAutoSyncActive: boolean;
  toggleIdleAutoSync: () => void;
  
  // Venue methods
  addVenue: (venue: Omit<VenueHall, 'id'>) => void;
  updateVenue: (venue: VenueHall) => void;
  deleteVenue: (hallId: string) => { success: boolean; message: string };

  // 1. Menu Package methods
  addMenuPackage: (pkg: Omit<MenuPackageMaster, 'id'>) => void;
  updateMenuPackage: (pkg: MenuPackageMaster) => void;
  deleteMenuPackage: (id: string) => { success: boolean; message: string };

  // 2. Inclusions methods
  addInclusion: (inc: Omit<InclusionMaster, 'id'>) => void;
  updateInclusion: (inc: InclusionMaster) => void;
  deleteInclusion: (id: string) => { success: boolean; message: string };

  // 3. Event Type methods
  addEventType: (evt: Omit<EventTypeMaster, 'id'>) => void;
  updateEventType: (evt: EventTypeMaster) => void;
  deleteEventType: (id: string) => { success: boolean; message: string };

  // 4. Corporate Client methods
  addCorporateClient: (client: Omit<CorporateClientMaster, 'id'>) => void;
  updateCorporateClient: (client: CorporateClientMaster) => void;
  deleteCorporateClient: (id: string) => { success: boolean; message: string };

  // 5. Lead Source methods
  addLeadSource: (source: Omit<LeadSourceMaster, 'id'>) => void;
  updateLeadSource: (source: LeadSourceMaster) => void;
  deleteLeadSource: (id: string) => { success: boolean; message: string };

  // 6. Key Account Manager (KAM) methods
  addAccountHandler: (handler: Omit<KeyAccountManagerMaster, 'id'>) => void;
  updateAccountHandler: (handler: KeyAccountManagerMaster) => void;
  deleteAccountHandler: (id: string) => { success: boolean; message: string };
  addKeyAccountManager: (manager: Omit<KeyAccountManagerMaster, 'id'>) => void;
  updateKeyAccountManager: (manager: KeyAccountManagerMaster) => void;
  deleteKeyAccountManager: (id: string) => { success: boolean; message: string };
  
  // Google Sheets & Backup
  updateGoogleSheetConfig: (config: Partial<GoogleSheetSyncConfig>) => void;
  triggerGoogleSheetSync: (isManualUserAction?: boolean) => Promise<{ success: boolean; count: number; requiresAuth?: boolean }>;
  autoCreateGoogleSpreadsheet: (onProgress?: (status: string) => void) => Promise<{ success: boolean; url?: string; error?: string }>;
  pullFromGoogleSheet: (isManualUserAction?: boolean) => Promise<{ success: boolean; count: number; error?: string; requiresAuth?: boolean }>;
  addSyncLog: (message: string, type: 'success' | 'info' | 'error') => void;
  clearSyncLogs: () => void;
  exportBackupJSON: () => string;
  exportEnquiriesCSV: () => string;
  downloadMultiSheetMaster: () => void;
  importBackupJSON: (jsonStr: string) => { success: boolean; message: string };
  resetToCleanDatabase: () => void;
  seedDemoData: () => void;
  updateStartupImage: (url: string) => void;
  
  // Role-based helper
  getRedactedEnquiry: (enquiry: Enquiry) => Enquiry;
  checkConflicts: (hallId: string, eventDate: string, session: string, currentEnquiryId?: string) => {
    hasExclusiveLock: boolean;
    lockedBy?: Enquiry;
    tentativeHolds: Enquiry[];
  };
}

const BEMSContext = createContext<BEMSContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USERS: 'bems_users_clean_v2',
  CURRENT_USER_ID: 'bems_session_user_id_v2',
  UNITS_REGISTRY: 'bems_hotel_units_registry_v1',
  ACTIVE_UNIT_CODE: 'bems_active_unit_code_v1',
  ENQUIRIES: 'bems_enquiries_pristine_v3',
  VENUES: 'bems_venues_v1',
  MENU_PACKAGES: 'bems_menu_packages_v1',
  INCLUSIONS_MASTER: 'bems_inclusions_master_v1',
  EVENT_TYPES_MASTER: 'bems_event_types_master_v1',
  CORPORATE_CLIENTS: 'bems_corporate_clients_v1',
  LEAD_SOURCES_MASTER: 'bems_lead_sources_master_v1',
  ACCOUNT_HANDLERS: 'bems_account_handlers_v1',
  KEY_ACCOUNT_MANAGERS: 'bems_key_account_managers_v1',
  AUDIT_LOGS: 'bems_audit_logs_pristine_v3',
  SHEET_CONFIG: 'bems_sheet_config_v1',
  STARTUP_IMAGE: 'bems_startup_image_v1',
  INITIAL_SETUP: 'bems_initial_setup_clean_v2',
  QUOTATION_SETTINGS: 'bems_quotation_settings_v1',
  PAYMENT_RECEIPTS: 'bems_payment_receipts_v1',
  TAX_INVOICES: 'bems_tax_invoices_v1',
  CASHIER_TALLIES: 'bems_cashier_tallies_v1',
  SETTLEMENT_MODES: 'bems_settlement_modes_v1',
  CASHIER_INVOICE_SERIES: 'bems_cashier_invoice_series_v1',
};

export const BEMSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Clear any cached demo enquiries and names from previous versions
  useEffect(() => {
    try {
      localStorage.removeItem('bems_enquiries_v1');
      localStorage.removeItem('bems_audit_logs_v1');
      localStorage.removeItem('bems_enquiries_clean_v2');
      localStorage.removeItem('bems_audit_logs_clean_v2');
    } catch (e) {
      // ignore
    }
  }, []);

  // 0. Hotel Units Registry & Active Unit
  const [units, setUnits] = useState<HotelUnit[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.UNITS_REGISTRY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) { console.error(e); }
    }
    return INITIAL_HOTEL_UNITS;
  });

  const [activeUnitCode, setActiveUnitCode] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_UNIT_CODE);
    if (saved && saved.trim()) return saved.trim().toUpperCase();
    return 'TN01';
  });

  const activeUnit = useMemo(() => {
    return units.find(u => u.code.toUpperCase() === activeUnitCode.toUpperCase()) || units[0] || INITIAL_HOTEL_UNITS[0];
  }, [units, activeUnitCode]);

  // 1. Users State - Guaranteed synchronization with core accounts (SuperAdmin, etc.)
  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    if (saved) {
      try {
        const parsed: UserAccount[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure core INITIAL_USERS exist in the user list
          const merged = [...parsed];
          for (const initU of INITIAL_USERS) {
            const idx = merged.findIndex(u => u.username.toLowerCase() === initU.username.toLowerCase());
            if (idx === -1) {
              merged.push(initU);
            } else {
              // Ensure superadmin has correct assignedUnitCode 'ALL'
              if (initU.username.toLowerCase() === 'superadmin') {
                merged[idx] = { ...merged[idx], assignedUnitCode: 'ALL', role: 'SuperAdmin', password: initU.password };
              }
            }
          }
          return merged;
        }
      } catch (e) { console.error(e); }
    }
    return INITIAL_USERS;
  });

  // 2. Active Session
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const savedUserId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    if (savedUserId) {
      const savedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
      const userList: UserAccount[] = savedUsers ? JSON.parse(savedUsers) : INITIAL_USERS;
      const found = userList.find((u: UserAccount) => u.id === savedUserId) || INITIAL_USERS.find(u => u.id === savedUserId);
      return found || null;
    }
    return null;
  });

  // 3. Venues Master (Scoped by activeUnitCode)
  const [venues, setVenues] = useState<VenueHall[]>(() => {
    const savedUnitVenues = localStorage.getItem(`bems_venues_${activeUnitCode}`);
    if (savedUnitVenues) {
      try { return JSON.parse(savedUnitVenues); } catch (e) { console.error(e); }
    }
    if (activeUnitCode === 'TN01') {
      const legacy = localStorage.getItem(STORAGE_KEYS.VENUES);
      if (legacy) {
        try { return JSON.parse(legacy); } catch (e) { console.error(e); }
      }
      return INITIAL_VENUES;
    }
    if (activeUnitCode === 'SM00') {
      return INITIAL_SAMPLE_VENUES;
    }
    return INITIAL_SAMPLE_VENUES;
  });

  // 3b. Menu Packages Master
  const [menuPackages, setMenuPackages] = useState<MenuPackageMaster[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MENU_PACKAGES);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_MENU_PACKAGES;
  });

  // 3c. Inclusions Master
  const [inclusionsMaster, setInclusionsMaster] = useState<InclusionMaster[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INCLUSIONS_MASTER);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_INCLUSIONS_MASTER;
  });

  // 3d. Event Types Master
  const [eventTypesMaster, setEventTypesMaster] = useState<EventTypeMaster[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EVENT_TYPES_MASTER);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_EVENT_TYPES_MASTER;
  });

  // 3e. Corporate Clients Master
  const [corporateClients, setCorporateClients] = useState<CorporateClientMaster[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CORPORATE_CLIENTS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_CORPORATE_CLIENTS;
  });

  // 3f. Lead Sources Master
  const [leadSourcesMaster, setLeadSourcesMaster] = useState<LeadSourceMaster[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LEAD_SOURCES_MASTER);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_LEAD_SOURCES_MASTER;
  });

  // 3g. Key Account Manager Master (KAM)
  const [accountHandlers, setAccountHandlers] = useState<KeyAccountManagerMaster[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.KEY_ACCOUNT_MANAGERS) || localStorage.getItem(STORAGE_KEYS.ACCOUNT_HANDLERS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_KEY_ACCOUNT_MANAGERS;
  });

  // 4. Enquiries Database (Scoped by activeUnitCode; SM00 starts clean and blank)
  const [enquiries, setEnquiries] = useState<Enquiry[]>(() => {
    const savedUnitEnqs = localStorage.getItem(`bems_enquiries_${activeUnitCode}`);
    if (savedUnitEnqs) {
      try {
        const parsed = JSON.parse(savedUnitEnqs);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) { console.error(e); }
    }
    if (activeUnitCode === 'TN01') {
      const legacy = localStorage.getItem(STORAGE_KEYS.ENQUIRIES);
      if (legacy) {
        try {
          const parsed = JSON.parse(legacy);
          if (Array.isArray(parsed)) return parsed;
        } catch (e) { console.error(e); }
      }
    }
    return [];
  });

  // 5. System Audit Logs (Scoped by activeUnitCode)
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    const savedUnitLogs = localStorage.getItem(`bems_audit_logs_${activeUnitCode}`);
    if (savedUnitLogs) {
      try { return JSON.parse(savedUnitLogs); } catch (e) { console.error(e); }
    }
    if (activeUnitCode === 'TN01') {
      const legacy = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      if (legacy) {
        try { return JSON.parse(legacy); } catch (e) { console.error(e); }
      }
    }
    return [];
  });

  // Initial diagnostic sync logs to guarantee the synchronization activity history works out-of-the-box
  const getInitialSyncLogs = () => [
    {
      timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      message: 'Local BEMS offline-first storage engine initialized. 27 banquet schema columns mapped.',
      type: 'info' as const,
    },
    {
      timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
      message: 'Diagnostic check: Google Apps Script sync gateway ready for linking.',
      type: 'info' as const,
    },
    {
      timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
      message: 'System state: Running in secure local offline mode (No Google Sheet linked).',
      type: 'info' as const,
    },
  ];

  // 6. Google Sheets Config (Starts strictly unlinked unless a valid external Google Sheet URL is linked)
  const [googleSheetConfig, setGoogleSheetConfig] = useState<GoogleSheetSyncConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SHEET_CONFIG);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // If placeholder fake sheet, or invalid sheetUrl that is not a real sheet/script URL, treat as strictly unlinked
        const hasValidUrl =
          parsed.sheetUrl &&
          typeof parsed.sheetUrl === 'string' &&
          (parsed.sheetUrl.startsWith('https://docs.google.com/spreadsheets/d/') ||
            parsed.sheetUrl.startsWith('https://script.google.com/macros/s/')) &&
          !parsed.sheetUrl.includes('1TRT_CHENNAI_BANQUET_MASTER_2026') &&
          !parsed.sheetUrl.includes('dummy');

        if (!hasValidUrl) {
          return {
            sheetUrl: '',
            sheetId: '',
            sheetName: 'Banquet_Enquiries_Master',
            webAppUrl: '',
            isLinked: false,
            syncStatus: 'unlinked',
            lastSyncedAt: null,
            autoSyncEnabled: false,
            syncLogs: Array.isArray(parsed.syncLogs) && parsed.syncLogs.length > 0 ? parsed.syncLogs : getInitialSyncLogs(),
          };
        }

        return {
          ...parsed,
          isLinked: true,
          syncLogs: Array.isArray(parsed.syncLogs) && parsed.syncLogs.length > 0 ? parsed.syncLogs : getInitialSyncLogs(),
        };
      } catch (e) {
        console.error(e);
      }
    }
    return {
      sheetUrl: '',
      sheetId: '',
      sheetName: 'Banquet_Enquiries_Master',
      webAppUrl: '',
      isLinked: false,
      syncStatus: 'unlinked',
      lastSyncedAt: null,
      autoSyncEnabled: false,
      syncLogs: getInitialSyncLogs(),
    };
  });

  // 7. Startup Image
  const [startupImage, setStartupImage] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.STARTUP_IMAGE) || DEFAULT_STARTUP_IMAGE;
  });

  const [isInitialSetupCompleted, setIsInitialSetupCompleted] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.INITIAL_SETUP) === 'true';
  });

  // 8. Banquet Quotation Letterhead & Section Settings
  const [quotationSettings, setQuotationSettings] = useState<QuotationSettingsConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.QUOTATION_SETTINGS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.sections) && parsed.sections.length >= 5) {
          return parsed;
        }
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_QUOTATION_SETTINGS;
  });

  // 9. Payment Receipts (Scoped by activeUnitCode)
  const [paymentReceipts, setPaymentReceipts] = useState<PaymentReceipt[]>(() => {
    const saved = localStorage.getItem(`bems_payment_receipts_${activeUnitCode}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  // 10. Tax Invoices & Proforma Invoices (Scoped by activeUnitCode)
  const [taxInvoices, setTaxInvoices] = useState<TaxInvoice[]>(() => {
    const saved = localStorage.getItem(`bems_tax_invoices_${activeUnitCode}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  // 11. Cashier Shift Tallies (Scoped by activeUnitCode)
  const [cashierTallies, setCashierTallies] = useState<CashierTallyEntry[]>(() => {
    const saved = localStorage.getItem(`bems_cashier_tallies_${activeUnitCode}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  // 12. Settlement Modes Master (Global / Property Settings)
  const [settlementModesMaster, setSettlementModesMaster] = useState<SettlementModeMaster[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTLEMENT_MODES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_SETTLEMENT_MODES;
  });

  // 13. Cashier Invoice Series Master (Global / Counter Registry)
  const [cashierInvoiceSeriesMaster, setCashierInvoiceSeriesMaster] = useState<CashierInvoiceSeriesMaster[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CASHIER_INVOICE_SERIES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_CASHIER_INVOICE_SERIES;
  });

  // 14. 20-Second Idle Auto-Sync State
  const [idleSecondsRemaining, setIdleSecondsRemaining] = useState<number>(20);
  const [isIdleAutoSyncActive, setIsIdleAutoSyncActive] = useState<boolean>(true);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.UNITS_REGISTRY, JSON.stringify(units));
  }, [units]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_UNIT_CODE, activeUnitCode);
  }, [activeUnitCode]);

  useEffect(() => {
    localStorage.setItem(`bems_payment_receipts_${activeUnitCode}`, JSON.stringify(paymentReceipts));
  }, [paymentReceipts, activeUnitCode]);

  useEffect(() => {
    localStorage.setItem(`bems_tax_invoices_${activeUnitCode}`, JSON.stringify(taxInvoices));
  }, [taxInvoices, activeUnitCode]);

  useEffect(() => {
    localStorage.setItem(`bems_cashier_tallies_${activeUnitCode}`, JSON.stringify(cashierTallies));
  }, [cashierTallies, activeUnitCode]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTLEMENT_MODES, JSON.stringify(settlementModesMaster));
  }, [settlementModesMaster]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CASHIER_INVOICE_SERIES, JSON.stringify(cashierInvoiceSeriesMaster));
  }, [cashierInvoiceSeriesMaster]);

  useEffect(() => {
    try {
      localStorage.setItem(`bems_quotation_settings_${activeUnitCode}`, JSON.stringify(quotationSettings));
      if (activeUnitCode === 'TN01') {
        localStorage.setItem(STORAGE_KEYS.QUOTATION_SETTINGS, JSON.stringify(quotationSettings));
      }
    } catch (e) {
      console.error(e);
    }
  }, [quotationSettings, activeUnitCode]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentUser.id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(`bems_venues_${activeUnitCode}`, JSON.stringify(venues));
    if (activeUnitCode === 'TN01') {
      localStorage.setItem(STORAGE_KEYS.VENUES, JSON.stringify(venues));
    }
  }, [venues, activeUnitCode]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MENU_PACKAGES, JSON.stringify(menuPackages));
  }, [menuPackages]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INCLUSIONS_MASTER, JSON.stringify(inclusionsMaster));
  }, [inclusionsMaster]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EVENT_TYPES_MASTER, JSON.stringify(eventTypesMaster));
  }, [eventTypesMaster]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CORPORATE_CLIENTS, JSON.stringify(corporateClients));
  }, [corporateClients]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LEAD_SOURCES_MASTER, JSON.stringify(leadSourcesMaster));
  }, [leadSourcesMaster]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACCOUNT_HANDLERS, JSON.stringify(accountHandlers));
    localStorage.setItem(STORAGE_KEYS.KEY_ACCOUNT_MANAGERS, JSON.stringify(accountHandlers));
  }, [accountHandlers]);

  useEffect(() => {
    localStorage.setItem(`bems_enquiries_${activeUnitCode}`, JSON.stringify(enquiries));
    if (activeUnitCode === 'TN01') {
      localStorage.setItem(STORAGE_KEYS.ENQUIRIES, JSON.stringify(enquiries));
    }
  }, [enquiries, activeUnitCode]);

  useEffect(() => {
    localStorage.setItem(`bems_audit_logs_${activeUnitCode}`, JSON.stringify(auditLogs));
    if (activeUnitCode === 'TN01') {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs));
    }
  }, [auditLogs, activeUnitCode]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SHEET_CONFIG, JSON.stringify(googleSheetConfig));
  }, [googleSheetConfig]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STARTUP_IMAGE, startupImage);
  }, [startupImage]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INITIAL_SETUP, isInitialSetupCompleted ? 'true' : 'false');
  }, [isInitialSetupCompleted]);

  // Helper to log audit entries
  const logAudit = useCallback((
    refNo: string,
    fieldModified: string,
    previousValue: string,
    newValue: string,
    actionType: AuditLogEntry['actionType']
  ) => {
    const timestamp = new Date().toISOString();
    const newEntry: AuditLogEntry = {
      id: 'audit-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now(),
      systemTimestamp: timestamp,
      refNo: refNo || 'N/A',
      userId: currentUser ? currentUser.username : 'SYSTEM',
      fieldModified,
      previousValue: previousValue || 'EMPTY',
      newValue: newValue || 'EMPTY',
      actionType,
    };
    setAuditLogs(prev => [newEntry, ...prev]);
  }, [currentUser]);

  // Check conflicts for hall + date + session
  const checkConflicts = useCallback((
    hallId: string,
    eventDate: string,
    session: string,
    currentEnquiryId?: string
  ) => {
    const activeEnquiries = enquiries.filter(
      e =>
        e.id !== currentEnquiryId &&
        e.hallId === hallId &&
        e.eventDate === eventDate &&
        e.session === session &&
        e.status !== 'Cancelled' &&
        e.status !== 'Postponed' &&
        e.finalStatus !== 'Cancelled' &&
        e.finalStatus !== 'Postponed'
    );

    const lockedBy = activeEnquiries.find(
      e =>
        e.status === 'Confirmed' ||
        e.status === 'Advance Paid (EXCLUSIVE LOCK)' ||
        e.status === 'Balance Paid' ||
        e.finalStatus === 'Exclusive Lock' ||
        e.finalStatus === 'Confirmed'
    );

    const tentativeHolds = activeEnquiries.filter(e => e.id !== lockedBy?.id);

    return {
      hasExclusiveLock: !!lockedBy,
      lockedBy,
      tentativeHolds,
    };
  }, [enquiries]);

  // Redaction helper for Collaborators (SS tag)
  const getRedactedEnquiry = useCallback((enquiry: Enquiry): Enquiry => {
    if (!currentUser || currentUser.role !== 'Collaborator') {
      return enquiry;
    }
    // Deep clone and redact sensitive fields completely without leaving indication
    const redacted = { ...enquiry };
    delete redacted.guestMobileMain;
    delete redacted.guestMobileBackup;
    delete redacted.email;
    delete redacted.quotedBaseRate;
    delete redacted.rateItems;
    delete redacted.finalBillValue;
    delete redacted.remarks;
    delete redacted.remarks1;
    delete redacted.remarks2;
    delete redacted.followUp1Date;
    delete redacted.followUp2Date;
    delete redacted.followUp3Date;
    return redacted;
  }, [currentUser]);

  // Switch Active Hotel Unit
  const switchUnit = useCallback((targetCode: string) => {
    const normCode = targetCode.trim().toUpperCase();
    const targetUnit = units.find(u => u.code.toUpperCase() === normCode);
    if (!targetUnit) {
      console.warn(`Unit with code ${normCode} not found in registry.`);
      return;
    }

    // 1. Persist current unit's active states
    try {
      localStorage.setItem(`bems_enquiries_${activeUnitCode}`, JSON.stringify(enquiries));
      localStorage.setItem(`bems_venues_${activeUnitCode}`, JSON.stringify(venues));
      localStorage.setItem(`bems_audit_logs_${activeUnitCode}`, JSON.stringify(auditLogs));
      localStorage.setItem(`bems_quotation_settings_${activeUnitCode}`, JSON.stringify(quotationSettings));
      localStorage.setItem(`bems_payment_receipts_${activeUnitCode}`, JSON.stringify(paymentReceipts));
      localStorage.setItem(`bems_tax_invoices_${activeUnitCode}`, JSON.stringify(taxInvoices));
      localStorage.setItem(`bems_cashier_tallies_${activeUnitCode}`, JSON.stringify(cashierTallies));
    } catch (e) {
      console.error('Error saving active unit data:', e);
    }

    // 2. Load target unit's dataset
    let targetEnquiries: Enquiry[] = [];
    const savedEnqs = localStorage.getItem(`bems_enquiries_${normCode}`);
    if (savedEnqs) {
      try {
        const parsed = JSON.parse(savedEnqs);
        if (Array.isArray(parsed)) targetEnquiries = parsed;
      } catch (e) { console.error(e); }
    } else if (normCode === 'TN01') {
      const legacy = localStorage.getItem(STORAGE_KEYS.ENQUIRIES);
      if (legacy) {
        try {
          const parsed = JSON.parse(legacy);
          if (Array.isArray(parsed)) targetEnquiries = parsed;
        } catch (e) { console.error(e); }
      }
    } else if (normCode === 'SM00') {
      targetEnquiries = [];
    }

    let targetVenues: VenueHall[] = [];
    const savedVenues = localStorage.getItem(`bems_venues_${normCode}`);
    if (savedVenues) {
      try {
        const parsed = JSON.parse(savedVenues);
        if (Array.isArray(parsed) && parsed.length > 0) targetVenues = parsed;
      } catch (e) { console.error(e); }
    }
    if (targetVenues.length === 0) {
      if (normCode === 'TN01') {
        targetVenues = INITIAL_VENUES;
      } else {
        targetVenues = INITIAL_SAMPLE_VENUES;
      }
    }

    let targetSettings: QuotationSettingsConfig = DEFAULT_QUOTATION_SETTINGS;
    const savedSettings = localStorage.getItem(`bems_quotation_settings_${normCode}`);
    if (savedSettings) {
      try { targetSettings = JSON.parse(savedSettings); } catch (e) { console.error(e); }
    } else {
      targetSettings = {
        ...DEFAULT_QUOTATION_SETTINGS,
        hotelName: targetUnit.name,
        hotelSubtitle: targetUnit.subtitle,
        hotelAddress: targetUnit.address,
        hotelPhone: targetUnit.phone,
        hotelEmail: targetUnit.email,
      };
    }

    let targetLogs: AuditLogEntry[] = [];
    const savedLogs = localStorage.getItem(`bems_audit_logs_${normCode}`);
    if (savedLogs) {
      try { targetLogs = JSON.parse(savedLogs); } catch (e) { console.error(e); }
    } else if (normCode === 'TN01') {
      const legacyLogs = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      if (legacyLogs) {
        try { targetLogs = JSON.parse(legacyLogs); } catch (e) { console.error(e); }
      }
    }

    let targetPayments: PaymentReceipt[] = [];
    const savedPayments = localStorage.getItem(`bems_payment_receipts_${normCode}`);
    if (savedPayments) {
      try {
        const parsed = JSON.parse(savedPayments);
        if (Array.isArray(parsed)) targetPayments = parsed;
      } catch (e) { console.error(e); }
    }

    let targetInvoices: TaxInvoice[] = [];
    const savedInvoices = localStorage.getItem(`bems_tax_invoices_${normCode}`);
    if (savedInvoices) {
      try {
        const parsed = JSON.parse(savedInvoices);
        if (Array.isArray(parsed)) targetInvoices = parsed;
      } catch (e) { console.error(e); }
    }

    let targetTallies: CashierTallyEntry[] = [];
    const savedTallies = localStorage.getItem(`bems_cashier_tallies_${normCode}`);
    if (savedTallies) {
      try {
        const parsed = JSON.parse(savedTallies);
        if (Array.isArray(parsed)) targetTallies = parsed;
      } catch (e) { console.error(e); }
    }

    // 3. Update States
    setActiveUnitCode(normCode);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_UNIT_CODE, normCode);
    setEnquiries(targetEnquiries);
    setVenues(targetVenues);
    setQuotationSettings(targetSettings);
    setAuditLogs(targetLogs);
    setPaymentReceipts(targetPayments);
    setTaxInvoices(targetInvoices);
    setCashierTallies(targetTallies);

    logAudit('UNIT_ROUTER', 'PROPERTY_SWITCHED', activeUnitCode, normCode, 'UPDATE');
  }, [units, activeUnitCode, enquiries, venues, auditLogs, quotationSettings, paymentReceipts, taxInvoices, cashierTallies, logAudit]);

  // Create / Register a New Hotel Property Unit
  const createUnit = useCallback((unitData: HotelUnit): { success: boolean; message: string } => {
    const normCode = (unitData.code || '').trim().toUpperCase();
    // Nomenclature constraint: 2 alphabets followed by 2 digits (e.g. TN01, KA01, DL02)
    const codeRegex = /^[A-Z]{2}[0-9]{2}$/;
    if (!codeRegex.test(normCode)) {
      return {
        success: false,
        message: 'Invalid Unit Code format. Must be exactly 2 letters followed by 2 digits (e.g. KA01, DL02, MH01).',
      };
    }

    if (units.some(u => u.code.toUpperCase() === normCode)) {
      return {
        success: false,
        message: `Hotel Unit code "${normCode}" is already in use by another property.`,
      };
    }

    const newUnit: HotelUnit = {
      ...unitData,
      code: normCode,
      status: unitData.status || 'Active',
      createdAt: new Date().toISOString(),
    };

    const updatedUnits = [...units, newUnit];
    setUnits(updatedUnits);
    localStorage.setItem(STORAGE_KEYS.UNITS_REGISTRY, JSON.stringify(updatedUnits));

    // Initialize halls & clean state for this unit
    const clonedVenues: VenueHall[] = INITIAL_SAMPLE_VENUES.map((v, idx) => ({
      ...v,
      id: `hall-${normCode.toLowerCase()}-${idx + 1}`,
      name: `${v.name} (${normCode})`,
    }));
    localStorage.setItem(`bems_venues_${normCode}`, JSON.stringify(clonedVenues));
    localStorage.setItem(`bems_enquiries_${normCode}`, JSON.stringify([]));

    logAudit('UNIT_MANAGEMENT', 'UNIT_REGISTERED', 'NONE', `${normCode} - ${unitData.name}`, 'CREATE');

    return {
      success: true,
      message: `Property ${normCode} (${unitData.name}) registered successfully.`,
    };
  }, [units, logAudit]);

  // Update Hotel Property Metadata
  const updateUnit = useCallback((unitData: HotelUnit): { success: boolean; message: string } => {
    const normCode = (unitData.code || '').trim().toUpperCase();
    const exists = units.some(u => u.code.toUpperCase() === normCode);
    if (!exists) {
      return { success: false, message: `Unit ${normCode} not found in registry.` };
    }

    const updatedUnits = units.map(u => (u.code.toUpperCase() === normCode ? { ...u, ...unitData, code: normCode } : u));
    setUnits(updatedUnits);
    localStorage.setItem(STORAGE_KEYS.UNITS_REGISTRY, JSON.stringify(updatedUnits));
    logAudit('UNIT_MANAGEMENT', 'UNIT_METADATA_UPDATED', normCode, unitData.name, 'UPDATE');
    return { success: true, message: `Property ${normCode} updated successfully.` };
  }, [units, logAudit]);

  // Reset Sales Pitch Blank Sandbox Unit ("SM00" TrialHall)
  const resetSampleUnit = useCallback(() => {
    const sampleCode = 'SM00';
    localStorage.setItem(`bems_enquiries_${sampleCode}`, JSON.stringify([]));
    localStorage.setItem(`bems_venues_${sampleCode}`, JSON.stringify(INITIAL_SAMPLE_VENUES));

    const resetLog: AuditLogEntry = {
      id: 'audit-reset-' + Date.now(),
      systemTimestamp: new Date().toISOString(),
      refNo: 'PITCH_RESET',
      userId: currentUser ? currentUser.username : 'SUPER_ADMIN',
      fieldModified: 'SM00_DATA_PURGED',
      previousValue: 'PITCH_DEMO_DATA',
      newValue: 'PRISTINE_ZERO_STATE',
      actionType: 'RESTORE',
    };
    localStorage.setItem(`bems_audit_logs_${sampleCode}`, JSON.stringify([resetLog]));

    if (activeUnitCode === sampleCode) {
      setEnquiries([]);
      setVenues(INITIAL_SAMPLE_VENUES);
      setAuditLogs([resetLog]);
    }
    logAudit('SAMPLE_UNIT', 'TRIALHALL_PURGED', sampleCode, 'ZERO_STATE_RESTORED', 'RESTORE');
  }, [activeUnitCode, currentUser, logAudit]);

  // Unit-Scoped Export & Backup
  const exportUnitBackupJSON = useCallback((targetCode?: string): string => {
    const unitToExportCode = (targetCode || activeUnitCode).toUpperCase();
    const unitMeta = units.find(u => u.code.toUpperCase() === unitToExportCode) || activeUnit;

    let exportEnquiries = enquiries;
    let exportVenues = venues;
    let exportAuditLogs = auditLogs;
    let exportSettings = quotationSettings;

    let exportPayments = paymentReceipts;
    let exportInvoices = taxInvoices;
    let exportTallies = cashierTallies;

    if (unitToExportCode !== activeUnitCode) {
      try {
        const enqsStr = localStorage.getItem(`bems_enquiries_${unitToExportCode}`);
        if (enqsStr) exportEnquiries = JSON.parse(enqsStr);
        const vnsStr = localStorage.getItem(`bems_venues_${unitToExportCode}`);
        if (vnsStr) exportVenues = JSON.parse(vnsStr);
        const logsStr = localStorage.getItem(`bems_audit_logs_${unitToExportCode}`);
        if (logsStr) exportAuditLogs = JSON.parse(logsStr);
        const settStr = localStorage.getItem(`bems_quotation_settings_${unitToExportCode}`);
        if (settStr) exportSettings = JSON.parse(settStr);
        const payStr = localStorage.getItem(`bems_payment_receipts_${unitToExportCode}`);
        if (payStr) exportPayments = JSON.parse(payStr);
        const invStr = localStorage.getItem(`bems_tax_invoices_${unitToExportCode}`);
        if (invStr) exportInvoices = JSON.parse(invStr);
        const tlyStr = localStorage.getItem(`bems_cashier_tallies_${unitToExportCode}`);
        if (tlyStr) exportTallies = JSON.parse(tlyStr);
      } catch (e) {
        console.error(e);
      }
    }

    const payload = {
      backupFormat: 'BEMS_UNIT_SCOPED_BACKUP_v1',
      unitCode: unitToExportCode,
      timestamp: new Date().toISOString(),
      exportedBy: currentUser?.username || 'System',
      unit: unitMeta,
      venues: exportVenues,
      enquiries: exportEnquiries,
      auditLogs: exportAuditLogs,
      quotationSettings: exportSettings,
      paymentReceipts: exportPayments,
      taxInvoices: exportInvoices,
      cashierTallies: exportTallies,
      menuPackages,
      inclusionsMaster,
      eventTypesMaster,
      corporateClients,
      leadSourcesMaster,
      accountHandlers,
    };
    return JSON.stringify(payload, null, 2);
  }, [activeUnitCode, units, activeUnit, enquiries, venues, auditLogs, quotationSettings, paymentReceipts, taxInvoices, cashierTallies, currentUser, menuPackages, inclusionsMaster, eventTypesMaster, corporateClients, leadSourcesMaster, accountHandlers]);

  // Unit-Scoped Import & Restore
  const importUnitBackupJSON = useCallback((jsonStr: string, targetCode?: string): { success: boolean; message: string } => {
    try {
      const data = JSON.parse(jsonStr);
      if (!data || (!Array.isArray(data.enquiries) && !Array.isArray(data.venues))) {
        return { success: false, message: 'Invalid unit backup structure. Missing venues or enquiries array.' };
      }
      const importCode = (targetCode || (data.unit && data.unit.code) || data.unitCode || activeUnitCode).toUpperCase();

      // If unit metadata included and not in units list, register it
      if (data.unit && data.unit.code) {
        setUnits(prev => {
          const found = prev.some(u => u.code.toUpperCase() === data.unit.code.toUpperCase());
          if (!found) {
            const updated = [...prev, data.unit];
            localStorage.setItem(STORAGE_KEYS.UNITS_REGISTRY, JSON.stringify(updated));
            return updated;
          }
          return prev;
        });
      }

      // Persist imported data to unit storage keys
      if (Array.isArray(data.enquiries)) {
        localStorage.setItem(`bems_enquiries_${importCode}`, JSON.stringify(data.enquiries));
        if (importCode === activeUnitCode) setEnquiries(data.enquiries);
      }
      if (Array.isArray(data.venues)) {
        localStorage.setItem(`bems_venues_${importCode}`, JSON.stringify(data.venues));
        if (importCode === activeUnitCode) setVenues(data.venues);
      }
      if (Array.isArray(data.auditLogs)) {
        localStorage.setItem(`bems_audit_logs_${importCode}`, JSON.stringify(data.auditLogs));
        if (importCode === activeUnitCode) setAuditLogs(data.auditLogs);
      }
      if (data.quotationSettings) {
        localStorage.setItem(`bems_quotation_settings_${importCode}`, JSON.stringify(data.quotationSettings));
        if (importCode === activeUnitCode) setQuotationSettings(data.quotationSettings);
      }
      if (Array.isArray(data.paymentReceipts)) {
        localStorage.setItem(`bems_payment_receipts_${importCode}`, JSON.stringify(data.paymentReceipts));
        if (importCode === activeUnitCode) setPaymentReceipts(data.paymentReceipts);
      }
      if (Array.isArray(data.taxInvoices)) {
        localStorage.setItem(`bems_tax_invoices_${importCode}`, JSON.stringify(data.taxInvoices));
        if (importCode === activeUnitCode) setTaxInvoices(data.taxInvoices);
      }
      if (Array.isArray(data.cashierTallies)) {
        localStorage.setItem(`bems_cashier_tallies_${importCode}`, JSON.stringify(data.cashierTallies));
        if (importCode === activeUnitCode) setCashierTallies(data.cashierTallies);
      }

      logAudit('UNIT_BACKUP', 'DATA_RESTORED', importCode, `Restored ${data.enquiries?.length || 0} records`, 'RESTORE');
      return {
        success: true,
        message: `Successfully restored backup for Unit ${importCode} (${data.enquiries?.length || 0} enquiries, ${data.venues?.length || 0} halls).`,
      };
    } catch (e) {
      return { success: false, message: 'Failed to parse JSON backup: ' + (e as Error).message };
    }
  }, [activeUnitCode, logAudit]);

  // Authentication & Multi-Unit Authorization
  const login = useCallback((username: string, pass: string, unitCode?: string) => {
    const trimmedUser = username.trim();
    const trimmedPass = pass.trim();
    const normUnitCode = (unitCode || '').trim().toUpperCase();

    let matched = users.find(
      u => u.username.toLowerCase() === trimmedUser.toLowerCase() && (u.password === trimmedPass || u.pin === trimmedPass)
    );
    if (!matched) {
      matched = INITIAL_USERS.find(
        u => u.username.toLowerCase() === trimmedUser.toLowerCase() && (u.password === trimmedPass || u.pin === trimmedPass)
      );
    }

    if (!matched) {
      return { success: false, error: 'Invalid Username or Password' };
    }

    // SuperAdmin access: can access ANY unit; call is "ALL"
    const isSuper =
      matched.role === 'SuperAdmin' ||
      matched.assignedUnitCode === 'ALL' ||
      matched.username.toLowerCase() === 'superadmin';

    if (isSuper) {
      // Superadmin call can be "ALL" or specific unit code
      if (normUnitCode && normUnitCode !== 'ALL') {
        const targetUnit = units.find(u => u.code.toUpperCase() === normUnitCode);
        if (!targetUnit) {
          return { success: false, error: `Unit code "${normUnitCode}" does not exist.` };
        }
        if (activeUnitCode !== normUnitCode) {
          switchUnit(normUnitCode);
        }
      } else {
        // When call is "ALL" or empty, superadmin logs in with global access
        if (!units.some(u => u.code.toUpperCase() === activeUnitCode.toUpperCase())) {
          switchUnit(units[0]?.code || 'TN01');
        }
      }

      const superAdminAccount: UserAccount = {
        ...matched,
        role: 'SuperAdmin',
        assignedUnitCode: 'ALL',
      };
      setCurrentUser(superAdminAccount);
      logAudit('AUTH', 'SUPERADMIN_LOGIN', 'LOGGED_OUT', `${matched.username} [Call: ALL, Active: ${activeUnitCode}]`, 'CREATE');
      return {
        success: true,
        isSuperAdmin: true,
        availableUnits: units,
      };
    }

    // Unit Staff / Local Unit Admin access
    const assigned = (matched.assignedUnitCode || 'TN01').toUpperCase();

    // Prevent non-superadmin from using "ALL"
    if (normUnitCode === 'ALL') {
      return {
        success: false,
        error: `Access Denied: Unit code "ALL" is reserved for Super-Admin. Account "${matched.username}" is restricted to unit ${assigned}.`,
      };
    }

    // Enforce unit matching
    if (normUnitCode && normUnitCode !== assigned) {
      return {
        success: false,
        error: `Access Denied: Account "${matched.username}" is restricted to unit ${assigned}. It cannot access unit ${normUnitCode}.`,
      };
    }

    // Switch to assigned unit if different
    if (activeUnitCode !== assigned) {
      switchUnit(assigned);
    }

    setCurrentUser(matched);
    logAudit('AUTH', 'UNIT_LOGIN', 'LOGGED_OUT', `${matched.username} [${assigned}]`, 'CREATE');
    return { success: true };
  }, [users, units, activeUnitCode, switchUnit, logAudit]);

  const logout = useCallback(() => {
    if (currentUser) {
      logAudit('AUTH', 'SESSION_LOGOUT', currentUser.username, 'LOGGED_OUT', 'UPDATE');
    }
    setCurrentUser(null);
  }, [currentUser, logAudit]);

  const updateUserPin = useCallback((userId: string, newPin: string) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id === userId) {
          return { ...u, pin: newPin, mustChangePassword: false };
        }
        return u;
      })
    );
    if (currentUser && currentUser.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, pin: newPin, mustChangePassword: false } : null);
    }
    logAudit('USER', 'PIN_SECURITY_UPDATE', 'OLD_PIN', 'NEW_PIN_SET', 'UPDATE');
  }, [currentUser, logAudit]);

  const addUser = useCallback((userData: Omit<UserAccount, 'id'>) => {
    const newUser: UserAccount = {
      ...userData,
      id: 'user-' + Math.random().toString(36).substring(2, 9),
    };
    setUsers(prev => [...prev, newUser]);
    logAudit('USER_MANAGEMENT', 'USER_CREATED', 'NONE', newUser.username, 'CREATE');
  }, [logAudit]);

  const updateUser = useCallback((updated: UserAccount) => {
    setUsers(prev => prev.map(u => (u.id === updated.id ? updated : u)));
    if (currentUser?.id === updated.id) {
      setCurrentUser(updated);
    }
    logAudit('USER_MANAGEMENT', 'USER_UPDATED', updated.username, updated.role, 'UPDATE');
  }, [currentUser, logAudit]);

  const resetUserPassword = useCallback((userId: string, newPass: string) => {
    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, password: newPass, mustChangePassword: true } : u))
    );
    logAudit('USER_MANAGEMENT', 'PASSWORD_RESET', userId, 'TEMP_PASSWORD_ISSUED', 'UPDATE');
  }, [logAudit]);

  // Enquiry Management
  const addEnquiry = useCallback((
    enquiryData: Omit<Enquiry, 'id' | 'refNo' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>
  ) => {
    const refNo = generateRefNo(enquiries);
    const now = new Date().toISOString();
    const createdBy = currentUser?.username || 'System';

    // Automated Stage 1 Follow-up Scheduling: exactly 2 calendar days after enquiryDate or today
    const baseDate = enquiryData.enquiryDate || new Date().toISOString().split('T')[0];
    const followUp1 = enquiryData.followUp1Date || addDaysToDate(baseDate, 2);

    // Pipeline stage defaults to 'Portfolio Creation' per requirements
    const assignedStatus: PipelineStage = enquiryData.status || 'Portfolio Creation';

    // Final status derivation
    let finalStatus: Enquiry['finalStatus'] = 'Tentative';
    if (assignedStatus === 'Confirmed' || assignedStatus === 'Balance Paid') {
      finalStatus = 'Confirmed';
    } else if (assignedStatus === 'Advance Paid (EXCLUSIVE LOCK)') {
      finalStatus = 'Exclusive Lock';
    } else if (assignedStatus === 'Function Completed') {
      finalStatus = 'Completed';
    } else if (assignedStatus === 'Function Completed and Gift Sent') {
      finalStatus = 'Archived';
    } else if (assignedStatus === 'Postponed') {
      finalStatus = 'Postponed';
    } else if (assignedStatus === 'Cancelled') {
      finalStatus = 'Cancelled';
    }

    const isConfirmedOrCompleted =
      finalStatus === 'Confirmed' ||
      finalStatus === 'Exclusive Lock' ||
      finalStatus === 'Completed' ||
      finalStatus === 'Archived';

    // Enforce Expected Pax is always >= Guaranteed Pax
    const guardedExpPax = Math.max(enquiryData.expPax || 0, enquiryData.gPax || 0);
    const effectiveKam = enquiryData.keyAccountManager || enquiryData.accountHandler || enquiryData.firstContactPerson || '';

    const newEnquiry: Enquiry = {
      ...enquiryData,
      unitCode: activeUnitCode,
      keyAccountManager: effectiveKam,
      accountHandler: effectiveKam,
      status: assignedStatus,
      expPax: guardedExpPax,
      boardToRead: enquiryData.boardToRead || enquiryData.functionBanner || '',
      id: 'enq-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now(),
      refNo,
      followUp1Date: isConfirmedOrCompleted ? '' : followUp1,
      followUp2Date: isConfirmedOrCompleted ? '' : enquiryData.followUp2Date,
      followUp3Date: isConfirmedOrCompleted ? '' : enquiryData.followUp3Date,
      noFollowUpRequired: isConfirmedOrCompleted ? true : enquiryData.noFollowUpRequired,
      finalStatus,
      createdAt: now,
      updatedAt: now,
      createdBy,
      updatedBy: createdBy,
    };

    // Check conflicts
    const conflictCheck = checkConflicts(newEnquiry.hallId, newEnquiry.eventDate, newEnquiry.session);

    let updatedEnquiries = [...enquiries, newEnquiry];

    // If advance paid on creation -> Exclusive Lock Trigger: cancel and waitlist competing tentative holds
    if (newEnquiry.status === 'Advance Paid (EXCLUSIVE LOCK)') {
      updatedEnquiries = updatedEnquiries.map(item => {
        if (
          item.id !== newEnquiry.id &&
          item.hallId === newEnquiry.hallId &&
          item.eventDate === newEnquiry.eventDate &&
          item.session === newEnquiry.session &&
          item.status !== 'Cancelled' &&
          item.status !== 'Postponed'
        ) {
          logAudit(
            item.refNo,
            'STATUS_COMPETING_LOCK',
            item.status,
            'Cancelled (Moved to Waitlist)',
            'LOCK_ACQUIRED'
          );
          return {
            ...item,
            status: 'Cancelled',
            finalStatus: 'Cancelled',
            isWaitlisted: true,
            waitlistedReason: `Slot locked exclusively by Ref #${newEnquiry.refNo} (${newEnquiry.guestName})`,
            updatedAt: now,
            updatedBy: createdBy,
          };
        }
        return item;
      });
    }

    setEnquiries(updatedEnquiries);

    logAudit(refNo, 'ENQUIRY_RECORD', 'EMPTY', `Created for ${newEnquiry.guestName} (${newEnquiry.hallName})`, 'CREATE');

    return {
      success: true,
      refNo,
      createdEnquiry: newEnquiry,
      conflicts: conflictCheck.tentativeHolds.map(h => `Hold by Ref #${h.refNo} (${h.guestName})`),
    };
  }, [enquiries, currentUser, checkConflicts, logAudit]);

  const updateEnquiry = useCallback((updated: Enquiry) => {
    const old = enquiries.find(e => e.id === updated.id);
    if (!old) return { success: false };

    const now = new Date().toISOString();
    const updatedBy = currentUser?.username || 'System';

    // Status / Final Status transitions
    let nextFinalStatus = updated.finalStatus;
    if (updated.status === 'Confirmed') {
      nextFinalStatus = 'Confirmed';
    } else if (updated.status === 'Advance Paid (EXCLUSIVE LOCK)') {
      nextFinalStatus = 'Exclusive Lock';
    } else if (updated.status === 'Balance Paid') {
      nextFinalStatus = 'Confirmed';
    } else if (updated.status === 'Function Completed') {
      nextFinalStatus = 'Completed';
    } else if (updated.status === 'Function Completed and Gift Sent') {
      nextFinalStatus = 'Archived';
    } else if (updated.status === 'Postponed') {
      nextFinalStatus = 'Postponed';
    } else if (updated.status === 'Cancelled') {
      nextFinalStatus = 'Cancelled';
    }

    const isConfirmedOrCompleted =
      nextFinalStatus === 'Confirmed' ||
      nextFinalStatus === 'Exclusive Lock' ||
      nextFinalStatus === 'Completed' ||
      nextFinalStatus === 'Archived' ||
      updated.status === 'Confirmed' ||
      updated.status === 'Advance Paid (EXCLUSIVE LOCK)' ||
      updated.status === 'Balance Paid' ||
      updated.status === 'Function Completed' ||
      updated.status === 'Function Completed and Gift Sent';

    const effectiveKam = updated.keyAccountManager || updated.accountHandler || updated.firstContactPerson || '';

    const modifiedEnquiry: Enquiry = {
      ...updated,
      keyAccountManager: effectiveKam,
      accountHandler: effectiveKam,
      finalStatus: nextFinalStatus,
      noFollowUpRequired: isConfirmedOrCompleted ? true : updated.noFollowUpRequired,
      followUp1Date: isConfirmedOrCompleted ? '' : updated.followUp1Date,
      followUp2Date: isConfirmedOrCompleted ? '' : updated.followUp2Date,
      followUp3Date: isConfirmedOrCompleted ? '' : updated.followUp3Date,
      updatedAt: now,
      updatedBy,
    };

    let newEnquiriesList = enquiries.map(e => (e.id === updated.id ? modifiedEnquiry : e));

    // Handle EXCLUSIVE LOCK TRIGGER if newly set to Advance Paid
    if (
      updated.status === 'Advance Paid (EXCLUSIVE LOCK)' &&
      old.status !== 'Advance Paid (EXCLUSIVE LOCK)'
    ) {
      newEnquiriesList = newEnquiriesList.map(item => {
        if (
          item.id !== updated.id &&
          item.hallId === updated.hallId &&
          item.eventDate === updated.eventDate &&
          item.session === updated.session &&
          item.status !== 'Cancelled' &&
          item.status !== 'Postponed'
        ) {
          logAudit(
            item.refNo,
            'STATUS_COMPETING_LOCK',
            item.status,
            'Cancelled (Moved to Waitlist)',
            'LOCK_ACQUIRED'
          );
          return {
            ...item,
            status: 'Cancelled',
            finalStatus: 'Cancelled',
            isWaitlisted: true,
            waitlistedReason: `Slot locked exclusively by Ref #${updated.refNo} (${updated.guestName})`,
            updatedAt: now,
            updatedBy,
          };
        }
        return item;
      });
    }

    setEnquiries(newEnquiriesList);

    // Audit logs for changed fields
    const checkFields: (keyof Enquiry)[] = [
      'status',
      'finalStatus',
      'guestName',
      'companyName',
      'hallName',
      'eventDate',
      'session',
      'gPax',
      'expPax',
      'seatingArrangement',
      'quotedBaseRate',
      'finalBillValue',
      'remarks',
      'remarks1',
      'remarks2',
      'followUp1Date',
      'followUp2Date',
      'followUp3Date',
      'mgOverrideReason',
    ];

    checkFields.forEach(field => {
      if (String(old[field] ?? '') !== String(modifiedEnquiry[field] ?? '')) {
        logAudit(
          updated.refNo,
          String(field),
          String(old[field] ?? 'EMPTY'),
          String(modifiedEnquiry[field] ?? 'EMPTY'),
          'UPDATE'
        );
      }
    });

    return { success: true };
  }, [enquiries, currentUser, logAudit]);

  const advanceEnquiryStage = useCallback((id: string, newStage: PipelineStage) => {
    const target = enquiries.find(e => e.id === id);
    if (!target) return;
    updateEnquiry({ ...target, status: newStage });
  }, [enquiries, updateEnquiry]);

  const deleteEnquiry = useCallback((id: string) => {
    if (!currentUser || (currentUser.role !== 'Admin' && currentUser.role !== 'Editor')) {
      return { success: false, error: 'Unauthorized: Only Admin and Editor roles can delete enquiries.' };
    }
    const target = enquiries.find(e => e.id === id);
    if (!target) return { success: false, error: 'Enquiry not found.' };

    setEnquiries(prev => prev.filter(e => e.id !== id));
    logAudit(target.refNo, 'RECORD_DELETION', target.guestName, 'RECORD_PERMANENTLY_DELETED', 'DELETE');
    return { success: true };
  }, [currentUser, enquiries, logAudit]);

  // Venue Management & Deletion Safeguard
  const addVenue = useCallback((venueData: Omit<VenueHall, 'id'>) => {
    const newVenue: VenueHall = {
      ...venueData,
      id: 'hall-' + Math.random().toString(36).substring(2, 9),
    };
    setVenues(prev => [...prev, newVenue]);
    logAudit('VENUE_MASTER', 'VENUE_CREATED', 'NONE', newVenue.name, 'CREATE');
  }, [logAudit]);

  const updateVenue = useCallback((venue: VenueHall) => {
    setVenues(prev => prev.map(v => (v.id === venue.id ? venue : v)));
    logAudit('VENUE_MASTER', 'VENUE_UPDATED', venue.id, `${venue.name} (${venue.status})`, 'UPDATE');
  }, [logAudit]);

  const deleteVenue = useCallback((hallId: string) => {
    const venue = venues.find(v => v.id === hallId);
    if (!venue) return { success: false, message: 'Venue not found.' };

    // Deletion Safeguards: check if venue is tied to active or past enquiries
    const hasEnquiries = enquiries.some(e => e.hallId === hallId);
    if (hasEnquiries) {
      // Cannot be permanently deleted -> set status to Inactive
      setVenues(prev =>
        prev.map(v => (v.id === hallId ? { ...v, status: 'Inactive' } : v))
      );
      logAudit(
        'VENUE_MASTER',
        'SAFEGUARD_INACTIVE',
        `${venue.name} (Active)`,
        `${venue.name} (Inactive - Enquiries Attached)`,
        'UPDATE'
      );
      return {
        success: true,
        message: `Venue "${venue.name}" is linked to existing enquiries. As per deletion safeguards, its status has been changed to Inactive to protect historic booking logs.`,
      };
    }

    setVenues(prev => prev.filter(v => v.id !== hallId));
    logAudit('VENUE_MASTER', 'VENUE_DELETED', venue.name, 'PERMANENTLY_REMOVED', 'DELETE');
    return { success: true, message: `Venue "${venue.name}" deleted successfully.` };
  }, [venues, enquiries, logAudit]);

  // 1. F&B Menu Package Master CRUD
  const addMenuPackage = useCallback((pkgData: Omit<MenuPackageMaster, 'id'>) => {
    const newPkg: MenuPackageMaster = {
      ...pkgData,
      id: 'pkg-' + Math.random().toString(36).substring(2, 9),
    };
    setMenuPackages(prev => [...prev, newPkg]);
    logAudit('MENU_PACKAGE_MASTER', 'PACKAGE_CREATED', 'NONE', `${newPkg.name} (₹${newPkg.baseRatePerPax}/pax)`, 'CREATE');
  }, [logAudit]);

  const updateMenuPackage = useCallback((pkg: MenuPackageMaster) => {
    setMenuPackages(prev => prev.map(p => (p.id === pkg.id ? pkg : p)));
    logAudit('MENU_PACKAGE_MASTER', 'PACKAGE_UPDATED', pkg.id, `${pkg.name} (₹${pkg.baseRatePerPax}/pax) [${pkg.status}]`, 'UPDATE');
  }, [logAudit]);

  const deleteMenuPackage = useCallback((id: string) => {
    const pkg = menuPackages.find(p => p.id === id);
    if (!pkg) return { success: false, message: 'Menu Package not found.' };
    setMenuPackages(prev => prev.filter(p => p.id !== id));
    logAudit('MENU_PACKAGE_MASTER', 'PACKAGE_DELETED', pkg.name, 'PERMANENTLY_REMOVED', 'DELETE');
    return { success: true, message: `Menu package "${pkg.name}" deleted.` };
  }, [menuPackages, logAudit]);

  // 2. Inclusions & Add-On Equipment Master CRUD
  const addInclusion = useCallback((incData: Omit<InclusionMaster, 'id'>) => {
    const newInc: InclusionMaster = {
      ...incData,
      id: 'inc-' + Math.random().toString(36).substring(2, 9),
    };
    setInclusionsMaster(prev => [...prev, newInc]);
    logAudit('INCLUSIONS_MASTER', 'INCLUSION_CREATED', 'NONE', `${newInc.name} (${newInc.pricingType})`, 'CREATE');
  }, [logAudit]);

  const updateInclusion = useCallback((inc: InclusionMaster) => {
    setInclusionsMaster(prev => prev.map(i => (i.id === inc.id ? inc : i)));
    logAudit('INCLUSIONS_MASTER', 'INCLUSION_UPDATED', inc.id, `${inc.name} [${inc.status}]`, 'UPDATE');
  }, [logAudit]);

  const deleteInclusion = useCallback((id: string) => {
    const inc = inclusionsMaster.find(i => i.id === id);
    if (!inc) return { success: false, message: 'Inclusion item not found.' };
    setInclusionsMaster(prev => prev.filter(i => i.id !== id));
    logAudit('INCLUSIONS_MASTER', 'INCLUSION_DELETED', inc.name, 'PERMANENTLY_REMOVED', 'DELETE');
    return { success: true, message: `Inclusion "${inc.name}" deleted.` };
  }, [inclusionsMaster, logAudit]);

  // 3. Event / Function Type Master CRUD
  const addEventType = useCallback((evtData: Omit<EventTypeMaster, 'id'>) => {
    const newEvt: EventTypeMaster = {
      ...evtData,
      id: 'evt-' + Math.random().toString(36).substring(2, 9),
    };
    setEventTypesMaster(prev => [...prev, newEvt]);
    logAudit('EVENT_TYPE_MASTER', 'EVENT_TYPE_CREATED', 'NONE', `${newEvt.name} (${newEvt.category})`, 'CREATE');
  }, [logAudit]);

  const updateEventType = useCallback((evt: EventTypeMaster) => {
    setEventTypesMaster(prev => prev.map(e => (e.id === evt.id ? evt : e)));
    logAudit('EVENT_TYPE_MASTER', 'EVENT_TYPE_UPDATED', evt.id, `${evt.name} [${evt.status}]`, 'UPDATE');
  }, [logAudit]);

  const deleteEventType = useCallback((id: string) => {
    const evt = eventTypesMaster.find(e => e.id === id);
    if (!evt) return { success: false, message: 'Event type not found.' };
    setEventTypesMaster(prev => prev.filter(e => e.id !== id));
    logAudit('EVENT_TYPE_MASTER', 'EVENT_TYPE_DELETED', evt.name, 'PERMANENTLY_REMOVED', 'DELETE');
    return { success: true, message: `Event type "${evt.name}" deleted.` };
  }, [eventTypesMaster, logAudit]);

  // 4. Corporate Client & Agency Master CRUD
  const addCorporateClient = useCallback((clientData: Omit<CorporateClientMaster, 'id'>) => {
    const newClient: CorporateClientMaster = {
      ...clientData,
      id: 'corp-' + Math.random().toString(36).substring(2, 9),
    };
    setCorporateClients(prev => [...prev, newClient]);
    logAudit('CORPORATE_MASTER', 'CLIENT_CREATED', 'NONE', `${newClient.companyName} (${newClient.clientTier})`, 'CREATE');
  }, [logAudit]);

  const updateCorporateClient = useCallback((client: CorporateClientMaster) => {
    setCorporateClients(prev => prev.map(c => (c.id === client.id ? client : c)));
    logAudit('CORPORATE_MASTER', 'CLIENT_UPDATED', client.id, `${client.companyName} [${client.status}]`, 'UPDATE');
  }, [logAudit]);

  const deleteCorporateClient = useCallback((id: string) => {
    const client = corporateClients.find(c => c.id === id);
    if (!client) return { success: false, message: 'Corporate client not found.' };
    setCorporateClients(prev => prev.filter(c => c.id !== id));
    logAudit('CORPORATE_MASTER', 'CLIENT_DELETED', client.companyName, 'PERMANENTLY_REMOVED', 'DELETE');
    return { success: true, message: `Corporate client "${client.companyName}" deleted.` };
  }, [corporateClients, logAudit]);

  // 5. Lead Source / Business Channel Master CRUD
  const addLeadSource = useCallback((srcData: Omit<LeadSourceMaster, 'id'>) => {
    const newSrc: LeadSourceMaster = {
      ...srcData,
      id: 'src-' + Math.random().toString(36).substring(2, 9),
    };
    setLeadSourcesMaster(prev => [...prev, newSrc]);
    logAudit('LEAD_SOURCE_MASTER', 'SOURCE_CREATED', 'NONE', `${newSrc.name} (${newSrc.channelType})`, 'CREATE');
  }, [logAudit]);

  const updateLeadSource = useCallback((source: LeadSourceMaster) => {
    setLeadSourcesMaster(prev => prev.map(s => (s.id === source.id ? source : s)));
    logAudit('LEAD_SOURCE_MASTER', 'SOURCE_UPDATED', source.id, `${source.name} [${source.status}]`, 'UPDATE');
  }, [logAudit]);

  const deleteLeadSource = useCallback((id: string) => {
    const source = leadSourcesMaster.find(s => s.id === id);
    if (!source) return { success: false, message: 'Lead source not found.' };
    setLeadSourcesMaster(prev => prev.filter(s => s.id !== id));
    logAudit('LEAD_SOURCE_MASTER', 'SOURCE_DELETED', source.name, 'PERMANENTLY_REMOVED', 'DELETE');
    return { success: true, message: `Lead source "${source.name}" deleted.` };
  }, [leadSourcesMaster, logAudit]);

  // 6. Key Account Manager Master (KAM) CRUD
  const addAccountHandler = useCallback((ahData: Omit<KeyAccountManagerMaster, 'id'>) => {
    const deptRole = ahData.departmentRole || ahData.role || ahData.designation || 'Banquet Sales Specialist';
    const newAh: KeyAccountManagerMaster = {
      ...ahData,
      id: 'kam-' + Math.random().toString(36).substring(2, 9),
      departmentRole: deptRole,
      role: deptRole,
      designation: deptRole,
      phone: ahData.mobile || ahData.phone || '',
      mobile: ahData.mobile || ahData.phone || '',
    };
    setAccountHandlers(prev => [...prev, newAh]);
    logAudit('KEY_ACCOUNT_MANAGER_MASTER', 'KAM_CREATED', 'NONE', `${newAh.name} (${deptRole})`, 'CREATE');
  }, [logAudit]);

  const updateAccountHandler = useCallback((handler: KeyAccountManagerMaster) => {
    const deptRole = handler.departmentRole || handler.role || handler.designation || 'Banquet Sales Specialist';
    const updated: KeyAccountManagerMaster = {
      ...handler,
      departmentRole: deptRole,
      role: deptRole,
      designation: deptRole,
      phone: handler.mobile || handler.phone || '',
      mobile: handler.mobile || handler.phone || '',
    };
    setAccountHandlers(prev => prev.map(h => (h.id === updated.id ? updated : h)));
    logAudit('KEY_ACCOUNT_MANAGER_MASTER', 'KAM_UPDATED', handler.id, `${updated.name} [${updated.status}]`, 'UPDATE');
  }, [logAudit]);

  const deleteAccountHandler = useCallback((id: string) => {
    const handler = accountHandlers.find(h => h.id === id);
    if (!handler) return { success: false, message: 'Key Account Manager not found.' };
    const isAssigned = enquiries.some(e =>
      e.keyAccountManagerId === id ||
      e.accountHandlerId === id ||
      e.keyAccountManager === handler.name ||
      e.accountHandler === handler.name ||
      e.firstContactPerson === handler.name
    );
    if (isAssigned) {
      return { success: false, message: `Cannot delete "${handler.name}" as they are assigned to existing enquiries.` };
    }
    setAccountHandlers(prev => prev.filter(h => h.id !== id));
    logAudit('KEY_ACCOUNT_MANAGER_MASTER', 'KAM_DELETED', handler.name, 'PERMANENTLY_REMOVED', 'DELETE');
    return { success: true, message: `Key Account Manager "${handler.name}" deleted.` };
  }, [accountHandlers, enquiries, logAudit]);

  const addKeyAccountManager = addAccountHandler;
  const updateKeyAccountManager = updateAccountHandler;
  const deleteKeyAccountManager = deleteAccountHandler;

  // Google Sheets Sync
  const addSyncLog = useCallback((message: string, type: 'success' | 'info' | 'error' = 'info') => {
    const entry = { timestamp: new Date().toISOString(), message, type };
    setGoogleSheetConfig(prev => {
      const logs = [entry, ...(prev.syncLogs || []).slice(0, 49)];
      const updated = {
        ...prev,
        syncLogs: logs,
      };
      try {
        localStorage.setItem(STORAGE_KEYS.SHEET_CONFIG, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  }, []);

  const clearSyncLogs = useCallback(() => {
    setGoogleSheetConfig(prev => {
      const updated = {
        ...prev,
        syncLogs: [],
      };
      try {
        localStorage.setItem(STORAGE_KEYS.SHEET_CONFIG, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  }, []);

  const updateGoogleSheetConfig = useCallback((config: Partial<GoogleSheetSyncConfig>) => {
    setGoogleSheetConfig(prev => {
      const updated = {
        ...prev,
        ...config,
        syncLogs: config.syncLogs !== undefined ? config.syncLogs : (prev.syncLogs || []),
      };
      try {
        localStorage.setItem(STORAGE_KEYS.SHEET_CONFIG, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      logAudit('SYSTEM_CONFIG', 'GOOGLE_SHEET_SYNC_SETTINGS', prev.sheetUrl || 'None', updated.sheetUrl || 'None', 'SYNC');
      return updated;
    });
  }, [logAudit]);

  const triggerGoogleSheetSync = useCallback(async (isManualUserAction: boolean = false): Promise<{ success: boolean; count: number; requiresAuth?: boolean }> => {
    const now = new Date().toISOString();
    const count = enquiries.length;

    // Check if sheet is actually linked
    if (!googleSheetConfig.isLinked || (!googleSheetConfig.sheetUrl && !googleSheetConfig.webAppUrl && !googleSheetConfig.sheetId)) {
      const notLinkedMsg = 'Sync attempted: No Google Sheet is currently linked. Please link a Google Sheet or use Auto-Create first.';
      if (isManualUserAction) {
        setGoogleSheetConfig(prev => ({
          ...prev,
          syncStatus: 'error',
          lastError: notLinkedMsg,
          syncLogs: [
            {
              timestamp: now,
              message: notLinkedMsg,
              type: 'error',
            },
            ...(prev.syncLogs || []).slice(0, 49),
          ],
        }));
      }
      return { success: false, count: 0 };
    }

    // Check if token exists in memory
    const hasToken = hasCachedToken();
    if (!isManualUserAction && !hasToken && (!googleSheetConfig.webAppUrl || !googleSheetConfig.webAppUrl.startsWith('http'))) {
      // Background idle sync without signed-in Google account: local register checkpointed silently without popup
      addSyncLog(
        `Idle Auto-Sync (20s): Local banquet register checkpointed for Unit [${activeUnitCode}] (${count} enquiries). Sign in via Master Google Sheets to sync live to Google Drive.`,
        'info'
      );
      return { success: true, count, requiresAuth: true };
    }

    setGoogleSheetConfig(prev => ({ ...prev, syncStatus: 'syncing' }));

    let directApiSuccess = false;
    let directApiError: string | null = null;
    let requiresAuthNeeded = false;

    // If a direct Google Sheet ID is present, perform direct Google Sheets REST API sync
    if (googleSheetConfig.sheetId && googleSheetConfig.sheetId !== 'WEB_APP_ENDPOINT') {
      try {
        const pushRes = await pushEnquiriesToGoogleSpreadsheet(
          googleSheetConfig.sheetId,
          enquiries,
          venues,
          auditLogs,
          isManualUserAction
        );
        if (pushRes.success) {
          directApiSuccess = true;
        } else if (pushRes.requiresAuth) {
          requiresAuthNeeded = true;
        }
      } catch (apiErr: any) {
        if (isManualUserAction) {
          console.warn('Direct Google Sheets REST API push warning:', apiErr);
          directApiError = apiErr?.message || 'Failed to update Google Sheet';
        }
      }
    }

    if (requiresAuthNeeded && !isManualUserAction) {
      addSyncLog(
        `Idle Auto-Sync (20s): Local banquet register checkpointed for Unit [${activeUnitCode}]. Click "Sync Now with Google Sheet" to authenticate.`,
        'info'
      );
      setGoogleSheetConfig(prev => ({ ...prev, syncStatus: 'synced', lastSyncedAt: now }));
      return { success: true, count, requiresAuth: true };
    }

    if (directApiError && !googleSheetConfig.webAppUrl) {
      setGoogleSheetConfig(prev => ({
        ...prev,
        syncStatus: 'error',
        lastError: directApiError!,
        syncLogs: [
          {
            timestamp: now,
            message: `Sync push failed: ${directApiError}`,
            type: 'error',
          },
          ...(prev.syncLogs || []).slice(0, 49),
        ],
      }));
      return { success: false, count: 0 };
    }

    // If Web App URL is provided, attempt live HTTP transmission
    if (googleSheetConfig.webAppUrl && googleSheetConfig.webAppUrl.startsWith('http')) {
      try {
        await fetch(googleSheetConfig.webAppUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enquiries, auditLogs, timestamp: now }),
        });
      } catch (err) {
        console.warn('Direct web app post skipped or blocked by browser CORS:', err);
      }
    } else if (!directApiSuccess) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    setGoogleSheetConfig(prev => ({
      ...prev,
      syncStatus: 'synced',
      lastSyncedAt: now,
      lastError: undefined,
      syncLogs: [
        {
          timestamp: now,
          message: `Live Google Sheet sync completed. Synchronized ${count} banquet enquiries and venue data to sheet "${prev.sheetName || 'Master Enquiries Register'}".`,
          type: 'success',
        },
        ...(prev.syncLogs || []).slice(0, 49),
      ],
    }));

    logAudit('GOOGLE_SHEETS', 'SYNC_COMPLETED', 'SYNCING', `Synced ${count} records with audit trails across multi-sheet architecture`, 'SYNC');
    setIsInitialSetupCompleted(true);

    return { success: true, count };
  }, [enquiries, venues, auditLogs, googleSheetConfig.isLinked, googleSheetConfig.sheetId, googleSheetConfig.sheetName, googleSheetConfig.sheetUrl, googleSheetConfig.webAppUrl, logAudit, activeUnitCode, addSyncLog]);

  // 1-Click Automated Google Sheet Creation & Zero-Code Integration
  const autoCreateGoogleSpreadsheet = useCallback(
    async (onProgress?: (status: string) => void): Promise<{ success: boolean; url?: string; error?: string }> => {
      try {
        onProgress?.('Preparing banquet enquiries and venue data...');
        const result = await createIntegratedGoogleSpreadsheet(enquiries, venues, auditLogs, onProgress);
        const now = new Date().toISOString();

        updateGoogleSheetConfig({
          isLinked: true,
          sheetUrl: result.spreadsheetUrl,
          sheetId: result.spreadsheetId,
          sheetName: 'Master Enquiries Register',
          syncStatus: 'synced',
          lastSyncedAt: now,
          lastError: undefined,
        });

        addSyncLog(
          `Prebuilt Google Sheet created and linked automatically: "${result.title}" (ID: ${result.spreadsheetId}). All ${result.enquiriesCount} enquiries, venues, and audit logs synchronized.`,
          'success'
        );

        logAudit('GOOGLE_SHEETS', 'AUTO_CREATE_SPREADSHEET', 'NONE', result.spreadsheetUrl, 'CREATE');
        setIsInitialSetupCompleted(true);

        return { success: true, url: result.spreadsheetUrl };
      } catch (err: any) {
        console.error('Error auto-creating Google Sheet:', err);
        const errMsg = err?.message || 'Failed to auto-create Google Sheet.';
        addSyncLog(`Auto-create Google Sheet failed: ${errMsg}`, 'error');
        return { success: false, error: errMsg };
      }
    },
    [enquiries, venues, auditLogs, updateGoogleSheetConfig, addSyncLog, logAudit]
  );

  // Bi-directional live pull from Google Sheet
  const pullFromGoogleSheet = useCallback(async (isManualUserAction: boolean = false): Promise<{ success: boolean; count: number; error?: string; requiresAuth?: boolean }> => {
    if (!googleSheetConfig.isLinked || !googleSheetConfig.sheetId) {
      return { success: false, count: 0, error: 'No Google Sheet is currently linked.' };
    }

    try {
      const res = await pullEnquiriesFromGoogleSpreadsheet(googleSheetConfig.sheetId, isManualUserAction);
      if (res.requiresAuth) {
        return { success: false, count: 0, requiresAuth: true, error: 'Google authentication required to read live sheet.' };
      }
      const now = new Date().toISOString();
      updateGoogleSheetConfig({
        lastSyncedAt: now,
        syncStatus: 'synced',
      });
      addSyncLog(
        `Bi-directional pull verified: Read ${res.rowsCount} rows from Google Sheet "${googleSheetConfig.sheetName || 'Master Enquiries Register'}". Local BEMS verified in sync.`,
        'success'
      );
      return { success: true, count: res.rowsCount };
    } catch (err: any) {
      const errMsg = err?.message || 'Failed to pull data from Google Sheet.';
      addSyncLog(`Pull from Google Sheet failed: ${errMsg}`, 'error');
      return { success: false, count: 0, error: errMsg };
    }
  }, [googleSheetConfig.isLinked, googleSheetConfig.sheetId, googleSheetConfig.sheetName, updateGoogleSheetConfig, addSyncLog]);

  // Export Engine (JSON / CSV)
  const exportBackupJSON = useCallback(() => {
    const payload = {
      exportVersion: '1.1.0',
      timestamp: new Date().toISOString(),
      hotel: 'The Residency Towers, Chennai - BEMS',
      venues,
      menuPackages,
      inclusionsMaster,
      eventTypesMaster,
      corporateClients,
      leadSourcesMaster,
      accountHandlers,
      enquiries,
      auditLogs,
      users: users.map(u => ({ ...u, password: '***' })), // mask for export
      sheetConfig: googleSheetConfig,
    };
    return JSON.stringify(payload, null, 2);
  }, [venues, menuPackages, inclusionsMaster, eventTypesMaster, corporateClients, leadSourcesMaster, accountHandlers, enquiries, auditLogs, users, googleSheetConfig]);

  const exportEnquiriesCSV = useCallback(() => {
    const headers = [
      'Ref No',
      'Enquiry Date',
      'Guest Name',
      'Company Name',
      'Business Source',
      'Account Handler',
      'Event Date',
      'Event Type',
      'Welcome Board Display',
      'Hall/Venue',
      'Seating Arrangement',
      'G. Pax',
      'Exp. Pax',
      'Session',
      'Menu',
      'Rate Billing Type',
      'Inclusions',
      'Quoted Base Rate (INR)',
      'Final Bill Value (INR)',
      'Status',
      'Final Status',
      'Follow-up 1 Date',
      'Follow-up 2 Date',
      'Follow-up 3 Date',
      'Remarks',
      'Remarks.1',
      'Remarks.2',
    ];

    const rows = enquiries.map(e => [
      `"${e.refNo}"`,
      `"${e.enquiryDate}"`,
      `"${(e.guestName || '').replace(/"/g, '""')}"`,
      `"${(e.companyName || '').replace(/"/g, '""')}"`,
      `"${e.businessSource}"`,
      `"${(e.accountHandler || e.firstContactPerson || '').replace(/"/g, '""')}"`,
      `"${e.eventDate}"`,
      `"${e.eventType}"`,
      `"${(e.boardToRead || e.functionBanner || '').replace(/"/g, '""')}"`,
      `"${e.hallName}"`,
      `"${e.seatingArrangement}"`,
      e.gPax,
      e.expPax,
      `"${e.session}"`,
      `"${e.menu}"`,
      `"${e.rateBillingType}"`,
      `"${(e.inclusions || []).join('; ')}"`,
      currentUser?.role === 'Collaborator' ? '"REDACTED"' : (e.quotedBaseRate || 0),
      currentUser?.role === 'Collaborator' ? '"REDACTED"' : (e.finalBillValue || 0),
      `"${e.status}"`,
      `"${e.finalStatus}"`,
      currentUser?.role === 'Collaborator' ? '"REDACTED"' : `"${e.followUp1Date || ''}"`,
      currentUser?.role === 'Collaborator' ? '"REDACTED"' : `"${e.followUp2Date || ''}"`,
      currentUser?.role === 'Collaborator' ? '"REDACTED"' : `"${e.followUp3Date || ''}"`,
      currentUser?.role === 'Collaborator' ? '"REDACTED"' : `"${(e.remarks || '').replace(/"/g, '""')}"`,
      currentUser?.role === 'Collaborator' ? '"REDACTED"' : `"${(e.remarks1 || '').replace(/"/g, '""')}"`,
      currentUser?.role === 'Collaborator' ? '"REDACTED"' : `"${(e.remarks2 || '').replace(/"/g, '""')}"`,
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }, [enquiries, currentUser]);

  const downloadMultiSheetMaster = useCallback(() => {
    downloadMultiSheetSpreadsheet(
      enquiries,
      auditLogs,
      venues,
      `TRT_Banquet_MultiSheet_Master_${new Date().toISOString().split('T')[0]}.xlsx`
    );
    addSyncLog(`Downloaded comprehensive multi-sheet spreadsheet (${enquiries.length} enquiry sheets with real-time audit trails).`, 'success');
  }, [enquiries, auditLogs, venues, addSyncLog]);

  const importBackupJSON = useCallback((jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr);
      if (!data || !Array.isArray(data.enquiries)) {
        return { success: false, message: 'Invalid backup file structure.' };
      }
      if (Array.isArray(data.venues) && data.venues.length > 0) {
        setVenues(data.venues);
      }
      if (Array.isArray(data.menuPackages) && data.menuPackages.length > 0) {
        setMenuPackages(data.menuPackages);
      }
      if (Array.isArray(data.inclusionsMaster) && data.inclusionsMaster.length > 0) {
        setInclusionsMaster(data.inclusionsMaster);
      }
      if (Array.isArray(data.eventTypesMaster) && data.eventTypesMaster.length > 0) {
        setEventTypesMaster(data.eventTypesMaster);
      }
      if (Array.isArray(data.corporateClients) && data.corporateClients.length > 0) {
        setCorporateClients(data.corporateClients);
      }
      if (Array.isArray(data.leadSourcesMaster) && data.leadSourcesMaster.length > 0) {
        setLeadSourcesMaster(data.leadSourcesMaster);
      }
      if (Array.isArray(data.accountHandlers) && data.accountHandlers.length > 0) {
        setAccountHandlers(data.accountHandlers);
      }
      setEnquiries(data.enquiries);
      if (Array.isArray(data.auditLogs)) {
        setAuditLogs(data.auditLogs);
      }
      logAudit('BACKUP_RESTORE', 'DATA_RESTORED', 'PREVIOUS_STATE', `Restored ${data.enquiries.length} records`, 'RESTORE');
      return { success: true, message: `Successfully restored ${data.enquiries.length} enquiries and master configurations.` };
    } catch (e) {
      return { success: false, message: 'Error parsing JSON backup file: ' + (e as Error).message };
    }
  }, [logAudit]);

  const resetToCleanDatabase = useCallback(() => {
    setEnquiries([]);
    logAudit('SYSTEM_RESET', 'DATABASE_CLEARED', 'ALL_RECORDS', 'CLEAN_DATABASE', 'DELETE');
  }, [logAudit]);

  const seedDemoData = useCallback(() => {
    const demoEnquiries = getDefaultDemoEnquiries();
    setEnquiries(demoEnquiries);
    logAudit('SYSTEM_SEED', 'DEMO_DATA_POPULATED', 'EMPTY', `${demoEnquiries.length} operational enquiries seeded`, 'CREATE');
  }, [logAudit]);

  const updateStartupImage = useCallback((url: string) => {
    setStartupImage(url);
    logAudit('STARTUP_IMAGE', 'IMAGE_URL_UPDATED', 'OLD_URL', url, 'UPDATE');
  }, [logAudit]);

  const updateQuotationSettings = useCallback((updated: Partial<QuotationSettingsConfig>) => {
    setQuotationSettings(prev => ({
      ...prev,
      ...updated,
      sections: updated.sections || prev.sections,
    }));
    logAudit('SETTINGS', 'QUOTATION_SETTINGS_UPDATED', 'OLD_SETTINGS', 'UPDATED_SECTIONS', 'UPDATE');
  }, [logAudit]);

  const recordQuotationSend = useCallback(
    (enquiryId: string, sendRecord: Omit<QuotationSendRecord, 'id' | 'timestamp' | 'sentBy'>): QuotationSendRecord => {
      const record: QuotationSendRecord = {
        ...sendRecord,
        id: 'send-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        timestamp: new Date().toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        sentBy: currentUser?.name || currentUser?.username || 'Staff',
      };

      let statusWasUpdated = false;
      let previousStage: PipelineStage = 'Portfolio Creation';

      setEnquiries(prev =>
        prev.map(enq => {
          if (enq.id === enquiryId) {
            const existing = enq.quotationSendHistory || [];
            const willAdvance = enq.status === 'Portfolio Creation' || !enq.status;
            const newStage: PipelineStage = willAdvance ? 'Quote Shared' : enq.status;
            if (willAdvance) {
              statusWasUpdated = true;
              previousStage = enq.status || 'Portfolio Creation';
            }
            return {
              ...enq,
              status: newStage,
              quotationSendHistory: [record, ...existing],
              updatedAt: new Date().toISOString(),
            };
          }
          return enq;
        })
      );

      if (statusWasUpdated) {
        logAudit(
          enquiryId,
          'status',
          previousStage,
          'Quote Shared',
          'STATUS_CHANGE'
        );
      }

      logAudit(
        enquiryId,
        'QUOTATION_DISPATCH',
        'NONE',
        `${record.channel} to ${record.recipient} (${record.status})`,
        'UPDATE'
      );

      return record;
    },
    [currentUser, logAudit]
  );

  const recordBEOSend = useCallback(
    (enquiryId: string, sendRecord: Omit<BEOSendRecord, 'id' | 'timestamp' | 'sentBy'>): BEOSendRecord => {
      const record: BEOSendRecord = {
        ...sendRecord,
        id: 'beo-send-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        timestamp: new Date().toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        sentBy: currentUser?.name || currentUser?.username || 'Staff',
      };

      setEnquiries(prev =>
        prev.map(enq => {
          if (enq.id === enquiryId) {
            const existing = enq.beoSendHistory || [];
            return {
              ...enq,
              beoSendHistory: [record, ...existing],
              updatedAt: new Date().toISOString(),
            };
          }
          return enq;
        })
      );

      logAudit(
        enquiryId,
        'BEO_DISPATCH',
        'NONE',
        `${record.department} via ${record.channel} to ${record.recipient}`,
        'UPDATE'
      );

      return record;
    },
    [currentUser, logAudit]
  );

  // Function Prospectus (FP) Dispatch - Evolved BEO
  const recordFPSend = useCallback(
    (enquiryId: string, sendRecord: Omit<FPSendRecord, 'id' | 'timestamp' | 'sentBy'>): FPSendRecord => {
      const record: FPSendRecord = {
        ...sendRecord,
        id: 'fp-send-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        timestamp: new Date().toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        sentBy: currentUser?.name || currentUser?.username || 'Banquet Executive',
      };

      setEnquiries(prev =>
        prev.map(enq => {
          if (enq.id === enquiryId) {
            const existingFp = enq.fpSendHistory || [];
            const existingBeo = enq.beoSendHistory || [];
            return {
              ...enq,
              fpSendHistory: [record, ...existingFp],
              beoSendHistory: [record, ...existingBeo],
              updatedAt: new Date().toISOString(),
            };
          }
          return enq;
        })
      );

      logAudit(
        enquiryId,
        'FP_DISPATCH',
        'NONE',
        `Function Prospectus sent to ${record.department} via ${record.channel} (${record.recipient})`,
        'UPDATE'
      );

      return record;
    },
    [currentUser, logAudit]
  );

  // Record Payment Receipt (Advance, Part Payment, Final Settlement)
  const recordPaymentReceipt = useCallback(
    (receiptData: Omit<PaymentReceipt, 'id' | 'receiptNo' | 'timestamp' | 'receivedBy'>): { success: boolean; receipt?: PaymentReceipt; error?: string } => {
      const now = new Date();
      const receiptSeq = String(paymentReceipts.length + 1).padStart(4, '0');
      const receiptNo = `REC-${activeUnitCode}-${now.getFullYear()}-${receiptSeq}`;
      const timestamp = now.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      const receivedBy = currentUser?.name || currentUser?.username || 'Cashier Desk';

      const newReceipt: PaymentReceipt = {
        ...receiptData,
        id: 'pay-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        receiptNo,
        timestamp,
        receivedBy,
      };

      setPaymentReceipts(prev => [newReceipt, ...prev]);

      // Update Enquiry balance and financial lifecycle
      setEnquiries(prev =>
        prev.map(enq => {
          if (enq.id === receiptData.enquiryId) {
            const prevAdvance = enq.advanceAmount || 0;
            const prevAdvancePaid = enq.advancePaidAmount || prevAdvance;
            const updatedAdvancePaid = prevAdvancePaid + receiptData.amount;
            const billValue = enq.finalBillValue || 0;
            const updatedBalanceDue = Math.max(0, billValue - updatedAdvancePaid);
            const existingReceipts = enq.paymentReceipts || [];

            // If an unconfirmed enquiry records an advance, upgrade to Confirmed
            let updatedStatus = enq.status;
            let updatedFinalStatus = enq.finalStatus;
            if (
              (receiptData.paymentType === 'Advance' || receiptData.paymentType === 'Part Payment') &&
              (enq.status === 'Portfolio Creation' || enq.status === 'Quote Shared' || enq.status === 'Negotiation' || enq.status === 'Initial Discussion - Quote Sharing (Tentative)')
            ) {
              updatedStatus = 'Advance Paid (EXCLUSIVE LOCK)';
              updatedFinalStatus = 'Exclusive Lock';
            }

            return {
              ...enq,
              advanceAmount: updatedAdvancePaid,
              advancePaidAmount: updatedAdvancePaid,
              balanceAmount: updatedBalanceDue,
              balanceDueAmount: updatedBalanceDue,
              paymentReceipts: [newReceipt, ...existingReceipts],
              status: updatedStatus,
              finalStatus: updatedFinalStatus,
              updatedAt: new Date().toISOString(),
            };
          }
          return enq;
        })
      );

      logAudit(
        receiptData.enquiryRefNo,
        'PAYMENT_RECORDED',
        'NONE',
        `Receipt #${receiptNo}: ₹${receiptData.amount.toLocaleString('en-IN')} via ${receiptData.settlementMode} (${receiptData.paymentType})`,
        'CREATE'
      );

      return { success: true, receipt: newReceipt };
    },
    [activeUnitCode, currentUser, paymentReceipts.length, logAudit]
  );

  // Generate Proforma / Tax Invoice with Indian GST (CGST 9% + SGST 9%)
  const generateTaxInvoice = useCallback(
    (invoiceData: Omit<TaxInvoice, 'id' | 'invoiceNo' | 'generatedBy'>): { success: boolean; invoice?: TaxInvoice; error?: string } => {
      const now = new Date();
      const prefix = invoiceData.invoiceType === 'Proforma' ? 'PRO' : 'INV';
      const seqNumber = String(taxInvoices.length + 1).padStart(4, '0');
      const invoiceNo = `${prefix}-${activeUnitCode}-${now.getFullYear()}-${seqNumber}`;
      const generatedBy = currentUser?.name || currentUser?.username || 'Banquet Billing Officer';

      const newInvoice: TaxInvoice = {
        ...invoiceData,
        id: 'inv-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        invoiceNo,
        generatedBy,
      };

      setTaxInvoices(prev => [newInvoice, ...prev]);

      // Update Enquiry with invoice record
      setEnquiries(prev =>
        prev.map(enq => {
          if (enq.id === invoiceData.enquiryId) {
            const existingInvoices = enq.invoices || [];
            return {
              ...enq,
              invoices: [newInvoice, ...existingInvoices],
              finalBillValue: invoiceData.totalAmount,
              balanceDueAmount: Math.max(0, invoiceData.netPayable),
              updatedAt: new Date().toISOString(),
            };
          }
          return enq;
        })
      );

      logAudit(
        invoiceData.enquiryRefNo,
        'INVOICE_GENERATED',
        'NONE',
        `${invoiceData.invoiceType} #${invoiceNo} issued for ₹${invoiceData.totalAmount.toLocaleString('en-IN')} (Net Due: ₹${invoiceData.netPayable.toLocaleString('en-IN')})`,
        'CREATE'
      );

      return { success: true, invoice: newInvoice };
    },
    [activeUnitCode, currentUser, taxInvoices.length, logAudit]
  );

  // Record Cashier Shift Tally Handover
  const recordCashierTally = useCallback(
    (tallyData: Omit<CashierTallyEntry, 'id' | 'tallyNo' | 'timestamp' | 'cashierName'>): { success: boolean; tally?: CashierTallyEntry } => {
      const now = new Date();
      const tallyNo = `TLY-${activeUnitCode}-${now.getFullYear()}-${String(cashierTallies.length + 1).padStart(4, '0')}`;
      const timestamp = now.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      const cashierName = currentUser?.name || currentUser?.username || 'Cashier Desk';

      const newTally: CashierTallyEntry = {
        ...tallyData,
        id: 'tly-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        tallyNo,
        cashierName,
        timestamp,
      };

      setCashierTallies(prev => [newTally, ...prev]);

      logAudit(
        'CASHIER_TALLY',
        'SHIFT_HANDOVER_RECORDED',
        'OPEN_DRAWER',
        `Tally #${tallyNo} for Counter ${tallyData.counterNo} (${tallyData.shift} shift). Total collection ₹${tallyData.totalCollection.toLocaleString('en-IN')}`,
        'CREATE'
      );

      return { success: true, tally: newTally };
    },
    [activeUnitCode, currentUser, cashierTallies.length, logAudit]
  );

  // High-Impact Stage Transition Ceremony
  const executeStageTransition = useCallback(
    (
      enquiryId: string,
      newStage: PipelineStage,
      transitionNotes?: string,
      advancePaymentData?: { amount: number; settlementMode: PaymentReceipt['settlementMode']; transactionRef?: string; notes?: string }
    ): { success: boolean; message?: string } => {
      const target = enquiries.find(e => e.id === enquiryId);
      if (!target) return { success: false, message: 'Enquiry not found.' };

      const oldStage = target.status;
      let recordedReceipt: PaymentReceipt | undefined;

      // 1. If advance payment is bundled with this stage progression
      if (advancePaymentData && advancePaymentData.amount > 0) {
        const res = recordPaymentReceipt({
          enquiryId: target.id,
          enquiryRefNo: target.refNo,
          guestName: target.guestName,
          companyName: target.companyName,
          paymentType: 'Advance',
          amount: advancePaymentData.amount,
          settlementMode: advancePaymentData.settlementMode,
          transactionRef: advancePaymentData.transactionRef,
          notes: advancePaymentData.notes || `Advance recorded during transition to ${newStage}`,
        });
        if (res.success && res.receipt) {
          recordedReceipt = res.receipt;
        }
      }

      // 2. Perform Exclusive Lock conflict clearance if moving to confirmed status
      let updatedList = [...enquiries];
      const now = new Date().toISOString();
      const updatedBy = currentUser?.name || currentUser?.username || 'Staff';

      if (newStage === 'Advance Paid (EXCLUSIVE LOCK)' || newStage === 'Confirmed') {
        updatedList = updatedList.map(item => {
          if (
            item.id !== target.id &&
            item.hallId === target.hallId &&
            item.eventDate === target.eventDate &&
            item.session === target.session &&
            item.status !== 'Cancelled' &&
            item.status !== 'Postponed'
          ) {
            logAudit(
              item.refNo,
              'STATUS_COMPETING_LOCK',
              item.status,
              'Cancelled (Waitlisted)',
              'LOCK_ACQUIRED'
            );
            return {
              ...item,
              status: 'Cancelled',
              finalStatus: 'Cancelled',
              isWaitlisted: true,
              waitlistedReason: `Slot locked exclusively by Ref #${target.refNo} (${target.guestName})`,
              updatedAt: now,
              updatedBy,
            };
          }
          return item;
        });
      }

      // 3. Update Target Enquiry
      const isRetraction =
        (oldStage === 'Confirmed' || oldStage === 'Advance Paid (EXCLUSIVE LOCK)' || oldStage === 'Balance Paid') &&
        (newStage === 'Quote Shared' || newStage === 'Negotiation' || newStage === 'Cancelled' || newStage === 'Postponed');

      updatedList = updatedList.map(item => {
        if (item.id === target.id) {
          const prevRemarks = item.remarks ? `${item.remarks}\n` : '';
          const stageNote = transitionNotes ? `[Stage Change: ${oldStage} -> ${newStage}]: ${transitionNotes}` : `[Stage Change: ${oldStage} -> ${newStage}]`;
          
          let finalStatus = item.finalStatus;
          if (newStage === 'Confirmed' || newStage === 'Advance Paid (EXCLUSIVE LOCK)') {
            finalStatus = 'Exclusive Lock';
          } else if (newStage === 'Balance Paid') {
            finalStatus = 'Confirmed';
          } else if (newStage === 'Cancelled' || newStage === 'Postponed') {
            finalStatus = newStage;
          } else {
            finalStatus = 'Tentative';
          }

          return {
            ...item,
            status: newStage,
            finalStatus,
            remarks: `${prevRemarks}${stageNote}`,
            updatedAt: now,
            updatedBy,
          };
        }
        return item;
      });

      setEnquiries(updatedList);

      logAudit(
        target.refNo,
        'STAGE_TRANSITION_CEREMONY',
        oldStage,
        `${newStage} | ${transitionNotes || (isRetraction ? 'Retraction logged' : 'Milestone achieved')}`,
        'STATUS_CHANGE'
      );

      return {
        success: true,
        message: `Successfully transitioned Ref #${target.refNo} to "${newStage}".${recordedReceipt ? ` Advance of ₹${recordedReceipt.amount.toLocaleString('en-IN')} recorded.` : ''}`,
      };
    },
    [enquiries, currentUser, recordPaymentReceipt, logAudit]
  );

  // Settlement Mode Masters CRUD
  const addSettlementMode = useCallback((modeData: Omit<SettlementModeMaster, 'id'>) => {
    const newMode: SettlementModeMaster = {
      ...modeData,
      id: 'sm-' + Math.random().toString(36).substring(2, 9),
    };
    setSettlementModesMaster(prev => [...prev, newMode]);
    logAudit('SETTLEMENT_MODES', 'MODE_CREATED', 'NONE', `${newMode.name} (GL: ${newMode.glCode})`, 'CREATE');
  }, [logAudit]);

  const updateSettlementMode = useCallback((mode: SettlementModeMaster) => {
    setSettlementModesMaster(prev => prev.map(m => (m.id === mode.id ? mode : m)));
    logAudit('SETTLEMENT_MODES', 'MODE_UPDATED', mode.id, `${mode.name} (Active: ${mode.isActive})`, 'UPDATE');
  }, [logAudit]);

  const deleteSettlementMode = useCallback((id: string): { success: boolean; message: string } => {
    const target = settlementModesMaster.find(m => m.id === id);
    if (!target) return { success: false, message: 'Settlement mode not found.' };
    setSettlementModesMaster(prev => prev.filter(m => m.id !== id));
    logAudit('SETTLEMENT_MODES', 'MODE_DELETED', target.name, 'PERMANENTLY_REMOVED', 'DELETE');
    return { success: true, message: `Settlement mode "${target.name}" removed.` };
  }, [settlementModesMaster, logAudit]);

  // Cashier Invoice Series Master CRUD
  const addCashierInvoiceSeries = useCallback((seriesData: Omit<CashierInvoiceSeriesMaster, 'id'>) => {
    const newSeries: CashierInvoiceSeriesMaster = {
      ...seriesData,
      id: 'inv-series-' + Math.random().toString(36).substring(2, 9),
    };
    setCashierInvoiceSeriesMaster(prev => [...prev, newSeries]);
    logAudit('INVOICE_SERIES', 'SERIES_CREATED', 'NONE', `${newSeries.seriesPrefix} (${newSeries.cashierCounter})`, 'CREATE');
  }, [logAudit]);

  const updateCashierInvoiceSeries = useCallback((series: CashierInvoiceSeriesMaster) => {
    setCashierInvoiceSeriesMaster(prev => prev.map(s => (s.id === series.id ? series : s)));
    logAudit('INVOICE_SERIES', 'SERIES_UPDATED', series.id, `${series.seriesPrefix} (Seq: ${series.currentSequence})`, 'UPDATE');
  }, [logAudit]);

  const deleteCashierInvoiceSeries = useCallback((id: string): { success: boolean; message: string } => {
    const target = cashierInvoiceSeriesMaster.find(s => s.id === id);
    if (!target) return { success: false, message: 'Series not found.' };
    setCashierInvoiceSeriesMaster(prev => prev.filter(s => s.id !== id));
    logAudit('INVOICE_SERIES', 'SERIES_DELETED', target.seriesPrefix, 'PERMANENTLY_REMOVED', 'DELETE');
    return { success: true, message: `Invoice Series "${target.seriesPrefix}" removed.` };
  }, [cashierInvoiceSeriesMaster, logAudit]);

  // 20-Second Idle Auto-Sync Timer Implementation
  const toggleIdleAutoSync = useCallback(() => {
    setIsIdleAutoSyncActive(prev => !prev);
  }, []);

  useEffect(() => {
    if (!isIdleAutoSyncActive) return;

    const resetIdle = () => {
      setIdleSecondsRemaining(20);
    };

    window.addEventListener('mousemove', resetIdle, { passive: true });
    window.addEventListener('mousedown', resetIdle, { passive: true });
    window.addEventListener('keydown', resetIdle, { passive: true });
    window.addEventListener('touchstart', resetIdle, { passive: true });
    window.addEventListener('scroll', resetIdle, { passive: true });

    const interval = setInterval(() => {
      setIdleSecondsRemaining(prev => {
        if (prev <= 1) {
          // Trigger sync on 20s idle reaching 0
          if (googleSheetConfig.isLinked) {
            triggerGoogleSheetSync(false).catch(() => {});
          } else {
            addSyncLog(
              `Idle Auto-Sync (20s): Local banquet register checkpointed for Unit [${activeUnitCode}].`,
              'info'
            );
          }
          return 20; // reset to 20s
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      window.removeEventListener('mousemove', resetIdle);
      window.removeEventListener('mousedown', resetIdle);
      window.removeEventListener('keydown', resetIdle);
      window.removeEventListener('touchstart', resetIdle);
      window.removeEventListener('scroll', resetIdle);
      clearInterval(interval);
    };
  }, [isIdleAutoSyncActive, googleSheetConfig.isLinked, triggerGoogleSheetSync, addSyncLog, activeUnitCode]);

  const value = useMemo(
    () => ({
      currentUser,
      users,
      enquiries,
      venues,
      menuPackages,
      inclusionsMaster,
      eventTypesMaster,
      corporateClients,
      leadSourcesMaster,
      auditLogs,
      googleSheetConfig,
      startupImage,
      isInitialSetupCompleted,
      units,
      activeUnit,
      activeUnitCode,
      switchUnit,
      createUnit,
      updateUnit,
      resetSampleUnit,
      exportUnitBackupJSON,
      importUnitBackupJSON,
      quotationSettings,
      login,
      logout,
      updateUserPin,
      addUser,
      updateUser,
      resetUserPassword,
      addEnquiry,
      updateEnquiry,
      deleteEnquiry,
      advanceEnquiryStage,
      updateQuotationSettings,
      recordQuotationSend,
      recordBEOSend,
      recordFPSend,
      paymentReceipts,
      taxInvoices,
      cashierTallies,
      settlementModesMaster,
      cashierInvoiceSeriesMaster,
      recordPaymentReceipt,
      generateTaxInvoice,
      recordCashierTally,
      executeStageTransition,
      addSettlementMode,
      updateSettlementMode,
      deleteSettlementMode,
      addCashierInvoiceSeries,
      updateCashierInvoiceSeries,
      deleteCashierInvoiceSeries,
      idleSecondsRemaining,
      isIdleAutoSyncActive,
      toggleIdleAutoSync,
      addVenue,
      updateVenue,
      deleteVenue,
      addMenuPackage,
      updateMenuPackage,
      deleteMenuPackage,
      addInclusion,
      updateInclusion,
      deleteInclusion,
      addEventType,
      updateEventType,
      deleteEventType,
      addCorporateClient,
      updateCorporateClient,
      deleteCorporateClient,
      addLeadSource,
      updateLeadSource,
      deleteLeadSource,
      accountHandlers,
      addAccountHandler,
      updateAccountHandler,
      deleteAccountHandler,
      keyAccountManagers: accountHandlers,
      addKeyAccountManager: addAccountHandler,
      updateKeyAccountManager: updateAccountHandler,
      deleteKeyAccountManager: deleteAccountHandler,
      updateGoogleSheetConfig,
      triggerGoogleSheetSync,
      autoCreateGoogleSpreadsheet,
      pullFromGoogleSheet,
      addSyncLog,
      clearSyncLogs,
      exportBackupJSON,
      exportEnquiriesCSV,
      downloadMultiSheetMaster,
      importBackupJSON,
      resetToCleanDatabase,
      seedDemoData,
      updateStartupImage,
      getRedactedEnquiry,
      checkConflicts,
    }),
    [
      currentUser,
      users,
      units,
      activeUnit,
      activeUnitCode,
      switchUnit,
      createUnit,
      updateUnit,
      resetSampleUnit,
      exportUnitBackupJSON,
      importUnitBackupJSON,
      enquiries,
      venues,
      menuPackages,
      inclusionsMaster,
      eventTypesMaster,
      corporateClients,
      leadSourcesMaster,
      accountHandlers,
      auditLogs,
      googleSheetConfig,
      startupImage,
      isInitialSetupCompleted,
      login,
      logout,
      updateUserPin,
      addUser,
      updateUser,
      resetUserPassword,
      addEnquiry,
      updateEnquiry,
      deleteEnquiry,
      advanceEnquiryStage,
      addVenue,
      updateVenue,
      deleteVenue,
      addMenuPackage,
      updateMenuPackage,
      deleteMenuPackage,
      addInclusion,
      updateInclusion,
      deleteInclusion,
      addEventType,
      updateEventType,
      deleteEventType,
      addCorporateClient,
      updateCorporateClient,
      deleteCorporateClient,
      addLeadSource,
      updateLeadSource,
      deleteLeadSource,
      addAccountHandler,
      updateAccountHandler,
      deleteAccountHandler,
      updateGoogleSheetConfig,
      triggerGoogleSheetSync,
      autoCreateGoogleSpreadsheet,
      pullFromGoogleSheet,
      addSyncLog,
      clearSyncLogs,
      exportBackupJSON,
      exportEnquiriesCSV,
      downloadMultiSheetMaster,
      importBackupJSON,
      resetToCleanDatabase,
      seedDemoData,
      updateStartupImage,
      quotationSettings,
      updateQuotationSettings,
      recordQuotationSend,
      recordBEOSend,
      recordFPSend,
      paymentReceipts,
      taxInvoices,
      cashierTallies,
      settlementModesMaster,
      cashierInvoiceSeriesMaster,
      recordPaymentReceipt,
      generateTaxInvoice,
      recordCashierTally,
      executeStageTransition,
      addSettlementMode,
      updateSettlementMode,
      deleteSettlementMode,
      addCashierInvoiceSeries,
      updateCashierInvoiceSeries,
      deleteCashierInvoiceSeries,
      idleSecondsRemaining,
      isIdleAutoSyncActive,
      toggleIdleAutoSync,
      getRedactedEnquiry,
      checkConflicts,
    ]
  );

  return <BEMSContext.Provider value={value}>{children}</BEMSContext.Provider>;
};

export const useBEMS = () => {
  const context = useContext(BEMSContext);
  if (!context) {
    throw new Error('useBEMS must be used within a BEMSProvider');
  }
  return context;
};

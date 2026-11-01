export type UserRole = 'SuperAdmin' | 'Admin' | 'Editor' | 'Commenter' | 'Collaborator';

export interface HotelUnit {
  code: string; // 2 letters + 2 digits, e.g. "TN01", "SM00", "KA01"
  name: string; // e.g. "The Residency Towers", "TrialHall"
  subtitle: string; // e.g. "Chennai • Luxury Banquets & Convention Centre"
  address: string;
  phone: string;
  email: string;
  logoUrl?: string;
  isSampleUnit?: boolean; // true for "SM00" sales pitch unit
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export interface UserAccount {
  id: string;
  username: string;
  password: string; // Plain/stored for admin viewing per specifications
  pin?: string;     // 4-digit numeric PIN for quick login / non-admin verification
  role: UserRole;
  name: string;
  email?: string;
  assignedUnitCode?: string; // 'ALL' for SuperAdmin; e.g. 'TN01', 'SM00' for localized unit users
  mustChangePassword?: boolean;
}

export type BusinessSource =
  | 'Dir - Ops'
  | 'Sales Team'
  | 'TRT Banquets'
  | 'Ex Client Ref'
  | 'Walkin';

export type SessionSlot =
  | '07:00-12:00'
  | '09:00-18:00'
  | '13:00-19:00'
  | '17:00-23:00'
  | '08:00-23:00'
  | string; // Open Choice custom range (e.g. "10:30-16:30")

export type MenuCategory = 'Veg' | 'Mixed Nonveg' | 'Jain(Hall Rent Only)' | string;

export type RateBillingType = 'Hall Rent only' | 'Venue with Meal';

export type SeatingArrangement =
  | 'Theatre'
  | 'Cluster'
  | 'ClassRoom'
  | 'Casual'
  | 'Boardroom'
  | 'U-shaped'
  | 'Banana Leaf Service';

export type PipelineStage =
  | 'Portfolio Creation'
  | 'Quote Shared'
  | 'Negotiation'
  | 'Confirmed'
  | 'Postponed'
  | 'Cancelled'
  | 'Initial Discussion - Quote Sharing (Tentative)'
  | 'Venue Walkthrough Completed (Tentative)'
  | 'Expression of Interest (Tentative)'
  | 'Negotiation (Tentative)'
  | 'Food Trial'
  | 'Advance Paid (EXCLUSIVE LOCK)'
  | 'Balance Paid'
  | 'Function Completed'
  | 'Function Completed and Gift Sent';

export type FinalStatus =
  | 'Tentative'
  | 'Exclusive Lock'
  | 'Confirmed'
  | 'Completed'
  | 'Archived'
  | 'Postponed'
  | 'Cancelled';

export interface RateItem {
  id: string;
  description: string;
  amount: number;
  taxRate: number; // 5.0% to 23.9%
  taxAmount: number;
  totalWithTax: number;
  isInclusive?: boolean; // When true, user entered all-inclusive net rate
  inclusiveAmount?: number; // User spoken net all-inclusive rate
}

export interface FollowUpItem {
  id: string;
  index: number;
  date: string;
  remark: string;
}

export interface Enquiry {
  id: string;
  unitCode?: string; // Hotel Unit code e.g. 'TN01' or 'SM00'
  refNo: string; // Auto-generated e.g. 26080001 (YYMMXXXX)
  enquiryDate: string; // YYYY-MM-DD
  guestName: string;
  companyName: string;
  businessSource: BusinessSource;
  firstContactPerson?: string; // Legacy fallback
  keyAccountManager?: string; // Key Account Manager (KAM)
  keyAccountManagerId?: string;
  keyAccountManagerDepartment?: string;
  keyAccountManagerMobile?: string;
  keyAccountManagerEmail?: string;
  accountHandler: string; // Account Handler / Key Account Manager
  accountHandlerId?: string;
  accountHandlerMobile?: string;
  accountHandlerEmail?: string;
  eventDate: string; // YYYY-MM-DD
  eventType: string; // 46 categories
  functionBanner?: string; // Legacy fallback, unified into boardToRead
  boardToRead: string; // Welcome Board Display (unified lobby and banquet board)
  hallId: string;
  hallName: string;
  seatingArrangement: SeatingArrangement;
  gPax: number; // Guaranteed Pax
  expPax: number; // Expected Pax (always >= gPax, defaults >= +10%)
  session: SessionSlot;
  menu: MenuCategory;
  rateBillingType: RateBillingType;
  inclusions: string[];
  detailedInclusions?: EnquiryInclusionItem[]; // Inclusions with individual rates and FOC flags
  totalFocSavings?: number; // Total value of complimentary amenities
  status: PipelineStage;
  finalStatus: FinalStatus;

  // Sensitive fields tagged SS (Redacted for Collaborator)
  guestMobileMain?: string;
  guestMobileBackup?: string;
  email?: string;
  quotedBaseRate?: number;
  isAllInclusiveRate?: boolean; // True if rate was entered as all-inclusive net
  allInclusiveRate?: number; // Net all-inclusive spoken rate
  taxRatePercent?: number;
  taxAmount?: number;
  rateItems?: RateItem[];
  finalBillValue?: number;
  remarks?: string;
  remarks1?: string;
  remarks2?: string;
  remarks3?: string;
  followUps?: FollowUpItem[];
  followUp1Date?: string;
  followUp2Date?: string;
  followUp3Date?: string;
  noFollowUpRequired?: boolean;

  // Additional operational parameters
  postponedDate?: string | 'Indefinitely';
  mgOverrideReason?: string;
  advanceAmount?: number;
  advancePaidDate?: string;
  balanceAmount?: number;
  balancePaidDate?: string;
  giftDeliveredDate?: string;
  isWaitlisted?: boolean;
  // Quotation & Multi-channel Dispatch History
  quotationSendHistory?: QuotationSendRecord[];
  
  // Enterprise Banquet Extensions
  secondaryHalls?: SecondaryHallBooking[];
  beoDetails?: BEODetails;
  beoSendHistory?: BEOSendRecord[];
  fpDetails?: FunctionProspectusDetails;
  fpSendHistory?: FPSendRecord[];
  paymentReceipts?: PaymentReceipt[];
  invoices?: TaxInvoice[];
  advancePaidAmount?: number;
  balanceDueAmount?: number;
  isMuhurthamDate?: boolean;
  muhurthamNotes?: string;
  followUpPriority?: 'High' | 'Normal' | 'Low';
  tentativeHoldExpiresAt?: string; // YYYY-MM-DD or ISO timestamp
  focInclusions?: string[]; // Inclusions marked Free of Charge (FOC)
  inclusionsDiscountTotal?: number; // Total discount from FOC inclusions
  
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface SeatingLayoutConfig {
  capacityMin: number;
  capacityMax: number;
  mg: number;
}

export interface VenueHall {
  id: string;
  name: string;
  areaSqFt: number;
  dimensions?: string;
  ceilingHeight?: string;
  preFunctionArea?: string;
  status: 'Active' | 'Inactive';
  defaultMg: number;
  layouts: {
    Theatre?: SeatingLayoutConfig;
    Cluster?: SeatingLayoutConfig;
    ClassRoom?: SeatingLayoutConfig;
    Casual?: SeatingLayoutConfig;
    Boardroom?: SeatingLayoutConfig;
    'U-shaped'?: SeatingLayoutConfig;
    'Banana Leaf Service'?: SeatingLayoutConfig;
  };
}

export interface MenuPackageMaster {
  id: string;
  name: string;
  category: MenuCategory;
  baseRatePerPax: number;
  minimumPax: number;
  courseDetails: string;
  description?: string;
  status: 'Active' | 'Inactive';
}

export interface InclusionMaster {
  id: string;
  name: string;
  category: 'AV & Sound' | 'Decor & Stage' | 'Amenities' | 'F&B Counters' | 'Meeting Support' | 'Other';
  pricingType: 'Complimentary' | 'Chargeable';
  defaultRate: number;
  description?: string;
  status: 'Active' | 'Inactive';
}

export interface EventTypeMaster {
  id: string;
  name: string;
  category: 'Social' | 'Corporate' | 'MICE' | 'Ceremony' | 'Other';
  defaultLayout?: SeatingArrangement;
  estimatedAvgPax?: number;
  description?: string;
  status: 'Active' | 'Inactive';
}

export interface CorporateClientMaster {
  id: string;
  companyName: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  gstin: string;
  billingAddress: string;
  clientTier: 'Platinum' | 'Gold' | 'Standard';
  creditDays: number;
  notes?: string;
  status: 'Active' | 'Inactive';
}

export interface LeadSourceMaster {
  id: string;
  name: string;
  channelType: 'Direct' | 'Internal' | 'Referral' | 'Online' | 'Partner';
  description?: string;
  status: 'Active' | 'Inactive';
}

export interface KeyAccountManagerMaster {
  id: string;
  name: string;
  departmentRole: string; // e.g. "Senior Banquet Sales Specialist", "Corporate Key Accounts", "Weddings & Social Events"
  role?: string; // alias of departmentRole for compatibility
  designation?: string; // alias of departmentRole for compatibility
  mobile: string;
  phone?: string; // alias of mobile
  email: string;
  status: 'Active' | 'Inactive';
}

export type AccountHandlerMaster = KeyAccountManagerMaster;

export interface EnquiryInclusionItem {
  id: string;
  name: string;
  standardRate: number;
  isFOC: boolean;
  notes?: string;
}

export interface AuditLogEntry {
  id: string;
  systemTimestamp: string;
  refNo: string;
  userId: string;
  fieldModified: string;
  previousValue: string;
  newValue: string;
  actionType: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOCK_ACQUIRED' | 'STATUS_CHANGE' | 'SYNC' | 'RESTORE';
}

export interface GoogleSheetSyncConfig {
  sheetUrl: string;
  sheetId: string;
  sheetName: string;
  webAppUrl?: string;
  isLinked: boolean;
  lastSyncedAt?: string | null;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error' | 'unlinked';
  lastError?: string;
  autoSyncEnabled: boolean;
  syncLogs: { timestamp: string; message: string; type: 'success' | 'info' | 'error' }[];
}

export interface TaxCalculationHistoryEntry {
  id: string;
  timestamp: string;
  items: RateItem[];
  totalBaseRate: number;
  totalTaxes: number;
  billedValue: number;
}

export type QuotationChannel = 'WhatsApp' | 'Gmail' | 'Telegram' | 'PDF Download';

export interface QuotationSendRecord {
  id: string;
  timestamp: string;
  channel: QuotationChannel;
  recipient: string;
  sentBy: string;
  status: 'Sent' | 'Downloaded';
  notes?: string;
}

export interface QuotationSectionConfig {
  id: string;
  title: string;
  contentHtml: string;
  order: number;
  isEnabled: boolean;
  isDeletable?: boolean;
}

export interface QuotationSettingsConfig {
  hotelName: string;
  hotelSubtitle: string;
  hotelAddress: string;
  hotelPhone: string;
  hotelEmail: string;
  hotelGstin: string;
  hotelFssai?: string;
  logoUrl?: string; // Data URL or external link
  accentColor: string;
  sections: QuotationSectionConfig[]; // 5+ configurable sections
}

// Multi-Hall Composite Booking Specification
export interface SecondaryHallBooking {
  hallId: string;
  hallName: string;
  session?: SessionSlot;
  allocatedPax?: number;
  purpose?: 'Dining' | 'Main Function' | 'Pre-Function / Registration' | 'Mandapam / Ceremony' | 'Bride/Groom Suite';
}

// Banquet Event Order (BEO) & Kitchen Function Sheet Details
export interface BEODetails {
  // Service Sequence & Timelines
  hallAccessTime?: string;
  guestArrivalTime?: string;
  starterServiceTime?: string;
  buffetOpeningTime?: string;
  dessertClearanceTime?: string;
  liquorServiceStartTime?: string;
  liquorServiceEndTime?: string;

  // Kitchen & F&B Specifications
  menuItemsSelected?: string[];
  liveCounters?: string[];
  welcomeDrinks?: string[];
  dessertsSpecial?: string[];
  chefNotes?: string;
  specialDietary?: string; // e.g., "15 Jain meals, 5 Gluten-Free"
  spicinessLevel?: 'Mild' | 'Medium' | 'Authentic Chettinad/Spicy';

  // Hall & Setup Checklist
  stageDimensions?: string;
  podiumRequired?: boolean;
  registrationDesk?: boolean;
  tableClothColor?: string;
  airConditionPreCoolTime?: string;

  // Audio-Visual & Technical Checklist
  cordlessMicsCount?: number;
  collarMicsCount?: number;
  projectorScreensCount?: number;
  laptopAudioPatch?: boolean;
  djMusicArrangement?: 'Hotel Playlist' | 'Client DJ' | 'Live Band' | 'None';
  specialLightingNotes?: string;

  // Department Sign-Offs
  banquetManagerSign?: string;
  executiveChefSign?: string;
  beverageManagerSign?: string;
  engineeringAvSign?: string;
  guestSignDate?: string;
}

export type BEODepartment = 'Kitchen' | 'Banquet Service' | 'Engineering & AV' | 'All Departments';

export interface BEOSendRecord {
  id: string;
  timestamp: string;
  department: BEODepartment;
  channel: QuotationChannel;
  recipient: string;
  sentBy: string;
  status: 'Sent' | 'Downloaded';
  notes?: string;
}

// Function Prospectus (FP) - Evolution of BEO
export type FunctionProspectusDetails = BEODetails;
export type FPDepartment = BEODepartment;
export type FPSendRecord = BEOSendRecord;

// Payment & Settlement Modes
export type SettlementMode =
  | 'Cash'
  | 'Credit Card'
  | 'Debit Card'
  | 'UPI / QR'
  | 'Direct Bank Transfer (NEFT/RTGS)'
  | 'Bill to Company (BTC)';

export interface PaymentReceipt {
  id: string;
  receiptNo: string;
  enquiryId: string;
  enquiryRefNo: string;
  guestName: string;
  companyName?: string;
  paymentType: 'Advance' | 'Part Payment' | 'Final Settlement' | 'Security Deposit';
  amount: number;
  settlementMode: SettlementMode;
  transactionRef?: string;
  receivedBy: string;
  timestamp: string;
  notes?: string;
}

export interface TaxInvoiceLineItem {
  id: string;
  description: string;
  sacCode: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface TaxInvoice {
  id: string;
  invoiceNo: string;
  invoiceType: 'Proforma' | 'Tax Invoice';
  enquiryId: string;
  enquiryRefNo: string;
  guestName: string;
  companyName?: string;
  billingAddress: string;
  gstin?: string;
  invoiceDate: string;
  dueDate: string;
  lineItems: TaxInvoiceLineItem[];
  subtotal: number;
  cgstRate: number; // 9%
  cgstAmount: number;
  sgstRate: number; // 9%
  sgstAmount: number;
  totalAmount: number;
  advanceAdjusted: number;
  netPayable: number;
  status: 'Draft' | 'Issued' | 'Settled' | 'Void';
  generatedBy: string;
  settledAt?: string;
}

export interface CashierTallyEntry {
  id: string;
  tallyNo: string;
  cashierName: string;
  date: string;
  shift: 'Morning' | 'Evening' | 'Full Day';
  counterNo: string;
  totalCash: number;
  totalCards: number;
  totalUPI: number;
  totalBank: number;
  totalBTC: number;
  totalCollection: number;
  receiptCount: number;
  reconciled: boolean;
  notes?: string;
  timestamp: string;
}

export interface SettlementModeMaster {
  id: string;
  name: SettlementMode;
  glCode: string;
  chargePercentage?: number;
  isActive: boolean;
  notes?: string;
}

export interface CashierInvoiceSeriesMaster {
  id: string;
  seriesPrefix: string;
  currentSequence: number;
  financialYear: string;
  cashierCounter: string;
  isActive: boolean;
  notes?: string;
}



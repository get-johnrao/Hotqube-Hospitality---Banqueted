import React, { useState, useEffect, useMemo } from 'react';
import { useBEMS } from '../context/BEMSContext';
import {
  Enquiry,
  RateItem,
  BusinessSource,
  MenuCategory,
  RateBillingType,
  SeatingArrangement,
  PipelineStage,
  SecondaryHallBooking,
  EnquiryInclusionItem,
} from '../types';
import {
  BUSINESS_SOURCES,
  MENU_CATEGORIES,
  RATE_BILLING_TYPES,
  INCLUSIONS_OPTIONS,
  SEATING_ARRANGEMENTS,
  SESSION_TIME_SLOTS,
  PIPELINE_STAGES,
  EVENT_TYPES_46,
} from '../data/initialData';
import {
  formatINR,
  addDaysToDate,
  generateRefNo,
  calculateFromInclusiveRate,
} from '../utils/formatters';
import { getMuhurthamInfo } from '../data/muhurthamData';
import { MGOverrideModal } from './MGOverrideModal';
import { OpenChoiceTimeModal } from './OpenChoiceTimeModal';
import { CorporateClientMasterModal } from './masters/CorporateClientMasterModal';
import { TaxCalculationModal } from './TaxCalculationModal';
import { QuotationSendHubModal } from './QuotationSendHubModal';
import { generateBanquetQuotationPdf } from '../utils/pdfQuotationGenerator';
import {
  X,
  Save,
  AlertCircle,
  Calculator,
  Clock,
  Lock,
  Calendar,
  Sparkles,
  ShieldAlert,
  Users,
  Edit2,
  CheckCircle,
  Plus,
  Trash2,
  FileDown,
  Send,
  Flame,
  Layers,
} from 'lucide-react';

interface AddEditEnquiryModalProps {
  enquiryToEdit?: Enquiry | null;
  initialEnquiry?: Enquiry | null;
  initialDate?: string;
  initialHallId?: string;
  initialSlot?: { hallId?: string; date?: string; session?: string };
  onClose: () => void;
  onSaved?: (refNo: string) => void;
  onOpenTaxCalculator?: () => void;
}

export const AddEditEnquiryModal: React.FC<AddEditEnquiryModalProps> = ({
  enquiryToEdit,
  initialEnquiry,
  initialDate,
  initialHallId,
  initialSlot,
  onClose,
  onSaved,
  onOpenTaxCalculator,
}) => {
  const targetEnquiry = enquiryToEdit || initialEnquiry;
  const effectiveInitialDate = initialDate || initialSlot?.date;
  const effectiveInitialHallId = initialHallId || initialSlot?.hallId;
  const effectiveInitialSession = initialSlot?.session;

  const {
    currentUser,
    venues,
    enquiries,
    addEnquiry,
    updateEnquiry,
    checkConflicts,
    menuPackages,
    inclusionsMaster,
    eventTypesMaster,
    corporateClients,
    leadSourcesMaster,
    accountHandlers,
    quotationSettings,
    recordQuotationSend,
  } = useBEMS();

  // Active Masters Mapping
  const activeEventTypes = useMemo(() => {
    const list = (eventTypesMaster || []).filter(e => e.status === 'Active').map(e => e.name);
    return list.length > 0 ? list : EVENT_TYPES_46;
  }, [eventTypesMaster]);

  const activeLeadSources = useMemo(() => {
    const list = (leadSourcesMaster || []).filter(s => s.status === 'Active').map(s => s.name);
    return list.length > 0 ? list : (BUSINESS_SOURCES as unknown as string[]);
  }, [leadSourcesMaster]);

  const activeCorporateClients = useMemo(() => {
    return (corporateClients || []).filter(c => c.status === 'Active');
  }, [corporateClients]);

  const activeMenuPackages = useMemo(() => {
    return (menuPackages || []).filter(p => p.status === 'Active');
  }, [menuPackages]);

  const availableInclusions = useMemo(() => {
    if (inclusionsMaster && inclusionsMaster.length > 0) {
      return inclusionsMaster.filter(i => i.status === 'Active');
    }
    return INCLUSIONS_OPTIONS.map(name => ({
      id: name,
      name,
      category: 'Amenities' as const,
      pricingType: 'Complimentary' as const,
      defaultRate: 0,
      description: '',
      status: 'Active' as const,
    }));
  }, [inclusionsMaster]);

  const isCollaborator = currentUser?.role === 'Collaborator';
  const isCommenter = currentUser?.role === 'Commenter';

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
  }, []);

  // Access control for Follow-Up Engine (accessible when booking is pulled from pipeline)
  const canAccessFollowUpEngine = Boolean(targetEnquiry?.id || targetEnquiry?.refNo);

  // Form Fields
  const [guestName, setGuestName] = useState(targetEnquiry?.guestName || '');
  const [companyName, setCompanyName] = useState(targetEnquiry?.companyName || '');
  const [businessSource, setBusinessSource] = useState<BusinessSource>(
    targetEnquiry?.businessSource || 'Sales Team'
  );
  // Account Handler (Replaces First Contact Person, mapped from Account Handler Master)
  const [accountHandler, setAccountHandler] = useState(
    targetEnquiry?.accountHandler || targetEnquiry?.firstContactPerson || (accountHandlers[0]?.name || '')
  );
  const [enquiryDate, setEnquiryDate] = useState(targetEnquiry?.enquiryDate || todayStr);
  const [eventDate, setEventDate] = useState(
    targetEnquiry?.eventDate || effectiveInitialDate || addDaysToDate(todayStr, 7)
  );
  const [eventType, setEventType] = useState(targetEnquiry?.eventType || 'Wedding Reception');
  const [showOpenItemModal, setShowOpenItemModal] = useState(false);
  const [customEventInput, setCustomEventInput] = useState('');

  // Venue & Seating
  const activeVenues = useMemo(() => venues.filter(v => v.status === 'Active' || v.id === targetEnquiry?.hallId), [venues, targetEnquiry]);
  const [hallId, setHallId] = useState(targetEnquiry?.hallId || effectiveInitialHallId || activeVenues[0]?.id || 'hall-ballroom-1');
  const selectedVenue = useMemo(() => venues.find(v => v.id === hallId) || activeVenues[0], [venues, hallId, activeVenues]);

  const [seatingArrangement, setSeatingArrangement] = useState<SeatingArrangement>(
    targetEnquiry?.seatingArrangement || 'Theatre'
  );

  // Secondary Composite Halls (for weddings / multi-hall conventions)
  const [secondaryHalls, setSecondaryHalls] = useState<SecondaryHallBooking[]>(targetEnquiry?.secondaryHalls || []);

  // Auspicious Muhurtham date info (Tamil Nadu calendar)
  const muhurthamInfo = useMemo(() => getMuhurthamInfo(eventDate), [eventDate]);

  // Calculate Layout Minimum Guarantee
  const layoutMG = useMemo(() => {
    if (!selectedVenue) return 100;
    const layoutConfig = selectedVenue.layouts[seatingArrangement as keyof typeof selectedVenue.layouts];
    if (layoutConfig && layoutConfig.mg) {
      return layoutConfig.mg;
    }
    return selectedVenue.defaultMg || 100;
  }, [selectedVenue, seatingArrangement]);

  const [gPax, setGPax] = useState<number>(() => {
    if (targetEnquiry?.gPax !== undefined) return targetEnquiry.gPax;
    return layoutMG;
  });
  // Rule 4: Expected Pax is always autofilled to at least 10% more than Guaranteed Pax
  const [expPax, setExpPax] = useState<number>(() => {
    if (targetEnquiry?.expPax !== undefined) return Math.max(targetEnquiry.expPax, targetEnquiry.gPax || layoutMG);
    return Math.max(Math.ceil(layoutMG * 1.10), layoutMG);
  });
  const [expPaxWarning, setExpPaxWarning] = useState<string | null>(null);

  const [mgOverrideReason, setMgOverrideReason] = useState<string>(
    targetEnquiry?.mgOverrideReason || ''
  );
  const [showMGOverrideModal, setShowMGOverrideModal] = useState(false);
  const [pendingGPaxValue, setPendingGPaxValue] = useState<number | null>(null);

  // Session
  const [session, setSession] = useState<string>(targetEnquiry?.session || effectiveInitialSession || '09:00-18:00');
  const [showCustomTimeModal, setShowCustomTimeModal] = useState(false);

  // Menu, Inclusions & Billing
  const [menu, setMenu] = useState<MenuCategory>(targetEnquiry?.menu || 'Veg');
  // Unified Welcome Board Display (removes duplicate Function Banner)
  const [boardToRead, setBoardToRead] = useState(
    targetEnquiry?.boardToRead || targetEnquiry?.functionBanner || ''
  );
  const [rateBillingType, setRateBillingType] = useState<RateBillingType>(
    targetEnquiry?.rateBillingType || 'Venue with Meal'
  );
  const [inclusions, setInclusions] = useState<string[]>(
    targetEnquiry?.inclusions || []
  );

  // Detailed Package Inclusions with FOC discount capability
  const [detailedInclusions, setDetailedInclusions] = useState<EnquiryInclusionItem[]>(() => {
    if (targetEnquiry?.detailedInclusions && targetEnquiry.detailedInclusions.length > 0) {
      return targetEnquiry.detailedInclusions;
    }
    if (targetEnquiry?.inclusions && targetEnquiry.inclusions.length > 0) {
      return targetEnquiry.inclusions.map(name => {
        const found = (inclusionsMaster || []).find(i => i.name === name);
        const isFoc = (targetEnquiry.focInclusions || []).includes(name) || found?.pricingType === 'Complimentary';
        return {
          id: found?.id || name,
          name,
          standardRate: found?.defaultRate || 0,
          isFOC: isFoc,
        };
      });
    }
    return [];
  });

  const totalFocSavings = useMemo(() => {
    return detailedInclusions
      .filter(item => item.isFOC && item.standardRate > 0)
      .reduce((sum, item) => sum + item.standardRate, 0);
  }, [detailedInclusions]);

  // Pipeline Status (Initial default status to be 'Portfolio Creation' per requirements)
  const [status, setStatus] = useState<PipelineStage>(
    targetEnquiry?.status || 'Portfolio Creation'
  );
  const [postponedDate, setPostponedDate] = useState<string>(
    targetEnquiry?.postponedDate || addDaysToDate(todayStr, 30)
  );
  const [isPostponedIndefinitely, setIsPostponedIndefinitely] = useState<boolean>(
    targetEnquiry?.postponedDate === 'Indefinitely'
  );

  // Sensitive Fields (SS)
  const [guestMobileMain, setGuestMobileMain] = useState(targetEnquiry?.guestMobileMain || '');
  const [guestMobileBackup, setGuestMobileBackup] = useState(
    targetEnquiry?.guestMobileBackup || ''
  );
  const [email, setEmail] = useState(targetEnquiry?.email || '');

  // Base rate based on menu: Veg = 3500, Mixed Nonveg = 3800, Jain = blank
  const [quotedBaseRate, setQuotedBaseRate] = useState<number | ''>(() => {
    if (targetEnquiry?.quotedBaseRate !== undefined) return targetEnquiry.quotedBaseRate;
    if (targetEnquiry?.menu === 'Mixed Nonveg') return 3800;
    if (targetEnquiry?.menu === 'Jain(Hall Rent Only)') return '';
    return 3500;
  });

  // Tax rate (between 18.0% and 23.9%, default 18.0%)
  const [taxRatePercent, setTaxRatePercent] = useState<number>(() => {
    if (targetEnquiry?.taxRatePercent !== undefined) return targetEnquiry.taxRatePercent;
    return 18.0;
  });

  // All-Inclusive Rate toggle and value
  const [isAllInclusiveRate, setIsAllInclusiveRate] = useState<boolean>(() => {
    return targetEnquiry?.isAllInclusiveRate || false;
  });

  const [allInclusiveRate, setAllInclusiveRate] = useState<number | ''>(() => {
    if (targetEnquiry?.allInclusiveRate !== undefined) return targetEnquiry.allInclusiveRate;
    if (targetEnquiry?.isAllInclusiveRate && targetEnquiry?.quotedBaseRate) {
      const taxR = targetEnquiry.taxRatePercent || 18.0;
      return Math.round(targetEnquiry.quotedBaseRate * (1 + taxR / 100));
    }
    return '';
  });

  const [isTaxModalOpen, setIsTaxModalOpen] = useState<boolean>(false);

  const handleAllInclusiveRateChange = (valStr: string) => {
    if (valStr === '') {
      setAllInclusiveRate('');
      setQuotedBaseRate('');
      return;
    }
    const val = parseFloat(valStr) || 0;
    setAllInclusiveRate(val);
    const { baseRate } = calculateFromInclusiveRate(val, taxRatePercent);
    setQuotedBaseRate(baseRate);
  };

  const handleTaxRateChange = (newTaxRate: number) => {
    setTaxRatePercent(newTaxRate);
    if (isAllInclusiveRate && typeof allInclusiveRate === 'number' && allInclusiveRate > 0) {
      const { baseRate } = calculateFromInclusiveRate(allInclusiveRate, newTaxRate);
      setQuotedBaseRate(baseRate);
    }
  };

  const handleToggleAllInclusive = (checked: boolean) => {
    setIsAllInclusiveRate(checked);
    if (checked) {
      if (typeof quotedBaseRate === 'number' && quotedBaseRate > 0) {
        const incVal = Math.round(quotedBaseRate * (1 + taxRatePercent / 100));
        setAllInclusiveRate(incVal);
      }
    } else {
      // Retain current quotedBaseRate
    }
  };

  // Derived financial calculations: Base Subtotal, Tax Amount, Final Billed Value
  const baseRateNumeric = typeof quotedBaseRate === 'number' ? quotedBaseRate : 0;
  const baseSubtotal = Math.round(baseRateNumeric * layoutMG);
  const taxAmount = Math.round(baseSubtotal * (taxRatePercent / 100));
  const computedFinalBillValue = baseSubtotal + taxAmount;

  const [rateItems, setRateItems] = useState<RateItem[]>(targetEnquiry?.rateItems || []);
  const [finalBillValue, setFinalBillValue] = useState<number>(
    targetEnquiry?.finalBillValue || computedFinalBillValue
  );

  // Automatically update final billed value when quoted rate, MG or tax percentage change
  useEffect(() => {
    setFinalBillValue(computedFinalBillValue);
  }, [computedFinalBillValue]);

  // Handle menu changes with auto-price rules
  const handleMenuChange = (newMenu: MenuCategory) => {
    setMenu(newMenu);
    if (newMenu === 'Veg') {
      if (isAllInclusiveRate) {
        handleAllInclusiveRateChange(String(Math.round(3500 * (1 + taxRatePercent / 100))));
      } else {
        setQuotedBaseRate(3500);
      }
    } else if (newMenu === 'Mixed Nonveg') {
      if (isAllInclusiveRate) {
        handleAllInclusiveRateChange(String(Math.round(3800 * (1 + taxRatePercent / 100))));
      } else {
        setQuotedBaseRate(3800);
      }
    } else if (newMenu === 'Jain(Hall Rent Only)') {
      setQuotedBaseRate('');
      setAllInclusiveRate('');
    }
  };

  const [remarks, setRemarks] = useState(targetEnquiry?.remarks || '');
  const [remarks1, setRemarks1] = useState(targetEnquiry?.remarks1 || '');
  const [remarks2, setRemarks2] = useState(targetEnquiry?.remarks2 || '');
  const [remarks3, setRemarks3] = useState(targetEnquiry?.remarks3 || '');

  // Unrestricted follow-up items list (supports unlimited follow-up remarks: 1, 2, 3, 4, 5...)
  const [followUpList, setFollowUpList] = useState<Array<{ id: string; index: number; date: string; remark: string }>>(() => {
    if (targetEnquiry?.followUps && targetEnquiry.followUps.length > 0) {
      return targetEnquiry.followUps.map((fu, idx) => ({
        id: fu.id || `fu-${idx + 1}`,
        index: idx + 1,
        date: fu.date || '',
        remark: fu.remark || '',
      }));
    }
    const initialList: Array<{ id: string; index: number; date: string; remark: string }> = [];
    const f1Date = targetEnquiry?.followUp1Date || addDaysToDate(targetEnquiry?.enquiryDate || enquiryDate || new Date().toISOString().split('T')[0], 2);
    initialList.push({
      id: 'fu-1',
      index: 1,
      date: f1Date,
      remark: targetEnquiry?.remarks1 || '',
    });
    if (targetEnquiry?.followUp2Date || targetEnquiry?.remarks2) {
      initialList.push({
        id: 'fu-2',
        index: 2,
        date: targetEnquiry.followUp2Date || '',
        remark: targetEnquiry.remarks2 || '',
      });
    }
    if (targetEnquiry?.followUp3Date || targetEnquiry?.remarks3) {
      initialList.push({
        id: 'fu-3',
        index: 3,
        date: targetEnquiry.followUp3Date || '',
        remark: targetEnquiry.remarks3 || '',
      });
    }
    return initialList;
  });

  const handleUpdateFollowUp = (id: string, field: 'date' | 'remark', value: string) => {
    setFollowUpList(prev =>
      prev.map(item => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleAddFollowUp = () => {
    const nextIndex = followUpList.length + 1;
    const lastItem = followUpList[followUpList.length - 1];
    const baseDate = lastItem?.date || todayStr;
    const nextDate = addDaysToDate(baseDate, 2);
    setFollowUpList(prev => [
      ...prev,
      {
        id: 'fu-' + Math.random().toString(36).substring(2, 9),
        index: nextIndex,
        date: nextDate,
        remark: '',
      },
    ]);
  };

  const handleRemoveFollowUp = (id: string) => {
    if (followUpList.length <= 1) return;
    setFollowUpList(prev =>
      prev.filter(item => item.id !== id).map((item, idx) => ({ ...item, index: idx + 1 }))
    );
  };

  // Confirmed or completed functions require no follow-up
  const isFunctionConfirmedOrCompleted =
    status === 'Confirmed' ||
    status === 'Advance Paid (EXCLUSIVE LOCK)' ||
    status === 'Balance Paid' ||
    status === 'Function Completed' ||
    status === 'Function Completed and Gift Sent';

  // Follow-up Cascading Dates
  const [followUp1Date, setFollowUp1Date] = useState(
    targetEnquiry?.followUp1Date || addDaysToDate(enquiryDate, 2)
  );
  const [followUp2Date, setFollowUp2Date] = useState(targetEnquiry?.followUp2Date || '');
  const [followUp3Date, setFollowUp3Date] = useState(targetEnquiry?.followUp3Date || '');
  const [noFollowUpRequired, setNoFollowUpRequired] = useState<boolean>(
    targetEnquiry?.noFollowUpRequired || false
  );

  // Modals & UI States
  const [validationError, setValidationError] = useState('');
  const [showFollowUp2Picker, setShowFollowUp2Picker] = useState(false);
  const [showFollowUp3Picker, setShowFollowUp3Picker] = useState(false);
  const [editingCorporateClientId, setEditingCorporateClientId] = useState<string | null>(null);
  const [quotationSendModalEnquiry, setQuotationSendModalEnquiry] = useState<Enquiry | null>(null);

  // When Seating Layout Changes -> adjust default G.Pax
  const handleSeatingChange = (newLayout: SeatingArrangement) => {
    setSeatingArrangement(newLayout);
    if (!targetEnquiry) {
      const config = selectedVenue?.layouts[newLayout as keyof typeof selectedVenue.layouts];
      const newMG = config?.mg || selectedVenue?.defaultMg || 100;
      setGPax(newMG);
      setExpPax(newMG + 20);
    }
  };

  // Conflict Detection for Selected Slot
  const conflictInfo = useMemo(() => {
    return checkConflicts(hallId, eventDate, session, targetEnquiry?.id);
  }, [checkConflicts, hallId, eventDate, session, targetEnquiry]);

  // Handle Pax change with MG restriction and automatic Expected Pax >= +10% rule
  const handleGPaxChange = (val: number) => {
    if (val < layoutMG) {
      setPendingGPaxValue(val);
      setShowMGOverrideModal(true);
    } else {
      setGPax(val);
      const minExp = Math.max(Math.ceil(val * 1.10), val);
      setExpPax(minExp);
      setExpPaxWarning(null);
    }
  };

  const handleConfirmMGOverride = (reason: string) => {
    if (pendingGPaxValue !== null) {
      setGPax(pendingGPaxValue);
      setMgOverrideReason(reason);
      const minExp = Math.max(Math.ceil(pendingGPaxValue * 1.10), pendingGPaxValue);
      setExpPax(minExp);
      setExpPaxWarning(null);
    }
    setShowMGOverrideModal(false);
    setPendingGPaxValue(null);
  };

  // Rule 4: Handle Exp Pax change with >= G.Pax enforcement and auto-reversion
  const handleExpPaxChange = (val: number) => {
    if (val < gPax) {
      const minExp = Math.max(Math.ceil(gPax * 1.10), gPax);
      setExpPaxWarning(`Rule Warning: Expected Pax (${val}) cannot be less than Guaranteed Pax (${gPax}). Reverting to minimum +10% buffer (${minExp} Pax).`);
      setExpPax(minExp);
    } else {
      setExpPax(val);
      setExpPaxWarning(null);
    }
  };

  const handleExpPaxBlur = () => {
    if (expPax < gPax) {
      const minExp = Math.max(Math.ceil(gPax * 1.10), gPax);
      setExpPaxWarning(`Rule Warning: Expected Pax cannot be less than Guaranteed Pax (${gPax}). Reverted to minimum +10% buffer (${minExp} Pax).`);
      setExpPax(minExp);
    }
  };

  // Handle Inclusions & FOC (Free of Charge) Toggle
  const toggleInclusion = (name: string, defaultRate: number = 0, isComp: boolean = false) => {
    if (inclusions.includes(name)) {
      setInclusions(prev => prev.filter(i => i !== name));
      setDetailedInclusions(prev => prev.filter(i => i.name !== name));
    } else {
      setInclusions(prev => [...prev, name]);
      setDetailedInclusions(prev => [
        ...prev,
        {
          id: name,
          name,
          standardRate: defaultRate,
          isFOC: isComp,
        },
      ]);
    }
    setValidationError('');
  };

  const toggleFOC = (name: string, defaultRate: number = 0) => {
    setDetailedInclusions(prev => {
      const exists = prev.find(i => i.name === name);
      if (exists) {
        return prev.map(i => (i.name === name ? { ...i, isFOC: !i.isFOC } : i));
      }
      return [
        ...prev,
        {
          id: name,
          name,
          standardRate: defaultRate,
          isFOC: true,
        },
      ];
    });
  };

  // Remarks 1 change trigger -> prompt Follow Up 2
  const handleRemarks1Blur = () => {
    if (remarks1.trim() && !followUp2Date && !noFollowUpRequired && !isFunctionConfirmedOrCompleted) {
      setShowFollowUp2Picker(true);
    }
  };

  // Remarks 2 change trigger -> prompt Follow Up 3
  const handleRemarks2Blur = () => {
    if (remarks2.trim() && !followUp3Date && !noFollowUpRequired && !isFunctionConfirmedOrCompleted) {
      setShowFollowUp3Picker(true);
    }
  };

  // Submission Validation
  const handleSave = (e?: React.FormEvent, action: 'save' | 'generate_quotation' = 'save') => {
    if (e) e.preventDefault();
    setValidationError('');

    // Commenter restriction check
    if (isCommenter && targetEnquiry) {
      // Commenter can edit remarks and follow-up milestones
      const updated = {
        ...targetEnquiry,
        remarks: remarks.trim(),
        remarks1: (followUpList[0]?.remark || '').trim(),
        remarks2: (followUpList[1]?.remark || '').trim(),
        remarks3: (followUpList[2]?.remark || '').trim(),
        followUps: followUpList.map(item => ({
          ...item,
          remark: item.remark.trim(),
        })),
        followUp1Date: followUpList[0]?.date || '',
        followUp2Date: followUpList[1]?.date || '',
        followUp3Date: followUpList[2]?.date || '',
      };
      updateEnquiry(updated);
      onClose();
      return;
    }

    // Strict Mandatory Fields Validation
    if (!guestName.trim()) {
      setValidationError('Guest Name is mandatory.');
      return;
    }
    if (!companyName.trim()) {
      setValidationError('Company Name is mandatory (enter "Private / Individual" if not a corporate event).');
      return;
    }
    if (!accountHandler.trim()) {
      setValidationError('Account Handler is mandatory.');
      return;
    }
    if (!boardToRead.trim()) {
      setValidationError('Welcome Board Display is mandatory.');
      return;
    }
    if (!eventDate) {
      setValidationError('Event Date is mandatory.');
      return;
    }

    // For non-collaborators, check sensitive mandatory fields
    if (!isCollaborator) {
      if (!guestMobileMain.trim()) {
        setValidationError('Primary Guest Mobile Number is mandatory.');
        return;
      }
      if (!guestMobileBackup.trim()) {
        setValidationError('Secondary / Backup Mobile Number is mandatory.');
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setValidationError('Valid Guest E-Mail address is mandatory.');
        return;
      }
      if (menu !== 'Jain(Hall Rent Only)' && (quotedBaseRate === '' || quotedBaseRate <= 0)) {
        setValidationError('Quoted Base Rate is mandatory for Veg and Mixed Nonveg menus.');
        return;
      }
      if (!remarks.trim()) {
        setValidationError('Initial Operational Remarks are mandatory.');
        return;
      }
    }

    // If G. Pax < layoutMG, ensure override reason exists
    if (gPax < layoutMG && (!mgOverrideReason || mgOverrideReason.length < 20)) {
      setShowMGOverrideModal(true);
      return;
    }

    // If exclusive lock selected on creation or update, warn if already locked by someone else
    if (status === 'Advance Paid (EXCLUSIVE LOCK)' && conflictInfo.hasExclusiveLock && conflictInfo.lockedBy?.id !== targetEnquiry?.id) {
      setValidationError(`Cannot place exclusive lock: Slot already locked exclusively by Ref #${conflictInfo.lockedBy?.refNo} (${conflictInfo.lockedBy?.guestName}).`);
      return;
    }

    const matchedAccountHandler = (accountHandlers || []).find(ah => ah.name === accountHandler);

    const payload: any = {
      guestName: guestName.trim(),
      companyName: companyName.trim(),
      businessSource,
      accountHandler: accountHandler.trim(),
      accountHandlerId: matchedAccountHandler?.id,
      accountHandlerMobile: matchedAccountHandler?.mobile || matchedAccountHandler?.phone,
      accountHandlerEmail: matchedAccountHandler?.email,
      firstContactPerson: accountHandler.trim(),
      enquiryDate,
      eventDate,
      eventType,
      functionBanner: boardToRead.trim(),
      hallId: selectedVenue.id,
      hallName: selectedVenue.name,
      seatingArrangement,
      gPax,
      expPax,
      session,
      menu,
      boardToRead: boardToRead.trim(),
      rateBillingType,
      inclusions,
      detailedInclusions,
      totalFocSavings,
      focInclusions: detailedInclusions.filter(i => i.isFOC).map(i => i.name),
      inclusionsDiscountTotal: totalFocSavings,
      status: targetEnquiry?.status || 'Portfolio Creation',
      postponedDate: status === 'Postponed' ? (isPostponedIndefinitely ? 'Indefinitely' : postponedDate) : undefined,
      mgOverrideReason: gPax < layoutMG ? mgOverrideReason : undefined,
      secondaryHalls: secondaryHalls.length > 0 ? secondaryHalls : undefined,
      isMuhurthamDate: Boolean(muhurthamInfo),
      muhurthamNotes: muhurthamInfo?.notes,
    };

    if (!isCollaborator) {
      payload.guestMobileMain = guestMobileMain.trim();
      payload.guestMobileBackup = guestMobileBackup.trim();
      payload.email = email.trim();
      payload.quotedBaseRate = baseRateNumeric;
      payload.taxRatePercent = taxRatePercent;
      payload.taxAmount = taxAmount;
      payload.isAllInclusiveRate = isAllInclusiveRate;
      payload.allInclusiveRate = typeof allInclusiveRate === 'number' ? allInclusiveRate : (isAllInclusiveRate && baseRateNumeric > 0 ? Math.round(baseRateNumeric * (1 + taxRatePercent / 100)) : undefined);
      payload.rateItems = rateItems.length > 0 ? rateItems : [
        {
          id: '1',
          description: `${selectedVenue.name} - ${rateBillingType} (${menu})`,
          amount: baseSubtotal,
          taxRate: taxRatePercent,
          taxAmount: taxAmount,
          totalWithTax: computedFinalBillValue,
          isInclusive: isAllInclusiveRate,
          inclusiveAmount: isAllInclusiveRate && typeof allInclusiveRate === 'number' ? allInclusiveRate * layoutMG : undefined,
        },
      ];
      payload.finalBillValue = computedFinalBillValue;
      payload.remarks = remarks.trim();
      payload.remarks1 = (followUpList[0]?.remark || remarks1).trim();
      payload.remarks2 = (followUpList[1]?.remark || remarks2).trim();
      payload.remarks3 = (followUpList[2]?.remark || remarks3).trim();
      payload.followUps = followUpList.map(item => ({
        ...item,
        remark: item.remark.trim(),
      }));
      payload.followUp1Date = followUpList[0]?.date || followUp1Date || '';
      payload.followUp2Date = followUpList[1]?.date || followUp2Date || '';
      payload.followUp3Date = followUpList[2]?.date || followUp3Date || '';
      payload.noFollowUpRequired = isFunctionConfirmedOrCompleted ? true : noFollowUpRequired;
    }

    let savedResult: Enquiry | null = null;
    if (targetEnquiry) {
      savedResult = {
        ...targetEnquiry,
        ...payload,
      };
      updateEnquiry(savedResult);
      if (onSaved) onSaved(targetEnquiry.refNo);
    } else {
      const res = addEnquiry(payload);
      if (onSaved) onSaved(res.refNo);
      savedResult = res.createdEnquiry || {
        ...payload,
        id: 'enq-' + Date.now(),
        refNo: res.refNo,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: currentUser?.username || 'Staff',
        updatedBy: currentUser?.username || 'Staff',
      };
    }

    if (action === 'generate_quotation' && savedResult) {
      generateBanquetQuotationPdf(savedResult, selectedVenue, quotationSettings, { download: true });
      recordQuotationSend(savedResult.id, {
        channel: 'PDF Download',
        recipient: savedResult.guestMobileMain || savedResult.guestName,
        status: 'Downloaded',
        notes: 'Initial quotation generated upon enquiry intake',
      });
      setQuotationSendModalEnquiry(savedResult);
    } else {
      onClose();
    }
  };

  const handleSaveAndGenerateQuotation = (e: React.MouseEvent) => {
    e.preventDefault();
    handleSave(undefined, 'generate_quotation');
  };

  return (
    <div id="add-edit-enquiry-modal" className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-50 overflow-y-auto">
      <div className="w-full max-w-5xl bg-white border border-sky-200 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header Bar */}
        <div className="px-6 py-4 bg-sky-50/70 border-b border-sky-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-xl text-teal-700">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-800">
                  {targetEnquiry ? `Edit Enquiry: Ref #${targetEnquiry.refNo}` : 'New Banquet Enquiry Intake'}
                </h2>
                {!targetEnquiry && (
                  <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    Auto Ref: {generateRefNo(enquiries)}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                The Residency Towers, Chennai
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-sky-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Real-time Conflict Alert Banner */}
        {conflictInfo.hasExclusiveLock && (
          <div className="px-6 py-3 bg-rose-50 border-b border-rose-200 text-rose-800 text-xs flex items-center gap-3 shrink-0">
            <Lock className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              <strong>SLOT LOCKED EXCLUSIVELY:</strong> This venue slot on {eventDate} ({session}) is locked exclusively by{' '}
              <strong className="text-slate-900">Ref #{conflictInfo.lockedBy?.refNo} ({conflictInfo.lockedBy?.guestName})</strong>. New bookings will be blocked from advancing to exclusive lock unless waitlisted.
            </span>
          </div>
        )}

        {conflictInfo.tentativeHolds.length > 0 && !conflictInfo.hasExclusiveLock && (
          <div className="px-6 py-2.5 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs flex items-center gap-3 shrink-0">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>COMPETING TENTATIVE HOLDS:</strong> There are currently{' '}
              <strong>{conflictInfo.tentativeHolds.length} active tentative hold(s)</strong> for {selectedVenue.name} on {eventDate} ({session}). Recording an advance deposit will trigger an exclusive lock and release these holds.
            </span>
          </div>
        )}

        {/* Validation Error Banner */}
        {validationError && (
          <div className="px-6 py-3 bg-rose-50 border-b border-rose-200 text-rose-700 text-xs flex items-center gap-2.5 shrink-0">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">{validationError}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Section 1: Guest & Booking Details */}
          <div>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-sky-100">
              <Users className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Client Profile & Event Classification
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Guest / Host Name <span className="text-teal-600">*</span>
                </label>
                <input
                  type="text"
                  value={guestName}
                  disabled={isCommenter}
                  onChange={e => setGuestName(e.target.value)}
                  placeholder="e.g. Dr. Arvind Swaminathan"
                  className="w-full p-2.5 bg-white border border-sky-200 rounded-xl text-slate-800 focus:border-teal-500 focus:outline-none shadow-xs"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-slate-700 font-semibold">
                    Company / Organization Name <span className="text-teal-600">*</span>
                  </label>
                  {activeCorporateClients.length > 0 && (
                    <span className="text-[10px] text-teal-600 font-medium">
                      {activeCorporateClients.length} accounts in master
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  list="corporate-clients-datalist"
                  value={companyName}
                  disabled={isCommenter}
                  onChange={e => {
                    const val = e.target.value;
                    setCompanyName(val);
                    // Check if exact match with a corporate client
                    const matchedClient = activeCorporateClients.find(
                      c => c.companyName.toLowerCase() === val.toLowerCase()
                    );
                    if (matchedClient) {
                      if (!guestName) setGuestName(matchedClient.contactPerson);
                      if (!guestMobileMain) setGuestMobileMain(matchedClient.contactPhone);
                      if (!email) setEmail(matchedClient.contactEmail);
                    }
                  }}
                  placeholder="e.g. Apollo Hospitals / Private Family"
                  className="w-full p-2.5 bg-white border border-sky-200 rounded-xl text-slate-800 focus:border-teal-500 focus:outline-none shadow-xs"
                  required
                />
                <datalist id="corporate-clients-datalist">
                  {activeCorporateClients.map(c => (
                    <option key={c.id} value={c.companyName}>
                      {c.clientTier} Tier • SPOC: {c.contactPerson} ({c.contactPhone})
                    </option>
                  ))}
                </datalist>

                {(() => {
                  const matchedCorporateClient = activeCorporateClients.find(
                    c => c.companyName.toLowerCase() === companyName.trim().toLowerCase()
                  );
                  if (!matchedCorporateClient) return null;
                  return (
                    <div className="mt-2 p-2.5 bg-gradient-to-r from-teal-50/90 to-sky-50/90 border border-teal-200 rounded-xl flex items-center justify-between gap-2 shadow-xs">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-teal-950 text-xs truncate">{matchedCorporateClient.companyName}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            matchedCorporateClient.clientTier === 'Platinum'
                              ? 'bg-slate-900 text-amber-300'
                              : matchedCorporateClient.clientTier === 'Gold'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-teal-100 text-teal-800'
                          }`}>
                            {matchedCorporateClient.clientTier}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 truncate mt-0.5">
                          SPOC: <strong className="text-slate-800">{matchedCorporateClient.contactPerson}</strong> • {matchedCorporateClient.contactPhone}
                          {matchedCorporateClient.gstin && <span className="ml-1 text-slate-400 font-mono">({matchedCorporateClient.gstin})</span>}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingCorporateClientId(matchedCorporateClient.id)}
                        className="px-2.5 py-1 bg-white hover:bg-teal-50 text-teal-800 border border-teal-300 rounded-lg font-bold text-[11px] shadow-xs flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                        title="Edit this client's profile, SPOC, phone, GSTIN or credit terms in Corporate Client Master"
                      >
                        <Edit2 className="w-3 h-3 text-teal-600" />
                        <span>Edit Client</span>
                      </button>
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Business Source <span className="text-teal-600">*</span>
                </label>
                <select
                  value={businessSource}
                  disabled={isCommenter}
                  onChange={e => setBusinessSource(e.target.value as BusinessSource)}
                  className="w-full p-2.5 bg-white border border-sky-200 rounded-xl text-slate-800 focus:border-teal-500 focus:outline-none shadow-xs"
                >
                  {activeLeadSources.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Account Handler <span className="text-teal-600">*</span>
                </label>
                <select
                  value={accountHandler}
                  disabled={isCommenter}
                  onChange={e => setAccountHandler(e.target.value)}
                  className="w-full p-2.5 bg-white border border-sky-200 rounded-xl text-slate-800 focus:border-teal-500 focus:outline-none shadow-xs font-medium"
                  required
                >
                  <option value="" disabled>Select Account Handler...</option>
                  {(accountHandlers || []).map(ah => (
                    <option key={ah.id} value={ah.name}>
                      {ah.name} ({ah.role || ah.designation || 'Specialist'}) {ah.status === 'Inactive' ? '[Inactive]' : ''}
                    </option>
                  ))}
                  {accountHandler && !(accountHandlers || []).some(ah => ah.name === accountHandler) && (
                    <option value={accountHandler}>{accountHandler} (Assigned)</option>
                  )}
                </select>
                {(() => {
                  const matchedAh = (accountHandlers || []).find(ah => ah.name === accountHandler);
                  if (!matchedAh) return null;
                  return (
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                      <span>📞 {matchedAh.mobile || matchedAh.phone}</span>
                      {matchedAh.email && <span>• ✉️ {matchedAh.email}</span>}
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Enquiry Date <span className="text-teal-600">*</span>
                </label>
                <input
                  type="date"
                  value={enquiryDate}
                  disabled={isCommenter}
                  onChange={e => {
                    setEnquiryDate(e.target.value);
                    if (!enquiryToEdit) {
                      setFollowUp1Date(addDaysToDate(e.target.value, 2));
                    }
                  }}
                  className="w-full p-2.5 bg-white border border-sky-200 rounded-xl text-slate-800 focus:border-teal-500 focus:outline-none shadow-xs cursor-pointer"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Event Type <span className="text-teal-600">*</span>
                </label>
                <select
                  value={eventType}
                  disabled={isCommenter}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === '__OPEN_ITEM__') {
                      setCustomEventInput('');
                      setShowOpenItemModal(true);
                    } else {
                      setEventType(val);
                      // Auto apply default layout if matching an event type master
                      const masterEvt = (eventTypesMaster || []).find(x => x.name.toLowerCase() === val.toLowerCase());
                      if (masterEvt?.defaultLayout && !targetEnquiry) {
                        setSeatingArrangement(masterEvt.defaultLayout);
                      }
                      if (masterEvt?.estimatedAvgPax && !targetEnquiry) {
                        setExpPax(masterEvt.estimatedAvgPax);
                      }
                    }
                  }}
                  className="w-full p-2.5 bg-white border border-sky-200 rounded-xl text-slate-800 focus:border-teal-500 focus:outline-none shadow-xs"
                >
                  {!activeEventTypes.includes(eventType) && eventType && eventType !== '__OPEN_ITEM__' && (
                    <option value={eventType}>★ {eventType} (Custom / Open Item)</option>
                  )}
                  {activeEventTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                  <option value="__OPEN_ITEM__">➕ Open Item (Type Custom Event)...</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Welcome Board Display <span className="text-teal-600">*</span>
                </label>
                <input
                  type="text"
                  value={boardToRead}
                  disabled={isCommenter}
                  onChange={e => setBoardToRead(e.target.value)}
                  placeholder="e.g. Grand Wedding Reception of Ananya & Vikram / Global Tech Innovations Summit 2026"
                  className="w-full p-2.5 bg-white border border-sky-200 rounded-xl text-slate-800 focus:border-teal-500 focus:outline-none shadow-xs"
                  required
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Unified signage display text shown on hotel lobby screens, welcome easel displays, and banquet directional boards.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Venue, Seating, Headcounts & Session */}
          <div>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-sky-100">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Venue Allocation, Seating & Guest Guarantees
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Hall / Venue Master <span className="text-teal-600">*</span>
                </label>
                <select
                  value={hallId}
                  disabled={isCommenter}
                  onChange={e => {
                    setHallId(e.target.value);
                    const v = venues.find(x => x.id === e.target.value);
                    if (v) {
                      const cfg = v.layouts[seatingArrangement as keyof typeof v.layouts];
                      const mg = cfg?.mg || v.defaultMg || 100;
                      setGPax(mg);
                      setExpPax(Math.max(Math.ceil(mg * 1.10), mg));
                    }
                  }}
                  className="w-full p-2.5 bg-white border border-sky-200 rounded-xl text-slate-800 focus:border-teal-500 focus:outline-none shadow-xs"
                >
                  {activeVenues.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.areaSqFt ? `${v.areaSqFt} sq ft` : ''})
                    </option>
                  ))}
                </select>
                {selectedVenue && (
                  <p className="mt-1 text-[11px] text-slate-500">
                    {selectedVenue.dimensions} • {selectedVenue.ceilingHeight}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Seating Arrangement <span className="text-teal-600">*</span>
                </label>
                <select
                  value={seatingArrangement}
                  disabled={isCommenter}
                  onChange={e => handleSeatingChange(e.target.value as SeatingArrangement)}
                  className="w-full p-2.5 bg-white border border-sky-200 rounded-xl text-slate-800 focus:border-teal-500 focus:outline-none shadow-xs"
                >
                  {SEATING_ARRANGEMENTS.map(sa => (
                    <option key={sa} value={sa}>{sa}</option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-teal-700 font-mono font-medium">
                  Configured Layout MG: {layoutMG} Pax
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Event Date <span className="text-teal-600">*</span>
                </label>
                <input
                  type="date"
                  value={eventDate}
                  disabled={isCommenter}
                  onChange={e => setEventDate(e.target.value)}
                  className="w-full p-2.5 bg-white border border-sky-200 rounded-xl text-slate-800 focus:border-teal-500 focus:outline-none shadow-xs"
                  required
                />
                {muhurthamInfo && (
                  <div className="mt-2 p-2 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-2 shadow-xs">
                    <Flame className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="font-bold flex items-center gap-1.5 flex-wrap">
                        <span>🌟 {muhurthamInfo.tamilMonth} Subha Muhurtham</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-amber-200 text-amber-900 rounded font-extrabold">
                          {muhurthamInfo.peakYieldLevel}
                        </span>
                      </div>
                      <div className="text-[11px] text-amber-800 mt-0.5 font-medium">
                        Timing: <strong>{muhurthamInfo.auspiciousTiming}</strong> ({muhurthamInfo.nakshatra} / {muhurthamInfo.thithi})
                      </div>
                      <div className="text-[10px] text-amber-700/90 italic mt-0.5">
                        High-demand wedding date. Recommended Min Guarantee: {muhurthamInfo.recommendedMinPax} Pax.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-slate-700 font-semibold">
                    Guaranteed Pax (G. Pax) <span className="text-teal-600">*</span>
                  </label>
                  {gPax < layoutMG && (
                    <span className="text-[10px] text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                      MG Override Active
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  min="1"
                  value={gPax}
                  disabled={isCommenter}
                  onChange={e => handleGPaxChange(parseInt(e.target.value, 10) || 0)}
                  className={`w-full p-2.5 bg-white border rounded-xl text-slate-800 font-mono focus:outline-none shadow-xs ${gPax < layoutMG ? 'border-rose-500 focus:border-rose-600' : 'border-sky-200 focus:border-teal-500'}`}
                  required
                />
                {mgOverrideReason && gPax < layoutMG && (
                  <p className="mt-1 text-[10px] text-rose-600 italic truncate" title={mgOverrideReason}>
                    Justification: {mgOverrideReason}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-700 font-semibold">
                    Expected Pax (Exp. Pax) <span className="text-teal-600">*</span>
                  </label>
                  <span className="text-[10px] text-teal-700 font-mono font-medium">
                    Auto-calc: ≥ +10% ({Math.ceil(gPax * 1.10)})
                  </span>
                </div>
                <input
                  type="number"
                  min={gPax}
                  value={expPax}
                  disabled={isCommenter}
                  onChange={e => handleExpPaxChange(parseInt(e.target.value, 10) || 0)}
                  onBlur={handleExpPaxBlur}
                  className={`w-full p-2.5 bg-white border rounded-xl text-slate-800 font-mono focus:outline-none shadow-xs ${
                    expPax < gPax ? 'border-rose-500 text-rose-700' : 'border-sky-200 focus:border-teal-500'
                  }`}
                  required
                />
                {expPaxWarning ? (
                  <p className="mt-1 text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
                    <span>{expPaxWarning}</span>
                  </p>
                ) : (
                  <p className="mt-1 text-[10px] text-slate-400">
                    Always maintained at minimum 10% higher than Guaranteed Pax.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Session Time Slot <span className="text-teal-600">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={SESSION_TIME_SLOTS.includes(session) ? session : 'Open Choice'}
                    disabled={isCommenter}
                    onChange={e => {
                      if (e.target.value === 'Open Choice') {
                        setShowCustomTimeModal(true);
                      } else {
                        setSession(e.target.value);
                      }
                    }}
                    className="w-full p-2.5 bg-white border border-sky-200 rounded-xl text-slate-800 font-mono focus:border-teal-500 focus:outline-none shadow-xs"
                  >
                    {SESSION_TIME_SLOTS.map(slot => (
                      <option key={slot} value={slot}>
                        {slot === 'Open Choice' && !SESSION_TIME_SLOTS.slice(0, 5).includes(session)
                          ? `Custom: ${session}`
                          : slot}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowCustomTimeModal(true)}
                    className="p-2.5 bg-sky-50 hover:bg-sky-100 text-teal-700 rounded-xl border border-sky-200 transition-colors"
                    title="Open Custom Time Clock"
                  >
                    <Clock className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Composite Multi-Hall Booking Extension */}
            <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal-700" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Composite Multi-Hall Allocation (Optional)
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  Weddings & Large Summits spanning dining halls or lawns
                </span>
              </div>

              {/* Added Secondary Halls */}
              {secondaryHalls.length > 0 && (
                <div className="space-y-2 mb-3">
                  {secondaryHalls.map((sh, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-sky-200 text-xs shadow-xs">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-teal-900">{sh.hallName}</span>
                        <span className="text-slate-400">·</span>
                        <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-800 font-semibold border border-sky-200">
                          {sh.purpose || 'Auxiliary Function'}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="font-mono text-slate-600">
                          {sh.allocatedPax ? `${sh.allocatedPax} Pax` : 'All Guests'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSecondaryHalls(prev => prev.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
                        title="Remove secondary hall"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Secondary Hall Controls */}
              {(() => {
                const availableForSecondary = activeVenues.filter(
                  v => v.id !== hallId && !secondaryHalls.some(sh => sh.hallId === v.id)
                );
                if (availableForSecondary.length === 0) return null;

                return (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <select
                      id="secondary-hall-select"
                      className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                      defaultValue=""
                    >
                      <option value="" disabled>Select Additional Hall...</option>
                      {availableForSecondary.map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>

                    <select
                      id="secondary-hall-purpose"
                      className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                      defaultValue="Dining"
                    >
                      <option value="Dining">Dining Area</option>
                      <option value="Pre-Function / Registration">Pre-Function / Registration</option>
                      <option value="Mandapam / Ceremony">Mandapam / Ceremony</option>
                      <option value="Bride/Groom Suite">Bride/Groom Suite</option>
                      <option value="Main Function">Main Function Extension</option>
                    </select>

                    <input
                      id="secondary-hall-pax"
                      type="number"
                      placeholder="Pax"
                      min={0}
                      className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white w-20 font-mono"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        const sel = document.getElementById('secondary-hall-select') as HTMLSelectElement;
                        const purp = document.getElementById('secondary-hall-purpose') as HTMLSelectElement;
                        const paxInput = document.getElementById('secondary-hall-pax') as HTMLInputElement;

                        if (!sel || !sel.value) return;
                        const chosenVenue = venues.find(v => v.id === sel.value);
                        if (!chosenVenue) return;

                        setSecondaryHalls(prev => [
                          ...prev,
                          {
                            hallId: chosenVenue.id,
                            hallName: chosenVenue.name,
                            purpose: (purp?.value as any) || 'Dining',
                            allocatedPax: paxInput?.value ? parseInt(paxInput.value, 10) : undefined,
                          }
                        ]);

                        sel.value = '';
                        if (paxInput) paxInput.value = '';
                      }}
                      className="px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Composite Hall
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Section 3: Operational Requirements & Display */}
          <div>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-sky-100">
              <Calendar className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Menu, Board Display & Package Inclusions
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Menu Category <span className="text-teal-600">*</span>
                </label>
                <select
                  value={menu}
                  disabled={isCommenter}
                  onChange={e => handleMenuChange(e.target.value as MenuCategory)}
                  className="w-full p-2.5 bg-white border border-sky-200 rounded-xl text-slate-800 focus:border-teal-500 focus:outline-none shadow-xs font-medium"
                >
                  <option value="Veg">Veg (₹3,500 Base)</option>
                  <option value="Mixed Nonveg">Mixed Nonveg (₹3,800 Base)</option>
                  <option value="Jain(Hall Rent Only)">Jain(Hall Rent Only)</option>
                </select>

                {activeMenuPackages.length > 0 && (
                  <div className="mt-2">
                    <label className="block text-[11px] text-teal-700 font-semibold mb-1">
                      Apply Master Menu Package:
                    </label>
                    <select
                      onChange={e => {
                        const pkgId = e.target.value;
                        if (!pkgId) return;
                        const pkg = activeMenuPackages.find(p => p.id === pkgId);
                        if (pkg) {
                          setMenu(pkg.category);
                          setQuotedBaseRate(pkg.baseRatePerPax);
                          if (pkg.minimumPax && gPax < pkg.minimumPax) {
                            setGPax(pkg.minimumPax);
                            setExpPax(pkg.minimumPax + 20);
                          }
                          if (!boardToRead) {
                            setBoardToRead(pkg.name);
                          }
                        }
                      }}
                      defaultValue=""
                      className="w-full p-2 bg-teal-50/70 border border-teal-200 rounded-lg text-slate-800 text-[11px] font-medium focus:outline-none"
                    >
                      <option value="">-- Select from {activeMenuPackages.length} Master Packages --</option>
                      {activeMenuPackages.map(pkg => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.name} ({pkg.category}) • ₹{pkg.baseRatePerPax}/pax
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Rate Billing Type <span className="text-teal-600">*</span>
                </label>
                <select
                  value={rateBillingType}
                  disabled={isCommenter}
                  onChange={e => setRateBillingType(e.target.value as RateBillingType)}
                  className="w-full p-2.5 bg-white border border-sky-200 rounded-xl text-slate-800 focus:border-teal-500 focus:outline-none shadow-xs"
                >
                  {RATE_BILLING_TYPES.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-full">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="text-slate-700 font-semibold text-xs sm:text-sm">
                      Package Inclusions & Add-On Privileges
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Select amenities included in proposal. Click <strong>FOC</strong> to offer complimentary privileges with strikethrough retail rates & total client savings.
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-lg shadow-2xs">
                    {inclusions.length} Included
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {availableInclusions.map(inc => {
                    const isChecked = inclusions.includes(inc.name);
                    const detailedItem = detailedInclusions.find(d => d.name === inc.name);
                    const isFOC = detailedItem ? detailedItem.isFOC : inc.pricingType === 'Complimentary';
                    const rate = detailedItem?.standardRate !== undefined ? detailedItem.standardRate : (inc.defaultRate || 0);

                    return (
                      <div
                        key={inc.id || inc.name}
                        className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 shadow-2xs ${
                          isChecked
                            ? 'bg-teal-50/70 border-teal-400'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div
                          onClick={() => !isCommenter && toggleInclusion(inc.name, rate, isFOC)}
                          className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isCommenter}
                            readOnly
                            className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                          />
                          <div className="truncate">
                            <span className={`text-xs ${isChecked ? 'text-teal-950 font-bold' : 'text-slate-700 font-medium'}`}>
                              {inc.name}
                            </span>
                            <div className="text-[11px] font-mono mt-0.5">
                              {rate > 0 ? (
                                isFOC ? (
                                  <span className="flex items-center gap-1.5 flex-wrap">
                                    <span className="line-through text-slate-400 font-bold">
                                      ₹{rate.toLocaleString('en-IN')}
                                    </span>
                                    <span className="text-emerald-700 font-extrabold bg-emerald-100 text-[10px] px-1.5 py-0.2 rounded border border-emerald-200">
                                      FOC (100% OFF)
                                    </span>
                                  </span>
                                ) : (
                                  <span className="text-slate-700 font-bold">
                                    ₹{rate.toLocaleString('en-IN')}
                                  </span>
                                )
                              ) : (
                                <span className="text-emerald-700 font-bold text-[10px]">
                                  Complimentary Amenity
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {isChecked && rate > 0 && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              disabled={isCommenter}
                              onClick={() => toggleFOC(inc.name, rate)}
                              className={`px-2 py-1 rounded text-[10px] font-extrabold tracking-wider uppercase transition-all cursor-pointer ${
                                isFOC
                                  ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                                  : 'bg-slate-100 text-slate-600 border border-slate-300 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-400'
                              }`}
                              title={isFOC ? 'Click to revert to chargeable item' : 'Click to make Complimentary / Free of Charge (FOC)'}
                            >
                              {isFOC ? '✓ FOC' : 'FOC'}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Total Complimentary / FOC Privileges & Savings Banner */}
                {totalFocSavings > 0 && (
                  <div className="mt-3 p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-300 rounded-xl flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">🎁</span>
                      <div>
                        <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                          <span>Total Complimentary Privileges & FOC Savings:</span>
                          <span className="font-mono text-emerald-800 text-sm font-extrabold">
                            ₹{totalFocSavings.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="text-[11px] text-emerald-700 mt-0.5">
                          Reflected with strikethrough retail rates in proposal and client bill summary.
                        </div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white shadow-2xs">
                      100% Discounted Privileges
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: Automated Pipeline Progression Stage */}
          <div>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-sky-100">
              <Lock className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Automated Pipeline Progression & Workflow Stage
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-xl shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        {status === 'Portfolio Creation' ? '01' : status === 'Quote Shared' ? '02' : '✓'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Current Workflow Stage:</span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-teal-100 text-teal-900 border border-teal-300">
                            {status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {targetEnquiry
                            ? 'Pipeline stages are advanced or retracted directly from the enquiry record card using the quick stepper.'
                            : 'Newly recorded enquiries start automatically at "Portfolio Creation". Sharing via WhatsApp, Gmail, or Telegram advances it to "Quote Shared".'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {status === 'Postponed' && (
                <div className="p-3 bg-sky-50/50 border border-sky-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-700 font-semibold">Postponed Event Reschedule</label>
                    <label className="flex items-center gap-1.5 text-slate-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isPostponedIndefinitely}
                        onChange={e => setIsPostponedIndefinitely(e.target.checked)}
                        className="rounded accent-teal-600"
                      />
                      <span>Postpone Indefinitely</span>
                    </label>
                  </div>
                  {!isPostponedIndefinitely && (
                    <input
                      type="date"
                      value={postponedDate}
                      onChange={e => setPostponedDate(e.target.value)}
                      className="w-full p-2 bg-white border border-sky-200 rounded-lg text-slate-800 font-mono shadow-xs"
                    />
                  )}
                  <p className="text-[11px] text-slate-500">
                    Tentative venue holds will be released back to the general inventory.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Section 5: Financial Rates & Tax Breakdown (SS: Completely Redacted for Collaborators) */}
          {!isCollaborator && (
            <div>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-sky-100">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-teal-600" />
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                    Financial Rates & Tax Computation
                  </h3>
                </div>
              </div>

              {/* All-Inclusive Rate Mode Checkbox Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 bg-teal-50/80 border border-teal-200 rounded-xl mb-3.5 shadow-2xs">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    id="enquiry-all-inclusive-rate-toggle"
                    checked={isAllInclusiveRate}
                    disabled={isCommenter}
                    onChange={e => handleToggleAllInclusive(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 border-teal-300 focus:ring-teal-500 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-xs text-teal-900 flex items-center gap-1.5">
                      Enter All-Inclusive Rate (Net Spoken / Function Rate)
                    </span>
                    <span className="text-[11px] text-teal-700 block">
                      Calculates base rate and taxes automatically from spoken net rate (e.g. ₹1,239 net → ₹1,000 base + ₹239 tax at 23.9%).
                    </span>
                  </div>
                </label>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  {isAllInclusiveRate && (
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">Quick Preset:</span>
                      <button
                        type="button"
                        disabled={isCommenter}
                        onClick={() => {
                          setTaxRatePercent(23.9);
                          handleAllInclusiveRateChange('1239');
                        }}
                        className="px-2 py-0.5 bg-white hover:bg-teal-100 text-teal-800 border border-teal-300 rounded text-[11px] font-mono font-bold transition-colors cursor-pointer"
                        title="Load 1239 net with 23.9% tax"
                      >
                        ₹1,239 (23.9%)
                      </button>
                      <button
                        type="button"
                        disabled={isCommenter}
                        onClick={() => {
                          setTaxRatePercent(18.0);
                          handleAllInclusiveRateChange('1180');
                        }}
                        className="px-2 py-0.5 bg-white hover:bg-teal-100 text-teal-800 border border-teal-300 rounded text-[11px] font-mono font-bold transition-colors cursor-pointer"
                        title="Load 1180 net with 18% tax"
                      >
                        ₹1,180 (18%)
                      </button>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenTaxCalculator) onOpenTaxCalculator();
                      else setIsTaxModalOpen(true);
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-teal-100 text-teal-800 border border-teal-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Calculator className="w-3.5 h-3.5 text-teal-600" />
                    <span>Itemized Calculator</span>
                  </button>
                </div>
              </div>

              {/* Financial Inputs & Tax Calculation Row */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">
                    {isAllInclusiveRate ? (
                      <span className="text-teal-900 flex items-center gap-1">
                        All-Inclusive Rate (INR Net) <span className="text-teal-600">*</span>
                      </span>
                    ) : (
                      <span>
                        Quoted Base Rate (INR) <span className="text-teal-600">*</span>
                      </span>
                    )}
                  </label>
                  {isAllInclusiveRate ? (
                    <div>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={allInclusiveRate !== '' ? allInclusiveRate : (quotedBaseRate !== '' ? Math.round((quotedBaseRate as number) * (1 + taxRatePercent / 100)) : '')}
                        disabled={isCommenter}
                        placeholder="e.g. 1239"
                        onChange={e => handleAllInclusiveRateChange(e.target.value)}
                        className="w-full p-2.5 bg-white border border-teal-300 rounded-xl text-teal-950 font-mono font-bold focus:border-teal-500 focus:outline-none text-right pr-4 shadow-xs"
                        required
                      />
                      <p className="mt-1 text-[11px] font-mono text-teal-800 text-right font-medium">
                        Base: <strong>{formatINR(baseRateNumeric)}</strong> + Tax: <strong>{formatINR(Math.round(baseRateNumeric * (taxRatePercent / 100)))}</strong>
                      </p>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={quotedBaseRate}
                        disabled={isCommenter}
                        placeholder={menu === 'Jain(Hall Rent Only)' ? 'Blank (Hall Rent Only)' : '3500'}
                        onChange={e => {
                          const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                          setQuotedBaseRate(val);
                        }}
                        className="w-full p-2.5 bg-white border border-sky-200 rounded-xl text-slate-800 font-mono focus:border-teal-500 focus:outline-none text-right pr-4 shadow-xs"
                        required={menu !== 'Jain(Hall Rent Only)'}
                      />
                      <p className="mt-1 text-[11px] font-mono text-slate-500 text-right">
                        {quotedBaseRate !== '' && quotedBaseRate > 0 ? formatINR(quotedBaseRate) : '—'}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">
                    Tax Rate % (18 - 23.9%) <span className="text-teal-600">*</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="18.0"
                      max="23.9"
                      step="0.1"
                      value={taxRatePercent}
                      disabled={isCommenter}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 18.0;
                        handleTaxRateChange(val);
                      }}
                      className="w-full p-2.5 bg-white border border-sky-200 rounded-xl text-slate-800 font-mono focus:border-teal-500 focus:outline-none text-right pr-2 shadow-xs"
                      required
                    />
                    <span className="text-xs font-bold text-slate-500">%</span>
                  </div>
                  <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px]">
                    <button
                      type="button"
                      onClick={() => handleTaxRateChange(18.0)}
                      className="text-teal-700 hover:underline font-mono"
                    >
                      18.0%
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => handleTaxRateChange(21.0)}
                      className="text-teal-700 hover:underline font-mono"
                    >
                      21.0%
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => handleTaxRateChange(23.9)}
                      className="text-teal-700 hover:underline font-mono"
                    >
                      23.9%
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">
                    Tax Amount (INR)
                  </label>
                  <div className="p-2.5 bg-amber-50/60 border border-amber-200 rounded-xl flex items-center justify-between font-mono">
                    <span className="text-slate-500 text-[10px]">GST ({taxRatePercent}%):</span>
                    <span className="text-sm font-bold text-amber-900">+{formatINR(taxAmount)}</span>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500">
                    On Base Subtotal ({formatINR(baseSubtotal)})
                  </p>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">
                    Final Billed Value (INR)
                  </label>
                  <div className="p-2.5 bg-teal-50/70 border border-teal-200 rounded-xl flex items-center justify-between font-mono">
                    <span className="text-slate-500 text-[10px]">Total:</span>
                    <span className="text-sm font-bold text-teal-800">{formatINR(computedFinalBillValue)}</span>
                  </div>
                  <p className="mt-1 text-[10px] text-teal-700 font-medium">
                    {isAllInclusiveRate && typeof allInclusiveRate === 'number' && allInclusiveRate > 0
                      ? `${layoutMG} Pax × ₹${allInclusiveRate.toLocaleString('en-IN')} Net`
                      : '(Base Rate × MG) + Tax'}
                  </p>
                </div>
              </div>

              {/* Small Card: Breakup of taxes and base plate count */}
              <div className="p-3.5 bg-slate-50/90 border border-slate-200 rounded-xl mb-4">
                <div className="flex items-center justify-between font-bold text-slate-800 pb-2 mb-2 border-b border-slate-200">
                  <div className="flex items-center gap-1.5 text-xs text-slate-700">
                    <Calculator className="w-3.5 h-3.5 text-teal-600" />
                    <span>Computation Breakup (Taxes & Plate Count)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAllInclusiveRate && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                        All-Inclusive Net Mode
                      </span>
                    )}
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-semibold">
                      Menu: {menu}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono">
                  <div className="p-2 bg-white rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">Base Plate Count (MG)</span>
                    <strong className="text-slate-800 text-sm">{layoutMG} Pax</strong>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">
                      {isAllInclusiveRate ? 'Spoken Rate / Derived Base' : 'Quoted Base Rate'}
                    </span>
                    <strong className="text-slate-800 text-sm block truncate">
                      {isAllInclusiveRate
                        ? `₹${allInclusiveRate || '—'} net (₹${baseRateNumeric})`
                        : (quotedBaseRate !== '' && quotedBaseRate > 0 ? `₹${quotedBaseRate}` : 'Blank')}
                    </strong>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">Base Subtotal ({layoutMG} × {baseRateNumeric})</span>
                    <strong className="text-slate-800 text-sm">{formatINR(baseSubtotal)}</strong>
                  </div>
                  <div className="p-2 bg-amber-50/60 rounded-lg border border-amber-100">
                    <span className="text-[10px] text-amber-800 block">Tax ({taxRatePercent}%)</span>
                    <strong className="text-amber-900 text-sm">+{formatINR(taxAmount)}</strong>
                  </div>
                  <div className="p-2 bg-teal-50/60 rounded-lg border border-teal-100">
                    <span className="text-[10px] text-teal-800 block">Final Billed Value</span>
                    <strong className="text-teal-900 text-sm">{formatINR(computedFinalBillValue)}</strong>
                  </div>
                </div>
              </div>

              {/* Guest Contacts & Operational Remarks */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">
                    Guest Primary Mobile <span className="text-teal-600">*</span>
                  </label>
                  <input
                    type="tel"
                    value={guestMobileMain}
                    disabled={isCommenter}
                    onChange={e => setGuestMobileMain(e.target.value)}
                    placeholder="+91 98400 12345"
                    className="w-full p-2.5 bg-white border border-sky-200 rounded-xl text-slate-800 focus:border-teal-500 focus:outline-none shadow-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">
                    Guest Backup Mobile <span className="text-teal-600">*</span>
                  </label>
                  <input
                    type="tel"
                    value={guestMobileBackup}
                    disabled={isCommenter}
                    onChange={e => setGuestMobileBackup(e.target.value)}
                    placeholder="+91 98400 54321"
                    className="w-full p-2.5 bg-white border border-sky-200 rounded-xl text-slate-800 focus:border-teal-500 focus:outline-none shadow-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">
                    Guest E-Mail <span className="text-teal-600">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    disabled={isCommenter}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="client.banquets@company.com"
                    className="w-full p-2.5 bg-white border border-sky-200 rounded-xl text-slate-800 focus:border-teal-500 focus:outline-none shadow-xs"
                    required
                  />
                </div>

                <div className="col-span-full">
                  <label className="block text-slate-700 font-semibold mb-1.5">
                    Operational Remarks (Initial Call Summary) <span className="text-teal-600">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                    placeholder="Client requirements, AV needs, dietary preferences, special stage setup..."
                    className="w-full p-2.5 bg-white border border-sky-200 rounded-xl text-slate-800 focus:border-teal-500 focus:outline-none shadow-xs"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 6: Automated Follow-Up Reminders & Tracking Engine (SS: Redacted for Collaborators) */}
          {!isCollaborator && (
            <div>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-sky-100">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-600" />
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                    Follow-Up Engine & Remarks
                  </h3>
                  {isFunctionConfirmedOrCompleted && (
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                      Function Confirmed
                    </span>
                  )}
                </div>

                <label className="flex items-center gap-2 text-slate-600 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={noFollowUpRequired}
                    onChange={e => setNoFollowUpRequired(e.target.checked)}
                    className="rounded accent-teal-600"
                  />
                  <span>No Follow-Up Required</span>
                </label>
              </div>

              {noFollowUpRequired ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-slate-100 text-slate-600 rounded-lg shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">
                        Follow-Up Marked as Not Required
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Uncheck "No Follow-Up Required" above to re-activate the follow-up milestone schedule.
                      </p>
                    </div>
                  </div>
                  {targetEnquiry && (
                    <button
                      type="submit"
                      className="px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Update</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3 bg-sky-50/40 p-4 rounded-xl border border-sky-100">
                  <div className="flex items-center justify-between pb-1">
                    <div>
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                        Follow-Up Schedule & Operational Remarks
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Add and edit unlimited follow-up milestones. Every entry is editable.
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAddFollowUp}
                        className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Add Follow-Up Remark</span>
                      </button>
                      {targetEnquiry && (
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                          title="Save and update remarks"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Update</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {followUpList.map((item, idx) => (
                    <div
                      key={item.id}
                      className={`grid grid-cols-1 sm:grid-cols-12 gap-3 items-center ${
                        idx > 0 ? 'pt-3 border-t border-sky-100' : ''
                      }`}
                    >
                      <div className="sm:col-span-3">
                        <span className="text-xs font-semibold text-teal-800 block">
                          Follow-Up {item.index} Date
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {item.index === 1 ? 'Auto (+2 days from enquiry)' : `Milestone #${item.index}`}
                        </span>
                      </div>
                      <div className="sm:col-span-3">
                        <input
                          type="date"
                          value={item.date}
                          onChange={e => handleUpdateFollowUp(item.id, 'date', e.target.value)}
                          className="w-full p-2 bg-white border border-sky-200 rounded-lg text-slate-800 font-mono shadow-xs text-xs"
                        />
                      </div>
                      <div className="sm:col-span-5">
                        <input
                          type="text"
                          value={item.remark}
                          onChange={e => handleUpdateFollowUp(item.id, 'remark', e.target.value)}
                          placeholder={`Remarks.${item.index}: Discussion points, client feedback, next steps...`}
                          className="w-full p-2 bg-white border border-sky-200 rounded-lg text-slate-800 shadow-xs text-xs"
                        />
                      </div>
                      <div className="sm:col-span-1 flex justify-end">
                        {followUpList.length > 1 && idx > 0 ? (
                          <button
                            type="button"
                            onClick={() => handleRemoveFollowUp(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                            title="Remove this follow-up milestone"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono font-medium px-1">Primary</span>
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleAddFollowUp}
                      className="text-teal-700 hover:text-teal-900 text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-teal-50 border border-teal-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Another Follow-Up Remark (No limit)</span>
                    </button>
                    {targetEnquiry && (
                      <button
                        type="submit"
                        className="px-5 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Update</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-sky-100 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleSaveAndGenerateQuotation}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-md flex items-center gap-2 transition-all text-xs active:scale-[0.99] cursor-pointer"
                title="Save enquiry, immediately download branded quotation PDF, and open 1-click WhatsApp/Gmail/Telegram send hub"
              >
                <FileDown className="w-4 h-4" />
                <span>Save & Generate Quotation</span>
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold rounded-xl shadow-md flex items-center gap-2 transition-all text-xs active:scale-[0.99] cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{targetEnquiry ? 'Update' : 'Create Banquet Enquiry'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Open Item Modal Popup for Custom Event Type */}
      {showOpenItemModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-60">
          <div className="bg-white border border-sky-200 rounded-2xl p-5 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-sky-100 mb-4">
              <h4 className="text-base font-bold text-slate-800">
                Custom Event Type (Open Item)
              </h4>
              <button
                type="button"
                onClick={() => setShowOpenItemModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              Type the exact name for this custom or unlisted banquet event:
            </p>
            <input
              type="text"
              autoFocus
              value={customEventInput}
              onChange={e => setCustomEventInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && customEventInput.trim()) {
                  e.preventDefault();
                  setEventType(customEventInput.trim());
                  setShowOpenItemModal(false);
                }
              }}
              placeholder="e.g., Global AI Summit & Gala Dinner"
              className="w-full p-2.5 bg-white border border-sky-200 rounded-xl text-slate-800 text-sm focus:border-teal-500 focus:outline-none mb-4 shadow-xs"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowOpenItemModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!customEventInput.trim()}
                onClick={() => {
                  if (customEventInput.trim()) {
                    setEventType(customEventInput.trim());
                    setShowOpenItemModal(false);
                  }
                }}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-xs"
              >
                Apply Event Type
              </button>
            </div>
          </div>
        </div>
      )}

      {showMGOverrideModal && (
        <MGOverrideModal
          hallName={selectedVenue.name}
          seatingArrangement={seatingArrangement}
          configuredMG={layoutMG}
          enteredPax={pendingGPaxValue || gPax}
          onConfirm={handleConfirmMGOverride}
          onCancel={() => {
            setShowMGOverrideModal(false);
            setPendingGPaxValue(null);
          }}
        />
      )}

      {showCustomTimeModal && (
        <OpenChoiceTimeModal
          initialTime={session.includes('-') ? session : '10:00-16:00'}
          onSelect={customTime => {
            setSession(customTime);
            setShowCustomTimeModal(false);
          }}
          onClose={() => setShowCustomTimeModal(false)}
        />
      )}

      {/* Follow-up 2 Date Prompt Modal */}
      {showFollowUp2Picker && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-60">
          <div className="bg-white border border-sky-200 rounded-2xl p-5 max-w-sm w-full shadow-2xl">
            <h4 className="text-sm font-bold text-slate-800 mb-1">Schedule Follow-Up 2 Date</h4>
            <p className="text-xs text-slate-500 mb-3">Remarks.1 note logged. Please choose the next contact date.</p>
            <input
              type="date"
              value={followUp2Date || addDaysToDate(todayStr, 3)}
              onChange={e => setFollowUp2Date(e.target.value)}
              className="w-full p-2.5 bg-white border border-sky-200 rounded-xl text-slate-800 font-mono text-xs mb-4 shadow-xs"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setNoFollowUpRequired(true);
                  setShowFollowUp2Picker(false);
                }}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800"
              >
                No Follow-Up Required
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!followUp2Date) setFollowUp2Date(addDaysToDate(todayStr, 3));
                  setShowFollowUp2Picker(false);
                }}
                className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg text-xs shadow-xs"
              >
                Confirm Date
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Follow-up 3 Date Prompt Modal */}
      {showFollowUp3Picker && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-60">
          <div className="bg-white border border-sky-200 rounded-2xl p-5 max-w-sm w-full shadow-2xl">
            <h4 className="text-sm font-bold text-slate-800 mb-1">Schedule Follow-Up 3 Date</h4>
            <p className="text-xs text-slate-500 mb-3">Remarks.2 note logged. Please choose the final contact date.</p>
            <input
              type="date"
              value={followUp3Date || addDaysToDate(todayStr, 4)}
              onChange={e => setFollowUp3Date(e.target.value)}
              className="w-full p-2.5 bg-white border border-sky-200 rounded-xl text-slate-800 font-mono text-xs mb-4 shadow-xs"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setNoFollowUpRequired(true);
                  setShowFollowUp3Picker(false);
                }}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800"
              >
                No Follow-Up Required
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!followUp3Date) setFollowUp3Date(addDaysToDate(todayStr, 4));
                  setShowFollowUp3Picker(false);
                }}
                className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg text-xs shadow-xs"
              >
                Confirm Date
              </button>
            </div>
          </div>
        </div>
      )}

      {editingCorporateClientId && (
        <CorporateClientMasterModal
          initialClientIdToEdit={editingCorporateClientId}
          onClose={() => setEditingCorporateClientId(null)}
        />
      )}

      {isTaxModalOpen && (
        <TaxCalculationModal
          initialItems={rateItems.length > 0 ? rateItems : undefined}
          initialBaseRate={baseSubtotal > 0 ? baseSubtotal : baseRateNumeric}
          onAccept={(items, totalBase, totalBilled) => {
            setRateItems(items);
            if (layoutMG > 0) {
              const derivedPerPax = Math.round(totalBase / layoutMG);
              setQuotedBaseRate(derivedPerPax);
              if (isAllInclusiveRate) {
                setAllInclusiveRate(Math.round(totalBilled / layoutMG));
              }
            } else {
              setQuotedBaseRate(totalBase);
              if (isAllInclusiveRate) {
                setAllInclusiveRate(totalBilled);
              }
            }
            setIsTaxModalOpen(false);
          }}
          onClose={() => setIsTaxModalOpen(false)}
        />
      )}

      {quotationSendModalEnquiry && (
        <QuotationSendHubModal
          enquiry={quotationSendModalEnquiry}
          onClose={() => {
            setQuotationSendModalEnquiry(null);
            onClose();
          }}
        />
      )}
    </div>
  );
};

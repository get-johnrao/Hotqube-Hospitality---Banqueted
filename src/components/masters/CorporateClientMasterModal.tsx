import React, { useState, useMemo } from 'react';
import { useBEMS } from '../../context/BEMSContext';
import { CorporateClientMaster } from '../../types';
import {
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  SlidersHorizontal,
  Info,
  CheckCircle2,
  Building,
  Phone,
  Mail,
  ShieldCheck,
} from 'lucide-react';

interface CorporateClientMasterModalProps {
  initialClientIdToEdit?: string;
  onClose: () => void;
  onSelectTab?: (tab: string) => void;
}

export const CorporateClientMasterModal: React.FC<CorporateClientMasterModalProps> = ({
  initialClientIdToEdit,
  onClose,
  onSelectTab,
}) => {
  const { corporateClients, addCorporateClient, updateCorporateClient, deleteCorporateClient, currentUser, users, login } = useBEMS();
  const canEdit = currentUser?.role === 'Admin' || currentUser?.role === 'Editor';

  const formRef = React.useRef<HTMLFormElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  const [editingClient, setEditingClient] = useState<CorporateClientMaster | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'error' | 'success' } | null>(null);

  // Form Fields
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [gstin, setGstin] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [clientTier, setClientTier] = useState<'Platinum' | 'Gold' | 'Standard'>('Standard');
  const [creditDays, setCreditDays] = useState<number>(30);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

  const startCreate = () => {
    setEditingClient(null);
    setIsCreating(true);
    setCompanyName('');
    setContactPerson('');
    setContactEmail('');
    setContactPhone('');
    setGstin('33');
    setBillingAddress('Chennai, Tamil Nadu');
    setClientTier('Standard');
    setCreditDays(30);
    setNotes('');
    setStatus('Active');
    setNotification(null);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const startEdit = (client: CorporateClientMaster) => {
    setEditingClient(client);
    setIsCreating(false);
    setCompanyName(client.companyName);
    setContactPerson(client.contactPerson);
    setContactEmail(client.contactEmail);
    setContactPhone(client.contactPhone);
    setGstin(client.gstin);
    setBillingAddress(client.billingAddress);
    setClientTier(client.clientTier);
    setCreditDays(client.creditDays);
    setNotes(client.notes || '');
    setStatus(client.status);
    setNotification({
      message: `Now editing existing record for "${client.companyName}". Make your changes and click "Save Changes to Database".`,
      type: 'info',
    });
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  // If initialClientIdToEdit is passed, open edit mode immediately
  React.useEffect(() => {
    if (initialClientIdToEdit) {
      const found = corporateClients.find(c => c.id === initialClientIdToEdit);
      if (found) {
        startEdit(found);
      }
    }
  }, [initialClientIdToEdit, corporateClients]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setNotification({ message: 'Company Name is required.', type: 'error' });
      return;
    }
    if (!contactPerson.trim()) {
      setNotification({ message: 'Primary Contact Person is required.', type: 'error' });
      return;
    }

    if (isCreating) {
      addCorporateClient({
        companyName: companyName.trim(),
        contactPerson: contactPerson.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
        gstin: gstin.trim().toUpperCase(),
        billingAddress: billingAddress.trim(),
        clientTier,
        creditDays: Number(creditDays) || 0,
        notes: notes.trim(),
        status,
      });
      setNotification({ message: `Corporate client "${companyName.trim()}" successfully created and saved in database.`, type: 'success' });
    } else if (editingClient) {
      updateCorporateClient({
        ...editingClient,
        companyName: companyName.trim(),
        contactPerson: contactPerson.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
        gstin: gstin.trim().toUpperCase(),
        billingAddress: billingAddress.trim(),
        clientTier,
        creditDays: Number(creditDays) || 0,
        notes: notes.trim(),
        status,
      });
      setNotification({ message: `Existing corporate client "${companyName.trim()}" updated successfully in database.`, type: 'success' });
    }

    setIsCreating(false);
    setEditingClient(null);
  };

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete corporate account "${name}"?`)) return;
    const res = deleteCorporateClient(id);
    if (res.success) {
      setNotification({ message: res.message, type: 'success' });
    } else {
      setNotification({ message: res.message, type: 'error' });
    }
  };

  const filteredClients = useMemo(() => {
    return corporateClients.filter(c => {
      const matchesSearch =
        c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.gstin.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.contactEmail.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTier = filterTier === 'All' || c.clientTier === filterTier;
      const matchesStatus = filterStatus === 'All' || c.status === filterStatus;
      return matchesSearch && matchesTier && matchesStatus;
    });
  }, [corporateClients, searchQuery, filterTier, filterStatus]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-sky-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-sky-100 bg-gradient-to-r from-teal-50 via-cyan-50/50 to-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-600 text-white shadow-sm">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-800">
                  Corporate Client & Agency Master
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                  {corporateClients.length} Accounts
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Manage contracted corporate accounts, GSTIN records, key liaison SPOCs, and credit terms.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && !isCreating && !editingClient && (
              <>
                <button
                  onClick={startCreate}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-xs font-semibold rounded-xl hover:from-teal-700 hover:to-cyan-700 shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Client</span>
                </button>
                {corporateClients.length > 0 && (
                  <button
                    onClick={() => {
                      if (corporateClients.length > 0) {
                        startEdit(corporateClients[0]);
                      }
                    }}
                    className="px-3.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-teal-800 border border-teal-300 text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Edit any existing client already stored in database"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-teal-600" />
                    <span>Edit Existing Client ({corporateClients.length})</span>
                  </button>
                )}
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Role permission info if not admin or editor */}
        {!canEdit && (
          <div className="px-6 py-2 bg-amber-50 border-b border-amber-200 flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span>You are viewing in read-only mode ({currentUser?.role || 'Guest'}). Admin or Editor role is required to modify client records in database.</span>
            </div>
            {users.find(u => u.role === 'Admin') && (
              <button
                onClick={() => {
                  const adminUser = users.find(u => u.role === 'Admin');
                  if (adminUser) login(adminUser.username, adminUser.password);
                }}
                className="px-2.5 py-1 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors cursor-pointer shrink-0"
              >
                Switch to Admin Role
              </button>
            )}
          </div>
        )}

        {/* Master Sub-Navigation */}
        {onSelectTab && (
          <div className="px-6 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-xs">
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">All Masters:</span>
            <button onClick={() => onSelectTab('venues')} className="px-2.5 py-1 rounded-md text-slate-600 hover:bg-white transition-colors">Venues</button>
            <button onClick={() => onSelectTab('menuPackages')} className="px-2.5 py-1 rounded-md text-slate-600 hover:bg-white transition-colors">Menu Packages</button>
            <button onClick={() => onSelectTab('inclusions')} className="px-2.5 py-1 rounded-md text-slate-600 hover:bg-white transition-colors">Inclusions & Add-Ons</button>
            <button onClick={() => onSelectTab('eventTypes')} className="px-2.5 py-1 rounded-md text-slate-600 hover:bg-white transition-colors">Event Types</button>
            <button className="px-2.5 py-1 rounded-md bg-teal-600 text-white font-bold shadow-xs">Corporate Clients</button>
            <button onClick={() => onSelectTab('leadSources')} className="px-2.5 py-1 rounded-md text-slate-600 hover:bg-white transition-colors">Lead Sources</button>
          </div>
        )}

        {/* Notification Banner */}
        {notification && (
          <div
            className={`px-6 py-2.5 flex items-center justify-between text-xs font-medium ${
              notification.type === 'error'
                ? 'bg-red-50 text-red-700 border-b border-red-200'
                : notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border-b border-emerald-200'
                : 'bg-sky-50 text-sky-700 border-b border-sky-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <Info className="w-4 h-4 shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {/* Quick Edit Existing Client Selector Bar */}
          {corporateClients.length > 0 && canEdit && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 bg-gradient-to-r from-teal-50/90 via-sky-50/70 to-teal-50/90 border border-teal-200 rounded-2xl shadow-xs">
              <div className="flex items-center gap-2 text-teal-900 font-bold text-xs shrink-0">
                <div className="p-1.5 rounded-lg bg-teal-600 text-white">
                  <Edit2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="block">Quick Edit Existing Client:</span>
                  <span className="text-[10px] text-teal-700 font-normal">Choose any client already fed into database to modify</span>
                </div>
              </div>
              <div className="flex-1 flex items-center gap-2">
                <select
                  value={editingClient?.id || ''}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    if (!selectedId) {
                      setEditingClient(null);
                      return;
                    }
                    const found = corporateClients.find(c => c.id === selectedId);
                    if (found) startEdit(found);
                  }}
                  className="flex-1 p-2 bg-white border border-teal-300 rounded-xl text-slate-800 text-xs font-semibold focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none shadow-xs"
                >
                  <option value="">-- Choose Existing Client from Database to Edit ({corporateClients.length} accounts available) --</option>
                  {corporateClients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.companyName} • {c.clientTier} Tier • SPOC: {c.contactPerson} {c.gstin ? `[GST: ${c.gstin}]` : ''}
                    </option>
                  ))}
                </select>
                {editingClient && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingClient(null);
                      setIsCreating(false);
                    }}
                    className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-xl font-semibold shadow-xs cursor-pointer shrink-0"
                  >
                    Close Editor
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Create or Edit Form */}
          {(isCreating || editingClient) && canEdit ? (
            <form ref={formRef} onSubmit={handleSave} className="p-5 bg-teal-50/30 border-2 border-teal-300/80 rounded-2xl space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-teal-200">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-teal-600 text-white shadow-xs">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">
                        {isCreating ? 'Register New Corporate Client / Event Agency' : `Editing Client: ${editingClient?.companyName}`}
                      </h3>
                      {editingClient && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          Database ID: {editingClient.id}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {isCreating
                        ? 'Fill details to add a new contracted company or event agency into BEMS database.'
                        : 'Modify corporate parameters, SPOC liaison, billing address, or credit terms in database.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {editingClient && corporateClients.length > 1 && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-slate-500 font-medium">Switch Client:</span>
                      <select
                        value={editingClient.id}
                        onChange={(e) => {
                          const found = corporateClients.find(c => c.id === e.target.value);
                          if (found) startEdit(found);
                        }}
                        className="p-1 bg-white border border-teal-200 rounded-lg text-xs font-semibold text-slate-700"
                      >
                        {corporateClients.map(c => (
                          <option key={c.id} value={c.id}>{c.companyName}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreating(false);
                      setEditingClient(null);
                    }}
                    className="text-xs text-slate-600 hover:text-slate-900 px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-semibold cursor-pointer shadow-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-bold mb-1">Company / Organization Name *</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    placeholder="e.g. Tata Consultancy Services Ltd."
                    className="w-full p-2 bg-white border border-sky-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Client Tier *</label>
                  <select
                    value={clientTier}
                    onChange={e => setClientTier(e.target.value as any)}
                    className="w-full p-2 bg-white border border-sky-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                  >
                    <option value="Platinum">Platinum (High Volume / Priority)</option>
                    <option value="Gold">Gold (Frequent Corporate)</option>
                    <option value="Standard">Standard (General Corporate)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Primary SPOC / Contact Person *</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={e => setContactPerson(e.target.value)}
                    placeholder="e.g. Karthik Narayanan (Admin Head)"
                    className="w-full p-2 bg-white border border-sky-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Official Email Address</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={e => setContactEmail(e.target.value)}
                    placeholder="karthik.admin@company.com"
                    className="w-full p-2 bg-white border border-sky-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Direct Phone / Mobile</label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={e => setContactPhone(e.target.value)}
                    placeholder="+91 98400 12345"
                    className="w-full p-2 bg-white border border-sky-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={e => setGstin(e.target.value)}
                    placeholder="33AAAAA0000A1Z5"
                    className="w-full p-2 bg-white border border-sky-200 rounded-lg text-slate-800 font-mono focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none uppercase"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Credit Window (Days)</label>
                  <input
                    type="number"
                    value={creditDays}
                    onChange={e => setCreditDays(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-sky-200 rounded-lg text-slate-800 font-mono focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                    min={0}
                    step={15}
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Status *</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full p-2 bg-white border border-sky-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                  >
                    <option value="Active">Active (In Good Standing)</option>
                    <option value="Inactive">Inactive / Suspended</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Registered Billing Address</label>
                  <textarea
                    value={billingAddress}
                    onChange={e => setBillingAddress(e.target.value)}
                    rows={2}
                    placeholder="Complete corporate registered office address for GST invoicing..."
                    className="w-full p-2 bg-white border border-sky-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Relationship & Operational Notes</label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Contract terms, authorized bookers, special corporate menu rates..."
                    className="w-full p-2 bg-white border border-sky-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingClient(null);
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl hover:bg-white font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{isCreating ? 'Save New Client to Database' : 'Save Changes to Database'}</span>
                </button>
              </div>
            </form>
          ) : null}

          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by company name, contact person, GSTIN or email..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-slate-500">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="font-semibold text-[11px]">Filter:</span>
              </div>
              <select
                value={filterTier}
                onChange={e => setFilterTier(e.target.value)}
                className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 text-xs font-medium"
              >
                <option value="All">All Tiers</option>
                <option value="Platinum">Platinum</option>
                <option value="Gold">Gold</option>
                <option value="Standard">Standard</option>
              </select>

              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 text-xs font-medium"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active Only</option>
                <option value="Inactive">Inactive Only</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="p-3">Company & GSTIN</th>
                  <th className="p-3 text-center">Tier</th>
                  <th className="p-3">Key SPOC / Contact</th>
                  <th className="p-3">Communication</th>
                  <th className="p-3 text-center">Credit Terms</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 bg-white">
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No corporate accounts found matching the search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredClients.map(c => (
                    <tr
                      key={c.id}
                      className={`hover:bg-teal-50/40 transition-colors ${
                        editingClient?.id === c.id ? 'bg-teal-50/70 border-l-4 border-l-teal-600' : ''
                      }`}
                    >
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => startEdit(c)}
                          className="text-left font-bold text-slate-900 hover:text-teal-700 hover:underline flex items-center gap-1.5 group cursor-pointer"
                          title={`Click to edit ${c.companyName}`}
                        >
                          <span>{c.companyName}</span>
                          <span className="text-[10px] text-teal-700 bg-teal-50 group-hover:bg-teal-100 px-1.5 py-0.5 rounded border border-teal-200 font-bold transition-colors inline-flex items-center gap-0.5">
                            <Edit2 className="w-2.5 h-2.5" />
                            <span>Edit</span>
                          </span>
                        </button>
                        {c.gstin && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">GST: {c.gstin}</div>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          c.clientTier === 'Platinum'
                            ? 'bg-slate-900 text-amber-300 border border-amber-400/40'
                            : c.clientTier === 'Gold'
                            ? 'bg-amber-50 text-amber-800 border border-amber-300 font-bold'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {c.clientTier}
                        </span>
                      </td>
                      <td className="p-3 text-slate-700 font-medium">
                        <div>{c.contactPerson}</div>
                        {c.notes && <div className="text-[10px] text-slate-400 truncate max-w-xs">{c.notes}</div>}
                      </td>
                      <td className="p-3 text-slate-600 text-[11px] space-y-0.5">
                        {c.contactPhone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{c.contactPhone}</span>
                          </div>
                        )}
                        {c.contactEmail && (
                          <div className="flex items-center gap-1 text-slate-500">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-[160px]">{c.contactEmail}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-center font-mono text-slate-700 font-semibold">
                        {c.creditDays ? `${c.creditDays} days` : 'Immediate'}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => startEdit(c)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 hover:border-teal-400 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                            title={`Edit ${c.companyName}`}
                          >
                            <Edit2 className="w-3.5 h-3.5 text-teal-600" />
                            <span>Edit Client</span>
                          </button>
                          {canEdit && (
                            <button
                              onClick={() => handleDelete(c.id, c.companyName)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <strong className="text-slate-700">{filteredClients.length}</strong> of{' '}
            <strong className="text-slate-700">{corporateClients.length}</strong> corporate accounts
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

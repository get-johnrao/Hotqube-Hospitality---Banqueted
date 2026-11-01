import React, { useState, useMemo } from 'react';
import { useBEMS } from '../../context/BEMSContext';
import { AccountHandlerMaster } from '../../types';
import {
  UserCheck,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  CheckCircle2,
  Phone,
  Mail,
  Briefcase,
  AlertCircle,
} from 'lucide-react';

interface AccountHandlerMasterModalProps {
  onClose: () => void;
  onSelectTab?: (tab: string) => void;
}

export const AccountHandlerMasterModal: React.FC<AccountHandlerMasterModalProps> = ({
  onClose,
  onSelectTab,
}) => {
  const {
    accountHandlers,
    addAccountHandler,
    updateAccountHandler,
    deleteAccountHandler,
    currentUser,
    enquiries,
  } = useBEMS();

  const canEdit = currentUser?.role === 'Admin' || currentUser?.role === 'Editor';

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  const [editingHandler, setEditingHandler] = useState<AccountHandlerMaster | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'info' | 'error' | 'success';
  } | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

  const startCreate = () => {
    setEditingHandler(null);
    setIsCreating(true);
    setName('');
    setRole('Senior Banquet Sales Specialist');
    setMobile('');
    setEmail('');
    setStatus('Active');
    setNotification(null);
  };

  const startEdit = (handler: AccountHandlerMaster) => {
    setEditingHandler(handler);
    setIsCreating(false);
    setName(handler.name);
    setRole(handler.role || handler.designation || '');
    setMobile(handler.mobile || handler.phone || '');
    setEmail(handler.email || '');
    setStatus(handler.status);
    setNotification(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNotification({ message: 'Handler Name is required.', type: 'error' });
      return;
    }
    if (!mobile.trim()) {
      setNotification({ message: 'Mobile number is required for guest dispatch.', type: 'error' });
      return;
    }

    if (isCreating) {
      addAccountHandler({
        name: name.trim(),
        role: role.trim() || 'Banquet Executive',
        designation: role.trim() || 'Banquet Executive',
        mobile: mobile.trim(),
        phone: mobile.trim(),
        email: email.trim(),
        status,
      });
      setNotification({
        message: `Account Handler "${name.trim()}" successfully registered.`,
        type: 'success',
      });
    } else if (editingHandler) {
      updateAccountHandler({
        ...editingHandler,
        name: name.trim(),
        role: role.trim() || 'Banquet Executive',
        designation: role.trim() || 'Banquet Executive',
        mobile: mobile.trim(),
        phone: mobile.trim(),
        email: email.trim(),
        status,
      });
      setNotification({
        message: `Account Handler "${name.trim()}" profile updated.`,
        type: 'success',
      });
    }

    setIsCreating(false);
    setEditingHandler(null);
  };

  const handleDelete = (id: string, handlerName: string) => {
    if (window.confirm(`Are you sure you want to delete Account Handler "${handlerName}"?`)) {
      const res = deleteAccountHandler(id);
      if (res.success) {
        setNotification({ message: res.message, type: 'success' });
      } else {
        setNotification({ message: res.message, type: 'error' });
      }
    }
  };

  // Filtered List
  const filteredHandlers = useMemo(() => {
    return accountHandlers.filter(h => {
      const matchesSearch =
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (h.role || h.designation || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (h.mobile || h.phone || '').includes(searchQuery) ||
        (h.email || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = filterStatus === 'All' || h.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [accountHandlers, searchQuery, filterStatus]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-600 text-white rounded-xl shadow-xs">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-800">
                  Account Handler Master
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                  {accountHandlers.length} Handlers
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Manage banquet sales managers, event specialists, and coordinators assigned to client enquiries.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && !isCreating && !editingHandler && (
              <button
                onClick={startCreate}
                className="px-3.5 py-1.5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-xs font-semibold rounded-xl hover:from-teal-700 hover:to-cyan-700 shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Account Handler</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Master Sub-Navigation */}
        {onSelectTab && (
          <div className="px-6 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-xs">
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">All Masters:</span>
            <button onClick={() => onSelectTab('venues')} className="px-2.5 py-1 rounded-md text-slate-600 hover:bg-white transition-colors cursor-pointer">Venues</button>
            <button onClick={() => onSelectTab('menuPackages')} className="px-2.5 py-1 rounded-md text-slate-600 hover:bg-white transition-colors cursor-pointer">Menu Packages</button>
            <button onClick={() => onSelectTab('inclusions')} className="px-2.5 py-1 rounded-md text-slate-600 hover:bg-white transition-colors cursor-pointer">Inclusions & Add-Ons</button>
            <button onClick={() => onSelectTab('eventTypes')} className="px-2.5 py-1 rounded-md text-slate-600 hover:bg-white transition-colors cursor-pointer">Event Types</button>
            <button onClick={() => onSelectTab('corporateClients')} className="px-2.5 py-1 rounded-md text-slate-600 hover:bg-white transition-colors cursor-pointer">Corporate Clients</button>
            <button onClick={() => onSelectTab('leadSources')} className="px-2.5 py-1 rounded-md text-slate-600 hover:bg-white transition-colors cursor-pointer">Lead Sources</button>
            <button className="px-2.5 py-1 rounded-md bg-teal-600 text-white font-bold shadow-xs cursor-default">Account Handlers</button>
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
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Create or Edit Inline Form */}
          {(isCreating || editingHandler) && (
            <div className="mb-6 bg-slate-50 rounded-xl border border-teal-200/80 p-5 shadow-xs animate-in fade-in-50">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-teal-600" />
                  <span>{isCreating ? 'Register New Account Handler' : `Edit Account Handler: ${editingHandler?.name}`}</span>
                </h3>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setEditingHandler(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Handler Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. John Rao"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Role / Designation <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    placeholder="e.g. Director - Banquet Sales"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mobile Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={mobile}
                    onChange={e => setMobile(e.target.value)}
                    placeholder="e.g. +91 98401 23456"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Official Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. john.banquets@theresidency.com"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Operational Status
                  </label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as 'Active' | 'Inactive')}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
                  >
                    <option value="Active">Active (Available for Lead Assignment)</option>
                    <option value="Inactive">Inactive (On Leave / Deprecated)</option>
                  </select>
                </div>

                <div className="md:col-span-2 lg:col-span-3 flex items-end justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreating(false);
                      setEditingHandler(null);
                    }}
                    className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-100 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isCreating ? 'Save Account Handler' : 'Update Profile'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search handler by name, role, mobile, email..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span>Status:</span>
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white font-medium"
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100/80 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Account Handler</th>
                  <th className="px-4 py-3">Role / Designation</th>
                  <th className="px-4 py-3">Contact Details</th>
                  <th className="px-4 py-3 text-center">Active Enquiries</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  {canEdit && <th className="px-4 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredHandlers.length === 0 ? (
                  <tr>
                    <td colSpan={canEdit ? 6 : 5} className="px-4 py-8 text-center text-slate-400">
                      No account handlers found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredHandlers.map(handler => {
                    const assignedEnquiriesCount = enquiries.filter(
                      e => e.accountHandlerId === handler.id || e.accountHandler === handler.name || e.firstContactPerson === handler.name
                    ).length;

                    return (
                      <tr key={handler.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs uppercase">
                              {handler.name.charAt(0)}
                            </div>
                            <span>{handler.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1.5 text-slate-700">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                            {handler.role || handler.designation || 'Staff'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <Phone className="w-3.5 h-3.5 text-teal-600" />
                              <span className="font-mono">{handler.mobile || handler.phone || '—'}</span>
                            </div>
                            {handler.email && (
                              <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                                <Mail className="w-3 h-3 text-slate-400" />
                                <span>{handler.email}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            assignedEnquiriesCount > 0 ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'text-slate-400'
                          }`}>
                            {assignedEnquiriesCount}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              handler.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border border-slate-300'
                            }`}
                          >
                            {handler.status}
                          </span>
                        </td>
                        {canEdit && (
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => startEdit(handler)}
                                title="Edit Handler Profile"
                                className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(handler.id, handler.name)}
                                title="Delete Handler"
                                className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

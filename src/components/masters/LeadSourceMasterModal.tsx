import React, { useState, useMemo } from 'react';
import { useBEMS } from '../../context/BEMSContext';
import { LeadSourceMaster } from '../../types';
import {
  Compass,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  SlidersHorizontal,
  Info,
  CheckCircle2,
  Share2,
  Target,
} from 'lucide-react';

interface LeadSourceMasterModalProps {
  onClose: () => void;
  onSelectTab?: (tab: string) => void;
}

const CHANNEL_TYPES: LeadSourceMaster['channelType'][] = [
  'Direct',
  'Internal',
  'Referral',
  'Online',
  'Partner',
];

export const LeadSourceMasterModal: React.FC<LeadSourceMasterModalProps> = ({ onClose, onSelectTab }) => {
  const { leadSourcesMaster, addLeadSource, updateLeadSource, deleteLeadSource, currentUser } = useBEMS();
  const canEdit = currentUser?.role === 'Admin' || currentUser?.role === 'Editor';

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  const [editingSource, setEditingSource] = useState<LeadSourceMaster | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'error' | 'success' } | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [channelType, setChannelType] = useState<LeadSourceMaster['channelType']>('Direct');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

  const startCreate = () => {
    setEditingSource(null);
    setIsCreating(true);
    setName('');
    setChannelType('Direct');
    setDescription('');
    setStatus('Active');
    setNotification(null);
  };

  const startEdit = (source: LeadSourceMaster) => {
    setEditingSource(source);
    setIsCreating(false);
    setName(source.name);
    setChannelType(source.channelType);
    setDescription(source.description || '');
    setStatus(source.status);
    setNotification(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNotification({ message: 'Channel / Source Name is required.', type: 'error' });
      return;
    }

    if (isCreating) {
      addLeadSource({
        name: name.trim(),
        channelType,
        description: description.trim(),
        status,
      });
      setNotification({ message: `Lead source "${name.trim()}" successfully created.`, type: 'success' });
    } else if (editingSource) {
      updateLeadSource({
        ...editingSource,
        name: name.trim(),
        channelType,
        description: description.trim(),
        status,
      });
      setNotification({ message: `Lead source "${name.trim()}" updated successfully.`, type: 'success' });
    }

    setIsCreating(false);
    setEditingSource(null);
  };

  const handleDelete = (id: string, srcName: string) => {
    if (!window.confirm(`Are you sure you want to delete lead source "${srcName}"?`)) return;
    const res = deleteLeadSource(id);
    if (res.success) {
      setNotification({ message: res.message, type: 'success' });
    } else {
      setNotification({ message: res.message, type: 'error' });
    }
  };

  const filteredSources = useMemo(() => {
    return leadSourcesMaster.filter(s => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesType = filterType === 'All' || s.channelType === filterType;
      const matchesStatus = filterStatus === 'All' || s.status === filterStatus;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [leadSourcesMaster, searchQuery, filterType, filterStatus]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-sky-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-sky-100 bg-gradient-to-r from-teal-50 via-cyan-50/50 to-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-600 text-white shadow-sm">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-800">
                  Lead Source / Business Channel Master
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                  {leadSourcesMaster.length} Sources
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Track marketing channels, referral sources, travel partners, and corporate sales originators.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && !isCreating && !editingSource && (
              <button
                onClick={startCreate}
                className="px-3.5 py-1.5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-xs font-semibold rounded-xl hover:from-teal-700 hover:to-cyan-700 shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Source</span>
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
            <button onClick={() => onSelectTab('venues')} className="px-2.5 py-1 rounded-md text-slate-600 hover:bg-white transition-colors">Venues</button>
            <button onClick={() => onSelectTab('menuPackages')} className="px-2.5 py-1 rounded-md text-slate-600 hover:bg-white transition-colors">Menu Packages</button>
            <button onClick={() => onSelectTab('inclusions')} className="px-2.5 py-1 rounded-md text-slate-600 hover:bg-white transition-colors">Inclusions & Add-Ons</button>
            <button onClick={() => onSelectTab('eventTypes')} className="px-2.5 py-1 rounded-md text-slate-600 hover:bg-white transition-colors">Event Types</button>
            <button onClick={() => onSelectTab('corporateClients')} className="px-2.5 py-1 rounded-md text-slate-600 hover:bg-white transition-colors">Corporate Clients</button>
            <button className="px-2.5 py-1 rounded-md bg-teal-600 text-white font-bold shadow-xs">Lead Sources</button>
            <button onClick={() => onSelectTab('accountHandlers')} className="px-2.5 py-1 rounded-md text-slate-600 hover:bg-white transition-colors">Account Handlers</button>
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
          {/* Create or Edit Form */}
          {(isCreating || editingSource) && canEdit ? (
            <form onSubmit={handleSave} className="p-5 bg-sky-50/50 border border-sky-200 rounded-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-sky-200/80">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-teal-600" />
                  <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide">
                    {isCreating ? 'Create New Business Channel / Lead Source' : `Edit Source: ${editingSource?.name}`}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingSource(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Source / Channel Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. WeddingWire India / Direct GM Desk"
                    className="w-full p-2 bg-white border border-sky-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Channel Classification *</label>
                  <select
                    value={channelType}
                    onChange={e => setChannelType(e.target.value as any)}
                    className="w-full p-2 bg-white border border-sky-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                  >
                    {CHANNEL_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Status *</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full p-2 bg-white border border-sky-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                  >
                    <option value="Active">Active (Selectable for Intake)</option>
                    <option value="Inactive">Inactive (Deprecated)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Tracking Notes / Campaign Context</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  placeholder="e.g. Inbound portal inquiries routed to digital concierge desk..."
                  className="w-full p-2 bg-white border border-sky-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingSource(null);
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl hover:bg-white font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {isCreating ? 'Save New Lead Source' : 'Update Source'}
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
                placeholder="Search lead channels by name or campaign notes..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-slate-500">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="font-semibold text-[11px]">Filter:</span>
              </div>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 text-xs font-medium"
              >
                <option value="All">All Channel Types</option>
                {CHANNEL_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
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
                  <th className="p-3">Source Name</th>
                  <th className="p-3">Classification</th>
                  <th className="p-3">Description / Attribution</th>
                  <th className="p-3 text-center">Status</th>
                  {canEdit && <th className="p-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 bg-white">
                {filteredSources.length === 0 ? (
                  <tr>
                    <td colSpan={canEdit ? 5 : 4} className="p-8 text-center text-slate-400">
                      No business channels found matching the filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredSources.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 font-bold text-slate-800">
                        {s.name}
                      </td>
                      <td className="p-3">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          s.channelType === 'Direct'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : s.channelType === 'Internal'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : s.channelType === 'Online'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : s.channelType === 'Partner'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {s.channelType}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 max-w-sm text-[11px]">
                        {s.description || '—'}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      {canEdit && (
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => startEdit(s)}
                              className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Source"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(s.id, s.name)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Source"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
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
            Showing <strong className="text-slate-700">{filteredSources.length}</strong> of{' '}
            <strong className="text-slate-700">{leadSourcesMaster.length}</strong> lead channels configured
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

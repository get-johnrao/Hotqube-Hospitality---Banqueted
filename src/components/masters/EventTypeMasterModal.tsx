import React, { useState, useMemo } from 'react';
import { useBEMS } from '../../context/BEMSContext';
import { EventTypeMaster, SeatingArrangement } from '../../types';
import { SEATING_ARRANGEMENTS } from '../../data/initialData';
import {
  CalendarDays,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  SlidersHorizontal,
  Info,
  CheckCircle2,
  BookmarkCheck,
  Users,
} from 'lucide-react';

interface EventTypeMasterModalProps {
  onClose: () => void;
  onSelectTab?: (tab: string) => void;
}

const EVENT_CATEGORIES: EventTypeMaster['category'][] = [
  'Social',
  'Corporate',
  'MICE',
  'Ceremony',
  'Other',
];

export const EventTypeMasterModal: React.FC<EventTypeMasterModalProps> = ({ onClose, onSelectTab }) => {
  const { eventTypesMaster, addEventType, updateEventType, deleteEventType, currentUser } = useBEMS();
  const canEdit = currentUser?.role === 'Admin' || currentUser?.role === 'Editor';

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  const [editingEvt, setEditingEvt] = useState<EventTypeMaster | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'error' | 'success' } | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState<EventTypeMaster['category']>('Social');
  const [defaultLayout, setDefaultLayout] = useState<SeatingArrangement>('Cluster');
  const [estimatedAvgPax, setEstimatedAvgPax] = useState<number>(100);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

  const startCreate = () => {
    setEditingEvt(null);
    setIsCreating(true);
    setName('');
    setCategory('Social');
    setDefaultLayout('Cluster');
    setEstimatedAvgPax(100);
    setDescription('');
    setStatus('Active');
    setNotification(null);
  };

  const startEdit = (evt: EventTypeMaster) => {
    setEditingEvt(evt);
    setIsCreating(false);
    setName(evt.name);
    setCategory(evt.category);
    setDefaultLayout(evt.defaultLayout || 'Cluster');
    setEstimatedAvgPax(evt.estimatedAvgPax || 100);
    setDescription(evt.description || '');
    setStatus(evt.status);
    setNotification(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNotification({ message: 'Event type name is required.', type: 'error' });
      return;
    }

    if (isCreating) {
      addEventType({
        name: name.trim(),
        category,
        defaultLayout,
        estimatedAvgPax: Number(estimatedAvgPax) || 50,
        description: description.trim(),
        status,
      });
      setNotification({ message: `Event type "${name.trim()}" successfully created.`, type: 'success' });
    } else if (editingEvt) {
      updateEventType({
        ...editingEvt,
        name: name.trim(),
        category,
        defaultLayout,
        estimatedAvgPax: Number(estimatedAvgPax) || 50,
        description: description.trim(),
        status,
      });
      setNotification({ message: `Event type "${name.trim()}" updated successfully.`, type: 'success' });
    }

    setIsCreating(false);
    setEditingEvt(null);
  };

  const handleDelete = (id: string, evtName: string) => {
    if (!window.confirm(`Are you sure you want to delete event type "${evtName}"?`)) return;
    const res = deleteEventType(id);
    if (res.success) {
      setNotification({ message: res.message, type: 'success' });
    } else {
      setNotification({ message: res.message, type: 'error' });
    }
  };

  const filteredEvents = useMemo(() => {
    return eventTypesMaster.filter(evt => {
      const matchesSearch =
        evt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (evt.description && evt.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = filterCategory === 'All' || evt.category === filterCategory;
      const matchesStatus = filterStatus === 'All' || evt.status === filterStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [eventTypesMaster, searchQuery, filterCategory, filterStatus]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-sky-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-sky-100 bg-gradient-to-r from-teal-50 via-cyan-50/50 to-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-600 text-white shadow-sm">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-800">
                  Event / Function Type Master
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                  {eventTypesMaster.length} Types
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Standardize event classifications, typical guest counts, and default room setups across bookings.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && !isCreating && !editingEvt && (
              <button
                onClick={startCreate}
                className="px-3.5 py-1.5 bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-xs font-semibold rounded-xl hover:from-teal-700 hover:to-cyan-700 shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Event Type</span>
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
            <button className="px-2.5 py-1 rounded-md bg-teal-600 text-white font-bold shadow-xs">Event Types</button>
            <button onClick={() => onSelectTab('corporateClients')} className="px-2.5 py-1 rounded-md text-slate-600 hover:bg-white transition-colors">Corporate Clients</button>
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
          {/* Create or Edit Form */}
          {(isCreating || editingEvt) && canEdit ? (
            <form onSubmit={handleSave} className="p-5 bg-sky-50/50 border border-sky-200 rounded-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-sky-200/80">
                <div className="flex items-center gap-2">
                  <BookmarkCheck className="w-4 h-4 text-teal-600" />
                  <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide">
                    {isCreating ? 'Create New Event Type' : `Edit Type: ${editingEvt?.name}`}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingEvt(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Event Type Title *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Sangeet Celebration / Product Launch"
                    className="w-full p-2 bg-white border border-sky-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Segment / Category *</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="w-full p-2 bg-white border border-sky-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                  >
                    {EVENT_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Preferred Room Layout</label>
                  <select
                    value={defaultLayout}
                    onChange={e => setDefaultLayout(e.target.value as SeatingArrangement)}
                    className="w-full p-2 bg-white border border-sky-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                  >
                    {SEATING_ARRANGEMENTS.map(layout => (
                      <option key={layout} value={layout}>{layout}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Estimated Typical Pax</label>
                  <input
                    type="number"
                    value={estimatedAvgPax}
                    onChange={e => setEstimatedAvgPax(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-sky-200 rounded-lg text-slate-800 font-mono focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                    min={10}
                    step={10}
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Status *</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full p-2 bg-white border border-sky-200 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                  >
                    <option value="Active">Active (Selectable in Enquiries)</option>
                    <option value="Inactive">Inactive (Disabled)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Operational Notes / Focus</label>
                  <input
                    type="text"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="e.g. Stage + green room required"
                    className="w-full p-2 bg-white border border-sky-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingEvt(null);
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl hover:bg-white font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {isCreating ? 'Save New Event Type' : 'Update Type'}
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
                placeholder="Search function types..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-slate-500">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="font-semibold text-[11px]">Filter:</span>
              </div>
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 text-xs font-medium"
              >
                <option value="All">All Categories</option>
                {EVENT_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
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
                  <th className="p-3">Event Type</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Default Setup</th>
                  <th className="p-3 text-center">Avg Pax</th>
                  <th className="p-3">Description</th>
                  <th className="p-3 text-center">Status</th>
                  {canEdit && <th className="p-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 bg-white">
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={canEdit ? 7 : 6} className="p-8 text-center text-slate-400">
                      No event types found matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map(evt => (
                    <tr key={evt.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 font-bold text-slate-800">
                        {evt.name}
                      </td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          evt.category === 'Social'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : evt.category === 'Corporate'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : evt.category === 'Ceremony'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : evt.category === 'MICE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {evt.category}
                        </span>
                      </td>
                      <td className="p-3 text-slate-700 font-medium">
                        {evt.defaultLayout || 'Cluster'}
                      </td>
                      <td className="p-3 text-center font-mono text-slate-600">
                        {evt.estimatedAvgPax ? `${evt.estimatedAvgPax} pax` : '—'}
                      </td>
                      <td className="p-3 text-slate-500 max-w-xs text-[11px]">
                        {evt.description || '—'}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          evt.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {evt.status}
                        </span>
                      </td>
                      {canEdit && (
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => startEdit(evt)}
                              className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Event Type"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(evt.id, evt.name)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Event Type"
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
            Showing <strong className="text-slate-700">{filteredEvents.length}</strong> of{' '}
            <strong className="text-slate-700">{eventTypesMaster.length}</strong> function types configured
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

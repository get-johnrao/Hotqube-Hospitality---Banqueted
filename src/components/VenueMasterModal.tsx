import React, { useState } from 'react';
import { useBEMS } from '../context/BEMSContext';
import { VenueHall, SeatingArrangement } from '../types';
import { SEATING_ARRANGEMENTS } from '../data/initialData';
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Check,
  AlertCircle,
  X,
  ShieldAlert,
} from 'lucide-react';

interface VenueMasterModalProps {
  onClose: () => void;
  onSelectTab?: (tab: string) => void;
}

export const VenueMasterModal: React.FC<VenueMasterModalProps> = ({ onClose, onSelectTab }) => {
  const { venues, addVenue, updateVenue, deleteVenue, currentUser } = useBEMS();
  const canEdit = currentUser?.role === 'Admin' || currentUser?.role === 'Editor';

  const [editingVenue, setEditingVenue] = useState<VenueHall | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'error' | 'success' } | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [areaSqFt, setAreaSqFt] = useState<number>(2000);
  const [dimensions, setDimensions] = useState('40 ft x 50 ft');
  const [ceilingHeight, setCeilingHeight] = useState('12 ft ceiling');
  const [preFunctionArea, setPreFunctionArea] = useState('1,000 sq ft foyer');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [defaultMg, setDefaultMg] = useState<number>(100);

  // Seating Layout Specific MGs
  const [theatreMG, setTheatreMG] = useState<number>(100);
  const [clusterMG, setClusterMG] = useState<number>(80);
  const [classroomMG, setClassroomMG] = useState<number>(60);
  const [casualMG, setCasualMG] = useState<number>(100);
  const [boardroomMG, setBoardroomMG] = useState<number>(30);
  const [ushapedMG, setUshapedMG] = useState<number>(30);
  const [bananaLeafMG, setBananaLeafMG] = useState<number>(80);

  const startEdit = (v: VenueHall) => {
    setEditingVenue(v);
    setIsCreating(false);
    setName(v.name);
    setAreaSqFt(v.areaSqFt || 2000);
    setDimensions(v.dimensions || '');
    setCeilingHeight(v.ceilingHeight || '');
    setPreFunctionArea(v.preFunctionArea || '');
    setStatus(v.status);
    setDefaultMg(v.defaultMg || 100);

    setTheatreMG(v.layouts?.Theatre?.mg || v.defaultMg || 100);
    setClusterMG(v.layouts?.Cluster?.mg || v.defaultMg || 80);
    setClassroomMG(v.layouts?.ClassRoom?.mg || v.defaultMg || 60);
    setCasualMG(v.layouts?.Casual?.mg || v.defaultMg || 100);
    setBoardroomMG(v.layouts?.Boardroom?.mg || 30);
    setUshapedMG(v.layouts?.['U-shaped']?.mg || 30);
    setBananaLeafMG(v.layouts?.['Banana Leaf Service']?.mg || 80);
  };

  const startCreate = () => {
    setEditingVenue(null);
    setIsCreating(true);
    setName('');
    setAreaSqFt(2500);
    setDimensions('45 ft x 55 ft');
    setCeilingHeight('14 ft ceiling');
    setPreFunctionArea('1,000 sq ft pre-function foyer');
    setStatus('Active');
    setDefaultMg(100);

    setTheatreMG(100);
    setClusterMG(80);
    setClassroomMG(60);
    setCasualMG(90);
    setBoardroomMG(30);
    setUshapedMG(30);
    setBananaLeafMG(80);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNotification({ message: 'Hall Name is strictly mandatory.', type: 'error' });
      return;
    }

    const layoutsConfig = {
      Theatre: { capacityMin: theatreMG, capacityMax: theatreMG + 50, mg: theatreMG },
      Cluster: { capacityMin: clusterMG, capacityMax: clusterMG + 40, mg: clusterMG },
      ClassRoom: { capacityMin: classroomMG, capacityMax: classroomMG + 40, mg: classroomMG },
      Casual: { capacityMin: casualMG, capacityMax: casualMG + 50, mg: casualMG },
      Boardroom: { capacityMin: boardroomMG, capacityMax: boardroomMG + 20, mg: boardroomMG },
      'U-shaped': { capacityMin: ushapedMG, capacityMax: ushapedMG + 20, mg: ushapedMG },
      'Banana Leaf Service': { capacityMin: bananaLeafMG, capacityMax: bananaLeafMG + 50, mg: bananaLeafMG },
    };

    if (isCreating) {
      addVenue({
        name: name.trim(),
        areaSqFt,
        dimensions,
        ceilingHeight,
        preFunctionArea,
        status,
        defaultMg,
        layouts: layoutsConfig,
      });
      setNotification({ message: `Venue "${name}" added to master database.`, type: 'success' });
    } else if (editingVenue) {
      updateVenue({
        ...editingVenue,
        name: name.trim(),
        areaSqFt,
        dimensions,
        ceilingHeight,
        preFunctionArea,
        status,
        defaultMg,
        layouts: layoutsConfig,
      });
      setNotification({ message: `Venue "${name}" master parameters updated.`, type: 'success' });
    }

    setEditingVenue(null);
    setIsCreating(false);
  };

  const handleDelete = (hallId: string) => {
    const res = deleteVenue(hallId);
    setNotification({
      message: res.message,
      type: res.success ? 'info' : 'error',
    });
  };

  return (
    <div id="venue-master-modal-overlay" className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-50 overflow-y-auto">
      <div className="w-full max-w-5xl bg-white border border-sky-200 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-sky-50/80 border-b border-sky-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-xl text-teal-700">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Hall Masters & Seating Layout Capacity Configuration
              </h2>
              <p className="text-xs text-slate-500">
                Manage venue dimensions, baseline Minimum Guarantee (MG), and layout specifications
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {canEdit && !isCreating && !editingVenue && (
              <button
                onClick={startCreate}
                className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New Hall</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-sky-100/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Master Sub-Navigation */}
        {onSelectTab && (
          <div className="px-6 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-xs">
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">All Masters:</span>
            <button className="px-2.5 py-1 rounded-md bg-teal-600 text-white font-bold shadow-xs">Venues</button>
            <button onClick={() => onSelectTab('menuPackages')} className="px-2.5 py-1 rounded-md text-slate-600 hover:bg-white transition-colors">Menu Packages</button>
            <button onClick={() => onSelectTab('inclusions')} className="px-2.5 py-1 rounded-md text-slate-600 hover:bg-white transition-colors">Inclusions & Add-Ons</button>
            <button onClick={() => onSelectTab('eventTypes')} className="px-2.5 py-1 rounded-md text-slate-600 hover:bg-white transition-colors">Event Types</button>
            <button onClick={() => onSelectTab('corporateClients')} className="px-2.5 py-1 rounded-md text-slate-600 hover:bg-white transition-colors">Corporate Clients</button>
            <button onClick={() => onSelectTab('leadSources')} className="px-2.5 py-1 rounded-md text-slate-600 hover:bg-white transition-colors">Lead Sources</button>
            <button onClick={() => onSelectTab('accountHandlers')} className="px-2.5 py-1 rounded-md text-slate-600 hover:bg-white transition-colors">Account Handlers</button>
          </div>
        )}

        {/* Notification Banner */}
        {notification && (
          <div className={`px-6 py-3 border-b text-xs flex items-center justify-between shrink-0 ${
            notification.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-teal-50 border-teal-200 text-teal-800'
          }`}>
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-700">✕</button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
          {/* Edit / Create Form */}
          {(isCreating || editingVenue) && canEdit ? (
            <form onSubmit={handleSave} className="p-5 bg-sky-50/40 border border-sky-200 rounded-2xl space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-sky-200">
                <h3 className="text-sm font-bold text-teal-800 uppercase tracking-wider">
                  {isCreating ? 'Create New Venue Record' : `Edit Parameters: ${editingVenue?.name}`}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingVenue(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancel Edit
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Hall Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Ballroom 5 / Orchid Hall"
                    className="w-full p-2 bg-white border border-sky-200 rounded-lg text-slate-800 shadow-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Main Hall Area (Sq Ft) *</label>
                  <input
                    type="number"
                    value={areaSqFt}
                    onChange={e => setAreaSqFt(parseInt(e.target.value, 10) || 0)}
                    className="w-full p-2 bg-white border border-sky-200 rounded-lg text-slate-800 font-mono shadow-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Status *</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full p-2 bg-white border border-sky-200 rounded-lg text-slate-800 shadow-xs"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Dimensions</label>
                  <input
                    type="text"
                    value={dimensions}
                    onChange={e => setDimensions(e.target.value)}
                    placeholder="e.g. 91 ft x 66 ft"
                    className="w-full p-2 bg-white border border-sky-200 rounded-lg text-slate-800 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Ceiling Height</label>
                  <input
                    type="text"
                    value={ceilingHeight}
                    onChange={e => setCeilingHeight(e.target.value)}
                    placeholder="e.g. 16 ft ceiling"
                    className="w-full p-2 bg-white border border-sky-200 rounded-lg text-slate-800 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Pre-Function Area</label>
                  <input
                    type="text"
                    value={preFunctionArea}
                    onChange={e => setPreFunctionArea(e.target.value)}
                    placeholder="e.g. 2,000 sq ft foyer"
                    className="w-full p-2 bg-white border border-sky-200 rounded-lg text-slate-800 shadow-xs"
                  />
                </div>
              </div>

              {/* Seating Layout Minimum Guarantees */}
              <div className="pt-3 border-t border-sky-200">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Layout Specific Minimum Guarantees (MG)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-slate-600 block text-[11px] mb-1">Theatre MG:</label>
                    <input
                      type="number"
                      value={theatreMG}
                      onChange={e => setTheatreMG(parseInt(e.target.value, 10) || 0)}
                      className="w-full p-1.5 bg-white border border-sky-200 rounded text-slate-800 font-mono text-center shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 block text-[11px] mb-1">Cluster MG:</label>
                    <input
                      type="number"
                      value={clusterMG}
                      onChange={e => setClusterMG(parseInt(e.target.value, 10) || 0)}
                      className="w-full p-1.5 bg-white border border-sky-200 rounded text-slate-800 font-mono text-center shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 block text-[11px] mb-1">Classroom MG:</label>
                    <input
                      type="number"
                      value={classroomMG}
                      onChange={e => setClassroomMG(parseInt(e.target.value, 10) || 0)}
                      className="w-full p-1.5 bg-white border border-sky-200 rounded text-slate-800 font-mono text-center shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="text-slate-600 block text-[11px] mb-1">Banana Leaf MG:</label>
                    <input
                      type="number"
                      value={bananaLeafMG}
                      onChange={e => setBananaLeafMG(parseInt(e.target.value, 10) || 0)}
                      className="w-full p-1.5 bg-white border border-sky-200 rounded text-slate-800 font-mono text-center shadow-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingVenue(null);
                  }}
                  className="px-4 py-1.5 text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg text-xs shadow-xs"
                >
                  Save Venue Configuration
                </button>
              </div>
            </form>
          ) : null}

          {/* Venues Master Table */}
          <div className="bg-white border border-sky-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-sky-50/80 border-b border-sky-200 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="p-3">Venue Name</th>
                    <th className="p-3">Dimensions & Ceiling</th>
                    <th className="p-3">Pre-Function Area</th>
                    <th className="p-3 text-center">Theatre MG</th>
                    <th className="p-3 text-center">Cluster MG</th>
                    <th className="p-3 text-center">Classroom MG</th>
                    <th className="p-3 text-center">Status</th>
                    {canEdit && <th className="p-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-100">
                  {venues.map(v => {
                    return (
                      <tr key={v.id} className="hover:bg-sky-50/40">
                        <td className="p-3">
                          <strong className="text-slate-800 block">{v.name}</strong>
                          <span className="text-[10px] text-teal-600 font-mono">
                            {v.areaSqFt ? `${v.areaSqFt} sq ft` : ''}
                          </span>
                        </td>
                        <td className="p-3 text-slate-700">
                          {v.dimensions || '—'}
                          <span className="block text-[10px] text-slate-500">{v.ceilingHeight}</span>
                        </td>
                        <td className="p-3 text-slate-600 max-w-[200px] truncate" title={v.preFunctionArea}>
                          {v.preFunctionArea || '—'}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-slate-800">
                          {v.layouts?.Theatre?.mg || v.defaultMg || '—'}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-slate-800">
                          {v.layouts?.Cluster?.mg || '—'}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-slate-800">
                          {v.layouts?.ClassRoom?.mg || '—'}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            v.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {v.status}
                          </span>
                        </td>
                        {canEdit && (
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => startEdit(v)}
                                className="p-1.5 bg-sky-50 hover:bg-sky-100 text-teal-700 rounded-lg transition-colors border border-sky-200"
                                title="Edit Master Parameters"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(v.id)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors border border-rose-200"
                                title="Delete Venue (With Safeguard Check)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-sky-50/80 border-t border-sky-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white hover:bg-sky-100 border border-sky-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

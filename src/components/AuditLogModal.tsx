import React, { useState, useMemo } from 'react';
import { useBEMS } from '../context/BEMSContext';
import {
  ShieldAlert,
  Search,
  Filter,
  X,
  History,
  Lock,
  User,
  Clock,
} from 'lucide-react';
import { formatDisplayDate } from '../utils/formatters';

interface AuditLogModalProps {
  onClose: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ onClose }) => {
  const { auditLogs } = useBEMS();
  const [searchRef, setSearchRef] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      if (searchRef.trim()) {
        const q = searchRef.toLowerCase();
        const matchesRef = (log.refNo || '').toLowerCase().includes(q);
        const matchesUser = (log.userId || '').toLowerCase().includes(q);
        const matchesField = (log.changedField || '').toLowerCase().includes(q);
        if (!matchesRef && !matchesUser && !matchesField) return false;
      }

      if (filterAction !== 'ALL' && log.actionType !== filterAction) {
        return false;
      }

      return true;
    });
  }, [auditLogs, searchRef, filterAction]);

  return (
    <div id="audit-log-modal-overlay" className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-50 overflow-y-auto">
      <div className="w-full max-w-5xl bg-white border border-sky-200 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-sky-50/70 border-b border-sky-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-xl text-teal-700">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span>System Security & Change Audit Trail</span>
                <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200 text-[10px] uppercase font-mono font-bold">
                  Append-Only Immutable
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Detailed history of all enquiry creations, stage progressions, rate edits, and MG overrides
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

        {/* Filter Controls */}
        <div className="px-6 py-3 bg-sky-50/40 border-b border-sky-100 flex flex-wrap items-center gap-3 text-xs">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchRef}
              onChange={e => setSearchRef(e.target.value)}
              placeholder="Search by Ref #, User ID, or Field Name..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-sky-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 shadow-xs"
            />
          </div>

          <select
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
            className="py-1.5 px-3 bg-white border border-sky-200 rounded-xl text-slate-800 focus:outline-none focus:border-teal-500 shadow-xs"
          >
            <option value="ALL">All Action Types</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="STAGE_ADVANCE">STAGE_ADVANCE</option>
            <option value="EXCLUSIVE_LOCK">EXCLUSIVE_LOCK</option>
            <option value="MG_OVERRIDE">MG_OVERRIDE</option>
            <option value="CANCEL">CANCEL</option>
            <option value="DELETE">DELETE</option>
          </select>

          <span className="text-slate-500 font-mono">
            Showing {filteredLogs.length} of {auditLogs.length} entries
          </span>
        </div>

        {/* Log Entries Table */}
        <div className="p-6 overflow-y-auto flex-1 text-xs">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              No audit records match the current filters.
            </div>
          ) : (
            <div className="bg-white border border-sky-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-sky-50/80 border-b border-sky-200 text-slate-600 font-bold uppercase tracking-wider">
                      <th className="p-3">Timestamp (IST)</th>
                      <th className="p-3">User</th>
                      <th className="p-3">Action Type</th>
                      <th className="p-3">Ref No</th>
                      <th className="p-3">Field / Event</th>
                      <th className="p-3">Previous State</th>
                      <th className="p-3">New State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sky-100 font-mono text-[11px]">
                    {filteredLogs.map(log => {
                      const isExclusive = log.actionType === 'EXCLUSIVE_LOCK';
                      const isMGOverride = log.actionType === 'MG_OVERRIDE';
                      const isDelete = log.actionType === 'DELETE';

                      return (
                        <tr key={log.id} className="hover:bg-sky-50/50 transition-colors">
                          <td className="p-3 text-slate-500 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString('en-IN', {
                              timeZone: 'Asia/Kolkata',
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </td>
                          <td className="p-3 text-slate-800 font-semibold whitespace-nowrap">
                            {log.userId}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                              isExclusive
                                ? 'bg-purple-50 border border-purple-200 text-purple-700'
                                : isMGOverride
                                ? 'bg-amber-50 border border-amber-200 text-amber-800'
                                : isDelete
                                ? 'bg-rose-50 border border-rose-200 text-rose-700'
                                : 'bg-sky-50 text-slate-700 border border-sky-200'
                            }`}>
                              {log.actionType}
                            </span>
                          </td>
                          <td className="p-3 text-teal-700 font-bold whitespace-nowrap">
                            {log.refNo ? `#${log.refNo}` : '—'}
                          </td>
                          <td className="p-3 text-slate-800 font-semibold">
                            {log.changedField}
                          </td>
                          <td className="p-3 text-slate-500 max-w-[150px] truncate" title={log.oldValue}>
                            {log.oldValue || '—'}
                          </td>
                          <td className="p-3 text-teal-800 font-semibold max-w-[200px] truncate" title={log.newValue}>
                            {log.newValue}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-sky-50/50 border-t border-sky-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white border border-sky-200 hover:bg-sky-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { History, Search, Filter, ShieldCheck, Clock, User } from 'lucide-react';

export const AuditLogsView: React.FC = () => {
  const { auditLogs } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const filteredLogs = auditLogs.filter(log => {
    if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        log.recordId.toLowerCase().includes(q) ||
        log.userName.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">System Audit & Governance Logs</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-800 font-mono">
              Immutable Operations Ledger
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Chronological audit trail recording all status transitions, approvals, partner dispatches, and financial settlements.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search audit trail by Record ID (e.g. SHB1006), User, or Details..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
          />
        </div>

        <select
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
          className="text-xs p-2 border border-slate-300 rounded-lg bg-white font-medium text-slate-700"
        >
          <option value="ALL">All Logged Actions</option>
          <option value="CREATE_BOOKING">Booking Creation</option>
          <option value="APPROVE_BOOKING">Booking Approval</option>
          <option value="REJECT_BOOKING">Booking Rejection</option>
          <option value="STATUS_CHANGE">Status Transition</option>
          <option value="ASSIGN_PICKUP">Pickup Assignment</option>
          <option value="ASSIGN_DELIVERY">Delivery Assignment</option>
          <option value="RECORD_SETTLEMENT">Settlement Clearing</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold text-[10px]">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">User & Role</th>
                <th className="px-4 py-3">Action Type</th>
                <th className="px-4 py-3">Target ID</th>
                <th className="px-4 py-3">Transition Delta</th>
                <th className="px-4 py-3">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                    {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                  </td>

                  <td className="px-4 py-3 font-sans">
                    <span className="font-semibold text-slate-900 block">{log.userName}</span>
                    <span className="text-[10px] text-teal-700 font-mono font-medium">{log.userRole}</span>
                  </td>

                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                      {log.action}
                    </span>
                  </td>

                  <td className="px-4 py-3 font-bold text-slate-900">{log.recordId}</td>

                  <td className="px-4 py-3">
                    {log.previousStatus || log.newStatus ? (
                      <span className="text-slate-600">
                        {log.previousStatus || 'INIT'} → <strong className="text-slate-900">{log.newStatus}</strong>
                      </span>
                    ) : (
                      <span className="text-slate-400 italic font-sans">—</span>
                    )}
                  </td>

                  <td className="px-4 py-3 font-sans text-slate-700 max-w-md">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredLogs.length === 0 && (
            <div className="p-8 text-center text-slate-400 font-sans">No audit logs matching search.</div>
          )}
        </div>
      </div>
    </div>
  );
};

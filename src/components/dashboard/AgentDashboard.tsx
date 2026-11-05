import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import {
  Package,
  Clock,
  Truck,
  CheckCircle2,
  DollarSign,
  Plus,
  Building,
  PhoneCall,
  Wallet
} from 'lucide-react';

interface AgentDashboardProps {
  onOpenCreateBooking: () => void;
}

export const AgentDashboard: React.FC<AgentDashboardProps> = ({ onOpenCreateBooking }) => {
  const { user, visibleBookings, setSelectedBooking, agents, setCurrentView } = useApp();

  const agentProfile = agents.find(a => a.id === user.id);

  // Derived metrics for this sub-agent only
  const total = visibleBookings.length;
  const pending = visibleBookings.filter(b => b.status === 'PENDING_APPROVAL').length;
  const approved = visibleBookings.filter(b => b.status === 'APPROVED').length;
  const inTransit = visibleBookings.filter(b =>
    ['PICKUP_COMPLETED', 'HANDED_AT_ORIGIN_HUB', 'AT_ORIGIN_HUB', 'DISPATCHED_ON_THE_WAY', 'AT_TRANSHIPMENT', 'REACHED_DEST_HUB'].includes(b.status)
  ).length;
  const delivered = visibleBookings.filter(b => b.status === 'DELIVERED').length;

  const totalEarnedMargin = visibleBookings.reduce((sum, b) => sum + b.commercial.subAgentMargin, 0);
  const settledMargin = visibleBookings
    .filter(b => b.commercial.subAgentMarginSettled)
    .reduce((sum, b) => sum + b.commercial.subAgentMargin, 0);
  const pendingSettlement = totalEarnedMargin - settledMargin;

  return (
    <div className="space-y-6">
      {/* Agent Welcome Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-teal-500/20 text-teal-400 font-semibold border border-teal-500/30">
              {user.id}
            </span>
            <span className="text-xs text-slate-400">{user.city} Operational Desk</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">{user.name}</h1>
          <p className="text-xs text-slate-400 mt-1">
            Contract Margin:{' '}
            <strong className="text-white">
              {agentProfile?.commissionType === 'PERCENTAGE'
                ? `${agentProfile.commissionRate}% per consignment`
                : `₹${agentProfile?.commissionRate} fixed per shipment`}
            </strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentView('whatsapp-simulator')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
          >
            <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
            <span>Agent Desk Bot</span>
          </button>
          <button
            onClick={onOpenCreateBooking}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Consignment</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            My Consignments
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">{total}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Booked under {user.id}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Awaiting Approval
          </span>
          <div className="text-2xl font-bold font-mono text-amber-700 tabular-nums">{pending}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">In SHUDHI review queue</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Active in Transit
          </span>
          <div className="text-2xl font-bold font-mono text-cyan-700 tabular-nums">{inTransit}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">APSRTC network flow</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Total Commissions
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-700 tabular-nums">
            ₹{totalEarnedMargin.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            ₹{settledMargin.toLocaleString()} already settled
          </span>
        </div>
      </div>

      {/* Agent's Consignment Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">My Regional Consignments</h3>
            <p className="text-xs text-slate-500">Only bookings owned by {user.id} are accessible.</p>
          </div>
          <button
            onClick={() => setCurrentView('bookings')}
            className="text-xs text-teal-700 hover:text-teal-900 font-medium"
          >
            View all →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold text-[10px]">
              <tr>
                <th className="px-4 py-3">Consignment ID</th>
                <th className="px-4 py-3">Route</th>
                <th className="px-4 py-3">APSRTC Ref</th>
                <th className="px-4 py-3">Freight & Margin</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleBookings.slice(0, 8).map(b => (
                <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">{b.id}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{b.originCity} → {b.destCity}</div>
                    <div className="text-[11px] text-slate-400">To: {b.receiver.name}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-teal-700">
                    {b.apsrtcRef || <span className="text-slate-400 italic">Pending Approval</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">₹{b.commercial.totalCustomerPayable}</div>
                    <div className="text-[11px] text-emerald-600 font-medium">
                      Margin: ₹{b.commercial.subAgentMargin}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={b.status} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedBooking(b)}
                      className="px-2.5 py-1 text-xs text-teal-700 hover:text-teal-900 font-medium hover:bg-teal-50 rounded transition-colors"
                    >
                      Track
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visibleBookings.length === 0 && (
            <div className="p-8 text-center text-slate-400">
              No consignments created under {user.id} yet. Click "Create Consignment" above.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

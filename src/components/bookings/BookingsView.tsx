import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import { CITIES } from '../../constants/network';
import { BookingStatus } from '../../types';
import {
  Search,
  Filter,
  Plus,
  Download,
  Package,
  Eye,
  ExternalLink,
  MapPin,
  Truck
} from 'lucide-react';

interface BookingsViewProps {
  onOpenCreateBooking: () => void;
}

export const BookingsView: React.FC<BookingsViewProps> = ({ onOpenCreateBooking }) => {
  const { visibleBookings, setSelectedBooking, user } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');

  // Filtered list
  const filtered = useMemo(() => {
    return visibleBookings.filter(b => {
      // Search
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchId = b.id.toLowerCase().includes(q);
        const matchRef = b.apsrtcRef?.toLowerCase().includes(q);
        const matchAwb = b.awb?.toLowerCase().includes(q);
        const matchSenderMobile = b.sender.mobile.includes(q);
        const matchReceiverMobile = b.receiver.mobile.includes(q);
        const matchSenderName = b.sender.name.toLowerCase().includes(q);
        const matchReceiverName = b.receiver.name.toLowerCase().includes(q);
        const matchAgent = b.agentId.toLowerCase().includes(q);
        if (!matchId && !matchRef && !matchAwb && !matchSenderMobile && !matchReceiverMobile && !matchSenderName && !matchReceiverName && !matchAgent) {
          return false;
        }
      }

      // City
      if (cityFilter !== 'ALL' && b.originCity !== cityFilter && b.destCity !== cityFilter) {
        return false;
      }

      // Status
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'PICKUP' && !['APPROVED', 'PICKUP_INITIATED', 'OUT_FOR_PICKUP', 'PICKUP_COMPLETED', 'PICKUP_FAILED', 'HANDED_AT_ORIGIN_HUB'].includes(b.status)) return false;
        if (statusFilter === 'TRANSIT' && !['AT_ORIGIN_HUB', 'DISPATCHED_ON_THE_WAY', 'AT_TRANSHIPMENT', 'JOURNEY_RESUMED', 'REACHED_DEST_HUB', 'UNLOADED_AT_DEST_HUB'].includes(b.status)) return false;
        if (statusFilter === 'DELIVERY' && !['AT_DELIVERY_FACILITY', 'DELIVERY_INITIATED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'DELIVERY_FAILED'].includes(b.status)) return false;
        if (statusFilter === 'EXCEPTION' && !['EXCEPTION', 'PICKUP_FAILED', 'DELIVERY_FAILED', 'REJECTED'].includes(b.status)) return false;
        if (statusFilter === 'PENDING' && b.status !== 'PENDING_APPROVAL') return false;
      }

      // Source
      if (sourceFilter !== 'ALL' && b.source !== sourceFilter) {
        return false;
      }

      return true;
    });
  }, [visibleBookings, searchTerm, cityFilter, statusFilter, sourceFilter]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Booking ID', 'Date', 'Source', 'Agent ID', 'Origin', 'Destination', 'Sender Name', 'Sender Mobile', 'Receiver Name', 'Receiver Mobile', 'Package Type', 'Weight (kg)', 'APSRTC Ref', 'AWB', 'Freight (INR)', 'Payment Mode', 'Status'];
    const rows = filtered.map(b => [
      b.id,
      b.date,
      b.source,
      b.agentId,
      b.originCity,
      b.destCity,
      `"${b.sender.name}"`,
      b.sender.mobile,
      `"${b.receiver.name}"`,
      b.receiver.mobile,
      b.shipment.type,
      b.shipment.weightKg,
      b.apsrtcRef || 'N/A',
      b.awb || 'N/A',
      b.commercial.totalCustomerPayable,
      b.commercial.paymentMode,
      b.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `shudhi_bookings_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Consignment Bookings</h1>
          <p className="text-xs text-slate-500">
            {user.role === 'SHUDHI_ADMIN'
              ? 'Complete multi-city logistics master registry.'
              : `Consignments accessible to ${user.name}.`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onOpenCreateBooking}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Booking</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by ID, APSRTC Ref, AWB, Mobile, or Consignee..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        {/* City Filter */}
        <div className="flex items-center gap-2">
          <select
            value={cityFilter}
            onChange={e => setCityFilter(e.target.value)}
            className="text-xs p-2 border border-slate-300 rounded-lg bg-white text-slate-700 font-medium"
          >
            <option value="ALL">All Hubs</option>
            {CITIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Status Group Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs p-2 border border-slate-300 rounded-lg bg-white text-slate-700 font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Review</option>
            <option value="PICKUP">First-Mile Pickups</option>
            <option value="TRANSIT">Mid-Mile Transit</option>
            <option value="DELIVERY">Last-Mile Delivery</option>
            <option value="EXCEPTION">Exceptions & Issues</option>
          </select>

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={e => setSourceFilter(e.target.value)}
            className="text-xs p-2 border border-slate-300 rounded-lg bg-white text-slate-700 font-medium"
          >
            <option value="ALL">All Channels</option>
            <option value="ADMIN_DIRECT">Admin Direct</option>
            <option value="SUB_AGENT">Sub-Agent Desks</option>
            <option value="CUSTOMER_WHATSAPP">WhatsApp</option>
            <option value="CUSTOMER_PORTAL">Web Portal</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold text-[10px]">
              <tr>
                <th className="px-4 py-3">Consignment ID & Date</th>
                <th className="px-4 py-3">Route & Hubs</th>
                <th className="px-4 py-3">Sender & Receiver</th>
                <th className="px-4 py-3">Transporter (APSRTC / AWB)</th>
                <th className="px-4 py-3">Freight & Payment</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(b => (
                <tr
                  key={b.id}
                  onClick={() => setSelectedBooking(b)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3.5">
                    <span className="font-mono font-bold text-slate-900 block">{b.id}</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {b.date} · {b.agentId}
                    </span>
                  </td>

                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <span>{b.originCity}</span>
                      <span className="text-slate-400">→</span>
                      <span>{b.destCity}</span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {b.shipment.pieces}x {b.shipment.type} ({b.shipment.weightKg}kg)
                    </span>
                  </td>

                  <td className="px-4 py-3.5">
                    <div className="font-medium text-slate-800">{b.sender.name}</div>
                    <div className="text-[11px] text-slate-500">To: {b.receiver.name} ({b.receiver.mobile})</div>
                  </td>

                  <td className="px-4 py-3.5 font-mono">
                    {b.apsrtcRef ? (
                      <div>
                        <span className="text-teal-700 font-semibold block">{b.apsrtcRef}</span>
                        <span className="text-[10px] text-slate-400">{b.awb || 'No AWB'}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Pending Transporter</span>
                    )}
                  </td>

                  <td className="px-4 py-3.5">
                    <div className="font-bold text-slate-900 font-mono">
                      ₹{b.commercial.totalCustomerPayable}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {b.commercial.paymentMode} ({b.commercial.collectionStatus})
                    </div>
                  </td>

                  <td className="px-4 py-3.5">
                    <StatusBadge status={b.status} size="sm" />
                  </td>

                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBooking(b);
                      }}
                      className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-slate-100 rounded transition-colors"
                      title="Open full timeline drawer"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="p-12 text-center text-slate-400">
              <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <span>No consignments found matching your filter criteria.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

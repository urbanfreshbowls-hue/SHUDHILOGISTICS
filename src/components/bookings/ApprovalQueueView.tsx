import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Package,
  MapPin,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  User,
  Phone
} from 'lucide-react';

export const ApprovalQueueView: React.FC = () => {
  const { bookings, approveBooking, rejectBooking, setSelectedBooking } = useApp();

  const [customRefInput, setCustomRefInput] = useState<{ [id: string]: string }>({});
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  const pendingBookings = bookings.filter(b => b.status === 'PENDING_APPROVAL');

  const handleApprove = (bookingId: string) => {
    const customRef = customRefInput[bookingId];
    approveBooking(bookingId, customRef);
  };

  const handleConfirmReject = () => {
    if (!rejectingId || !rejectReason.trim()) return;
    rejectBooking(rejectingId, rejectReason);
    setRejectingId(null);
    setRejectReason('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Booking Approval Queue</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 font-mono">
              {pendingBookings.length} Pending
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Review and authorize inbound booking requests from Sub-Agents and Customer channels prior to ground dispatch.
          </p>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pendingBookings.map(booking => (
          <div
            key={booking.id}
            className="bg-white rounded-xl border-2 border-amber-200 shadow-xs p-5 space-y-4 hover:border-amber-400 transition-colors"
          >
            {/* Card Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900 text-sm">{booking.id}</span>
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {booking.source.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Requested by Agent: <strong className="text-slate-700">{booking.agentId}</strong> · Date: {booking.date}
                </p>
              </div>
              <StatusBadge status={booking.status} size="sm" />
            </div>

            {/* Route & Consignment Info */}
            <div className="bg-slate-50 rounded-lg p-3 text-xs space-y-2">
              <div className="flex items-center justify-between font-semibold text-slate-800">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-teal-600" />
                  <span>{booking.originCity}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{booking.destCity}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1 border-t border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 block">Sender</span>
                  <span className="font-medium text-slate-900">{booking.sender.name}</span>
                  <span className="text-[11px] text-slate-500 block">{booking.sender.mobile}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Receiver</span>
                  <span className="font-medium text-slate-900">{booking.receiver.name}</span>
                  <span className="text-[11px] text-slate-500 block">{booking.receiver.mobile}</span>
                </div>
              </div>

              <div className="pt-1 text-slate-600 flex items-center justify-between">
                <span>
                  Cargo: <strong>{booking.shipment.pieces}x {booking.shipment.type}</strong> ({booking.shipment.weightKg}kg)
                </span>
                <span className="font-mono font-bold text-slate-900">
                  Freight: ₹{booking.commercial.totalCustomerPayable}
                </span>
              </div>
            </div>

            {/* Optional Transporter Reference Overwrite */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-500 block font-medium">
                APSRTC Reference (Optional custom ref; defaults to auto-generated)
              </label>
              <input
                type="text"
                placeholder={`e.g. APS-${booking.originCity.slice(0, 3)}-${booking.id}`}
                value={customRefInput[booking.id] || ''}
                onChange={e => setCustomRefInput({ ...customRefInput, [booking.id]: e.target.value })}
                className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded font-mono focus:ring-1 focus:ring-teal-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedBooking(booking)}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Inspect Full Detail
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setRejectingId(booking.id);
                    setRejectReason('Unserviceable remote address / undeclared hazardous goods');
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleApprove(booking.id)}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Authorize & Approve</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {pendingBookings.length === 0 && (
          <div className="col-span-full bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h3 className="font-bold text-slate-800 text-sm">Review Queue Empty</h3>
            <p className="text-xs text-slate-500 mt-1">
              All sub-agent and customer booking requests have been processed.
            </p>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-semibold text-rose-800 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Reject Consignment ({rejectingId})
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              <label className="block font-medium text-slate-700">Specify Justification Reason *</label>
              <textarea
                rows={3}
                required
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Reason for rejection (e.g. Prohibited chemicals, delivery area out of bounds, customer requested cancellation)..."
                className="w-full p-2.5 border border-slate-300 rounded focus:ring-1 focus:ring-rose-500 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectingId(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

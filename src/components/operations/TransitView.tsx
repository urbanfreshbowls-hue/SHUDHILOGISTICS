import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import { CITY_HUBS } from '../../constants/network';
import {
  Truck,
  Search,
  Building,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export const TransitView: React.FC = () => {
  const { visibleBookings, transitionStatus, setSelectedBooking, user } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [apsrtcRefInput, setApsrtcRefInput] = useState('');
  const [awbInput, setAwbInput] = useState('');

  const transitStatuses = [
    'HANDED_AT_ORIGIN_HUB',
    'AT_ORIGIN_HUB',
    'DISPATCHED_ON_THE_WAY',
    'AT_TRANSHIPMENT',
    'JOURNEY_RESUMED',
    'REACHED_DEST_HUB',
    'UNLOADED_AT_DEST_HUB'
  ];

  const transitBookings = useMemo(() => {
    return visibleBookings.filter(b => {
      const matchStatus = transitStatuses.includes(b.status);
      if (!matchStatus) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          b.id.toLowerCase().includes(q) ||
          b.apsrtcRef?.toLowerCase().includes(q) ||
          b.awb?.toLowerCase().includes(q) ||
          b.originCity.toLowerCase().includes(q) ||
          b.destCity.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [visibleBookings, searchTerm]);

  const handleSaveRefs = (bId: string) => {
    const booking = visibleBookings.find(b => b.id === bId);
    if (!booking) return;
    booking.apsrtcRef = apsrtcRefInput.trim() || booking.apsrtcRef;
    booking.awb = awbInput.trim() || booking.awb;
    setEditingBookingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">APSRTC Mid-Mile Transit Operations</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-cyan-100 text-cyan-900 font-mono">
              {transitBookings.length} Active in Transit
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Real-time intercity transporter tracking across APSRTC bus depot network.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-md font-medium flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            Transporter Layer: APSRTC Express Simulator
          </span>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Booking ID, APSRTC Ref, AWB, or City..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Grid of Transit Consignments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {transitBookings.map(booking => {
          return (
            <div
              key={booking.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4 hover:border-slate-300 transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 text-sm">{booking.id}</span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-teal-50 text-teal-700 font-semibold border border-teal-200">
                      {booking.apsrtcRef || 'Awaiting APSRTC Ref'}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 block mt-0.5">
                    AWB: <strong className="font-mono text-slate-700">{booking.awb || 'N/A'}</strong> · Agent: {booking.agentId}
                  </span>
                </div>
                <StatusBadge status={booking.status} size="sm" />
              </div>

              {/* Intercity Transit Route Diagram */}
              <div className="bg-slate-50 rounded-lg p-3 text-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">Origin Hub</span>
                  <span className="font-bold text-slate-900">{booking.originCity}</span>
                  <p className="text-[11px] text-slate-500">{CITY_HUBS[booking.originCity]?.name}</p>
                </div>

                <div className="flex flex-col items-center px-4">
                  <Truck className="w-5 h-5 text-teal-600 mb-0.5" />
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">Destination Hub</span>
                  <span className="font-bold text-slate-900">{booking.destCity}</span>
                  <p className="text-[11px] text-slate-500">{CITY_HUBS[booking.destCity]?.name}</p>
                </div>
              </div>

              {/* Transit Specs & Transporter Freight */}
              <div className="grid grid-cols-3 gap-2 text-xs border border-slate-100 p-2.5 rounded bg-white">
                <div>
                  <span className="text-[10px] text-slate-400 block">Package Details</span>
                  <span className="font-medium text-slate-800">
                    {booking.shipment.pieces}x {booking.shipment.type} ({booking.shipment.weightKg}kg)
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">APSRTC Transporter Fee</span>
                  <span className="font-mono font-bold text-slate-900">
                    ₹{booking.commercial.apsrtcFreight}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Transporter Fee Status</span>
                  <span className={`font-semibold ${booking.commercial.apsrtcPaymentStatus === 'PAID' ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {booking.commercial.apsrtcPaymentStatus}
                  </span>
                </div>
              </div>

              {/* Edit Transporter References Popover */}
              {editingBookingId === booking.id ? (
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg space-y-2 text-xs">
                  <div className="font-semibold text-teal-900">Update APSRTC Consignment Reference & AWB</div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="APSRTC Ref"
                      value={apsrtcRefInput}
                      onChange={e => setApsrtcRefInput(e.target.value)}
                      className="p-1.5 border border-teal-300 rounded bg-white font-mono"
                    />
                    <input
                      type="text"
                      placeholder="AWB / Consignment No"
                      value={awbInput}
                      onChange={e => setAwbInput(e.target.value)}
                      className="p-1.5 border border-teal-300 rounded bg-white font-mono"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button onClick={() => setEditingBookingId(null)} className="px-2.5 py-1 text-slate-600">
                      Cancel
                    </button>
                    <button onClick={() => handleSaveRefs(booking.id)} className="px-3 py-1 bg-teal-600 text-white rounded font-medium">
                      Save Transporter Log
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <button
                    onClick={() => {
                      setEditingBookingId(booking.id);
                      setApsrtcRefInput(booking.apsrtcRef || '');
                      setAwbInput(booking.awb || '');
                    }}
                    className="text-teal-700 hover:text-teal-900 font-medium"
                  >
                    Edit Transporter Ref / AWB →
                  </button>
                  <span>Simulated APSRTC Fleet</span>
                </div>
              )}

              {/* Transit Milestone Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setSelectedBooking(booking)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  View Details
                </button>

                <div className="flex items-center gap-2">
                  {booking.status === 'HANDED_AT_ORIGIN_HUB' && (
                    <button
                      onClick={() => transitionStatus(booking.id, 'AT_ORIGIN_HUB', `Acknowledged at ${booking.originCity} Origin Hub.`)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
                    >
                      Confirm at Origin Hub
                    </button>
                  )}

                  {booking.status === 'AT_ORIGIN_HUB' && (
                    <button
                      onClick={() => transitionStatus(booking.id, 'DISPATCHED_ON_THE_WAY', `Loaded on scheduled APSRTC bus: ${booking.originCity} → ${booking.destCity}.`)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg shadow-xs"
                    >
                      Dispatch on Bus (In Transit)
                    </button>
                  )}

                  {booking.status === 'DISPATCHED_ON_THE_WAY' && (
                    <>
                      <button
                        onClick={() => transitionStatus(booking.id, 'AT_TRANSHIPMENT', 'Consignment at intermediate transit point.')}
                        className="px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-300 rounded"
                      >
                        Log Transhipment
                      </button>
                      <button
                        onClick={() => transitionStatus(booking.id, 'REACHED_DEST_HUB', `Bus arrived at ${booking.destCity} Destination Depot.`)}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                      >
                        Arrived at Dest. Hub
                      </button>
                    </>
                  )}

                  {booking.status === 'AT_TRANSHIPMENT' && (
                    <button
                      onClick={() => transitionStatus(booking.id, 'JOURNEY_RESUMED', 'Transhipment completed, re-embarked on bus.')}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs"
                    >
                      Resume Journey
                    </button>
                  )}

                  {booking.status === 'JOURNEY_RESUMED' && (
                    <button
                      onClick={() => transitionStatus(booking.id, 'REACHED_DEST_HUB', `Bus arrived at ${booking.destCity} Destination Depot.`)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                    >
                      Arrived at Dest. Hub
                    </button>
                  )}

                  {booking.status === 'REACHED_DEST_HUB' && (
                    <button
                      onClick={() => transitionStatus(booking.id, 'UNLOADED_AT_DEST_HUB', `Package unloaded from bus at ${booking.destCity} hub cargo office.`)}
                      className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
                    >
                      Unload into Cargo Office
                    </button>
                  )}

                  {booking.status === 'UNLOADED_AT_DEST_HUB' && (
                    <button
                      onClick={() => transitionStatus(booking.id, 'AT_DELIVERY_FACILITY', 'Moved to delivery sorting facility.')}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                    >
                      Transfer to Delivery Facility
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {transitBookings.length === 0 && (
          <div className="col-span-full bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
            <Truck className="w-10 h-10 text-cyan-500 mx-auto mb-2" />
            <h3 className="font-bold text-slate-800 text-sm">No Shipments Currently In Transit</h3>
            <p className="text-xs text-slate-500 mt-1">All dispatched consignments have arrived or been delivered.</p>
          </div>
        )}
      </div>
    </div>
  );
};

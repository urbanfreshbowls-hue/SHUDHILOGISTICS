import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import { Search, Package, MapPin, Truck, CheckCircle, ArrowRight, PhoneCall } from 'lucide-react';

interface CustomerPortalProps {
  onOpenCreateBooking: () => void;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({ onOpenCreateBooking }) => {
  const { bookings, setSelectedBooking, setCurrentView } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedBooking, setSearchedBooking] = useState<any | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setHasSearched(true);
    const q = searchQuery.trim().toUpperCase();
    const found = bookings.find(b =>
      b.id.toUpperCase() === q ||
      (b.apsrtcRef && b.apsrtcRef.toUpperCase() === q) ||
      (b.awb && b.awb.toUpperCase() === q) ||
      b.sender.mobile.includes(q) ||
      b.receiver.mobile.includes(q)
    );
    setSearchedBooking(found || null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Customer Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-8 shadow-md relative overflow-hidden">
        <div className="max-w-xl space-y-4">
          <span className="text-xs uppercase font-bold text-teal-400 tracking-wider">
            Customer Self-Service Hub
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Track Consignment or Request Parcel Pickup
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Reliable express courier service across Visakhapatnam, Rajamahendravaram, Vijayawada, and Hyderabad via APSRTC Logistics.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={onOpenCreateBooking}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              Book Door Pickup
            </button>
            <button
              onClick={() => setCurrentView('whatsapp-simulator')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <PhoneCall className="w-4 h-4 text-emerald-400" />
              <span>Track via WhatsApp</span>
            </button>
          </div>
        </div>
      </div>

      {/* Instant Tracking Box */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Search className="w-5 h-5 text-teal-600" />
          Track Any Shipment
        </h2>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Enter SHUDHI Booking ID (e.g. SHB1001), APSRTC Ref, or Mobile Number..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full text-sm px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors shrink-0"
          >
            Track Shipment
          </button>
        </form>

        {/* Search Results Display */}
        {hasSearched && (
          <div className="pt-4 border-t border-slate-100">
            {searchedBooking ? (
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-base text-slate-900">{searchedBooking.id}</span>
                    <StatusBadge status={searchedBooking.status} size="sm" />
                  </div>
                  <button
                    onClick={() => setSelectedBooking(searchedBooking)}
                    className="text-xs text-teal-700 hover:text-teal-900 font-semibold"
                  >
                    View Complete Timeline →
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Origin</span>
                    <span className="font-semibold text-slate-800">{searchedBooking.originCity}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Destination</span>
                    <span className="font-semibold text-slate-800">{searchedBooking.destCity}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">APSRTC Reference</span>
                    <span className="font-mono text-teal-700 font-semibold">
                      {searchedBooking.apsrtcRef || 'Generating'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Consignment</span>
                    <span className="font-semibold text-slate-800">
                      {searchedBooking.shipment.pieces}x {searchedBooking.shipment.type} ({searchedBooking.shipment.weightKg}kg)
                    </span>
                  </div>
                </div>

                {searchedBooking.status === 'DELIVERED' && (
                  <div className="p-3 bg-emerald-50 text-emerald-900 rounded-lg text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Consignment successfully delivered with verified photographic proof of delivery.</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400 text-xs">
                No active shipment found matching "{searchQuery}". Please check your 7-character booking ID.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Suggested demo tracking IDs */}
      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
        <span>Try sample IDs:</span>
        {['SHB1001', 'SHB1006', 'SHB1015', 'SHB1020', 'SHB1038'].map(id => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setSearchQuery(id);
              setHasSearched(true);
              const found = bookings.find(b => b.id === id);
              setSearchedBooking(found || null);
            }}
            className="font-mono text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2 py-0.5 rounded transition-colors"
          >
            {id}
          </button>
        ))}
      </div>
    </div>
  );
};

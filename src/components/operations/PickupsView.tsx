import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import { CITY_HUBS } from '../../constants/network';
import {
  MapPin,
  Camera,
  ExternalLink,
  Phone,
  UserCheck,
  Building2,
  AlertTriangle,
  Send,
  CheckCircle,
  Truck
} from 'lucide-react';

export const PickupsView: React.FC = () => {
  const {
    visibleBookings,
    partners,
    assignPickupPartner,
    transitionStatus,
    openPhotoModal,
    reportFailure,
    setSelectedBooking,
    user
  } = useApp();

  const [failureId, setFailureId] = useState<string | null>(null);
  const [failureReason, setFailureReason] = useState<string>('Customer Unavailable');

  const pickupStatuses = [
    'APPROVED',
    'PICKUP_INITIATED',
    'OUT_FOR_PICKUP',
    'PICKUP_COMPLETED',
    'PICKUP_FAILED'
  ];

  const pickupList = visibleBookings.filter(b => pickupStatuses.includes(b.status));

  const getGoogleMapsUrl = (address: string, city: string) => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address}, ${city}, India`)}`;
  };

  const handleFailureSubmit = () => {
    if (!failureId) return;
    reportFailure(failureId, 'PICKUP', failureReason);
    setFailureId(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">First-Mile Pickup Operations</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-900 font-mono">
              {pickupList.length} Consignments
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Ground dispatch, partner assignment, photograph proof verification, and origin APSRTC Hub handover.
          </p>
        </div>
      </div>

      {/* Grid of Pickup Consignments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pickupList.map(booking => {
          const originPartners = partners.filter(p => p.city === booking.originCity && p.status === 'Active');
          const currentPartner = partners.find(p => p.id === booking.assignedPickupPartnerId);

          return (
            <div
              key={booking.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4 hover:border-slate-300 transition-all"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 text-sm">{booking.id}</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Ref: {booking.apsrtcRef || 'Pending Ref'}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 block mt-0.5">
                    Hub: <strong>{booking.originCity}</strong> → Destination: {booking.destCity}
                  </span>
                </div>
                <StatusBadge status={booking.status} size="sm" />
              </div>

              {/* Pickup Address & Contact */}
              <div className="bg-slate-50 rounded-lg p-3 text-xs space-y-2">
                <div className="flex items-center justify-between font-semibold text-slate-900">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-purple-600" />
                    {booking.sender.name}
                  </span>
                  <a
                    href={`tel:${booking.sender.mobile}`}
                    className="text-teal-700 hover:text-teal-900 inline-flex items-center gap-1 font-mono"
                  >
                    <Phone className="w-3 h-3" /> {booking.sender.mobile}
                  </a>
                </div>

                <p className="text-slate-600">{booking.sender.address}, {booking.originCity} - {booking.sender.pincode}</p>

                <div className="pt-2 flex items-center justify-between border-t border-slate-200">
                  <span className="text-slate-500">
                    Cargo: <strong>{booking.shipment.pieces}x {booking.shipment.type}</strong> ({booking.shipment.weightKg}kg)
                  </span>
                  <a
                    href={getGoogleMapsUrl(booking.sender.address, booking.originCity)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700"
                  >
                    Open Google Maps <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Assigned partner display */}
                {currentPartner && (
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Assigned Ground Partner:</span>
                    <span className="font-semibold text-purple-900">
                      {currentPartner.name} ({currentPartner.phone})
                    </span>
                  </div>
                )}
              </div>

              {/* Pickup Proof Preview (if completed) */}
              {booking.pickupProof && (
                <div className="p-3 bg-teal-50/50 rounded-lg border border-teal-200 flex items-center gap-3">
                  <img
                    src={booking.pickupProof.photoUrl}
                    alt="Proof of pickup"
                    className="w-14 h-14 object-cover rounded-md border border-teal-300"
                  />
                  <div className="text-xs text-teal-950">
                    <span className="font-bold flex items-center gap-1 text-teal-800">
                      <CheckCircle className="w-3.5 h-3.5 text-teal-600" /> Verified Pickup Proof
                    </span>
                    <p className="text-[11px] text-teal-700 mt-0.5">
                      Captured by {booking.pickupProof.capturedBy}
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setSelectedBooking(booking)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Inspect Timeline
                </button>

                <div className="flex items-center gap-2">
                  {/* Step 1: Assign Partner */}
                  {booking.status === 'APPROVED' && (
                    <div className="flex items-center gap-1.5">
                      <select
                        onChange={e => {
                          if (e.target.value) assignPickupPartner(booking.id, e.target.value);
                        }}
                        defaultValue=""
                        className="text-xs p-1.5 border border-slate-300 rounded bg-white"
                      >
                        <option value="" disabled>Select Local Partner...</option>
                        {originPartners.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                        ))}
                      </select>
                      <button
                        onClick={() => transitionStatus(booking.id, 'PICKUP_INITIATED', 'Self-assigned to hub staff.')}
                        className="px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 rounded"
                      >
                        Self Assign
                      </button>
                    </div>
                  )}

                  {/* Step 2: Mark Out for Pickup */}
                  {booking.status === 'PICKUP_INITIATED' && (
                    <button
                      onClick={() => transitionStatus(booking.id, 'OUT_FOR_PICKUP', 'Ground rider departed to customer premises.')}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs"
                    >
                      Depart (Out for Pickup)
                    </button>
                  )}

                  {/* Step 3: Complete or Fail Pickup */}
                  {booking.status === 'OUT_FOR_PICKUP' && (
                    <>
                      <button
                        onClick={() => setFailureId(booking.id)}
                        className="px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 border border-rose-200 rounded"
                      >
                        Pickup Failed
                      </button>
                      <button
                        onClick={() => openPhotoModal(booking.id, 'PICKUP', 'Upload Proof of Pickup', (photoUrl, notes) => {
                          transitionStatus(booking.id, 'PICKUP_COMPLETED', notes, {
                            photoUrl,
                            pickupProof: { photoUrl, capturedAt: new Date().toISOString(), capturedBy: user.name, notes }
                          });
                        })}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs"
                      >
                        <Camera className="w-3.5 h-3.5" /> Complete with Photo
                      </button>
                    </>
                  )}

                  {/* Step 4: Hand over to Origin APSRTC Hub */}
                  {booking.status === 'PICKUP_COMPLETED' && (
                    <button
                      onClick={() => transitionStatus(booking.id, 'HANDED_AT_ORIGIN_HUB', `Package physically delivered at ${booking.originCity} Origin Hub.`)}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                    >
                      <Building2 className="w-3.5 h-3.5" /> Hand Over to Origin HUB
                    </button>
                  )}

                  {booking.status === 'PICKUP_FAILED' && (
                    <button
                      onClick={() => transitionStatus(booking.id, 'PICKUP_INITIATED', 'Pickup re-initiated.')}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-300 rounded"
                    >
                      Re-Initiate Pickup
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {pickupList.length === 0 && (
          <div className="col-span-full bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h3 className="font-bold text-slate-800 text-sm">No Active Pickups Pending</h3>
            <p className="text-xs text-slate-500 mt-1">All approved consignments have been handed over to origin hubs.</p>
          </div>
        )}
      </div>

      {/* Failure reason modal */}
      {failureId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Report Pickup Failure ({failureId})
            </h3>

            <div className="space-y-1.5 text-xs">
              <label className="block font-medium text-slate-700">Select Failure Reason *</label>
              <select
                value={failureReason}
                onChange={e => setFailureReason(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded"
              >
                <option value="Customer Unavailable / Premises Locked">Customer Unavailable / Premises Locked</option>
                <option value="Incorrect Address / Inaccessible Location">Incorrect Address / Inaccessible Location</option>
                <option value="Package Not Ready / Delayed by Shipper">Package Not Ready / Delayed by Shipper</option>
                <option value="Customer Refused Dispatch / Cancelled">Customer Refused Dispatch / Cancelled</option>
                <option value="Improper Packaging / Leaking Contents">Improper Packaging / Leaking Contents</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setFailureId(null)} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded">
                Cancel
              </button>
              <button onClick={handleFailureSubmit} className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded">
                Confirm Failure
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

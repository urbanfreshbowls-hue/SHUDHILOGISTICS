import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import { CITY_HUBS } from '../../constants/network';
import {
  Building2,
  Camera,
  ExternalLink,
  Phone,
  Truck,
  CheckCircle,
  AlertTriangle,
  MapPin,
  DollarSign
} from 'lucide-react';

export const DeliveriesView: React.FC = () => {
  const {
    visibleBookings,
    partners,
    assignDeliveryPartner,
    transitionStatus,
    openPhotoModal,
    reportFailure,
    setSelectedBooking,
    user
  } = useApp();

  const [failureId, setFailureId] = useState<string | null>(null);
  const [failureReason, setFailureReason] = useState<string>('Consignee Unavailable / Phone Switched Off');

  const deliveryStatuses = [
    'UNLOADED_AT_DEST_HUB',
    'AT_DELIVERY_FACILITY',
    'DELIVERY_INITIATED',
    'OUT_FOR_DELIVERY',
    'DELIVERY_FAILED'
  ];

  const deliveryList = visibleBookings.filter(b => deliveryStatuses.includes(b.status));

  const getGoogleMapsUrl = (address: string, city: string) => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address}, ${city}, India`)}`;
  };

  const handleFailureSubmit = () => {
    if (!failureId) return;
    reportFailure(failureId, 'DELIVERY', failureReason);
    setFailureId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Last-Mile Delivery Operations</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-900 font-mono">
              {deliveryList.length} Active Deliveries
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Destination hub sorting, delivery rider assignment, COD cash collection, and photographic POD verification.
          </p>
        </div>
      </div>

      {/* Grid of Delivery Consignments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {deliveryList.map(booking => {
          const destPartners = partners.filter(p => p.city === booking.destCity && p.status === 'Active');
          const currentPartner = partners.find(p => p.id === booking.assignedDeliveryPartnerId);
          const isCod = booking.commercial.paymentMode === 'TO_PAY_COD';
          const codAmount = isCod ? booking.commercial.totalCustomerPayable : 0;

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
                    <span className="text-[11px] text-slate-400 font-mono">
                      Ref: {booking.apsrtcRef || 'N/A'}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 block mt-0.5">
                    Destination Hub: <strong>{booking.destCity}</strong> · Dispatch from {booking.originCity}
                  </span>
                </div>
                <StatusBadge status={booking.status} size="sm" />
              </div>

              {/* Consignee Address & Details */}
              <div className="bg-slate-50 rounded-lg p-3 text-xs space-y-2">
                <div className="flex items-center justify-between font-semibold text-slate-900">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                    {booking.receiver.name}
                  </span>
                  <a
                    href={`tel:${booking.receiver.mobile}`}
                    className="text-teal-700 hover:text-teal-900 inline-flex items-center gap-1 font-mono"
                  >
                    <Phone className="w-3 h-3" /> {booking.receiver.mobile}
                  </a>
                </div>

                <p className="text-slate-600">{booking.receiver.address}, {booking.destCity} - {booking.receiver.pincode}</p>

                <div className="pt-2 flex items-center justify-between border-t border-slate-200">
                  <span className="text-slate-500">
                    Cargo: <strong>{booking.shipment.pieces}x {booking.shipment.type}</strong> ({booking.shipment.weightKg}kg)
                  </span>
                  <a
                    href={getGoogleMapsUrl(booking.receiver.address, booking.destCity)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    Open Google Maps <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* COD Cash Collection Notice */}
                {codAmount > 0 && (
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded text-amber-900 font-semibold flex items-center justify-between text-xs mt-1">
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-amber-600" /> Collect Cash on Delivery (COD):
                    </span>
                    <span className="font-mono text-sm font-bold">₹{codAmount}</span>
                  </div>
                )}

                {/* Assigned partner info */}
                {currentPartner && (
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Assigned Delivery Rider:</span>
                    <span className="font-semibold text-indigo-900">
                      {currentPartner.name} ({currentPartner.phone})
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setSelectedBooking(booking)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Inspect Full Detail
                </button>

                <div className="flex items-center gap-2">
                  {/* Step 1: Move to facility */}
                  {booking.status === 'UNLOADED_AT_DEST_HUB' && (
                    <button
                      onClick={() => transitionStatus(booking.id, 'AT_DELIVERY_FACILITY', `Consignment checked into ${booking.destCity} door-delivery sorting bay.`)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
                    >
                      Receive at Sorting Facility
                    </button>
                  )}

                  {/* Step 2: Assign Partner */}
                  {booking.status === 'AT_DELIVERY_FACILITY' && (
                    <div className="flex items-center gap-1.5">
                      <select
                        onChange={e => {
                          if (e.target.value) assignDeliveryPartner(booking.id, e.target.value);
                        }}
                        defaultValue=""
                        className="text-xs p-1.5 border border-slate-300 rounded bg-white"
                      >
                        <option value="" disabled>Select Delivery Rider...</option>
                        {destPartners.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                        ))}
                      </select>
                      <button
                        onClick={() => transitionStatus(booking.id, 'DELIVERY_INITIATED', 'Self-assigned to delivery fleet.')}
                        className="px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 rounded"
                      >
                        Self Assign
                      </button>
                    </div>
                  )}

                  {/* Step 3: Out for Delivery */}
                  {booking.status === 'DELIVERY_INITIATED' && (
                    <button
                      onClick={() => transitionStatus(booking.id, 'OUT_FOR_DELIVERY', 'Rider departed for recipient doorstep.')}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs"
                    >
                      Depart (Out for Delivery)
                    </button>
                  )}

                  {/* Step 4: Deliver with POD Photo or Fail */}
                  {booking.status === 'OUT_FOR_DELIVERY' && (
                    <>
                      <button
                        onClick={() => setFailureId(booking.id)}
                        className="px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 border border-rose-200 rounded"
                      >
                        Delivery Failed
                      </button>
                      <button
                        onClick={() => openPhotoModal(booking.id, 'DELIVERY', 'Upload Proof of Delivery (POD)', (photoUrl, notes, recipient) => {
                          transitionStatus(booking.id, 'DELIVERED', notes, {
                            photoUrl,
                            deliveryProof: { photoUrl, recipientName: recipient || booking.receiver.name, deliveredAt: new Date().toISOString(), deliveredBy: user.name, notes }
                          });
                        })}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
                      >
                        <Camera className="w-3.5 h-3.5" /> Upload POD & Deliver
                      </button>
                    </>
                  )}

                  {booking.status === 'DELIVERY_FAILED' && (
                    <button
                      onClick={() => transitionStatus(booking.id, 'DELIVERY_INITIATED', 'Delivery re-attempt scheduled.')}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-300 rounded"
                    >
                      Re-Schedule Delivery
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {deliveryList.length === 0 && (
          <div className="col-span-full bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h3 className="font-bold text-slate-800 text-sm">No Pending Deliveries</h3>
            <p className="text-xs text-slate-500 mt-1">All arrived shipments have been successfully handed over to consignees.</p>
          </div>
        )}
      </div>

      {/* Failure reason modal */}
      {failureId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Report Delivery Failure ({failureId})
            </h3>

            <div className="space-y-1.5 text-xs">
              <label className="block font-medium text-slate-700">Select Mandatory Reason *</label>
              <select
                value={failureReason}
                onChange={e => setFailureReason(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded"
              >
                <option value="Consignee Unavailable / Phone Switched Off">Consignee Unavailable / Phone Switched Off</option>
                <option value="Customer Refused Delivery / COD Refused">Customer Refused Delivery / COD Refused</option>
                <option value="Incorrect Address / Address Incomplete">Incorrect Address / Address Incomplete</option>
                <option value="Customer Rescheduled for Tomorrow">Customer Rescheduled for Tomorrow</option>
                <option value="Premises Inaccessible / Gate Closed">Premises Inaccessible / Gate Closed</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setFailureId(null)} className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded">
                Cancel
              </button>
              <button onClick={handleFailureSubmit} className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded">
                Confirm Failure Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

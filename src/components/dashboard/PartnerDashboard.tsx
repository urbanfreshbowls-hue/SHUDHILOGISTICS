import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Booking } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import {
  Bike,
  MapPin,
  ExternalLink,
  Phone,
  Camera,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  Package,
  DollarSign,
  Check,
  X
} from 'lucide-react';

export const PartnerDashboard: React.FC = () => {
  const {
    user,
    visibleBookings,
    transitionStatus,
    openPhotoModal,
    reportFailure,
    setSelectedBooking,
    partners
  } = useApp();

  const [failureBookingId, setFailureBookingId] = useState<string | null>(null);
  const [failureReason, setFailureReason] = useState<string>('Customer Unavailable');
  const [failureStage, setFailureStage] = useState<'PICKUP' | 'DELIVERY'>('PICKUP');

  const partnerProfile = partners.find(p => p.id === user.id);

  // Filter tasks assigned to this partner
  const pendingTasks = visibleBookings.filter(b =>
    ['PICKUP_INITIATED', 'OUT_FOR_PICKUP', 'DELIVERY_INITIATED', 'OUT_FOR_DELIVERY'].includes(b.status)
  );

  const completedTasks = visibleBookings.filter(b =>
    ['PICKUP_COMPLETED', 'HANDED_AT_ORIGIN_HUB', 'DELIVERED'].includes(b.status)
  );

  const failedTasks = visibleBookings.filter(b =>
    ['PICKUP_FAILED', 'DELIVERY_FAILED'].includes(b.status)
  );

  // Earnings estimate for partner
  const pickupRate = partnerProfile?.defaultPickupRate || 45;
  const deliveryRate = partnerProfile?.defaultDeliveryRate || 55;
  
  const estimatedEarnings = completedTasks.reduce((sum, b) => {
    let earned = 0;
    if (b.assignedPickupPartnerId === user.id) earned += pickupRate;
    if (b.assignedDeliveryPartnerId === user.id) earned += deliveryRate;
    return sum + earned;
  }, 0);

  const getGoogleMapsUrl = (address: string, city: string) => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address}, ${city}, India`)}`;
  };

  const handleOpenFailureModal = (bId: string, stage: 'PICKUP' | 'DELIVERY') => {
    setFailureBookingId(bId);
    setFailureStage(stage);
    setFailureReason('Customer Unavailable');
  };

  const submitFailure = () => {
    if (!failureBookingId) return;
    reportFailure(failureBookingId, failureStage, failureReason);
    setFailureBookingId(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Mobile-first Partner Header */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <Bike className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-teal-400 font-bold">{user.id}</span>
              <span className="text-[11px] text-slate-400">· {user.city} Fleet</span>
            </div>
            <h1 className="text-lg font-bold">{user.name}</h1>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Completed Payables</span>
          <span className="text-xl font-bold font-mono text-teal-400 tabular-nums">
            ₹{estimatedEarnings.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Task Summary Badges */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-semibold text-slate-400 uppercase block">Pending Tasks</span>
          <span className="text-xl font-bold font-mono text-purple-700">{pendingTasks.length}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-semibold text-slate-400 uppercase block">Done & Verified</span>
          <span className="text-xl font-bold font-mono text-emerald-700">{completedTasks.length}</span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-semibold text-slate-400 uppercase block">Exceptions</span>
          <span className="text-xl font-bold font-mono text-rose-700">{failedTasks.length}</span>
        </div>
      </div>

      {/* Active Tasks Queue */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
          <span>Assigned Ground Jobs</span>
          <span className="text-xs font-normal text-slate-500">Tap cards for detailed actions</span>
        </h2>

        {pendingTasks.map(booking => {
          const isPickup = booking.status.includes('PICKUP') || booking.assignedPickupPartnerId === user.id;
          const targetPerson = isPickup ? booking.sender : booking.receiver;
          const targetCity = isPickup ? booking.originCity : booking.destCity;
          const collectCod = !isPickup && booking.commercial.paymentMode === 'TO_PAY_COD' ? booking.commercial.totalCustomerPayable : 0;

          return (
            <div
              key={booking.id}
              className="bg-white rounded-xl border-2 border-slate-200 hover:border-teal-500 p-5 shadow-xs space-y-4 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900 text-sm">{booking.id}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    isPickup ? 'bg-purple-100 text-purple-800' : 'bg-indigo-100 text-indigo-800'
                  }`}>
                    {isPickup ? 'First-Mile Pickup' : 'Last-Mile Delivery'}
                  </span>
                </div>
                <StatusBadge status={booking.status} size="sm" />
              </div>

              {/* Customer info & Maps */}
              <div className="bg-slate-50 rounded-lg p-3 text-xs space-y-1.5">
                <div className="flex items-center justify-between font-semibold text-slate-900">
                  <span>{targetPerson.name}</span>
                  <a
                    href={`tel:${targetPerson.mobile}`}
                    className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-900 font-bold"
                  >
                    <Phone className="w-3.5 h-3.5" /> Call: {targetPerson.mobile}
                  </a>
                </div>
                <p className="text-slate-600">{targetPerson.address}, {targetCity} - {targetPerson.pincode}</p>
                
                <div className="pt-2 flex items-center justify-between border-t border-slate-200">
                  <span className="text-slate-500">
                    Cargo: <strong>{booking.shipment.pieces}x {booking.shipment.type}</strong> ({booking.shipment.weightKg}kg)
                  </span>
                  <a
                    href={getGoogleMapsUrl(targetPerson.address, targetCity)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700"
                  >
                    <MapPin className="w-3.5 h-3.5" /> Navigate in Maps <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {collectCod > 0 && (
                  <div className="p-2 bg-amber-100 text-amber-900 rounded font-semibold text-xs mt-2 flex items-center justify-between">
                    <span>Cash on Delivery Collection Due:</span>
                    <span className="font-mono text-sm">₹{collectCod}</span>
                  </div>
                )}
              </div>

              {/* Operational Action Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
                {/* Out for Pickup action */}
                {booking.status === 'PICKUP_INITIATED' && (
                  <button
                    onClick={() => transitionStatus(booking.id, 'OUT_FOR_PICKUP', 'Partner departed for customer pickup.')}
                    className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs"
                  >
                    Start Trip (Mark Out for Pickup)
                  </button>
                )}

                {/* Upload Pickup Proof */}
                {booking.status === 'OUT_FOR_PICKUP' && (
                  <>
                    <button
                      onClick={() => handleOpenFailureModal(booking.id, 'PICKUP')}
                      className="px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg"
                    >
                      Report Failed
                    </button>
                    <button
                      onClick={() => openPhotoModal(booking.id, 'PICKUP', 'Proof of Pickup', (photoUrl, notes) => {
                        transitionStatus(booking.id, 'PICKUP_COMPLETED', notes, {
                          photoUrl,
                          pickupProof: { photoUrl, capturedAt: new Date().toISOString(), capturedBy: user.name, notes }
                        });
                      })}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs"
                    >
                      <Camera className="w-4 h-4" /> Take Photo & Complete Pickup
                    </button>
                  </>
                )}

                {/* Out for Delivery action */}
                {booking.status === 'DELIVERY_INITIATED' && (
                  <button
                    onClick={() => transitionStatus(booking.id, 'OUT_FOR_DELIVERY', 'Partner departed for door delivery.')}
                    className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs"
                  >
                    Start Trip (Mark Out for Delivery)
                  </button>
                )}

                {/* Upload Delivery Proof */}
                {booking.status === 'OUT_FOR_DELIVERY' && (
                  <>
                    <button
                      onClick={() => handleOpenFailureModal(booking.id, 'DELIVERY')}
                      className="px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg"
                    >
                      Report Failed
                    </button>
                    <button
                      onClick={() => openPhotoModal(booking.id, 'DELIVERY', 'Proof of Delivery (POD)', (photoUrl, notes, recipient) => {
                        transitionStatus(booking.id, 'DELIVERED', notes, {
                          photoUrl,
                          deliveryProof: { photoUrl, recipientName: recipient || booking.receiver.name, deliveredAt: new Date().toISOString(), deliveredBy: user.name, notes }
                        });
                      })}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
                    >
                      <Camera className="w-4 h-4" /> Upload POD Photo & Deliver
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {pendingTasks.length === 0 && (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-400">
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h3 className="font-semibold text-slate-800 text-sm">All caught up!</h3>
            <p className="text-xs text-slate-500 mt-1">No active pickup or delivery jobs assigned to {user.name}.</p>
          </div>
        )}
      </div>

      {/* Failure Report Modal */}
      {failureBookingId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-semibold text-rose-800 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Report {failureStage} Failure ({failureBookingId})
              </h3>
              <button onClick={() => setFailureBookingId(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="block font-medium text-slate-700">Select Mandatory Reason</label>
              <select
                value={failureReason}
                onChange={e => setFailureReason(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-teal-500"
              >
                <option value="Customer Unavailable / Gate Locked">Customer Unavailable / Gate Locked</option>
                <option value="Incorrect Address / Unreachable Road">Incorrect Address / Unreachable Road</option>
                <option value="Package Refused / Inspection Failure">Package Refused / Inspection Failure</option>
                <option value="Consignee Phone Switched Off">Consignee Phone Switched Off</option>
                <option value="Customer Requested Delivery Reschedule">Customer Requested Delivery Reschedule</option>
                <option value="Damaged External Packing">Damaged External Packing</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setFailureBookingId(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={submitFailure}
                className="px-4 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded"
              >
                Submit Failure Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Booking, BookingStatus } from '../../types';
import { StatusBadge } from './StatusBadge';
import { CITY_HUBS } from '../../constants/network';
import {
  X,
  MapPin,
  ExternalLink,
  Package,
  Calendar,
  User,
  Phone,
  Truck,
  Building2,
  DollarSign,
  Camera,
  CheckCircle,
  AlertCircle,
  Clock,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export const BookingDetailModal: React.FC = () => {
  const {
    selectedBooking,
    setSelectedBooking,
    user,
    approveBooking,
    rejectBooking,
    transitionStatus,
    assignPickupPartner,
    assignDeliveryPartner,
    openPhotoModal,
    reportFailure,
    partners
  } = useApp();

  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'commercial'>('overview');
  const [zoomedPhoto, setZoomedPhoto] = useState<string | null>(null);

  if (!selectedBooking) return null;

  const booking = selectedBooking;
  const isSuperAdmin = user.role === 'SHUDHI_ADMIN';
  const isSubAgent = user.role === 'SUB_AGENT';
  const isPartner = user.role === 'PARTNER';
  const isCustomer = user.role === 'CUSTOMER';

  // Can view commercial: Admin or the owning Sub-Agent (for their own margin)
  const canViewCommercial = isSuperAdmin || (isSubAgent && booking.agentId === user.id);

  const getGoogleMapsUrl = (address: string, city: string) => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address}, ${city}, India`)}`;
  };

  const handleApprove = () => {
    approveBooking(booking.id);
    setSelectedBooking(null);
  };

  const handleReject = () => {
    if (!rejectReasonInput.trim()) return;
    rejectBooking(booking.id, rejectReasonInput);
    setSelectedBooking(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 rounded-lg">
              <Package className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-mono tracking-tight">{booking.id}</h2>
                <StatusBadge status={booking.status} size="sm" />
              </div>
              <p className="text-xs text-slate-400">
                Created on {booking.date} · Origin: {booking.originCity} → Dest: {booking.destCity}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedBooking(null)}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-6 text-xs font-medium shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-teal-600 text-teal-700 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Consignment Overview
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'timeline'
                ? 'border-teal-600 text-teal-700 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Tracking Timeline
            <span className="bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full text-[10px]">
              {booking.timeline.length}
            </span>
          </button>
          {canViewCommercial && (
            <button
              onClick={() => setActiveTab('commercial')}
              className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'commercial'
                  ? 'border-teal-600 text-teal-700 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Financial & Commercials
            </button>
          )}
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Route & Transporter Highlights */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex-1 text-center sm:text-left">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider block">Origin City</span>
                  <span className="font-semibold text-slate-900 text-base">{booking.originCity}</span>
                  <p className="text-xs text-slate-500 truncate">{CITY_HUBS[booking.originCity]?.name}</p>
                </div>
                <div className="flex flex-col items-center justify-center px-4">
                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 mb-1">
                    <Truck className="w-4 h-4" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex-1 text-center sm:text-right">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider block">Destination City</span>
                  <span className="font-semibold text-slate-900 text-base">{booking.destCity}</span>
                  <p className="text-xs text-slate-500 truncate">{CITY_HUBS[booking.destCity]?.name}</p>
                </div>
              </div>

              {/* APSRTC References */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <span className="text-[11px] text-slate-500 block">APSRTC Booking Ref</span>
                  <span className="font-mono text-sm font-semibold text-teal-700">
                    {booking.apsrtcRef || 'Pending Transporter Log'}
                  </span>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <span className="text-[11px] text-slate-500 block">APSRTC Consignment AWB</span>
                  <span className="font-mono text-sm font-semibold text-slate-800">
                    {booking.awb || 'Pending Transporter Log'}
                  </span>
                </div>
              </div>

              {/* Sender & Receiver Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sender */}
                <div className="p-4 rounded-lg border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-teal-600" /> Sender (Pickup)
                    </span>
                    <span className="text-[10px] px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                      {booking.sender.pickupType === 'DOOR_PICKUP' ? 'Door Pickup' : 'Hub Drop'}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{booking.sender.name}</p>
                  <p className="text-xs text-slate-600 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" /> {booking.sender.mobile}
                  </p>
                  <p className="text-xs text-slate-600">{booking.sender.address}, {booking.originCity} - {booking.sender.pincode}</p>
                  
                  <a
                    href={getGoogleMapsUrl(booking.sender.address, booking.originCity)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium pt-1"
                  >
                    Open Google Maps <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Receiver */}
                <div className="p-4 rounded-lg border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-indigo-600" /> Receiver (Delivery)
                    </span>
                    <span className="text-[10px] px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                      {booking.receiver.deliveryType === 'DOOR_DELIVERY' ? 'Door Delivery' : 'Hub Collect'}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{booking.receiver.name}</p>
                  <p className="text-xs text-slate-600 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" /> {booking.receiver.mobile}
                  </p>
                  <p className="text-xs text-slate-600">{booking.receiver.address}, {booking.destCity} - {booking.receiver.pincode}</p>
                  
                  <a
                    href={getGoogleMapsUrl(booking.receiver.address, booking.destCity)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium pt-1"
                  >
                    Open Google Maps <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Package Details */}
              <div className="p-4 rounded-lg border border-slate-200 bg-white space-y-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-slate-600" /> Consignment Specifications
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Package Type</span>
                    <span className="font-medium text-slate-800">{booking.shipment.type}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Pieces</span>
                    <span className="font-medium text-slate-800">{booking.shipment.pieces} Unit(s)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Actual Weight</span>
                    <span className="font-medium text-slate-800">{booking.shipment.weightKg} kg</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Declared Value</span>
                    <span className="font-medium text-slate-800">₹{booking.shipment.declaredValue.toLocaleString()}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-500 font-medium">Description: </span>
                  <span className="text-slate-700">{booking.shipment.description}</span>
                  {booking.shipment.specialInstructions && (
                    <p className="text-amber-700 mt-1">
                      <strong>Handling Note:</strong> {booking.shipment.specialInstructions}
                    </p>
                  )}
                </div>
              </div>

              {/* Photographic Proof Displays */}
              {(booking.pickupProof || booking.deliveryProof) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {booking.pickupProof && (
                    <div className="border border-slate-200 rounded-lg p-3 bg-white">
                      <span className="text-xs font-semibold text-slate-700 flex items-center gap-1 mb-2">
                        <Camera className="w-3.5 h-3.5 text-teal-600" /> Proof of Pickup
                      </span>
                      <img
                        src={booking.pickupProof.photoUrl}
                        alt="Proof of pickup"
                        onClick={() => setZoomedPhoto(booking.pickupProof!.photoUrl)}
                        className="w-full h-36 object-cover rounded cursor-pointer hover:opacity-90 transition-opacity"
                      />
                      <p className="text-[11px] text-slate-500 mt-1.5">
                        Captured by {booking.pickupProof.capturedBy} on {new Date(booking.pickupProof.capturedAt).toLocaleTimeString()}
                      </p>
                    </div>
                  )}

                  {booking.deliveryProof && (
                    <div className="border border-slate-200 rounded-lg p-3 bg-white">
                      <span className="text-xs font-semibold text-slate-700 flex items-center gap-1 mb-2">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Proof of Delivery
                      </span>
                      <img
                        src={booking.deliveryProof.photoUrl}
                        alt="Proof of delivery"
                        onClick={() => setZoomedPhoto(booking.deliveryProof!.photoUrl)}
                        className="w-full h-36 object-cover rounded cursor-pointer hover:opacity-90 transition-opacity"
                      />
                      <p className="text-[11px] text-slate-500 mt-1.5">
                        Delivered to {booking.deliveryProof.recipientName} ({new Date(booking.deliveryProof.deliveredAt).toLocaleTimeString()})
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Exceptions / Failure banner */}
              {booking.failureReason && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Operation Failure Logged:</span>
                    <span>{booking.failureReason}</span>
                  </div>
                </div>
              )}

              {booking.rejectionReason && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Booking Rejected:</span>
                    <span>{booking.rejectionReason}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Verified audit trail for shipment <strong className="font-mono">{booking.id}</strong>.
              </p>
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {booking.timeline.map((event, idx) => (
                  <div key={event.id || idx} className="relative group">
                    {/* Circle icon */}
                    <div className="absolute -left-6 top-0 w-5 h-5 rounded-full bg-white border-2 border-teal-600 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs shadow-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">{event.statusLabel}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(event.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                      <p className="text-slate-600">{event.notes}</p>
                      <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400 border-t border-slate-100">
                        <span>Actor: <strong className="text-slate-600">{event.actorName}</strong> ({event.actorRole})</span>
                        {event.location && <span>· Location: <strong className="text-slate-600">{event.location}</strong></span>}
                      </div>
                      {event.photoUrl && (
                        <div className="pt-2">
                          <img
                            src={event.photoUrl}
                            alt="Event proof"
                            onClick={() => setZoomedPhoto(event.photoUrl!)}
                            className="w-24 h-16 object-cover rounded border border-slate-200 cursor-pointer"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'commercial' && canViewCommercial && (
            <div className="space-y-6">
              {/* Customer Collections */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Customer Revenue & Collections
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Customer Freight</span>
                    <span className="font-medium text-slate-800">₹{booking.commercial.customerFreight}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Additional / Surcharge</span>
                    <span className="font-medium text-slate-800">₹{booking.commercial.additionalCharges}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Discount</span>
                    <span className="font-medium text-slate-800">₹{booking.commercial.discount}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Total Payable</span>
                    <span className="font-bold text-slate-900 text-sm">₹{booking.commercial.totalCustomerPayable}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span>Payment Mode: <strong>{booking.commercial.paymentMode}</strong></span>
                  <span className={`px-2 py-0.5 rounded font-medium ${
                    booking.commercial.collectionStatus === 'COLLECTED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {booking.commercial.collectionStatus}
                  </span>
                </div>
              </div>

              {/* Operating Cost Breakdown & Net Margin */}
              {isSuperAdmin && (
                <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-600" /> Direct Operating Costs & Settlement Ledger
                  </span>

                  <table className="w-full text-xs">
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="py-2 text-slate-600">APSRTC Transporter Bus Freight</td>
                        <td className="py-2 text-right font-medium text-slate-900">₹{booking.commercial.apsrtcFreight}</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-slate-600">First-Mile Pickup Partner Cost</td>
                        <td className="py-2 text-right font-medium text-slate-900">₹{booking.commercial.pickupCost}</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-slate-600">Last-Mile Door Delivery Partner Cost</td>
                        <td className="py-2 text-right font-medium text-slate-900">₹{booking.commercial.deliveryCost}</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-slate-600">Sub-Agent Commission Margin ({booking.agentId})</td>
                        <td className="py-2 text-right font-medium text-slate-900">₹{booking.commercial.subAgentMargin}</td>
                      </tr>
                      <tr className="bg-slate-50 font-semibold">
                        <td className="py-2 px-2 text-slate-800">Net Operational Margin (SHUDHI Contribution)</td>
                        <td className="py-2 px-2 text-right text-teal-700 text-sm font-bold">
                          ₹{booking.commercial.netOperationalMargin}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <p className="text-[11px] text-slate-400 italic">
                    Formula: Net Margin = Customer Payable − APSRTC Cost − Pickup Cost − Delivery Cost − Sub-Agent Margin.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            Current Status: <strong className="text-slate-800">{booking.status}</strong>
          </div>

          <div className="flex items-center gap-2">
            {/* Admin Approval Actions */}
            {isSuperAdmin && booking.status === 'PENDING_APPROVAL' && (
              <>
                <button
                  onClick={() => setShowRejectForm(!showRejectForm)}
                  className="px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={handleApprove}
                  className="px-4 py-1.5 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-md shadow-xs transition-colors"
                >
                  Approve Consignment
                </button>
              </>
            )}

            {/* First-Mile Quick Actions */}
            {booking.status === 'APPROVED' && (
              <button
                onClick={() => {
                  const p = partners.find(pt => pt.city === booking.originCity);
                  if (p) assignPickupPartner(booking.id, p.id);
                  else transitionStatus(booking.id, 'PICKUP_INITIATED', 'Pickup self-assigned.');
                }}
                className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors"
              >
                Assign Pickup Partner
              </button>
            )}

            {booking.status === 'PICKUP_INITIATED' && (
              <button
                onClick={() => transitionStatus(booking.id, 'OUT_FOR_PICKUP', 'Rider out for pickup.')}
                className="px-3 py-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors"
              >
                Mark Out for Pickup
              </button>
            )}

            {booking.status === 'OUT_FOR_PICKUP' && (
              <button
                onClick={() => openPhotoModal(booking.id, 'PICKUP', 'Proof of Pickup', (url, notes) => {
                  transitionStatus(booking.id, 'PICKUP_COMPLETED', notes, { photoUrl: url, pickupProof: { photoUrl: url, capturedAt: new Date().toISOString(), capturedBy: user.name, notes } });
                })}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-md transition-colors"
              >
                <Camera className="w-3.5 h-3.5" /> Complete Pickup (Add Photo)
              </button>
            )}

            {booking.status === 'PICKUP_COMPLETED' && (
              <button
                onClick={() => transitionStatus(booking.id, 'HANDED_AT_ORIGIN_HUB', `Handed at ${booking.originCity} Origin Hub.`)}
                className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
              >
                Hand Over to Origin Hub
              </button>
            )}

            {/* Mid-Mile Handover */}
            {booking.status === 'HANDED_AT_ORIGIN_HUB' && (
              <button
                onClick={() => transitionStatus(booking.id, 'DISPATCHED_ON_THE_WAY', `Dispatched on APSRTC bus to ${booking.destCity}.`)}
                className="px-3 py-1.5 text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-md transition-colors"
              >
                Dispatch via APSRTC Bus
              </button>
            )}

            {booking.status === 'DISPATCHED_ON_THE_WAY' && (
              <button
                onClick={() => transitionStatus(booking.id, 'REACHED_DEST_HUB', `Arrived at ${booking.destCity} Hub.`)}
                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Mark Reached Dest. Hub
              </button>
            )}

            {booking.status === 'REACHED_DEST_HUB' && (
              <button
                onClick={() => transitionStatus(booking.id, 'UNLOADED_AT_DEST_HUB', 'Unloaded into delivery cargo facility.')}
                className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors"
              >
                Unload at Dest. Hub
              </button>
            )}

            {/* Last-Mile Actions */}
            {booking.status === 'UNLOADED_AT_DEST_HUB' && (
              <button
                onClick={() => {
                  const p = partners.find(pt => pt.city === booking.destCity);
                  if (p) assignDeliveryPartner(booking.id, p.id);
                  else transitionStatus(booking.id, 'DELIVERY_INITIATED', 'Delivery self-assigned.');
                }}
                className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors"
              >
                Assign Delivery Partner
              </button>
            )}

            {booking.status === 'DELIVERY_INITIATED' && (
              <button
                onClick={() => transitionStatus(booking.id, 'OUT_FOR_DELIVERY', 'Rider out for door delivery.')}
                className="px-3 py-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors"
              >
                Mark Out for Delivery
              </button>
            )}

            {booking.status === 'OUT_FOR_DELIVERY' && (
              <button
                onClick={() => openPhotoModal(booking.id, 'DELIVERY', 'Proof of Delivery', (url, notes, recipient) => {
                  transitionStatus(booking.id, 'DELIVERED', notes, { photoUrl: url, deliveryProof: { photoUrl: url, recipientName: recipient || booking.receiver.name, deliveredAt: new Date().toISOString(), deliveredBy: user.name, notes } });
                })}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors"
              >
                <Camera className="w-3.5 h-3.5" /> Upload POD & Deliver
              </button>
            )}

            <button
              onClick={() => setSelectedBooking(null)}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Reject reason popover */}
        {showRejectForm && (
          <div className="p-4 bg-rose-50 border-t border-rose-200 space-y-3">
            <span className="text-xs font-semibold text-rose-900 block">Specify Rejection Reason</span>
            <input
              type="text"
              placeholder="e.g. Hazardous chemical / unserviceable remote address"
              value={rejectReasonInput}
              onChange={e => setRejectReasonInput(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-rose-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowRejectForm(false)}
                className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-3 py-1 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        )}

        {/* Zoomed Photo Modal */}
        {zoomedPhoto && (
          <div
            className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setZoomedPhoto(null)}
          >
            <div className="relative max-w-2xl max-h-[90vh]">
              <img src={zoomedPhoto} alt="Zoomed proof" className="rounded-lg max-h-[85vh] object-contain shadow-2xl" />
              <button
                onClick={() => setZoomedPhoto(null)}
                className="absolute top-2 right-2 bg-slate-900/80 text-white p-2 rounded-full hover:bg-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

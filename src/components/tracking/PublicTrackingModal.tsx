import React from 'react';
import { PublicTrackingData } from '../../types/tracking';
import { StatusBadge } from '../common/StatusBadge';
import {
  X,
  Package,
  MapPin,
  Clock,
  CheckCircle,
  Truck,
  ArrowRight,
  ShieldCheck,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface PublicTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackingData: PublicTrackingData | null;
}

export const PublicTrackingModal: React.FC<PublicTrackingModalProps> = ({
  isOpen,
  onClose,
  trackingData
}) => {
  if (!isOpen || !trackingData) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex justify-center items-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 rounded-lg">
              <Package className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold text-teal-400 tracking-wider">
                  Consignment Tracking
                </span>
                <span className="text-xs text-slate-400">·</span>
                <span className="font-mono text-sm font-bold text-white tracking-tight">
                  {trackingData.bookingReference}
                </span>
              </div>
              <h2 className="text-base font-extrabold text-slate-100 flex items-center gap-2 mt-0.5">
                <span>{trackingData.originCity}</span>
                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{trackingData.destCity}</span>
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close tracking view"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status & Security Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-500">Current Status:</span>
              <StatusBadge status={trackingData.status} size="md" />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Verified Customer Session</span>
            </div>
          </div>

          {/* Delivered Confirmation Card */}
          {trackingData.isDelivered && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <h4 className="font-bold text-emerald-900 text-sm">Delivery Completed</h4>
                <p className="text-emerald-800">
                  This consignment has been safely delivered to the consignee.
                  {trackingData.deliveredAt && (
                    <span className="block text-emerald-700 mt-0.5 font-medium">
                      Delivered on: {new Date(trackingData.deliveredAt).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  )}
                </p>
                {trackingData.deliveryProofAvailable && (
                  <span className="inline-block px-2 py-0.5 mt-1 bg-emerald-100 text-emerald-800 rounded font-medium text-[11px]">
                    Photographic Proof of Delivery Verified
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Consignment Information */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-slate-400" />
              Shipment Information
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block">Package Details</span>
                <span className="font-semibold text-slate-800">
                  {trackingData.packageSummary.pieces}x {trackingData.packageSummary.packageType}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Weight</span>
                <span className="font-semibold text-slate-800">
                  {trackingData.packageSummary.weightKg} kg
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Pickup Method</span>
                <span className="font-semibold text-slate-800">
                  {trackingData.pickupType}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Delivery Method</span>
                <span className="font-semibold text-slate-800">
                  {trackingData.deliveryType}
                </span>
              </div>
              {trackingData.packageSummary.description && (
                <div className="col-span-2 sm:col-span-4 pt-2 border-t border-slate-200">
                  <span className="text-slate-400 block">Contents Description</span>
                  <span className="text-slate-700 font-medium">
                    {trackingData.packageSummary.description}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Milestone Timeline */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              Shipment Progress & Milestones
            </h3>

            {trackingData.milestones && trackingData.milestones.length > 0 ? (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {trackingData.milestones.map((milestone, idx) => {
                  const isLatest = idx === trackingData.milestones.length - 1;
                  const isDeliveredMilestone = milestone.status === 'DELIVERED';

                  return (
                    <div key={milestone.id || idx} className="relative group">
                      {/* Timeline Dot */}
                      <div
                        className={`absolute -left-6 top-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isDeliveredMilestone
                            ? 'bg-emerald-600 border-white text-white shadow-xs'
                            : isLatest
                            ? 'bg-teal-600 border-white text-white ring-4 ring-teal-100 shadow-xs'
                            : 'bg-white border-slate-300 text-slate-400'
                        }`}
                      >
                        {isDeliveredMilestone ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-current" />
                        )}
                      </div>

                      {/* Milestone Event Details */}
                      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {milestone.statusLabel}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(milestone.timestamp).toLocaleString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        {milestone.location && (
                          <div className="flex items-center gap-1 text-xs text-slate-600">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>Location: {milestone.location}</span>
                          </div>
                        )}

                        {milestone.description && (
                          <p className="text-xs text-slate-600 pt-1 border-t border-slate-100">
                            {milestone.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                Shipment created. Awaiting first transit checkpoint update.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            Booking Date: {trackingData.bookingDate}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Close Tracking
          </button>
        </div>
      </div>
    </div>
  );
};

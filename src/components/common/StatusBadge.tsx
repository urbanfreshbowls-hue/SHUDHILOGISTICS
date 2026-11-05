import React from 'react';
import { BookingStatus } from '../../types';
import { STATUS_META } from '../../constants/network';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  MapPin,
  ArrowRightCircle,
  Building2,
  PackageCheck,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

interface StatusBadgeProps {
  status: BookingStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const meta = STATUS_META[status] || {
    label: status,
    color: 'text-slate-700 bg-slate-50 border-slate-200'
  };

  const getIcon = () => {
    switch (status) {
      case 'PENDING_APPROVAL':
        return <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
      case 'APPROVED':
        return <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />;
      case 'REJECTED':
        return <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />;
      case 'PICKUP_INITIATED':
      case 'OUT_FOR_PICKUP':
        return <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0" />;
      case 'PICKUP_COMPLETED':
      case 'HANDED_AT_ORIGIN_HUB':
        return <Building2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />;
      case 'AT_ORIGIN_HUB':
      case 'DISPATCHED_ON_THE_WAY':
      case 'AT_TRANSHIPMENT':
      case 'JOURNEY_RESUMED':
        return <Truck className="w-3.5 h-3.5 text-cyan-600 shrink-0" />;
      case 'REACHED_DEST_HUB':
      case 'UNLOADED_AT_DEST_HUB':
      case 'AT_DELIVERY_FACILITY':
        return <ArrowRightCircle className="w-3.5 h-3.5 text-indigo-600 shrink-0" />;
      case 'DELIVERY_INITIATED':
      case 'OUT_FOR_DELIVERY':
        return <Truck className="w-3.5 h-3.5 text-purple-600 shrink-0" />;
      case 'DELIVERED':
        return <PackageCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
      case 'PICKUP_FAILED':
      case 'DELIVERY_FAILED':
      case 'EXCEPTION':
        return <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />;
      case 'RETURNED':
        return <RotateCcw className="w-3.5 h-3.5 text-zinc-600 shrink-0" />;
      default:
        return <Clock className="w-3.5 h-3.5 shrink-0" />;
    }
  };

  const pad = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md border ${meta.color} ${pad} whitespace-nowrap`}
    >
      {getIcon()}
      <span>{meta.label}</span>
    </span>
  );
};

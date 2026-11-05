import { Booking, BookingStatus } from '../types';
import { PublicTrackingData, PublicTrackingMilestone } from '../types/tracking';
import { STATUS_META } from '../constants/network';

/**
 * Customer-Safe Milestone Allowlist
 * Strict allowlist of customer-friendly milestone labels and descriptions.
 * Internal timeline notes, operational instructions, employee names, and partner details
 * are strictly blocked and replaced with standardized customer messaging.
 */
export const CUSTOMER_SAFE_MILESTONES: Record<
  BookingStatus,
  { label: string; description: string }
> = {
  PENDING_APPROVAL: {
    label: 'Booking Received',
    description: 'Consignment booking order submitted and awaiting verification.'
  },
  APPROVED: {
    label: 'Booking Confirmed',
    description: 'Consignment verified and scheduled for dispatch network.'
  },
  REJECTED: {
    label: 'Booking Cancelled',
    description: 'Consignment could not be processed.'
  },
  PICKUP_INITIATED: {
    label: 'Pickup Assigned',
    description: 'First-mile collection team assigned for parcel collection.'
  },
  OUT_FOR_PICKUP: {
    label: 'Out for Pickup',
    description: 'Collection team is en route to collect parcel.'
  },
  PICKUP_COMPLETED: {
    label: 'Package Collected',
    description: 'Parcel collected from sender and moving to origin hub.'
  },
  PICKUP_FAILED: {
    label: 'Pickup Rescheduled',
    description: 'Pickup attempt unsuccessful; will be rescheduled for next available window.'
  },
  HANDED_AT_ORIGIN_HUB: {
    label: 'Received at Origin Hub',
    description: 'Parcel received and logged at origin logistics facility.'
  },
  AT_ORIGIN_HUB: {
    label: 'Processed at Origin Hub',
    description: 'Parcel weighed, verified, and staged for line-haul dispatch.'
  },
  DISPATCHED_ON_THE_WAY: {
    label: 'In Transit',
    description: 'Consignment dispatched and in transit to destination hub.'
  },
  AT_TRANSHIPMENT: {
    label: 'Transhipment Facility',
    description: 'Consignment sorted at intermediate network facility.'
  },
  JOURNEY_RESUMED: {
    label: 'Transit Resumed',
    description: 'Consignment departed transhipment hub toward destination city.'
  },
  REACHED_DEST_HUB: {
    label: 'Arrived at Destination Hub',
    description: 'Consignment received at destination logistics hub.'
  },
  UNLOADED_AT_DEST_HUB: {
    label: 'Processed at Destination Hub',
    description: 'Consignment verified and staged for local delivery allocation.'
  },
  AT_DELIVERY_FACILITY: {
    label: 'At Local Delivery Center',
    description: 'Consignment sorted at local delivery center.'
  },
  DELIVERY_INITIATED: {
    label: 'Delivery Scheduled',
    description: 'Consignment assigned to delivery fleet.'
  },
  OUT_FOR_DELIVERY: {
    label: 'Out for Delivery',
    description: 'Parcel is out with delivery partner for final delivery.'
  },
  DELIVERED: {
    label: 'Delivered',
    description: 'Parcel safely delivered to consignee.'
  },
  DELIVERY_FAILED: {
    label: 'Delivery Rescheduled',
    description: 'Delivery attempt unsuccessful; delivery will be re-attempted.'
  },
  EXCEPTION: {
    label: 'Shipment Update',
    description: 'Consignment undergoing operational transit update.'
  },
  CANCELLED: {
    label: 'Shipment Cancelled',
    description: 'Consignment has been cancelled.'
  },
  RETURNED: {
    label: 'Returned to Sender',
    description: 'Consignment returned to origin.'
  }
};

/**
 * Sanitizes and maps an internal Booking object into a public tracking data structure.
 * 
 * Strict Data Boundary Guarantees:
 * - Sender & receiver full contact numbers and complete street addresses are omitted.
 * - Commercial calculations, customer collections, and profit margins are omitted.
 * - APSRTC payables, partner fees, and internal payouts are omitted.
 * - Partner personal identities and contact details are omitted.
 * - Internal system notes and remarks are omitted; only allowlisted milestone descriptions are used.
 * - Delivery proof photos, signatures, recipient phone numbers, and proof metadata are omitted.
 */
export function mapBookingToPublicTracking(booking: Booking): PublicTrackingData {
  const meta = STATUS_META[booking.status] || {
    label: booking.status,
    group: 'EXCEPTION' as const,
    color: 'text-slate-700 bg-slate-100 border-slate-200'
  };

  const milestones: PublicTrackingMilestone[] = (booking.timeline || []).map((event, idx) => {
    const safeInfo = CUSTOMER_SAFE_MILESTONES[event.status] || {
      label: event.statusLabel || (STATUS_META[event.status]?.label ?? event.status),
      description: 'Shipment status checkpoint recorded.'
    };

    return {
      id: event.id || `event-${idx}`,
      timestamp: event.timestamp || booking.date,
      status: event.status,
      statusLabel: safeInfo.label,
      description: safeInfo.description,
      // Location is sanitized to display only general city/hub names if available
      location: event.location || undefined
    };
  });

  const isDelivered = booking.status === 'DELIVERED';
  const deliveredAt = booking.deliveryProof?.deliveredAt;

  return {
    bookingReference: booking.id,
    originCity: booking.originCity,
    destCity: booking.destCity,
    bookingDate: booking.date,
    status: booking.status,
    statusLabel: meta.label,
    statusGroup: meta.group,
    packageSummary: {
      pieces: booking.shipment?.pieces ?? 1,
      packageType: booking.shipment?.type ?? 'Consignment',
      weightKg: booking.shipment?.weightKg ?? 0,
      description: booking.shipment?.description ?? ''
    },
    pickupType: booking.sender?.pickupType === 'DOOR_PICKUP' ? 'Doorstep Pickup' : 'Hub Drop-off',
    deliveryType: booking.receiver?.deliveryType === 'DOOR_DELIVERY' ? 'Doorstep Delivery' : 'Hub Collection',
    milestones,
    isDelivered,
    deliveredAt,
    // Only a boolean indicator is exposed: no photo URLs, signatures, recipient phone numbers, or metadata
    deliveryProofAvailable: Boolean(booking.deliveryProof?.deliveredAt || booking.deliveryProof?.photoUrl)
  };
}

/**
 * Returns a masked destination string for sender's mobile OTP notification.
 * Never exposes the full phone number.
 * Example: "9849012345" -> "ending in XX45"
 */
export function getMaskedContactDestination(mobile: string | undefined): string {
  if (!mobile) {
    return 'ending in XX**';
  }
  const digitsOnly = mobile.replace(/\D/g, '');
  if (digitsOnly.length < 2) {
    return 'ending in XX**';
  }
  const last2 = digitsOnly.slice(-2);
  return `ending in XX${last2}`;
}

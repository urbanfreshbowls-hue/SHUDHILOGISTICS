import { City, BookingStatus } from './index';

export interface PublicTrackingMilestone {
  id: string;
  timestamp: string;
  status: BookingStatus;
  statusLabel: string;
  description: string; // Customer-safe status description from allowlist
  location?: string;
}

export interface PublicTrackingData {
  bookingReference: string;
  originCity: City;
  destCity: City;
  bookingDate: string;
  status: BookingStatus;
  statusLabel: string;
  statusGroup: 'BOOKING' | 'PICKUP' | 'TRANSIT' | 'DELIVERY' | 'EXCEPTION';
  packageSummary: {
    pieces: number;
    packageType: string;
    weightKg: number;
    description: string;
  };
  pickupType: string;
  deliveryType: string;
  milestones: PublicTrackingMilestone[];
  isDelivered: boolean;
  deliveredAt?: string;
  deliveryProofAvailable: boolean; // Boolean flag only: never exposes photo data URLs, signatures or metadata
}

export type UserRole = 'SHUDHI_ADMIN' | 'SUB_AGENT' | 'PARTNER' | 'CUSTOMER';

export type City = 'VISAKHAPATNAM' | 'RAJAMAHENDRAVARAM' | 'VIJAYAWADA' | 'HYDERABAD';

export type BookingStatus =
  // Booking Stage
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  // First-Mile Pickup
  | 'PICKUP_INITIATED'
  | 'OUT_FOR_PICKUP'
  | 'PICKUP_COMPLETED'
  | 'PICKUP_FAILED'
  | 'HANDED_AT_ORIGIN_HUB'
  // Mid-Mile APSRTC Transit
  | 'AT_ORIGIN_HUB'
  | 'DISPATCHED_ON_THE_WAY'
  | 'AT_TRANSHIPMENT'
  | 'JOURNEY_RESUMED'
  | 'REACHED_DEST_HUB'
  | 'UNLOADED_AT_DEST_HUB'
  // Last-Mile Delivery
  | 'AT_DELIVERY_FACILITY'
  | 'DELIVERY_INITIATED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'DELIVERY_FAILED'
  // Exceptions
  | 'EXCEPTION'
  | 'CANCELLED'
  | 'RETURNED';

export type BookingSource = 'ADMIN_DIRECT' | 'SUB_AGENT' | 'CUSTOMER_PORTAL' | 'CUSTOMER_WHATSAPP';
export type PackageType = 'Carton Box' | 'Gunny Bag' | 'Document' | 'Pallet' | 'Other';
export type PickupType = 'DOOR_PICKUP' | 'HUB_DROP';
export type DeliveryType = 'DOOR_DELIVERY' | 'DEST_HUB_COLLECT';
export type PaymentMode = 'CASH' | 'UPI_ONLINE' | 'TO_PAY_COD' | 'CREDIT_ACCOUNT';
export type PaymentStatus = 'PENDING' | 'COLLECTED' | 'WAIVED' | 'REFUNDED';
export type PaymentResponsibility = 'SHUDHI' | 'SUB_AGENT';

export interface TimelineEvent {
  id: string;
  timestamp: string;
  status: BookingStatus;
  statusLabel: string;
  actorName: string;
  actorRole: UserRole;
  notes?: string;
  photoUrl?: string;
  location?: string;
}

export interface CommercialBreakdown {
  customerFreight: number;
  additionalCharges: number;
  discount: number;
  totalCustomerPayable: number;
  paymentMode: PaymentMode;
  collectionStatus: PaymentStatus;
  collectedAt?: string;
  collectedBy?: string;
  
  // Expenses
  apsrtcFreight: number;
  apsrtcPaymentStatus: 'PENDING' | 'PAID';
  apsrtcPaymentRef?: string;
  
  pickupCost: number;
  pickupPaymentResponsibility: PaymentResponsibility;
  pickupPaymentStatus: 'PENDING' | 'PAID';
  
  deliveryCost: number;
  deliveryPaymentResponsibility: PaymentResponsibility;
  deliveryPaymentStatus: 'PENDING' | 'PAID';
  
  otherDirectCosts: number;
  
  // Margins
  subAgentMargin: number;
  subAgentMarginSettled: boolean;
  
  // Calculated net operational margin for SHUDHI
  netOperationalMargin: number;
}

export interface Booking {
  id: string;
  date: string;
  source: BookingSource;
  agentId: string; // VSP-A1, etc. or SHUDHI-HQ
  originCity: City;
  destCity: City;
  status: BookingStatus;
  apsrtcRef?: string | null;
  awb?: string | null;
  transporterStatusNotes?: string;
  
  sender: {
    name: string;
    mobile: string;
    address: string;
    pincode: string;
    pickupType: PickupType;
  };
  receiver: {
    name: string;
    mobile: string;
    address: string;
    pincode: string;
    deliveryType: DeliveryType;
  };
  shipment: {
    type: PackageType;
    pieces: number;
    weightKg: number;
    volumetricWeightKg?: number;
    declaredValue: number;
    description: string;
    photos?: string[];
    specialInstructions?: string;
  };
  commercial: CommercialBreakdown;
  
  assignedPickupPartnerId?: string | null;
  assignedDeliveryPartnerId?: string | null;
  
  pickupProof?: {
    photoUrl: string;
    capturedAt: string;
    capturedBy: string;
    notes?: string;
  };
  deliveryProof?: {
    photoUrl: string;
    recipientName: string;
    signatureUrl?: string;
    deliveredAt: string;
    deliveredBy: string;
    notes?: string;
  };
  failureReason?: string | null;
  rejectionReason?: string | null;
  timeline: TimelineEvent[];
}

export interface SubAgent {
  id: string; // e.g. VSP-A1
  name: string;
  phone: string;
  email: string;
  city: City;
  address: string;
  status: 'Active' | 'Inactive';
  commissionType: 'PERCENTAGE' | 'FIXED';
  commissionRate: number; // e.g. 10 (%) or 30 (INR)
  walletBalance: number;
  joinedDate: string;
}

export interface LocalPartner {
  id: string; // e.g. VSP-P1
  name: string;
  phone: string;
  city: City;
  serviceType: 'PICKUP' | 'DELIVERY' | 'BOTH';
  paymentResponsibility: PaymentResponsibility;
  defaultPickupRate: number;
  defaultDeliveryRate: number;
  status: 'Active' | 'Inactive';
  bankOrUpi: string;
}

export interface SettlementRecord {
  id: string;
  date: string;
  entityType: 'SUB_AGENT' | 'PARTNER' | 'APSRTC';
  entityId: string;
  entityName: string;
  amount: number;
  period: string;
  status: 'PAID' | 'PARTIAL' | 'PENDING';
  paymentMode: 'NEFT' | 'UPI' | 'CASH' | 'CHEQUE';
  paymentReference: string;
  notes?: string;
  linkedBookingIds: string[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  recordId: string;
  previousStatus?: string;
  newStatus?: string;
  details: string;
}

export interface SystemNotification {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  linkView?: string;
  bookingId?: string;
}

export interface ActiveUser {
  id: string;
  name: string;
  role: UserRole;
  city?: City;
  phone?: string;
}

// WhatsApp Simulator
export interface WAMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'document';
}

export interface WAConversation {
  identity: string; // e.g. CUSTOMER_9876543210, AGENT_VSP-A1, PARTNER_9000000001
  phone: string;
  roleType: 'CUSTOMER' | 'AGENT' | 'PARTNER';
  messages: WAMessage[];
  mode: string;
  context: Record<string, any>;
  lastUpdated: string;
}

import { City, BookingStatus, SubAgent, LocalPartner } from '../types';

export const CITIES: City[] = ['VISAKHAPATNAM', 'RAJAMAHENDRAVARAM', 'VIJAYAWADA', 'HYDERABAD'];

export const CITY_HUBS: Record<City, { name: string; address: string; phone: string }> = {
  VISAKHAPATNAM: {
    name: 'Visakhapatnam Central Hub',
    address: 'Plot 42, Sector 3, MVP Colony, Visakhapatnam - 530017',
    phone: '+91 891 2548899'
  },
  RAJAMAHENDRAVARAM: {
    name: 'Rajamahendravaram Gateway Hub',
    address: 'Main Road, Danavaipeta, Rajamahendravaram - 533103',
    phone: '+91 883 2467711'
  },
  VIJAYAWADA: {
    name: 'Vijayawada Express Hub',
    address: 'Near Benz Circle, MG Road, Vijayawada - 520010',
    phone: '+91 866 2489922'
  },
  HYDERABAD: {
    name: 'Hyderabad Megacity Hub',
    address: 'KPHB Phase 3, Kukatpally, Hyderabad - 500072',
    phone: '+91 40 23098877'
  }
};

export const INITIAL_SUB_AGENTS: SubAgent[] = [
  // Visakhapatnam (5)
  { id: 'VSP-A1', name: 'Srinivasa Express Logistics', phone: '9848011221', email: 'vsp1@shudhi.in', city: 'VISAKHAPATNAM', address: 'Dwaraka Nagar, Visakhapatnam', status: 'Active', commissionType: 'PERCENTAGE', commissionRate: 12, walletBalance: 14200, joinedDate: '2025-01-15' },
  { id: 'VSP-A2', name: 'Gajuwaka Cargo Desk', phone: '9848011222', email: 'vsp2@shudhi.in', city: 'VISAKHAPATNAM', address: 'Main Road, Gajuwaka, Visakhapatnam', status: 'Active', commissionType: 'PERCENTAGE', commissionRate: 10, walletBalance: 9800, joinedDate: '2025-02-10' },
  { id: 'VSP-A3', name: 'Madhurawada Fast Courier', phone: '9848011223', email: 'vsp3@shudhi.in', city: 'VISAKHAPATNAM', address: 'IT SEZ Road, Madhurawada', status: 'Active', commissionType: 'FIXED', commissionRate: 35, walletBalance: 6400, joinedDate: '2025-03-01' },
  { id: 'VSP-A4', name: 'Waltair Parcel Point', phone: '9848011224', email: 'vsp4@shudhi.in', city: 'VISAKHAPATNAM', address: 'Railway Station Road, Waltair', status: 'Active', commissionType: 'PERCENTAGE', commissionRate: 10, walletBalance: 11500, joinedDate: '2025-03-20' },
  { id: 'VSP-A5', name: 'Rushikonda Logistics Agency', phone: '9848011225', email: 'vsp5@shudhi.in', city: 'VISAKHAPATNAM', address: 'Beach Road, Rushikonda', status: 'Active', commissionType: 'PERCENTAGE', commissionRate: 12, walletBalance: 5200, joinedDate: '2025-04-05' },

  // Rajamahendravaram (1)
  { id: 'RJY-A1', name: 'Godavari Commercial Desks', phone: '9848022331', email: 'rjy1@shudhi.in', city: 'RAJAMAHENDRAVARAM', address: 'Kotipalli Bus Stand, Rajamahendravaram', status: 'Active', commissionType: 'PERCENTAGE', commissionRate: 12, walletBalance: 18400, joinedDate: '2025-01-10' },

  // Vijayawada (4)
  { id: 'VJW-A1', name: 'Krishna Cargo Solutions', phone: '9848033441', email: 'vjw1@shudhi.in', city: 'VIJAYAWADA', address: 'Governorpet, Vijayawada', status: 'Active', commissionType: 'PERCENTAGE', commissionRate: 12, walletBalance: 22100, joinedDate: '2025-01-12' },
  { id: 'VJW-A2', name: 'Auto Nagar Freight Hub', phone: '9848033442', email: 'vjw2@shudhi.in', city: 'VIJAYAWADA', address: 'Industrial Area, Auto Nagar', status: 'Active', commissionType: 'PERCENTAGE', commissionRate: 10, walletBalance: 16750, joinedDate: '2025-02-01' },
  { id: 'VJW-A3', name: 'One Town Parcel Depot', phone: '9848033443', email: 'vjw3@shudhi.in', city: 'VIJAYAWADA', address: 'Near Prakasam Barrage, One Town', status: 'Active', commissionType: 'FIXED', commissionRate: 30, walletBalance: 8900, joinedDate: '2025-03-15' },
  { id: 'VJW-A4', name: 'Gunadala Booking Express', phone: '9848033444', email: 'vjw4@shudhi.in', city: 'VIJAYAWADA', address: 'Eluru Road, Gunadala', status: 'Active', commissionType: 'PERCENTAGE', commissionRate: 10, walletBalance: 7300, joinedDate: '2025-04-02' },

  // Hyderabad (3)
  { id: 'HYD-A1', name: 'Secunderabad Express Agency', phone: '9848044551', email: 'hyd1@shudhi.in', city: 'HYDERABAD', address: 'Station Road, Secunderabad', status: 'Active', commissionType: 'PERCENTAGE', commissionRate: 12, walletBalance: 29800, joinedDate: '2025-01-08' },
  { id: 'HYD-A2', name: 'Madhapur Tech Deliveries', phone: '9848044552', email: 'hyd2@shudhi.in', city: 'HYDERABAD', address: 'Hitech City Road, Madhapur', status: 'Active', commissionType: 'PERCENTAGE', commissionRate: 12, walletBalance: 34100, joinedDate: '2025-01-20' },
  { id: 'HYD-A3', name: 'Dilsukhnagar Cargo Desk', phone: '9848044553', email: 'hyd3@shudhi.in', city: 'HYDERABAD', address: 'Chaitanyapuri, Dilsukhnagar', status: 'Active', commissionType: 'FIXED', commissionRate: 40, walletBalance: 14600, joinedDate: '2025-02-18' }
];

export const INITIAL_LOCAL_PARTNERS: LocalPartner[] = [
  { id: 'VSP-P1', name: 'Kiran Ground Delivery (Visakha)', phone: '9000000001', city: 'VISAKHAPATNAM', serviceType: 'BOTH', paymentResponsibility: 'SHUDHI', defaultPickupRate: 45, defaultDeliveryRate: 55, status: 'Active', bankOrUpi: 'kiran.vsp@upi' },
  { id: 'VSP-P2', name: 'Naidu Express Riders', phone: '9000000011', city: 'VISAKHAPATNAM', serviceType: 'BOTH', paymentResponsibility: 'SHUDHI', defaultPickupRate: 40, defaultDeliveryRate: 50, status: 'Active', bankOrUpi: 'naidu.riders@upi' },
  { id: 'RJY-P1', name: 'Ramesh Fast Fleet (Rajamahendravaram)', phone: '9000000002', city: 'RAJAMAHENDRAVARAM', serviceType: 'BOTH', paymentResponsibility: 'SHUDHI', defaultPickupRate: 40, defaultDeliveryRate: 50, status: 'Active', bankOrUpi: 'ramesh.rjy@upi' },
  { id: 'VJW-P1', name: 'Bhavani Local Couriers (Vijayawada)', phone: '9000000003', city: 'VIJAYAWADA', serviceType: 'BOTH', paymentResponsibility: 'SHUDHI', defaultPickupRate: 45, defaultDeliveryRate: 55, status: 'Active', bankOrUpi: 'bhavani.vjw@upi' },
  { id: 'VJW-P2', name: 'Vijayawada Swift Riders', phone: '9000000013', city: 'VIJAYAWADA', serviceType: 'DELIVERY', paymentResponsibility: 'SHUDHI', defaultPickupRate: 40, defaultDeliveryRate: 50, status: 'Active', bankOrUpi: 'swift.vjw@upi' },
  { id: 'HYD-P1', name: 'Suresh Urban Dispatch (Hyderabad)', phone: '9000000004', city: 'HYDERABAD', serviceType: 'BOTH', paymentResponsibility: 'SHUDHI', defaultPickupRate: 55, defaultDeliveryRate: 65, status: 'Active', bankOrUpi: 'suresh.hyd@upi' },
  { id: 'HYD-P2', name: 'Metro Speed Link (Hyderabad)', phone: '9000000014', city: 'HYDERABAD', serviceType: 'BOTH', paymentResponsibility: 'SHUDHI', defaultPickupRate: 50, defaultDeliveryRate: 60, status: 'Active', bankOrUpi: 'metrospeed@upi' }
];

export const STATUS_META: Record<BookingStatus, { label: string; group: 'BOOKING' | 'PICKUP' | 'TRANSIT' | 'DELIVERY' | 'EXCEPTION'; color: string }> = {
  // Booking
  PENDING_APPROVAL: { label: 'Pending Approval', group: 'BOOKING', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  APPROVED: { label: 'Approved', group: 'BOOKING', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  REJECTED: { label: 'Rejected', group: 'BOOKING', color: 'text-rose-700 bg-rose-50 border-rose-200' },

  // First-Mile Pickup
  PICKUP_INITIATED: { label: 'Pickup Initiated', group: 'PICKUP', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  OUT_FOR_PICKUP: { label: 'Out for Pickup', group: 'PICKUP', color: 'text-purple-700 bg-purple-50 border-purple-200' },
  PICKUP_COMPLETED: { label: 'Pickup Completed', group: 'PICKUP', color: 'text-teal-700 bg-teal-50 border-teal-200' },
  PICKUP_FAILED: { label: 'Pickup Failed', group: 'PICKUP', color: 'text-red-700 bg-red-50 border-red-200' },
  HANDED_AT_ORIGIN_HUB: { label: 'Handed at Origin HUB', group: 'PICKUP', color: 'text-teal-800 bg-teal-100 border-teal-300' },

  // Mid-Mile Transit (APSRTC)
  AT_ORIGIN_HUB: { label: 'At Origin HUB', group: 'TRANSIT', color: 'text-sky-700 bg-sky-50 border-sky-200' },
  DISPATCHED_ON_THE_WAY: { label: 'Dispatched / In Transit', group: 'TRANSIT', color: 'text-cyan-700 bg-cyan-50 border-cyan-200' },
  AT_TRANSHIPMENT: { label: 'At Transhipment HUB', group: 'TRANSIT', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  JOURNEY_RESUMED: { label: 'Journey Resumed', group: 'TRANSIT', color: 'text-sky-800 bg-sky-100 border-sky-300' },
  REACHED_DEST_HUB: { label: 'Reached Dest. HUB', group: 'TRANSIT', color: 'text-indigo-800 bg-indigo-100 border-indigo-300' },
  UNLOADED_AT_DEST_HUB: { label: 'Unloaded at Dest. HUB', group: 'TRANSIT', color: 'text-emerald-800 bg-emerald-100 border-emerald-300' },

  // Last-Mile Delivery
  AT_DELIVERY_FACILITY: { label: 'At Delivery Facility', group: 'DELIVERY', color: 'text-blue-800 bg-blue-50 border-blue-200' },
  DELIVERY_INITIATED: { label: 'Delivery Initiated', group: 'DELIVERY', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', group: 'DELIVERY', color: 'text-purple-700 bg-purple-50 border-purple-200' },
  DELIVERED: { label: 'Delivered', group: 'DELIVERY', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  DELIVERY_FAILED: { label: 'Delivery Failed', group: 'DELIVERY', color: 'text-red-700 bg-red-50 border-red-200' },

  // Exceptions
  EXCEPTION: { label: 'Exception / Issue', group: 'EXCEPTION', color: 'text-orange-700 bg-orange-50 border-orange-200' },
  CANCELLED: { label: 'Cancelled', group: 'EXCEPTION', color: 'text-slate-600 bg-slate-100 border-slate-300' },
  RETURNED: { label: 'Returned to Shipper', group: 'EXCEPTION', color: 'text-zinc-700 bg-zinc-100 border-zinc-300' },
};

/**
 * Valid state transitions for the shipment state machine
 */
export const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING_APPROVAL: ['APPROVED', 'REJECTED', 'CANCELLED'],
  APPROVED: ['PICKUP_INITIATED', 'HANDED_AT_ORIGIN_HUB', 'CANCELLED', 'EXCEPTION'],
  REJECTED: [],
  PICKUP_INITIATED: ['OUT_FOR_PICKUP', 'PICKUP_FAILED', 'CANCELLED'],
  OUT_FOR_PICKUP: ['PICKUP_COMPLETED', 'PICKUP_FAILED'],
  PICKUP_FAILED: ['PICKUP_INITIATED', 'CANCELLED', 'EXCEPTION'],
  PICKUP_COMPLETED: ['HANDED_AT_ORIGIN_HUB', 'EXCEPTION'],
  HANDED_AT_ORIGIN_HUB: ['AT_ORIGIN_HUB', 'DISPATCHED_ON_THE_WAY', 'EXCEPTION'],
  AT_ORIGIN_HUB: ['DISPATCHED_ON_THE_WAY', 'EXCEPTION'],
  DISPATCHED_ON_THE_WAY: ['AT_TRANSHIPMENT', 'REACHED_DEST_HUB', 'EXCEPTION'],
  AT_TRANSHIPMENT: ['JOURNEY_RESUMED', 'DISPATCHED_ON_THE_WAY', 'EXCEPTION'],
  JOURNEY_RESUMED: ['REACHED_DEST_HUB', 'EXCEPTION'],
  REACHED_DEST_HUB: ['UNLOADED_AT_DEST_HUB', 'EXCEPTION'],
  UNLOADED_AT_DEST_HUB: ['AT_DELIVERY_FACILITY', 'DELIVERY_INITIATED', 'DELIVERED', 'EXCEPTION'],
  AT_DELIVERY_FACILITY: ['DELIVERY_INITIATED', 'OUT_FOR_DELIVERY', 'EXCEPTION'],
  DELIVERY_INITIATED: ['OUT_FOR_DELIVERY', 'DELIVERY_FAILED', 'EXCEPTION'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'DELIVERY_FAILED'],
  DELIVERY_FAILED: ['DELIVERY_INITIATED', 'RETURNED', 'EXCEPTION'],
  DELIVERED: [],
  EXCEPTION: ['APPROVED', 'PICKUP_INITIATED', 'DISPATCHED_ON_THE_WAY', 'DELIVERY_INITIATED', 'RETURNED', 'CANCELLED'],
  CANCELLED: [],
  RETURNED: []
};

/**
 * Calculate net operational margin transparently without double-counting
 */
export function calculateNetMargin(commercial: {
  customerFreight: number;
  additionalCharges: number;
  discount: number;
  apsrtcFreight: number;
  pickupCost: number;
  deliveryCost: number;
  otherDirectCosts: number;
  pickupPaymentResponsibility: 'SHUDHI' | 'SUB_AGENT';
  deliveryPaymentResponsibility: 'SHUDHI' | 'SUB_AGENT';
  subAgentMargin: number;
}): { totalCustomerPayable: number; netOperationalMargin: number } {
  const totalCustomerPayable = Math.max(0, (commercial.customerFreight || 0) + (commercial.additionalCharges || 0) - (commercial.discount || 0));
  
  // External direct expenses paid by SHUDHI
  const shudhiPickupCost = commercial.pickupPaymentResponsibility === 'SHUDHI' ? (commercial.pickupCost || 0) : 0;
  const shudhiDeliveryCost = commercial.deliveryPaymentResponsibility === 'SHUDHI' ? (commercial.deliveryCost || 0) : 0;
  
  const netOperationalMargin = totalCustomerPayable
    - (commercial.apsrtcFreight || 0)
    - shudhiPickupCost
    - shudhiDeliveryCost
    - (commercial.otherDirectCosts || 0)
    - (commercial.subAgentMargin || 0);

  return { totalCustomerPayable, netOperationalMargin };
}

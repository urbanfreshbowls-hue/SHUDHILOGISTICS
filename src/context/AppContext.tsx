import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  ActiveUser,
  Booking,
  SubAgent,
  LocalPartner,
  SettlementRecord,
  AuditLog,
  WAConversation,
  SystemNotification,
  BookingStatus,
  UserRole,
  City,
  TimelineEvent,
  BookingSource
} from '../types';
import { StorageService } from '../services/storage';
import { STATUS_META, ALLOWED_TRANSITIONS, calculateNetMargin, CITIES } from '../constants/network';

interface PhotoModalState {
  isOpen: boolean;
  bookingId?: string;
  mode: 'PICKUP' | 'DELIVERY';
  title: string;
  onComplete?: (photoUrl: string, notes?: string, recipientName?: string) => void;
}

interface AppContextType {
  user: ActiveUser;
  setUser: (u: ActiveUser) => void;
  switchRole: (role: UserRole, id: string, name: string, city?: City) => void;
  currentView: string;
  setCurrentView: (view: string) => void;
  
  // Data
  bookings: Booking[];
  visibleBookings: Booking[]; // Filtered by current user's role and ID!
  agents: SubAgent[];
  partners: LocalPartner[];
  settlements: SettlementRecord[];
  auditLogs: AuditLog[];
  conversations: Record<string, WAConversation>;
  notifications: SystemNotification[];
  
  // Modals & UI
  selectedBooking: Booking | null;
  setSelectedBooking: (b: Booking | null) => void;
  photoModal: PhotoModalState;
  openPhotoModal: (bookingId: string, mode: 'PICKUP' | 'DELIVERY', title: string, onComplete: (photoUrl: string, notes?: string, recipientName?: string) => void) => void;
  closePhotoModal: () => void;
  toast: { message: string; type: 'success' | 'error' | 'info'; id: number } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  
  // Operations
  createBooking: (data: any) => Booking;
  approveBooking: (bookingId: string, apsrtcRef?: string, awb?: string) => void;
  rejectBooking: (bookingId: string, reason: string) => void;
  transitionStatus: (bookingId: string, newStatus: BookingStatus, notes?: string, meta?: any) => boolean;
  assignPickupPartner: (bookingId: string, partnerId: string) => void;
  assignDeliveryPartner: (bookingId: string, partnerId: string) => void;
  recordPickupProof: (bookingId: string, photoUrl: string, notes?: string) => void;
  recordDeliveryProof: (bookingId: string, photoUrl: string, recipientName: string, notes?: string) => void;
  reportFailure: (bookingId: string, stage: 'PICKUP' | 'DELIVERY', reason: string) => void;
  updateCommercial: (bookingId: string, updates: Partial<Booking['commercial']>) => void;
  
  // Directory & Settlements
  addAgent: (agent: SubAgent) => void;
  updateAgent: (id: string, updates: Partial<SubAgent>) => void;
  addPartner: (partner: LocalPartner) => void;
  updatePartner: (id: string, updates: Partial<LocalPartner>) => void;
  createSettlement: (data: Omit<SettlementRecord, 'id' | 'date'>) => SettlementRecord;
  
  // Notifications & Audit
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  addAuditLog: (action: string, recordId: string, details: string, prevStatus?: string, newStatus?: string) => void;
  
  // Reset
  resetAllData: () => void;
  setConversations: React.Dispatch<React.SetStateAction<Record<string, WAConversation>>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Current user: default to SHUDHI Admin
  const [user, setUser] = useState<ActiveUser>({
    id: 'SHUDHI-HQ',
    name: 'SHUDHI ADMIN (HQ)',
    role: 'SHUDHI_ADMIN'
  });

  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Persistent States
  const [bookings, setBookings] = useState<Booking[]>(() => StorageService.loadBookings());
  const [agents, setAgents] = useState<SubAgent[]>(() => StorageService.loadAgents());
  const [partners, setPartners] = useState<LocalPartner[]>(() => StorageService.loadPartners());
  const [settlements, setSettlements] = useState<SettlementRecord[]>(() => StorageService.loadSettlements());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => StorageService.loadAuditLogs());
  const [conversations, setConversations] = useState<Record<string, WAConversation>>(() => StorageService.loadConversations());

  // In-app Notifications
  const [notifications, setNotifications] = useState<SystemNotification[]>([
    {
      id: 'notif-1',
      timestamp: new Date().toISOString(),
      title: 'Pending Sub-Agent Approvals',
      message: '5 new sub-agent booking requests awaiting approval in the review queue.',
      type: 'warning',
      read: false,
      linkView: 'approval-queue'
    },
    {
      id: 'notif-2',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      title: 'APSRTC Transporter Dispatch',
      message: '14 consignments currently in mid-mile bus transit.',
      type: 'info',
      read: false,
      linkView: 'transit'
    }
  ]);

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; id: number } | null>(null);
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 4000);
  }, []);

  // Photo Upload Modal State
  const [photoModal, setPhotoModal] = useState<PhotoModalState>({
    isOpen: false,
    mode: 'PICKUP',
    title: 'Upload Proof'
  });

  const openPhotoModal = useCallback((bookingId: string, mode: 'PICKUP' | 'DELIVERY', title: string, onComplete: (photoUrl: string, notes?: string, recipientName?: string) => void) => {
    setPhotoModal({
      isOpen: true,
      bookingId,
      mode,
      title,
      onComplete
    });
  }, []);

  const closePhotoModal = useCallback(() => {
    setPhotoModal(prev => ({ ...prev, isOpen: false, onComplete: undefined }));
  }, []);

  // Persist to storage on change
  useEffect(() => { StorageService.saveBookings(bookings); }, [bookings]);
  useEffect(() => { StorageService.saveAgents(agents); }, [agents]);
  useEffect(() => { StorageService.savePartners(partners); }, [partners]);
  useEffect(() => { StorageService.saveSettlements(settlements); }, [settlements]);
  useEffect(() => { StorageService.saveAuditLogs(auditLogs); }, [auditLogs]);
  useEffect(() => { StorageService.saveConversations(conversations); }, [conversations]);

  // Add system notification helper
  const addNotification = useCallback((title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', linkView?: string, bookingId?: string) => {
    const newNotif: SystemNotification = {
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      title,
      message,
      type,
      read: false,
      linkView,
      bookingId
    };
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  // Add audit log helper
  const addAuditLog = useCallback((action: string, recordId: string, details: string, prevStatus?: string, newStatus?: string) => {
    const newLog: AuditLog = {
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action,
      recordId,
      previousStatus: prevStatus,
      newStatus: newStatus,
      details
    };
    setAuditLogs(prev => [newLog, ...prev]);
  }, [user]);

  // Derived Bookings: Strict Role-Based Access Control
  const visibleBookings = useMemo(() => {
    if (user.role === 'SHUDHI_ADMIN') {
      return bookings;
    }
    if (user.role === 'SUB_AGENT') {
      // Sub-agent ONLY sees bookings they created / own!
      return bookings.filter(b => b.agentId === user.id);
    }
    if (user.role === 'PARTNER') {
      // Partner ONLY sees bookings assigned specifically to them!
      return bookings.filter(b => b.assignedPickupPartnerId === user.id || b.assignedDeliveryPartnerId === user.id);
    }
    if (user.role === 'CUSTOMER') {
      // Customer sees bookings with matching phone or sender name
      return bookings.filter(b => b.sender.mobile === user.phone || b.receiver.mobile === user.phone);
    }
    return bookings;
  }, [bookings, user]);

  // Switch Role helper
  const switchRole = useCallback((role: UserRole, id: string, name: string, city?: City) => {
    setUser({ role, id, name, city });
    setSelectedBooking(null);
    setCurrentView('dashboard');
    showToast(`Switched identity to ${name} (${role})`, 'info');
  }, [showToast]);

  // Create Booking
  const createBooking = useCallback((data: any): Booking => {
    const id = `SHB${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    const originCity = data.originCity || (user.city || 'VISAKHAPATNAM');
    const destCity = data.destCity || 'HYDERABAD';
    
    // Determine agent ID & source
    let source: BookingSource = 'SUB_AGENT';
    let agentId = user.id;

    if (user.role === 'SHUDHI_ADMIN') {
      source = 'ADMIN_DIRECT';
      agentId = 'SHUDHI-HQ';
    } else if (user.role === 'CUSTOMER') {
      source = 'CUSTOMER_PORTAL';
      // Auto-assign to first agent in city
      const cityAgent = agents.find(a => a.city === originCity) || agents[0];
      agentId = cityAgent.id;
    }

    // Direct admin bookings are approved immediately; Sub-Agent & Customer bookings enter approval queue!
    const initialStatus: BookingStatus = user.role === 'SHUDHI_ADMIN' ? 'APPROVED' : 'PENDING_APPROVAL';

    const weightKg = Number(data.weightKg) || 5;
    const pieces = Number(data.pieces) || 1;
    const baseFreight = Number(data.customerFreight) || Math.round(100 + weightKg * 18);
    const additionalCharges = Number(data.additionalCharges) || 0;
    const discount = Number(data.discount) || 0;
    const apsrtcFreight = Number(data.apsrtcFreight) || Math.round(baseFreight * 0.45);
    const pickupCost = Number(data.pickupCost) || 45;
    const deliveryCost = Number(data.deliveryCost) || 55;
    
    // Sub-agent margin
    const agent = agents.find(a => a.id === agentId);
    let subAgentMargin = 0;
    if (agent) {
      subAgentMargin = agent.commissionType === 'PERCENTAGE'
        ? Math.round(baseFreight * (agent.commissionRate / 100))
        : agent.commissionRate;
    }

    const { totalCustomerPayable, netOperationalMargin } = calculateNetMargin({
      customerFreight: baseFreight,
      additionalCharges,
      discount,
      apsrtcFreight,
      pickupCost,
      deliveryCost,
      otherDirectCosts: 0,
      pickupPaymentResponsibility: 'SHUDHI',
      deliveryPaymentResponsibility: 'SHUDHI',
      subAgentMargin
    });

    const hasImmediateApsrtc = initialStatus === 'APPROVED';
    const apsrtcRef = hasImmediateApsrtc ? `APS-${originCity.substring(0, 3)}-${Math.floor(1000 + Math.random() * 9000)}` : null;
    const awb = hasImmediateApsrtc ? `AWB789${Math.floor(1000 + Math.random() * 9000)}` : null;

    const timeline: TimelineEvent[] = [
      {
        id: `TL-${id}-1`,
        timestamp: now.toISOString(),
        status: initialStatus,
        statusLabel: initialStatus === 'APPROVED' ? 'Direct Booking Created & Approved' : 'Booking Request Submitted',
        actorName: user.name,
        actorRole: user.role,
        notes: `Consignment created via ${source.replace('_', ' ')} for ${weightKg}kg (${data.packageType || 'Box'}).`,
        location: originCity
      }
    ];

    if (initialStatus === 'APPROVED') {
      timeline.push({
        id: `TL-${id}-2`,
        timestamp: now.toISOString(),
        status: 'APPROVED',
        statusLabel: 'Approved for Logistics Network',
        actorName: 'SHUDHI Central Operations',
        actorRole: 'SHUDHI_ADMIN',
        notes: `APSRTC Ref allocated: ${apsrtcRef}, AWB: ${awb}`,
        location: originCity
      });
    }

    const newBooking: Booking = {
      id,
      date: dateStr,
      source,
      agentId,
      originCity,
      destCity,
      status: initialStatus,
      apsrtcRef,
      awb,
      sender: {
        name: data.senderName || 'Sender',
        mobile: data.senderMobile || '9876543210',
        address: data.senderAddress || 'Origin Address',
        pincode: data.senderPincode || '500001',
        pickupType: data.pickupType || 'DOOR_PICKUP'
      },
      receiver: {
        name: data.receiverName || 'Receiver',
        mobile: data.receiverMobile || '9876543211',
        address: data.receiverAddress || 'Destination Address',
        pincode: data.receiverPincode || '500002',
        deliveryType: data.deliveryType || 'DOOR_DELIVERY'
      },
      shipment: {
        type: data.packageType || 'Carton Box',
        pieces,
        weightKg,
        volumetricWeightKg: data.volumetricWeightKg ? Number(data.volumetricWeightKg) : Math.round(weightKg * 1.15),
        declaredValue: Number(data.declaredValue) || 1000,
        description: data.description || 'General Parcel Consignment',
        photos: data.photos || [],
        specialInstructions: data.specialInstructions
      },
      commercial: {
        customerFreight: baseFreight,
        additionalCharges,
        discount,
        totalCustomerPayable,
        paymentMode: data.paymentMode || 'CASH',
        collectionStatus: data.paymentMode === 'UPI_ONLINE' ? 'COLLECTED' : 'PENDING',
        apsrtcFreight,
        apsrtcPaymentStatus: 'PENDING',
        pickupCost,
        pickupPaymentResponsibility: 'SHUDHI',
        pickupPaymentStatus: 'PENDING',
        deliveryCost,
        deliveryPaymentResponsibility: 'SHUDHI',
        deliveryPaymentStatus: 'PENDING',
        otherDirectCosts: 0,
        subAgentMargin,
        subAgentMarginSettled: false,
        netOperationalMargin
      },
      timeline
    };

    setBookings(prev => [newBooking, ...prev]);
    addAuditLog('CREATE_BOOKING', id, `Created booking ${id} (${originCity} -> ${destCity})`, undefined, initialStatus);
    
    if (initialStatus === 'PENDING_APPROVAL') {
      addNotification('New Booking Requires Approval', `Booking ${id} submitted by ${user.name} requires approval.`, 'warning', 'approval-queue', id);
    }
    
    showToast(`Booking ${id} created successfully!`, 'success');
    return newBooking;
  }, [user, agents, addAuditLog, addNotification, showToast]);

  // Approve Booking
  const approveBooking = useCallback((bookingId: string, apsrtcRefInput?: string, awbInput?: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const ref = apsrtcRefInput || `APS-${booking.originCity.substring(0, 3)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const awb = awbInput || `AWB789${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    const newEvent: TimelineEvent = {
      id: `TL-${bookingId}-${Date.now()}`,
      timestamp: now,
      status: 'APPROVED',
      statusLabel: 'Booking Approved & Consignment Registered',
      actorName: user.name,
      actorRole: user.role,
      notes: `Approved by SHUDHI Central. Transporter Ref: ${ref}, AWB: ${awb}`,
      location: booking.originCity
    };

    setBookings(prev => prev.map(b => {
      if (b.id !== bookingId) return b;
      return {
        ...b,
        status: 'APPROVED',
        apsrtcRef: ref,
        awb: awb,
        rejectionReason: null,
        timeline: [...b.timeline, newEvent]
      };
    }));

    addAuditLog('APPROVE_BOOKING', bookingId, `Approved booking ${bookingId}. Transporter Ref: ${ref}`, 'PENDING_APPROVAL', 'APPROVED');
    addNotification('Booking Approved', `Booking ${bookingId} has been approved and moved to First-Mile queue.`, 'success', 'pickups', bookingId);
    showToast(`Booking ${bookingId} approved successfully!`, 'success');
  }, [bookings, user, addAuditLog, addNotification, showToast]);

  // Reject Booking
  const rejectBooking = useCallback((bookingId: string, reason: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const now = new Date().toISOString();
    const newEvent: TimelineEvent = {
      id: `TL-${bookingId}-${Date.now()}`,
      timestamp: now,
      status: 'REJECTED',
      statusLabel: 'Booking Rejected',
      actorName: user.name,
      actorRole: user.role,
      notes: `Reason: ${reason}`,
      location: booking.originCity
    };

    setBookings(prev => prev.map(b => {
      if (b.id !== bookingId) return b;
      return {
        ...b,
        status: 'REJECTED',
        rejectionReason: reason,
        timeline: [...b.timeline, newEvent]
      };
    }));

    addAuditLog('REJECT_BOOKING', bookingId, `Rejected booking ${bookingId}. Reason: ${reason}`, booking.status, 'REJECTED');
    showToast(`Booking ${bookingId} rejected.`, 'info');
  }, [bookings, user, addAuditLog, showToast]);

  // Transition Status (Enforcing state machine integrity)
  const transitionStatus = useCallback((bookingId: string, newStatus: BookingStatus, notes?: string, meta?: any): boolean => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return false;

    // Validate transition
    const allowed = ALLOWED_TRANSITIONS[booking.status] || [];
    if (!allowed.includes(newStatus) && user.role !== 'SHUDHI_ADMIN') {
      showToast(`Invalid transition from ${booking.status} to ${newStatus}`, 'error');
      return false;
    }

    const now = new Date().toISOString();
    const metaInfo = STATUS_META[newStatus];

    const newEvent: TimelineEvent = {
      id: `TL-${bookingId}-${Date.now()}`,
      timestamp: now,
      status: newStatus,
      statusLabel: metaInfo?.label || newStatus,
      actorName: user.name,
      actorRole: user.role,
      notes: notes || `Shipment status updated to ${metaInfo?.label || newStatus}.`,
      location: meta?.location || (newStatus.includes('DEST') ? booking.destCity : booking.originCity),
      photoUrl: meta?.photoUrl
    };

    setBookings(prev => prev.map(b => {
      if (b.id !== bookingId) return b;
      const updated: Booking = {
        ...b,
        status: newStatus,
        timeline: [...b.timeline, newEvent]
      };

      if (meta?.pickupProof) updated.pickupProof = meta.pickupProof;
      if (meta?.deliveryProof) updated.deliveryProof = meta.deliveryProof;
      if (meta?.failureReason) updated.failureReason = meta.failureReason;
      if (meta?.transporterStatusNotes) updated.transporterStatusNotes = meta.transporterStatusNotes;

      // Update commercial settlement flags when reached final milestones
      if (newStatus === 'DELIVERED') {
        updated.commercial = {
          ...updated.commercial,
          collectionStatus: 'COLLECTED',
          collectedAt: now,
          deliveryPaymentStatus: 'PAID',
          subAgentMarginSettled: true
        };
      }

      return updated;
    }));

    addAuditLog('STATUS_CHANGE', bookingId, `Status transitioned from ${booking.status} to ${newStatus}. ${notes || ''}`, booking.status, newStatus);
    showToast(`Status updated to ${metaInfo?.label || newStatus}`, 'success');
    return true;
  }, [bookings, user, addAuditLog, showToast]);

  // Assign Pickup Partner
  const assignPickupPartner = useCallback((bookingId: string, partnerId: string) => {
    const partner = partners.find(p => p.id === partnerId);
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking || !partner) return;

    const now = new Date().toISOString();
    const newEvent: TimelineEvent = {
      id: `TL-${bookingId}-${Date.now()}`,
      timestamp: now,
      status: 'PICKUP_INITIATED',
      statusLabel: `Pickup Assigned to ${partner.name}`,
      actorName: user.name,
      actorRole: user.role,
      notes: `Task assigned to ${partner.name} (${partner.phone}). Task ID: TSK-${bookingId}`,
      location: booking.originCity
    };

    setBookings(prev => prev.map(b => {
      if (b.id !== bookingId) return b;
      return {
        ...b,
        status: 'PICKUP_INITIATED',
        assignedPickupPartnerId: partnerId,
        timeline: [...b.timeline, newEvent]
      };
    }));

    // Auto send WhatsApp dispatch message to partner
    const taskMsg = `📦 *NEW PICKUP TASK ASSIGNED*\nTask: TSK-${bookingId}\nBooking ID: ${bookingId}\nCustomer: ${booking.sender.name} (${booking.sender.mobile})\nAddress: ${booking.sender.address}, ${booking.originCity}\nPackages: ${booking.shipment.pieces}x ${booking.shipment.type} (${booking.shipment.weightKg}kg)\n\nReply:\n*ACCEPT ${bookingId}* or *REJECT ${bookingId}*`;
    
    setConversations(prev => {
      const partnerKey = `PARTNER_${partner.phone}`;
      const existing = prev[partnerKey] || {
        identity: partnerKey,
        phone: partner.phone,
        roleType: 'PARTNER',
        mode: 'field_ops',
        context: {},
        lastUpdated: now,
        messages: []
      };
      return {
        ...prev,
        [partnerKey]: {
          ...existing,
          lastUpdated: now,
          messages: [
            ...existing.messages,
            { id: `m-${Date.now()}`, text: taskMsg, sender: 'bot', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
          ]
        }
      };
    });

    addAuditLog('ASSIGN_PICKUP', bookingId, `Assigned pickup partner ${partner.name} (${partnerId})`, booking.status, 'PICKUP_INITIATED');
    showToast(`Assigned pickup to ${partner.name} & WhatsApp notification sent!`, 'success');
  }, [bookings, partners, user, addAuditLog, showToast]);

  // Assign Delivery Partner
  const assignDeliveryPartner = useCallback((bookingId: string, partnerId: string) => {
    const partner = partners.find(p => p.id === partnerId);
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking || !partner) return;

    const now = new Date().toISOString();
    const newEvent: TimelineEvent = {
      id: `TL-${bookingId}-${Date.now()}`,
      timestamp: now,
      status: 'DELIVERY_INITIATED',
      statusLabel: `Delivery Assigned to ${partner.name}`,
      actorName: user.name,
      actorRole: user.role,
      notes: `Task assigned to ${partner.name} (${partner.phone}). Task ID: DLY-${bookingId}`,
      location: booking.destCity
    };

    setBookings(prev => prev.map(b => {
      if (b.id !== bookingId) return b;
      return {
        ...b,
        status: 'DELIVERY_INITIATED',
        assignedDeliveryPartnerId: partnerId,
        timeline: [...b.timeline, newEvent]
      };
    }));

    // Auto send WhatsApp dispatch message to partner
    const collectAmount = booking.commercial.paymentMode === 'TO_PAY_COD' ? booking.commercial.totalCustomerPayable : 0;
    const taskMsg = `🚚 *NEW DELIVERY TASK ASSIGNED*\nTask: DLY-${bookingId}\nBooking ID: ${bookingId}\nReceiver: ${booking.receiver.name} (${booking.receiver.mobile})\nAddress: ${booking.receiver.address}, ${booking.destCity}\nCollect Amount: ₹${collectAmount} ${collectAmount > 0 ? '(COD)' : '(Prepaid)'}\n\nReply:\n*ACCEPT ${bookingId}* or *REJECT ${bookingId}*`;
    
    setConversations(prev => {
      const partnerKey = `PARTNER_${partner.phone}`;
      const existing = prev[partnerKey] || {
        identity: partnerKey,
        phone: partner.phone,
        roleType: 'PARTNER',
        mode: 'field_ops',
        context: {},
        lastUpdated: now,
        messages: []
      };
      return {
        ...prev,
        [partnerKey]: {
          ...existing,
          lastUpdated: now,
          messages: [
            ...existing.messages,
            { id: `m-${Date.now()}`, text: taskMsg, sender: 'bot', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
          ]
        }
      };
    });

    addAuditLog('ASSIGN_DELIVERY', bookingId, `Assigned delivery partner ${partner.name} (${partnerId})`, booking.status, 'DELIVERY_INITIATED');
    showToast(`Assigned delivery to ${partner.name} & WhatsApp notification sent!`, 'success');
  }, [bookings, partners, user, addAuditLog, showToast]);

  // Record Pickup Proof
  const recordPickupProof = useCallback((bookingId: string, photoUrl: string, notes?: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const now = new Date().toISOString();
    const proof = {
      photoUrl,
      capturedAt: now,
      capturedBy: user.name,
      notes: notes || 'Proof of pickup verified.'
    };

    const newEvent: TimelineEvent = {
      id: `TL-${bookingId}-${Date.now()}`,
      timestamp: now,
      status: 'PICKUP_COMPLETED',
      statusLabel: 'Pickup Completed (Proof Uploaded)',
      actorName: user.name,
      actorRole: user.role,
      notes: notes || 'Consignment picked up and visual inspection completed.',
      location: booking.originCity,
      photoUrl
    };

    setBookings(prev => prev.map(b => {
      if (b.id !== bookingId) return b;
      return {
        ...b,
        status: 'PICKUP_COMPLETED',
        pickupProof: proof,
        failureReason: null,
        timeline: [...b.timeline, newEvent]
      };
    }));

    addAuditLog('PICKUP_PROOF', bookingId, 'Uploaded proof of pickup photograph and marked completed.', booking.status, 'PICKUP_COMPLETED');
    showToast('Proof of pickup uploaded and task completed!', 'success');
  }, [bookings, user, addAuditLog, showToast]);

  // Record Delivery Proof
  const recordDeliveryProof = useCallback((bookingId: string, photoUrl: string, recipientName: string, notes?: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const now = new Date().toISOString();
    const proof = {
      photoUrl,
      recipientName: recipientName || booking.receiver.name,
      deliveredAt: now,
      deliveredBy: user.name,
      notes: notes || 'Delivered with signature/photo confirmation.'
    };

    const newEvent: TimelineEvent = {
      id: `TL-${bookingId}-${Date.now()}`,
      timestamp: now,
      status: 'DELIVERED',
      statusLabel: 'Delivered (Proof of Delivery Uploaded)',
      actorName: user.name,
      actorRole: user.role,
      notes: `Handed over to ${proof.recipientName}. ${notes || ''}`,
      location: booking.destCity,
      photoUrl
    };

    setBookings(prev => prev.map(b => {
      if (b.id !== bookingId) return b;
      return {
        ...b,
        status: 'DELIVERED',
        deliveryProof: proof,
        failureReason: null,
        commercial: {
          ...b.commercial,
          collectionStatus: 'COLLECTED',
          collectedAt: now,
          deliveryPaymentStatus: 'PAID',
          subAgentMarginSettled: true
        },
        timeline: [...b.timeline, newEvent]
      };
    }));

    addAuditLog('DELIVERY_PROOF', bookingId, `Uploaded proof of delivery to recipient ${recipientName}.`, booking.status, 'DELIVERED');
    addNotification('Shipment Delivered', `Shipment ${bookingId} successfully delivered to ${recipientName}.`, 'success', 'bookings', bookingId);
    showToast('Proof of delivery uploaded and marked as DELIVERED!', 'success');
  }, [bookings, user, addAuditLog, addNotification, showToast]);

  // Report Failure
  const reportFailure = useCallback((bookingId: string, stage: 'PICKUP' | 'DELIVERY', reason: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const nextStatus: BookingStatus = stage === 'PICKUP' ? 'PICKUP_FAILED' : 'DELIVERY_FAILED';
    const now = new Date().toISOString();

    const newEvent: TimelineEvent = {
      id: `TL-${bookingId}-${Date.now()}`,
      timestamp: now,
      status: nextStatus,
      statusLabel: stage === 'PICKUP' ? 'First-Mile Pickup Failed' : 'Last-Mile Delivery Failed',
      actorName: user.name,
      actorRole: user.role,
      notes: `Failure Reason: ${reason}`,
      location: stage === 'PICKUP' ? booking.originCity : booking.destCity
    };

    setBookings(prev => prev.map(b => {
      if (b.id !== bookingId) return b;
      return {
        ...b,
        status: nextStatus,
        failureReason: reason,
        timeline: [...b.timeline, newEvent]
      };
    }));

    addAuditLog(stage === 'PICKUP' ? 'PICKUP_FAILED' : 'DELIVERY_FAILED', bookingId, `Reported failure: ${reason}`, booking.status, nextStatus);
    addNotification(`${stage} Operation Failed`, `Booking ${bookingId}: ${reason}`, 'error', stage === 'PICKUP' ? 'pickups' : 'deliveries', bookingId);
    showToast(`${stage} failure reported: ${reason}`, 'error');
  }, [bookings, user, addAuditLog, addNotification, showToast]);

  // Update Commercial
  const updateCommercial = useCallback((bookingId: string, updates: Partial<Booking['commercial']>) => {
    setBookings(prev => prev.map(b => {
      if (b.id !== bookingId) return b;
      const combined = { ...b.commercial, ...updates };
      const { totalCustomerPayable, netOperationalMargin } = calculateNetMargin({
        customerFreight: combined.customerFreight,
        additionalCharges: combined.additionalCharges,
        discount: combined.discount,
        apsrtcFreight: combined.apsrtcFreight,
        pickupCost: combined.pickupCost,
        deliveryCost: combined.deliveryCost,
        otherDirectCosts: combined.otherDirectCosts,
        pickupPaymentResponsibility: combined.pickupPaymentResponsibility,
        deliveryPaymentResponsibility: combined.deliveryPaymentResponsibility,
        subAgentMargin: combined.subAgentMargin
      });
      return {
        ...b,
        commercial: {
          ...combined,
          totalCustomerPayable,
          netOperationalMargin
        }
      };
    }));
    addAuditLog('UPDATE_COMMERCIAL', bookingId, 'Updated commercial and pricing details.');
    showToast('Commercial breakdown updated!', 'success');
  }, [addAuditLog, showToast]);

  // Sub-Agent management
  const addAgent = useCallback((newAgent: SubAgent) => {
    setAgents(prev => [newAgent, ...prev]);
    addAuditLog('ADD_AGENT', newAgent.id, `Created sub-agent account: ${newAgent.name} (${newAgent.city})`);
    showToast(`Added sub-agent ${newAgent.name}`, 'success');
  }, [addAuditLog, showToast]);

  const updateAgent = useCallback((agentId: string, updates: Partial<SubAgent>) => {
    setAgents(prev => prev.map(a => a.id === agentId ? { ...a, ...updates } : a));
    addAuditLog('UPDATE_AGENT', agentId, `Updated sub-agent profile details.`);
    showToast(`Updated sub-agent ${agentId}`, 'success');
  }, [addAuditLog, showToast]);

  // Partner management
  const addPartner = useCallback((newPartner: LocalPartner) => {
    setPartners(prev => [newPartner, ...prev]);
    addAuditLog('ADD_PARTNER', newPartner.id, `Created local partner account: ${newPartner.name} (${newPartner.city})`);
    showToast(`Added local partner ${newPartner.name}`, 'success');
  }, [addAuditLog, showToast]);

  const updatePartner = useCallback((partnerId: string, updates: Partial<LocalPartner>) => {
    setPartners(prev => prev.map(p => p.id === partnerId ? { ...p, ...updates } : p));
    addAuditLog('UPDATE_PARTNER', partnerId, `Updated local partner details.`);
    showToast(`Updated partner ${partnerId}`, 'success');
  }, [addAuditLog, showToast]);

  // Create Settlement
  const createSettlement = useCallback((data: Omit<SettlementRecord, 'id' | 'date'>): SettlementRecord => {
    const id = `SET-${data.entityType.substring(0, 3)}-${Date.now().toString().slice(-4)}`;
    const newRecord: SettlementRecord = {
      ...data,
      id,
      date: new Date().toISOString().split('T')[0]
    };
    setSettlements(prev => [newRecord, ...prev]);
    addAuditLog('RECORD_SETTLEMENT', id, `Recorded settlement of ₹${data.amount.toLocaleString()} for ${data.entityName} (Ref: ${data.paymentReference})`);
    showToast(`Settlement ${id} for ₹${data.amount.toLocaleString()} recorded successfully!`, 'success');
    return newRecord;
  }, [addAuditLog, showToast]);

  // Notifications
  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Reset demo data
  const resetAllData = useCallback(() => {
    const fresh = StorageService.resetAllData();
    setBookings(fresh.bookings);
    setAgents(fresh.agents);
    setPartners(fresh.partners);
    setSettlements(fresh.settlements);
    setAuditLogs(fresh.auditLogs);
    setConversations(fresh.conversations);
    setSelectedBooking(null);
    setCurrentView('dashboard');
    showToast('All system records reset to pristine demo state!', 'info');
  }, [showToast]);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        switchRole,
        currentView,
        setCurrentView,
        bookings,
        visibleBookings,
        agents,
        partners,
        settlements,
        auditLogs,
        conversations,
        notifications,
        selectedBooking,
        setSelectedBooking,
        photoModal,
        openPhotoModal,
        closePhotoModal,
        toast,
        showToast,
        createBooking,
        approveBooking,
        rejectBooking,
        transitionStatus,
        assignPickupPartner,
        assignDeliveryPartner,
        recordPickupProof,
        recordDeliveryProof,
        reportFailure,
        updateCommercial,
        addAgent,
        updateAgent,
        addPartner,
        updatePartner,
        createSettlement,
        markNotificationRead,
        clearAllNotifications,
        addAuditLog,
        resetAllData,
        setConversations
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

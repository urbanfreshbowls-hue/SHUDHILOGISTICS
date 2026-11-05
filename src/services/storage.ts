import { Booking, SubAgent, LocalPartner, SettlementRecord, AuditLog, WAConversation, BookingStatus, City, UserRole, TimelineEvent, CodEventRecord, ApsrtcLiabilityRecord, PaymentStatus } from '../types';
import { CITIES, INITIAL_SUB_AGENTS, INITIAL_LOCAL_PARTNERS, calculateNetMargin, STATUS_META } from '../constants/network';

const STORAGE_KEYS = {
  BOOKINGS: 'shudhi_v2_bookings',
  AGENTS: 'shudhi_v2_agents',
  PARTNERS: 'shudhi_v2_partners',
  SETTLEMENTS: 'shudhi_v2_settlements',
  AUDIT_LOGS: 'shudhi_v2_audit_logs',
  CONVERSATIONS: 'shudhi_v2_conversations',
  LAST_SEED_VERSION: 'shudhi_v2_seed_version_1.0'
};

const SAMPLE_CUSTOMERS = [
  { name: 'Dr. Ramesh Chandra', phone: '9849012345', address: 'Plot 18, Lawson\'s Bay Colony', city: 'VISAKHAPATNAM', pin: '530017' },
  { name: 'Smt. Lakshmi Devi', phone: '9849023456', address: 'D.No 4-12-8, Danavaipeta', city: 'RAJAMAHENDRAVARAM', pin: '533103' },
  { name: 'Venkateswara Rao', phone: '9849034567', address: '29-14-5, Governorpet', city: 'VIJAYAWADA', pin: '520002' },
  { name: 'Prasad Krishna', phone: '9849045678', address: 'Flat 402, Sai Balaji Enclave, Madhapur', city: 'HYDERABAD', pin: '500081' },
  { name: 'Ananya Sharma', phone: '9849056789', address: 'Flat 101, Green Meadows, MVP Colony', city: 'VISAKHAPATNAM', pin: '530017' },
  { name: 'Satyanarayana Murthy', phone: '9849067890', address: 'Kotipalli Ghat Road', city: 'RAJAMAHENDRAVARAM', pin: '533101' },
  { name: 'Chandra Sekhar', phone: '9849078901', address: 'MG Road, Opposite PVP Mall', city: 'VIJAYAWADA', pin: '520010' },
  { name: 'Srinivas Reddy', phone: '9849089012', address: 'H.No 3-6-289, Himayatnagar', city: 'HYDERABAD', pin: '500029' },
  { name: 'Madhavi Latha', phone: '9849090123', address: 'Sector 6, Steel Plant Township', city: 'VISAKHAPATNAM', pin: '530032' },
  { name: 'Kalyan Kumar', phone: '9849001234', address: 'Ring Road, Auto Nagar', city: 'VIJAYAWADA', pin: '520007' }
];

const SAMPLE_DESCRIPTIONS = [
  'Handloom Pochampally Sarees (4 pcs)',
  'Spare Machine Valves and Industrial Bearings',
  'Organic Mango Preserves and Pickles Box',
  'Commercial Project Documents & Tenders',
  'Handicraft Brass Artifacts and Idols',
  'Medical Diagnostics Test Equipment Kits',
  'Packaged Gourmet Sweet Boxes (10 boxes)',
  'Electronics Printed Circuit Boards (PCBs)',
  'Agricultural Hybrid Seeds in Canvas Bags',
  'Cotton Yarns & Textile Sample Bolts'
];

export function generateSeedBookings(): Booking[] {
  const bookings: Booking[] = [];
  const today = new Date();

  // Helper to make past ISO timestamps
  const getPastDate = (daysAgo: number, hoursAgo: number = 0) => {
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgo);
    d.setHours(d.getHours() - hoursAgo);
    return d.toISOString();
  };

  const statusDistribution: { status: BookingStatus; count: number }[] = [
    { status: 'PENDING_APPROVAL', count: 5 },
    { status: 'APPROVED', count: 4 },
    { status: 'PICKUP_INITIATED', count: 3 },
    { status: 'OUT_FOR_PICKUP', count: 2 },
    { status: 'PICKUP_COMPLETED', count: 2 },
    { status: 'PICKUP_FAILED', count: 1 },
    { status: 'HANDED_AT_ORIGIN_HUB', count: 3 },
    { status: 'AT_ORIGIN_HUB', count: 3 },
    { status: 'DISPATCHED_ON_THE_WAY', count: 4 },
    { status: 'AT_TRANSHIPMENT', count: 2 },
    { status: 'REACHED_DEST_HUB', count: 3 },
    { status: 'UNLOADED_AT_DEST_HUB', count: 2 },
    { status: 'AT_DELIVERY_FACILITY', count: 3 },
    { status: 'DELIVERY_INITIATED', count: 3 },
    { status: 'OUT_FOR_DELIVERY', count: 2 },
    { status: 'DELIVERED', count: 10 },
    { status: 'DELIVERY_FAILED', count: 1 },
    { status: 'EXCEPTION', count: 2 }
  ];

  let idCounter = 1001;

  for (const { status, count } of statusDistribution) {
    for (let i = 0; i < count; i++) {
      const id = `SHB${idCounter++}`;
      const senderIdx = (idCounter + i) % SAMPLE_CUSTOMERS.length;
      let receiverIdx = (senderIdx + 3) % SAMPLE_CUSTOMERS.length;
      if (SAMPLE_CUSTOMERS[senderIdx].city === SAMPLE_CUSTOMERS[receiverIdx].city) {
        receiverIdx = (receiverIdx + 1) % SAMPLE_CUSTOMERS.length;
      }

      const senderCust = SAMPLE_CUSTOMERS[senderIdx];
      const receiverCust = SAMPLE_CUSTOMERS[receiverIdx];
      const originCity = senderCust.city as City;
      const destCity = receiverCust.city as City;

      // Assign agent from origin city
      const cityAgents = INITIAL_SUB_AGENTS.filter(a => a.city === originCity);
      const chosenAgent = cityAgents.length > 0 ? cityAgents[i % cityAgents.length] : INITIAL_SUB_AGENTS[0];
      const source = (idCounter % 5 === 0) ? 'ADMIN_DIRECT' : (idCounter % 7 === 0 ? 'CUSTOMER_WHATSAPP' : (idCounter % 9 === 0 ? 'CUSTOMER_PORTAL' : 'SUB_AGENT'));

      // Assigned partners
      const originPartners = INITIAL_LOCAL_PARTNERS.filter(p => p.city === originCity);
      const destPartners = INITIAL_LOCAL_PARTNERS.filter(p => p.city === destCity);
      
      const pickupPartner = originPartners.length > 0 ? originPartners[0].id : 'VSP-P1';
      const deliveryPartner = destPartners.length > 0 ? destPartners[0].id : 'HYD-P1';

      // Commercial calculation
      const weightKg = [2.5, 5, 8.5, 12, 18, 25, 40][(idCounter + i) % 7];
      const pieces = [1, 1, 2, 3, 5][(idCounter + i) % 5];
      const baseFreight = Math.round(100 + weightKg * 18);
      const additionalCharges = (idCounter % 4 === 0) ? 50 : 0;
      const discount = (idCounter % 6 === 0) ? 20 : 0;
      const apsrtcFreight = Math.round(baseFreight * 0.45);
      const pickupCost = 45;
      const deliveryCost = 55;
      const otherCosts = (idCounter % 8 === 0) ? 25 : 0;
      const subAgentMargin = Math.round(baseFreight * (chosenAgent.commissionRate / 100));

      const { totalCustomerPayable, netOperationalMargin } = calculateNetMargin({
        customerFreight: baseFreight,
        additionalCharges,
        discount,
        apsrtcFreight,
        pickupCost,
        deliveryCost,
        otherDirectCosts: otherCosts,
        pickupPaymentResponsibility: 'SHUDHI',
        deliveryPaymentResponsibility: 'SHUDHI',
        subAgentMargin
      });

      const paymentMode = (['CASH', 'UPI_ONLINE', 'TO_PAY_COD', 'CREDIT_ACCOUNT'] as const)[(idCounter + i) % 4];
      const isDeliveredOrTransit = ['DELIVERED', 'OUT_FOR_DELIVERY', 'REACHED_DEST_HUB', 'DISPATCHED_ON_THE_WAY'].includes(status);
      const collectionStatus = isDeliveredOrTransit ? (paymentMode === 'TO_PAY_COD' && status !== 'DELIVERED' ? 'PENDING' : 'COLLECTED') : (paymentMode === 'UPI_ONLINE' ? 'COLLECTED' : 'PENDING');

      // Transporter ref
      const hasApsrtc = !['PENDING_APPROVAL', 'REJECTED'].includes(status);
      const apsrtcRef = hasApsrtc ? `APS-${originCity.substring(0, 3)}-${1000 + idCounter}` : null;
      const awb = hasApsrtc ? `AWB789${idCounter}` : null;

      // Build consistent timeline events
      const timeline: TimelineEvent[] = [];
      const creationDaysAgo = Math.min(10, Math.max(1, count - i + 2));
      const createdAt = getPastDate(creationDaysAgo, 8);

      timeline.push({
        id: `TL-${id}-1`,
        timestamp: createdAt,
        status: 'PENDING_APPROVAL',
        statusLabel: 'Booking Submitted',
        actorName: source === 'ADMIN_DIRECT' ? 'SHUDHI ADMIN' : (source === 'SUB_AGENT' ? chosenAgent.name : senderCust.name),
        actorRole: source === 'ADMIN_DIRECT' ? 'SHUDHI_ADMIN' : (source === 'SUB_AGENT' ? 'SUB_AGENT' : 'CUSTOMER'),
        notes: `Consignment created via ${source.replace('_', ' ')} for ${weightKg}kg (${pieces} pieces).`,
        location: originCity
      });

      if (status !== 'PENDING_APPROVAL') {
        if (status === 'REJECTED') {
          timeline.push({
            id: `TL-${id}-2`,
            timestamp: getPastDate(creationDaysAgo - 1, 4),
            status: 'REJECTED',
            statusLabel: 'Booking Rejected',
            actorName: 'SHUDHI ADMIN',
            actorRole: 'SHUDHI_ADMIN',
            notes: 'Packaging declared hazardous/prohibited or destination unserviceable.',
            location: originCity
          });
        } else {
          timeline.push({
            id: `TL-${id}-2`,
            timestamp: getPastDate(creationDaysAgo - 1, 2),
            status: 'APPROVED',
            statusLabel: 'Booking Approved & APSRTC Consignment Generated',
            actorName: 'SHUDHI Central Operations',
            actorRole: 'SHUDHI_ADMIN',
            notes: `Consignment verified. APSRTC Transporter Ref: ${apsrtcRef}, AWB: ${awb}`,
            location: originCity
          });

          if (['PICKUP_INITIATED', 'OUT_FOR_PICKUP', 'PICKUP_COMPLETED', 'PICKUP_FAILED', 'HANDED_AT_ORIGIN_HUB', 'AT_ORIGIN_HUB', 'DISPATCHED_ON_THE_WAY', 'AT_TRANSHIPMENT', 'JOURNEY_RESUMED', 'REACHED_DEST_HUB', 'UNLOADED_AT_DEST_HUB', 'AT_DELIVERY_FACILITY', 'DELIVERY_INITIATED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'DELIVERY_FAILED'].includes(status)) {
            timeline.push({
              id: `TL-${id}-3`,
              timestamp: getPastDate(creationDaysAgo - 2, 4),
              status: 'PICKUP_INITIATED',
              statusLabel: 'Pickup Partner Assigned',
              actorName: 'SHUDHI Dispatch Desk',
              actorRole: 'SHUDHI_ADMIN',
              notes: `Task assigned to local pickup partner (${pickupPartner}). Notification dispatched via WhatsApp.`,
              location: originCity
            });
          }

          if (['OUT_FOR_PICKUP', 'PICKUP_COMPLETED', 'PICKUP_FAILED', 'HANDED_AT_ORIGIN_HUB', 'AT_ORIGIN_HUB', 'DISPATCHED_ON_THE_WAY', 'AT_TRANSHIPMENT', 'JOURNEY_RESUMED', 'REACHED_DEST_HUB', 'UNLOADED_AT_DEST_HUB', 'AT_DELIVERY_FACILITY', 'DELIVERY_INITIATED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'DELIVERY_FAILED'].includes(status)) {
            timeline.push({
              id: `TL-${id}-4`,
              timestamp: getPastDate(creationDaysAgo - 2, 2),
              status: 'OUT_FOR_PICKUP',
              statusLabel: 'Rider Out for First-Mile Pickup',
              actorName: 'Local Pickup Partner',
              actorRole: 'PARTNER',
              notes: 'Partner accepted assignment and en-route to customer address.',
              location: originCity
            });
          }

          if (['PICKUP_COMPLETED', 'HANDED_AT_ORIGIN_HUB', 'AT_ORIGIN_HUB', 'DISPATCHED_ON_THE_WAY', 'AT_TRANSHIPMENT', 'JOURNEY_RESUMED', 'REACHED_DEST_HUB', 'UNLOADED_AT_DEST_HUB', 'AT_DELIVERY_FACILITY', 'DELIVERY_INITIATED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(status)) {
            timeline.push({
              id: `TL-${id}-5`,
              timestamp: getPastDate(creationDaysAgo - 3, 6),
              status: 'PICKUP_COMPLETED',
              statusLabel: 'First-Mile Pickup Completed',
              actorName: 'Local Pickup Partner',
              actorRole: 'PARTNER',
              notes: 'Shipment received from customer. Visual inspection verified. Photo proof captured.',
              location: originCity,
              photoUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500&auto=format&fit=crop&q=80'
            });
          }

          if (['HANDED_AT_ORIGIN_HUB', 'AT_ORIGIN_HUB', 'DISPATCHED_ON_THE_WAY', 'AT_TRANSHIPMENT', 'JOURNEY_RESUMED', 'REACHED_DEST_HUB', 'UNLOADED_AT_DEST_HUB', 'AT_DELIVERY_FACILITY', 'DELIVERY_INITIATED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(status)) {
            timeline.push({
              id: `TL-${id}-6`,
              timestamp: getPastDate(creationDaysAgo - 3, 2),
              status: 'HANDED_AT_ORIGIN_HUB',
              statusLabel: 'Handed at Origin APSRTC Hub',
              actorName: 'SHUDHI Hub Controller',
              actorRole: 'SHUDHI_ADMIN',
              notes: `Package lodged at APSRTC Origin Depot: ${originCity}. Cargo manifest acknowledged.`,
              location: originCity
            });
          }

          if (['DISPATCHED_ON_THE_WAY', 'AT_TRANSHIPMENT', 'JOURNEY_RESUMED', 'REACHED_DEST_HUB', 'UNLOADED_AT_DEST_HUB', 'AT_DELIVERY_FACILITY', 'DELIVERY_INITIATED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(status)) {
            timeline.push({
              id: `TL-${id}-7`,
              timestamp: getPastDate(creationDaysAgo - 4, 8),
              status: 'DISPATCHED_ON_THE_WAY',
              statusLabel: 'APSRTC Express Bus Dispatched',
              actorName: 'APSRTC Logistics Service',
              actorRole: 'SHUDHI_ADMIN',
              notes: `Consignment loaded on intercity service ${originCity} -> ${destCity}.`,
              location: `${originCity} Express Terminal`
            });
          }

          if (['REACHED_DEST_HUB', 'UNLOADED_AT_DEST_HUB', 'AT_DELIVERY_FACILITY', 'DELIVERY_INITIATED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(status)) {
            timeline.push({
              id: `TL-${id}-8`,
              timestamp: getPastDate(creationDaysAgo - 5, 4),
              status: 'REACHED_DEST_HUB',
              statusLabel: 'Arrived at Destination APSRTC Hub',
              actorName: 'Destination Hub Agent',
              actorRole: 'SHUDHI_ADMIN',
              notes: `Transit bus arrived at ${destCity} APSRTC central cargo depot.`,
              location: destCity
            });
          }

          if (['DELIVERED'].includes(status)) {
            timeline.push({
              id: `TL-${id}-9`,
              timestamp: getPastDate(1, 1),
              status: 'DELIVERED',
              statusLabel: 'Consignment Delivered Successfully',
              actorName: 'Local Delivery Partner',
              actorRole: 'PARTNER',
              notes: `Delivered to recipient: ${receiverCust.name}. Proof of delivery uploaded with signature.`,
              location: destCity,
              photoUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&auto=format&fit=crop&q=80'
            });
          }
        }
      }

      // Generate realistic COD events if TO_PAY_COD
      const codEvents: CodEventRecord[] = [];
      let finalCollectionStatus: PaymentStatus = collectionStatus;
      if (paymentMode === 'TO_PAY_COD') {
        if (status === 'DELIVERED') {
          // Event 1: Cash collected by delivery driver at doorstep
          codEvents.push({
            id: `COD-${id}-1`,
            bookingId: id,
            type: 'COLLECTION',
            method: 'CASH_AT_DOORSTEP',
            amount: totalCustomerPayable,
            fromParty: receiverCust.name,
            toParty: deliveryPartner,
            timestamp: getPastDate(1, 2),
            transactionRef: `REC-${id}-01`,
            verificationStatus: 'VERIFIED',
            recordedBy: deliveryPartner,
            notes: 'Cash collected at consignee doorstep upon physical package handover.'
          });

          // Some bookings have handed over to destination hub
          if (idCounter % 2 === 0) {
            codEvents.push({
              id: `COD-${id}-2`,
              bookingId: id,
              type: 'HANDOVER',
              method: 'DESTINATION_HUB_DEPOSIT',
              amount: totalCustomerPayable,
              fromParty: deliveryPartner,
              toParty: `${destCity} Central Hub Desk`,
              timestamp: getPastDate(1, 0),
              transactionRef: `HND-${id}-02`,
              verificationStatus: 'VERIFIED',
              recordedBy: 'Hub Supervisor',
              notes: 'Physical cash received and counted at destination hub counter.'
            });

            // Some bookings have deposited to bank and verified
            if (idCounter % 4 === 0) {
              codEvents.push({
                id: `COD-${id}-3`,
                bookingId: id,
                type: 'DEPOSIT_TO_BANK',
                method: 'DIRECT_UPI',
                amount: totalCustomerPayable,
                fromParty: `${destCity} Central Hub Desk`,
                toParty: 'SHUDHI Corporate Bank Account',
                timestamp: getPastDate(0, 18),
                transactionRef: `BANK-${id}-03`,
                verificationStatus: 'VERIFIED',
                recordedBy: 'SHUDHI Finance Desk',
                notes: 'Settled to corporate bank clearing account.'
              });
              finalCollectionStatus = 'COLLECTED';
            } else {
              finalCollectionStatus = 'PENDING_RECONCILIATION';
            }
          } else {
            // Handover pending
            finalCollectionStatus = 'PENDING_RECONCILIATION';
          }

          // Sample discrepancy case
          if (idCounter % 9 === 0) {
            codEvents.push({
              id: `COD-${id}-DISC`,
              bookingId: id,
              type: 'RECONCILIATION_ADJUSTMENT',
              method: 'CASH_AT_DOORSTEP',
              amount: -50,
              fromParty: receiverCust.name,
              toParty: deliveryPartner,
              timestamp: getPastDate(1, 1),
              verificationStatus: 'DISCREPANCY',
              discrepancyAmount: 50,
              discrepancyReason: 'Customer paid ₹50 less cash; requested balance waiver.',
              recordedBy: deliveryPartner,
              notes: 'Shortfall flagged for finance verification.'
            });
            finalCollectionStatus = 'PENDING_RECONCILIATION';
          }
        } else {
          finalCollectionStatus = 'PENDING';
        }
      }

      // Generate shipment-wise APSRTC corporate liability record
      const apsrtcLiability: ApsrtcLiabilityRecord = {
        bookingId: id,
        originHub: originCity,
        destHub: destCity,
        lrNumber: apsrtcRef || undefined,
        busNumber: hasApsrtc ? `AP 39 Z ${2100 + (idCounter % 400)}` : undefined,
        calculatedFreight: apsrtcFreight,
        corporateBillingPeriod: '2026-11',
        corporateInvoiceRef: (idCounter % 3 === 0) ? 'INV-APSRTC-2026-11-A' : ((idCounter % 5 === 0) ? 'INV-APSRTC-2026-10-B' : undefined),
        reconciliationStatus: (idCounter % 3 === 0) ? 'INVOICED' : ((idCounter % 6 === 0) ? 'RECONCILED' : 'UNBILLED'),
        paymentStatus: (idCounter % 6 === 0) ? 'PAID' : 'UNPAID',
        notes: 'Calculated under APSRTC corporate cargo contract tariff.'
      };

      bookings.push({
        id,
        date: createdAt.split('T')[0],
        source,
        agentId: chosenAgent.id,
        originCity,
        destCity,
        status,
        apsrtcRef,
        awb,
        transporterStatusNotes: hasApsrtc ? `APSRTC Track verified at ${status.includes('DEST') ? destCity : originCity} Hub.` : undefined,
        sender: {
          name: senderCust.name,
          mobile: senderCust.phone,
          address: senderCust.address,
          pincode: senderCust.pin,
          pickupType: 'DOOR_PICKUP'
        },
        receiver: {
          name: receiverCust.name,
          mobile: receiverCust.phone,
          address: receiverCust.address,
          pincode: receiverCust.pin,
          deliveryType: 'DOOR_DELIVERY'
        },
        shipment: {
          type: (['Carton Box', 'Gunny Bag', 'Document', 'Pallet', 'Other'] as const)[(idCounter + i) % 5],
          pieces,
          weightKg,
          volumetricWeightKg: Math.round(weightKg * 1.15),
          declaredValue: (idCounter % 3 === 0) ? 5000 : 1500,
          description: SAMPLE_DESCRIPTIONS[(idCounter + i) % SAMPLE_DESCRIPTIONS.length],
          specialInstructions: (idCounter % 5 === 0) ? 'Fragile glass containers. Keep upright.' : undefined
        },
        commercial: {
          customerFreight: baseFreight,
          additionalCharges,
          discount,
          totalCustomerPayable,
          paymentMode,
          collectionStatus: finalCollectionStatus,
          collectedAt: finalCollectionStatus === 'COLLECTED' ? createdAt : undefined,
          collectedBy: finalCollectionStatus === 'COLLECTED' ? 'SHUDHI Finance' : undefined,
          codEvents,
          apsrtcFreight,
          apsrtcPaymentStatus: apsrtcLiability.paymentStatus === 'PAID' ? 'PAID' : 'PENDING',
          apsrtcPaymentRef: apsrtcLiability.paymentStatus === 'PAID' ? `TXN-APS-${1000 + idCounter}` : undefined,
          apsrtcLiability,
          pickupCost,
          pickupPaymentResponsibility: 'SHUDHI',
          pickupPaymentStatus: isDeliveredOrTransit && (idCounter % 2 === 0) ? 'PAID' : 'PENDING',
          deliveryCost,
          deliveryPaymentResponsibility: 'SHUDHI',
          deliveryPaymentStatus: (status === 'DELIVERED' && idCounter % 3 === 0) ? 'PAID' : 'PENDING',
          otherDirectCosts: otherCosts,
          subAgentMargin,
          subAgentMarginSettled: (status === 'DELIVERED' && idCounter % 4 === 0),
          netOperationalMargin
        },
        assignedPickupPartnerId: ['APPROVED', 'PICKUP_INITIATED', 'OUT_FOR_PICKUP', 'PICKUP_COMPLETED', 'PICKUP_FAILED'].includes(status) ? pickupPartner : null,
        assignedDeliveryPartnerId: ['UNLOADED_AT_DEST_HUB', 'AT_DELIVERY_FACILITY', 'DELIVERY_INITIATED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'DELIVERY_FAILED'].includes(status) ? deliveryPartner : null,
        pickupProof: ['PICKUP_COMPLETED', 'HANDED_AT_ORIGIN_HUB', 'AT_ORIGIN_HUB', 'DISPATCHED_ON_THE_WAY', 'REACHED_DEST_HUB', 'DELIVERED'].includes(status) ? {
          photoUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500&auto=format&fit=crop&q=80',
          capturedAt: getPastDate(creationDaysAgo - 3, 6),
          capturedBy: pickupPartner,
          notes: 'Package sealed securely in heavy-duty tamper-evident sack.'
        } : undefined,
        deliveryProof: status === 'DELIVERED' ? {
          photoUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&auto=format&fit=crop&q=80',
          recipientName: receiverCust.name,
          deliveredAt: getPastDate(1, 1),
          deliveredBy: deliveryPartner,
          notes: 'Received by recipient in person with OTP verification.'
        } : undefined,
        failureReason: status === 'PICKUP_FAILED' ? 'Customer residence locked upon rider arrival.' : (status === 'DELIVERY_FAILED' ? 'Consignee phone switched off / unavailable.' : null),
        rejectionReason: status === 'REJECTED' ? 'Prohibited lithium battery consignment without clearance.' : null,
        timeline
      });
    }
  }

  return bookings;
}

export function generateSeedSettlements(): SettlementRecord[] {
  return [
    {
      id: 'SET-AGT-001',
      date: '2026-11-01',
      entityType: 'SUB_AGENT',
      entityId: 'VSP-A1',
      entityName: 'Srinivasa Express Logistics (Visakhapatnam)',
      amount: 14200,
      period: 'October 2026 Batch 2',
      status: 'PAID',
      paymentMode: 'NEFT',
      paymentReference: 'NEFT882390141',
      notes: 'Monthly commission settlement cleared.',
      linkedBookingIds: ['SHB1001', 'SHB1002', 'SHB1005']
    },
    {
      id: 'SET-AGT-002',
      date: '2026-11-02',
      entityType: 'SUB_AGENT',
      entityId: 'VJW-A1',
      entityName: 'Krishna Cargo Solutions (Vijayawada)',
      amount: 22100,
      period: 'October 2026 Batch 2',
      status: 'PAID',
      paymentMode: 'NEFT',
      paymentReference: 'NEFT882390145',
      notes: 'Sub-agent margin payout for 48 completed parcels.',
      linkedBookingIds: ['SHB1007', 'SHB1012', 'SHB1015']
    },
    {
      id: 'SET-PRT-001',
      date: '2026-11-03',
      entityType: 'PARTNER',
      entityId: 'VSP-P1',
      entityName: 'Kiran Ground Delivery (Visakha)',
      amount: 4850,
      period: 'Week 43 Ground Operations',
      status: 'PAID',
      paymentMode: 'UPI',
      paymentReference: 'UPI-4310928371',
      notes: 'First-mile pickups and last-mile door delivery payouts.',
      linkedBookingIds: ['SHB1001', 'SHB1003']
    },
    {
      id: 'SET-APS-001',
      date: '2026-10-31',
      entityType: 'APSRTC',
      entityId: 'APSRTC-HQ',
      entityName: 'APSRTC Logistics Division (Vijayawada HQ)',
      amount: 45000,
      period: 'October 2026 Mid-Mile Billing',
      status: 'PAID',
      paymentMode: 'NEFT',
      paymentReference: 'RTGS-APS-992100',
      notes: 'Fortnightly consolidated bus freight payables settlement.',
      linkedBookingIds: ['SHB1001', 'SHB1004', 'SHB1010']
    }
  ];
}

export function generateSeedAuditLogs(): AuditLog[] {
  const now = new Date();
  const getAgo = (mins: number) => new Date(now.getTime() - mins * 60000).toISOString();

  return [
    {
      id: 'AUD-001',
      timestamp: getAgo(12),
      userId: 'SHUDHI-HQ',
      userName: 'SHUDHI ADMIN',
      userRole: 'SHUDHI_ADMIN',
      action: 'APPROVE_BOOKING',
      recordId: 'SHB1006',
      previousStatus: 'PENDING_APPROVAL',
      newStatus: 'APPROVED',
      details: 'Approved sub-agent booking. Generated APSRTC Ref APS-VSP-1006 and AWB7891006.'
    },
    {
      id: 'AUD-002',
      timestamp: getAgo(28),
      userId: 'VSP-P1',
      userName: 'Kiran Ground Delivery',
      userRole: 'PARTNER',
      action: 'COMPLETE_PICKUP',
      recordId: 'SHB1014',
      previousStatus: 'OUT_FOR_PICKUP',
      newStatus: 'PICKUP_COMPLETED',
      details: 'Uploaded photo proof of pickup for customer Ramesh Chandra in Visakhapatnam.'
    },
    {
      id: 'AUD-003',
      timestamp: getAgo(45),
      userId: 'SHUDHI-HQ',
      userName: 'SHUDHI Central Controller',
      userRole: 'SHUDHI_ADMIN',
      action: 'HANDOVER_TO_HUB',
      recordId: 'SHB1018',
      previousStatus: 'PICKUP_COMPLETED',
      newStatus: 'HANDED_AT_ORIGIN_HUB',
      details: 'Handed over parcel to APSRTC Visakhapatnam Central Hub.'
    },
    {
      id: 'AUD-004',
      timestamp: getAgo(90),
      userId: 'VJW-A1',
      userName: 'Krishna Cargo Solutions',
      userRole: 'SUB_AGENT',
      action: 'CREATE_BOOKING',
      recordId: 'SHB1048',
      newStatus: 'PENDING_APPROVAL',
      details: 'Submitted new customer booking request for Vijayawada -> Hyderabad.'
    },
    {
      id: 'AUD-005',
      timestamp: getAgo(140),
      userId: 'HYD-P1',
      userName: 'Suresh Urban Dispatch',
      userRole: 'PARTNER',
      action: 'COMPLETE_DELIVERY',
      recordId: 'SHB1038',
      previousStatus: 'OUT_FOR_DELIVERY',
      newStatus: 'DELIVERED',
      details: 'Delivered parcel to recipient Flat 402, Madhapur, Hyderabad with photo proof.'
    }
  ];
}

export function generateSeedConversations(): Record<string, WAConversation> {
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return {
    'CUSTOMER_9849012345': {
      identity: 'CUSTOMER_9849012345',
      phone: '9849012345',
      roleType: 'CUSTOMER',
      mode: 'menu',
      context: {},
      lastUpdated: new Date().toISOString(),
      messages: [
        { id: 'm1', text: "Welcome to SHUDHI Logistics WhatsApp!\nHow can I help you today?\n\n1. Book a Shipment\n2. Track Shipment\n3. Check Delivery Status\n4. Contact Support", sender: 'bot', timestamp: now },
        { id: 'm2', text: "2", sender: 'user', timestamp: now },
        { id: 'm3', text: "Please enter your 7-character Booking ID (e.g. SHB1001) to track.", sender: 'bot', timestamp: now },
        { id: 'm4', text: "SHB1001", sender: 'user', timestamp: now },
        { id: 'm5', text: "📦 *Tracking Result for SHB1001:*\nStatus: *DELIVERED*\nRoute: VISAKHAPATNAM -> HYDERABAD\nTransporter Ref: APS-VSP-2001\nDelivered with verified recipient photo proof.", sender: 'bot', timestamp: now }
      ]
    },
    'AGENT_VSP-A1': {
      identity: 'AGENT_VSP-A1',
      phone: '9848011221',
      roleType: 'AGENT',
      mode: 'agent_desk',
      context: {},
      lastUpdated: new Date().toISOString(),
      messages: [
        { id: 'ma1', text: "🏢 *Agent Desk Assistant*\nWelcome back, Srinivasa Express (VSP-A1).\nCommands:\n- TODAY REPORT\n- PENDING BOOKINGS\n- MY SHIPMENTS\n- PAYMENT SUMMARY", sender: 'bot', timestamp: now },
        { id: 'ma2', text: "TODAY REPORT", sender: 'user', timestamp: now },
        { id: 'ma3', text: "📊 *Daily Report for VSP-A1*\n- Total Bookings: 18\n- Pending Approval: 2\n- In APSRTC Transit: 7\n- Delivered: 8\n- Current Balance: ₹14,200 (Settled on Nov 1)\n\nReply HELP for options.", sender: 'bot', timestamp: now }
      ]
    },
    'PARTNER_9000000001': {
      identity: 'PARTNER_9000000001',
      phone: '9000000001',
      roleType: 'PARTNER',
      mode: 'field_ops',
      context: {},
      lastUpdated: new Date().toISOString(),
      messages: [
        { id: 'mp1', text: "🏍️ *Field Operations Assistant*\nWelcome Kiran (Visakha Partner 1).\nSend *PENDING TASKS* to view assignments, or reply *ACCEPT [ID]*, *COMPLETED [ID]*, or *FAILED [ID]*.", sender: 'bot', timestamp: now },
        { id: 'mp2', text: "PENDING TASKS", sender: 'user', timestamp: now },
        { id: 'mp3', text: "📋 *Pending Tasks for VSP-P1*\n\n- [SHB1008] Pickup at Plot 18, Lawson's Bay Colony\n- [SHB1011] Pickup at IT SEZ Road, Madhurawada\n\nReply *ACCEPT SHB1008* to accept task.", sender: 'bot', timestamp: now }
      ]
    }
  };
}

/**
 * Normalizes legacy booking records to conform with Stage 2 COD and APSRTC liability structures.
 * This operation is idempotent and backward-compatible.
 */
export function normalizeBooking(b: any): Booking {
  if (!b || !b.id) return b;
  const isCod = b.commercial?.paymentMode === 'TO_PAY_COD';
  const codEvents: CodEventRecord[] = Array.isArray(b.commercial?.codEvents) ? b.commercial.codEvents : [];

  // For COD deliveries lacking cash handover evidence, preserve PENDING_RECONCILIATION
  let collectionStatus = b.commercial?.collectionStatus || 'PENDING';
  if (isCod && b.status === 'DELIVERED') {
    const hasReconciled = codEvents.some((ev: CodEventRecord) => ev.type === 'DEPOSIT_TO_BANK' && ev.verificationStatus === 'VERIFIED');
    if (!hasReconciled && (collectionStatus === 'COLLECTED' || collectionStatus === 'PENDING')) {
      collectionStatus = 'PENDING_RECONCILIATION';
    }
  }

  // Ensure apsrtcLiability exists
  const apsrtcLiability: ApsrtcLiabilityRecord = b.commercial?.apsrtcLiability || {
    bookingId: b.id,
    originHub: b.originCity,
    destHub: b.destCity,
    lrNumber: b.apsrtcRef || undefined,
    busNumber: undefined,
    calculatedFreight: b.commercial?.apsrtcFreight || 0,
    corporateBillingPeriod: (b.date || '2026-11-01').slice(0, 7),
    corporateInvoiceRef: undefined,
    reconciliationStatus: b.commercial?.apsrtcPaymentStatus === 'PAID' ? 'RECONCILED' : 'UNBILLED',
    paymentStatus: b.commercial?.apsrtcPaymentStatus === 'PAID' ? 'PAID' : 'UNPAID',
    notes: 'Legacy record normalized.'
  };

  return {
    ...b,
    commercial: {
      ...b.commercial,
      collectionStatus,
      codEvents,
      apsrtcLiability
    }
  };
}

export function normalizeBookings(raw: any[]): Booking[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeBooking);
}

// Storage wrapper methods
export const StorageService = {
  loadBookings(): Booking[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
      if (data) {
        const parsed = JSON.parse(data);
        return normalizeBookings(parsed);
      }
    } catch (e) {
      console.error('Error loading bookings', e);
    }
    const seed = generateSeedBookings();
    this.saveBookings(seed);
    return seed;
  },

  saveBookings(bookings: Booking[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
    } catch (e) {
      console.error('Error saving bookings', e);
    }
  },

  loadAgents(): SubAgent[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AGENTS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Error loading agents', e);
    }
    this.saveAgents(INITIAL_SUB_AGENTS);
    return INITIAL_SUB_AGENTS;
  },

  saveAgents(agents: SubAgent[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.AGENTS, JSON.stringify(agents));
    } catch (e) {
      console.error('Error saving agents', e);
    }
  },

  loadPartners(): LocalPartner[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PARTNERS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Error loading partners', e);
    }
    this.savePartners(INITIAL_LOCAL_PARTNERS);
    return INITIAL_LOCAL_PARTNERS;
  },

  savePartners(partners: LocalPartner[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.PARTNERS, JSON.stringify(partners));
    } catch (e) {
      console.error('Error saving partners', e);
    }
  },

  loadSettlements(): SettlementRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTLEMENTS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Error loading settlements', e);
    }
    const seed = generateSeedSettlements();
    this.saveSettlements(seed);
    return seed;
  },

  saveSettlements(settlements: SettlementRecord[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTLEMENTS, JSON.stringify(settlements));
    } catch (e) {
      console.error('Error saving settlements', e);
    }
  },

  loadAuditLogs(): AuditLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Error loading audit logs', e);
    }
    const seed = generateSeedAuditLogs();
    this.saveAuditLogs(seed);
    return seed;
  },

  saveAuditLogs(logs: AuditLog[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
    } catch (e) {
      console.error('Error saving audit logs', e);
    }
  },

  loadConversations(): Record<string, WAConversation> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Error loading conversations', e);
    }
    const seed = generateSeedConversations();
    this.saveConversations(seed);
    return seed;
  },

  saveConversations(convs: Record<string, WAConversation>) {
    try {
      localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(convs));
    } catch (e) {
      console.error('Error saving conversations', e);
    }
  },

  resetAllData(): {
    bookings: Booking[];
    agents: SubAgent[];
    partners: LocalPartner[];
    settlements: SettlementRecord[];
    auditLogs: AuditLog[];
    conversations: Record<string, WAConversation>;
  } {
    const bookings = generateSeedBookings();
    const agents = [...INITIAL_SUB_AGENTS];
    const partners = [...INITIAL_LOCAL_PARTNERS];
    const settlements = generateSeedSettlements();
    const auditLogs = generateSeedAuditLogs();
    const conversations = generateSeedConversations();

    this.saveBookings(bookings);
    this.saveAgents(agents);
    this.savePartners(partners);
    this.saveSettlements(settlements);
    this.saveAuditLogs(auditLogs);
    this.saveConversations(conversations);

    return { bookings, agents, partners, settlements, auditLogs, conversations };
  }
};

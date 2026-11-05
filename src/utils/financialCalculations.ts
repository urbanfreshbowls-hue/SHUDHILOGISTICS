import { Booking, CodEventRecord, ApsrtcLiabilityRecord, ApsrtcPaymentStatus, ApsrtcReconciliationStatus } from '../types';

export interface CodSummary {
  expectedAmount: number;
  collectedAmount: number;
  handedOverAmount: number;
  depositedAmount: number;
  reconciledAmount: number;
  outstandingCollection: number; // expected - collected
  pendingHandover: number;       // collected - handedOver
  pendingDeposit: number;        // handedOver - deposited
  discrepancyTotal: number;
  hasDiscrepancy: boolean;
  status: 'NO_COD' | 'PENDING_DELIVERY' | 'COLLECTED_PENDING_HANDOVER' | 'HANDED_OVER_PENDING_DEPOSIT' | 'RECONCILED' | 'DISCREPANCY';
}

/**
 * Computes COD reconciliation summary for a booking without double-counting cash movements.
 * 
 * Rules:
 * - Amount Expected: totalCustomerPayable when paymentMode === 'TO_PAY_COD'.
 * - Amount Collected: Sum of 'COLLECTION' events (cash received from customer).
 * - Amount Handed Over: Sum of 'HANDOVER' events (cash passed from driver to hub or agent).
 * - Amount Deposited: Sum of 'DEPOSIT_TO_BANK' events (cash deposited to SHUDHI account).
 * - Amount Reconciled: Sum of verified events.
 * - Outstanding Collection: expected - collected.
 * - Pending Handover: collected - handedOver.
 * - Pending Deposit: handedOver - deposited.
 */
export function computeCodSummary(booking: Booking): CodSummary {
  const isCod = booking.commercial.paymentMode === 'TO_PAY_COD';
  const expectedAmount = isCod ? booking.commercial.totalCustomerPayable : 0;

  if (!isCod) {
    return {
      expectedAmount: 0,
      collectedAmount: 0,
      handedOverAmount: 0,
      depositedAmount: 0,
      reconciledAmount: 0,
      outstandingCollection: 0,
      pendingHandover: 0,
      pendingDeposit: 0,
      discrepancyTotal: 0,
      hasDiscrepancy: false,
      status: 'NO_COD'
    };
  }

  const events: CodEventRecord[] = booking.commercial.codEvents || [];

  let collectedAmount = 0;
  let handedOverAmount = 0;
  let depositedAmount = 0;
  let reconciledAmount = 0;
  let discrepancyTotal = 0;
  let hasDiscrepancy = false;

  for (const ev of events) {
    if (ev.type === 'COLLECTION') {
      collectedAmount += ev.amount;
    } else if (ev.type === 'HANDOVER') {
      handedOverAmount += ev.amount;
    } else if (ev.type === 'DEPOSIT_TO_BANK') {
      depositedAmount += ev.amount;
    } else if (ev.type === 'RECONCILIATION_ADJUSTMENT') {
      // Adjustments reconcile discrepancies or shortages
      collectedAmount += ev.amount;
    }

    if (ev.verificationStatus === 'VERIFIED') {
      reconciledAmount += ev.amount;
    }

    if (ev.verificationStatus === 'DISCREPANCY' || (ev.discrepancyAmount && ev.discrepancyAmount > 0)) {
      hasDiscrepancy = true;
      discrepancyTotal += ev.discrepancyAmount || 0;
    }
  }

  const outstandingCollection = Math.max(0, expectedAmount - collectedAmount);
  const pendingHandover = Math.max(0, collectedAmount - handedOverAmount);
  const pendingDeposit = Math.max(0, handedOverAmount - depositedAmount);

  let status: CodSummary['status'] = 'PENDING_DELIVERY';
  if (hasDiscrepancy) {
    status = 'DISCREPANCY';
  } else if (depositedAmount >= expectedAmount && expectedAmount > 0) {
    status = 'RECONCILED';
  } else if (handedOverAmount >= expectedAmount && expectedAmount > 0) {
    status = 'HANDED_OVER_PENDING_DEPOSIT';
  } else if (collectedAmount >= expectedAmount && expectedAmount > 0) {
    status = 'COLLECTED_PENDING_HANDOVER';
  }

  return {
    expectedAmount,
    collectedAmount,
    handedOverAmount,
    depositedAmount,
    reconciledAmount,
    outstandingCollection,
    pendingHandover,
    pendingDeposit,
    discrepancyTotal,
    hasDiscrepancy,
    status
  };
}

export interface ApsrtcInvoiceGroup {
  invoiceRef: string;
  billingPeriod: string;
  shipmentCount: number;
  totalFreight: number;
  paymentStatus: ApsrtcPaymentStatus;
  reconciliationStatus: ApsrtcReconciliationStatus;
  bookingIds: string[];
}

export interface ApsrtcCorporateSummary {
  totalShipments: number;
  totalLiability: number;
  unbilledLiability: number;
  invoicedLiability: number;
  reconciledLiability: number;
  paidLiability: number;
  unpaidLiability: number;
  invoiceGroups: ApsrtcInvoiceGroup[];
}

/**
 * Computes corporate APSRTC freight liabilities across all shipments.
 */
export function computeApsrtcSummary(bookings: Booking[]): ApsrtcCorporateSummary {
  let totalShipments = 0;
  let totalLiability = 0;
  let unbilledLiability = 0;
  let invoicedLiability = 0;
  let reconciledLiability = 0;
  let paidLiability = 0;
  let unpaidLiability = 0;

  const invoiceMap: Record<string, ApsrtcInvoiceGroup> = {};

  for (const b of bookings) {
    const liability: ApsrtcLiabilityRecord = b.commercial.apsrtcLiability || {
      bookingId: b.id,
      originHub: b.originCity,
      destHub: b.destCity,
      lrNumber: b.apsrtcRef || undefined,
      busNumber: undefined,
      calculatedFreight: b.commercial.apsrtcFreight || 0,
      corporateBillingPeriod: (b.date || '2026-11-01').slice(0, 7),
      reconciliationStatus: b.commercial.apsrtcPaymentStatus === 'PAID' ? 'RECONCILED' : 'UNBILLED',
      paymentStatus: b.commercial.apsrtcPaymentStatus === 'PAID' ? 'PAID' : 'UNPAID'
    };

    const freight = liability.calculatedFreight || 0;
    totalShipments++;
    totalLiability += freight;

    if (liability.paymentStatus === 'PAID') {
      paidLiability += freight;
    } else {
      unpaidLiability += freight;
    }

    if (liability.reconciliationStatus === 'UNBILLED') {
      unbilledLiability += freight;
    } else if (liability.reconciliationStatus === 'INVOICED') {
      invoicedLiability += freight;
    } else if (liability.reconciliationStatus === 'RECONCILED') {
      reconciledLiability += freight;
    }

    if (liability.corporateInvoiceRef) {
      const invRef = liability.corporateInvoiceRef;
      if (!invoiceMap[invRef]) {
        invoiceMap[invRef] = {
          invoiceRef: invRef,
          billingPeriod: liability.corporateBillingPeriod || '2026-11',
          shipmentCount: 0,
          totalFreight: 0,
          paymentStatus: liability.paymentStatus,
          reconciliationStatus: liability.reconciliationStatus,
          bookingIds: []
        };
      }
      invoiceMap[invRef].shipmentCount++;
      invoiceMap[invRef].totalFreight += freight;
      invoiceMap[invRef].bookingIds.push(b.id);
    }
  }

  return {
    totalShipments,
    totalLiability,
    unbilledLiability,
    invoicedLiability,
    reconciledLiability,
    paidLiability,
    unpaidLiability,
    invoiceGroups: Object.values(invoiceMap)
  };
}

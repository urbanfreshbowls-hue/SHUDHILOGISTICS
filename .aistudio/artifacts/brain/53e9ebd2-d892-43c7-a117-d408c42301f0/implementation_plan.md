# SHUDHI LOGISTICS — PHASE 1B: REVISED STABILISATION IMPLEMENTATION PLAN

## Executive Blueprint & Stabilization Objectives

This revised implementation plan addresses all feedback from the Phase 1B review. It establishes a rigorous, production-aligned stabilization plan for the SHUDHI Logistics application on the `phase-1-stabilisation` branch.

All changes operate within the existing React + TypeScript single-page architecture while implementing robust data boundaries, explicit financial ledgers, verified OTP access flows, and non-destructive persistence strategies.

---

## 1. Confirmed Current Architecture and Exact Role Names

### 1.1 Verified Role System
Inspection of `/src/types/index.ts` confirms the exact role union:
```typescript
export type UserRole = 'SHUDHI_ADMIN' | 'SUB_AGENT' | 'PARTNER' | 'CUSTOMER';
```
- **`SHUDHI_ADMIN`**: Central management with global operational and financial oversight.
- **`SUB_AGENT`**: Booking creation agent; restricted to their own bookings (`agentId === user.id`).
- **`PARTNER`**: First-mile pickup and last-mile delivery partner; restricted to assigned bookings (`assignedPickupPartnerId === user.id` or `assignedDeliveryPartnerId === user.id`).
- **`CUSTOMER`**: End-user consignor/consignee; strictly read-only, authenticated via Booking ID + OTP.

*Rule:* The application role is strictly `PARTNER`. The term `LOCAL_PARTNER` refers only to the data interface `LocalPartner`, not a role enum. No duplicate role names or aliases will be introduced.

### 1.2 Architecture Flow Diagram

```
CUSTOMER TRACKING LIFECYCLE (STAGE 1)
┌────────────────────────┐      ┌──────────────────────────┐      ┌─────────────────────────┐
│ Customer enters        │ ───> │ System finds booking,    │ ───> │ Customer enters OTP;    │
│ Booking ID (only)      │      │ masks phone (+91 98***38)│      │ System validates        │
└────────────────────────┘      │ & issues Demo OTP        │      └───────────┬─────────────┘
                                └──────────────────────────┘                  │
                                                                              ▼
                                                                  ┌─────────────────────────┐
                                                                  │ Read-Only Tracking View │
                                                                  │ (Sanitized Milestones,  │
                                                                  │ Zero Financial Margins) │
                                                                  └─────────────────────────┘

FINANCIAL & OPERATIONAL SEPARATION (STAGES 2, 3, 5)
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│ SHIPMENT STATUS: DELIVERED (Does NOT imply settlement or cash receipt)                   │
├───────────────────────────┬───────────────────────────────┬───────────────────────────────┤
│ Customer Collection       │ COD Handover Pipeline         │ Partner / Agent Payables      │
│ ├─ PREPAID: Collected     │ ├─ Event 1: Doorstep Cash     │ ├─ Pickup Fee: PENDING        │
│ └─ TO_PAY_COD:            │ ├─ Event 2: Hub Handover      │ ├─ Delivery Fee: PENDING      │
│    PENDING_RECONCILIATION │ └─ Event 3: Bank / HQ Deposit │ └─ Sub-Agent Margin: PENDING  │
└───────────────────────────┴───────────────────────────────┴───────────────────────────────┘
                                                                              │
                                                                              ▼
                                                              ┌─────────────────────────────┐
                                                              │ Partial Settlement Engine   │
                                                              │ ├─ Original Obligation      │
                                                              │ ├─ Allocations List         │
                                                              │ ├─ Remaining Balance        │
                                                              │ └─ Status: PENDING /        │
                                                              │    PARTIALLY_PAID / PAID    │
                                                              └─────────────────────────────┘
```

---

## 2. Revised Six-Stage Implementation Roadmap

| Stage | Focus Area | Key Deliverables | Risk & Complexity |
|---|---|---|---|
| **Stage 1** | **Customer OTP Authentication & Tracking Privacy** | Booking ID lookup, masked recipient phone display, simulated OTP challenge, read-only `PublicTrackingModal.tsx`. | Medium |
| **Stage 2** | **Shipment Status & Financial Separation** | Decouple delivery from financial clearance; multi-event COD collection and handover pipeline; corporate APSRTC liabilities. | High |
| **Stage 3** | **Role, Ownership & Mutation Safeguards** | Function-level caller verification in `AppContext` using exact roles (`SHUDHI_ADMIN`, `SUB_AGENT`, `PARTNER`, `CUSTOMER`); city/jurisdiction checks. | Medium |
| **Stage 4** | **Dual Identifier Strategy & Data Integrity** | Internal UUID (`id`) + human-readable reference (`bookingReference`); full state transition matrix enforcement. | Low |
| **Stage 5** | **Partial Settlement Allocation & Reconciliation** | Booking-wise allocation ledger supporting partial payments, outstanding balances, duplicate prevention, and distinct obligation tracking. | High |
| **Stage 6** | **Non-Destructive Proof Storage & Audit Standardization** | Client-side canvas compression; isolated IndexedDB proof store; non-destructive quota handling; ISO 8601 timestamps. | Medium |

---

## 3. File-by-File Implementation Plan

### Stage 1: Customer Tracking Privacy and Access Restrictions
- **`src/components/dashboard/CustomerPortal.tsx`**:
  - Remove direct phone number matching as an authentication bypass.
  - Require the user to enter only the **Booking ID**.
  - Query state for the booking ID. If found, extract the registered contact number (receiver's mobile) and display it strictly masked: `+91 ******${mobile.slice(-4)}`.
  - Trigger the OTP verification modal.
  - Display an explicit simulation banner:  
    `[DEMO MODE: Simulated OTP is 123456. In production, this OTP is sent via SMS/WhatsApp to the registered number]`
  - Upon successful OTP submission, open `PublicTrackingModal`.
- **`src/components/tracking/PublicTrackingModal.tsx` *(New Component)***:
  - Read-only tracking modal.
  - Renders only customer-relevant timeline checkpoints (Origin Hub, In Transit, Destination Facility, Out for Delivery, Delivered).
  - Masks complete addresses (shows City and Area/Pincode only).
  - Completely strips out: internal commercial figures, partner payouts, APSRTC payables, sub-agent margins, driver personal phone numbers, and operational buttons.

### Stage 2: Shipment Status and Financial Settlement Separation
- **`src/context/AppContext.tsx`**:
  - In `transitionStatus(bookingId, newStatus)`:
    - When `newStatus === 'DELIVERED'`, **do not** modify `deliveryPaymentStatus` or `subAgentMarginSettled`. They must remain `PENDING` until explicit settlement.
    - For `TO_PAY_COD`, set `collectionStatus = 'PENDING_RECONCILIATION'`.
    - For `PREPAID`, retain `collectionStatus = 'COLLECTED'`.
  - Add mutation: `recordCodEvent(bookingId, eventData)`:
    - Appends a new `CodEventRecord` to `booking.commercial.codEvents`.
    - Updates aggregate COD collection and handover balances.
- **`src/components/finance/FinanceView.tsx`**:
  - Add a dedicated **COD Cash Reconciliation Tab** showing collected vs. handed-over amounts, discrepancy flags, and receiving party receipts.
  - Add an **APSRTC Corporate Liability Tab** tracking shipment-wise freight liabilities against periodic corporate bills.

### Stage 3: Role, Ownership and Mutation Safeguards
- **`src/context/AppContext.tsx`**:
  - Implement centralized validation helper `assertAuthorized(action, user, booking)`:
    - `SHUDHI_ADMIN`: Full access across all hubs and entities.
    - `SUB_AGENT`: Allowed only to create bookings and access bookings where `booking.agentId === user.id`. Cannot assign partners or approve settlements.
    - `PARTNER`: Allowed only to view and update bookings where `assignedPickupPartnerId === user.id` or `assignedDeliveryPartnerId === user.id`. Cannot modify commercial terms.
    - `CUSTOMER`: Blocked from calling any state mutation function.
- **`src/components/common/BookingDetailModal.tsx`**:
  - Audit and guard all ground action buttons (`Assign Pickup Partner`, `Mark Out for Pickup`, `Hand Over to Origin Hub`, `Assign Delivery Partner`, `Mark Out for Delivery`, `Upload POD & Deliver`).
  - Buttons only render if `user.role === 'SHUDHI_ADMIN'` or `(user.role === 'PARTNER' && booking.assignedDeliveryPartnerId === user.id)`.

### Stage 4: Booking ID Generation and Data Integrity
- **`src/utils/idGenerator.ts` *(New Utility)***:
  - Generate internal UUIDs (`crypto.randomUUID()`) for `booking.id`.
  - Generate human-readable references for `booking.bookingReference`: `SHB-${YYMM}-${5-digit random/sequence}` (e.g. `SHB-2611-48201`).
- **`src/context/AppContext.tsx`**:
  - Update `createBooking` to assign both `id` and `bookingReference`.
  - Remove `user.role !== 'SHUDHI_ADMIN'` bypass from `transitionStatus`. All status changes must adhere to `ALLOWED_TRANSITIONS`.

### Stage 5: Settlement Allocation and Reconciliation
- **`src/constants/network.ts` & `src/types/index.ts`**:
  - Implement `FinancialObligation` and `SettlementAllocation` interfaces for:
    1. Pickup Partner Fee
    2. Delivery Partner Fee
    3. Sub-Agent Commission
- **`src/context/AppContext.tsx`**:
  - Add `recordSettlementAllocation(settlementId, bookingId, obligationType, amount, paymentRef)`:
    - Validates that `amount <= remainingBalance`.
    - Prevents duplicate allocations.
    - Updates obligation status: `PENDING` -> `PARTIALLY_PAID` -> `PAID`.
    - Creates linking records in the settlement ledger.
- **`src/components/finance/FinanceView.tsx`**:
  - Update settlement dialog to display specific unpaid bookings with their current outstanding balances.
  - Allow specifying partial allocation amounts per booking.

### Stage 6: Proof Image Storage and Audit Reliability
- **`src/utils/imageCompressor.ts` *(New Utility)***:
  - Uses HTML5 `<canvas>` to resize images to max dimension $600 \times 600\text{ px}$ at JPEG 0.5 quality (~25–45 KB).
- **`src/services/evidenceStorage.ts` *(New Service)***:
  - Uses browser **IndexedDB** (`shudhi_evidence_db`) to store binary photo blobs, keeping `localStorage` unpolluted.
  - `localStorage` retains only lightweight metadata and thumbnail references.
- **`src/services/storage.ts`**:
  - Wrap `localStorage.setItem` in try/catch. On `QuotaExceededError`, throw a non-destructive error notifying the user without deleting any existing records.
  - Standardize all audit logs, timestamps, and handover records on UTC ISO 8601 (`new Date().toISOString()`).

---

## 4. Revised Data Models

```typescript
import { City, BookingStatus, UserRole } from '../types';

// ==========================================
// 1. COD Collection & Multi-Event Handover
// ==========================================
export type CodEventType = 'COLLECTION' | 'HANDOVER' | 'DEPOSIT_TO_BANK' | 'RECONCILIATION_ADJUSTMENT';
export type CodMethod = 'DESTINATION_HUB_DEPOSIT' | 'DIRECT_UPI' | 'SUB_AGENT_HANDOVER' | 'CASH_AT_DOORSTEP';
export type VerificationStatus = 'PENDING_VERIFICATION' | 'VERIFIED' | 'DISCREPANCY';

export interface CodEventRecord {
  id: string;
  bookingId: string;
  type: CodEventType;
  method: CodMethod;
  amount: number;
  fromPartyId: string;
  fromPartyName: string;
  toPartyId: string;
  toPartyName: string;
  timestamp: string; // ISO 8601
  transactionRef?: string;
  verificationStatus: VerificationStatus;
  discrepancyAmount?: number;
  discrepancyReason?: string;
  recordedBy: string;
  notes?: string;
}

// ==========================================
// 2. Partial Settlement & Allocation Models
// ==========================================
export type ObligationType = 'PICKUP_PARTNER_FEE' | 'DELIVERY_PARTNER_FEE' | 'SUB_AGENT_COMMISSION';
export type ObligationStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'DISPUTED';

export interface SettlementAllocation {
  allocationId: string;
  settlementId: string;
  bookingId: string;
  obligationType: ObligationType;
  originalAmount: number;
  allocatedAmount: number;
  remainingBalance: number;
  paymentReference: string;
  paymentDate: string; // ISO 8601
  entityId: string;
  entityType: 'SUB_AGENT' | 'PARTNER';
  status: ObligationStatus;
}

export interface FinancialObligation {
  obligationType: ObligationType;
  entityId: string;
  originalAmount: number;
  totalPaid: number;
  remainingBalance: number;
  status: ObligationStatus;
  allocations: SettlementAllocation[];
}

// ==========================================
// 3. Failed Delivery & RTO (Reason-Based)
// ==========================================
export type FailureReason = 
  | 'RECIPIENT_UNAVAILABLE' 
  | 'INCORRECT_ADDRESS' 
  | 'RECIPIENT_REJECTED' 
  | 'PAYMENT_REFUSED' 
  | 'DAMAGED_IN_TRANSIT' 
  | 'CUSTOMER_REQUESTED_RESCHEDULE';

export type ResponsibleParty = 'CUSTOMER' | 'SUB_AGENT' | 'PARTNER' | 'FORCE_MAJEURE' | 'UNDETERMINED';

export interface RtoRecord {
  bookingId: string;
  failedAt: string;
  failureReason: FailureReason;
  responsibleParty: ResponsibleParty;
  rtoChargeApplicable: boolean;
  rtoChargeAmount?: number;
  rtoChargeStatus?: 'PENDING_APPROVAL' | 'APPROVED' | 'WAIVED';
  notes?: string;
  approvedBy?: string;
}

// ==========================================
// 4. APSRTC Corporate Liability Ledger
// ==========================================
export interface ApsrtcLiabilityRecord {
  bookingId: string;
  originHub: City;
  destHub: City;
  busNumber: string;
  lrNumber: string;
  calculatedFreight: number;
  corporateBillingPeriod: string; // e.g. "2026-11"
  reconciliationStatus: 'UNBILLED' | 'INVOICED' | 'RECONCILED' | 'PAID';
  corporateInvoiceRef?: string;
  reconciledAt?: string;
}

// ==========================================
// 5. Extended Booking Model
// ==========================================
export interface Booking {
  id: string; // Primary UUID internal ID
  bookingReference: string; // Human-readable reference (e.g. SHB-2611-48201 or legacy SHB1001)
  date: string;
  source: 'ADMIN_DIRECT' | 'SUB_AGENT' | 'CUSTOMER_PORTAL' | 'CUSTOMER_WHATSAPP';
  agentId: string;
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
    pickupType: 'DOOR_PICKUP' | 'HUB_DROP';
  };
  receiver: {
    name: string;
    mobile: string;
    address: string;
    pincode: string;
    deliveryType: 'DOOR_DELIVERY' | 'DEST_HUB_COLLECT';
  };
  shipment: {
    type: string;
    pieces: number;
    weightKg: number;
    volumetricWeightKg?: number;
    declaredValue: number;
    description: string;
    photos?: string[];
  };
  
  // Explicit Financial Obligations & Ledgers
  commercial: {
    customerFreight: number;
    additionalCharges: number;
    discount: number;
    totalCustomerPayable: number;
    taxableAmount?: number;
    taxRate?: number; // Configurable tax rate (e.g. 18%)
    taxBreakdown?: { cgst: number; sgst: number; igst: number };
    paymentMode: 'CASH' | 'UPI_ONLINE' | 'TO_PAY_COD' | 'CREDIT_ACCOUNT';
    collectionStatus: 'PENDING' | 'COLLECTED' | 'PENDING_RECONCILIATION' | 'WAIVED' | 'REFUNDED';
    
    // Multi-event COD ledger
    codEvents: CodEventRecord[];
    
    // APSRTC Corporate Liability
    apsrtcLiability: ApsrtcLiabilityRecord;
    
    // Distinct Partner and Agent Obligations
    pickupPartnerObligation: FinancialObligation;
    deliveryPartnerObligation: FinancialObligation;
    subAgentObligation: FinancialObligation;
    
    // Net Margin
    netOperationalMargin: number;
  };

  assignedPickupPartnerId?: string | null;
  assignedDeliveryPartnerId?: string | null;
  
  pickupProof?: {
    photoKey?: string; // IndexedDB key or compressed data URL
    capturedAt: string;
    capturedBy: string;
    notes?: string;
  };
  deliveryProof?: {
    photoKey?: string; // IndexedDB key or compressed data URL
    recipientName: string;
    deliveredAt: string;
    deliveredBy: string;
    notes?: string;
  };
  
  rtoRecord?: RtoRecord;
  timeline: Array<{
    id: string;
    timestamp: string;
    status: BookingStatus;
    statusLabel: string;
    actorName: string;
    actorRole: UserRole;
    notes?: string;
  }>;
}
```

---

## 5. Test and Acceptance Criteria

### Customer OTP & Tracking Privacy Tests
- [ ] Entering an invalid or non-existent Booking ID displays `"Booking ID not found"`.
- [ ] Valid Booking ID renders the registered recipient's phone number strictly masked (`+91 ******2238`).
- [ ] Attempting to track without entering an OTP is blocked.
- [ ] Submitting valid demo OTP (`123456`) displays the read-only `PublicTrackingModal`.
- [ ] Inspecting the DOM in `PublicTrackingModal` confirms total absence of:
  - Sub-agent commissions, partner payouts, and SHUDHI profit margins.
  - Driver personal phone numbers or dispatch buttons.
  - Complete recipient street addresses (shows city/area only).

### Role & Ownership Security Tests
- [ ] Active role `CUSTOMER` calling any `AppContext` mutation throws `UnauthorizedOperationError`.
- [ ] Active role `SUB_AGENT` attempting to view or mutate bookings where `agentId !== user.id` is rejected.
- [ ] Active role `PARTNER` attempting to mark delivery or upload POD for an unassigned booking is rejected.
- [ ] Operational buttons in `BookingDetailModal` render only for authorized roles.

### Financial Separation & Partial Settlement Tests
- [ ] Transitioning a shipment to `DELIVERED` leaves `pickupPartnerObligation.status` and `deliveryPartnerObligation.status` as `'PENDING'`.
- [ ] Delivered `TO_PAY_COD` parcel sets `collectionStatus` to `'PENDING_RECONCILIATION'`.
- [ ] Adding a partial settlement of ₹30 against a ₹50 delivery partner obligation updates `totalPaid = 30`, `remainingBalance = 20`, and status to `'PARTIALLY_PAID'`.
- [ ] Attempting to allocate ₹25 against a remaining balance of ₹20 is rejected with `"Allocation exceeds outstanding balance"`.
- [ ] Second allocation of ₹20 updates `remainingBalance = 0` and status to `'PAID'`.

### COD Multi-Handover Tests
- [ ] Doorstep driver collection creates Event 1 (`COLLECTION`, ₹650, `CASH_AT_DOORSTEP`).
- [ ] Driver handover to Vijayawada Hub supervisor creates Event 2 (`HANDOVER`, ₹650, `DESTINATION_HUB_DEPOSIT`).
- [ ] If driver hands over ₹600 with ₹50 discrepancy, system flags event status as `'DISCREPANCY'` with reason logged.

### Proof Storage & Timestamp Tests
- [ ] Camera photo compressed via canvas scales to $\le 600\text{ px}$ and $\le 45\text{ KB}$.
- [ ] Photo stored into IndexedDB succeeds without growing `localStorage` byte size.
- [ ] If browser storage limits are reached, error notification is displayed without deleting or pruning historical evidence.
- [ ] All timestamps verify as valid UTC ISO 8601 strings (`^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}`).

---

## 6. Data Migration and Backward-Compatibility Safeguards

1. **Dual-Identifier Fallback:**
   - Existing mock bookings (`SHB1001`–`SHB1012`) possess an `id` that matches the 4-digit format.
   - At runtime, if a booking does not have a separate `bookingReference`, accessors default to `bookingReference = booking.id`.
   - All search queries in the UI match against both `booking.id` and `booking.bookingReference`.
2. **Commercial Model Normalization:**
   - For legacy seed bookings lacking the `FinancialObligation` structure, a migration normalizer in `storage.ts` runs on initialization:
     - Sets `originalAmount` equal to legacy `pickupCost`, `deliveryCost`, or `subAgentMargin`.
     - Maps legacy `pickupPaymentStatus === 'PAID'` to `status: 'PAID'`, `totalPaid: pickupCost`, `remainingBalance: 0`.
     - Maps legacy `'PENDING'` to `status: 'PENDING'`, `totalPaid: 0`, `remainingBalance: pickupCost`.
3. **Preservation of Demo Records:**
   - Existing seed bookings, audit logs, agents, and partners are preserved without breaking existing views.

---

## 7. Demo Limitations versus Production Requirements

| Feature | Demo-Stage Implementation (Phase 1B) | Production Requirement (Phase 2+) |
|---|---|---|
| **OTP Verification** | Client-side simulation (`Demo OTP: 123456`) with clear disclaimer banner. | Server-side cryptographic OTP generation via Twilio / Gupshup / Meta Cloud API. |
| **Authentication & RBAC** | Client-side role switcher with internal `assertAuthorized` mutation guards. | HTTP-only session cookies, JWT bearer tokens, and server-side middleware enforcement. |
| **Data Persistence** | `localStorage` for metadata + IndexedDB for compressed images. | Relational PostgreSQL database (Supabase) + S3-compatible cloud object storage. |
| **APSRTC Cargo Tracking** | Manual bus/LR reference logging and corporate liability ledger. | Electronic data interchange (EDI) or automated billing reconciliation with APSRTC. |
| **WhatsApp Messaging** | In-browser conversational simulator (`WhatsAppSimulator.tsx`). | Webhook receiver and outbound Meta Graph API integration (`v19.0+`). |

---

## 8. Remaining Business Decisions (To Be Documented Upon Confirmation)

The following operational policies remain open and will be configured once confirmed by business stakeholders:
1. **COD Shortfall Resolution:** Protocol when a driver submits less cash than recorded on the invoice (deduct from driver payables vs. dispute escalation).
2. **Sub-Agent Commission Frequency:** Default payment schedule per sub-agent tier (weekly on Monday vs. bi-weekly on 1st/16th).
3. **RTO Charge Responsibility Matrix:** Specific rules governing whether return shipping costs are billed to sender, sub-agent, or absorbed as operational loss based on cancellation reason.

---

**Next Step:** Awaiting explicit user approval to commence execution of **Stage 1 (Customer OTP Authentication & Tracking Privacy)**.

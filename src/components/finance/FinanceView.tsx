import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  SettlementRecord,
  CodEventType,
  CodMethod,
  CodVerificationStatus,
  ApsrtcPaymentStatus,
  ApsrtcReconciliationStatus
} from '../../types';
import { computeCodSummary, computeApsrtcSummary } from '../../utils/financialCalculations';
import {
  DollarSign,
  TrendingUp,
  Wallet,
  Building,
  CreditCard,
  Plus,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Receipt,
  Users,
  Truck,
  AlertTriangle,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export const FinanceView: React.FC = () => {
  const {
    bookings,
    agents,
    partners,
    settlements,
    createSettlement,
    recordCodEvent,
    associateApsrtcInvoice,
    recordApsrtcCorporatePayment,
    user
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'cod' | 'apsrtc' | 'settlements'>('overview');
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);

  // COD Event Modal State
  const [isCodModalOpen, setIsCodModalOpen] = useState(false);
  const [selectedCodBookingId, setSelectedCodBookingId] = useState<string>('');
  const [codForm, setCodForm] = useState({
    type: 'COLLECTION' as CodEventType,
    method: 'CASH_AT_DOORSTEP' as CodMethod,
    amount: 0,
    fromParty: '',
    toParty: '',
    transactionRef: '',
    verificationStatus: 'VERIFIED' as CodVerificationStatus,
    discrepancyAmount: 0,
    discrepancyReason: '',
    notes: ''
  });

  // APSRTC Corporate Association Modal State
  const [isApsrtcInvoiceModalOpen, setIsApsrtcInvoiceModalOpen] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    invoiceRef: `INV-APSRTC-${new Date().toISOString().slice(0, 7)}-${Math.floor(10 + Math.random() * 90)}`,
    billingPeriod: new Date().toISOString().slice(0, 7),
    selectedBookingIds: [] as string[]
  });

  // APSRTC Payment Modal State
  const [isApsrtcPaymentModalOpen, setIsApsrtcPaymentModalOpen] = useState(false);
  const [selectedInvoiceToPay, setSelectedInvoiceToPay] = useState<string>('');
  const [paymentRefInput, setPaymentRefInput] = useState('');

  // Settlement Form State
  const [settlementForm, setSettlementForm] = useState({
    entityType: 'SUB_AGENT' as 'SUB_AGENT' | 'PARTNER' | 'APSRTC',
    entityId: '',
    entityName: '',
    amount: 10000,
    period: 'Current Cycle Settlement',
    paymentMode: 'NEFT' as 'NEFT' | 'UPI' | 'CASH' | 'CHEQUE',
    paymentReference: '',
    notes: ''
  });

  // Calculate master financial totals
  const financials = useMemo(() => {
    let totalCustomerBilled = 0;
    let totalCollected = 0;
    let totalApsrtcCost = 0;
    let apsrtcPaid = 0;
    let totalPickupCost = 0;
    let totalDeliveryCost = 0;
    let totalSubAgentMargin = 0;
    let subAgentSettled = 0;
    let totalNetMargin = 0;

    bookings.forEach(b => {
      totalCustomerBilled += b.commercial.totalCustomerPayable;
      if (b.commercial.collectionStatus === 'COLLECTED') {
        totalCollected += b.commercial.totalCustomerPayable;
      }

      totalApsrtcCost += b.commercial.apsrtcFreight;
      if (b.commercial.apsrtcPaymentStatus === 'PAID') {
        apsrtcPaid += b.commercial.apsrtcFreight;
      }

      totalPickupCost += b.commercial.pickupPaymentResponsibility === 'SHUDHI' ? b.commercial.pickupCost : 0;
      totalDeliveryCost += b.commercial.deliveryPaymentResponsibility === 'SHUDHI' ? b.commercial.deliveryCost : 0;

      totalSubAgentMargin += b.commercial.subAgentMargin;
      if (b.commercial.subAgentMarginSettled) {
        subAgentSettled += b.commercial.subAgentMargin;
      }

      totalNetMargin += b.commercial.netOperationalMargin;
    });

    return {
      totalCustomerBilled,
      totalCollected,
      outstandingCollections: totalCustomerBilled - totalCollected,
      totalApsrtcCost,
      apsrtcPaid,
      apsrtcPending: totalApsrtcCost - apsrtcPaid,
      totalPickupCost,
      totalDeliveryCost,
      totalPartnerExpenses: totalPickupCost + totalDeliveryCost,
      totalSubAgentMargin,
      subAgentSettled,
      subAgentPending: totalSubAgentMargin - subAgentSettled,
      totalNetMargin
    };
  }, [bookings]);

  // Compute COD Ledger Summaries across all COD bookings
  const codBookings = useMemo(() => {
    return bookings
      .filter(b => b.commercial.paymentMode === 'TO_PAY_COD')
      .map(b => ({
        booking: b,
        summary: computeCodSummary(b)
      }));
  }, [bookings]);

  const codTotals = useMemo(() => {
    let expected = 0;
    let collected = 0;
    let handedOver = 0;
    let deposited = 0;
    let reconciled = 0;
    let outstanding = 0;
    let discrepancies = 0;

    codBookings.forEach(({ summary }) => {
      expected += summary.expectedAmount;
      collected += summary.collectedAmount;
      handedOver += summary.handedOverAmount;
      deposited += summary.depositedAmount;
      reconciled += summary.reconciledAmount;
      outstanding += summary.outstandingCollection;
      if (summary.hasDiscrepancy) discrepancies++;
    });

    return {
      expected,
      collected,
      handedOver,
      deposited,
      reconciled,
      outstanding,
      discrepancies,
      inTransitCash: Math.max(0, collected - deposited)
    };
  }, [codBookings]);

  // Compute APSRTC Corporate Liability Summary
  const apsrtcSummary = useMemo(() => {
    return computeApsrtcSummary(bookings);
  }, [bookings]);

  // Handlers
  const handleOpenCodModal = (bookingId: string) => {
    const target = bookings.find(b => b.id === bookingId);
    if (!target) return;
    const summary = computeCodSummary(target);
    setSelectedCodBookingId(bookingId);
    setCodForm({
      type: summary.collectedAmount === 0 ? 'COLLECTION' : (summary.handedOverAmount === 0 ? 'HANDOVER' : 'DEPOSIT_TO_BANK'),
      method: summary.collectedAmount === 0 ? 'CASH_AT_DOORSTEP' : 'DESTINATION_HUB_DEPOSIT',
      amount: summary.outstandingCollection > 0 ? summary.outstandingCollection : summary.expectedAmount,
      fromParty: summary.collectedAmount === 0 ? target.receiver.name : (target.assignedDeliveryPartnerId || 'Delivery Partner'),
      toParty: summary.collectedAmount === 0 ? (target.assignedDeliveryPartnerId || 'Delivery Partner') : `${target.destCity} Hub Desk`,
      transactionRef: `REC-${bookingId}-${Date.now().toString().slice(-4)}`,
      verificationStatus: 'VERIFIED',
      discrepancyAmount: 0,
      discrepancyReason: '',
      notes: 'Logged from Finance Portal.'
    });
    setIsCodModalOpen(true);
  };

  const handleSaveCodEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCodBookingId || codForm.amount <= 0) return;

    recordCodEvent(selectedCodBookingId, {
      type: codForm.type,
      method: codForm.method,
      amount: Number(codForm.amount),
      fromParty: codForm.fromParty,
      toParty: codForm.toParty,
      transactionRef: codForm.transactionRef || undefined,
      verificationStatus: codForm.verificationStatus,
      discrepancyAmount: Number(codForm.discrepancyAmount) || undefined,
      discrepancyReason: codForm.discrepancyReason || undefined,
      notes: codForm.notes || undefined
    });
    setIsCodModalOpen(false);
  };

  const handleOpenAssociateInvoiceModal = () => {
    const unbilledIds = bookings
      .filter(b => !b.commercial.apsrtcLiability?.corporateInvoiceRef)
      .map(b => b.id);

    setInvoiceForm({
      invoiceRef: `INV-APSRTC-${new Date().toISOString().slice(0, 7)}-${Math.floor(10 + Math.random() * 90)}`,
      billingPeriod: new Date().toISOString().slice(0, 7),
      selectedBookingIds: unbilledIds.slice(0, 10)
    });
    setIsApsrtcInvoiceModalOpen(true);
  };

  const handleSaveInvoiceAssociation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceForm.invoiceRef.trim() || invoiceForm.selectedBookingIds.length === 0) return;

    associateApsrtcInvoice(
      invoiceForm.selectedBookingIds,
      invoiceForm.invoiceRef.trim(),
      invoiceForm.billingPeriod
    );
    setIsApsrtcInvoiceModalOpen(false);
  };

  const handleOpenPaymentModal = (invoiceRef: string) => {
    setSelectedInvoiceToPay(invoiceRef);
    setPaymentRefInput(`NEFT-APS-${Date.now().toString().slice(-6)}`);
    setIsApsrtcPaymentModalOpen(true);
  };

  const handleSaveCorporatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceToPay || !paymentRefInput.trim()) return;

    recordApsrtcCorporatePayment(selectedInvoiceToPay, paymentRefInput.trim());
    setIsApsrtcPaymentModalOpen(false);
  };

  const handleOpenNewSettlement = () => {
    setSettlementForm({
      entityType: 'SUB_AGENT',
      entityId: agents[0]?.id || 'VSP-A1',
      entityName: agents[0]?.name || 'Sub-Agent',
      amount: 15000,
      period: 'Bi-Weekly Commission Clearing',
      paymentMode: 'NEFT',
      paymentReference: `NEFT-${Date.now().toString().slice(-6)}`,
      notes: 'Commission payout approved by SHUDHI Finance Desk.'
    });
    setIsSettlementModalOpen(true);
  };

  const handleSaveSettlement = (e: React.FormEvent) => {
    e.preventDefault();
    createSettlement({
      entityType: settlementForm.entityType,
      entityId: settlementForm.entityId,
      entityName: settlementForm.entityName,
      amount: Number(settlementForm.amount),
      period: settlementForm.period,
      status: 'PAID',
      paymentMode: settlementForm.paymentMode,
      paymentReference: settlementForm.paymentReference || 'TXN-REF-001',
      notes: settlementForm.notes,
      linkedBookingIds: []
    });
    setIsSettlementModalOpen(false);
  };

  const handleDownloadLedger = () => {
    const headers = [
      'Booking ID',
      'Date',
      'Payment Mode',
      'Customer Billed',
      'Collection Status',
      'APSRTC Bus Freight',
      'APSRTC Status',
      'Pickup Cost',
      'Delivery Cost',
      'Sub-Agent Margin',
      'Net SHUDHI Margin'
    ];
    const rows = bookings.map(b => [
      b.id,
      b.date,
      b.commercial.paymentMode,
      b.commercial.totalCustomerPayable,
      b.commercial.collectionStatus,
      b.commercial.apsrtcFreight,
      b.commercial.apsrtcLiability?.reconciliationStatus || b.commercial.apsrtcPaymentStatus,
      b.commercial.pickupCost,
      b.commercial.deliveryCost,
      b.commercial.subAgentMargin,
      b.commercial.netOperationalMargin
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `shudhi_financial_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Financial Management & Ledgers
          </h1>
          <p className="text-xs text-slate-500">
            Transparent revenue tracking, multi-event COD cash pipeline, APSRTC corporate liabilities, and partner settlement reconciliations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadLedger}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Financial CSV</span>
          </button>
          <button
            onClick={handleOpenNewSettlement}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Record Settlement</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Customer Billed
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            ₹{financials.totalCustomerBilled.toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-600 mt-1 block font-medium">
            ₹{financials.totalCollected.toLocaleString()} Cleared ({Math.round((financials.totalCollected / (financials.totalCustomerBilled || 1)) * 100)}%)
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            COD Cash Pipeline
          </span>
          <div className="text-2xl font-bold font-mono text-amber-700 tabular-nums">
            ₹{codTotals.expected.toLocaleString()}
          </div>
          <span className="text-[11px] text-amber-600 mt-1 block font-medium">
            ₹{codTotals.inTransitCash.toLocaleString()} In-Transit Cash with Fleet
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            APSRTC Corporate Payable
          </span>
          <div className="text-2xl font-bold font-mono text-cyan-800 tabular-nums">
            ₹{apsrtcSummary.totalLiability.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            ₹{apsrtcSummary.unpaidLiability.toLocaleString()} Outstanding Balance
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Sub-Agent Margins
          </span>
          <div className="text-2xl font-bold font-mono text-purple-800 tabular-nums">
            ₹{financials.totalSubAgentMargin.toLocaleString()}
          </div>
          <span className="text-[11px] text-purple-600 mt-1 block font-medium">
            ₹{financials.subAgentSettled.toLocaleString()} Cleared in Settlements
          </span>
        </div>

        <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[11px] font-semibold text-teal-400 uppercase tracking-wider block mb-1">
            Net SHUDHI Margin
          </span>
          <div className="text-2xl font-bold font-mono text-teal-400 tabular-nums">
            ₹{financials.totalNetMargin.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {Math.round((financials.totalNetMargin / (financials.totalCustomerBilled || 1)) * 100)}% Profit Margin
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-medium">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'overview' ? 'border-teal-600 text-teal-800 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Consignment Commercial Ledger</span>
        </button>
        <button
          onClick={() => setActiveTab('cod')}
          className={`py-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'cod' ? 'border-teal-600 text-teal-800 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Wallet className="w-4 h-4 text-amber-600" />
          <span>COD Cash Reconciliation ({codBookings.length})</span>
          {codTotals.discrepancies > 0 && (
            <span className="px-1.5 py-0.2 bg-rose-100 text-rose-700 rounded-full font-bold text-[10px]">
              {codTotals.discrepancies}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('apsrtc')}
          className={`py-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'apsrtc' ? 'border-teal-600 text-teal-800 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Truck className="w-4 h-4 text-cyan-600" />
          <span>APSRTC Corporate Liability</span>
        </button>
        <button
          onClick={() => setActiveTab('settlements')}
          className={`py-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'settlements' ? 'border-teal-600 text-teal-800 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Settlement Records & Payouts ({settlements.length})</span>
        </button>
      </div>

      {/* Tab 1: Booking-Wise Commercial Breakdown */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
              Booking-Wise Financial Ledger
            </h3>
            <span className="text-xs text-slate-500">{bookings.length} Consignments Recorded</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="px-4 py-3">Consignment ID</th>
                  <th className="px-4 py-3">Payment Mode</th>
                  <th className="px-4 py-3">Customer Billed</th>
                  <th className="px-4 py-3">Collection Status</th>
                  <th className="px-4 py-3">APSRTC Cost</th>
                  <th className="px-4 py-3">Pickup & Delivery</th>
                  <th className="px-4 py-3">Agent Margin</th>
                  <th className="px-4 py-3 text-right">Net SHUDHI Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.slice(0, 15).map(b => (
                  <tr key={b.id} className="hover:bg-slate-50 font-mono">
                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-900 block">{b.id}</span>
                      <span className="text-[10px] text-slate-400">{b.originCity.slice(0, 3)} → {b.destCity.slice(0, 3)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {b.commercial.paymentMode}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      ₹{b.commercial.totalCustomerPayable}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        b.commercial.collectionStatus === 'COLLECTED'
                          ? 'bg-emerald-50 text-emerald-700'
                          : b.commercial.collectionStatus === 'PENDING_RECONCILIATION'
                          ? 'bg-purple-50 text-purple-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {b.commercial.collectionStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">₹{b.commercial.apsrtcFreight}</td>
                    <td className="px-4 py-3 text-slate-600">
                      ₹{b.commercial.pickupCost + b.commercial.deliveryCost}
                    </td>
                    <td className="px-4 py-3 text-purple-700">₹{b.commercial.subAgentMargin}</td>
                    <td className="px-4 py-3 text-right font-bold text-teal-700">
                      ₹{b.commercial.netOperationalMargin}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: COD Cash Reconciliation Pipeline */}
      {activeTab === 'cod' && (
        <div className="space-y-4">
          {/* Sub-KPI summary for COD pipeline */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Expected COD</span>
              <span className="text-lg font-bold font-mono text-slate-900">₹{codTotals.expected.toLocaleString()}</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-amber-600 block">Driver Collected</span>
              <span className="text-lg font-bold font-mono text-amber-700">₹{codTotals.collected.toLocaleString()}</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-indigo-600 block">Hub Handover</span>
              <span className="text-lg font-bold font-mono text-indigo-700">₹{codTotals.handedOver.toLocaleString()}</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-teal-600 block">Bank Deposited</span>
              <span className="text-lg font-bold font-mono text-teal-700">₹{codTotals.deposited.toLocaleString()}</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-rose-500 block">Outstanding</span>
              <span className="text-lg font-bold font-mono text-rose-700">₹{codTotals.outstanding.toLocaleString()}</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Discrepancy Flags</span>
              <span className={`text-lg font-bold font-mono ${codTotals.discrepancies > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                {codTotals.discrepancies}
              </span>
            </div>
          </div>

          {/* COD Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                  COD Cash Reconciliation Pipeline
                </h3>
                <p className="text-[11px] text-slate-500">
                  Step-by-step audit of doorstep cash collection, hub handovers, and corporate bank deposits.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Booking Reference</th>
                    <th className="px-4 py-3">Expected COD</th>
                    <th className="px-4 py-3">Collected</th>
                    <th className="px-4 py-3">Handed Over</th>
                    <th className="px-4 py-3">Deposited</th>
                    <th className="px-4 py-3">Outstanding</th>
                    <th className="px-4 py-3">Reconciliation Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {codBookings.map(({ booking: b, summary }) => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-900 block">{b.id}</span>
                        <span className="text-[10px] text-slate-400">{b.destCity} · {b.receiver.name}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">₹{summary.expectedAmount}</td>
                      <td className="px-4 py-3 text-amber-700 font-semibold">₹{summary.collectedAmount}</td>
                      <td className="px-4 py-3 text-indigo-700">₹{summary.handedOverAmount}</td>
                      <td className="px-4 py-3 text-teal-700">₹{summary.depositedAmount}</td>
                      <td className="px-4 py-3 text-rose-700">₹{summary.outstandingCollection}</td>
                      <td className="px-4 py-3 font-sans">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          summary.status === 'RECONCILED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : summary.status === 'DISCREPANCY'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : summary.status === 'HANDED_OVER_PENDING_DEPOSIT'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : summary.status === 'COLLECTED_PENDING_HANDOVER'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {summary.status.replace(/_/g, ' ')}
                        </span>
                        {summary.hasDiscrepancy && (
                          <span className="block text-[10px] text-rose-600 mt-0.5">
                            Shortfall: ₹{summary.discrepancyTotal}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-sans">
                        <button
                          onClick={() => handleOpenCodModal(b.id)}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded transition-colors"
                        >
                          + Record Event
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: APSRTC Corporate Liability Ledger */}
      {activeTab === 'apsrtc' && (
        <div className="space-y-4">
          {/* Sub-KPI summary for APSRTC */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Freight Liability</span>
              <span className="text-lg font-bold font-mono text-cyan-900">₹{apsrtcSummary.totalLiability.toLocaleString()}</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-amber-600 block">Unbilled Liabilities</span>
              <span className="text-lg font-bold font-mono text-amber-700">₹{apsrtcSummary.unbilledLiability.toLocaleString()}</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-indigo-600 block">Invoiced Awaiting Payment</span>
              <span className="text-lg font-bold font-mono text-indigo-700">₹{apsrtcSummary.invoicedLiability.toLocaleString()}</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-emerald-600 block">Paid Corporate Freight</span>
              <span className="text-lg font-bold font-mono text-emerald-700">₹{apsrtcSummary.paidLiability.toLocaleString()}</span>
            </div>
          </div>

          {/* Grouped Corporate Invoices Section */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-600" />
                  APSRTC Corporate Invoice Batches
                </h3>
                <p className="text-[11px] text-slate-500">
                  Periodic invoices received from APSRTC logistics accounting for monthly reconciliation.
                </p>
              </div>
              <button
                onClick={handleOpenAssociateInvoiceModal}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
              >
                + Associate Invoices
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {apsrtcSummary.invoiceGroups.map(grp => (
                <div key={grp.invoiceRef} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-slate-900">{grp.invoiceRef}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      grp.paymentStatus === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {grp.paymentStatus}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 flex justify-between">
                    <span>Period: {grp.billingPeriod}</span>
                    <span className="font-semibold text-slate-800">{grp.shipmentCount} Shipments</span>
                  </div>
                  <div className="text-sm font-bold font-mono text-slate-900 flex justify-between items-center pt-1 border-t border-slate-200">
                    <span>Total Freight:</span>
                    <span>₹{grp.totalFreight.toLocaleString()}</span>
                  </div>
                  {grp.paymentStatus !== 'PAID' && (
                    <button
                      onClick={() => handleOpenPaymentModal(grp.invoiceRef)}
                      className="w-full mt-2 py-1 text-xs font-semibold text-white bg-cyan-700 hover:bg-cyan-800 rounded shadow-xs transition-colors"
                    >
                      Record Corporate Payment
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Shipment-Wise APSRTC Liability Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                Shipment-Wise APSRTC Freight Liabilities
              </h3>
              <span className="text-xs text-slate-500">{bookings.length} Shipments</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Booking Ref</th>
                    <th className="px-4 py-3">Origin → Dest</th>
                    <th className="px-4 py-3">APSRTC LR Number</th>
                    <th className="px-4 py-3">Bus Number</th>
                    <th className="px-4 py-3">Freight Payable</th>
                    <th className="px-4 py-3">Billing Period</th>
                    <th className="px-4 py-3">Invoice Ref</th>
                    <th className="px-4 py-3">Reconciliation</th>
                    <th className="px-4 py-3 text-right">Payment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {bookings.slice(0, 15).map(b => {
                    const l = b.commercial.apsrtcLiability;
                    return (
                      <tr key={b.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-bold text-slate-900">{b.id}</td>
                        <td className="px-4 py-3 text-slate-600 font-sans">{b.originCity} → {b.destCity}</td>
                        <td className="px-4 py-3 text-cyan-800 font-semibold">{l?.lrNumber || b.apsrtcRef || 'Pending'}</td>
                        <td className="px-4 py-3 text-slate-600">{l?.busNumber || '—'}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900">₹{l?.calculatedFreight || b.commercial.apsrtcFreight}</td>
                        <td className="px-4 py-3 text-slate-600">{l?.corporateBillingPeriod || '2026-11'}</td>
                        <td className="px-4 py-3 text-slate-700">{l?.corporateInvoiceRef || 'Unbilled'}</td>
                        <td className="px-4 py-3 font-sans">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            l?.reconciliationStatus === 'RECONCILED'
                              ? 'bg-emerald-50 text-emerald-700'
                              : l?.reconciliationStatus === 'INVOICED'
                              ? 'bg-indigo-50 text-indigo-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}>
                            {l?.reconciliationStatus || 'UNBILLED'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-sans">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            l?.paymentStatus === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {l?.paymentStatus || 'UNPAID'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Settlement Records */}
      {activeTab === 'settlements' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
              Historical Settlement Ledger (Agents, Partners & Transporter)
            </h3>
            <button
              onClick={handleOpenNewSettlement}
              className="text-xs font-semibold text-teal-700 hover:text-teal-900"
            >
              + Record Payout
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="px-4 py-3">Settlement ID</th>
                  <th className="px-4 py-3">Entity Type & Name</th>
                  <th className="px-4 py-3">Period / Batch</th>
                  <th className="px-4 py-3">Amount Cleared</th>
                  <th className="px-4 py-3">Payment Mode & Ref</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {settlements.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 font-mono">
                    <td className="px-4 py-3 font-bold text-slate-900">{s.id}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-800 block font-sans">{s.entityName}</span>
                      <span className="text-[10px] text-slate-400">{s.entityType}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-sans">{s.period}</td>
                    <td className="px-4 py-3 font-bold text-teal-700">₹{s.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {s.paymentMode} ({s.paymentReference})
                    </td>
                    <td className="px-4 py-3 text-slate-500">{s.date}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 font-sans">
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record COD Event Modal */}
      {isCodModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Wallet className="w-4 h-4 text-amber-600" />
                Record COD Event ({selectedCodBookingId})
              </h3>
              <button onClick={() => setIsCodModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCodEvent} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Event Type *</label>
                  <select
                    value={codForm.type}
                    onChange={e => setCodForm({ ...codForm, type: e.target.value as CodEventType })}
                    className="w-full p-2 border border-slate-300 rounded font-medium"
                  >
                    <option value="COLLECTION">COLLECTION (From Customer)</option>
                    <option value="HANDOVER">HANDOVER (Driver to Hub/Agent)</option>
                    <option value="DEPOSIT_TO_BANK">DEPOSIT TO BANK (To SHUDHI)</option>
                    <option value="RECONCILIATION_ADJUSTMENT">RECONCILIATION ADJUSTMENT</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Collection Method *</label>
                  <select
                    value={codForm.method}
                    onChange={e => setCodForm({ ...codForm, method: e.target.value as CodMethod })}
                    className="w-full p-2 border border-slate-300 rounded font-medium"
                  >
                    <option value="CASH_AT_DOORSTEP">Cash at Doorstep</option>
                    <option value="DESTINATION_HUB_DEPOSIT">Destination Hub Deposit</option>
                    <option value="DIRECT_UPI">Direct UPI</option>
                    <option value="SUB_AGENT_HANDOVER">Sub-Agent Handover</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={codForm.amount}
                  onChange={e => setCodForm({ ...codForm, amount: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-300 rounded font-mono font-bold text-sm text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">From Party *</label>
                  <input
                    type="text"
                    required
                    value={codForm.fromParty}
                    onChange={e => setCodForm({ ...codForm, fromParty: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">To Party *</label>
                  <input
                    type="text"
                    required
                    value={codForm.toParty}
                    onChange={e => setCodForm({ ...codForm, toParty: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Transaction Ref / Receipt</label>
                  <input
                    type="text"
                    placeholder="e.g. REC-9821"
                    value={codForm.transactionRef}
                    onChange={e => setCodForm({ ...codForm, transactionRef: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Verification Status</label>
                  <select
                    value={codForm.verificationStatus}
                    onChange={e => setCodForm({ ...codForm, verificationStatus: e.target.value as CodVerificationStatus })}
                    className="w-full p-2 border border-slate-300 rounded"
                  >
                    <option value="VERIFIED">VERIFIED (Amount Confirmed)</option>
                    <option value="PENDING_VERIFICATION">PENDING VERIFICATION</option>
                    <option value="DISCREPANCY">DISCREPANCY (Shortfall)</option>
                  </select>
                </div>
              </div>

              {codForm.verificationStatus === 'DISCREPANCY' && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded space-y-2">
                  <div>
                    <label className="block font-medium text-rose-800 mb-0.5">Discrepancy Shortfall (₹)</label>
                    <input
                      type="number"
                      value={codForm.discrepancyAmount}
                      onChange={e => setCodForm({ ...codForm, discrepancyAmount: Number(e.target.value) })}
                      className="w-full p-1.5 border border-rose-300 rounded font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-rose-800 mb-0.5">Discrepancy Reason</label>
                    <input
                      type="text"
                      placeholder="e.g. Customer short cash by ₹50"
                      value={codForm.discrepancyReason}
                      onChange={e => setCodForm({ ...codForm, discrepancyReason: e.target.value })}
                      className="w-full p-1.5 border border-rose-300 rounded"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-medium text-slate-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={codForm.notes}
                  onChange={e => setCodForm({ ...codForm, notes: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsCodModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded shadow-xs"
                >
                  Save COD Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Associate APSRTC Invoice Modal */}
      {isApsrtcInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Truck className="w-4 h-4 text-cyan-600" />
                Associate Corporate APSRTC Invoice
              </h3>
              <button onClick={() => setIsApsrtcInvoiceModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveInvoiceAssociation} className="space-y-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Corporate Invoice Reference *</label>
                <input
                  type="text"
                  required
                  value={invoiceForm.invoiceRef}
                  onChange={e => setInvoiceForm({ ...invoiceForm, invoiceRef: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Corporate Billing Period *</label>
                <input
                  type="month"
                  required
                  value={invoiceForm.billingPeriod}
                  onChange={e => setInvoiceForm({ ...invoiceForm, billingPeriod: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Select Unbilled Shipments ({invoiceForm.selectedBookingIds.length} selected)
                </label>
                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded p-2 space-y-1">
                  {bookings.map(b => (
                    <label key={b.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={invoiceForm.selectedBookingIds.includes(b.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setInvoiceForm({
                              ...invoiceForm,
                              selectedBookingIds: [...invoiceForm.selectedBookingIds, b.id]
                            });
                          } else {
                            setInvoiceForm({
                              ...invoiceForm,
                              selectedBookingIds: invoiceForm.selectedBookingIds.filter(id => id !== b.id)
                            });
                          }
                        }}
                      />
                      <span className="font-mono text-slate-800 font-medium">{b.id}</span>
                      <span className="text-slate-400">({b.originCity.slice(0, 3)}→{b.destCity.slice(0, 3)})</span>
                      <span className="text-cyan-800 font-semibold ml-auto font-mono">₹{b.commercial.apsrtcFreight}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsApsrtcInvoiceModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-white bg-cyan-700 hover:bg-cyan-800 rounded shadow-xs"
                >
                  Link Invoices
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record APSRTC Corporate Payment Modal */}
      {isApsrtcPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-cyan-600" />
                Settle Corporate Invoice ({selectedInvoiceToPay})
              </h3>
              <button onClick={() => setIsApsrtcPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCorporatePayment} className="space-y-3">
              <p className="text-slate-600">
                Record corporate banking clearance against invoice <strong>{selectedInvoiceToPay}</strong>. All associated shipments will be updated to PAID.
              </p>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Corporate Bank Transfer / UTR Ref *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UTR-APSRTC-998201"
                  value={paymentRefInput}
                  onChange={e => setPaymentRefInput(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded font-mono font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsApsrtcPaymentModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded shadow-xs"
                >
                  Confirm Invoice Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Settlement Modal */}
      {isSettlementModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-teal-600" />
                Record Settlement Payment
              </h3>
              <button onClick={() => setIsSettlementModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSettlement} className="space-y-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Entity Category</label>
                <select
                  value={settlementForm.entityType}
                  onChange={e => {
                    const t = e.target.value as any;
                    setSettlementForm({
                      ...settlementForm,
                      entityType: t,
                      entityId: t === 'SUB_AGENT' ? agents[0]?.id : (t === 'PARTNER' ? partners[0]?.id : 'APSRTC-HQ'),
                      entityName: t === 'SUB_AGENT' ? agents[0]?.name : (t === 'PARTNER' ? partners[0]?.name : 'APSRTC Logistics Division')
                    });
                  }}
                  className="w-full p-2 border border-slate-300 rounded font-medium"
                >
                  <option value="SUB_AGENT">Regional Sub-Agent</option>
                  <option value="PARTNER">Local Ground Delivery Partner</option>
                  <option value="APSRTC">APSRTC Logistics Division</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Select Payee Entity</label>
                {settlementForm.entityType === 'SUB_AGENT' ? (
                  <select
                    value={settlementForm.entityId}
                    onChange={e => {
                      const a = agents.find(x => x.id === e.target.value);
                      setSettlementForm({ ...settlementForm, entityId: e.target.value, entityName: a?.name || '' });
                    }}
                    className="w-full p-2 border border-slate-300 rounded"
                  >
                    {agents.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.city})</option>
                    ))}
                  </select>
                ) : settlementForm.entityType === 'PARTNER' ? (
                  <select
                    value={settlementForm.entityId}
                    onChange={e => {
                      const p = partners.find(x => x.id === e.target.value);
                      setSettlementForm({ ...settlementForm, entityId: e.target.value, entityName: p?.name || '' });
                    }}
                    className="w-full p-2 border border-slate-300 rounded"
                  >
                    {partners.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.city})</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    disabled
                    value="APSRTC Logistics Division (Vijayawada Central HQ)"
                    className="w-full p-2 border border-slate-200 bg-slate-100 rounded text-slate-700 font-semibold"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={settlementForm.amount}
                    onChange={e => setSettlementForm({ ...settlementForm, amount: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded font-mono font-bold text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={settlementForm.paymentMode}
                    onChange={e => setSettlementForm({ ...settlementForm, paymentMode: e.target.value as any })}
                    className="w-full p-2 border border-slate-300 rounded"
                  >
                    <option value="NEFT">Bank NEFT / RTGS</option>
                    <option value="UPI">Direct UPI</option>
                    <option value="CASH">Cash Voucher</option>
                    <option value="CHEQUE">Bank Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Transaction Ref / UTR *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UTR-8829103982"
                  value={settlementForm.paymentReference}
                  onChange={e => setSettlementForm({ ...settlementForm, paymentReference: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Settlement Period / Notes</label>
                <input
                  type="text"
                  value={settlementForm.period}
                  onChange={e => setSettlementForm({ ...settlementForm, period: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsSettlementModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded shadow-xs"
                >
                  Record Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { SettlementRecord } from '../../types';
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
  Users
} from 'lucide-react';

export const FinanceView: React.FC = () => {
  const { bookings, agents, partners, settlements, createSettlement, user } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'settlements' | 'ledgers'>('overview');
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);

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
    const headers = ['Booking ID', 'Date', 'Customer Billed', 'Collected', 'APSRTC Bus Freight', 'Pickup Expense', 'Delivery Expense', 'Sub-Agent Margin', 'Net SHUDHI Margin'];
    const rows = bookings.map(b => [
      b.id,
      b.date,
      b.commercial.totalCustomerPayable,
      b.commercial.collectionStatus === 'COLLECTED' ? b.commercial.totalCustomerPayable : 0,
      b.commercial.apsrtcFreight,
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
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Financial & Commercial Ledger</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 font-mono">
              Net Profit Engine
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Transparent revenue tracking, APSRTC transporter bus freight, local partner fees, and sub-agent settlements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadLedger}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Full Ledger CSV</span>
          </button>
          {user.role === 'SHUDHI_ADMIN' && (
            <button
              onClick={handleOpenNewSettlement}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Settlement Payout</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary Financial Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Total Customer Revenue
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            ₹{financials.totalCustomerBilled.toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-600 mt-1 block font-medium">
            ₹{financials.totalCollected.toLocaleString()} Collected ({Math.round((financials.totalCollected / (financials.totalCustomerBilled || 1)) * 100)}%)
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            APSRTC Bus Freight Cost
          </span>
          <div className="text-2xl font-bold font-mono text-cyan-800 tabular-nums">
            ₹{financials.totalApsrtcCost.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            ₹{financials.apsrtcPending.toLocaleString()} Pending Disbursement
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

        <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 shadow-xs">
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

      {/* Formula Explanation Callout */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <span className="font-bold text-slate-800 block mb-0.5">Transparent Profitability Engine:</span>
          <span>
            Net Operational Contribution = Customer Billed (₹{financials.totalCustomerBilled.toLocaleString()}) − APSRTC Bus Freight (₹{financials.totalApsrtcCost.toLocaleString()}) − Partner Fees (₹{financials.totalPartnerExpenses.toLocaleString()}) − Sub-Agent Commissions (₹{financials.totalSubAgentMargin.toLocaleString()})
          </span>
        </div>
        <div className="font-mono font-bold text-teal-700 text-sm whitespace-nowrap">
          = ₹{financials.totalNetMargin.toLocaleString()} Net
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-medium">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-2 border-b-2 transition-colors ${
            activeTab === 'overview' ? 'border-teal-600 text-teal-800 font-bold' : 'border-transparent text-slate-500'
          }`}
        >
          Consignment Commercial Ledger
        </button>
        <button
          onClick={() => setActiveTab('settlements')}
          className={`py-2 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'settlements' ? 'border-teal-600 text-teal-800 font-bold' : 'border-transparent text-slate-500'
          }`}
        >
          Settlement Records & Payouts ({settlements.length})
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
                  <th className="px-4 py-3">Customer Billed</th>
                  <th className="px-4 py-3">Collection</th>
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
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      ₹{b.commercial.totalCustomerPayable}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        b.commercial.collectionStatus === 'COLLECTED'
                          ? 'bg-emerald-50 text-emerald-700'
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

      {/* Tab 2: Settlement Records */}
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
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-900">{s.id}</td>
                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-slate-800 block">{s.entityName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{s.entityType} ({s.entityId})</span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">{s.period}</td>
                    <td className="px-4 py-3.5 font-mono font-bold text-emerald-700 text-sm">
                      ₹{s.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-700">
                      <div>{s.paymentMode}</div>
                      <div className="text-[10px] text-slate-400">{s.paymentReference}</div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 font-mono">{s.date}</td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
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

      {/* New Settlement Modal */}
      {isSettlementModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-teal-600" />
                Record Settlement Payment
              </h3>
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

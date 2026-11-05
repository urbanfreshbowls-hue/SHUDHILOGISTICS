import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { BookingStatus, City, BookingSource } from '../../types';
import { CITIES } from '../../constants/network';
import { StatusBadge } from '../common/StatusBadge';
import {
  Package,
  Clock,
  MapPin,
  Truck,
  Building2,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Wallet,
  ArrowUpRight,
  Filter,
  Calendar,
  Building,
  ExternalLink
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { bookings, setCurrentView, setSelectedBooking, settlements } = useApp();
  const [selectedCity, setSelectedCity] = useState<string>('ALL');
  const [selectedSource, setSelectedSource] = useState<string>('ALL');

  // Filtered bookings based on selected controls
  const filtered = useMemo(() => {
    return bookings.filter(b => {
      if (selectedCity !== 'ALL' && b.originCity !== selectedCity && b.destCity !== selectedCity) return false;
      if (selectedSource !== 'ALL' && b.source !== selectedSource) return false;
      return true;
    });
  }, [bookings, selectedCity, selectedSource]);

  // Operational KPIs
  const total = filtered.length;
  const pendingApproval = filtered.filter(b => b.status === 'PENDING_APPROVAL').length;
  const approved = filtered.filter(b => b.status === 'APPROVED').length;
  const activePickups = filtered.filter(b => ['PICKUP_INITIATED', 'OUT_FOR_PICKUP'].includes(b.status)).length;
  const inTransit = filtered.filter(b => ['HANDED_AT_ORIGIN_HUB', 'AT_ORIGIN_HUB', 'DISPATCHED_ON_THE_WAY', 'AT_TRANSHIPMENT', 'JOURNEY_RESUMED', 'REACHED_DEST_HUB'].includes(b.status)).length;
  const activeDeliveries = filtered.filter(b => ['UNLOADED_AT_DEST_HUB', 'AT_DELIVERY_FACILITY', 'DELIVERY_INITIATED', 'OUT_FOR_DELIVERY'].includes(b.status)).length;
  const delivered = filtered.filter(b => b.status === 'DELIVERED').length;
  const exceptions = filtered.filter(b => ['EXCEPTION', 'PICKUP_FAILED', 'DELIVERY_FAILED', 'REJECTED'].includes(b.status)).length;

  // Financial KPIs
  const totalCustomerRevenue = filtered.reduce((sum, b) => sum + b.commercial.totalCustomerPayable, 0);
  const collectedRevenue = filtered
    .filter(b => b.commercial.collectionStatus === 'COLLECTED')
    .reduce((sum, b) => sum + b.commercial.totalCustomerPayable, 0);
  const pendingCustomerCollections = totalCustomerRevenue - collectedRevenue;
  
  const apsrtcPayables = filtered
    .filter(b => b.apsrtcRef && b.commercial.apsrtcPaymentStatus === 'PENDING')
    .reduce((sum, b) => sum + b.commercial.apsrtcFreight, 0);

  const pendingAgentSettlements = filtered
    .filter(b => !b.commercial.subAgentMarginSettled && b.commercial.subAgentMargin > 0)
    .reduce((sum, b) => sum + b.commercial.subAgentMargin, 0);

  const pendingPartnerPayments = filtered
    .filter(b => b.commercial.pickupPaymentStatus === 'PENDING' || b.commercial.deliveryPaymentStatus === 'PENDING')
    .reduce((sum, b) => {
      let cost = 0;
      if (b.commercial.pickupPaymentStatus === 'PENDING') cost += b.commercial.pickupCost;
      if (b.commercial.deliveryPaymentStatus === 'PENDING') cost += b.commercial.deliveryCost;
      return sum + cost;
    }, 0);

  const netOperationalMargin = filtered.reduce((sum, b) => sum + b.commercial.netOperationalMargin, 0);

  // City-wise distribution
  const cityStats = useMemo(() => {
    return CITIES.map(city => {
      const originCount = filtered.filter(b => b.originCity === city).length;
      const destCount = filtered.filter(b => b.destCity === city).length;
      const deliveredCount = filtered.filter(b => b.destCity === city && b.status === 'DELIVERED').length;
      return { city, originCount, destCount, deliveredCount, totalActive: originCount + destCount };
    });
  }, [filtered]);

  return (
    <div className="space-y-6">
      {/* Title & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">SHUDHI Operations Dashboard</h1>
          <p className="text-xs text-slate-500">
            Real-time multi-city network overview across Visakhapatnam, Rajamahendravaram, Vijayawada, and Hyderabad.
          </p>
        </div>

        {/* Global Filter Bar */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs shadow-2xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCity}
              onChange={e => setSelectedCity(e.target.value)}
              className="bg-transparent border-none text-slate-700 font-medium focus:outline-none pr-2"
            >
              <option value="ALL">All Network Hubs</option>
              {CITIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs shadow-2xs">
            <select
              value={selectedSource}
              onChange={e => setSelectedSource(e.target.value)}
              className="bg-transparent border-none text-slate-700 font-medium focus:outline-none pr-2"
            >
              <option value="ALL">All Booking Channels</option>
              <option value="ADMIN_DIRECT">Admin Direct</option>
              <option value="SUB_AGENT">Sub-Agent Desks</option>
              <option value="CUSTOMER_WHATSAPP">WhatsApp Inbound</option>
              <option value="CUSTOMER_PORTAL">Web Portal</option>
            </select>
          </div>
        </div>
      </div>

      {/* Primary Operational Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Total Bookings */}
        <div
          onClick={() => setCurrentView('bookings')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-teal-500 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Consignments</span>
            <Package className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">{total}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Active across 4 hubs</span>
        </div>

        {/* Pending Approvals */}
        <div
          onClick={() => setCurrentView('approval-queue')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            pendingApproval > 0
              ? 'bg-amber-50/50 border-amber-300 hover:border-amber-500 shadow-xs'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-900">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-900 tabular-nums">{pendingApproval}</div>
          <span className="text-[11px] text-amber-700 mt-1 block">Awaiting APSRTC allocation</span>
        </div>

        {/* First-Mile Active Pickups */}
        <div
          onClick={() => setCurrentView('pickups')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-purple-500 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">First-Mile Pickups</span>
            <MapPin className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">{activePickups}</div>
          <span className="text-[11px] text-purple-600 mt-1 block font-medium">Assigned ground riders</span>
        </div>

        {/* APSRTC Mid-Mile Transit */}
        <div
          onClick={() => setCurrentView('transit')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-cyan-500 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">APSRTC In Transit</span>
            <Truck className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">{inTransit}</div>
          <span className="text-[11px] text-cyan-700 mt-1 block font-medium">Intercity bus transit</span>
        </div>

        {/* Last-Mile Deliveries */}
        <div
          onClick={() => setCurrentView('deliveries')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-500 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Out for Delivery</span>
            <Building2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">{activeDeliveries}</div>
          <span className="text-[11px] text-indigo-600 mt-1 block font-medium">Local door deliveries</span>
        </div>

        {/* Successfully Delivered */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed / POD</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700 tabular-nums">{delivered}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Verified proof uploaded</span>
        </div>

        {/* Exceptions & Failed */}
        <div
          onClick={() => setCurrentView('bookings')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            exceptions > 0 ? 'bg-rose-50/50 border-rose-300' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-900">Issues & Failed</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-800 tabular-nums">{exceptions}</div>
          <span className="text-[11px] text-rose-600 mt-1 block font-medium">Requires investigation</span>
        </div>

        {/* Net Operational Contribution */}
        <div
          onClick={() => setCurrentView('finance')}
          className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 shadow-xs hover:border-teal-500 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-400">Net SHUDHI Margin</span>
            <TrendingUp className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-teal-400 tabular-nums">
            ₹{netOperationalMargin.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Transparent net contribution</span>
        </div>
      </div>

      {/* Financial Health Strip */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <h3 className="font-semibold text-slate-900 text-xs uppercase tracking-wider">
              Commercial & Settlement Ledger Health
            </h3>
          </div>
          <button
            onClick={() => setCurrentView('finance')}
            className="text-xs text-teal-700 hover:text-teal-900 font-medium inline-flex items-center gap-1"
          >
            Open Full Ledger <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">Pending Customer Collections</span>
            <span className="text-base font-bold font-mono text-slate-900 tabular-nums">
              ₹{pendingCustomerCollections.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">COD / To-Pay balances</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">APSRTC Transporter Payables</span>
            <span className="text-base font-bold font-mono text-slate-900 tabular-nums">
              ₹{apsrtcPayables.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Mid-mile bus cargo freight</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Pending Sub-Agent Margins</span>
            <span className="text-base font-bold font-mono text-slate-900 tabular-nums">
              ₹{pendingAgentSettlements.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Across 13 regional agents</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Local Partner Payouts Due</span>
            <span className="text-base font-bold font-mono text-slate-900 tabular-nums">
              ₹{pendingPartnerPayments.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Pickup & delivery riders</span>
          </div>
        </div>
      </div>

      {/* Network Distribution & Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* City-wise Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-slate-600" />
              <h3 className="font-semibold text-slate-900 text-xs uppercase tracking-wider">
                City Network Hubs
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">4 Active Hubs</span>
          </div>

          <div className="space-y-3.5">
            {cityStats.map(stat => (
              <div key={stat.city} className="space-y-1 text-xs">
                <div className="flex items-center justify-between font-medium">
                  <span className="text-slate-800">{stat.city}</span>
                  <span className="font-mono text-slate-500 tabular-nums">
                    {stat.originCount} out · {stat.destCount} in
                  </span>
                </div>
                {/* Visual bar */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                  <div
                    className="bg-teal-500 h-full"
                    style={{ width: `${Math.min(100, (stat.originCount / (total || 1)) * 100)}%` }}
                  />
                  <div
                    className="bg-indigo-400 h-full"
                    style={{ width: `${Math.min(100, (stat.destCount / (total || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-slate-50 rounded-lg text-[11px] text-slate-500 space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-teal-500 inline-block" />
              <span>Outbound originating shipments</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-400 inline-block" />
              <span>Inbound destination deliveries</span>
            </div>
          </div>
        </div>

        {/* Live Operational Activity Feed */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-semibold text-slate-900 text-xs uppercase tracking-wider">
              Recent Network Consignments
            </h3>
            <button
              onClick={() => setCurrentView('bookings')}
              className="text-xs text-teal-700 hover:text-teal-900 font-medium"
            >
              View all bookings →
            </button>
          </div>

          <div className="divide-y divide-slate-100 overflow-x-auto">
            {filtered.slice(0, 7).map(b => (
              <div
                key={b.id}
                onClick={() => setSelectedBooking(b)}
                className="py-3 px-2 flex items-center justify-between gap-4 hover:bg-slate-50 rounded-md cursor-pointer transition-colors text-xs"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono text-slate-900">{b.id}</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {b.apsrtcRef || 'Awaiting Ref'}
                    </span>
                  </div>
                  <p className="text-slate-500 truncate mt-0.5">
                    {b.sender.name} ({b.originCity}) → {b.receiver.name} ({b.destCity})
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right hidden sm:block">
                    <span className="font-mono font-semibold text-slate-800">
                      ₹{b.commercial.totalCustomerPayable}
                    </span>
                    <span className="text-[10px] text-slate-400 block">{b.commercial.paymentMode}</span>
                  </div>
                  <StatusBadge status={b.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

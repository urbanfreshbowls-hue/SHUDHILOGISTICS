import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Package,
  Clock,
  MapPin,
  Truck,
  Building2,
  Users,
  Bike,
  MessageSquare,
  PhoneCall,
  DollarSign,
  FileBarChart,
  History,
  Settings,
  ChevronDown,
  ChevronRight,
  LogOut,
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { user, currentView, setCurrentView, bookings, resetAllData } = useApp();
  const [trackingGroupOpen, setTrackingGroupOpen] = useState(true);

  // Role checks
  const isAdmin = user.role === 'SHUDHI_ADMIN';
  const isAgent = user.role === 'SUB_AGENT';
  const isPartner = user.role === 'PARTNER';
  const isCustomer = user.role === 'CUSTOMER';

  // Badge counts
  const pendingApprovalsCount = bookings.filter(b => b.status === 'PENDING_APPROVAL').length;
  
  const relevantBookings = isAdmin
    ? bookings
    : isAgent
    ? bookings.filter(b => b.agentId === user.id)
    : isPartner
    ? bookings.filter(b => b.assignedPickupPartnerId === user.id || b.assignedDeliveryPartnerId === user.id)
    : bookings;

  const pickupsCount = relevantBookings.filter(b =>
    ['APPROVED', 'PICKUP_INITIATED', 'OUT_FOR_PICKUP'].includes(b.status)
  ).length;

  const transitCount = relevantBookings.filter(b =>
    ['HANDED_AT_ORIGIN_HUB', 'AT_ORIGIN_HUB', 'DISPATCHED_ON_THE_WAY', 'AT_TRANSHIPMENT', 'JOURNEY_RESUMED', 'REACHED_DEST_HUB'].includes(b.status)
  ).length;

  const deliveriesCount = relevantBookings.filter(b =>
    ['UNLOADED_AT_DEST_HUB', 'AT_DELIVERY_FACILITY', 'DELIVERY_INITIATED', 'OUT_FOR_DELIVERY'].includes(b.status)
  ).length;

  const navigate = (view: string) => {
    setCurrentView(view);
    onCloseMobile();
  };

  const navItemClass = (view: string) => {
    const isActive = currentView === view;
    return `w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
      isActive
        ? 'bg-teal-600 text-white shadow-xs'
        : 'text-slate-300 hover:text-white hover:bg-slate-800'
    }`;
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/75 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-950 text-slate-200 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 md:static ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center">
              <Package className="w-4 h-4 text-teal-400" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-white text-sm block">SHUDHI LOGISTICS</span>
              <span className="text-[10px] text-teal-400 font-medium block">Operations Platform</span>
            </div>
          </div>
        </div>

        {/* Current user badge in sidebar */}
        <div className="px-4 py-3 bg-slate-900/40 border-b border-slate-800/80">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Active Session</div>
          <div className="font-medium text-xs text-white truncate">{user.name}</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-400" />
            <span className="text-[11px] text-slate-400">{user.role.replace('_', ' ')}</span>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 text-xs">
          {/* Main Dashboard */}
          <button onClick={() => navigate('dashboard')} className={navItemClass('dashboard')}>
            <div className="flex items-center gap-2.5">
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Dashboard</span>
            </div>
          </button>

          {/* Bookings */}
          <button onClick={() => navigate('bookings')} className={navItemClass('bookings')}>
            <div className="flex items-center gap-2.5">
              <Package className="w-4 h-4 shrink-0" />
              <span>Bookings Directory</span>
            </div>
          </button>

          {/* Booking Approval Queue (Admin only) */}
          {isAdmin && (
            <button onClick={() => navigate('approval-queue')} className={navItemClass('approval-queue')}>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Approval Queue</span>
              </div>
              {pendingApprovalsCount > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 font-bold text-[10px] rounded-full">
                  {pendingApprovalsCount}
                </span>
              )}
            </button>
          )}

          {/* Operations Dropdown Section */}
          <div className="pt-2">
            <button
              onClick={() => setTrackingGroupOpen(!trackingGroupOpen)}
              className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] uppercase tracking-wider font-bold text-slate-400 hover:text-slate-200"
            >
              <span>Field & Transit</span>
              {trackingGroupOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {trackingGroupOpen && (
              <div className="mt-1 space-y-1 pl-2 border-l border-slate-800 ml-3">
                {/* First-Mile Pickups */}
                <button onClick={() => navigate('pickups')} className={navItemClass('pickups')}>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-purple-400" />
                    <span>First-Mile Pickups</span>
                  </div>
                  {pickupsCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                      {pickupsCount}
                    </span>
                  )}
                </button>

                {/* Mid-Mile Transit */}
                <button onClick={() => navigate('transit')} className={navItemClass('transit')}>
                  <div className="flex items-center gap-2">
                    <Truck className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                    <span>APSRTC Transit</span>
                  </div>
                  {transitCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                      {transitCount}
                    </span>
                  )}
                </button>

                {/* Last-Mile Deliveries */}
                <button onClick={() => navigate('deliveries')} className={navItemClass('deliveries')}>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
                    <span>Last-Mile Deliveries</span>
                  </div>
                  {deliveriesCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                      {deliveriesCount}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Network Directories (Admin only) */}
          {isAdmin && (
            <div className="pt-2 space-y-1">
              <span className="px-3 py-1 text-[11px] uppercase tracking-wider font-bold text-slate-400 block">
                Partner Network
              </span>
              <button onClick={() => navigate('sub-agents')} className={navItemClass('sub-agents')}>
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 shrink-0 text-blue-400" />
                  <span>Sub-Agents (13)</span>
                </div>
              </button>
              <button onClick={() => navigate('partners')} className={navItemClass('partners')}>
                <div className="flex items-center gap-2.5">
                  <Bike className="w-4 h-4 shrink-0 text-teal-400" />
                  <span>Local Partners</span>
                </div>
              </button>
            </div>
          )}

          {/* Communications */}
          <div className="pt-2 space-y-1">
            <span className="px-3 py-1 text-[11px] uppercase tracking-wider font-bold text-slate-400 block">
              Communication
            </span>
            <button onClick={() => navigate('whatsapp-simulator')} className={navItemClass('whatsapp-simulator')}>
              <div className="flex items-center gap-2.5">
                <PhoneCall className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>WhatsApp Simulator</span>
              </div>
            </button>
            {isAdmin && (
              <button onClick={() => navigate('whatsapp-admin')} className={navItemClass('whatsapp-admin')}>
                <div className="flex items-center gap-2.5">
                  <MessageSquare className="w-4 h-4 shrink-0 text-teal-400" />
                  <span>Unified WA Inbox</span>
                </div>
              </button>
            )}
          </div>

          {/* Commercial & Reports (Admin & Agent) */}
          {(isAdmin || isAgent) && (
            <div className="pt-2 space-y-1">
              <span className="px-3 py-1 text-[11px] uppercase tracking-wider font-bold text-slate-400 block">
                Financials
              </span>
              <button onClick={() => navigate('finance')} className={navItemClass('finance')}>
                <div className="flex items-center gap-2.5">
                  <DollarSign className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{isAdmin ? 'Finance & Settlements' : 'My Margin Ledger'}</span>
                </div>
              </button>
              {isAdmin && (
                <button onClick={() => navigate('reports')} className={navItemClass('reports')}>
                  <div className="flex items-center gap-2.5">
                    <FileBarChart className="w-4 h-4 shrink-0 text-sky-400" />
                    <span>CSV Reports & Analytics</span>
                  </div>
                </button>
              )}
            </div>
          )}

          {/* Governance & System (Admin only) */}
          {isAdmin && (
            <div className="pt-2 space-y-1">
              <span className="px-3 py-1 text-[11px] uppercase tracking-wider font-bold text-slate-400 block">
                Governance
              </span>
              <button onClick={() => navigate('audit-logs')} className={navItemClass('audit-logs')}>
                <div className="flex items-center gap-2.5">
                  <History className="w-4 h-4 shrink-0 text-slate-400" />
                  <span>System Audit Logs</span>
                </div>
              </button>
              <button onClick={() => navigate('settings')} className={navItemClass('settings')}>
                <div className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4 shrink-0 text-slate-400" />
                  <span>Hubs & Integrations</span>
                </div>
              </button>
            </div>
          )}
        </nav>

        {/* Footer actions */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/60 space-y-1.5">
          <button
            onClick={() => {
              if (window.confirm('Reset all demo data back to clean seed records?')) {
                resetAllData();
              }
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Reset Demo Records</span>
          </button>
        </div>
      </aside>
    </>
  );
};

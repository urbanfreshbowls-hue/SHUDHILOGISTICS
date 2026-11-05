import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { INITIAL_SUB_AGENTS, INITIAL_LOCAL_PARTNERS, CITIES } from '../../constants/network';
import { UserRole, City } from '../../types';
import {
  Bell,
  Wallet,
  User,
  ChevronDown,
  Shield,
  Truck,
  Building2,
  Users,
  Menu,
  Plus
} from 'lucide-react';

interface HeaderProps {
  onToggleMobileMenu: () => void;
  onOpenCreateBooking: () => void;
  onToggleNotifications: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileMenu,
  onOpenCreateBooking,
  onToggleNotifications
}) => {
  const { user, switchRole, notifications, bookings, setCurrentView } = useApp();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Calculate quick metrics for header
  const totalCollections = bookings
    .filter(b => b.commercial.collectionStatus === 'COLLECTED')
    .reduce((sum, b) => sum + b.commercial.totalCustomerPayable, 0);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left: Mobile hamburger & Context breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500">
          <span className="text-slate-900 font-semibold tracking-tight">SHUDHI LOGISTICS</span>
          <span>/</span>
          <span className="text-teal-700 capitalize font-medium">{user.role.replace('_', ' ')}</span>
          {user.city && (
            <>
              <span>/</span>
              <span className="text-slate-700 font-medium">{user.city}</span>
            </>
          )}
        </div>
      </div>

      {/* Right: Quick actions, notifications, role switcher */}
      <div className="flex items-center gap-3">
        {/* Quick New Booking Button */}
        <button
          onClick={onOpenCreateBooking}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-md shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Booking</span>
        </button>

        {/* Collections Balance Pill */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-900 text-white px-3.5 py-1.5 rounded-md text-xs font-medium shadow-xs">
          <Wallet className="w-3.5 h-3.5 text-teal-400" />
          <span>Collections:</span>
          <span className="font-mono text-teal-400 tabular-nums font-semibold">
            ₹{totalCollections.toLocaleString()}
          </span>
        </div>

        {/* Notification Bell */}
        <button
          onClick={onToggleNotifications}
          className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-teal-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Role Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-left transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-slate-900 text-teal-400 font-bold text-xs flex items-center justify-center shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="hidden md:block leading-tight">
              <p className="text-xs font-semibold text-slate-900 truncate max-w-[130px]">{user.name}</p>
              <p className="text-[10px] text-teal-600 font-medium">{user.role}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {roleDropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50 text-xs overflow-hidden"
              onMouseLeave={() => setRoleDropdownOpen(false)}
            >
              <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
                <span className="font-semibold text-slate-800 block">Switch Demo Identity</span>
                <span className="text-[10px] text-slate-500">Experience true role-based access control</span>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {/* Admin */}
                <div className="p-1">
                  <button
                    onClick={() => {
                      switchRole('SHUDHI_ADMIN', 'SHUDHI-HQ', 'SHUDHI ADMIN (HQ)');
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded flex items-center justify-between ${
                      user.role === 'SHUDHI_ADMIN' ? 'bg-teal-50 text-teal-800 font-semibold' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-teal-600" />
                      <span>SHUDHI ADMIN (Full Access)</span>
                    </div>
                  </button>
                </div>

                {/* Sub-Agents by City */}
                <div className="p-1">
                  <span className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Sub-Agents (Restricted Access)
                  </span>
                  <div className="grid grid-cols-2 gap-1 px-1">
                    {INITIAL_SUB_AGENTS.map(agent => (
                      <button
                        key={agent.id}
                        onClick={() => {
                          switchRole('SUB_AGENT', agent.id, `${agent.name} (${agent.id})`, agent.city);
                          setRoleDropdownOpen(false);
                        }}
                        className={`text-left px-2 py-1.5 rounded truncate text-[11px] ${
                          user.id === agent.id ? 'bg-teal-50 text-teal-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                        title={`${agent.name} - ${agent.city}`}
                      >
                        {agent.id} ({agent.city.slice(0, 3)})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Local Partners */}
                <div className="p-1">
                  <span className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Local Partners (Mobile / Field)
                  </span>
                  <div className="grid grid-cols-2 gap-1 px-1">
                    {INITIAL_LOCAL_PARTNERS.map(partner => (
                      <button
                        key={partner.id}
                        onClick={() => {
                          switchRole('PARTNER', partner.id, partner.name, partner.city);
                          setRoleDropdownOpen(false);
                        }}
                        className={`text-left px-2 py-1.5 rounded truncate text-[11px] ${
                          user.id === partner.id ? 'bg-teal-50 text-teal-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                        title={partner.name}
                      >
                        {partner.id} ({partner.city.slice(0, 3)})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Customer Simulation */}
                <div className="p-1">
                  <button
                    onClick={() => {
                      switchRole('CUSTOMER', 'CUST-001', 'Customer (Ramesh Chandra)', 'VISAKHAPATNAM');
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded flex items-center justify-between ${
                      user.role === 'CUSTOMER' ? 'bg-teal-50 text-teal-800 font-semibold' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-purple-600" />
                      <span>Customer Portal Simulation</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

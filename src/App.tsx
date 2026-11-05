import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { Toast } from './components/common/Toast';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { BookingDetailModal } from './components/common/BookingDetailModal';
import { PhotoUploadModal } from './components/common/PhotoUploadModal';

// Views
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { AgentDashboard } from './components/dashboard/AgentDashboard';
import { PartnerDashboard } from './components/dashboard/PartnerDashboard';
import { CustomerPortal } from './components/dashboard/CustomerPortal';

import { BookingsView } from './components/bookings/BookingsView';
import { BookingCreateModal } from './components/bookings/BookingCreateModal';
import { ApprovalQueueView } from './components/bookings/ApprovalQueueView';

import { PickupsView } from './components/operations/PickupsView';
import { TransitView } from './components/operations/TransitView';
import { DeliveriesView } from './components/operations/DeliveriesView';

import { SubAgentDirectory } from './components/directory/SubAgentDirectory';
import { PartnerDirectory } from './components/directory/PartnerDirectory';

import { WhatsAppSimulator } from './components/whatsapp/WhatsAppSimulator';
import { WhatsAppAdminCenter } from './components/whatsapp/WhatsAppAdminCenter';

import { FinanceView } from './components/finance/FinanceView';
import { ReportsView } from './components/reports/ReportsView';
import { AuditLogsView } from './components/audit/AuditLogsView';
import { SettingsView } from './components/settings/SettingsView';

const MainLayout: React.FC = () => {
  const { currentView, user } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCreateBookingOpen, setIsCreateBookingOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Render role-specific dashboard
  const renderDashboard = () => {
    switch (user.role) {
      case 'SUB_AGENT':
        return <AgentDashboard onOpenCreateBooking={() => setIsCreateBookingOpen(true)} />;
      case 'PARTNER':
        return <PartnerDashboard />;
      case 'CUSTOMER':
        return <CustomerPortal onOpenCreateBooking={() => setIsCreateBookingOpen(true)} />;
      case 'SHUDHI_ADMIN':
      default:
        return <AdminDashboard />;
    }
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return renderDashboard();
      case 'bookings':
        return <BookingsView onOpenCreateBooking={() => setIsCreateBookingOpen(true)} />;
      case 'approval-queue':
        return <ApprovalQueueView />;
      case 'pickups':
        return <PickupsView />;
      case 'transit':
        return <TransitView />;
      case 'deliveries':
        return <DeliveriesView />;
      case 'sub-agents':
        return <SubAgentDirectory />;
      case 'partners':
        return <PartnerDirectory />;
      case 'whatsapp-simulator':
        return <WhatsAppSimulator />;
      case 'whatsapp-admin':
        return <WhatsAppAdminCenter />;
      case 'finance':
        return <FinanceView />;
      case 'reports':
        return <ReportsView />;
      case 'audit-logs':
        return <AuditLogsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden text-slate-900 font-sans">
      {/* Persistent Sidebar */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
          onOpenCreateBooking={() => setIsCreateBookingOpen(true)}
          onToggleNotifications={() => setIsNotificationOpen(!isNotificationOpen)}
        />

        {/* Viewport Canvas */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            {renderCurrentView()}
          </div>
        </main>
      </div>

      {/* Modals and Overlays */}
      <BookingCreateModal
        isOpen={isCreateBookingOpen}
        onClose={() => setIsCreateBookingOpen(false)}
      />
      <BookingDetailModal />
      <PhotoUploadModal />
      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
      />
      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

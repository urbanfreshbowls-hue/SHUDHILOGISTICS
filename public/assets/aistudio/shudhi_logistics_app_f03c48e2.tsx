import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  LayoutDashboard, Package, Truck, MapPin, Users, Phone, 
  Settings, LogOut, CheckCircle, Clock, XCircle, AlertTriangle,
  ChevronRight, Search, Plus, Filter, MessageSquare, Send,
  FileText, Activity, User, Home, ArrowLeft, Wallet, Camera, Map, ListChecks, UploadCloud,
  MessageCircle, BarChart3, ShieldCheck
} from 'lucide-react';

// --- UTILS & MOCK DATA GENERATION ---

const generateId = (prefix) => `${prefix}${Math.floor(1000 + Math.random() * 9000)}`;
const today = new Date().toISOString().split('T')[0];

const CITIES = ['VISAKHAPATNAM', 'RAJAMAHENDRAVARAM', 'VIJAYAWADA', 'HYDERABAD'];
const STATUSES = {
  PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Approved',
  // Pickups
  PICKUP_INITIATED: 'Pick-up Initiated',
  OUT_FOR_PICKUP: 'Out for Pick-up',
  PICKUP_COMPLETED: 'Pick-up Completed',
  PICKUP_FAILED: 'Pick-up Failed',
  HANDED_AT_HUB: 'Handed at HUB',
  // Transit
  AT_ORIGIN_HUB: 'At Origin HUB',
  ON_THE_WAY: 'On the way to Destination',
  AT_TRANSHIPMENT: 'At Transhipment',
  REACHED_DEST_HUB: 'Reached Destination Hub',
  DELIVERED_AT_HUB: 'Delivered at hub',
  // Deliveries
  AT_DELIVERY_FACILITY: 'At Delivery Facility',
  DELIVERY_INITIATED: 'Delivery Initiated',
  OUT_FOR_DELIVERY: 'Out For Delivery',
  DELIVERED: 'Delivered',
  DELIVERY_FAILED: 'Delivery Failed',
  // Exceptions
  REJECTED: 'Rejected',
  EXCEPTION: 'Exception / Issue'
};

const INITIAL_AGENTS = [
  { id: 'VSP-A1', name: 'Visakha Agent 1', city: 'VISAKHAPATNAM', status: 'Active' },
  { id: 'VSP-A2', name: 'Visakha Agent 2', city: 'VISAKHAPATNAM', status: 'Active' },
  { id: 'VSP-A3', name: 'Visakha Agent 3', city: 'VISAKHAPATNAM', status: 'Active' },
  { id: 'VSP-A4', name: 'Visakha Agent 4', city: 'VISAKHAPATNAM', status: 'Active' },
  { id: 'VSP-A5', name: 'Visakha Agent 5', city: 'VISAKHAPATNAM', status: 'Active' },
  { id: 'RJY-A1', name: 'Rajmundry Agent 1', city: 'RAJAMAHENDRAVARAM', status: 'Active' },
  { id: 'VJW-A1', name: 'Vijayawada Agent 1', city: 'VIJAYAWADA', status: 'Active' },
  { id: 'VJW-A2', name: 'Vijayawada Agent 2', city: 'VIJAYAWADA', status: 'Active' },
  { id: 'VJW-A3', name: 'Vijayawada Agent 3', city: 'VIJAYAWADA', status: 'Active' },
  { id: 'VJW-A4', name: 'Vijayawada Agent 4', city: 'VIJAYAWADA', status: 'Active' },
  { id: 'HYD-A1', name: 'Hyderabad Agent 1', city: 'HYDERABAD', status: 'Active' },
  { id: 'HYD-A2', name: 'Hyderabad Agent 2', city: 'HYDERABAD', status: 'Active' },
  { id: 'HYD-A3', name: 'Hyderabad Agent 3', city: 'HYDERABAD', status: 'Active' },
];

const INITIAL_PARTNERS = [
  { id: 'VSP-P1', name: 'Visakha Partner 1', city: 'VISAKHAPATNAM', phone: '9000000001' },
  { id: 'RJY-P1', name: 'Rajmundry Partner 1', city: 'RAJAMAHENDRAVARAM', phone: '9000000002' },
  { id: 'VJW-P1', name: 'Vijayawada Partner 1', city: 'VIJAYAWADA', phone: '9000000003' },
  { id: 'HYD-P1', name: 'Hyderabad Partner 1', city: 'HYDERABAD', phone: '9000000004' },
];

const generateMockBookings = (count) => {
  const bookings = [];
  const statusKeys = Object.keys(STATUSES);
  
  for (let i = 0; i < count; i++) {
    const agent = INITIAL_AGENTS[Math.floor(Math.random() * INITIAL_AGENTS.length)];
    const destCity = CITIES.filter(c => c !== agent.city)[Math.floor(Math.random() * 3)];
    const status = statusKeys[Math.floor(Math.random() * statusKeys.length)];
    
    let apsrtcRef = null;
    let awb = null;
    if (!['PENDING_APPROVAL', 'REJECTED'].includes(status)) {
      apsrtcRef = generateId('APS-');
      awb = generateId('AWB-');
    }

    let assignedPartner = null;
    if (['PICKUP_INITIATED', 'OUT_FOR_PICKUP', 'PICKUP_FAILED', 'PICKUP_COMPLETED'].includes(status)) {
      const partner = INITIAL_PARTNERS.find(p => p.city === agent.city);
      if (partner) assignedPartner = partner.id;
    }
    if (['AT_DELIVERY_FACILITY', 'DELIVERY_INITIATED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'DELIVERY_FAILED'].includes(status)) {
      const partner = INITIAL_PARTNERS.find(p => p.city === destCity);
      if (partner) assignedPartner = partner.id;
    }

    bookings.push({
      id: `SHB${1000 + i}`,
      date: today,
      agentId: agent.id,
      originCity: agent.city,
      destCity: destCity,
      status: status,
      apsrtcRef,
      awb,
      assignedPartner,
      sender: { name: `Sender ${i}`, mobile: `98765${Math.floor(10000 + Math.random() * 90000)}`, address: '123 Main St', pincode: '500001' },
      receiver: { name: `Receiver ${i}`, mobile: `87654${Math.floor(10000 + Math.random() * 90000)}`, address: '456 Delivery Rd', pincode: '500002' },
      shipment: { type: 'Box', pieces: 1, weight: '5kg', declaredValue: '1000' },
      commercial: { freight: 150, paymentMode: 'Cash', paymentStatus: 'Paid' },
      exceptionReason: null
    });
  }
  return bookings;
};

// --- CUSTOM HOOKS ---

function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };
  return [storedValue, setValue];
}

// --- COMPONENTS ---

const Badge = ({ children, type = 'default' }) => {
  const colors = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-blue-100 text-blue-800',
    success: 'bg-teal-100 text-teal-800',
    warning: 'bg-orange-100 text-orange-800',
    danger: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${colors[type]}`}>
      {children}
    </span>
  );
};

const Button = ({ children, onClick, variant = 'primary', className = '', ...props }) => {
  const baseStyle = "inline-flex items-center justify-center px-4 py-2 border text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors";
  const variants = {
    primary: "border-transparent text-white bg-slate-900 hover:bg-slate-800 focus:ring-slate-900",
    secondary: "border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-slate-900",
    success: "border-transparent text-white bg-teal-600 hover:bg-teal-700 focus:ring-teal-500",
    danger: "border-transparent text-white bg-red-600 hover:bg-red-700 focus:ring-red-500",
    ghost: "border-transparent text-slate-700 bg-transparent hover:bg-slate-100 shadow-none",
  };
  return (
    <button onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

// --- MAIN APP ---

export default function App() {
  // State
  const [user, setUser] = useState(null); // { role: 'ADMIN' | 'AGENT', id: string, name: string }
  const [currentView, setCurrentView] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isTrackingExpanded, setIsTrackingExpanded] = useState(true);
  
  // Data State (Persisted)
  const [bookings, setBookings] = useLocalStorage('shudhi_bookings', null);
  const [agents, setAgents] = useLocalStorage('shudhi_agents', null);
  const [partners, setPartners] = useLocalStorage('shudhi_partners', null);
  const [conversations, setConversations] = useLocalStorage('shudhi_wa_conversations', {});
  
  // Initialize Demo Data
  useEffect(() => {
    if (!bookings || bookings.length === 0) {
      setBookings(generateMockBookings(80)); // Increased for better distribution
    }
    if (!agents || agents.length === 0) {
      setAgents(INITIAL_AGENTS);
    }
    if (!partners || partners.length === 0) {
      setPartners(INITIAL_PARTNERS);
    }
  }, []);

  const handleLogin = (role, id, name) => {
    setUser({ role, id, name });
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
  };

  // Add dummy wallet balance
  const [walletBalance, setWalletBalance] = useState(50000);

  const resetData = () => {
    if (window.confirm("Reset all demo data to initial state?")) {
      setBookings(generateMockBookings(80)); // Increased here too
      setAgents(INITIAL_AGENTS);
      setPartners(INITIAL_PARTNERS);
      setConversations({});
      alert("Data reset successfully.");
    }
  };

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // Derived Data based on Role
  const visibleBookings = user.role === 'ADMIN' 
    ? (bookings || []) 
    : (bookings || []).filter(b => b.agentId === user.id);
    
  const pickupCount = visibleBookings.filter(b => ['APPROVED', 'PICKUP_INITIATED', 'OUT_FOR_PICKUP', 'PICKUP_FAILED', 'PICKUP_COMPLETED'].includes(b.status)).length;
  const transitCount = visibleBookings.filter(b => ['HANDED_AT_HUB', 'AT_ORIGIN_HUB', 'ON_THE_WAY', 'AT_TRANSHIPMENT', 'REACHED_DEST_HUB', 'DELIVERED_AT_HUB'].includes(b.status)).length;
  const deliveryCount = visibleBookings.filter(b => ['DELIVERED_AT_HUB', 'AT_DELIVERY_FACILITY', 'DELIVERY_INITIATED', 'OUT_FOR_DELIVERY', 'DELIVERY_FAILED', 'DELIVERED'].includes(b.status)).length;

  const navigateTo = (view) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 md:hidden" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 flex flex-col
      `}>
        <div className="flex items-center justify-center h-16 bg-slate-950 border-b border-slate-800">
          <span className="text-xl font-bold tracking-wider text-white flex items-center gap-2">
            <Package className="text-teal-400" />
            SHUDHI <span className="text-teal-400">LOGISTICS</span>
          </span>
        </div>
        
        <div className="p-4 bg-slate-800/50">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Logged in as</p>
          <p className="font-semibold">{user.name}</p>
          <Badge type={user.role === 'ADMIN' ? 'primary' : 'warning'}>{user.role}</Badge>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          <NavItem icon={LayoutDashboard} label="Dashboard" active={currentView === 'dashboard'} onClick={() => navigateTo('dashboard')} />
          <NavItem icon={Package} label="Bookings" active={currentView === 'bookings'} onClick={() => navigateTo('bookings')} />
          
          <div className="mt-2 mb-2">
            <button 
              onClick={() => setIsTrackingExpanded(!isTrackingExpanded)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
            >
              <div className="flex items-center gap-3">
                <Map size={18} />
                TRACKING
              </div>
              <ChevronRight size={16} className={`transform transition-transform ${isTrackingExpanded ? 'rotate-90' : ''}`} />
            </button>
            
            {isTrackingExpanded && (
              <div className="pl-6 mt-1 space-y-1">
                <button onClick={() => navigateTo('pickups')} className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${currentView === 'pickups' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                  <div className="flex items-center gap-2"><MapPin size={16} /> Pickups</div>
                  <span className="bg-slate-800 text-xs px-2 py-0.5 rounded-full">{pickupCount}</span>
                </button>
                
                <button onClick={() => navigateTo('tracking')} className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${currentView === 'tracking' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                  <div className="flex items-center gap-2"><Activity size={16} /> Transit</div>
                  <span className="bg-slate-800 text-xs px-2 py-0.5 rounded-full">{transitCount}</span>
                </button>
                
                <button onClick={() => navigateTo('deliveries')} className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${currentView === 'deliveries' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                  <div className="flex items-center gap-2"><Truck size={16} /> Deliveries</div>
                  <span className="bg-slate-800 text-xs px-2 py-0.5 rounded-full">{deliveryCount}</span>
                </button>
              </div>
            )}
          </div>
          
          {user.role === 'ADMIN' && (
            <>
              <div className="pt-4 mt-4 border-t border-slate-700"></div>
              <NavItem icon={Users} label="Sub-Agents" active={currentView === 'agents'} onClick={() => navigateTo('agents')} />
              <NavItem icon={MessageCircle} label="WA Admin Center" active={currentView === 'wa_admin'} onClick={() => navigateTo('wa_admin')} />
              <NavItem icon={FileText} label="Finance & Reports" active={currentView === 'reports'} onClick={() => navigateTo('reports')} />
            </>
          )}
          <div className="pt-4 mt-4 border-t border-slate-700"></div>
          <NavItem icon={Phone} label="WhatsApp Simulator" active={currentView === 'whatsapp'} onClick={() => navigateTo('whatsapp')} />
        </nav>

        <div className="p-4 border-t border-slate-800">
           <button onClick={resetData} className="w-full flex items-center gap-2 text-xs text-slate-400 hover:text-white mb-4">
             <Settings size={14}/> Reset Demo Data
           </button>
           <Button variant="danger" className="w-full flex items-center justify-center gap-2" onClick={handleLogout}>
            <LogOut size={16} /> Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-10">
          <button 
            className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Home className="h-6 w-6" />
          </button>
          
          <div className="flex-1 flex justify-end items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-slate-900 text-white px-4 py-1.5 rounded-full text-sm font-medium shadow-inner border border-slate-700">
              <Wallet size={16} className="text-teal-400" />
              <span>Balance: ₹ {walletBalance.toLocaleString()}</span>
            </div>
            <span className="text-sm text-gray-500 hidden md:block">Demo Environment</span>
            <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold">
              {user.name.charAt(0)}
            </div>
          </div>
        </header>

        {/* Main Work Area */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none bg-slate-50 p-4 sm:p-6 lg:p-8">
          {currentView === 'dashboard' && <Dashboard user={user} bookings={visibleBookings} navigateTo={navigateTo} />}
          {currentView === 'bookings' && <BookingManager user={user} bookings={bookings} setBookings={setBookings} navigateTo={navigateTo} />}
          {currentView === 'pickups' && <PickupsManager user={user} bookings={visibleBookings} setBookings={setBookings} partners={partners} conversations={conversations} setConversations={setConversations} />}
          {currentView === 'tracking' && <TransitManager bookings={visibleBookings} setBookings={setBookings} />}
          {currentView === 'deliveries' && <DeliveriesManager user={user} bookings={visibleBookings} setBookings={setBookings} partners={partners} conversations={conversations} setConversations={setConversations} />}
          {currentView === 'agents' && user.role === 'ADMIN' && <AgentManager agents={agents} />}
          {currentView === 'wa_admin' && user.role === 'ADMIN' && <WhatsAppAdminCenter conversations={conversations} />}
          {currentView === 'reports' && user.role === 'ADMIN' && <ReportsModule bookings={bookings} />}
          {currentView === 'whatsapp' && <WhatsAppSimulator user={user} bookings={bookings} setBookings={setBookings} agents={agents} partners={partners} conversations={conversations} setConversations={setConversations} />}
        </main>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

const NavItem = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`
      w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
      ${active ? 'bg-teal-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
    `}
  >
    <Icon size={18} />
    {label}
  </button>
);

// --- 1. LOGIN SCREEN ---
const LoginScreen = ({ onLogin }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-teal-600">
           <Package size={48} />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          SHUDHI LOGISTICS
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Multi-City First-Mile & Last-Mile Operations Demo
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-4 border-b pb-2">Primary Agent Login (Full Access)</p>
              <Button 
                className="w-full mb-2" 
                onClick={() => onLogin('ADMIN', 'SHUDHI-HQ', 'SHUDHI ADMIN')}
              >
                Login as SHUDHI ADMIN
              </Button>
            </div>
            
            <div className="pt-4 border-t">
              <p className="text-sm font-medium text-gray-700 mb-4 border-b pb-2">Sub-Agent Logins (Restricted City Access)</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" onClick={() => onLogin('AGENT', 'VSP-A1', 'VSP-A1 (Visakha)')}>VSP-A1</Button>
                <Button variant="secondary" onClick={() => onLogin('AGENT', 'RJY-A1', 'RJY-A1 (Rajmundry)')}>RJY-A1</Button>
                <Button variant="secondary" onClick={() => onLogin('AGENT', 'VJW-A1', 'VJW-A1 (Vijayawada)')}>VJW-A1</Button>
                <Button variant="secondary" onClick={() => onLogin('AGENT', 'HYD-A1', 'HYD-A1 (Hyderabad)')}>HYD-A1</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 2. DASHBOARD ---
const Dashboard = ({ user, bookings, navigateTo }) => {
  const stats = useMemo(() => {
    if (!bookings) return {};
    return {
      total: bookings.length,
      pendingApproval: bookings.filter(b => b.status === 'PENDING_APPROVAL').length,
      pendingPickup: bookings.filter(b => ['APPROVED', 'PICKUP_INITIATED', 'OUT_FOR_PICKUP'].includes(b.status)).length,
      inTransit: bookings.filter(b => ['HANDED_AT_HUB', 'AT_ORIGIN_HUB', 'ON_THE_WAY', 'AT_TRANSHIPMENT', 'REACHED_DEST_HUB'].includes(b.status)).length,
      pendingDelivery: bookings.filter(b => ['AT_DELIVERY_FACILITY', 'DELIVERY_INITIATED', 'OUT_FOR_DELIVERY'].includes(b.status)).length,
      delivered: bookings.filter(b => ['DELIVERED', 'DELIVERED_AT_HUB', 'PICKUP_COMPLETED'].includes(b.status)).length,
      exceptions: bookings.filter(b => b.status === 'EXCEPTION' || b.status === 'PICKUP_FAILED' || b.status === 'DELIVERY_FAILED').length,
    };
  }, [bookings]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-sm text-gray-500">Welcome back, {user.name}. Here's the current network status.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Bookings" value={stats.total} icon={Package} color="blue" onClick={() => navigateTo('bookings')} />
        <KpiCard title="Pending Approvals" value={stats.pendingApproval} icon={AlertTriangle} color="orange" onClick={() => navigateTo('bookings')} alert={stats.pendingApproval > 0} />
        <KpiCard title="Active Pickups" value={stats.pendingPickup} icon={MapPin} color="indigo" onClick={() => navigateTo('pickups')} />
        <KpiCard title="In Transit" value={stats.inTransit} icon={Activity} color="teal" onClick={() => navigateTo('tracking')} />
        <KpiCard title="Active Deliveries" value={stats.pendingDelivery} icon={Truck} color="indigo" onClick={() => navigateTo('deliveries')} />
        <KpiCard title="Successfully Done" value={stats.delivered} icon={CheckCircle} color="green" />
        <KpiCard title="Exceptions/Failed" value={stats.exceptions} icon={XCircle} color="red" alert={stats.exceptions > 0} onClick={() => navigateTo('bookings')} />
        <KpiCard title="Wallet Balance" value={'₹50K'} icon={Wallet} color="slate" />
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Booking Activity</h3>
          <Button variant="ghost" className="text-sm text-teal-600" onClick={() => navigateTo('bookings')}>View All</Button>
        </div>
        <div className="divide-y divide-gray-200">
          {(bookings || []).slice(0, 5).map((booking) => (
             <div key={booking.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">{booking.id}</p>
                  <p className="text-xs text-gray-500">{booking.originCity} &rarr; {booking.destCity}</p>
                </div>
                <div className="text-right">
                  <StatusBadge status={booking.status} />
                  <p className="text-xs text-gray-400 mt-1">{booking.date}</p>
                </div>
             </div>
          ))}
          {(!bookings || bookings.length === 0) && (
            <div className="p-4 text-center text-gray-500">No bookings found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

const KpiCard = ({ title, value, icon: Icon, color, onClick, alert }) => {
  const colors = {
    blue: 'bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-blue-200',
    orange: 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-orange-200',
    indigo: 'bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-indigo-200',
    teal: 'bg-gradient-to-br from-teal-400 to-teal-600 text-white shadow-teal-200',
    green: 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-emerald-200',
    red: 'bg-gradient-to-br from-rose-500 to-rose-700 text-white shadow-rose-200',
    slate: 'bg-gradient-to-br from-slate-700 to-slate-900 text-white shadow-slate-200',
  };

  return (
    <div 
      className={`rounded-xl shadow-lg p-5 relative overflow-hidden ${colors[color]} ${onClick ? 'cursor-pointer hover:scale-[1.02] transition-transform' : ''} ${alert ? 'ring-4 ring-orange-300 ring-offset-2' : ''}`}
      onClick={onClick}
    >
      <div className="absolute -right-4 -top-4 opacity-10">
        <Icon className="h-24 w-24" aria-hidden="true" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
            <Icon className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
        </div>
        <h3 className="text-3xl font-bold text-white mb-1">{value || 0}</h3>
        <p className="text-sm font-medium text-white/80 truncate">{title}</p>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  let type = 'default';
  if (status.includes('Completed') || status.includes('Delivered') || status.includes('Handed')) type = 'success';
  if (status.includes('Pending') || status.includes('Initiated') || status.includes('Out for')) type = 'warning';
  if (status.includes('Transit') || status.includes('Approved') || status.includes('HUB') || status.includes('Way')) type = 'primary';
  if (status.includes('Exception') || status.includes('Rejected') || status.includes('Failed')) type = 'danger';
  
  return <Badge type={type}>{status}</Badge>;
};

// --- 3. BOOKING MANAGER & SIMULATOR ---
const BookingManager = ({ user, bookings, setBookings, navigateTo }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const visibleBookings = user.role === 'ADMIN' 
    ? bookings 
    : bookings.filter(b => b.agentId === user.id);

  const filteredBookings = visibleBookings.filter(b => 
    b.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.apsrtcRef && b.apsrtcRef.toLowerCase().includes(searchTerm.toLowerCase())) ||
    b.sender.mobile.includes(searchTerm) ||
    b.receiver.mobile.includes(searchTerm)
  );

  const handleCreate = (newBooking) => {
    setBookings([newBooking, ...bookings]);
    setIsCreating(false);
  };

  const handleAction = (id, action) => {
    setBookings(bookings.map(b => {
      if (b.id !== id) return b;
      
      let updated = { ...b };
      
      // Workflow logic & Mock Integration
      if (action === 'APPROVE') {
        updated.status = 'APPROVED';
        // Simulate APSRTC API Call Success
        updated.apsrtcRef = generateId('APS-');
        updated.awb = generateId('AWB-');
      } else if (action === 'REJECT') {
        updated.status = 'REJECTED';
      }
      
      return updated;
    }));
  };

  if (isCreating) {
    return <BookingForm user={user} onSave={handleCreate} onCancel={() => setIsCreating(false)} />;
  }

  return (
    <div className="space-y-4">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Booking Management</h1>
          <p className="text-sm text-gray-500">Manage all first-mile logistics requests.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
            <Plus size={16} /> New Booking
          </Button>
        </div>
      </div>

      <div className="bg-white p-4 shadow rounded-lg flex gap-4 items-center">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
            placeholder="Search by ID, APSRTC Ref, or Mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transporter Ref</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{booking.id}</div>
                    <div className="text-sm text-gray-500">{booking.date} • {booking.agentId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{booking.originCity} &rarr; {booking.destCity}</div>
                    <div className="text-xs text-gray-500">Sender: {booking.sender.mobile}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {booking.apsrtcRef ? (
                       <div className="text-sm font-mono text-teal-600 bg-teal-50 inline-block px-2 py-1 rounded">
                         {booking.apsrtcRef}
                       </div>
                    ) : (
                      <span className="text-sm text-gray-400 italic">Pending Integration</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={booking.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {user.role === 'ADMIN' && booking.status === 'PENDING_APPROVAL' && (
                      <div className="flex justify-end gap-2">
                        <Button variant="success" onClick={() => handleAction(booking.id, 'APPROVE')} className="text-xs px-2 py-1">Approve</Button>
                        <Button variant="danger" onClick={() => handleAction(booking.id, 'REJECT')} className="text-xs px-2 py-1">Reject</Button>
                      </div>
                    )}
                    {booking.status !== 'PENDING_APPROVAL' && (
                      <Button variant="ghost" onClick={() => navigateTo('tracking')} className="text-teal-600 text-xs">Track</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredBookings.length === 0 && (
             <div className="p-8 text-center text-gray-500">No bookings match your search.</div>
          )}
        </div>
      </div>
    </div>
  );
};

const BookingForm = ({ user, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    senderName: '', senderMobile: '', senderCity: user.role === 'AGENT' ? user.city : 'VISAKHAPATNAM', senderAddress: '',
    receiverName: '', receiverMobile: '', receiverCity: 'HYDERABAD', receiverAddress: '',
    pieces: '1', weight: '5kg', type: 'Box',
    freight: '150', paymentMode: 'Cash'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const newBooking = {
      id: generateId('SHB'),
      date: today,
      agentId: user.id,
      originCity: formData.senderCity,
      destCity: formData.receiverCity,
      // Default behavior: Admin direct submission, Agent pending
      status: user.role === 'ADMIN' ? 'APPROVED' : 'PENDING_APPROVAL', 
      apsrtcRef: user.role === 'ADMIN' ? generateId('APS-') : null, // Simulate immediate approval for admin
      awb: user.role === 'ADMIN' ? generateId('AWB-') : null,
      sender: { name: formData.senderName, mobile: formData.senderMobile, address: formData.senderAddress, pincode: '500000' },
      receiver: { name: formData.receiverName, mobile: formData.receiverMobile, address: formData.receiverAddress, pincode: '500000' },
      shipment: { type: formData.type, pieces: formData.pieces, weight: formData.weight, declaredValue: '0' },
      commercial: { freight: formData.freight, paymentMode: formData.paymentMode, paymentStatus: 'Pending' }
    };
    onSave(newBooking);
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="max-w-4xl mx-auto bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-xl font-bold text-gray-900">Create New Booking Request</h2>
        <Button variant="ghost" onClick={onCancel}><XCircle size={20} className="text-gray-500" /></Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sender Details */}
          <div className="space-y-4 bg-gray-50 p-4 rounded border">
            <h3 className="font-semibold text-gray-700 flex items-center gap-2"><MapPin size={16}/> Sender Info</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700">Origin City</label>
              <select name="senderCity" value={formData.senderCity} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 p-2 border" required>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mobile</label>
              <input type="tel" name="senderMobile" value={formData.senderMobile} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" required placeholder="10-digit number" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Name & Address</label>
              <input type="text" name="senderName" placeholder="Name" value={formData.senderName} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border mb-2" required />
              <textarea name="senderAddress" placeholder="Full Address" value={formData.senderAddress} onChange={handleChange} className="block w-full rounded-md border-gray-300 shadow-sm p-2 border" rows="2" required />
            </div>
          </div>

          {/* Receiver Details */}
          <div className="space-y-4 bg-gray-50 p-4 rounded border">
            <h3 className="font-semibold text-gray-700 flex items-center gap-2"><MapPin size={16}/> Receiver Info</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700">Destination City</label>
              <select name="receiverCity" value={formData.receiverCity} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" required>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mobile</label>
              <input type="tel" name="receiverMobile" value={formData.receiverMobile} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" required placeholder="10-digit number" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Name & Address</label>
              <input type="text" name="receiverName" placeholder="Name" value={formData.receiverName} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border mb-2" required />
              <textarea name="receiverAddress" placeholder="Full Address" value={formData.receiverAddress} onChange={handleChange} className="block w-full rounded-md border-gray-300 shadow-sm p-2 border" rows="2" required />
            </div>
          </div>
        </div>

        {/* Shipment Details */}
        <div className="bg-gray-50 p-4 rounded border space-y-4">
           <h3 className="font-semibold text-gray-700 flex items-center gap-2"><Package size={16}/> Shipment & Commercials</h3>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Package Type</label>
                <select name="type" value={formData.type} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border">
                  <option>Box</option><option>Document</option><option>Pallet</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Pieces</label>
                <input type="number" name="pieces" value={formData.pieces} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Weight</label>
                <input type="text" name="weight" value={formData.weight} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Freight Charge (₹)</label>
                <input type="number" name="freight" value={formData.freight} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" required />
              </div>
           </div>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button type="submit" variant="primary">
            {user.role === 'ADMIN' ? 'Create & Approve Booking' : 'Submit for Approval'}
          </Button>
        </div>
      </form>
    </div>
  );
};

// --- 4. FIRST MILE (PICKUPS) ---
const PickupsManager = ({ user, bookings, setBookings, partners, conversations, setConversations }) => {
  const pickupStatuses = ['APPROVED', 'PICKUP_INITIATED', 'OUT_FOR_PICKUP', 'PICKUP_FAILED', 'PICKUP_COMPLETED'];
  const pickupBookings = bookings.filter(b => pickupStatuses.includes(b.status));

  const handleAction = (id, newStatus) => {
    setBookings(bookings.map(b => b.id === id ? { ...b, status: newStatus } : b));
  };

  const handleAssign = (booking, partnerId) => {
    const partner = partners.find(p => p.id === partnerId);
    if (!partner) return;
    
    // Update booking state
    setBookings(bookings.map(b => b.id === booking.id ? { ...b, status: 'PICKUP_INITIATED', assignedPartner: partnerId } : b));
    
    // Auto-generate WhatsApp Message to Field Partner
    const partnerPhone = partner.phone;
    const taskMsg = `📦 *NEW PICKUP ASSIGNED*\nTask ID: TSK-${booking.id}\nBooking: ${booking.id}\nCustomer: ${booking.sender.name} (${booking.sender.mobile})\nAddress: ${booking.sender.address}, ${booking.originCity}\nItems: ${booking.shipment.pieces}x ${booking.shipment.type}\n\nReply:\n*ACCEPT ${booking.id}* or *REJECT ${booking.id}*`;
    
    const newConv = { ...(conversations[partnerPhone] || { messages: [], mode: 'field_ops', context: {} }) };
    newConv.messages = [...newConv.messages, { id: Date.now(), text: taskMsg, sender: 'bot', time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }];
    setConversations({ ...conversations, [partnerPhone]: newConv });
    
    alert(`Assigned to ${partner.name}. WhatsApp task notification sent.`);
  };

  const handleFailed = (id) => {
    const reason = window.prompt("Enter reason for pick-up failure:");
    if (reason) handleAction(id, 'PICKUP_FAILED');
  };

  const handleProof = (id, nextStatus) => {
    // Simulate proof upload
    alert("Simulating Camera/Image Upload for Proof of Pick-up...");
    handleAction(id, nextStatus);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pick-up Operations (First-Mile)</h1>
        <p className="text-sm text-gray-500">Manage ground operations from assignment to HUB handover.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {pickupBookings.map(booking => (
          <div key={booking.id} className="bg-white shadow rounded-lg p-4 border-l-4 border-orange-400">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{booking.id}</h3>
                <p className="text-sm text-gray-500">Agent: {booking.agentId}</p>
              </div>
              <StatusBadge status={booking.status} />
            </div>
            
            <div className="bg-gray-50 p-3 rounded mb-4 text-sm">
              <p><strong>Pickup From:</strong> {booking.sender.name}</p>
              <p><strong>Address:</strong> {booking.sender.address}, {booking.originCity}</p>
              <p><strong>Contact:</strong> {booking.sender.mobile}</p>
              <p className="mt-2 text-xs text-gray-500">Items: {booking.shipment.pieces}x {booking.shipment.type} ({booking.shipment.weight})</p>
              {booking.assignedPartner && <p className="mt-2 text-xs font-semibold text-indigo-600">Assigned Partner: {booking.assignedPartner}</p>}
            </div>

            <div className="flex flex-wrap justify-end gap-2 mt-4 border-t pt-4 items-center">
              {booking.status === 'APPROVED' && (
                <div className="flex items-center gap-2">
                  <select 
                    className="text-sm border-gray-300 rounded p-1"
                    onChange={(e) => { if(e.target.value) handleAssign(booking, e.target.value) }}
                    defaultValue=""
                  >
                    <option value="" disabled>Assign Partner...</option>
                    {partners.filter(p => p.city === booking.originCity).map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <Button onClick={() => handleAction(booking.id, 'PICKUP_INITIATED')} size="sm" variant="secondary">Self Assign</Button>
                </div>
              )}
              {booking.status === 'PICKUP_INITIATED' && (
                <Button onClick={() => handleAction(booking.id, 'OUT_FOR_PICKUP')} size="sm">Mark Out for Pick-up</Button>
              )}
              {booking.status === 'OUT_FOR_PICKUP' && (
                <>
                  <Button variant="danger" onClick={() => handleFailed(booking.id)} size="sm">Pick-up Failed</Button>
                  <Button variant="success" onClick={() => handleProof(booking.id, 'PICKUP_COMPLETED')} size="sm" className="flex items-center gap-1"><Camera size={14}/> Add Proof & Complete</Button>
                </>
              )}
              {booking.status === 'PICKUP_COMPLETED' && (
                <Button variant="primary" onClick={() => handleAction(booking.id, 'HANDED_AT_HUB')} size="sm">Hand Over to Origin HUB</Button>
              )}
            </div>
          </div>
        ))}
        {pickupBookings.length === 0 && (
          <div className="col-span-full p-8 text-center bg-white rounded-lg shadow text-gray-500">
            No pending pick-ups at the moment.
          </div>
        )}
      </div>
    </div>
  );
};

// --- 5. MID-MILE TRACKING ---
const TransitManager = ({ bookings, setBookings }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const transitStatuses = ['HANDED_AT_HUB', 'AT_ORIGIN_HUB', 'ON_THE_WAY', 'AT_TRANSHIPMENT', 'REACHED_DEST_HUB', 'DELIVERED_AT_HUB'];
  
  const transitBookings = bookings.filter(b => 
    transitStatuses.includes(b.status) && 
    (b.id.includes(searchTerm) || b.apsrtcRef?.includes(searchTerm))
  );

  const handleAction = (id, newStatus) => {
    setBookings(bookings.map(b => b.id === id ? { ...b, status: newStatus } : b));
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transit Operations (Mid-Mile)</h1>
        <p className="text-sm text-gray-500">Track and update APSRTC Transporter movements.</p>
      </div>

      <div className="bg-white p-4 shadow rounded-lg flex gap-4 items-center">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
            placeholder="Search Transit ID or APSRTC Ref..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {transitBookings.map(booking => (
          <div key={booking.id} className="bg-white shadow rounded-lg p-4 border-l-4 border-teal-400">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{booking.id}</h3>
                <p className="text-sm text-gray-500">Ref: <span className="font-mono text-teal-600 bg-teal-50 px-1 rounded">{booking.apsrtcRef || 'N/A'}</span></p>
              </div>
              <StatusBadge status={booking.status} />
            </div>

            <div className="flex items-center gap-4 mt-4 mb-4 text-sm font-semibold text-gray-700 bg-gray-50 p-2 rounded">
              <span className="flex-1 text-center">{booking.originCity}</span>
              <Truck className="text-teal-500" size={20} />
              <span className="flex-1 text-center">{booking.destCity}</span>
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
              {booking.status === 'HANDED_AT_HUB' && <Button onClick={() => handleAction(booking.id, 'AT_ORIGIN_HUB')} size="sm">Confirm at Origin Hub</Button>}
              {booking.status === 'AT_ORIGIN_HUB' && <Button onClick={() => handleAction(booking.id, 'ON_THE_WAY')} size="sm">Dispatch (On The Way)</Button>}
              {booking.status === 'ON_THE_WAY' && (
                <>
                  <Button variant="secondary" onClick={() => handleAction(booking.id, 'AT_TRANSHIPMENT')} size="sm">Log Transhipment</Button>
                  <Button variant="primary" onClick={() => handleAction(booking.id, 'REACHED_DEST_HUB')} size="sm">Reached Dest Hub</Button>
                </>
              )}
              {booking.status === 'AT_TRANSHIPMENT' && <Button onClick={() => handleAction(booking.id, 'ON_THE_WAY')} size="sm">Resume Journey</Button>}
              {booking.status === 'REACHED_DEST_HUB' && <Button variant="success" onClick={() => handleAction(booking.id, 'DELIVERED_AT_HUB')} size="sm">Unload at Destination Hub</Button>}
            </div>
          </div>
        ))}
        {transitBookings.length === 0 && (
          <div className="col-span-full p-8 text-center bg-white rounded-lg shadow text-gray-500">
            No shipments currently in transit matching criteria.
          </div>
        )}
      </div>
    </div>
  );
};

// --- 6. LAST MILE (DELIVERIES) ---
const DeliveriesManager = ({ user, bookings, setBookings, partners, conversations, setConversations }) => {
  const deliveryStatuses = ['DELIVERED_AT_HUB', 'AT_DELIVERY_FACILITY', 'DELIVERY_INITIATED', 'OUT_FOR_DELIVERY', 'DELIVERY_FAILED'];
  
  const deliveryBookings = bookings.filter(b => deliveryStatuses.includes(b.status));

  const handleAction = (id, newStatus) => {
    setBookings(bookings.map(b => b.id === id ? { ...b, status: newStatus } : b));
  };

  const handleAssign = (booking, partnerId) => {
    const partner = partners.find(p => p.id === partnerId);
    if (!partner) return;
    
    // Update booking state
    setBookings(bookings.map(b => b.id === booking.id ? { ...b, status: 'DELIVERY_INITIATED', assignedPartner: partnerId } : b));
    
    // Auto-generate WhatsApp Message to Field Partner
    const partnerPhone = partner.phone;
    const taskMsg = `🚚 *NEW DELIVERY ASSIGNED*\nTask ID: DLY-${booking.id}\nBooking: ${booking.id}\nReceiver: ${booking.receiver.name} (${booking.receiver.mobile})\nAddress: ${booking.receiver.address}, ${booking.destCity}\nCollect Amount: ₹${booking.commercial.paymentMode === 'Cash' ? booking.commercial.freight : '0'}\n\nReply:\n*ACCEPT ${booking.id}* or *REJECT ${booking.id}*`;
    
    const newConv = { ...(conversations[partnerPhone] || { messages: [], mode: 'field_ops', context: {} }) };
    newConv.messages = [...newConv.messages, { id: Date.now(), text: taskMsg, sender: 'bot', time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }];
    setConversations({ ...conversations, [partnerPhone]: newConv });
    
    alert(`Assigned to ${partner.name}. WhatsApp task notification sent.`);
  };

  const handleFailed = (id) => {
    const reason = window.prompt("Enter reason for delivery failure:");
    if (reason) handleAction(id, 'DELIVERY_FAILED');
  };

  const handleProof = (id) => {
    alert("Simulating uploading signature/photo for Proof of Delivery...");
    handleAction(id, 'DELIVERED');
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Delivery Operations (Last-Mile)</h1>
        <p className="text-sm text-gray-500">Manage door deliveries from destination hubs to end customers.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {deliveryBookings.map(booking => (
          <div key={booking.id} className="bg-white shadow rounded-lg p-4 border-l-4 border-indigo-400">
             <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{booking.id}</h3>
                <p className="text-sm text-gray-500">Hub: {booking.destCity}</p>
              </div>
              <StatusBadge status={booking.status} />
            </div>

            <div className="bg-gray-50 p-3 rounded mb-4 text-sm">
              <p><strong>Deliver To:</strong> {booking.receiver.name}</p>
              <p><strong>Address:</strong> {booking.receiver.address}, {booking.destCity}</p>
              <p><strong>Contact:</strong> {booking.receiver.mobile}</p>
              <p className="mt-2 font-semibold">Collect Amount: ₹{booking.commercial.paymentMode === 'Cash' ? booking.commercial.freight : '0 (Prepaid)'}</p>
              {booking.assignedPartner && <p className="mt-2 text-xs font-semibold text-indigo-600">Assigned Partner: {booking.assignedPartner}</p>}
            </div>

            <div className="flex flex-wrap justify-end gap-2 mt-4 border-t pt-4 items-center">
              {booking.status === 'DELIVERED_AT_HUB' && <Button onClick={() => handleAction(booking.id, 'AT_DELIVERY_FACILITY')} size="sm" variant="secondary">Move to Delivery Facility</Button>}
              {booking.status === 'AT_DELIVERY_FACILITY' && (
                 <div className="flex items-center gap-2">
                  <select 
                    className="text-sm border-gray-300 rounded p-1"
                    onChange={(e) => { if(e.target.value) handleAssign(booking, e.target.value) }}
                    defaultValue=""
                  >
                    <option value="" disabled>Assign Delivery Partner...</option>
                    {partners.filter(p => p.city === booking.destCity).map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <Button onClick={() => handleAction(booking.id, 'DELIVERY_INITIATED')} size="sm" variant="secondary">Self Assign</Button>
                </div>
              )}
              {booking.status === 'DELIVERY_INITIATED' && <Button onClick={() => handleAction(booking.id, 'OUT_FOR_DELIVERY')} size="sm" variant="primary">Mark Out for Delivery</Button>}
              
              {booking.status === 'OUT_FOR_DELIVERY' && (
                <>
                  <Button variant="danger" onClick={() => handleFailed(booking.id)} size="sm">Failed</Button>
                  <Button variant="success" onClick={() => handleProof(booking.id)} size="sm" className="flex items-center gap-1"><Camera size={14}/> Upload POD & Deliver</Button>
                </>
              )}
              {booking.status === 'DELIVERY_FAILED' && (
                <Button variant="secondary" onClick={() => handleAction(booking.id, 'DELIVERY_INITIATED')} size="sm">Re-Initiate Delivery</Button>
              )}
            </div>
          </div>
        ))}
         {deliveryBookings.length === 0 && (
          <div className="col-span-full p-8 text-center bg-white rounded-lg shadow text-gray-500">
            No pending deliveries at the moment.
          </div>
        )}
      </div>
    </div>
  );
};

// --- 7. AGENT MANAGEMENT ---
const AgentManager = ({ agents }) => {
  return (
    <div className="space-y-4">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sub-Agent Directory</h1>
          <p className="text-sm text-gray-500">Manage regional agents across cities.</p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent Details</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {agents.map((agent) => (
              <tr key={agent.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-slate-500" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{agent.name}</div>
                      <div className="text-sm text-gray-500">{agent.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {agent.city}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge type="success">{agent.status}</Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Button variant="ghost" className="text-teal-600 hover:text-teal-900 text-xs">View Performance</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- 8. WHATSAPP SIMULATOR ---
const WhatsAppSimulator = ({ user, bookings, setBookings, agents, partners, conversations, setConversations }) => {
  const [simulatorIdentity, setSimulatorIdentity] = useState('CUSTOMER_9999999999');
  const [input, setInput] = useState('');
  const endOfMessagesRef = useRef(null);

  // Derive active conversation
  const activeConv = conversations[simulatorIdentity] || { messages: [], mode: 'menu', context: {} };
  
  // Initialize greeting if empty
  useEffect(() => {
    if (!conversations[simulatorIdentity]) {
      let welcomeMsg = "Welcome to SHUDHI Logistics WhatsApp!\nHow can I help you today?\n\n1. Book a Shipment\n2. Track Shipment\n3. Check Delivery Status\n4. Contact Support";
      let initialMode = 'menu';
      
      if (simulatorIdentity.startsWith('AGENT_')) {
        welcomeMsg = `🏢 *Agent Desk Assistant*\nWelcome back. You can request:\n- TODAY REPORT\n- PENDING BOOKINGS\n- MY SHIPMENTS`;
        initialMode = 'agent_desk';
      } else if (simulatorIdentity.startsWith('PARTNER_')) {
        welcomeMsg = `🏍️ *Field Operations Assistant*\nSend PENDING TASKS to view assignments, or reply with ACCEPT [ID], COMPLETED [ID], or FAILED [ID].`;
        initialMode = 'field_ops';
      }

      setConversations(prev => ({
        ...prev,
        [simulatorIdentity]: {
          messages: [{ id: Date.now(), text: welcomeMsg, sender: 'bot', time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }],
          mode: initialMode,
          context: {}
        }
      }));
    }
  }, [simulatorIdentity, conversations]);

  // Auto-scroll to bottom
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConv.messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    const newMsg = { id: Date.now(), text: userMsg, sender: 'user', time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) };
    
    // Optimistic update
    const currentConv = conversations[simulatorIdentity] || { messages: [], mode: 'menu', context: {} };
    setConversations(prev => ({
      ...prev,
      [simulatorIdentity]: { ...currentConv, messages: [...currentConv.messages, newMsg] }
    }));
    setInput('');

    // Central Message Router Simulator
    setTimeout(() => {
      let botReply = "";
      let newMode = currentConv.mode;
      let newContext = { ...currentConv.context };

      // Helper function to update bookings
      const updateBooking = (id, updates) => {
        setBookings(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
      };

      // ---------------------------------------------------------
      // ASSISTANT 03: FIELD OPERATIONS ROUTER
      // ---------------------------------------------------------
      if (simulatorIdentity.startsWith('PARTNER_')) {
        const partnerId = simulatorIdentity.split('_')[1];
        const pInfo = partners.find(p => p.phone === partnerId) || { id: partnerId };
        
        const cmd = userMsg.toUpperCase().split(' ');
        
        if (userMsg.toUpperCase() === 'PENDING TASKS') {
          const tasks = bookings.filter(b => b.assignedPartner === pInfo.id && ['PICKUP_INITIATED', 'DELIVERY_INITIATED', 'OUT_FOR_PICKUP', 'OUT_FOR_DELIVERY'].includes(b.status));
          if (tasks.length > 0) {
            botReply = `📋 *Pending Tasks for ${pInfo.id}*\n\n` + tasks.map(t => `- [${t.id}] ${t.status.includes('PICKUP') ? 'Pickup' : 'Delivery'} at ${t.status.includes('PICKUP') ? t.sender.address : t.receiver.address}`).join('\n');
          } else {
            botReply = "You have no pending tasks assigned at the moment. Great job!";
          }
        } 
        else if (cmd[0] === 'ACCEPT' && cmd[1]) {
          const bId = cmd[1];
          const b = bookings.find(x => x.id === bId && x.assignedPartner === pInfo.id);
          if (b) {
            const nextStatus = b.status.includes('PICKUP') ? 'OUT_FOR_PICKUP' : 'OUT_FOR_DELIVERY';
            updateBooking(bId, { status: nextStatus });
            botReply = `✅ Task ${bId} accepted. Status marked as ${nextStatus.replace(/_/g, ' ')}.\nReply *OPEN LOCATION* to get map link, or *COMPLETED ${bId}* when done.`;
          } else {
            botReply = `❌ Invalid Task ID or not assigned to you.`;
          }
        }
        else if (userMsg.toUpperCase() === 'OPEN LOCATION') {
          botReply = "🗺️ *Optimized Route*\nClick to open in Google Maps: https://maps.google.com/?q=assigned_route";
        }
        else if (cmd[0] === 'COMPLETED' && cmd[1]) {
          newContext.pendingProofId = cmd[1];
          botReply = `📸 Please upload Proof (Photograph) for Task ${cmd[1]}.\n(Type 'image' to simulate upload)`;
          newMode = 'field_ops_proof';
        }
        else if (cmd[0] === 'FAILED' && cmd[1]) {
          newContext.pendingFailId = cmd[1];
          botReply = `⚠️ Please select reason for failure for Task ${cmd[1]}:\n1. Customer Unavailable\n2. Incorrect Address\n3. Package Unavailable/Refused\n4. Other`;
          newMode = 'field_ops_fail';
        }
        else {
          botReply = "Unrecognized command. Valid commands:\n- PENDING TASKS\n- ACCEPT [ID]\n- COMPLETED [ID]\n- FAILED [ID]";
        }
      }
      
      else if (newMode === 'field_ops_proof') {
        if (userMsg.toLowerCase() === 'image') {
           const bId = newContext.pendingProofId;
           const b = bookings.find(x => x.id === bId);
           const nextStatus = b?.status.includes('PICKUP') ? 'PICKUP_COMPLETED' : 'DELIVERED';
           updateBooking(bId, { status: nextStatus });
           botReply = `✅ Proof received and validated. Task ${bId} marked as ${nextStatus.replace('_', ' ')}!`;
           newMode = 'field_ops';
           newContext = {};
        } else {
           botReply = "Please upload an image as proof. (Type 'image' to simulate)";
        }
      }
      
      else if (newMode === 'field_ops_fail') {
         const bId = newContext.pendingFailId;
         const b = bookings.find(x => x.id === bId);
         const nextStatus = b?.status.includes('PICKUP') ? 'PICKUP_FAILED' : 'DELIVERY_FAILED';
         
         const reasons = { '1': 'Customer Unavailable', '2': 'Incorrect Address', '3': 'Package Unavailable/Refused', '4': 'Other' };
         const matchedReason = reasons[userMsg.trim()] || userMsg;

         updateBooking(bId, { status: nextStatus, exceptionReason: 'Reported via WA: ' + matchedReason });
         botReply = `⚠️ Task ${bId} marked as FAILED.\nReason: ${matchedReason}\nAdmin has been notified.`;
         newMode = 'field_ops';
         newContext = {};
      }

      // ---------------------------------------------------------
      // ASSISTANT 02: AGENT DESK ROUTER
      // ---------------------------------------------------------
      else if (simulatorIdentity.startsWith('AGENT_')) {
        const agentId = simulatorIdentity.split('_')[1];
        const upperMsg = userMsg.toUpperCase();
        
        if (upperMsg === 'TODAY REPORT') {
          const myB = bookings.filter(b => b.agentId === agentId);
          botReply = `📊 *Daily Report for ${agentId}*\n- Total Bookings: ${myB.length}\n- Pending Approval: ${myB.filter(b=>b.status==='PENDING_APPROVAL').length}\n- In Transit: ${myB.filter(b=>b.status.includes('HUB')||b.status.includes('WAY')).length}\n- Delivered: ${myB.filter(b=>b.status==='DELIVERED').length}\n\nType HELP for more commands.`;
        }
        else if (upperMsg === 'PENDING BOOKINGS') {
           const pending = bookings.filter(b => b.agentId === agentId && b.status === 'PENDING_APPROVAL');
           botReply = `You have ${pending.length} pending bookings.` + (pending.length > 0 ? `\n\nIDs: ${pending.map(p=>p.id).join(', ')}` : '');
        }
        else if (upperMsg === 'HELP') {
          botReply = "🏢 *Agent Commands:*\n- TODAY REPORT\n- PENDING BOOKINGS\n- MY SHIPMENTS\n- PAYMENT SUMMARY";
        }
        else {
          botReply = "Unrecognized command. Type HELP for available options.";
        }
      }

      // ---------------------------------------------------------
      // ASSISTANT 01: CUSTOMER CARE ROUTER
      // ---------------------------------------------------------
      else {
        // Customer Booking Logic (Migrated from original)
        const getHubAddress = (city) => {
          const hubs = { 'VISAKHAPATNAM': 'MVP Colony Hub', 'RAJAMAHENDRAVARAM': 'Danavaipeta Hub', 'VIJAYAWADA': 'Benz Circle Hub', 'HYDERABAD': 'Kukatpally Hub' };
          return hubs[city?.toUpperCase()] || 'Main Hub, ' + city;
        };

        switch (newMode) {
          case 'menu':
            if (userMsg === '1') { botReply = "Please select Booking Type:\n1. General\n2. Business"; newMode = 'booking_type'; } 
            else if (userMsg === '2' || userMsg === '3') { botReply = "Please enter your 7-character Booking ID (e.g. SHB1001) to track."; newMode = 'tracking'; } 
            else if (userMsg === '4') { botReply = "Please hold while I connect you to a human agent. Our operating hours are 9 AM - 6 PM."; } 
            else { botReply = "I didn't understand that. Please reply with 1, 2, 3, or 4."; }
            break;
            
          case 'booking_type':
            if (userMsg === '1') { newContext.bookingType = 'General'; botReply = "Great! Let's book your shipment. Please enter your Full Name."; newMode = 'gen_name'; }
            else if (userMsg === '2') { newContext.bookingType = 'Business'; botReply = "Please provide your Business Details in one message."; newMode = 'biz_details'; } 
            else { botReply = "Please reply with 1 for General or 2 for Business."; }
            break;

          case 'biz_details':
            const bizBooking = { id: generateId('SHB'), date: today, agentId: 'SHUDHI-HQ', originCity: 'MULTIPLE', destCity: 'MULTIPLE', status: 'PENDING_APPROVAL', sender: { name: 'Business Query', mobile: simulatorIdentity.split('_')[1], address: userMsg }, receiver: { name: 'N/A', mobile: 'N/A', address: 'N/A' }, shipment: { type: 'Business Lead', pieces: 0, weight: 'N/A' }, commercial: { freight: 0, paymentMode: 'N/A' } };
            setBookings(prev => [bizBooking, ...prev]);
            botReply = `Thank you! Your business inquiry has been forwarded to SHUDHI ADMIN (Ref: *${bizBooking.id}*). Our corporate team will contact you shortly.\nReply 0 for Main Menu.`;
            newMode = 'menu_return';
            break;

          case 'gen_name': newContext.senderName = userMsg; botReply = "Which city are you sending from? (e.g., VISAKHAPATNAM, HYDERABAD)"; newMode = 'gen_city'; break;
          case 'gen_city': newContext.originCity = userMsg.toUpperCase(); botReply = "Pickup Type:\n1. Drop at Agent Hub\n2. Door Pick-up"; newMode = 'gen_pickup_type'; break;
          case 'gen_pickup_type':
            if (userMsg === '1') { newContext.pickupType = 'Drop'; newContext.senderAddress = 'Drop at Hub'; botReply = `You chose drop off. Hub: *${getHubAddress(newContext.originCity)}*\nPlease enter Receiver's Full Name.`; newMode = 'gen_receiver_name'; } 
            else if (userMsg === '2') { newContext.pickupType = 'Door'; botReply = "Please enter your full pickup address."; newMode = 'gen_pickup_address'; } 
            else { botReply = "Please reply 1 or 2."; } break;
          case 'gen_pickup_address': newContext.senderAddress = userMsg; botReply = "Please enter the Receiver's Full Name."; newMode = 'gen_receiver_name'; break;
          case 'gen_receiver_name': newContext.receiverName = userMsg; botReply = "Please enter the Receiver's Mobile Number."; newMode = 'gen_receiver_mobile'; break;
          case 'gen_receiver_mobile': newContext.receiverMobile = userMsg; botReply = "Which city is the package going to?"; newMode = 'gen_dest_city'; break;
          case 'gen_dest_city': newContext.destCity = userMsg.toUpperCase(); botReply = "Delivery Type:\n1. Collect at Destination Hub\n2. Door Delivery"; newMode = 'gen_delivery_type'; break;
          case 'gen_delivery_type':
            if (userMsg === '1') { newContext.deliveryType = 'Hub'; newContext.receiverAddress = 'Collect at Hub'; botReply = `Hub collection selected.\nPackage Type:\n1. Carton Box\n2. Gunny Bag\n3. Other`; newMode = 'gen_pkg_type'; } 
            else if (userMsg === '2') { newContext.deliveryType = 'Door'; botReply = "Please enter the receiver's full delivery address."; newMode = 'gen_delivery_address'; } 
            else { botReply = "Please reply 1 or 2."; } break;
          case 'gen_delivery_address': newContext.receiverAddress = userMsg; botReply = "Package Type:\n1. Carton Box\n2. Gunny Bag\n3. Other"; newMode = 'gen_pkg_type'; break;
          case 'gen_pkg_type':
            newContext.pkgType = {'1': 'Carton Box', '2': 'Gunny Bag', '3': 'Other'}[userMsg] || 'Package';
            botReply = "Number of packages? (e.g., 2)"; newMode = 'gen_pkg_count'; break;
          case 'gen_pkg_count': newContext.pkgCount = userMsg; botReply = "Approximate weight? (e.g., 5kg)"; newMode = 'gen_pkg_weight'; break;
          case 'gen_pkg_weight': newContext.pkgWeight = userMsg; botReply = "Please share an image of the package. (Type 'image' to simulate)"; newMode = 'gen_pkg_image'; break;
          case 'gen_pkg_image':
            const assignedAgent = {'VISAKHAPATNAM': 'VSP-A1', 'RAJAMAHENDRAVARAM': 'RJY-A1', 'VIJAYAWADA': 'VJW-A1', 'HYDERABAD': 'HYD-A1'}[newContext.originCity] || 'SHUDHI-HQ';
            const newBooking = {
               id: generateId('SHB'), date: today, agentId: assignedAgent, originCity: newContext.originCity, destCity: newContext.destCity,
               status: 'PENDING_APPROVAL', 
               sender: { name: newContext.senderName, mobile: simulatorIdentity.split('_')[1], address: newContext.senderAddress },
               receiver: { name: newContext.receiverName, mobile: newContext.receiverMobile, address: newContext.receiverAddress }, 
               shipment: { type: newContext.pkgType, pieces: parseInt(newContext.pkgCount) || 1, weight: newContext.pkgWeight },
               commercial: { freight: 0, paymentMode: 'To Be Decided' }
            };
            setBookings(prev => [newBooking, ...prev]);
            botReply = `Image received! ✅\nYour Booking ID is *${newBooking.id}*.\n\nDetails forwarded to our agent in ${newContext.originCity}. They will confirm shortly.\nReply 0 to return to main menu.`;
            newMode = 'menu_return';
            newContext = {};
            break;

          case 'tracking':
            const found = bookings.find(b => b.id.toUpperCase() === userMsg.toUpperCase());
            if (found) { botReply = `*Tracking Result for ${found.id}:*\nStatus: *${found.status}*\nRoute: ${found.originCity} -> ${found.destCity}\nTransporter Ref: ${found.apsrtcRef || 'Pending'}\n\nReply 0 for Main Menu.`; newMode = 'menu_return'; } 
            else { botReply = "Sorry, couldn't find a booking with that ID. Try again or reply 0 for Main Menu."; if (userMsg==='0') newMode='menu_return'; }
            break;
            
          case 'menu_return':
            botReply = "Welcome to SHUDHI Logistics WhatsApp!\n\n1. Book a Shipment\n2. Track Shipment\n3. Check Delivery Status\n4. Contact Support";
            newMode = 'menu';
            break;
        }
      }

      // Save updated state
      setConversations(prev => {
        const c = prev[simulatorIdentity];
        return {
          ...prev,
          [simulatorIdentity]: {
            messages: [...c.messages, { id: Date.now(), text: botReply, sender: 'bot', time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }],
            mode: newMode,
            context: newContext
          }
        };
      });

    }, 800);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:h-[calc(100vh-8rem)]">
      {/* Simulator Control Panel */}
      <div className="w-full lg:w-1/3 bg-white p-4 shadow rounded-lg flex flex-col shrink-0">
         <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2"><Settings size={18}/> Demo Control Panel</h2>
         <p className="text-sm text-gray-500 mb-4">Simulate inbound WhatsApp messages from different roles to test the Multi-Role Router.</p>
         
         <label className="block text-sm font-medium text-gray-700 mb-1">Simulate Identity as:</label>
         <select 
           className="w-full border-gray-300 rounded-md shadow-sm p-2 mb-4 bg-gray-50 focus:ring-teal-500 focus:border-teal-500"
           value={simulatorIdentity}
           onChange={(e) => setSimulatorIdentity(e.target.value)}
         >
           <optgroup label="End Customers">
             <option value="CUSTOMER_9999999999">Customer (+91 9999999999)</option>
             <option value="CUSTOMER_8888888888">Customer (+91 8888888888)</option>
           </optgroup>
           <optgroup label="Sub-Agents">
             {agents.map(a => <option key={a.id} value={`AGENT_${a.id}`}>{a.name} ({a.id})</option>)}
           </optgroup>
           <optgroup label="Field Partners">
             {partners.map(p => <option key={p.phone} value={`PARTNER_${p.phone}`}>{p.name} (Partner)</option>)}
           </optgroup>
         </select>
         
         <div className="mt-auto p-4 bg-blue-50 text-blue-800 text-xs rounded border border-blue-200">
           <strong>Routing Engine Active</strong>
           <p className="mt-1">Messages are automatically processed and routed to: <i>Assistant 01 (Customer), Assistant 02 (Agent), or Assistant 03 (Field Ops)</i> based on the selected identity above.</p>
         </div>
      </div>

      {/* WhatsApp UI */}
      <div className="w-full lg:w-2/3 bg-stone-100 flex flex-col rounded-lg shadow-xl overflow-hidden border border-gray-200 relative h-[600px] lg:h-auto">
        <div className="bg-[#075E54] text-white p-3 flex items-center gap-3">
          <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center overflow-hidden">
            <Package className="text-[#075E54]" size={24} />
          </div>
          <div>
            <h2 className="font-semibold text-lg">SHUDHI Logistics (Official)</h2>
            <p className="text-xs text-stone-200">Chatting as: {simulatorIdentity.split('_')[0]} Identity</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#E5DDD5] custom-bg-pattern">
          {activeConv.messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-lg p-2 shadow-sm relative ${msg.sender === 'user' ? 'bg-[#DCF8C6] rounded-tr-none' : 'bg-white rounded-tl-none'}`}>
                {msg.text.includes('Image received') && (
                   <div className="mb-2 w-full h-32 bg-gray-200 flex items-center justify-center rounded border border-dashed border-gray-400">
                     <span className="text-gray-500 text-xs">Simulated Image Upload</span>
                   </div>
                )}
                <p className="text-sm whitespace-pre-wrap text-gray-800">{msg.text}</p>
                <span className="text-[10px] text-gray-500 float-right mt-1 ml-4">{msg.time}</span>
              </div>
            </div>
          ))}
          <div ref={endOfMessagesRef} />
        </div>

        <div className="bg-[#F0F0F0] p-3 flex items-center gap-2">
          <form onSubmit={handleSend} className="flex-1 flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 rounded-full px-4 py-2 focus:outline-none border-none shadow-sm"
              placeholder="Type a message..."
            />
            <button type="submit" className="bg-[#008F68] text-white p-2 rounded-full hover:bg-teal-700 transition flex items-center justify-center h-10 w-10">
              <Send size={18} className="ml-1" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- 8B. WHATSAPP ADMIN CENTER ---
const WhatsAppAdminCenter = ({ conversations }) => {
  const convList = Object.keys(conversations).map(key => ({
    identity: key,
    type: key.split('_')[0],
    lastMessage: conversations[key].messages[conversations[key].messages.length - 1]?.text || 'No messages',
    msgCount: conversations[key].messages.length
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">WhatsApp Administration Center</h1>
        <p className="text-sm text-gray-500">Unified inbox and communication analytics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border-t-4 border-teal-500">
          <p className="text-sm text-gray-500 uppercase tracking-wide">Active Conversations</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{convList.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-t-4 border-blue-500">
          <p className="text-sm text-gray-500 uppercase tracking-wide">Field Partner Tasks Sent</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{convList.filter(c => c.type === 'PARTNER').length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-t-4 border-orange-500">
          <p className="text-sm text-gray-500 uppercase tracking-wide">Human Handover Requests</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Unified Inbox Directory</h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact Identity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Message Snippet</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Msg Count</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {convList.map((conv, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{conv.identity}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                   <Badge type={conv.type === 'CUSTOMER' ? 'default' : (conv.type === 'AGENT' ? 'primary' : 'warning')}>{conv.type}</Badge>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-xs">{conv.lastMessage.substring(0, 50)}...</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">{conv.msgCount}</td>
              </tr>
            ))}
            {convList.length === 0 && (
              <tr><td colSpan="4" className="px-6 py-4 text-center text-gray-500">No active WhatsApp conversations found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- 9. REPORTS (Simplified) ---
const ReportsModule = ({ bookings }) => {
  const totalRevenue = bookings.reduce((sum, b) => sum + Number(b.commercial.freight || 0), 0);
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Financial Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border-t-4 border-green-500">
          <p className="text-sm text-gray-500 uppercase tracking-wide">Total Revenue (Simulated)</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">₹{totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-t-4 border-blue-500">
          <p className="text-sm text-gray-500 uppercase tracking-wide">Total Shipments</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{bookings.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-t-4 border-orange-500">
          <p className="text-sm text-gray-500 uppercase tracking-wide">Pending Collections</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            ₹{bookings.filter(b => b.commercial.paymentStatus !== 'Paid').reduce((sum, b) => sum + Number(b.commercial.freight || 0), 0).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6 text-center text-gray-500">
         <FileText size={48} className="mx-auto text-gray-300 mb-4" />
         <p>Detailed reports module. In a production environment, this would contain downloadable CSVs for Sub-Agent settlements, APSRTC payable statements, and daily collection reports.</p>
      </div>
    </div>
  );
};

// Styles for Whatsapp background pattern
const style = document.createElement('style');
style.textContent = `
  .custom-bg-pattern {
    background-image: url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='0.05' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E");
  }
`;
document.head.appendChild(style);
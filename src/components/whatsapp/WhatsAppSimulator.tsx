import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { CITY_HUBS, CITIES } from '../../constants/network';
import { Booking, BookingStatus, City, PackageType, PickupType, DeliveryType } from '../../types';
import {
  PhoneCall,
  Send,
  User,
  Users,
  Bike,
  Settings,
  Sparkles,
  ArrowRight,
  Package,
  CheckCircle,
  AlertTriangle,
  MapPin,
  ExternalLink,
  Camera
} from 'lucide-react';

export const WhatsAppSimulator: React.FC = () => {
  const {
    bookings,
    createBooking,
    transitionStatus,
    agents,
    partners,
    conversations,
    setConversations,
    user
  } = useApp();

  const [activeIdentity, setActiveIdentity] = useState<string>('CUSTOMER_9849012345');
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Active conversation state
  const currentConv = conversations[activeIdentity] || {
    identity: activeIdentity,
    phone: activeIdentity.split('_')[1] || '9849012345',
    roleType: activeIdentity.startsWith('AGENT_') ? 'AGENT' : (activeIdentity.startsWith('PARTNER_') ? 'PARTNER' : 'CUSTOMER'),
    messages: [],
    mode: 'menu',
    context: {},
    lastUpdated: new Date().toISOString()
  };

  // Initialize greeting if empty
  useEffect(() => {
    if (!conversations[activeIdentity]) {
      let welcome = "Welcome to SHUDHI Logistics WhatsApp!\nHow can I help you today?\n\n1. Book a Shipment\n2. Track Shipment\n3. Check Hub Locations\n4. Contact Support";
      let mode = 'menu';
      let roleType: 'CUSTOMER' | 'AGENT' | 'PARTNER' = 'CUSTOMER';

      if (activeIdentity.startsWith('AGENT_')) {
        const agtId = activeIdentity.split('_')[1];
        welcome = `🏢 *Agent Desk Assistant*\nWelcome back, ${agtId}.\n\nAvailable commands:\n- TODAY REPORT\n- PENDING BOOKINGS\n- MY SHIPMENTS\n- PAYMENT SUMMARY\n- HELP`;
        mode = 'agent_desk';
        roleType = 'AGENT';
      } else if (activeIdentity.startsWith('PARTNER_')) {
        const pPhone = activeIdentity.split('_')[1];
        welcome = `🏍️ *Field Operations Assistant*\nGround Fleet System active.\n\nSend *PENDING TASKS* to view assignments, or reply with:\n- ACCEPT [ID]\n- COMPLETED [ID]\n- FAILED [ID]`;
        mode = 'field_ops';
        roleType = 'PARTNER';
      }

      setConversations(prev => ({
        ...prev,
        [activeIdentity]: {
          identity: activeIdentity,
          phone: activeIdentity.split('_')[1] || '9849012345',
          roleType,
          mode,
          context: {},
          lastUpdated: new Date().toISOString(),
          messages: [
            { id: `init-${Date.now()}`, text: welcome, sender: 'bot', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
          ]
        }
      }));
    }
  }, [activeIdentity, conversations, setConversations]);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConv.messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = inputText.trim();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsgObj = { id: `msg-${Date.now()}`, text: userMsg, sender: 'user' as const, timestamp: timeStr };

    // Update conversation optimistically
    const updatedMessages = [...currentConv.messages, userMsgObj];
    const prevMode = currentConv.mode;
    const prevContext = { ...currentConv.context };

    setConversations(prev => ({
      ...prev,
      [activeIdentity]: {
        ...currentConv,
        messages: updatedMessages,
        lastUpdated: new Date().toISOString()
      }
    }));

    setInputText('');

    // Central Multi-Assistant Router
    setTimeout(() => {
      let botReply = '';
      let nextMode = prevMode;
      let nextContext = { ...prevContext };

      // ==========================================
      // ASSISTANT 3: FIELD OPERATIONS (PARTNERS)
      // ==========================================
      if (activeIdentity.startsWith('PARTNER_')) {
        const partnerPhone = activeIdentity.split('_')[1];
        const partner = partners.find(p => p.phone === partnerPhone) || { id: partnerPhone, name: 'Partner' };
        const upper = userMsg.toUpperCase().trim();
        const parts = upper.split(' ');
        const cmd = parts[0];
        const targetId = parts[1];

        if (upper === 'PENDING TASKS') {
          const myTasks = bookings.filter(
            b => (b.assignedPickupPartnerId === partner.id || b.assignedDeliveryPartnerId === partner.id) &&
              ['PICKUP_INITIATED', 'OUT_FOR_PICKUP', 'DELIVERY_INITIATED', 'OUT_FOR_DELIVERY'].includes(b.status)
          );

          if (myTasks.length > 0) {
            botReply = `📋 *Pending Ground Tasks for ${partner.name}:*\n\n` +
              myTasks.map(t => {
                const isP = t.status.includes('PICKUP');
                const addr = isP ? t.sender.address : t.receiver.address;
                const contact = isP ? t.sender.mobile : t.receiver.mobile;
                return `• [${t.id}] ${isP ? 'Pickup' : 'Delivery'} (${t.status.replace(/_/g, ' ')})\n  Address: ${addr}\n  Call: ${contact}`;
              }).join('\n\n') +
              `\n\nReply:\n*ACCEPT [ID]* or *COMPLETED [ID]*`;
          } else {
            botReply = "✅ You have no pending tasks assigned at the moment. All clear!";
          }
        } else if (cmd === 'ACCEPT' && targetId) {
          const b = bookings.find(x => x.id === targetId);
          if (b) {
            const nextStatus: BookingStatus = b.status.includes('PICKUP') ? 'OUT_FOR_PICKUP' : 'OUT_FOR_DELIVERY';
            transitionStatus(targetId, nextStatus, `Partner accepted task via WhatsApp.`);
            botReply = `✅ Task *${targetId}* accepted! Status marked as *${nextStatus.replace(/_/g, ' ')}*.\n\nReply *OPEN LOCATION* for Google Maps, or *COMPLETED ${targetId}* upon delivery.`;
          } else {
            botReply = `❌ Consignment ID ${targetId} not found.`;
          }
        } else if (upper === 'OPEN LOCATION') {
          botReply = "🗺️ *Optimized Google Maps Navigation:*\nTap to open turn-by-turn route: https://maps.google.com/?q=Consignee_Premises";
        } else if (cmd === 'COMPLETED' && targetId) {
          nextContext.pendingCompleteId = targetId;
          botReply = `📸 Please attach proof photograph for task *${targetId}*.\n(Type 'image' to simulate camera capture)`;
          nextMode = 'field_ops_proof';
        } else if (cmd === 'FAILED' && targetId) {
          nextContext.pendingFailId = targetId;
          botReply = `⚠️ Select failure reason for task *${targetId}*:\n1. Customer Unavailable\n2. Incorrect Address\n3. Package Refused\n4. Premises Inaccessible`;
          nextMode = 'field_ops_fail';
        } else if (prevMode === 'field_ops_proof') {
          if (userMsg.toLowerCase().includes('image') || userMsg.toLowerCase().includes('photo')) {
            const bId = prevContext.pendingCompleteId;
            const b = bookings.find(x => x.id === bId);
            const isP = b?.status.includes('PICKUP');
            const targetStatus: BookingStatus = isP ? 'PICKUP_COMPLETED' : 'DELIVERED';
            transitionStatus(bId, targetStatus, 'Proof photo verified via WhatsApp field bot.', {
              photoUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500&auto=format&fit=crop&q=80'
            });
            botReply = `✅ Photograph received & verified! Task *${bId}* marked as *${targetStatus.replace(/_/g, ' ')}*!`;
            nextMode = 'field_ops';
            nextContext = {};
          } else {
            botReply = "Please upload an image proof. (Type 'image' to simulate)";
          }
        } else if (prevMode === 'field_ops_fail') {
          const bId = prevContext.pendingFailId;
          const reasons: Record<string, string> = {
            '1': 'Customer Unavailable',
            '2': 'Incorrect Address',
            '3': 'Package Refused',
            '4': 'Premises Inaccessible'
          };
          const selected = reasons[userMsg.trim()] || userMsg;
          const b = bookings.find(x => x.id === bId);
          const failStatus: BookingStatus = b?.status.includes('PICKUP') ? 'PICKUP_FAILED' : 'DELIVERY_FAILED';
          transitionStatus(bId, failStatus, `Failure reported via WA: ${selected}`, { failureReason: selected });
          botReply = `⚠️ Task *${bId}* marked as ${failStatus.replace(/_/g, ' ')}.\nReason: ${selected}\nSHUDHI Central Dispatch notified.`;
          nextMode = 'field_ops';
          nextContext = {};
        } else {
          botReply = "Unrecognized command. Valid commands:\n- PENDING TASKS\n- ACCEPT [ID]\n- COMPLETED [ID]\n- FAILED [ID]";
        }
      }

      // ==========================================
      // ASSISTANT 2: AGENT DESK (SUB-AGENTS)
      // ==========================================
      else if (activeIdentity.startsWith('AGENT_')) {
        const agentId = activeIdentity.split('_')[1];
        const upper = userMsg.toUpperCase().trim();
        const myBookings = bookings.filter(b => b.agentId === agentId);

        if (upper === 'TODAY REPORT') {
          const pending = myBookings.filter(b => b.status === 'PENDING_APPROVAL').length;
          const inTr = myBookings.filter(b => ['AT_ORIGIN_HUB', 'DISPATCHED_ON_THE_WAY', 'REACHED_DEST_HUB'].includes(b.status)).length;
          const done = myBookings.filter(b => b.status === 'DELIVERED').length;
          const totalEarned = myBookings.reduce((sum, b) => sum + b.commercial.subAgentMargin, 0);

          botReply = `📊 *Daily Operational Report for ${agentId}:*\n` +
            `• Total Consignments: ${myBookings.length}\n` +
            `• Awaiting Approval: ${pending}\n` +
            `• APSRTC Transit Flow: ${inTr}\n` +
            `• Successfully Delivered: ${done}\n` +
            `• Accumulated Margin: ₹${totalEarned.toLocaleString()}\n\n` +
            `Type *PENDING BOOKINGS* or *PAYMENT SUMMARY* for more details.`;
        } else if (upper === 'PENDING BOOKINGS') {
          const pend = myBookings.filter(b => b.status === 'PENDING_APPROVAL');
          if (pend.length > 0) {
            botReply = `⏳ *Pending Approval Queue for ${agentId}:*\n` +
              pend.map(p => `• ${p.id} (${p.originCity} → ${p.destCity}) - ₹${p.commercial.totalCustomerPayable}`).join('\n');
          } else {
            botReply = `All bookings for ${agentId} have been reviewed and approved!`;
          }
        } else if (upper === 'PAYMENT SUMMARY') {
          const totalEarned = myBookings.reduce((sum, b) => sum + b.commercial.subAgentMargin, 0);
          const settled = myBookings.filter(b => b.commercial.subAgentMarginSettled).reduce((sum, b) => sum + b.commercial.subAgentMargin, 0);
          botReply = `💰 *Commission Ledger Summary (${agentId}):*\n• Total Margin Accrued: ₹${totalEarned.toLocaleString()}\n• Cleared & Settled: ₹${settled.toLocaleString()}\n• Outstanding Balance: ₹${(totalEarned - settled).toLocaleString()}`;
        } else if (upper === 'MY SHIPMENTS') {
          botReply = `📦 *Recent Shipments for ${agentId}:*\n` +
            myBookings.slice(0, 5).map(b => `• ${b.id} [${b.status}] ${b.destCity}`).join('\n');
        } else {
          botReply = `🏢 *Agent Desk Assistant Commands:*\n- TODAY REPORT\n- PENDING BOOKINGS\n- MY SHIPMENTS\n- PAYMENT SUMMARY\n- HELP`;
        }
      }

      // ==========================================
      // ASSISTANT 1: CUSTOMER CARE
      // ==========================================
      else {
        switch (prevMode) {
          case 'menu':
            if (userMsg === '1') {
              botReply = "Please select Booking Type:\n1. General Door Delivery\n2. Corporate / Business Account";
              nextMode = 'booking_type';
            } else if (userMsg === '2') {
              botReply = "Please enter your 7-character Booking ID (e.g. SHB1001) to track your shipment:";
              nextMode = 'tracking';
            } else if (userMsg === '3') {
              botReply = "📍 *SHUDHI Central Logistics Hubs:*\n\n" +
                "1. VISAKHAPATNAM: Plot 42, Sector 3, MVP Colony\n" +
                "2. RAJAMAHENDRAVARAM: Main Road, Danavaipeta\n" +
                "3. VIJAYAWADA: Near Benz Circle, MG Road\n" +
                "4. HYDERABAD: KPHB Phase 3, Kukatpally\n\nReply 0 for Main Menu.";
              nextMode = 'menu_return';
            } else if (userMsg === '4') {
              botReply = "📞 Connecting you to SHUDHI Customer Care Hotline: +91 891 2548899. Our live team is available 8:00 AM - 8:00 PM.";
            } else {
              botReply = "Please reply with 1, 2, 3, or 4.";
            }
            break;

          case 'tracking':
            const searchId = userMsg.toUpperCase().trim();
            const found = bookings.find(b => b.id.toUpperCase() === searchId || b.apsrtcRef?.toUpperCase() === searchId);
            if (found) {
              botReply = `📦 *Shipment Status for ${found.id}:*\n` +
                `• Status: *${found.status.replace(/_/g, ' ')}*\n` +
                `• Route: ${found.originCity} → ${found.destCity}\n` +
                `• Transporter Ref: ${found.apsrtcRef || 'Generating'}\n` +
                `• Receiver: ${found.receiver.name}\n\n` +
                `Reply 0 for Main Menu.`;
              nextMode = 'menu_return';
            } else {
              botReply = `Sorry, couldn't find consignment "${searchId}". Please check the ID or reply 0 for menu.`;
              if (userMsg === '0') nextMode = 'menu_return';
            }
            break;

          case 'booking_type':
            if (userMsg === '1') {
              nextContext.bookingType = 'General';
              botReply = "Great! Let's book your shipment. Please enter your *Full Name*:";
              nextMode = 'gen_name';
            } else {
              botReply = "Corporate lead recorded. Our B2B enterprise desk will contact your number. Reply 0 for Main Menu.";
              nextMode = 'menu_return';
            }
            break;

          case 'gen_name':
            nextContext.senderName = userMsg;
            botReply = "Which city are you sending from? (VISAKHAPATNAM, RAJAMAHENDRAVARAM, VIJAYAWADA, or HYDERABAD)";
            nextMode = 'gen_city';
            break;

          case 'gen_city':
            const cUpper = userMsg.toUpperCase().trim() as City;
            nextContext.originCity = CITIES.includes(cUpper) ? cUpper : 'VISAKHAPATNAM';
            botReply = "Enter pickup address:";
            nextMode = 'gen_pickup_address';
            break;

          case 'gen_pickup_address':
            nextContext.senderAddress = userMsg;
            botReply = "Please enter the *Receiver's Name & Mobile Number* (e.g. Ramesh Kumar, 9876543210):";
            nextMode = 'gen_receiver';
            break;

          case 'gen_receiver':
            const recvParts = userMsg.split(',');
            nextContext.receiverName = recvParts[0]?.trim() || 'Receiver';
            nextContext.receiverMobile = recvParts[1]?.trim() || '9876543210';
            botReply = "Which destination city is the parcel going to? (e.g. HYDERABAD, VIJAYAWADA)";
            nextMode = 'gen_dest';
            break;

          case 'gen_dest':
            const destUpper = userMsg.toUpperCase().trim() as City;
            nextContext.destCity = CITIES.includes(destUpper) ? destUpper : 'HYDERABAD';
            botReply = "Enter full destination delivery address:";
            nextMode = 'gen_dest_address';
            break;

          case 'gen_dest_address':
            nextContext.receiverAddress = userMsg;
            botReply = "What type of package? (1: Carton Box, 2: Gunny Bag, 3: Documents)";
            nextMode = 'gen_pkg';
            break;

          case 'gen_pkg':
            nextContext.packageType = userMsg === '2' ? 'Gunny Bag' : (userMsg === '3' ? 'Document' : 'Carton Box');
            botReply = "Please attach package photo. (Type 'image' to simulate capture):";
            nextMode = 'gen_photo';
            break;

          case 'gen_photo':
            // CREATE REAL CONSIGNMENT IN APPLICATION!
            const newB = createBooking({
              originCity: nextContext.originCity,
              destCity: nextContext.destCity,
              senderName: nextContext.senderName,
              senderMobile: activeIdentity.split('_')[1] || '9849012345',
              senderAddress: nextContext.senderAddress,
              receiverName: nextContext.receiverName,
              receiverMobile: nextContext.receiverMobile,
              receiverAddress: nextContext.receiverAddress,
              packageType: nextContext.packageType,
              weightKg: 5,
              customerFreight: 190,
              paymentMode: 'CASH'
            });

            botReply = `✅ *Consignment Created Successfully!*\n` +
              `Your Booking ID is: *${newB.id}*\n` +
              `Status: *Pending Review*\n` +
              `Route: ${nextContext.originCity} → ${nextContext.destCity}\n\n` +
              `Our local ground partner in ${nextContext.originCity} will call you before pickup.\n\nReply 0 for Main Menu.`;
            nextMode = 'menu_return';
            nextContext = {};
            break;

          case 'menu_return':
            botReply = "Welcome to SHUDHI Logistics WhatsApp!\n\n1. Book a Shipment\n2. Track Shipment\n3. Check Hub Locations\n4. Contact Support";
            nextMode = 'menu';
            break;
        }
      }

      // Append bot reply
      setConversations(prev => {
        const c = prev[activeIdentity] || currentConv;
        return {
          ...prev,
          [activeIdentity]: {
            ...c,
            mode: nextMode,
            context: nextContext,
            lastUpdated: new Date().toISOString(),
            messages: [
              ...c.messages,
              { id: `bot-${Date.now()}`, text: botReply, sender: 'bot', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
            ]
          }
        };
      });
    }, 700);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8.5rem)]">
      {/* Left Control Panel: Identity Selector */}
      <div className="w-full lg:w-80 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col shrink-0">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
          <Settings className="w-4 h-4 text-slate-600" />
          <h2 className="font-bold text-slate-900 text-sm">Simulator Control Desk</h2>
        </div>

        <p className="text-xs text-slate-500 mb-4">
          Test the single-number central WhatsApp router by switching simulated sender identity:
        </p>

        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Simulated Inbound Sender:
        </label>
        <select
          value={activeIdentity}
          onChange={e => setActiveIdentity(e.target.value)}
          className="w-full p-2.5 text-xs border border-slate-300 rounded-lg bg-slate-50 font-medium focus:ring-1 focus:ring-teal-500 mb-4"
        >
          <optgroup label="1. End Customers (Customer Care Bot)">
            <option value="CUSTOMER_9849012345">Customer 1 (+91 98490 12345)</option>
            <option value="CUSTOMER_9849023456">Customer 2 (+91 98490 23456)</option>
          </optgroup>

          <optgroup label="2. Regional Sub-Agents (Agent Desk Bot)">
            {agents.map(a => (
              <option key={a.id} value={`AGENT_${a.id}`}>
                {a.id} - {a.name} ({a.city})
              </option>
            ))}
          </optgroup>

          <optgroup label="3. Ground Partners (Field Operations Bot)">
            {partners.map(p => (
              <option key={p.phone} value={`PARTNER_${p.phone}`}>
                {p.id} - {p.name} ({p.phone})
              </option>
            ))}
          </optgroup>
        </select>

        {/* Dynamic Routing Explanation */}
        <div className="mt-auto p-4 bg-teal-50/60 rounded-xl border border-teal-200/80 text-xs text-teal-950 space-y-2">
          <span className="font-bold flex items-center gap-1.5 text-teal-800">
            <Sparkles className="w-4 h-4 text-teal-600" />
            Central Routing Engine
          </span>
          <p className="text-[11px] text-teal-900/80 leading-relaxed">
            All messages route through the single official SHUDHI Cloud API number. The engine routes:
          </p>
          <div className="text-[10px] space-y-1 font-mono text-teal-800">
            <div>• Customers → Assistant 1 (Care)</div>
            <div>• Sub-Agents → Assistant 2 (Agent Desk)</div>
            <div>• Field Partners → Assistant 3 (Field Ops)</div>
          </div>
        </div>
      </div>

      {/* Right: WhatsApp Chat Interface */}
      <div className="flex-1 bg-stone-100 rounded-2xl border border-slate-300 shadow-xl overflow-hidden flex flex-col">
        {/* WhatsApp Top Bar */}
        <div className="bg-[#075E54] text-white px-5 py-3.5 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#075E54] font-bold">
              <Package className="w-5 h-5 text-[#075E54]" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight">SHUDHI LOGISTICS (Official Business API)</h3>
              <p className="text-[11px] text-teal-100 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                Active identity: <strong className="font-mono">{activeIdentity}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* WhatsApp Message Canvas */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-[#E5DDD5] custom-bg-pattern">
          {currentConv.messages.map(msg => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl p-3 shadow-2xs relative text-xs ${
                    isUser
                      ? 'bg-[#DCF8C6] text-slate-900 rounded-tr-none'
                      : 'bg-white text-slate-900 rounded-tl-none border border-slate-200/50'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  <span className="text-[10px] text-slate-400 float-right mt-1 ml-3 font-mono">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Bottom Message Input */}
        <form onSubmit={handleSend} className="bg-[#F0F2F5] p-3 flex items-center gap-2 border-t border-slate-200">
          <input
            type="text"
            placeholder={
              activeIdentity.startsWith('AGENT_')
                ? "Type TODAY REPORT, PENDING BOOKINGS, HELP..."
                : activeIdentity.startsWith('PARTNER_')
                ? "Type PENDING TASKS, ACCEPT [ID], COMPLETED [ID]..."
                : "Type message (e.g. 1 to Book, 2 to Track)..."
            }
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            className="flex-1 bg-white text-xs px-4 py-2.5 rounded-full border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-600 shadow-2xs"
          />
          <button
            type="submit"
            className="w-10 h-10 rounded-full bg-[#008F68] hover:bg-teal-700 text-white flex items-center justify-center shadow-xs transition-colors shrink-0"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
};

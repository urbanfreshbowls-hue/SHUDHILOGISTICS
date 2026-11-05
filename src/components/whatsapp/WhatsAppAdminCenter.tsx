import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { WAConversation } from '../../types';
import {
  MessageSquare,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Send,
  Eye,
  X,
  Code,
  ShieldCheck,
  User,
  Users,
  Bike
} from 'lucide-react';

export const WhatsAppAdminCenter: React.FC = () => {
  const { conversations, setConversations } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'CUSTOMER' | 'AGENT' | 'PARTNER'>('ALL');
  const [selectedConv, setSelectedConv] = useState<WAConversation | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showWebhookDocs, setShowWebhookDocs] = useState(false);

  const convList = Object.values(conversations).filter(c => {
    if (roleFilter !== 'ALL' && c.roleType !== roleFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        c.identity.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.messages.some(m => m.text.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleAdminReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedConv) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg = {
      id: `admin-${Date.now()}`,
      text: `[SHUDHI Agent Handover]: ${replyText.trim()}`,
      sender: 'bot' as const,
      timestamp: timeStr
    };

    setConversations(prev => ({
      ...prev,
      [selectedConv.identity]: {
        ...selectedConv,
        messages: [...selectedConv.messages, newMsg],
        lastUpdated: new Date().toISOString()
      }
    }));

    setSelectedConv(prev => (prev ? { ...prev, messages: [...prev.messages, newMsg] } : null));
    setReplyText('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">WhatsApp Administration & Unified Inbox</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-900 font-mono">
              Official Cloud API Hub
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Centrally monitor, audit, and provide human takeover for all incoming WhatsApp channels.
          </p>
        </div>

        <button
          onClick={() => setShowWebhookDocs(!showWebhookDocs)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors shrink-0"
        >
          <Code className="w-3.5 h-3.5 text-teal-600" />
          <span>Cloud API Webhook Docs</span>
        </button>
      </div>

      {/* Webhook Architecture Architecture Callout */}
      {showWebhookDocs && (
        <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-teal-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              Official WhatsApp Cloud API Production Endpoints Architecture
            </span>
            <button onClick={() => setShowWebhookDocs(false)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-slate-300">
            For production deployment, register a single WhatsApp Business Phone Number with Meta Cloud API. Configure the webhook to point to your secure backend route:
          </p>
          <div className="bg-slate-950 p-3 rounded font-mono text-[11px] text-teal-300 space-y-1">
            <div>POST https://api.shudhi.in/api/v1/whatsapp/webhook</div>
            <div className="text-slate-500">// Header: X-Hub-Signature-256 for cryptographic payload verification</div>
            <div className="text-slate-500">// Env: WHATSAPP_API_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_VERIFY_TOKEN</div>
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Active Chat Threads
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {Object.keys(conversations).length}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Live simulator threads</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Partner Task Messages
          </span>
          <div className="text-2xl font-bold font-mono text-purple-700 tabular-nums">
            {Object.values(conversations).filter(c => c.roleType === 'PARTNER').length}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Field dispatch chats</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Customer Inquiries
          </span>
          <div className="text-2xl font-bold font-mono text-teal-700 tabular-nums">
            {Object.values(conversations).filter(c => c.roleType === 'CUSTOMER').length}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">End-consumer chats</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search conversations by phone, message content, or identity..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
          {(['ALL', 'CUSTOMER', 'AGENT', 'PARTNER'] as const).map(role => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                roleFilter === role
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {role === 'ALL' ? 'All Roles' : role}
            </button>
          ))}
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold text-[10px]">
              <tr>
                <th className="px-4 py-3">Sender Identity</th>
                <th className="px-4 py-3">Role Channel</th>
                <th className="px-4 py-3">Last Message Snippet</th>
                <th className="px-4 py-3">Total Messages</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {convList.map(c => {
                const lastMsg = c.messages[c.messages.length - 1]?.text || 'No message';

                return (
                  <tr key={c.identity} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                      {c.identity}
                      <span className="text-[11px] text-slate-400 block font-normal">Phone: {c.phone}</span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.roleType === 'CUSTOMER'
                          ? 'bg-blue-50 text-blue-800'
                          : c.roleType === 'AGENT'
                          ? 'bg-amber-50 text-amber-800'
                          : 'bg-purple-50 text-purple-800'
                      }`}>
                        {c.roleType}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-slate-600 truncate max-w-sm">
                      {lastMsg}
                    </td>

                    <td className="px-4 py-3.5 font-mono text-slate-700">
                      {c.messages.length} msg(s)
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedConv(c)}
                        className="px-3 py-1.5 text-xs font-semibold text-teal-700 hover:text-teal-900 hover:bg-teal-50 rounded transition-colors"
                      >
                        Inspect Thread →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Conversation Detail Slide-over / Modal */}
      {selectedConv && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex justify-end">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">{selectedConv.identity}</h3>
                <p className="text-xs text-slate-400 font-mono">Direct Admin Intervention Channel</p>
              </div>
              <button onClick={() => setSelectedConv(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thread History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 text-xs">
              {selectedConv.messages.map(m => (
                <div
                  key={m.id}
                  className={`p-3 rounded-lg max-w-[85%] ${
                    m.sender === 'user'
                      ? 'bg-teal-100 text-teal-950 ml-auto'
                      : 'bg-white text-slate-900 border border-slate-200'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  <span className="text-[10px] text-slate-400 block text-right mt-1 font-mono">
                    {m.timestamp}
                  </span>
                </div>
              ))}
            </div>

            {/* Admin Response Box */}
            <form onSubmit={handleAdminReply} className="p-3 bg-white border-t border-slate-200 flex gap-2">
              <input
                type="text"
                placeholder="Send official agent response..."
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shrink-0"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

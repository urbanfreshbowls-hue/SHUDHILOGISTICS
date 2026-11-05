import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SubAgent, City } from '../../types';
import { CITIES } from '../../constants/network';
import {
  Users,
  Plus,
  Edit2,
  DollarSign,
  Package,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  X,
  Wallet
} from 'lucide-react';

export const SubAgentDirectory: React.FC = () => {
  const { agents, bookings, addAgent, updateAgent, switchRole } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<SubAgent | null>(null);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    phone: '',
    email: '',
    city: 'VISAKHAPATNAM' as City,
    address: '',
    status: 'Active' as 'Active' | 'Inactive',
    commissionType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    commissionRate: 12
  });

  const openNewAgent = () => {
    setEditingAgent(null);
    setFormData({
      id: `VSP-A${agents.length + 1}`,
      name: '',
      phone: '',
      email: '',
      city: 'VISAKHAPATNAM',
      address: '',
      status: 'Active',
      commissionType: 'PERCENTAGE',
      commissionRate: 12
    });
    setIsModalOpen(true);
  };

  const openEdit = (agent: SubAgent) => {
    setEditingAgent(agent);
    setFormData({
      id: agent.id,
      name: agent.name,
      phone: agent.phone,
      email: agent.email,
      city: agent.city,
      address: agent.address,
      status: agent.status,
      commissionType: agent.commissionType,
      commissionRate: agent.commissionRate
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAgent) {
      updateAgent(editingAgent.id, formData);
    } else {
      addAgent({
        ...formData,
        walletBalance: 0,
        joinedDate: new Date().toISOString().split('T')[0]
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Regional Sub-Agent Directory</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-900 font-mono">
              {agents.length} Sub-Agents Registered
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Network directory of 13 certified regional sub-agents across Visakhapatnam, Rajamahendravaram, Vijayawada, and Hyderabad.
          </p>
        </div>

        <button
          onClick={openNewAgent}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Register Sub-Agent</span>
        </button>
      </div>

      {/* Agents Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold text-[10px]">
              <tr>
                <th className="px-4 py-3">Agent ID & Organization</th>
                <th className="px-4 py-3">City Hub & Address</th>
                <th className="px-4 py-3">Contact Details</th>
                <th className="px-4 py-3">Commission Terms</th>
                <th className="px-4 py-3">Consignments</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {agents.map(agent => {
                const agentBookings = bookings.filter(b => b.agentId === agent.id);
                const totalMargin = agentBookings.reduce((sum, b) => sum + b.commercial.subAgentMargin, 0);

                return (
                  <tr key={agent.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3.5">
                      <span className="font-mono font-bold text-slate-900 block">{agent.id}</span>
                      <span className="font-medium text-slate-800">{agent.name}</span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-slate-900 block">{agent.city}</span>
                      <span className="text-[11px] text-slate-500 truncate block max-w-xs">{agent.address}</span>
                    </td>

                    <td className="px-4 py-3.5 space-y-0.5">
                      <div className="text-slate-700 font-mono flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" /> {agent.phone}
                      </div>
                      <div className="text-slate-400 text-[11px] flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" /> {agent.email}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-teal-700 font-mono block">
                        {agent.commissionType === 'PERCENTAGE' ? `${agent.commissionRate}% margin` : `₹${agent.commissionRate} / piece`}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Total earned: ₹{totalMargin.toLocaleString()}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-900 font-mono text-sm block">
                        {agentBookings.length}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {agentBookings.filter(b => b.status === 'DELIVERED').length} delivered
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        agent.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {agent.status}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => openEdit(agent)}
                        className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => switchRole('SUB_AGENT', agent.id, `${agent.name} (${agent.id})`, agent.city)}
                        className="px-2.5 py-1 text-teal-700 hover:bg-teal-50 font-medium rounded transition-colors"
                        title="Simulate login as this agent"
                      >
                        Login As Agent
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingAgent ? `Edit Sub-Agent (${editingAgent.id})` : 'Register New Regional Sub-Agent'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Agent ID</label>
                  <input
                    type="text"
                    required
                    value={formData.id}
                    disabled={!!editingAgent}
                    onChange={e => setFormData({ ...formData, id: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">City Hub Location</label>
                  <select
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value as City })}
                    className="w-full p-2 border border-slate-300 rounded font-medium"
                  >
                    {CITIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Agency / Franchise Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Srinivasa Express Logistics"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Mobile Contact *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Physical Operating Address</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded border">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Commission Type</label>
                  <select
                    value={formData.commissionType}
                    onChange={e => setFormData({ ...formData, commissionType: e.target.value as any })}
                    className="w-full p-2 border border-slate-300 rounded"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed per Consignment (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Rate {formData.commissionType === 'PERCENTAGE' ? '(%)' : '(₹)'}
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.commissionRate}
                    onChange={e => setFormData({ ...formData, commissionRate: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded"
                >
                  Save Sub-Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LocalPartner, City, PaymentResponsibility } from '../../types';
import { CITIES } from '../../constants/network';
import {
  Bike,
  Plus,
  Phone,
  DollarSign,
  CheckCircle2,
  X,
  CreditCard,
  MapPin
} from 'lucide-react';

export const PartnerDirectory: React.FC = () => {
  const { partners, bookings, addPartner, updatePartner, switchRole, createSettlement } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<LocalPartner | null>(null);

  // Settlement modal state
  const [settlePartner, setSettlePartner] = useState<LocalPartner | null>(null);
  const [settleAmount, setSettleAmount] = useState<number>(0);
  const [settleRef, setSettleRef] = useState<string>('');

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    phone: '',
    city: 'VISAKHAPATNAM' as City,
    serviceType: 'BOTH' as 'PICKUP' | 'DELIVERY' | 'BOTH',
    paymentResponsibility: 'SHUDHI' as PaymentResponsibility,
    defaultPickupRate: 45,
    defaultDeliveryRate: 55,
    status: 'Active' as 'Active' | 'Inactive',
    bankOrUpi: ''
  });

  const openNewPartner = () => {
    setEditingPartner(null);
    setFormData({
      id: `VSP-P${partners.length + 1}`,
      name: '',
      phone: '',
      city: 'VISAKHAPATNAM',
      serviceType: 'BOTH',
      paymentResponsibility: 'SHUDHI',
      defaultPickupRate: 45,
      defaultDeliveryRate: 55,
      status: 'Active',
      bankOrUpi: ''
    });
    setIsModalOpen(true);
  };

  const openEdit = (partner: LocalPartner) => {
    setEditingPartner(partner);
    setFormData({
      id: partner.id,
      name: partner.name,
      phone: partner.phone,
      city: partner.city,
      serviceType: partner.serviceType,
      paymentResponsibility: partner.paymentResponsibility,
      defaultPickupRate: partner.defaultPickupRate,
      defaultDeliveryRate: partner.defaultDeliveryRate,
      status: partner.status,
      bankOrUpi: partner.bankOrUpi
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPartner) {
      updatePartner(editingPartner.id, formData);
    } else {
      addPartner(formData);
    }
    setIsModalOpen(false);
  };

  const handleOpenSettle = (partner: LocalPartner, estimatedDue: number) => {
    setSettlePartner(partner);
    setSettleAmount(estimatedDue);
    setSettleRef(`UPI-${Date.now().toString().slice(-6)}`);
  };

  const handleConfirmSettlement = () => {
    if (!settlePartner || settleAmount <= 0) return;
    createSettlement({
      entityType: 'PARTNER',
      entityId: settlePartner.id,
      entityName: settlePartner.name,
      amount: settleAmount,
      period: 'Ground Fleet Weekly Clearing',
      status: 'PAID',
      paymentMode: 'UPI',
      paymentReference: settleRef || 'UPI-REF-9921',
      notes: `Direct payout to ${settlePartner.bankOrUpi || 'registered account'}`,
      linkedBookingIds: []
    });
    setSettlePartner(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Local Ground Partners Directory</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-900 font-mono">
              {partners.length} Fleet Partners
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Independent local pickup and door delivery contractors operating across all four cities.
          </p>
        </div>

        <button
          onClick={openNewPartner}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Ground Partner</span>
        </button>
      </div>

      {/* Partners Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold text-[10px]">
              <tr>
                <th className="px-4 py-3">Partner ID & Name</th>
                <th className="px-4 py-3">Operating City Hub</th>
                <th className="px-4 py-3">Phone & UPI / Bank</th>
                <th className="px-4 py-3">Service & Responsibility</th>
                <th className="px-4 py-3">Agreed Rates</th>
                <th className="px-4 py-3">Task Stats & Balance</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {partners.map(partner => {
                const partnerBookings = bookings.filter(
                  b => b.assignedPickupPartnerId === partner.id || b.assignedDeliveryPartnerId === partner.id
                );
                const completedCount = partnerBookings.filter(
                  b => ['PICKUP_COMPLETED', 'HANDED_AT_ORIGIN_HUB', 'DELIVERED'].includes(b.status)
                ).length;
                const failedCount = partnerBookings.filter(
                  b => ['PICKUP_FAILED', 'DELIVERY_FAILED'].includes(b.status)
                ).length;

                const estimatedDue = partnerBookings.reduce((sum, b) => {
                  let cost = 0;
                  if (b.assignedPickupPartnerId === partner.id && b.commercial.pickupPaymentStatus === 'PENDING') {
                    cost += partner.defaultPickupRate;
                  }
                  if (b.assignedDeliveryPartnerId === partner.id && b.commercial.deliveryPaymentStatus === 'PENDING') {
                    cost += partner.defaultDeliveryRate;
                  }
                  return sum + cost;
                }, 0);

                return (
                  <tr key={partner.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3.5">
                      <span className="font-mono font-bold text-slate-900 block">{partner.id}</span>
                      <span className="font-medium text-slate-800">{partner.name}</span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-slate-900 block">{partner.city}</span>
                      <span className="text-[11px] text-slate-500">{partner.serviceType} Tasks</span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-mono text-slate-700 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" /> {partner.phone}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {partner.bankOrUpi || 'UPI not linked'}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 block max-w-fit mb-1">
                        Paid By: {partner.paymentResponsibility}
                      </span>
                      <span className="text-[11px] text-slate-500">{partner.serviceType} operations</span>
                    </td>

                    <td className="px-4 py-3.5 font-mono">
                      <div>Pickup: <strong className="text-slate-900">₹{partner.defaultPickupRate}</strong></div>
                      <div>Delivery: <strong className="text-slate-900">₹{partner.defaultDeliveryRate}</strong></div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-medium text-slate-800">
                        {completedCount} Done · {failedCount} Failed
                      </div>
                      <div className="text-[11px] text-teal-700 font-mono font-semibold">
                        Payable Due: ₹{estimatedDue}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-right space-x-1.5">
                      <button
                        onClick={() => openEdit(partner)}
                        className="px-2 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleOpenSettle(partner, estimatedDue)}
                        className="px-2.5 py-1 text-emerald-700 hover:bg-emerald-50 font-medium rounded"
                      >
                        Record Payout
                      </button>
                      <button
                        onClick={() => switchRole('PARTNER', partner.id, partner.name, partner.city)}
                        className="px-2 py-1 text-purple-700 hover:bg-purple-50 font-medium rounded"
                        title="Simulate partner mobile view"
                      >
                        Rider View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Partner Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingPartner ? `Edit Partner (${editingPartner.id})` : 'Register Local Partner'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Partner ID</label>
                  <input
                    type="text"
                    required
                    value={formData.id}
                    disabled={!!editingPartner}
                    onChange={e => setFormData({ ...formData, id: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">City Location</label>
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
                <label className="block font-medium text-slate-700 mb-1">Partner Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kiran Ground Delivery"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Mobile Phone *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">UPI ID / Bank Detail</label>
                  <input
                    type="text"
                    placeholder="e.g. kiran@upi"
                    value={formData.bankOrUpi}
                    onChange={e => setFormData({ ...formData, bankOrUpi: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Service Type</label>
                  <select
                    value={formData.serviceType}
                    onChange={e => setFormData({ ...formData, serviceType: e.target.value as any })}
                    className="w-full p-2 border border-slate-300 rounded"
                  >
                    <option value="BOTH">Both Pickup & Delivery</option>
                    <option value="PICKUP">Pickup Only</option>
                    <option value="DELIVERY">Delivery Only</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Paying Entity</label>
                  <select
                    value={formData.paymentResponsibility}
                    onChange={e => setFormData({ ...formData, paymentResponsibility: e.target.value as any })}
                    className="w-full p-2 border border-slate-300 rounded"
                  >
                    <option value="SHUDHI">SHUDHI Central</option>
                    <option value="SUB_AGENT">Regional Sub-Agent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded border">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Default Pickup Rate (₹)</label>
                  <input
                    type="number"
                    value={formData.defaultPickupRate}
                    onChange={e => setFormData({ ...formData, defaultPickupRate: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Default Delivery Rate (₹)</label>
                  <input
                    type="number"
                    value={formData.defaultDeliveryRate}
                    onChange={e => setFormData({ ...formData, defaultDeliveryRate: Number(e.target.value) })}
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
                  Save Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payout Settlement Modal */}
      {settlePartner && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Record Payout to {settlePartner.name}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Settlement Amount (₹) *</label>
                <input
                  type="number"
                  value={settleAmount}
                  onChange={e => setSettleAmount(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded font-mono font-bold text-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Transaction Ref / UPI UTR *</label>
                <input
                  type="text"
                  value={settleRef}
                  onChange={e => setSettleRef(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button onClick={() => setSettlePartner(null)} className="px-3 py-1.5 text-slate-600">
                Cancel
              </button>
              <button
                onClick={handleConfirmSettlement}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded"
              >
                Confirm Payout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CITIES } from '../../constants/network';
import { PackageType, PickupType, DeliveryType, PaymentMode, City } from '../../types';
import { X, Package, MapPin, DollarSign, Upload, Camera, Check } from 'lucide-react';

interface BookingCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BookingCreateModal: React.FC<BookingCreateModalProps> = ({ isOpen, onClose }) => {
  const { user, createBooking } = useApp();

  const [formData, setFormData] = useState({
    originCity: (user.city || 'VISAKHAPATNAM') as City,
    destCity: 'HYDERABAD' as City,
    senderName: '',
    senderMobile: '',
    senderAddress: '',
    senderPincode: '530017',
    pickupType: 'DOOR_PICKUP' as PickupType,

    receiverName: '',
    receiverMobile: '',
    receiverAddress: '',
    receiverPincode: '500081',
    deliveryType: 'DOOR_DELIVERY' as DeliveryType,

    packageType: 'Carton Box' as PackageType,
    pieces: 1,
    weightKg: 5,
    volumetricWeightKg: 6,
    declaredValue: 2000,
    description: '',
    specialInstructions: '',
    photos: [] as string[],

    customerFreight: 190,
    additionalCharges: 0,
    discount: 0,
    paymentMode: 'CASH' as PaymentMode
  });

  if (!isOpen) return null;

  // Recalculate suggested freight when weight changes
  const handleWeightChange = (wt: number) => {
    const suggestedFreight = Math.round(100 + wt * 18);
    setFormData(prev => ({
      ...prev,
      weightKg: wt,
      volumetricWeightKg: Math.round(wt * 1.2),
      customerFreight: suggestedFreight
    }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setFormData(prev => ({
            ...prev,
            photos: [...prev.photos, reader.result as string]
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.senderName || !formData.senderMobile || !formData.receiverName || !formData.receiverMobile) {
      alert('Please fill in mandatory sender and receiver information.');
      return;
    }

    createBooking(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Package className="w-5 h-5 text-teal-400" />
            <div>
              <h2 className="font-bold text-base">New Consignment Booking</h2>
              <p className="text-xs text-slate-400">
                Logged as: <strong className="text-teal-400">{user.name}</strong> ({user.role})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Origin & Destination Hubs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Origin City Hub</label>
              <select
                value={formData.originCity}
                onChange={e => setFormData({ ...formData, originCity: e.target.value as City })}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-teal-500 font-medium"
              >
                {CITIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Destination City Hub</label>
              <select
                value={formData.destCity}
                onChange={e => setFormData({ ...formData, destCity: e.target.value as City })}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-teal-500 font-medium"
              >
                {CITIES.filter(c => c !== formData.originCity).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Sender Details */}
          <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-teal-600" /> Sender Information (Origin)
              </span>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="pickupType"
                    checked={formData.pickupType === 'DOOR_PICKUP'}
                    onChange={() => setFormData({ ...formData, pickupType: 'DOOR_PICKUP' })}
                  />
                  <span>Door Pickup</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="pickupType"
                    checked={formData.pickupType === 'HUB_DROP'}
                    onChange={() => setFormData({ ...formData, pickupType: 'HUB_DROP' })}
                  />
                  <span>Hub Drop</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-600 mb-1">Sender Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Chandra"
                  value={formData.senderName}
                  onChange={e => setFormData({ ...formData, senderName: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">Sender Mobile *</label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit mobile"
                  value={formData.senderMobile}
                  onChange={e => setFormData({ ...formData, senderMobile: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-teal-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block font-medium text-slate-600 mb-1">Pickup Address</label>
                <input
                  type="text"
                  required
                  placeholder="Full street address & landmark"
                  value={formData.senderAddress}
                  onChange={e => setFormData({ ...formData, senderAddress: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">Pincode</label>
                <input
                  type="text"
                  required
                  placeholder="530017"
                  value={formData.senderPincode}
                  onChange={e => setFormData({ ...formData, senderPincode: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-teal-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Receiver Details */}
          <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" /> Receiver Information (Destination)
              </span>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="deliveryType"
                    checked={formData.deliveryType === 'DOOR_DELIVERY'}
                    onChange={() => setFormData({ ...formData, deliveryType: 'DOOR_DELIVERY' })}
                  />
                  <span>Door Delivery</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="deliveryType"
                    checked={formData.deliveryType === 'DEST_HUB_COLLECT'}
                    onChange={() => setFormData({ ...formData, deliveryType: 'DEST_HUB_COLLECT' })}
                  />
                  <span>Hub Collect</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-600 mb-1">Receiver Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prasad Krishna"
                  value={formData.receiverName}
                  onChange={e => setFormData({ ...formData, receiverName: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">Receiver Mobile *</label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit mobile"
                  value={formData.receiverMobile}
                  onChange={e => setFormData({ ...formData, receiverMobile: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-teal-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block font-medium text-slate-600 mb-1">Delivery Address</label>
                <input
                  type="text"
                  required
                  placeholder="Destination street address & landmark"
                  value={formData.receiverAddress}
                  onChange={e => setFormData({ ...formData, receiverAddress: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">Pincode</label>
                <input
                  type="text"
                  required
                  placeholder="500081"
                  value={formData.receiverPincode}
                  onChange={e => setFormData({ ...formData, receiverPincode: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-teal-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Shipment & Packaging */}
          <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5 border-b pb-2">
              <Package className="w-3.5 h-3.5 text-slate-700" /> Consignment Specifications
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-medium text-slate-600 mb-1">Packaging Type</label>
                <select
                  value={formData.packageType}
                  onChange={e => setFormData({ ...formData, packageType: e.target.value as PackageType })}
                  className="w-full p-2 border border-slate-300 rounded"
                >
                  <option value="Carton Box">Carton Box</option>
                  <option value="Gunny Bag">Gunny Bag</option>
                  <option value="Document">Document</option>
                  <option value="Pallet">Pallet</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Pieces / Bags</label>
                <input
                  type="number"
                  min="1"
                  value={formData.pieces}
                  onChange={e => setFormData({ ...formData, pieces: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-300 rounded font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Actual Weight (kg)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={formData.weightKg}
                  onChange={e => handleWeightChange(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Declared Value (₹)</label>
                <input
                  type="number"
                  value={formData.declaredValue}
                  onChange={e => setFormData({ ...formData, declaredValue: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-300 rounded font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-600 mb-1">Contents Description</label>
              <input
                type="text"
                placeholder="e.g. Handloom sarees, machine valves, documents"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded"
              />
            </div>

            {/* Photo Attachment */}
            <div>
              <label className="block font-medium text-slate-600 mb-1">Attach Package Photograph (Optional)</label>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose Photo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
                {formData.photos.length > 0 && (
                  <span className="text-teal-700 font-semibold">{formData.photos.length} photo(s) attached</span>
                )}
              </div>
            </div>
          </div>

          {/* Commercial & Payment */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5 border-b pb-2">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Freight Charges & Payment Terms
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-medium text-slate-600 mb-1">Customer Freight (₹)</label>
                <input
                  type="number"
                  value={formData.customerFreight}
                  onChange={e => setFormData({ ...formData, customerFreight: Number(e.target.value) })}
                  className="w-full p-2 border border-slate-300 rounded font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Payment Mode</label>
                <select
                  value={formData.paymentMode}
                  onChange={e => setFormData({ ...formData, paymentMode: e.target.value as PaymentMode })}
                  className="w-full p-2 border border-slate-300 rounded font-medium"
                >
                  <option value="CASH">Cash on Pickup</option>
                  <option value="TO_PAY_COD">To Pay (COD Delivery)</option>
                  <option value="UPI_ONLINE">UPI / Online Paid</option>
                  <option value="CREDIT_ACCOUNT">Credit Account</option>
                </select>
              </div>

              <div className="col-span-2 flex items-center justify-end">
                <div className="text-right">
                  <span className="text-[11px] text-slate-500 block">Total Customer Payable</span>
                  <span className="text-xl font-bold font-mono text-teal-700 tabular-nums">
                    ₹{formData.customerFreight}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Submission Notice based on Role */}
          <div className="p-3 bg-blue-50 text-blue-900 rounded-lg text-xs">
            {user.role === 'SHUDHI_ADMIN' ? (
              <span>Direct Admin Booking: Will be <strong>Approved immediately</strong> with APSRTC Ref.</span>
            ) : (
              <span>Sub-Agent / Customer Submission: Will enter the <strong>Approval Review Queue</strong> before dispatch.</span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors"
            >
              {user.role === 'SHUDHI_ADMIN' ? 'Create & Approve Consignment' : 'Submit for Approval'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

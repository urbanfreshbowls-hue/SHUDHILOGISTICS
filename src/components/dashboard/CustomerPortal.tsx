import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PublicTrackingModal } from '../tracking/PublicTrackingModal';
import { PublicTrackingData } from '../../types/tracking';
import { mapBookingToPublicTracking, getMaskedContactDestination } from '../../utils/trackingMapper';
import {
  Search,
  Package,
  MapPin,
  Truck,
  CheckCircle,
  ArrowRight,
  PhoneCall,
  ShieldCheck,
  KeyRound,
  AlertCircle
} from 'lucide-react';

interface CustomerPortalProps {
  onOpenCreateBooking: () => void;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({ onOpenCreateBooking }) => {
  const { bookings, setCurrentView } = useApp();

  // Search input state
  const [bookingRefInput, setBookingRefInput] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);

  // OTP Challenge State
  const [pendingBooking, setPendingBooking] = useState<any | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isOtpStepActive, setIsOtpStepActive] = useState(false);

  // Verified Public Tracking Modal State
  const [publicTrackingData, setPublicTrackingData] = useState<PublicTrackingData | null>(null);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);

  // Step 1 & 2 & 3 & 4: Lookup booking by reference and trigger OTP challenge for SENDER
  const handleInitiateTracking = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSearchError(null);
    setOtpError(null);
    setOtpInput('');

    const query = bookingRefInput.trim().toUpperCase();
    if (!query) {
      setSearchError('Please enter a SHUDHI booking reference (e.g. SHB1001).');
      return;
    }

    // Match strictly by booking reference / ID
    const found = bookings.find(b => b.id.toUpperCase() === query);
    if (!found) {
      setPendingBooking(null);
      setIsOtpStepActive(false);
      setSearchError(`Booking reference "${query}" not found. Please verify your reference number and try again.`);
      return;
    }

    // Business Policy: Tracking OTP must be sent to the sender's registered mobile number
    const senderPhone = found.sender?.mobile;
    if (!senderPhone) {
      setSearchError('No registered sender contact number found on record for this booking.');
      return;
    }

    setPendingBooking(found);
    setIsOtpStepActive(true);
  };

  // Step 6 & 7: Verify OTP and unlock sanitized tracking view
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);

    if (!otpInput.trim()) {
      setOtpError('Please enter the 6-digit verification code.');
      return;
    }

    // Demo verification code check
    if (otpInput.trim() !== '123456') {
      setOtpError('Invalid verification code. For this demonstration, use simulated code 123456.');
      return;
    }

    if (!pendingBooking) {
      setOtpError('Session expired. Please search your booking reference again.');
      setIsOtpStepActive(false);
      return;
    }

    // Sanitize and map to PublicTrackingData boundary
    const sanitizedData = mapBookingToPublicTracking(pendingBooking);
    setPublicTrackingData(sanitizedData);
    setIsTrackingModalOpen(true);
  };

  const handleResetSearch = () => {
    setPendingBooking(null);
    setIsOtpStepActive(false);
    setOtpInput('');
    setOtpError(null);
    setSearchError(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Customer Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-8 shadow-md relative overflow-hidden">
        <div className="max-w-xl space-y-4">
          <span className="text-xs uppercase font-bold text-teal-400 tracking-wider">
            Customer Self-Service Hub
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Track Consignment or Request Parcel Pickup
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Reliable express courier service across Visakhapatnam, Rajamahendravaram, Vijayawada, and Hyderabad via APSRTC Logistics.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={onOpenCreateBooking}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              Book Door Pickup
            </button>
            <button
              onClick={() => setCurrentView('whatsapp-simulator')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <PhoneCall className="w-4 h-4 text-emerald-400" />
              <span>Track via WhatsApp</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tracking & OTP Verification Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Search className="w-5 h-5 text-teal-600" />
            Track Consignment
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Enter your SHUDHI booking reference to authenticate with a verification code sent to the sender's registered mobile number.
          </p>
        </div>

        {/* Step 1: Booking Reference Input */}
        {!isOtpStepActive ? (
          <form onSubmit={handleInitiateTracking} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Enter SHUDHI Booking ID (e.g. SHB1001)..."
                  value={bookingRefInput}
                  onChange={e => {
                    setBookingRefInput(e.target.value);
                    if (searchError) setSearchError(null);
                  }}
                  className="w-full text-sm px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono uppercase"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors shrink-0 flex items-center justify-center gap-2"
              >
                <span>Find Shipment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {searchError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{searchError}</span>
              </div>
            )}
          </form>
        ) : (
          /* Step 2 & 3 & 4 & 5: OTP Verification Challenge for SENDER's Mobile */
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-5 animate-in fade-in duration-200">
            {/* Registered Masked Sender Destination Banner */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-teal-600" />
                <span className="text-xs font-bold text-slate-900">
                  Authentication Required for Booking {pendingBooking?.id}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                OTP verification for sender's registered mobile{' '}
                <strong className="font-semibold text-slate-800 font-mono">
                  {getMaskedContactDestination(pendingBooking?.sender?.mobile)}
                </strong>
              </p>
            </div>

            {/* Clearly Labeled Demo Mode Disclaimer Banner */}
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>DEMO MODE: Simulated OTP Authentication</span>
              </div>
              <p className="text-amber-800 leading-relaxed">
                DEMO MODE: OTP verification is simulated. Use <strong className="font-mono bg-amber-100 px-1.5 py-0.5 rounded text-amber-950">123456</strong> for this demonstration. No actual SMS or WhatsApp message is sent.
              </p>
            </div>

            {/* OTP Entry Form */}
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Enter 6-Digit Verification Code
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otpInput}
                    onChange={e => {
                      setOtpInput(e.target.value.replace(/\D/g, ''));
                      if (otpError) setOtpError(null);
                    }}
                    autoFocus
                    className="w-full sm:w-48 text-center text-lg font-mono tracking-widest px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  />
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Verify & Track</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleResetSearch}
                    className="px-4 py-2.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Change Booking ID
                  </button>
                </div>
              </div>

              {otpError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{otpError}</span>
                </div>
              )}
            </form>
          </div>
        )}
      </div>

      {/* Suggested demo tracking IDs */}
      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
        <span>Try sample IDs:</span>
        {['SHB1001', 'SHB1006', 'SHB1015', 'SHB1020', 'SHB1038'].map(id => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setBookingRefInput(id);
              setSearchError(null);
              setIsOtpStepActive(false);
              setPendingBooking(null);
              setOtpInput('');
              setOtpError(null);
            }}
            className="font-mono text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2 py-0.5 rounded transition-colors"
          >
            {id}
          </button>
        ))}
      </div>

      {/* Public Read-Only Tracking Modal */}
      <PublicTrackingModal
        isOpen={isTrackingModalOpen}
        onClose={() => setIsTrackingModalOpen(false)}
        trackingData={publicTrackingData}
      />
    </div>
  );
};

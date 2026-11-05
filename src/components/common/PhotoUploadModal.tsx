import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Camera, Upload, X, Check, Image as ImageIcon } from 'lucide-react';

export const PhotoUploadModal: React.FC = () => {
  const { photoModal, closePhotoModal } = useApp();
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [recipientName, setRecipientName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!photoModal.isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setPreviewUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Preset demo photo helper for fast testing in desktop browsers without cameras
  const setDemoPhoto = (type: 'box' | 'delivery' | 'seal') => {
    const demos = {
      box: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&auto=format&fit=crop&q=80',
      delivery: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80',
      seal: 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=600&auto=format&fit=crop&q=80'
    };
    setPreviewUrl(demos[type]);
  };

  const handleConfirm = () => {
    if (!previewUrl) return;
    setIsSubmitting(true);
    setTimeout(() => {
      if (photoModal.onComplete) {
        photoModal.onComplete(previewUrl, notes, recipientName);
      }
      setIsSubmitting(false);
      setPreviewUrl('');
      setRecipientName('');
      setNotes('');
      closePhotoModal();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-teal-600" />
            <h3 className="font-semibold text-slate-900">{photoModal.title}</h3>
          </div>
          <button
            onClick={closePhotoModal}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-500">
            Attach photo proof for booking <strong className="text-slate-700 font-mono">{photoModal.bookingId}</strong>.
            This will be permanently archived in the shipment event timeline.
          </p>

          {/* Image Uploader */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-700">Photo / Camera Capture</label>
            {previewUrl ? (
              <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-100 h-52 flex items-center justify-center">
                <img
                  src={previewUrl}
                  alt="Proof preview"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setPreviewUrl('')}
                  className="absolute top-2 right-2 bg-slate-900/80 hover:bg-slate-900 text-white p-1.5 rounded-full text-xs transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-slate-100/50 transition-colors h-48">
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-sm font-medium text-slate-700">Click to upload or take a photo</span>
                <span className="text-xs text-slate-400 mt-1">PNG, JPG up to 10MB</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            )}

            {/* Quick preset chips for rapid demo testing */}
            {!previewUrl && (
              <div className="pt-2">
                <span className="text-[11px] text-slate-400 block mb-1.5">Or use instant demo sample:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDemoPhoto('box')}
                    className="text-xs px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                    Packaged Box
                  </button>
                  <button
                    type="button"
                    onClick={() => setDemoPhoto('delivery')}
                    className="text-xs px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                    Handover Proof
                  </button>
                  <button
                    type="button"
                    onClick={() => setDemoPhoto('seal')}
                    className="text-xs px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                    Seal & Label
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Conditional Recipient Name for Delivery */}
          {photoModal.mode === 'DELIVERY' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Recipient / Receiver Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Full name of person who received package"
                value={recipientName}
                onChange={e => setRecipientName(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Operational Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Tamper tape intact, signature captured on invoice"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={closePhotoModal}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!previewUrl || isSubmitting || (photoModal.mode === 'DELIVERY' && !recipientName.trim())}
            onClick={handleConfirm}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md shadow-xs transition-colors"
          >
            <Check className="w-4 h-4" />
            {isSubmitting ? 'Uploading...' : 'Confirm & Save Proof'}
          </button>
        </div>
      </div>
    </div>
  );
};

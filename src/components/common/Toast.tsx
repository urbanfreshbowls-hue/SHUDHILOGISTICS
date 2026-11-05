import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toast } = useApp();

  if (!toast) return null;

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-teal-600 shrink-0" />;
    }
  };

  const borderClass =
    toast.type === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
      : toast.type === 'error'
      ? 'border-rose-200 bg-rose-50 text-rose-950'
      : 'border-teal-200 bg-teal-50 text-teal-950';

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
      <div
        className={`flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-lg border text-xs font-medium max-w-md ${borderClass}`}
      >
        {getIcon()}
        <span className="flex-1">{toast.message}</span>
      </div>
    </div>
  );
};

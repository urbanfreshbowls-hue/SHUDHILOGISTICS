import React from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, X, Check, ArrowRight, Clock } from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const { notifications, markNotificationRead, clearAllNotifications, setCurrentView, setSelectedBooking, bookings } = useApp();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-sm h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-teal-600" />
            <h3 className="font-semibold text-slate-900 text-sm">System Notifications</h3>
          </div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                onClick={clearAllNotifications}
                className="text-[11px] text-slate-500 hover:text-slate-800"
              >
                Clear all
              </button>
            )}
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
          {notifications.map(n => (
            <div
              key={n.id}
              className={`p-3 rounded-lg text-xs transition-colors ${
                n.read ? 'bg-white opacity-80' : 'bg-teal-50/40 border border-teal-100'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-900">{n.title}</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-slate-600 leading-relaxed mb-2">{n.message}</p>

              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                {n.linkView && (
                  <button
                    onClick={() => {
                      setCurrentView(n.linkView!);
                      if (n.bookingId) {
                        const b = bookings.find(x => x.id === n.bookingId);
                        if (b) setSelectedBooking(b);
                      }
                      markNotificationRead(n.id);
                      onClose();
                    }}
                    className="text-teal-700 hover:text-teal-900 font-medium inline-flex items-center gap-1"
                  >
                    View details <ArrowRight className="w-3 h-3" />
                  </button>
                )}
                {!n.read && (
                  <button
                    onClick={() => markNotificationRead(n.id)}
                    className="text-slate-400 hover:text-slate-700 ml-auto"
                  >
                    Mark read
                  </button>
                )}
              </div>
            </div>
          ))}

          {notifications.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-xs">
              <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <span>No notifications at this time.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

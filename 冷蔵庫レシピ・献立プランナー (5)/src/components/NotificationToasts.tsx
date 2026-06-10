/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, CheckCircle, AlertTriangle, Info, Bell, ShieldCheck } from 'lucide-react';
import { NotificationItem } from '../types';

interface NotificationToastsProps {
  toasts: NotificationItem[];
  onDismiss: (id: string) => void;
}

export default function NotificationToasts({ toasts, onDismiss }: NotificationToastsProps) {
  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'success':
        return <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />;
      case 'error':
        return <X className="h-3.5 w-3.5 text-rose-500 shrink-0" />;
      case 'info':
      default:
        return <Info className="h-3.5 w-3.5 text-teal-500 shrink-0" />;
    }
  };

  const getStyle = (type: NotificationItem['type']) => {
    switch (type) {
      case 'success':
        return 'bg-slate-950 border-l-2 border-emerald-500 shadow-emerald-950/10 text-white';
      case 'warning':
        return 'bg-slate-950 border-l-2 border-amber-500 shadow-amber-950/10 text-white';
      case 'error':
        return 'bg-slate-950 border-l-2 border-rose-500 shadow-rose-950/10 text-white';
      case 'info':
      default:
        return 'bg-slate-950 border-l-2 border-teal-500 shadow-teal-950/10 text-white';
    }
  };

  return (
    <div 
      className="fixed bottom-3 right-3 w-64 md:w-64 z-50 flex flex-col gap-1 pointer-events-none select-none max-w-[calc(100vw-24px)]"
      id="notification-toast-portal"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`p-1.5 px-2 rounded-lg shadow-md flex items-start gap-2 border border-slate-800 animate-slide-up pointer-events-auto backdrop-blur-md ${getStyle(
            toast.type
          )}`}
        >
          <div className="mt-0.5">{getIcon(toast.type)}</div>
          
          <div className="flex-1 min-w-0 space-y-0 text-left">
            <span className="text-[9.5px] font-bold tracking-tight block text-slate-100 leading-tight truncate">
              {toast.title}
            </span>
            <p className="text-[8.5px] text-gray-300 leading-tight">
              {toast.message}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="text-gray-500 hover:text-white transition-colors cursor-pointer p-0.5 rounded-md hover:bg-slate-850 shrink-0 mt-0.5"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

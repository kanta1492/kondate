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
        return <ShieldCheck className="h-4.5 w-4.5 text-emerald-500 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="h-4.5 w-4.5 text-amber-500 shrink-0" />;
      case 'error':
        return <X className="h-4.5 w-4.5 text-rose-500 shrink-0" />;
      case 'info':
      default:
        return <Info className="h-4.5 w-4.5 text-teal-500 shrink-0" />;
    }
  };

  const getStyle = (type: NotificationItem['type']) => {
    switch (type) {
      case 'success':
        return 'bg-slate-950 border-l-3 border-emerald-500 shadow-emerald-950/10 text-white';
      case 'warning':
        return 'bg-slate-950 border-l-3 border-amber-500 shadow-amber-950/10 text-white';
      case 'error':
        return 'bg-slate-950 border-l-3 border-rose-500 shadow-rose-950/10 text-white';
      case 'info':
      default:
        return 'bg-slate-950 border-l-3 border-teal-500 shadow-teal-950/10 text-white';
    }
  };

  return (
    <div 
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-80 z-50 flex flex-col gap-1.5 pointer-events-none select-none max-w-full"
      id="notification-toast-portal"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`p-2.5 rounded-xl shadow-lg flex items-start gap-2.5 border border-slate-800 animate-slide-up pointer-events-auto backdrop-blur-md ${getStyle(
            toast.type
          )}`}
        >
          <div className="mt-0.5">{getIcon(toast.type)}</div>
          
          <div className="flex-1 space-y-0.5 pr-1 text-left">
            <span className="text-[11px] font-bold tracking-tight block text-slate-100 leading-tight">
              {toast.title}
            </span>
            <p className="text-[10px] text-gray-300 leading-normal">
              {toast.message}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="text-gray-500 hover:text-white transition-colors cursor-pointer p-0.5 rounded-lg hover:bg-slate-850 shrink-0 mt-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

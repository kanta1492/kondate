/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Bell, BellRing, Check, Trash2, X, AlertTriangle, ShieldCheck, Info, Sparkles, ShoppingBag, Calendar, Trash } from 'lucide-react';
import { NotificationItem } from '../types';

interface NotificationCenterProps {
  notifications: NotificationItem[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onRemove: (id: string) => void;
}

export default function NotificationCenter({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onRemove,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'warning'>('all');

  const unreadCount = notifications.filter(n => !n.read).length;

  // Filter notifications
  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    if (filter === 'warning') return n.type === 'warning' || n.type === 'error';
    return true;
  });

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'success':
        return <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-650 shrink-0" />;
      case 'error':
        return <X className="h-4 w-4 text-rose-600 shrink-0" />;
      case 'info':
      default:
        return <Info className="h-4 w-4 text-teal-600 shrink-0" />;
    }
  };

  const getBgColor = (type: NotificationItem['type'], read: boolean) => {
    if (read) return 'bg-white opacity-85';
    switch (type) {
      case 'success':
        return 'bg-emerald-50/50 border-l-3 border-emerald-500';
      case 'warning':
        return 'bg-amber-50/50 border-l-3 border-amber-500';
      case 'error':
        return 'bg-rose-50/50 border-l-3 border-rose-500';
      case 'info':
      default:
        return 'bg-teal-50/50 border-l-3 border-teal-500';
    }
  };

  return (
    <div className="relative font-sans">
      {/* Trigger Button */}
      <button
        id="notification-bell-trigger"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-1.5 rounded-lg transition-all border cursor-pointer select-none flex items-center justify-center ${
          isOpen
            ? 'bg-sage-600 text-white border-sage-600'
            : unreadCount > 0
            ? 'bg-amber-50 text-amber-850 border-amber-200 hover:bg-amber-100 animate-pulse'
            : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border-gray-205'
        }`}
        title="通知センターを開く"
        type="button"
      >
        {unreadCount > 0 ? (
          <BellRing className="h-3.5 w-3.5 text-inherit animate-swing" />
        ) : (
          <Bell className="h-3.5 w-3.5 text-inherit" />
        )}
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[8px] font-bold h-3.5 min-w-3.5 px-0.5 rounded-full flex items-center justify-center border border-white animate-scale-up">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Overlay Backdrop for mobile tap out */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-transparent cursor-default" 
          onClick={() => setIsOpen(false)} 
        />
      )}

      {/* Dropdown Panel */}
      {isOpen && (
        <div 
          className="fixed md:absolute right-2 left-2 md:left-auto md:right-0 top-18 md:top-auto mt-2.5 w-auto md:w-96 bg-white rounded-2xl shadow-xl border border-gray-150 z-50 text-gray-850 animate-scale-up overflow-hidden max-w-[calc(100vw-16px)]"
          id="notification-panel-holder"
        >
          {/* Header */}
          <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight flex items-center gap-1.5">
                <span>🔔</span> AIリアルタイム通知センター
              </span>
              {unreadCount > 0 && (
                <span className="bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                  新着 {unreadCount}件
                </span>
              )}
            </div>
            
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition-colors cursor-pointer p-0.5 rounded-lg hover:bg-white/10"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Quick Filters */}
          <div className="bg-gray-50 border-b border-gray-150 px-4 py-2.5 flex items-center justify-between gap-1.5 text-xs select-none">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  filter === 'all'
                    ? 'bg-slate-800 text-white shadow-3xs'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/60'
                }`}
              >
                全て ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('unread')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  filter === 'unread'
                    ? 'bg-rose-55 bg-indigo-600 text-white shadow-3xs'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/60'
                }`}
              >
                未読 ({unreadCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter('warning')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  filter === 'warning'
                    ? 'bg-amber-600 text-white shadow-3xs'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/60'
                }`}
              >
                アラート ({notifications.filter(n => n.type === 'warning' || n.type === 'error').length})
              </button>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllAsRead}
                className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
              >
                <Check className="h-3 w-3" /> All既読
              </button>
            )}
          </div>

          {/* Notifications Scroll Box */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 bg-gray-50/50">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-30 text-slate-400" />
                <p className="text-xs font-bold">通知はありません</p>
                <p className="text-[10px] text-gray-400 mt-1">食材、レシピ、献立、お買い物の操作時に自動通知されます</p>
              </div>
            ) : (
              filteredNotifications.map(notif => (
                <div
                  key={notif.id}
                  className={`p-3.5 flex gap-3 transition-colors text-xs items-start ${getBgColor(notif.type, notif.read)}`}
                >
                  <div className="mt-0.5 shrink-0">
                    {getIcon(notif.type)}
                  </div>
                  
                  <div className="flex-1 space-y-0.5 min-w-0">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className={`font-bold truncate ${notif.read ? 'text-gray-600' : 'text-gray-950'}`}>
                        {notif.title}
                      </span>
                      <span className="font-mono text-[9px] text-gray-400 shrink-0">
                        {notif.timestamp}
                      </span>
                    </div>
                    <p className={`text-[11px] leading-relaxed break-all ${notif.read ? 'text-gray-400' : 'text-gray-700'}`}>
                      {notif.message}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1 shrink-0 self-center">
                    {!notif.read && (
                      <button
                        type="button"
                        onClick={() => onMarkAsRead(notif.id)}
                        className="p-1 text-teal-600 hover:bg-emerald-50 hover:text-teal-800 rounded-lg transition-all cursor-pointer"
                        title="既読にする"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onRemove(notif.id)}
                      className="p-1 text-gray-350 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                      title="削除"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Controls */}
          {notifications.length > 0 && (
            <div className="bg-gray-100/80 px-4 py-2 border-t border-gray-150 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={onClearAll}
                className="text-gray-450 hover:text-rose-600 transition-colors cursor-pointer font-bold inline-flex items-center gap-1 text-[10px]"
              >
                <Trash className="h-3 w-3" /> 通知履歴を全クリア
              </button>
              <span className="text-[9px] font-semibold text-gray-400 select-none">リアルタイム同期中</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

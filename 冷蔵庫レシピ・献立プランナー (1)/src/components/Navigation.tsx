/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ChefHat, ClipboardList, Calendar, Inbox, Sparkles, AlertCircle, LogOut, LogIn, ShieldAlert, User as UserIcon } from 'lucide-react';
import { User, NotificationItem } from '../types';
import NotificationCenter from './NotificationCenter';

interface NavigationProps {
  activeTab: 'fridge' | 'recipes' | 'planner' | 'shopping';
  setActiveTab: (tab: 'fridge' | 'recipes' | 'planner' | 'shopping') => void;
  fridgeCount: number;
  expiringSoonCount: number;
  shoppingCount: number;
  currentUser: User | null;
  onLogout: () => void;
  onOpenLogin: () => void;
  onOpenAdmin: () => void;
  notifications: NotificationItem[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAllNotifications: () => void;
  onRemoveNotification: (id: string) => void;
  onSimulateNotification: (type: 'success' | 'warning' | 'info' | 'error', category: string) => void;
}

export default function Navigation({
  activeTab,
  setActiveTab,
  fridgeCount,
  expiringSoonCount,
  shoppingCount,
  currentUser,
  onLogout,
  onOpenLogin,
  onOpenAdmin,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAllNotifications,
  onRemoveNotification,
  onSimulateNotification,
}: NavigationProps) {
  return (
    <header className="bg-white border-b border-sage-100 shadow-xs sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-2 px-3 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center py-2.5 md:py-3.5 space-y-2 md:space-y-0">
          {/* Logo Brand */}
          <div className="flex items-center space-x-2 self-start md:self-auto">
            <div className="bg-sage-600 text-white p-1.5 md:p-2 rounded-xl shadow-2xs flex items-center justify-center shrink-0">
              <ChefHat className="h-5 w-5 md:h-5.5 md:h-5.5" id="logo-icon" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm md:text-base font-bold text-sage-800 flex items-center gap-1 font-sans leading-none" id="app-title">
                AI献立
                <span className="text-[8.5px] bg-sage-100 text-sage-700 font-bold px-1.5 py-0.5 rounded-full flex items-center shrink-0">
                  AIサポート
                </span>
              </h1>
              <p className="text-[9.5px] md:text-xs text-gray-400 font-medium mt-0.5 leading-none">食材を賢く使ってフードロス削減</p>
            </div>
          </div>

          {/* Quick Info Badges & User Profile Auth Area */}
          <div className="flex flex-wrap items-center gap-1.5 md:gap-2.5 text-[10.5px] md:text-xs w-full md:w-auto justify-between md:justify-end">
            {/* Real-time notifications bell center */}
            <div className="flex items-center gap-1.5">
              <NotificationCenter
                notifications={notifications}
                onMarkAsRead={onMarkAsRead}
                onMarkAllAsRead={onMarkAllAsRead}
                onClearAll={onClearAllNotifications}
                onRemove={onRemoveNotification}
                onSimulateNotification={onSimulateNotification}
              />

              <div className="bg-emerald-50 text-emerald-800 border border-emerald-100/40 px-2 py-1 rounded-lg flex items-center gap-1 font-bold">
                <Inbox className="h-3 w-3 text-emerald-600 shrink-0" />
                <span>冷蔵庫:<strong>{fridgeCount}</strong>品</span>
              </div>
              
              {expiringSoonCount > 0 && (
                <div className="bg-amber-50 text-amber-800 border border-amber-100/40 px-2 py-1 rounded-lg flex items-center gap-1 font-bold animate-pulse">
                  <AlertCircle className="h-3 w-3 text-amber-600 shrink-0" />
                  <span>期限切迫:<strong>{expiringSoonCount}</strong>品</span>
                </div>
              )}
            </div>

            {/* Auth Block */}
            <div className="flex items-center space-x-1.5 border-l border-sage-100 pl-2 shrink-0">
              {currentUser ? (
                <div className="flex items-center gap-1.5">
                  <div className="flex flex-col text-right">
                    <span className="font-bold text-slate-800 flex items-center gap-0.5 justify-end text-[10px] md:text-[11px] leading-tight">
                      {currentUser.name}
                      {currentUser.role === 'admin' ? (
                        <span className="bg-amber-50 text-amber-805 text-[8px] px-1 py-0.1 rounded-md font-bold border border-amber-100 shrink-0 scale-90 origin-right">
                          管理
                        </span>
                      ) : (
                        <span className="bg-indigo-50 text-indigo-700 text-[8px] px-1 py-0.1 rounded-md font-bold border border-indigo-100 shrink-0 scale-90 origin-right">
                          会員
                        </span>
                      )}
                    </span>
                  </div>

                  {currentUser.role === 'admin' && (
                    <button
                      onClick={onOpenAdmin}
                      className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-1.5 py-1 rounded-lg text-[8.5px] md:text-[9.5px] border border-slate-700 transition-colors shadow-2xs cursor-pointer flex items-center gap-0.5 shrink-0"
                    >
                      <span>管理者</span>
                    </button>
                  )}

                  <button
                    onClick={onLogout}
                    className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer shrink-0"
                    title="ログアウト"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={onOpenLogin}
                  className="bg-sage-50 hover:bg-sage-100 text-sage-800 font-bold px-2 py-1 rounded-lg border border-sage-100 text-[9.5px] md:text-[10.5px] flex items-center gap-0.5 transition-all cursor-pointer shadow-3xs shrink-0"
                >
                  <UserIcon className="h-3 w-3" />
                  <span>ログイン</span>
                </button>
              )}
            </div>
          </div>
        </div>


        {/* Navigation Tabs */}
        <nav className="flex space-x-0.5 py-0.5 border-t border-slate-50 md:border-t-0" aria-label="Tabs">
          <button
            id="tab-btn-fridge"
            onClick={() => setActiveTab('fridge')}
            className={`flex-1 sm:flex-none flex items-center justify-center space-x-1 py-2 px-1 text-[10px] sm:text-[11.5px] md:text-sm font-bold border-b-2 rounded-t-md transition-all duration-150 ${
              activeTab === 'fridge'
                ? 'border-sage-600 text-sage-700 bg-sage-50/40'
                : 'border-transparent text-gray-500 hover:text-sage-600 hover:bg-gray-50/40'
            }`}
          >
            <Inbox className="h-3.5 w-3.5 shrink-0" />
            <span>冷蔵庫管理</span>
          </button>

          <button
            id="tab-btn-recipes"
            onClick={() => setActiveTab('recipes')}
            className={`flex-1 sm:flex-none flex items-center justify-center space-x-1 py-2 px-1 text-[10px] sm:text-[11.5px] md:text-sm font-bold border-b-2 rounded-t-md transition-all duration-150 ${
              activeTab === 'recipes'
                ? 'border-sage-600 text-sage-700 bg-sage-50/40'
                : 'border-transparent text-gray-500 hover:text-sage-600 hover:bg-gray-50/40'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span>AIレシピ提案</span>
          </button>

          <button
            id="tab-btn-planner"
            onClick={() => setActiveTab('planner')}
            className={`flex-1 sm:flex-none flex items-center justify-center space-x-1 py-2 px-1 text-[10px] sm:text-[11.5px] md:text-sm font-bold border-b-2 rounded-t-md transition-all duration-150 ${
              activeTab === 'planner'
                ? 'border-sage-600 text-sage-700 bg-sage-50/40'
                : 'border-transparent text-gray-500 hover:text-sage-600 hover:bg-gray-50/40'
            }`}
          >
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>献立カレンダー</span>
          </button>

          <button
            id="tab-btn-shopping"
            onClick={() => setActiveTab('shopping')}
            className={`flex-1 sm:flex-none flex items-center justify-center space-x-1 py-2 px-1 text-[10px] sm:text-[11.5px] md:text-sm font-bold border-b-2 rounded-t-md transition-all duration-150 ${
              activeTab === 'shopping'
                ? 'border-sage-600 text-sage-700 bg-sage-50/40'
                : 'border-transparent text-gray-500 hover:text-sage-600 hover:bg-gray-50/40'
            }`}
          >
            <ClipboardList className="h-3.5 w-3.5 shrink-0" />
            <span>買い物リスト</span>
            {shoppingCount > 0 && (
              <span className="ml-0.5 bg-sage-600 text-white text-[9px] px-1 py-0.1 rounded-full font-bold leading-none shrink-0 scale-90">
                {shoppingCount}
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}

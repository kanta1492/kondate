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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center py-4 space-y-4 md:space-y-0">
          {/* Logo Brand */}
          <div className="flex items-center space-x-3 self-start md:self-auto">
            <div className="bg-sage-600 text-white p-2.5 rounded-2xl shadow-sm flex items-center justify-center">
              <ChefHat className="h-6 w-6" id="logo-icon" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-sage-800 flex items-center gap-1.5 font-sans" id="app-title">
                AI献立
                <span className="text-[10px] bg-sage-100 text-sage-700 font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                  AIサポート
                </span>
              </h1>
              <p className="text-xs text-gray-500 font-medium">冷蔵庫の食材を賢く使って、毎日の献立を心地よく</p>
            </div>
          </div>

          {/* Quick Info Badges & User Profile Auth Area */}
          <div className="flex flex-wrap items-center gap-3 text-xs w-full md:w-auto justify-end">
            {/* Real-time notifications bell center */}
            <NotificationCenter
              notifications={notifications}
              onMarkAsRead={onMarkAsRead}
              onMarkAllAsRead={onMarkAllAsRead}
              onClearAll={onClearAllNotifications}
              onRemove={onRemoveNotification}
              onSimulateNotification={onSimulateNotification}
            />

            <div className="bg-emerald-50 text-emerald-800 border border-emerald-100/50 px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-medium">
              <Inbox className="h-3.5 w-3.5 text-emerald-600" />
              <span>冷蔵庫: <strong>{fridgeCount}</strong>品</span>
            </div>
            
            {expiringSoonCount > 0 && (
              <div className="bg-amber-50 text-amber-800 border border-amber-100/50 px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-medium">
                <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                <span>賞味期限が近い食材: <strong>{expiringSoonCount}</strong>品</span>
              </div>
            )}

            {/* Auth Block */}
            <div className="flex items-center space-x-2 border-l border-sage-100 pl-3 ml-1">
              {currentUser ? (
                <div className="flex items-center gap-2">
                  <div className="flex flex-col text-right">
                    <span className="font-bold text-slate-800 flex items-center gap-1 justify-end">
                      {currentUser.name}様
                      {currentUser.role === 'admin' ? (
                        <span className="bg-amber-50 text-amber-800 text-[9px] px-1.5 py-0.2 rounded-full font-bold border border-amber-150 flex items-center gap-0.5">
                          <ShieldAlert className="h-2 w-2" />
                          管理者
                        </span>
                      ) : (
                        <span className="bg-sage-55 bg-indigo-50 text-indigo-700 text-[9px] px-1.5 py-0.2 rounded-full font-bold border border-indigo-100">
                          会員
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">{currentUser.email}</span>
                  </div>

                  {currentUser.role === 'admin' && (
                    <button
                      onClick={onOpenAdmin}
                      className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-2.5 py-1.5 rounded-xl text-[10px] border border-slate-650 transition-colors shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      <ShieldAlert className="h-3 w-3 text-amber-400" />
                      <span>管理者パネル</span>
                    </button>
                  )}

                  <button
                    onClick={onLogout}
                    className="p-1.5 text-gray-450 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="ログアウト"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={onOpenLogin}
                  className="bg-sage-50 hover:bg-sage-100 text-sage-800 font-bold px-3 py-1.5 rounded-xl border border-sage-100 flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                >
                  <UserIcon className="h-3.5 w-3.5" />
                  <span>ログイン / 新規登録</span>
                </button>
              )}
            </div>
          </div>
        </div>


        {/* Navigation Tabs */}
        <nav className="flex space-x-1 py-1" aria-label="Tabs">
          <button
            id="tab-btn-fridge"
            onClick={() => setActiveTab('fridge')}
            className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 py-3 px-4 font-medium text-sm border-b-2 rounded-t-lg transition-all duration-200 ${
              activeTab === 'fridge'
                ? 'border-sage-600 text-sage-700 bg-sage-50/50'
                : 'border-transparent text-gray-500 hover:text-sage-600 hover:bg-gray-50'
            }`}
          >
            <Inbox className="h-4 w-4" />
            <span>冷蔵庫の管理</span>
          </button>

          <button
            id="tab-btn-recipes"
            onClick={() => setActiveTab('recipes')}
            className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 py-3 px-4 font-medium text-sm border-b-2 rounded-t-lg transition-all duration-200 ${
              activeTab === 'recipes'
                ? 'border-sage-600 text-sage-700 bg-sage-50/50'
                : 'border-transparent text-gray-500 hover:text-sage-600 hover:bg-gray-50'
            }`}
          >
            <Sparkles className="h-4 w-4 text-apricot-500" />
            <span>AIレシピ提案</span>
          </button>

          <button
            id="tab-btn-planner"
            onClick={() => setActiveTab('planner')}
            className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 py-3 px-4 font-medium text-sm border-b-2 rounded-t-lg transition-all duration-200 ${
              activeTab === 'planner'
                ? 'border-sage-600 text-sage-700 bg-sage-50/50'
                : 'border-transparent text-gray-500 hover:text-sage-600 hover:bg-gray-50'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>献立カレンダー</span>
          </button>

          <button
            id="tab-btn-shopping"
            onClick={() => setActiveTab('shopping')}
            className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 py-3 px-4 font-medium text-sm border-b-2 rounded-t-lg transition-all duration-200 ${
              activeTab === 'shopping'
                ? 'border-sage-600 text-sage-700 bg-sage-50/50'
                : 'border-transparent text-gray-500 hover:text-sage-600 hover:bg-gray-50'
            }`}
          >
            <ClipboardList className="h-4 w-4" />
            <span>お買い物リスト</span>
            {shoppingCount > 0 && (
              <span className="ml-1 bg-apricot-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {shoppingCount}
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Database, 
  AlertCircle, 
  ShoppingBag, 
  Layers, 
  LineChart, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  UserCog, 
  Calendar, 
  Bell, 
  RotateCcw, 
  Sparkles,
  Save
} from 'lucide-react';
import { FridgeItem, User as UserType } from '../types';
import { getAllUsersFromDb, syncUserToDb, deleteUserFromDb } from '../lib/supabase.ts';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  presetItems: any[];
  onUpdatePresets: (newPresets: any[]) => void;
  onRestorePresetsDefault: () => void;
  fridgeItemsCount: number;
  userItemHistoryCount: number;
  onRefreshData?: () => void;
}

export default function AdminPanel({
  isOpen,
  onClose,
  fridgeItemsCount,
  userItemHistoryCount,
  onRefreshData,
}: AdminPanelProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Users State loaded from storage for reactive edits
  const [users, setUsers] = useState<UserType[]>([]);

  // Selected User's detailed structures
  const [inspectFridge, setInspectFridge] = useState<FridgeItem[]>([]);
  const [inspectShopping, setInspectShopping] = useState<any[]>([]);
  const [inspectPlanned, setInspectPlanned] = useState<any[]>([]);
  const [inspectNotifications, setInspectNotifications] = useState<any[]>([]);

  // Editing structures
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserRole, setEditUserRole] = useState<'member' | 'admin'>('member');

  const [editingFridgeId, setEditingFridgeId] = useState<string | null>(null);
  const [editFridgeName, setEditFridgeName] = useState('');
  const [editFridgeQty, setEditFridgeQty] = useState('');
  const [editFridgeExpiry, setEditFridgeExpiry] = useState('');

  const [editingShoppingId, setEditingShoppingId] = useState<string | null>(null);
  const [editShoppingName, setEditShoppingName] = useState('');
  const [editShoppingQty, setEditShoppingQty] = useState('');

  const [editingPlannedId, setEditingPlannedId] = useState<string | null>(null);
  const [editPlannedTitle, setEditPlannedTitle] = useState('');
  const [editPlannedDate, setEditPlannedDate] = useState('');
  const [editPlannedMealType, setEditPlannedMealType] = useState<any>('dinner');

  const [editingNotifId, setEditingNotifId] = useState<string | null>(null);
  const [editNotifTitle, setEditNotifTitle] = useState('');
  const [editNotifMsg, setEditNotifMsg] = useState('');

  // Initial load of users from the persistent database
  useEffect(() => {
    if (isOpen) {
      getAllUsersFromDb()
        .then((dbUsers) => {
          if (dbUsers && dbUsers.length > 0) {
            setUsers(dbUsers);
            localStorage.setItem('shufu_registered_users', JSON.stringify(dbUsers));
          } else {
            const saved = localStorage.getItem('shufu_registered_users');
            if (saved) {
              setUsers(JSON.parse(saved));
            } else {
              // Default initial set
              const defaults = [
                { id: 'user_default_test', name: 'デモユーザー(主婦)', email: 'demo@example.com', role: 'member' },
                { id: 'admin_default_test', name: 'システム管理者', email: 'admin@example.com', role: 'admin' },
              ];
              setUsers(defaults);
              localStorage.setItem('shufu_registered_users', JSON.stringify(defaults));
            }
          }
        })
        .catch((err) => {
          console.error("Failed to load registered users from persistent database:", err);
          const saved = localStorage.getItem('shufu_registered_users');
          if (saved) {
            setUsers(JSON.parse(saved));
          }
        });
    }
  }, [isOpen]);

  // Sync detailed inspect data on active selectedUserId transition
  useEffect(() => {
    if (!selectedUserId || !isOpen) {
      setInspectFridge([]);
      setInspectShopping([]);
      setInspectPlanned([]);
      setInspectNotifications([]);
      return;
    }

    const fridge = localStorage.getItem(`shufu_fridge_items_${selectedUserId}`);
    const shopping = localStorage.getItem(`shufu_shopping_items_${selectedUserId}`);
    const planned = localStorage.getItem(`shufu_planned_meals_${selectedUserId}`);
    const historical = localStorage.getItem(`shufu_notifications_${selectedUserId}`);

    let fLoaded: FridgeItem[] = [];
    let sLoaded: any[] = [];
    let pLoaded: any[] = [];
    let nLoaded: any[] = [];

    try { if (fridge) fLoaded = JSON.parse(fridge); } catch (e) {}
    try { if (shopping) sLoaded = JSON.parse(shopping); } catch (e) {}
    try { if (planned) pLoaded = JSON.parse(planned); } catch (e) {}
    try { if (historical) nLoaded = JSON.parse(historical); } catch (e) {}

    setInspectFridge(fLoaded);
    setInspectShopping(sLoaded);
    setInspectPlanned(pLoaded);
    setInspectNotifications(nLoaded);

    // Cancel any active cell inline edits to avoid state misalignment
    setEditingFridgeId(null);
    setEditingShoppingId(null);
    setEditingPlannedId(null);
    setEditingNotifId(null);
  }, [selectedUserId, isOpen]);

  if (!isOpen) return null;

  // Persist modified users array
  const saveUsersList = (updated: UserType[]) => {
    setUsers(updated);
    localStorage.setItem('shufu_registered_users', JSON.stringify(updated));
    onRefreshData?.();
  };

  // Delete User account completely
  const handleDeleteUser = (userId: string) => {
    // Note: window.confirm cannot be reliably triggered inside sandboxed preview iframes.
    // We execute user deletion directly for superior reliability.
    const updated = users.filter(u => u.id !== userId);
    saveUsersList(updated);

    // Delete user profile from cloud Firestore database
    deleteUserFromDb(userId).catch((err) => {
      console.error("Failed to delete user profile from Firestore:", err);
    });

    // Clean up linked storages
    localStorage.removeItem(`shufu_fridge_items_${userId}`);
    localStorage.removeItem(`shufu_shopping_items_${userId}`);
    localStorage.removeItem(`shufu_planned_meals_${userId}`);
    localStorage.removeItem(`shufu_notifications_${userId}`);
    localStorage.removeItem(`shufu_recipes_${userId}`);
    localStorage.removeItem(`shufu_user_item_history_${userId}`);

    if (selectedUserId === userId) {
      setSelectedUserId(null);
    }
  };

  // Setup user inline editing forms
  const handleStartEditUser = (user: UserType) => {
    setEditingUser(user);
    setEditUserName(user.name);
    setEditUserEmail(user.email);
    setEditUserRole(user.role as 'member' | 'admin');
  };

  const handleSaveUserEdit = () => {
    if (!editingUser) return;
    const updatedUser: UserType = {
      ...editingUser,
      name: editUserName,
      email: editUserEmail,
      role: editUserRole
    };
    
    const updated = users.map(u => u.id === editingUser.id ? updatedUser : u);
    saveUsersList(updated);

    // Synchronize user profile updates to Firestore cloud database
    syncUserToDb(updatedUser).catch((err) => {
      console.error("Failed to synchronize user edit to database:", err);
    });

    setEditingUser(null);
  };

  // Inspect Fridge Items Mutations
  const saveInspectFridge = (updated: FridgeItem[]) => {
    if (!selectedUserId) return;
    setInspectFridge(updated);
    localStorage.setItem(`shufu_fridge_items_${selectedUserId}`, JSON.stringify(updated));
    onRefreshData?.();
  };

  const handleDeleteFridgeItem = (id: string) => {
    // Note: window.confirm cannot be reliably triggered inside sandboxed preview iframes.
    // We execute deletion directly for superior reliability.
    const updated = inspectFridge.filter(item => item.id !== id);
    saveInspectFridge(updated);
  };

  const handleStartEditFridge = (item: FridgeItem) => {
    setEditingFridgeId(item.id);
    setEditFridgeName(item.name);
    setEditFridgeQty(item.quantity);
    setEditFridgeExpiry(item.expiryDate || '');
  };

  const handleSaveFridgeEdit = (id: string) => {
    const updated = inspectFridge.map(item => item.id === id ? {
      ...item,
      name: editFridgeName,
      quantity: editFridgeQty,
      expiryDate: editFridgeExpiry || undefined
    } : item);
    saveInspectFridge(updated);
    setEditingFridgeId(null);
  };

  // Inspect Shopping Items Mutations
  const saveInspectShopping = (updated: any[]) => {
    if (!selectedUserId) return;
    setInspectShopping(updated);
    localStorage.setItem(`shufu_shopping_items_${selectedUserId}`, JSON.stringify(updated));
    onRefreshData?.();
  };

  const handleDeleteShoppingItem = (id: string) => {
    // Note: window.confirm cannot be reliably triggered inside sandboxed preview iframes.
    // We execute deletion directly for superior reliability.
    const updated = inspectShopping.filter(item => item.id !== id);
    saveInspectShopping(updated);
  };

  const handleToggleShoppingChecked = (id: string, currentVal: boolean) => {
    const updated = inspectShopping.map(item => item.id === id ? { ...item, checked: !currentVal } : item);
    saveInspectShopping(updated);
  };

  const handleStartEditShopping = (item: any) => {
    setEditingShoppingId(item.id);
    setEditShoppingName(item.name);
    setEditShoppingQty(item.quantity);
  };

  const handleSaveShoppingEdit = (id: string) => {
    const updated = inspectShopping.map(item => item.id === id ? {
      ...item,
      name: editShoppingName,
      quantity: editShoppingQty,
    } : item);
    saveInspectShopping(updated);
    setEditingShoppingId(null);
  };

  // Inspect Planned Meals Mutations
  const saveInspectPlanned = (updated: any[]) => {
    if (!selectedUserId) return;
    setInspectPlanned(updated);
    localStorage.setItem(`shufu_planned_meals_${selectedUserId}`, JSON.stringify(updated));
    onRefreshData?.();
  };

  const handleDeletePlannedMeal = (id: string) => {
    // Note: window.confirm cannot be reliably triggered inside sandboxed preview iframes.
    // We execute deletion directly for superior reliability.
    const updated = inspectPlanned.filter(item => item.id !== id);
    saveInspectPlanned(updated);
  };

  const handleStartEditPlanned = (meal: any) => {
    setEditingPlannedId(meal.id);
    setEditPlannedTitle(meal.recipeTitle);
    setEditPlannedDate(meal.date);
    setEditPlannedMealType(meal.mealType);
  };

  const handleSavePlannedEdit = (id: string) => {
    const updated = inspectPlanned.map(meal => meal.id === id ? {
      ...meal,
      recipeTitle: editPlannedTitle,
      date: editPlannedDate,
      mealType: editPlannedMealType,
    } : meal);
    saveInspectPlanned(updated);
    setEditingPlannedId(null);
  };

  // Inspect Notifications Mutations
  const saveInspectNotifications = (updated: any[]) => {
    if (!selectedUserId) return;
    setInspectNotifications(updated);
    localStorage.setItem(`shufu_notifications_${selectedUserId}`, JSON.stringify(updated));
    onRefreshData?.();
  };

  const handleDeleteNotification = (id: string) => {
    // Note: window.confirm cannot be reliably triggered inside sandboxed preview iframes.
    // We execute deletion directly for superior reliability.
    const updated = inspectNotifications.filter(item => item.id !== id);
    saveInspectNotifications(updated);
  };

  const handleStartEditNotif = (notif: any) => {
    setEditingNotifId(notif.id);
    setEditNotifTitle(notif.title);
    setEditNotifMsg(notif.message);
  };

  const handleSaveNotifEdit = (id: string) => {
    const updated = inspectNotifications.map(notif => notif.id === id ? {
      ...notif,
      title: editNotifTitle,
      message: editNotifMsg,
    } : notif);
    saveInspectNotifications(updated);
    setEditingNotifId(null);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] shadow-xl overflow-hidden border border-sage-100/50 flex flex-col animate-scale-up">
        {/* Header */}
        <div className="bg-slate-800 px-6 py-5 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-slate-700 p-2 rounded-xl text-amber-400">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-1.5">
                管理者専用コントロールパネル
                <span className="text-[10px] bg-slate-700 text-amber-300 font-semibold px-2 py-0.5 rounded-full font-mono">
                  ROLE: ADMIN
                </span>
              </h3>
              <p className="text-[11px] text-slate-300">システム定番食材マスタ管理、全会員の監視・編集・データ削除</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-200 hover:text-white transition-colors cursor-pointer text-xs uppercase tracking-wider font-bold bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-xl border border-slate-600"
          >
            閉じる
          </button>
        </div>

        {/* Content Body Scrollable */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          
          {/* Quick Metrics Analytics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-sage-100 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">登録済み総会員数</span>
                <p className="text-xl font-bold font-mono text-slate-800 mt-0.5">{users.length} <span className="text-xs font-sans text-gray-500 font-medium">アカウント</span></p>
              </div>
              <span className="p-2.5 rounded-xl bg-orange-50 text-orange-600"><Layers className="h-4 w-4" /></span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-sage-100 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">冷蔵庫内の集約食材総量</span>
                <p className="text-xl font-bold font-mono text-slate-800 mt-0.5">{fridgeItemsCount} <span className="text-xs font-sans text-gray-500 font-medium">品</span></p>
              </div>
              <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600"><ShoppingBag className="h-4 w-4" /></span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-sage-100 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">ユーザー個々の登録履歴総数</span>
                <p className="text-xl font-bold font-mono text-slate-800 mt-0.5">{userItemHistoryCount} <span className="text-xs font-sans text-gray-500 font-medium">件</span></p>
              </div>
              <span className="p-2.5 rounded-xl bg-blue-50 text-blue-600"><LineChart className="h-4 w-4" /></span>
            </div>
          </div>

          {/* User Account Edit Modal Overlay inline */}
          {editingUser && (
            <div className="bg-slate-800 text-white p-5 rounded-2xl space-y-3.5 border border-slate-700 shadow-sm animate-fade-in">
              <div className="flex justify-between items-center pb-2 border-b border-slate-700">
                <h5 className="text-xs uppercase tracking-wider font-extrabold text-amber-400 flex items-center gap-1.5">
                  <UserCog className="h-3.5 w-3.5" /> メンバーアカウント編集
                </h5>
                <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[10px] text-slate-300 font-bold mb-1">お名前</label>
                  <input 
                    type="text" 
                    value={editUserName} 
                    onChange={e => setEditUserName(e.target.value)}
                    className="w-full bg-slate-700 text-white rounded-xl px-3 py-1.5 text-xs border border-slate-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-300 font-bold mb-1">メールアドレス</label>
                  <input 
                    type="email" 
                    value={editUserEmail} 
                    onChange={e => setEditUserEmail(e.target.value)}
                    className="w-full bg-slate-700 text-white rounded-xl px-3 py-1.5 text-xs border border-slate-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-300 font-bold mb-1">権限ロール</label>
                  <select 
                    value={editUserRole} 
                    onChange={e => setEditUserRole(e.target.value as 'member' | 'admin')}
                    className="w-full bg-slate-700 text-white rounded-xl px-2 py-1.5 text-xs border border-slate-600 focus:outline-hidden"
                  >
                    <option value="member">一般会員 (member)</option>
                    <option value="admin">システム管理者 (admin)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button 
                  onClick={() => setEditingUser(null)}
                  className="px-3 py-1.5 bg-slate-700 text-slate-300 text-xs rounded-xl hover:bg-slate-600 transition-colors"
                >
                  キャンセル
                </button>
                <button 
                  onClick={handleSaveUserEdit}
                  className="px-3.5 py-1.5 bg-amber-500 text-slate-900 text-xs font-bold rounded-xl hover:bg-amber-400 transition-colors flex items-center gap-1"
                >
                  <Check className="h-3.5 w-3.5" /> 変更を適用する
                </button>
              </div>
            </div>
          )}

          {/* Section: Registered Users Private Data Safe inspection section (管理者専用・データ監視閲覧センター) */}
          <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/50 space-y-4 shadow-2xs">
            <div>
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <span>🛡️</span> 会員アカウント管理 ＆ データ編集コントロール
              </h4>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                全ユーザーのアカウント情報の編集・削除、および冷蔵庫内の食材、買い物リスト、献立予定、セキュリティログの詳細な管理がリアルタイムで行えます。
              </p>
            </div>

            {/* Supabase Status Helper for Admins */}
            <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-200/50 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="font-bold text-slate-800">Supabase (PostgreSQL) 接続アシスタント</span>
                </div>
                <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">導入ガイド</span>
              </div>
              <p className="text-slate-600 mt-2 leading-relaxed">
                Supabaseとの連携によって、このアプリに登録した全ユーザーの情報が永続的にポストグレスに記憶保存されます。
              </p>
              
              <div className="mt-3 bg-slate-900 text-slate-100 p-3 rounded-xl overflow-x-auto font-mono text-[10px] leading-relaxed relative">
                <span className="absolute top-2 right-2 text-[8px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded uppercase font-bold select-none">SQL editor</span>
                <p className="text-amber-400 font-bold mb-1">-- Supabaseの「SQL Editor」に貼り付けて実行してください</p>
                {`create table if not exists public.shufu_users (
  id text primary key,
  name text not null,
  email text not null unique,
  role text not null default 'member',
  password text,
  face_photo text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.shufu_users enable row level security;

create policy "Allow public access" on public.shufu_users
  for all using (true) with check (true);`}
              </div>
              
              <p className="text-slate-500 mt-2 text-[10px] leading-relaxed">
                ※ 設定方法: <strong>.env.example</strong> に記載された <code>VITE_SUPABASE_URL</code> と <code>VITE_SUPABASE_ANON_KEY</code> を設定すると接続が自動的に有効になります。
              </p>
            </div>

            {/* User List Table with Operations */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-3">ユーザー名</th>
                    <th className="p-3 hidden sm:table-cell">メールアドレス</th>
                    <th className="p-3">権限</th>
                    <th className="p-3 text-right">アクション</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const isSelected = selectedUserId === user.id;
                    return (
                      <tr 
                        key={user.id} 
                        className={`border-b border-slate-100 hover:bg-slate-50/50 transition-colors ${
                          isSelected ? 'bg-amber-50/30' : ''
                        }`}
                      >
                        <td className="p-3 font-semibold text-slate-850">
                          <button 
                            type="button" 
                            onClick={() => setSelectedUserId(isSelected ? null : user.id)}
                            className="font-bold text-left hover:underline text-slate-800 flex items-center gap-2 cursor-pointer"
                          >
                            <span className={`w-2 h-2 rounded-full ${user.role === 'admin' ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`}></span>
                            <span>{user.name}</span>
                          </button>
                        </td>
                        <td className="p-3 text-gray-500 hidden sm:table-cell">{user.email}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-md font-mono font-bold text-[9px] ${
                            user.role === 'admin' 
                              ? 'bg-amber-50 text-amber-700 border border-amber-200/50' 
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                          }`}>
                            {user.role === 'admin' ? '管理者' : '一般会員'}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedUserId(user.id)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                              isSelected ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            データ閲覧
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStartEditUser(user)}
                            className="p-1 px-2 bg-blue-50 hover:bg-blue-100/80 text-blue-700 rounded-lg text-[10px] font-bold inline-flex items-center gap-1.0 border border-blue-200/50 cursor-pointer"
                            title="ユーザー情報を編集"
                          >
                            <Edit2 className="h-3 w-3" />
                            <span>編集</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-1 px-2 bg-rose-50 hover:bg-rose-100/80 text-rose-700 rounded-lg text-[10px] font-bold inline-flex items-center gap-1.0 border border-rose-200/50 cursor-pointer"
                            title="ユーザーアカウントを削除"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>削除</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Inspect user's personal isolated data section */}
            {selectedUserId && (() => {
              const u = users.find(user => user.id === selectedUserId);
              if (!u) return null;

              return (
                <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-4 animate-fade-in text-gray-750 mt-4 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-150 pb-3 gap-2">
                    <div>
                      <h5 className="text-xs font-bold text-slate-850 flex items-center gap-1.5">
                        💡 モニタリング ＆ データベース直接操作: <span className="text-slate-900 bg-amber-100/80 px-2.5 py-0.5 rounded-lg border border-amber-250/30">{u.name}様</span>
                      </h5>
                      <p className="text-[10px] text-gray-400 mt-1 font-mono">
                        ユーザーID: {u.id} | アドレス: {u.email}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100 flex items-center gap-1 shrink-0 w-fit">
                      ⚙️ 直接管理権限：管理者として読み書き可能
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    {/* 1. Fridge Items list and mutations */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col max-h-[350px]">
                      <h6 className="text-[11px] font-extrabold text-slate-800 mb-2 border-b pb-1.5 flex justify-between items-center shrink-0">
                        <span className="flex items-center gap-1.5">🥬 冷蔵庫の個別食材 ({inspectFridge.length}品)</span>
                      </h6>
                      <div className="overflow-y-auto flex-1 space-y-2 pr-1 text-[11px]">
                        {inspectFridge.length === 0 ? (
                          <p className="text-center py-8 text-gray-400">冷蔵庫は現在空っぽです。</p>
                        ) : (
                          inspectFridge.map((item) => (
                            <div key={item.id} className="p-2 bg-white rounded-xl border border-slate-150 shadow-3xs space-y-1.5">
                              {editingFridgeId === item.id ? (
                                <div className="space-y-2 p-1 bg-slate-50 rounded-lg">
                                  <input 
                                    type="text" 
                                    value={editFridgeName} 
                                    onChange={e => setEditFridgeName(e.target.value)}
                                    placeholder="食材名"
                                    className="w-full bg-white rounded border border-gray-350 px-2 py-1 text-[10px] focus:outline-hidden"
                                  />
                                  <div className="grid grid-cols-2 gap-1.5">
                                    <input 
                                      type="text" 
                                      value={editFridgeQty} 
                                      onChange={e => setEditFridgeQty(e.target.value)}
                                      placeholder="残量 (例: 1個)"
                                      className="w-full bg-white rounded border border-gray-350 px-2 py-1 text-[10px] focus:outline-hidden"
                                    />
                                    <input 
                                      type="text" 
                                      value={editFridgeExpiry} 
                                      onChange={e => setEditFridgeExpiry(e.target.value)}
                                      placeholder="消費期限 (YYYY-MM-DD)"
                                      className="w-full bg-white rounded border border-gray-350 px-2 py-1 text-[10px] focus:outline-hidden"
                                    />
                                  </div>
                                  <div className="flex justify-end gap-1.5 pt-1">
                                    <button 
                                      onClick={() => setEditingFridgeId(null)}
                                      className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-[9px] font-bold"
                                    >
                                      キャンセル
                                    </button>
                                    <button 
                                      onClick={() => handleSaveFridgeEdit(item.id)}
                                      className="px-2 py-1 bg-emerald-600 text-white rounded text-[9px] font-bold flex items-center gap-0.5"
                                    >
                                      <Save className="h-2.5 w-2.5" /> 保存
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex justify-between items-center gap-2">
                                  <div>
                                    <span className="font-bold text-slate-800">{item.name}</span>
                                    <div className="text-[9px] text-gray-400 mt-0.5 flex gap-1.5">
                                      <span>分量: {item.quantity}</span>
                                      {item.expiryDate && (
                                        <span className="text-rose-600 font-semibold bg-rose-50 px-1 rounded">
                                          期限: {item.expiryDate}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 shadow-3xs">
                                    <button 
                                      onClick={() => handleStartEditFridge(item)}
                                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                      title="編集"
                                    >
                                      <Edit2 className="h-3 w-3" />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteFridgeItem(item.id)}
                                      className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                                      title="削除"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* 2. Shopping Items list and mutations */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col max-h-[350px]">
                      <h6 className="text-[11px] font-extrabold text-slate-800 mb-2 border-b pb-1.5 flex justify-between items-center shrink-0">
                        <span className="flex items-center gap-1.5">🛒 買い物予定品目 ({inspectShopping.length}品)</span>
                      </h6>
                      <div className="overflow-y-auto flex-1 space-y-2 pr-1 text-[11px]">
                        {inspectShopping.length === 0 ? (
                          <p className="text-center py-8 text-gray-400">買い物リストに項目はありません。</p>
                        ) : (
                          inspectShopping.map((item) => (
                            <div key={item.id} className="p-2 bg-white rounded-xl border border-slate-150 shadow-3xs space-y-1.5">
                              {editingShoppingId === item.id ? (
                                <div className="space-y-2 p-1 bg-slate-50 rounded-lg">
                                  <input 
                                    type="text" 
                                    value={editShoppingName} 
                                    onChange={e => setEditShoppingName(e.target.value)}
                                    placeholder="品目名"
                                    className="w-full bg-white rounded border border-gray-350 px-2 py-1 text-[10px] focus:outline-hidden"
                                  />
                                  <input 
                                    type="text" 
                                    value={editShoppingQty} 
                                    onChange={e => setEditShoppingQty(e.target.value)}
                                    placeholder="数量 (例: 3個)"
                                    className="w-full bg-white rounded border border-gray-350 px-2 py-1 text-[10px] focus:outline-hidden"
                                  />
                                  <div className="flex justify-end gap-1.5 pt-1">
                                    <button 
                                      onClick={() => setEditingShoppingId(null)}
                                      className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-[9px] font-bold"
                                    >
                                      キャンセル
                                    </button>
                                    <button 
                                      onClick={() => handleSaveShoppingEdit(item.id)}
                                      className="px-2 py-1 bg-emerald-600 text-white rounded text-[9px] font-bold flex items-center gap-0.5"
                                    >
                                      <Save className="h-2.5 w-2.5" /> 保存
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex justify-between items-center gap-2">
                                  <div className="flex items-center gap-2">
                                    <input 
                                      type="checkbox" 
                                      checked={!!item.checked} 
                                      onChange={() => handleToggleShoppingChecked(item.id, !!item.checked)}
                                      className="h-3.5 w-3.5 text-sage-600 focus:ring-sage-500 border-gray-300 rounded cursor-pointer"
                                    />
                                    <div>
                                      <span className={`font-bold ${item.checked ? 'line-through text-gray-400' : 'text-slate-800'}`}>
                                        {item.name}
                                      </span>
                                      <span className="text-[9px] text-gray-400 block mt-0.5">数量: {item.quantity || '1'}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button 
                                      onClick={() => handleStartEditShopping(item)}
                                      className="p-1 text-blue-600 hover:bg-blue-50 rounded animate-fade-in"
                                      title="編集"
                                    >
                                      <Edit2 className="h-3 w-3" />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteShoppingItem(item.id)}
                                      className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                                      title="削除"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* 3. Planned Meals list and mutations */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col max-h-[350px]">
                      <h6 className="text-[11px] font-extrabold text-slate-800 mb-2 border-b pb-1.5 flex justify-between items-center shrink-0">
                        <span className="flex items-center gap-1.5">📅 献立カレンダー予定 ({inspectPlanned.length}件)</span>
                      </h6>
                      <div className="overflow-y-auto flex-1 space-y-2 pr-1 text-[11px]">
                        {inspectPlanned.length === 0 ? (
                          <p className="text-center py-8 text-gray-400">予定されている献立はありません。</p>
                        ) : (
                          inspectPlanned.map((meal) => (
                            <div key={meal.id} className="p-2 bg-white rounded-xl border border-slate-150 shadow-3xs space-y-1.5">
                              {editingPlannedId === meal.id ? (
                                <div className="space-y-2 p-1 bg-slate-50 rounded-lg">
                                  <input 
                                    type="text" 
                                    value={editPlannedTitle} 
                                    onChange={e => setEditPlannedTitle(e.target.value)}
                                    placeholder="レシピ料理名"
                                    className="w-full bg-white rounded border border-gray-350 px-2 py-1 text-[10px] focus:outline-hidden"
                                  />
                                  <div className="grid grid-cols-2 gap-1.5">
                                    <input 
                                      type="text" 
                                      value={editPlannedDate} 
                                      onChange={e => setEditPlannedDate(e.target.value)}
                                      placeholder="日付 YYYY-MM-DD"
                                      className="w-full bg-white rounded border border-gray-350 px-2 py-1 text-[10px] focus:outline-hidden"
                                    />
                                    <select 
                                      value={editPlannedMealType} 
                                      onChange={e => setEditPlannedMealType(e.target.value as any)}
                                      className="w-full bg-white rounded border border-gray-350 px-1 py-1 text-[10px] focus:outline-hidden"
                                    >
                                      <option value="breakfast">朝食</option>
                                      <option value="lunch">昼食</option>
                                      <option value="dinner">夕食</option>
                                    </select>
                                  </div>
                                  <div className="flex justify-end gap-1.5 pt-1">
                                    <button 
                                      onClick={() => setEditingPlannedId(null)}
                                      className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-[9px] font-bold"
                                    >
                                      キャンセル
                                    </button>
                                    <button 
                                      onClick={() => handleSavePlannedEdit(meal.id)}
                                      className="px-2 py-1 bg-emerald-600 text-white rounded text-[9px] font-bold flex items-center gap-0.5"
                                    >
                                      <Save className="h-2.5 w-2.5" /> 保存
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex justify-between items-start gap-2">
                                  <div className="space-y-1">
                                    <span className="font-bold text-slate-800 block text-[11px] leading-snug">{meal.recipeTitle}</span>
                                    <div className="flex flex-wrap gap-1.5 items-center">
                                      <span className="text-[9px] font-bold bg-slate-100 text-slate-700 px-1 py-0.5 rounded font-mono">{meal.date}</span>
                                      <span className="text-[9px] text-indigo-700 bg-indigo-50 px-1 py-0.5 rounded font-semibold">
                                        {meal.mealType === 'breakfast' ? '朝食' : meal.mealType === 'lunch' ? '昼食' : '夕食'}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button 
                                      onClick={() => handleStartEditPlanned(meal)}
                                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                      title="編集"
                                    >
                                      <Edit2 className="h-3 w-3" />
                                    </button>
                                    <button 
                                      onClick={() => handleDeletePlannedMeal(meal.id)}
                                      className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                                      title="削除"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* 4. Notification Items list and mutations */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col max-h-[350px]">
                      <h6 className="text-[11px] font-extrabold text-slate-800 mb-2 border-b pb-1.5 flex justify-between items-center shrink-0">
                        <span className="flex items-center gap-1.5">🔔 通知履歴 ＆ アラートログ ({inspectNotifications.length}件)</span>
                      </h6>
                      <div className="overflow-y-auto flex-1 space-y-2 pr-1 text-[11px]">
                        {inspectNotifications.length === 0 ? (
                          <p className="text-center py-8 text-gray-400">通知履歴はありません。</p>
                        ) : (
                          inspectNotifications.map((notif) => (
                            <div key={notif.id} className="p-2 bg-white rounded-xl border border-slate-150 shadow-3xs space-y-1.5">
                              {editingNotifId === notif.id ? (
                                <div className="space-y-2 p-1 bg-slate-50 rounded-lg">
                                  <input 
                                    type="text" 
                                    value={editNotifTitle} 
                                    onChange={e => setEditNotifTitle(e.target.value)}
                                    placeholder="通知の件名"
                                    className="w-full bg-white rounded border border-gray-350 px-2 py-1 text-[10px] focus:outline-hidden"
                                  />
                                  <textarea 
                                    value={editNotifMsg} 
                                    onChange={e => setEditNotifMsg(e.target.value)}
                                    placeholder="本文通知メッセージ"
                                    rows={2}
                                    className="w-full bg-white rounded border border-gray-350 px-2 py-1 text-[10px] focus:outline-hidden resize-none"
                                  />
                                  <div className="flex justify-end gap-1.5 pt-1">
                                    <button 
                                      onClick={() => setEditingNotifId(null)}
                                      className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-[9px] font-bold"
                                    >
                                      キャンセル
                                    </button>
                                    <button 
                                      onClick={() => handleSaveNotifEdit(notif.id)}
                                      className="px-2 py-1 bg-emerald-600 text-white rounded text-[9px] font-bold flex items-center gap-0.5"
                                    >
                                      <Save className="h-2.5 w-2.5" /> 保存
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex justify-between items-start gap-2">
                                  <div className="space-y-1">
                                    <div className="flex justify-between items-center gap-2">
                                      <span className="font-bold text-slate-800 leading-normal">{notif.title}</span>
                                      <span className="font-mono text-[9px] text-gray-400 shrink-0">{notif.timestamp}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-600 leading-relaxed font-semibold">{notif.message}</p>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button 
                                      onClick={() => handleStartEditNotif(notif)}
                                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                      title="編集"
                                    >
                                      <Edit2 className="h-3 w-3" />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteNotification(notif.id)}
                                      className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                                      title="削除"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Database, Plus, Trash2, RotateCcw, AlertCircle, ShoppingBag, Layers, LineChart, Check } from 'lucide-react';
import { RecommendQuickItem, FridgeItem, User as UserType } from '../types';
import { CATEGORIES } from '../data';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  presetItems: RecommendQuickItem[];
  onUpdatePresets: (newPresets: RecommendQuickItem[]) => void;
  onRestorePresetsDefault: () => void;
  fridgeItemsCount: number;
  userItemHistoryCount: number;
}

export default function AdminPanel({
  isOpen,
  onClose,
  presetItems,
  onUpdatePresets,
  onRestorePresetsDefault,
  fridgeItemsCount,
  userItemHistoryCount,
}: AdminPanelProps) {
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<FridgeItem['category']>('vegetable');
  const [newItemQty, setNewItemQty] = useState('1個');
  const [newItemShelfLife, setNewItemShelfLife] = useState(7);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Get total users from storage for analytical statistics
  const getRegisteredUsersCount = (): number => {
    try {
      const saved = localStorage.getItem('shufu_registered_users');
      if (saved) {
        return JSON.parse(saved).length;
      }
    } catch (e) {
      console.error(e);
    }
    return 2; // Default admin and user counts
  };

  const showSuccessMessage = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleCreatePreset = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = newItemName.trim();
    if (!trimmedName) {
      setError('食材の名前を入力してください。');
      return;
    }

    const itemExists = presetItems.some(item => item.name.toLowerCase() === trimmedName.toLowerCase());
    if (itemExists) {
      setError('その食材は既に定番リストに存在します。');
      return;
    }

    const newItem: RecommendQuickItem = {
      name: trimmedName,
      category: newItemCategory,
      quantity: newItemQty.trim() || '1個',
      shelfLife: Math.max(1, newItemShelfLife),
    };

    onUpdatePresets([...presetItems, newItem]);
    setNewItemName('');
    setNewItemQty('1個');
    setNewItemShelfLife(7);
    showSuccessMessage(`「${trimmedName}」を定番食材マスタに追加しました！`);
  };

  const handleDeletePreset = (nameToDelete: string) => {
    const updated = presetItems.filter(item => item.name !== nameToDelete);
    onUpdatePresets(updated);
    showSuccessMessage(`「${nameToDelete}」を定番食材マスタから削除しました。`);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] shadow-xl overflow-hidden border border-sage-100/50 flex flex-col animate-scale-up">
        {/* Header */}
        <div className="bg-slate-800 px-6 py-5 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-slate-700 p-2 rounded-xl text-amber-400">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-1.5">
                管理者専用コントロールパネル
                <span className="text-[10px] bg-slate-700 text-amber-300 font-semibold px-2 py-0.5 rounded-full">
                  権限：Admin
                </span>
              </h3>
              <p className="text-[11px] text-slate-300">システム定番食材マスタ管理と統計状況の確認</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-405 hover:text-white transition-colors cursor-pointer text-xs uppercase tracking-wider font-bold bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-650"
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
                <p className="text-xl font-bold font-mono text-slate-800 mt-0.5">{getRegisteredUsersCount()} <span className="text-xs font-sans text-gray-500 font-medium">アカウント</span></p>
              </div>
              <span className="p-2.5 rounded-xl bg-orange-50 text-orange-600"><Layers className="h-4 w-4" /></span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-sage-100 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">冷蔵庫内の集約食材総量</span>
                <p className="text-xl font-bold font-mono text-slate-800 mt-0.5">{fridgeItemsCount} <span className="text-xs font-sans text-gray-500 font-medium font-semibold">品</span></p>
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

          {/* Feedback Area */}
          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-800 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 font-medium">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 font-medium animate-fade-in">
              <Check className="h-4 w-4 text-emerald-650 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Two Columns for Custom Admin Operations */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Add New Preset Form */}
            <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-sage-100 shadow-xs h-fit">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <span>➕</span> 定番食材の新規追加
              </h4>

              <form onSubmit={handleCreatePreset} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">食材・調味料名</label>
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="例：キャベツ、豚バラ薄切り肉"
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-gray-50/50 focus:outline-hidden font-medium text-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">カテゴリー分類</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value as FridgeItem['category'])}
                    className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-gray-50/50 focus:outline-hidden font-medium text-gray-700"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1">デフォルト分量</label>
                    <input
                      type="text"
                      value={newItemQty}
                      onChange={(e) => setNewItemQty(e.target.value)}
                      placeholder="例：1/4個、200g"
                      className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-gray-50/50 focus:outline-hidden font-medium text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1">賞味期限目安 (日)</label>
                    <input
                      type="number"
                      value={newItemShelfLife}
                      onChange={(e) => setNewItemShelfLife(parseInt(e.target.value) || 0)}
                      placeholder="例：10"
                      className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-gray-50/50 focus:outline-hidden font-medium text-gray-700"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-slate-800 hover:bg-slate-905 text-white py-2 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer mt-2"
                >
                  定番リストに追加
                </button>
              </form>
            </div>

            {/* Right: Listed Presets Management */}
            <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-sage-100 shadow-xs flex flex-col max-h-[50vh] min-h-[40vh]">
              <div className="flex items-center justify-between mb-3 shrink-0">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  📁 現在流通している定番食材 ({presetItems.length}件)
                </h4>
                <button
                  onClick={onRestorePresetsDefault}
                  className="text-[10px] text-orange-700 hover:text-orange-900 font-bold bg-orange-50 border border-orange-100 px-2 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                  title="初期状態にリセット"
                >
                  <RotateCcw className="h-3 w-3" />
                  初期化
                </button>
              </div>

              {presetItems.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-xs border border-dashed border-gray-150 rounded-2xl bg-gray-50/50 flex-1 flex flex-col justify-center items-center">
                  定番食材が登録されていません。
                </div>
              ) : (
                <div className="overflow-y-auto pr-1 flex-1 space-y-1.5">
                  {presetItems.map((item) => {
                    const categoryObj = CATEGORIES.find(c => c.id === item.category);
                    return (
                      <div
                        key={item.name}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 text-xs text-gray-700 hover:bg-slate-50/70 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] bg-slate-100 text-slate-655 font-bold px-2 py-0.5 rounded-md min-w-[50px] text-center shrink-0">
                            {categoryObj?.label || '他'}
                          </span>
                          <span className="font-semibold text-slate-800">{item.name}</span>
                          <span className="text-gray-400">({item.quantity} / {item.shelfLife}日)</span>
                        </div>
                        
                        <button
                          onClick={() => handleDeletePreset(item.name)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                          title="定番マスタから削除"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Section: Registered Users Private Data Safe inspection section (管理者専用・データ監視閲覧センター) */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/50 space-y-4 shadow-2xs mt-6">
            <div>
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <span>🛡️</span> 登録ユーザーのアカウント監視・閲覧（管理者専用・閲覧保障）
              </h4>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                登録ユーザーのプライバシーに配慮しつつ、活動状況やデータを一切変更せずにリアルタイムで安全に閲覧できます（編集・削除はセキュリティ制限により不可能になっています）。
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {(() => {
                const getRegisteredUsers = (): UserType[] => {
                  try {
                    const saved = localStorage.getItem('shufu_registered_users');
                    if (saved) {
                      return JSON.parse(saved);
                    }
                  } catch (e) {
                    console.error(e);
                  }
                  return [
                    { id: 'user_default_test', name: 'デモユーザー(主婦)', email: 'demo@example.com', role: 'member' },
                    { id: 'admin_default_test', name: 'システム管理者', email: 'admin@example.com', role: 'admin' },
                  ];
                };

                return getRegisteredUsers().map((user) => {
                  const isSelected = selectedUserId === user.id;
                  return (
                    <button
                      type="button"
                      key={user.id}
                      onClick={() => setSelectedUserId(isSelected ? null : user.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-slate-800 text-white border-slate-900 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.55">
                        <span className={`w-2 h-2 rounded-full ${user.role === 'admin' ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`}></span>
                        <span>{user.name}</span>
                        <span className="text-[9px] opacity-75 font-mono font-medium">({user.role === 'admin' ? '管理者' : '一般'})</span>
                      </div>
                    </button>
                  );
                });
              })()}
            </div>

            {selectedUserId && (() => {
              const getRegisteredUsers = (): UserType[] => {
                try {
                  const saved = localStorage.getItem('shufu_registered_users');
                  if (saved) {
                    return JSON.parse(saved);
                  }
                } catch (e) {
                  console.error(e);
                }
                return [
                  { id: 'user_default_test', name: 'デモユーザー(主婦)', email: 'demo@example.com', role: 'member' },
                  { id: 'admin_default_test', name: 'システム管理者', email: 'admin@example.com', role: 'admin' },
                ];
              };

              const u = getRegisteredUsers().find(user => user.id === selectedUserId);
              if (!u) return null;

              const getInspectUserData = (userId: string) => {
                const fridge = localStorage.getItem(`shufu_fridge_items_${userId}`);
                const shopping = localStorage.getItem(`shufu_shopping_items_${userId}`);
                const planned = localStorage.getItem(`shufu_planned_meals_${userId}`);
                const historical = localStorage.getItem(`shufu_notifications_${userId}`);
                
                let fridgeItemsLoaded: FridgeItem[] = [];
                let shoppingItemsLoaded: any[] = [];
                let plannedMealsLoaded: any[] = [];
                let notificationsLoaded: any[] = [];

                try { if (fridge) fridgeItemsLoaded = JSON.parse(fridge); } catch (e) {}
                try { if (shopping) shoppingItemsLoaded = JSON.parse(shopping); } catch (e) {}
                try { if (planned) plannedMealsLoaded = JSON.parse(planned); } catch (e) {}
                try { if (historical) notificationsLoaded = JSON.parse(historical); } catch (e) {}

                return {
                  fridge: fridgeItemsLoaded,
                  shopping: shoppingItemsLoaded,
                  planned: plannedMealsLoaded,
                  notifications: notificationsLoaded,
                };
              };

              const data = getInspectUserData(selectedUserId);
              return (
                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-4 animate-fade-in text-gray-700 mt-3 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-3 gap-2">
                    <div>
                      <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        👀 個人データ安全監視中: <span className="text-slate-900 bg-amber-100 px-2 py-0.5 rounded-lg">{u.name}様</span>
                      </h5>
                      <p className="text-[10px] text-gray-400 mt-1 font-mono font-medium">ユーザーID: {u.id} | アドレス: {u.email}</p>
                    </div>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100 flex items-center gap-1 shrink-0 w-fit">
                      🔒 安全：管理者閲覧のみ可能（改ざん不可）
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Fridge items inspect */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex flex-col max-h-[220px]">
                      <h6 className="text-[11px] font-bold text-slate-800 mb-2 border-b pb-1.5 flex justify-between shrink-0">
                        <span>🥬 冷蔵庫内の食材一覧 ({data.fridge.length}品)</span>
                      </h6>
                      <div className="overflow-y-auto flex-1 space-y-1.5 pr-1 text-[11px]">
                        {data.fridge.length === 0 ? (
                          <p className="text-center py-6 text-gray-400">冷蔵庫が空です。</p>
                        ) : (
                          data.fridge.map((item) => (
                            <div key={item.id} className="flex justify-between items-center p-2 bg-white rounded-lg border border-slate-100 shadow-3xs">
                              <span className="font-semibold text-slate-800">{item.name}</span>
                              <div className="flex items-center gap-1.5 text-gray-500">
                                <span>{item.quantity}</span>
                                {item.expiryDate && (
                                  <span className="text-[9px] bg-rose-50 text-rose-700 px-1 py-0.5 rounded-md border border-rose-100 font-medium">
                                    期限: {item.expiryDate}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Shopping list inspect */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex flex-col max-h-[220px]">
                      <h6 className="text-[11px] font-bold text-slate-800 mb-2 border-b pb-1.5 flex justify-between shrink-0">
                        <span>🛒 買い物リスト一覧 ({data.shopping.length}品)</span>
                      </h6>
                      <div className="overflow-y-auto flex-1 space-y-1.5 pr-1 text-[11px]">
                        {data.shopping.length === 0 ? (
                          <p className="text-center py-6 text-gray-400">買い物予定はありません。</p>
                        ) : (
                          data.shopping.map((item: any) => (
                            <div key={item.id} className="flex justify-between items-center p-2 bg-white rounded-lg border border-slate-100 shadow-3xs">
                              <span className={`font-semibold ${item.checked ? 'line-through text-gray-400' : 'text-slate-800'}`}>
                                {item.name}
                              </span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-gray-500">{item.quantity}</span>
                                <span className={`text-[9px] px-1 py-0.5 rounded-md font-medium border ${
                                  item.checked 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                    : 'bg-orange-50 text-orange-700 border-orange-100'
                                }`}>
                                  {item.checked ? '購入済' : '未購入'}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Planned Meals inspect */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex flex-col max-h-[220px]">
                      <h6 className="text-[11px] font-bold text-slate-800 mb-2 border-b pb-1.5 flex justify-between shrink-0">
                        <span>📅 献立カレンダーのスケジュール予定 ({data.planned.length}件)</span>
                      </h6>
                      <div className="overflow-y-auto flex-1 space-y-1.5 pr-1 text-[11px]">
                        {data.planned.length === 0 ? (
                          <p className="text-center py-6 text-gray-400">予定されている献立はありません。</p>
                        ) : (
                          data.planned.map((meal: any) => (
                            <div key={meal.id} className="p-2 bg-white rounded-lg border border-slate-100 shadow-3xs space-y-1">
                              <div className="flex justify-between items-start gap-1">
                                <span className="font-semibold text-slate-800 leading-normal">{meal.recipeTitle}</span>
                                <span className="font-mono font-bold text-[9px] text-gray-450 bg-gray-100 px-1 py-0.5 rounded-sm shrink-0">{meal.date}</span>
                              </div>
                              <div className="flex justify-between text-[9px] text-gray-400">
                                <span>時間帯: {meal.mealType === 'breakfast' ? '朝食' : meal.mealType === 'lunch' ? '昼食' : '夕食'}</span>
                                {meal.servings && <span>{meal.servings}人前</span>}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Notifications inspect */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex flex-col max-h-[220px]">
                      <h6 className="text-[11px] font-bold text-slate-800 mb-2 border-b pb-1.5 flex justify-between shrink-0">
                        <span>🔔 セキュリティ＆通知ログ履歴 ({data.notifications.length}件)</span>
                      </h6>
                      <div className="overflow-y-auto flex-1 space-y-1.5 pr-1 text-[11px]">
                        {data.notifications.length === 0 ? (
                          <p className="text-center py-6 text-gray-400">通知履歴はありません。</p>
                        ) : (
                          data.notifications.map((notif: any) => (
                            <div key={notif.id} className="p-2 bg-white rounded-lg border border-slate-100 shadow-3xs space-y-1">
                              <div className="flex justify-between gap-1 items-start">
                                <span className="font-bold text-slate-800 leading-normal">{notif.title}</span>
                                <span className="font-mono text-[9px] text-gray-405 shrink-0">{notif.timestamp}</span>
                              </div>
                              <p className="text-[10px] text-gray-500 leading-relaxed font-medium">{notif.message}</p>
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

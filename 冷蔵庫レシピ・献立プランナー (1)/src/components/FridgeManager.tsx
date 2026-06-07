/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FridgeItem, RecommendQuickItem } from '../types';
import { CATEGORIES, CATEGORY_LABELS } from '../data';
import { Plus, Trash2, Calendar, Sparkles, Filter, Check, ListChecks } from 'lucide-react';

interface FridgeManagerProps {
  items: FridgeItem[];
  onAddItem: (item: Omit<FridgeItem, 'id' | 'addedDate'>) => void;
  onRemoveItem: (id: string) => void;
  onUpdateQuantity: (id: string, qty: string) => void;
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  onNavigateToRecipes: () => void;
  userItemHistory?: { name: string; category: FridgeItem['category']; quantity: string }[];
  onClearFridge?: () => void;
  onRemoveHistoryItem?: (name: string) => void;
  presetItems?: RecommendQuickItem[];
}

export default function FridgeManager({
  items,
  onAddItem,
  onRemoveItem,
  onUpdateQuantity,
  selectedIds,
  setSelectedIds,
  onNavigateToRecipes,
  userItemHistory = [],
  onClearFridge,
  onRemoveHistoryItem,
  presetItems = [],
}: FridgeManagerProps) {
  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<FridgeItem['category']>('vegetable');
  const [quantity, setQuantity] = useState('1個');
  const [shelfLifeDays, setShelfLifeDays] = useState('7'); // Default 7 days of shelf life
  const [customExpiry, setCustomExpiry] = useState(''); // Optional specific date

  // Category filter state
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  // Input Quantity Presets
  const quantityPresets = ['1個', '1パック', '1袋', '1/2個', '200g', '300g', '1丁', '1本', '少々'];

  // Handle Form onSubmit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let computedExpiry: string | undefined = undefined;
    if (customExpiry) {
      computedExpiry = customExpiry;
    } else if (shelfLifeDays !== 'none') {
      const days = parseInt(shelfLifeDays, 10);
      const date = new Date();
      date.setDate(date.getDate() + days);
      computedExpiry = date.toISOString().split('T')[0];
    }

    onAddItem({
      name: name.trim(),
      category,
      quantity: quantity || '1個',
      expiryDate: computedExpiry,
    });

    // Reset Form
    setName('');
    setQuantity('1個');
    setCustomExpiry('');
  };

  // Quick Preset Add
  const handleAddQuickItem = (quick: RecommendQuickItem) => {
    const date = new Date();
    date.setDate(date.getDate() + quick.shelfLife);
    const expiryStr = date.toISOString().split('T')[0];

    onAddItem({
      name: quick.name,
      category: quick.category as FridgeItem['category'],
      quantity: quick.quantity,
      expiryDate: expiryStr,
    });
  };

  // Expiry styling/warning helper
  const getExpiryLabel = (expiryDate?: string) => {
    if (!expiryDate) return { text: '期限なし', style: 'text-gray-400 bg-gray-50' };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);

    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `期限切れ (賞味期限: ${expiryDate})`, style: 'text-rose-700 bg-rose-50 border border-rose-100 font-bold' };
    } else if (diffDays === 0) {
      return { text: '今日まで！', style: 'text-amber-700 bg-amber-50 border border-amber-200 font-bold animate-pulse' };
    } else if (diffDays <= 3) {
      return { text: `あと ${diffDays}日 (賞味期限: ${expiryDate})`, style: 'text-amber-700 bg-amber-50 border border-amber-100' };
    } else {
      return { text: `あと ${diffDays}日 (賞味期限: ${expiryDate})`, style: 'text-sage-700 bg-sage-50' };
    }
  };

  // Toggle selection for recipe suggestor
  const handleToggleSelectItem = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredItems.length) {
      // Unselect all currently filtered
      const filteredIds = filteredItems.map(item => item.id);
      setSelectedIds(selectedIds.filter(id => !filteredIds.includes(id)));
    } else {
      // Select all currently filtered
      const filteredIds = filteredItems.map(item => item.id);
      const newSelected = Array.from(new Set([...selectedIds, ...filteredIds]));
      setSelectedIds(newSelected);
    }
  };

  // Filter items
  const filteredItems = items.filter(item => {
    if (selectedFilter === 'all') return true;
    return item.category === selectedFilter;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="fridge-view-container">
      
      {/* Left side: Food Item Registration Form */}
      <div className="lg:col-span-1 space-y-6">
        <div id="item-form-card" className="bg-white rounded-3xl p-6 shadow-xs border border-sage-100 kitchen-shines">
          <h2 className="text-lg font-bold text-sage-800 border-b border-sage-100 pb-3 mb-4 flex items-center gap-2">
            <span className="p-1 rounded-lg bg-sage-100 text-sage-600"><Plus className="h-4 w-4" /></span>
            食材を冷蔵庫にいれる
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="input-name" className="block text-xs font-bold text-gray-600 mb-1.5">食材名</label>
              <input
                id="input-name"
                type="text"
                placeholder="例：キャベツ、豚肉、余ったカレー"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:border-sage-600 focus:ring-2 focus:ring-sage-50/50 bg-gray-50/50 transition-all font-medium"
                required
              />
            </div>

            {/* Category selection */}
            <div>
              <label htmlFor="select-category" className="block text-xs font-bold text-gray-600 mb-1.5">カテゴリー</label>
              <select
                id="select-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as FridgeItem['category'])}
                className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:border-sage-600 bg-gray-50/50 transition-all font-medium"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label htmlFor="input-quantity" className="block text-xs font-bold text-gray-600 mb-1">分量・残量</label>
              <input
                id="input-quantity"
                type="text"
                placeholder="例：1/2個、250g、大盛1鉢"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:border-sage-600 focus:ring-2 focus:ring-sage-50/50 bg-gray-50/50 transition-all font-medium mb-2"
                required
              />
              {/* Presets */}
              <div className="flex flex-wrap gap-1">
                {quantityPresets.map(preset => (
                  <button
                    key={preset}
                    id={`qty-preset-${preset}`}
                    type="button"
                    onClick={() => setQuantity(preset)}
                    className={`text-[10px] px-2 py-1 rounded-md border font-medium transition-all ${
                      quantity === preset
                        ? 'bg-sage-600 text-white border-sage-600 shadow-xs'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-sage-200'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Shelf Life / Expiry Date */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">賞味期限（目安）</label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <select
                  value={shelfLifeDays}
                  onChange={(e) => {
                    setShelfLifeDays(e.target.value);
                    if (e.target.value !== 'custom') setCustomExpiry('');
                  }}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:outline-hidden focus:border-sage-600 font-medium col-span-2"
                >
                  <option value="3">今日から3日間 (お肉・魚目安)</option>
                  <option value="7">今日から1週間 (野菜・乳製品目安)</option>
                  <option value="14">今日から2週間</option>
                  <option value="30">今日から1ヶ月</option>
                  <option value="custom">日付を直接指定する</option>
                  <option value="none">期限なし（調味料など）</option>
                </select>
              </div>

              {shelfLifeDays === 'custom' && (
                <div className="flex items-center space-x-2 animate-fade-in relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    value={customExpiry}
                    onChange={(e) => setCustomExpiry(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:border-sage-600 bg-gray-50/50 font-medium"
                    required
                  />
                </div>
              )}
            </div>

            <button
              id="btn-add-food"
              type="submit"
              className="w-full bg-sage-600 hover:bg-sage-700 active:transform active:scale-[0.99] transition-all text-white py-2.5 rounded-xl font-bold text-sm shadow-sm flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>冷蔵庫に入れる</span>
            </button>
          </form>
        </div>

        {/* Quick presets adds panel */}
        <div id="quick-preset-panel" className="bg-white rounded-3xl p-5 shadow-xs border border-sage-100">
          <h3 className="text-xs font-bold text-sage-700 uppercase tracking-wider mb-2.5">
            定番食材
          </h3>
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
            {presetItems.map((quick) => (
              <button
                key={quick.name}
                id={`quick-add-${quick.name}`}
                onClick={() => handleAddQuickItem(quick)}
                className="text-xs bg-sage-50/60 hover:bg-sage-100/80 border border-sage-100 text-sage-800 px-3 py-2 rounded-xl flex items-center space-x-1 transition-all group font-medium"
              >
                <Plus className="h-3 w-3 text-sage-600 group-hover:scale-125 transition-transform" />
                <span>{quick.name}</span>
                <span className="text-gray-400 text-[10px]">({quick.quantity})</span>
              </button>
            ))}
          </div>
        </div>

        {/* User Food Registration History Memory Panel */}
        <div id="user-memory-panel" className="bg-white rounded-3xl p-5 shadow-xs border border-sage-100">
          <h3 className="text-xs font-bold text-sage-700 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>これまでに登録した食材</span>
            <span className="text-[10px] bg-sage-50 text-sage-600 px-2.5 py-0.5 rounded-full font-bold border border-sage-100">
              {userItemHistory.length}品
            </span>
          </h3>
          <p className="text-[11px] text-gray-400 mb-3.5 font-medium">これまでに登録した食材の一覧です。クリックすると簡単に冷蔵庫へ戻せます。</p>
          
          {userItemHistory.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-xs border border-dashed border-gray-150 rounded-2xl bg-gray-50/50">
              登録履歴はありません。<br/>上の入力フォームから食材を登録するとここに履歴が保存されます。
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto pr-1">
              {userItemHistory.map((hist) => {
                const icon = CATEGORIES.find(c => c.id === hist.category)?.color.split('icon-')[1] || '📦';
                return (
                  <div
                    key={hist.name}
                    id={`user-history-${hist.name}`}
                    className="flex items-center justify-between bg-slate-50 hover:bg-sage-50/70 border border-slate-100/80 rounded-rl px-2.5 py-1.5 transition-all group rounded-xl"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        const date = new Date();
                        date.setDate(date.getDate() + 7); // デフォルト1週間
                        onAddItem({
                          name: hist.name,
                          category: hist.category,
                          quantity: hist.quantity,
                          expiryDate: date.toISOString().split('T')[0]
                        });
                      }}
                      className="flex items-center space-x-2 flex-1 text-left cursor-pointer"
                    >
                      <span className="text-sm select-none">{icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-gray-700 truncate">{hist.name}</div>
                        <div className="text-[9px] text-gray-400">{CATEGORY_LABELS[hist.category]} • {hist.quantity}</div>
                      </div>
                      <Plus className="h-3 w-3 text-sage-600 opacity-70 group-hover:opacity-100 group-hover:scale-125 transition-all shrink-0" />
                    </button>
                    {onRemoveHistoryItem && (
                      <button
                        type="button"
                        onClick={() => onRemoveHistoryItem(hist.name)}
                        className="text-gray-300 hover:text-rose-505 p-1 rounded-md transition-colors hover:bg-rose-50 text-gray-400 hover:text-rose-600"
                        title="この履歴を消去"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right side: Current Refrigerator Inventory (2-column layout) */}
      <div className="lg:col-span-2 space-y-6 flex flex-col">
        <div id="fridge-list-card" className="bg-white rounded-3xl p-6 shadow-xs border border-sage-100 flex-1 flex flex-col">
          
          {/* Header row & Selection tools */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sage-100 pb-4 mb-4">
            <div>
              <h2 className="text-lg font-bold text-sage-800 flex items-center gap-2">
                <span className="p-1 rounded-lg bg-sage-100 text-sage-600"><ListChecks className="h-4 w-4" /></span>
                冷蔵庫の食材一覧 ({items.length})
              </h2>
              <p className="text-xs text-gray-500 mt-1 font-medium">使いたい食材を選択して、下の「AIレシピ提案に進む」をタップしてください。</p>
            </div>
            
            <div className="flex items-center gap-2 self-start sm:self-center">
              {/* Select All Toggler */}
              {filteredItems.length > 0 && (
                <button
                  id="btn-select-all"
                  onClick={handleSelectAll}
                  className="text-xs font-bold text-sage-600 hover:text-sage-800 bg-sage-50 hover:bg-sage-100 px-3 py-1.5 rounded-lg border border-sage-100 transition-all cursor-pointer"
                >
                  {selectedIds.length === filteredItems.length ? '全選択を解除' : 'すべての食材を選択'}
                </button>
              )}

              {/* Bulk Clear Button */}
              {items.length > 0 && onClearFridge && (
                <button
                  id="btn-clear-fridge"
                  onClick={onClearFridge}
                  className="text-xs font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 px-3 py-1.5 rounded-lg border border-rose-100 transition-all flex items-center gap-1 cursor-pointer"
                  title="すべてクリア"
                >
                  <Trash2 className="h-3 w-3" />
                  冷蔵庫を空にする
                </button>
              )}
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-1.5 mb-6" id="category-filters">
            <button
              id="filter-all"
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                selectedFilter === 'all'
                  ? 'bg-sage-600 text-white border-sage-600 shadow-xs'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-sage-200'
              }`}
            >
              すべて ({items.length})
            </button>
            {CATEGORIES.map(cat => {
              const count = items.filter(i => i.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  id={`filter-${cat.id}`}
                  onClick={() => setSelectedFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1 ${
                    selectedFilter === cat.id
                      ? 'bg-sage-600 text-white border-sage-600 shadow-xs'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-sage-200'
                  }`}
                >
                  <span>{cat.color.split('icon-')[1]}</span>
                  <span>{cat.label} ({count})</span>
                </button>
              );
            })}
          </div>

          {/* Items Inventory Grid or Empty State */}
          <div className="flex-1">
            {filteredItems.length === 0 ? (
              <div className="text-center py-16 px-4 bg-sage-50/25 rounded-2xl border border-dashed border-sage-205" id="empty-fridge-container">
                <p className="text-sm font-semibold text-gray-500 mb-1">
                  {selectedFilter === 'all'
                    ? '冷蔵庫内に食材が登録されていません'
                    : 'このカテゴリーの食材はありません'}
                </p>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  左のフォームから食材を手動登録するか、定番食材の追加ボタンをクリックして、中に進めてみてください。
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="fridge-grid">
                {filteredItems.map(item => {
                  const isSelected = selectedIds.includes(item.id);
                  const expiry = getExpiryLabel(item.expiryDate);
                  const icon = CATEGORIES.find(c => c.id === item.category)?.color.split('icon-')[1] || '📦';
                  
                  return (
                    <div
                      key={item.id}
                      id={`fridge-item-${item.id}`}
                      className={`relative flex items-start space-x-3 p-4 border rounded-2xl transition-all duration-200 ${
                        isSelected
                          ? 'border-sage-600 bg-sage-50/40 ring-1 ring-sage-600/30 shadow-xs'
                          : 'border-slate-100 hover:border-sage-200 hover:bg-gray-50/50 bg-white'
                      }`}
                    >
                      {/* Checkbox Trigger to cook */}
                      <button
                        onClick={() => handleToggleSelectItem(item.id)}
                        className={`mt-1 h-5 w-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-sage-600 text-white border-sage-600'
                            : 'bg-white border-gray-300 hover:border-sage-500'
                        }`}
                        id={`chk-${item.id}`}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5 stroke-[3px]" />}
                      </button>

                      {/* Item Icon */}
                      <div className="text-2xl mt-0.5 select-none">{icon}</div>

                      {/* Details */}
                      <div className="flex-1 min-w-0 pr-6">
                        <h4 className="font-bold text-gray-800 text-sm truncate">{item.name}</h4>
                        
                        {/* Quantity adjust input */}
                        <div className="flex items-center space-x-1.5 mt-1">
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-sm font-medium">分量:</span>
                          <input
                            type="text"
                            value={item.quantity}
                            onChange={(e) => onUpdateQuantity(item.id, e.target.value)}
                            className="text-xs bg-transparent border-b border-transparent focus:border-sage-500 font-bold text-sage-800 focus:outline-hidden w-20 px-0.5"
                          />
                        </div>

                        {/* Expiry dates info */}
                        <p className={`text-[10px] mt-2 inline-block px-2 py-0.5 rounded-full font-medium ${expiry.style}`}>
                          {expiry.text}
                        </p>
                      </div>

                      {/* Remove item button */}
                      <button
                        id={`btn-delete-${item.id}`}
                        onClick={() => onRemoveItem(item.id)}
                        className="absolute right-3 top-3 text-gray-300 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                        title="冷蔵庫から出す"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Proceed to recipes action bar */}
          {selectedIds.length > 0 && (
            <div className="mt-8 bg-sage-50 border border-sage-100 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in" id="proceed-actions-bar">
              <div className="flex items-center space-x-3 text-sm">
                <div className="bg-sage-600 text-white h-7 w-7 rounded-full flex items-center justify-center font-bold">
                  {selectedIds.length}
                </div>
                <div className="font-semibold text-sage-800">
                  個の食材が選択されています。これらの食材をもとにレシピを提案します。
                </div>
              </div>
              <button
                id="btn-trigger-suggest"
                onClick={onNavigateToRecipes}
                className="w-full sm:w-auto bg-apricot-500 hover:bg-apricot-600 active:scale-98 transition-all text-white py-2 px-5 rounded-xl font-bold text-sm shadow-sm flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>レシピ提案に進む →</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

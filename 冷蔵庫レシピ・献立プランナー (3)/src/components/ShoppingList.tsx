/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShoppingItem } from '../types';
import { Plus, Trash2, CheckCircle, ClipboardList, AlertCircle, ShoppingBag, Trash } from 'lucide-react';

interface ShoppingListProps {
  itemList: ShoppingItem[];
  onAddItem: (name: string, qty: string) => void;
  onToggleItem: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onClearChecked: () => void;
}

export default function ShoppingList({
  itemList,
  onAddItem,
  onToggleItem,
  onRemoveItem,
  onClearChecked,
}: ShoppingListProps) {
  // Input fields
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('1袋');

  const quantityPresets = ['1袋', '1パック', '1本', '1個', '200g', '500g', '1丁', '少々'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    onAddItem(newItemName.trim(), newItemQty || '1個');
    
    // Reset inputs
    setNewItemName('');
    setNewItemQty('1個');
  };

  // Counting
  const checkedCount = itemList.filter(item => item.checked).length;
  const uncheckedCount = itemList.length - checkedCount;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="shopping-list-view">
      
      {/* Left side: Add manually form */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-sage-100 kitchen-shines">
          <h2 className="text-lg font-bold text-sage-800 border-b border-sage-100 pb-3 mb-4 flex items-center gap-2">
            <span className="p-1 rounded-lg bg-sage-100 text-sage-600"><Plus className="h-4 w-4" /></span>
            買うものをリストに追加
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input name */}
            <div>
              <label htmlFor="input-shop-name" className="block text-xs font-bold text-gray-600 mb-1.5">商品名 / 食材名</label>
              <input
                id="input-shop-name"
                type="text"
                placeholder="例：みりん、豚ひき肉、洗剤"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:border-sage-600 focus:ring-2 focus:ring-sage-50/50 bg-gray-50/50 transition-all font-medium"
                required
              />
            </div>

            {/* Input quantity */}
            <div>
              <label htmlFor="input-shop-qty" className="block text-xs font-bold text-gray-600 mb-1">必要な分量</label>
              <input
                id="input-shop-qty"
                type="text"
                placeholder="例：1本、2パック"
                value={newItemQty}
                onChange={(e) => setNewItemQty(e.target.value)}
                className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:border-sage-600 bg-gray-50/50 font-medium mb-2"
                required
              />
              <div className="flex flex-wrap gap-1">
                {quantityPresets.map(preset => (
                  <button
                    key={preset}
                    id={`shop-preset-${preset}`}
                    type="button"
                    onClick={() => setNewItemQty(preset)}
                    className={`text-[10px] px-2 py-1 rounded-md border font-medium transition-all ${
                      newItemQty === preset
                        ? 'bg-sage-600 text-white border-sage-600 shadow-xs'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-sage-200'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <button
              id="btn-add-shopping-hand"
              type="submit"
              className="w-full tracking-wide bg-sage-600 hover:bg-sage-700 text-white py-2.5 rounded-xl font-bold text-sm shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>お買い物リストに追加</span>
            </button>
          </form>
        </div>

        {/* Informative advice */}
        <div className="bg-sage-50 border border-sage-100 rounded-3xl p-5 text-xs text-sage-800">
          <h4 className="font-bold flex items-center gap-1 mb-1.5">
            <span>🛒</span> 買い上手のおたすけヒント
          </h4>
          <p className="leading-relaxed font-semibold">
            AIレシピページの<strong className="text-apricot-600">「足りない食材をお買い物リストへ送る」</strong>ボタンから、ワンクリックで必要な調味料・お買いもの食材を追加することができます！
          </p>
        </div>
      </div>

      {/* Right columns: Shopping Memo Ledger Sheet */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-sage-100 min-h-[400px] flex flex-col">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sage-100 pb-4 mb-4">
            <div>
              <h2 className="text-lg font-bold text-sage-800 flex items-center gap-2">
                <span className="p-1 rounded-lg bg-sage-100 text-sage-600"><ClipboardList className="h-4 w-4" /></span>
                お買い物メモ
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                買うべきもの: <strong>{uncheckedCount}</strong>件 / 買ったもの: <strong>{checkedCount}</strong>件
              </p>
            </div>

            {/* Clear checked elements */}
            {checkedCount > 0 && (
              <button
                id="btn-clear-checked-shopping"
                onClick={onClearChecked}
                className="text-xs font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-500 px-3 py-1.5 rounded-xl border border-rose-200 transition-all self-start sm:self-center flex items-center gap-1 cursor-pointer"
              >
                <Trash className="h-3 w-3" />
                <span>購入済みをリストから削除</span>
              </button>
            )}
          </div>

          {/* Ledger checklist sheet items */}
          <div className="flex-1">
            {itemList.length === 0 ? (
              <div className="text-center py-20 px-4 bg-sage-50/25 rounded-2xl border border-dashed border-sage-200" id="empty-shopping-box">
                <p className="text-3xl mb-3">🛍️🍳🌟</p>
                <p className="text-sm font-bold text-gray-600 mb-1">お買い物メモは空っぽです</p>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  近所のスーパーで買い足すものがあれば、左から入力して足しておくか、AIレシピ詳細画面から自動追加できます。
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100" id="shopping-notes-ledger">
                {itemList.map((item) => (
                  <div
                    key={item.id}
                    id={`shopping-item-${item.id}`}
                    className={`flex items-center justify-between py-3.5 px-2 hover:bg-slate-50 border-b border-gray-100 transition-colors ${
                      item.checked ? 'bg-gray-50/30' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3.5 flex-1 min-w-0">
                      {/* Check trigger status */}
                      <button
                        onClick={() => onToggleItem(item.id)}
                        className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                          item.checked
                            ? 'bg-sage-600 text-white border-sage-600'
                            : 'bg-white border-gray-300 hover:border-sage-500'
                        }`}
                        id={`chk-shop-${item.id}`}
                      >
                        {item.checked && <CheckCircle className="h-4 w-4 stroke-[3px]" />}
                      </button>

                      {/* Info label */}
                      <div className="flex-1 min-w-0">
                        <span
                          className={`text-sm font-sans font-semibold transition-all ${
                            item.checked
                              ? 'line-through text-gray-400 font-normal'
                              : 'text-gray-800'
                          }`}
                        >
                          {item.name}
                        </span>
                        
                        {item.relatedRecipeId && (
                          <span className="block text-[9px] text-apricot-600 font-bold mt-0.5">
                            AIレシピ「{item.relatedRecipeId}」に使う食材
                          </span>
                        )}
                      </div>

                      {/* Quantity */}
                      <span className={`text-xs px-2.5 py-1 rounded-sm font-black transition-all ${
                        item.checked
                          ? 'bg-gray-100 text-gray-400 font-normal'
                          : 'bg-sage-50 text-sage-800 border border-sage-100/60'
                      }`}>
                        {item.quantity}
                      </span>
                    </div>

                    {/* Single delete element */}
                    <button
                      id={`btn-delete-shop-${item.id}`}
                      onClick={() => onRemoveItem(item.id)}
                      className="text-gray-300 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 transition-colors ml-4 cursor-pointer"
                      title="お買い物メモから削除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FridgeItem } from "./types";

export const CATEGORIES = [
  { id: 'meat', label: 'お肉', color: 'bg-rose-50 text-rose-700 border-rose-200 icon-🍖' },
  { id: 'fish', label: '魚介類', color: 'bg-blue-50 text-blue-700 border-blue-200 icon-🐟' },
  { id: 'vegetable', label: '野菜', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 icon-🥬' },
  { id: 'dairy', label: '乳製品', color: 'bg-amber-50 text-amber-700 border-amber-200 icon-🧀' },
  { id: 'egg', label: '卵', color: 'bg-yellow-50 text-yellow-700 border-yellow-200 icon-🥚' },
  { id: 'processed', label: '加工食品', color: 'bg-purple-50 text-purple-700 border-purple-200 icon-🥫' },
  { id: 'seasoning', label: '調味料', color: 'bg-orange-50 text-orange-700 border-orange-200 icon-🧂' },
  { id: 'other', label: 'その他', color: 'bg-slate-50 text-slate-700 border-slate-200 icon-📦' },
] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  meat: 'お肉',
  fish: '魚介類',
  vegetable: '野菜',
  dairy: '乳製品',
  egg: '卵',
  processed: '加工食品',
  seasoning: '調味料',
  other: 'その他'
};

export const INITIAL_FRIDGE_ITEMS: FridgeItem[] = [];

// Quick typical items that users can click to add instantly to their fridge
export const RECOMMEND_QUICK_ITEMS = [
  // 肉類
  { name: '豚バラ薄切り肉', category: 'meat', quantity: '200g', shelfLife: 3 },
  { name: '豚ひき肉', category: 'meat', quantity: '200g', shelfLife: 2 },
  { name: '鶏もも肉', category: 'meat', quantity: '300g', shelfLife: 3 },
  { name: '鶏むね肉', category: 'meat', quantity: '300g', shelfLife: 3 },
  { name: '牛バラ薄切り肉', category: 'meat', quantity: '200g', shelfLife: 3 },
  // 魚介類
  { name: '鮭の切り身', category: 'fish', quantity: '2切れ', shelfLife: 2 },
  { name: 'サバの切り身', category: 'fish', quantity: '2切れ', shelfLife: 2 },
  { name: 'しらす干し', category: 'fish', quantity: '1パック', shelfLife: 4 },
  { name: 'たら切り身', category: 'fish', quantity: '2切れ', shelfLife: 2 },
  // 野菜
  { name: 'キャベツ', category: 'vegetable', quantity: '1/4個', shelfLife: 10 },
  { name: '玉ねぎ', category: 'vegetable', quantity: '2個', shelfLife: 20 },
  { name: 'じゃがいも', category: 'vegetable', quantity: '3個', shelfLife: 21 },
  { name: 'にんじん', category: 'vegetable', quantity: '1本', shelfLife: 14 },
  { name: '大根', category: 'vegetable', quantity: '1/3本', shelfLife: 10 },
  { name: '長ねぎ', category: 'vegetable', quantity: '1本', shelfLife: 7 },
  { name: 'ピーマン', category: 'vegetable', quantity: '1袋', shelfLife: 7 },
  { name: 'トマト', category: 'vegetable', quantity: '2個', shelfLife: 5 },
  { name: 'ブロッコリー', category: 'vegetable', quantity: '1個', shelfLife: 5 },
  { name: 'もやし', category: 'vegetable', quantity: '1袋', shelfLife: 1 },
  // 卵・乳製品
  { name: '卵', category: 'egg', quantity: '6個', shelfLife: 14 },
  { name: '牛乳', category: 'dairy', quantity: '1000ml', shelfLife: 7 },
  { name: 'とろけるチーズ', category: 'dairy', quantity: '100g', shelfLife: 14 },
  { name: 'バター', category: 'dairy', quantity: '1箱', shelfLife: 60 },
  { name: 'ヨーグルト', category: 'dairy', quantity: '1パック', shelfLife: 10 },
  // 加工食品
  { name: 'ウインナー', category: 'processed', quantity: '1袋', shelfLife: 10 },
  { name: '木綿豆腐', category: 'processed', quantity: '1丁', shelfLife: 3 },
  { name: '納豆', category: 'processed', quantity: '3パック', shelfLife: 6 },
  { name: 'ちくわ', category: 'processed', quantity: '4本', shelfLife: 5 },
  { name: 'キムチ', category: 'processed', quantity: '1パック', shelfLife: 15 },
  // 調味料
  { name: 'マヨネーズ', category: 'seasoning', quantity: '1本', shelfLife: 90 },
  { name: '味噌', category: 'seasoning', quantity: '1パック', shelfLife: 180 },
  { name: 'めんつゆ', category: 'seasoning', quantity: '1本', shelfLife: 60 },
  { name: 'しょうゆ', category: 'seasoning', quantity: '1本', shelfLife: 180 },
] as const;

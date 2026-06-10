/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PlannedMeal, Recipe } from '../types';
import { Calendar, Trash2, Plus, Sparkles, ChefHat, Check, CircleDot } from 'lucide-react';

interface MealPlannerProps {
  plannedMeals: PlannedMeal[];
  recipes: Recipe[];
  onAddPlannedMeal: (meal: Omit<PlannedMeal, 'id'>) => void;
  onRemovePlannedMeal: (id: string) => void;
}

export default function MealPlanner({
  plannedMeals,
  recipes,
  onAddPlannedMeal,
  onRemovePlannedMeal,
}: MealPlannerProps) {
  // Helper to format Date target as YYYY-MM-DD using local timezone (especially Japanese JST)
  const formatLocalDate = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Navigation for week
  // State: current date offset
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Custom Adding State
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customDate, setCustomDate] = useState(formatLocalDate(new Date()));
  const [customMealType, setCustomMealType] = useState<PlannedMeal['mealType']>('dinner');
  const [customRecipeId, setCustomRecipeId] = useState<string>('');

  // Generate 7 days of current week (starting from currentDate minus 3 days, through currentDate plus 3 days)
  const getWeekDates = (centerDate: Date) => {
    const dates = [];
    for (let i = -3; i <= 3; i++) {
      const d = new Date(centerDate);
      d.setDate(centerDate.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const weekDates = getWeekDates(currentDate);

  const MEAL_TYPES: { id: PlannedMeal['mealType']; label: string; icon: string; color: string }[] = [
    { id: 'breakfast', label: '朝食', icon: '🌅', color: 'bg-emerald-50 text-emerald-800' },
    { id: 'lunch', label: '昼食', icon: '☀️', color: 'bg-blue-50 text-blue-800' },
    { id: 'dinner', label: '夕食', icon: '🌃', color: 'bg-indigo-50 text-indigo-800' },
    { id: 'snack', label: 'その他', icon: '🕒', color: 'bg-amber-50 text-amber-850' },
  ];

  const DAYS_OF_WEEK = ['日', '月', '火', '水', '木', '金', '土'];

  // Handle shift week
  const shiftWeek = (days: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + days);
    setCurrentDate(newDate);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim() && !customRecipeId) return;

    let titleToSave = customTitle.trim();
    let recipeIdToSave: string | undefined = undefined;

    if (customRecipeId) {
      const rec = recipes.find(r => r.id === customRecipeId);
      if (rec) {
        titleToSave = rec.title;
        recipeIdToSave = rec.id;
      }
    }

    onAddPlannedMeal({
      date: customDate,
      mealType: customMealType,
      customTitle: titleToSave,
      recipeId: recipeIdToSave,
    });

    // Reset Form
    setCustomTitle('');
    setCustomRecipeId('');
    setIsAddingCustom(false);
  };

  return (
    <div className="space-y-6" id="meal-planner-section">
      
      {/* Week Heading Selector */}
      <div className="bg-white rounded-3xl p-5 shadow-xs border border-sage-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-sage-800 flex items-center gap-1.5" id="meal-calendar-title">
            <Calendar className="h-5 w-5 text-sage-600" />
            <span>今週の献立プランナー</span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">予定を決めておくことで、毎日の「今日何にしよう…」の悩みを解消！</p>
        </div>

        {/* Shift arrows */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => shiftWeek(-7)}
            className="px-3 py-1.5 bg-sage-50 hover:bg-sage-100 text-sage-700 rounded-xl text-xs font-bold transition-all"
            id="btn-prev-week"
          >
            ← 前の週
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3.5 py-1.5 bg-white border border-sage-200 hover:border-sage-300 text-sage-800 rounded-xl text-xs font-semibold transition-all"
            id="btn-current-week"
          >
            今週
          </button>
          <button
            onClick={() => shiftWeek(7)}
            className="px-3 py-1.5 bg-sage-50 hover:bg-sage-100 text-sage-700 rounded-xl text-xs font-bold transition-all"
            id="btn-next-week"
          >
            次の週 →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left column: Add/Quick Register custom meal options */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-sage-100 kitchen-shines">
            <h3 className="text-sm font-bold text-sage-800 mb-4 flex items-center gap-1.5 pb-2 border-b border-sage-150">
              <span className="p-1 bg-sage-100 text-sage-600 rounded-md"><Plus className="h-3.5 w-3.5" /></span>
              今日の予定を追加
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">登録する日</label>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-sage-500 bg-gray-50/50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">食事の時間帯</label>
                <select
                  value={customMealType}
                  onChange={(e) => setCustomMealType(e.target.value as PlannedMeal['mealType'])}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-sage-500 bg-gray-50/50"
                >
                  <option value="breakfast">🌅 朝食</option>
                  <option value="lunch">☀️ 昼食</option>
                  <option value="dinner">🌃 夕食</option>
                  <option value="snack">🕒 おやつ・夜食</option>
                </select>
              </div>

              <div className="border-t border-dashed border-gray-100 pt-3">
                <span className="block text-xs font-bold text-gray-500 mb-1.5">料理の選択方法</span>
                
                {/* Switch between pre-made AI recipe or manual title typing */}
                {recipes.length > 0 && (
                  <div className="mb-3">
                    <label className="block text-[10px] text-gray-400 mb-1">AIが提案したレシピから選ぶ</label>
                    <select
                      value={customRecipeId}
                      onChange={(e) => {
                        setCustomRecipeId(e.target.value);
                        if (e.target.value) setCustomTitle('');
                      }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-sage-500 bg-emerald-50/20 text-emerald-800"
                    >
                      <option value="">-- 手入力する --</option>
                      {recipes.map(r => (
                        <option key={r.id} value={r.id}>{r.title}</option>
                      ))}
                    </select>
                  </div>
                )}

                {!customRecipeId && (
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1">手書きメッセージ（直接入力する）</label>
                    <input
                      type="text"
                      placeholder="例：いつものカレー、外食、素麺"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-sage-500 bg-gray-50/50"
                      required={!customRecipeId}
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full cursor-pointer bg-sage-600 hover:bg-sage-700 text-white rounded-xl py-2 text-xs font-bold shadow-2xs transition-all flex items-center justify-center space-x-1"
                id="btn-add-planner"
              >
                <Plus className="h-4 w-4" />
                <span>カレンダーに登録</span>
              </button>
            </form>
          </div>

          {/* Quick Ideas Tip card */}
          <div className="bg-apricot-50 border border-apricot-100 rounded-3xl p-5 text-xs text-apricot-900">
            <h4 className="font-bold flex items-center gap-1 mb-1.5">
              <span>💡</span> 主婦のやりくり豆知識
            </h4>
            <p className="leading-relaxed font-medium">
              カレンダーに数日分の献立を埋めるだけで、買い物の二重買いを防ぎ、平均して
              <strong className="text-apricot-600">食費が約15%削減</strong>
              できます！足りないものはすぐ右側の「お買い物リスト」に入れちゃいましょう。
            </p>
          </div>
        </div>

        {/* Right columns: Week Calendar Display Board (7 days list, responsive) */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-sage-100">
            
            {/* Quick stats for planned meals count */}
            <div className="flex items-center justify-between border-b border-sage-50 pb-3 mb-6">
              <span className="text-xs font-medium text-gray-400">表示中のプラン: {weekDates[0].toLocaleDateString('ja-JP', {month: 'numeric', day: 'numeric'})} 〜 {weekDates[6].toLocaleDateString('ja-JP', {month: 'numeric', day: 'numeric'})}</span>
              <span className="text-xs bg-sage-50 text-sage-800 px-3 py-1 rounded-sm font-bold">期間内予定: <strong>{plannedMeals.filter(pm => weekDates.map(wd => formatLocalDate(wd)).includes(pm.date)).length}</strong>件</span>
            </div>

            <div className="space-y-6" id="planner-week-calendar">
              {weekDates.map((dateObj) => {
                const dateKey = formatLocalDate(dateObj);
                const dayIndex = dateObj.getDay();
                const dayName = DAYS_OF_WEEK[dayIndex];
                
                // Matches for this specific day
                const dayPlanned = plannedMeals.filter(pm => pm.date === dateKey);

                // Highlight today dynamically
                const isTodayStr = dateKey === formatLocalDate(new Date());

                return (
                  <div
                    key={dateKey}
                    id={`calendar-row-${dateKey}`}
                    className={`p-4 rounded-2xl border transition-all ${
                      isTodayStr
                        ? 'bg-sage-50/60 border-sage-600 ring-1 ring-sage-600/35 relative'
                        : 'bg-white border-gray-100 hover:border-sage-200'
                    }`}
                  >
                    {isTodayStr && (
                      <span className="absolute top-2 right-4 bg-sage-600 text-white text-[9px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                        今日
                      </span>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      
                      {/* Date Indicator badge */}
                      <div className="sm:w-32 shrink-0 flex items-center space-x-2 sm:flex-col sm:items-start sm:space-x-0">
                        <div className="flex items-baseline space-x-1">
                          <span className="text-lg font-bold text-gray-800">
                            {dateObj.getMonth() + 1}/{dateObj.getDate()}
                          </span>
                          <span className={`text-xs font-bold p-1 rounded-sm ${
                            dayIndex === 0 ? 'text-rose-600 bg-rose-50' : dayIndex === 6 ? 'text-blue-600 bg-blue-50' : 'text-gray-500 bg-gray-50'
                          }`}>
                            ({dayName})
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium">{dateKey}</span>
                      </div>

                      {/* Meals slots details */}
                      <div className="flex-1">
                        {dayPlanned.length === 0 ? (
                          <div className="text-xs text-slate-400 bg-slate-50/20 py-2.5 px-4 rounded-xl border border-dashed border-gray-100 flex items-center gap-1.5 italic font-medium">
                            <CircleDot className="h-3.5 w-3.5 text-gray-300" />
                            <span>献立の予定は未登録です</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {dayPlanned.map((plan) => {
                              const mealTypeMeta = MEAL_TYPES.find(mt => mt.id === plan.mealType) || MEAL_TYPES[3];
                              const isAi = !!plan.recipeId || !!plan.recipe;
                              
                              return (
                                <div
                                  key={plan.id}
                                  id={`planned-meal-${plan.id}`}
                                  className="border border-slate-100 rounded-xl p-3 bg-slate-50/35 hover:bg-slate-50 transition-all flex items-start justify-between gap-3 group shadow-3xs"
                                >
                                  <div>
                                    <div className="flex items-center space-x-1.5 mb-1.5">
                                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${mealTypeMeta.color}`}>
                                        {mealTypeMeta.icon} {mealTypeMeta.label}
                                      </span>
                                      
                                      {isAi && (
                                        <span className="bg-apricot-50 text-apricot-600 text-[9px] px-1.5 py-0.2 rounded-sm font-bold flex items-center gap-0.5">
                                          <Sparkles className="h-2 w-2" /> AIレシピ
                                        </span>
                                      )}
                                    </div>

                                    <h5 className="text-xs font-bold text-gray-800 leading-snug line-clamp-1">{plan.customTitle}</h5>
                                    {plan.recipe && (
                                      <span className="text-[10px] text-gray-400 block font-medium mt-0.5">
                                        ⏱️ 調理：{plan.recipe.prepTime}分
                                      </span>
                                    )}
                                  </div>

                                  <button
                                    id={`btn-remove-plan-${plan.id}`}
                                    onClick={() => onRemovePlannedMeal(plan.id)}
                                    className="text-gray-300 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-all cursor-pointer opacity-80 group-hover:opacity-100"
                                    title="この献立を削除する"
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
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

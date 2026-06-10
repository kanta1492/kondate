/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Recipe, FridgeItem, PlannedMeal } from '../types';
import { Sparkles, Loader2, Clock, ThumbsUp, CheckSquare, Plus, PlusCircle, ArrowRight, Heart, Calendar } from 'lucide-react';

interface RecipeSuggestorProps {
  fridgeItems: FridgeItem[];
  selectedIngredientIds: string[];
  recipes: Recipe[];
  onSetRecipes: (recipes: Recipe[]) => void;
  onAddToShopping: (ingredients: { name: string; amount: string }[], recipeTitle: string) => void;
  onPlanMeal: (recipe: Recipe, date: string, mealType: PlannedMeal['mealType']) => void;
}

export default function RecipeSuggestor({
  fridgeItems,
  selectedIngredientIds,
  recipes,
  onSetRecipes,
  onAddToShopping,
  onPlanMeal,
}: RecipeSuggestorProps) {
  // Prep-preferences State
  const [prepTime, setPrepTime] = useState<string>(''); // No limit
  const [mealType, setMealType] = useState<string>('dinner'); // Default dinner-friendly
  const [additionalRequest, setAdditionalRequest] = useState<string>('');
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [isCached, setIsCached] = useState<boolean | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Helper to show non-blocking toast
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Planner toggle state per recipe
  const [planningForMealId, setPlanningForMealId] = useState<string | null>(null);
  const [planningDate, setPlanningDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [planningMealType, setPlanningMealType] = useState<PlannedMeal['mealType']>('dinner');

  // Currently selected food names
  const selectedFoodNames = fridgeItems
    .filter(item => selectedIngredientIds.includes(item.id))
    .map(item => `${item.name} (${item.quantity})`);

  // Handle Generate Recipes Call
  const handleGenerateRecipes = async () => {
    const ingredientsToUse = fridgeItems
      .filter(item => selectedIngredientIds.includes(item.id))
      .map(item => item.name);

    if (ingredientsToUse.length === 0) {
      setError("冷蔵庫から今日の献立で活用したい食材を1つ以上選んでください。");
      return;
    }

    setLoading(true);
    setError(null);
    setSelectedRecipeId(null);

    try {
      const response = await fetch('/api/recipe/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ingredients: ingredientsToUse,
          prepTimePreference: prepTime ? `${prepTime}分以内` : undefined,
          mealType: mealType === 'dinner' ? '夕食' : mealType === 'lunch' ? '昼食' : mealType === 'breakfast' ? '朝食' : 'おやつ',
          additionalRequest: additionalRequest.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "レシピの取得に失敗しました。");
      }

      const data = await response.json();
      if (data && data.recipes) {
        onSetRecipes(data.recipes);
        setIsCached(data.isCached ?? false);
        if (data.recipes.length > 0) {
          setSelectedRecipeId(data.recipes[0].id);
        }
      } else {
        throw new Error("AIから有効なレシピが返されませんでした。");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'レシピの作成中に予期せぬ不具合が発生しました。');
    } finally {
      setLoading(false);
    }
  };

  // Get active recipe detailed data
  const activeRecipe = recipes.find(r => r.id === selectedRecipeId);

  // Add all ingredients as missing to shopping list
  const handleSendToShopping = (recipe: Recipe) => {
    onAddToShopping(recipe.ingredientsRequired, recipe.title);
    showToast(`「${recipe.title}」の食材をお買い物リストに追加しました。`);
  };

  // Handle plan meal submit
  const handlePlanMealSubmit = (recipe: Recipe) => {
    onPlanMeal(recipe, planningDate, planningMealType);
    setPlanningForMealId(null);
    const timeLabel = planningMealType === 'dinner' ? '夕食' : planningMealType === 'lunch' ? '昼食' : planningMealType === 'breakfast' ? '朝食' : 'おやつ';
    showToast(`献立カレンダー（${planningDate} ${timeLabel}）に「${recipe.title}」を登録しました。`);
  };

  return (
    <div className="space-y-6 relative" id="recipe-suggestor-section">
      {/* Non-blocking Status Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-sage-800 text-white text-xs font-semibold px-4.5 py-3 rounded-2xl shadow-xl flex items-center space-x-2 animate-fade-in border border-sage-700">
          <CheckSquare className="h-4 w-4 text-emerald-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}
      
      {/* Search Preferences Panel */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-sage-100 kitchen-shines" id="ai-generate-settings">
        <h2 className="text-lg font-bold text-sage-800 border-b border-sage-100 pb-3 mb-4 flex items-center gap-2">
          <span className="p-1 rounded-lg bg-sage-100 text-sage-600"><Sparkles className="h-4 w-4" /></span>
          冷蔵庫の食材からレシピを提案
        </h2>

        {/* Selected ingredients preview */}
        <div className="mb-6">
          <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">使用する食材 ({selectedFoodNames.length}品):</span>
          {selectedFoodNames.length === 0 ? (
            <div className="bg-amber-50 text-amber-800 text-xs px-4 py-3 rounded-xl border border-amber-100 font-medium flex items-center space-x-2">
              <span>⚠️</span>
              <span>「冷蔵庫の管理」タブで、レシピに使いたいお好きな食材にチェックを入れてください。</span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-sage-50/30 rounded-xl border border-sage-100">
              {fridgeItems.filter(item => selectedIngredientIds.includes(item.id)).map(item => (
                <span
                  key={item.id}
                  className="text-xs bg-white text-sage-800 border border-sage-200 px-3 py-1 rounded-lg shadow-2xs font-semibold"
                >
                  {item.name} <span className="text-gray-400 font-normal">({item.quantity})</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Fine Tuning Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Prep time max */}
          <div>
            <label htmlFor="pref-prep-time" className="block text-xs font-bold text-gray-600 mb-1.5">調理時間の目安</label>
            <select
              id="pref-prep-time"
              value={prepTime}
              onChange={(e) => setPrepTime(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50/50 focus:outline-hidden font-medium text-gray-700"
            >
              <option value="">調理時間制限なし</option>
              <option value="10">10分以内で手早く！</option>
              <option value="15">15分以内（一般的）</option>
              <option value="20">20分で作れる料理</option>
              <option value="30">30分以内でしっかり</option>
            </select>
          </div>

          {/* Meal type preference */}
          <div>
            <label htmlFor="pref-meal-type" className="block text-xs font-bold text-gray-600 mb-1.5 font-sans">想定する食事</label>
            <select
              id="pref-meal-type"
              value={mealType}
              onChange={(e) => setMealType(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50/50 focus:outline-hidden font-medium text-gray-700"
            >
              <option value="dinner">夕食の主菜・副菜</option>
              <option value="lunch">昼食（手軽なレシピなど）</option>
              <option value="breakfast">朝食（シンプルな料理など）</option>
              <option value="snack">おやつ・おつまみ</option>
            </select>
          </div>

          {/* Custom user request text */}
          <div>
            <label htmlFor="pref-custom" className="block text-xs font-bold text-gray-600 mb-1.5">追加のご要望（任意）</label>
            <input
              id="pref-custom"
              type="text"
              placeholder="例：子供向け、辛いもの以外、さっぱり系"
              value={additionalRequest}
              onChange={(e) => setAdditionalRequest(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50/50 focus:outline-hidden font-medium text-gray-700 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Generate triggers */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="text-xs text-sage-600 font-medium flex items-center gap-1.5 select-none self-start sm:self-auto">
            <span className="text-[11px] text-gray-400">
              💡 食材を選択し、ボタンを押すとAIが最適なレシピを提案します。
            </span>
          </div>

          <button
            id="btn-generate-recipes"
            onClick={() => handleGenerateRecipes()}
            disabled={loading || selectedFoodNames.length === 0}
            className={`cursor-pointer w-full sm:w-auto px-6 py-3 rounded-2xl font-bold text-sm shadow-sm flex items-center justify-center space-x-2.5 transition-all ${
              loading || selectedFoodNames.length === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-apricot-500 hover:bg-apricot-600 active:transform active:scale-[0.98] text-white'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span>AIが献立を考えています (約5秒)...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-amber-200" />
                <span>この食材でレシピを提案してもらう</span>
              </>
            )}
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div id="recipe-error-box" className="mt-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl p-4 text-xs font-medium">
            <p className="font-bold mb-1">⚠️ レシピを生成できませんでした</p>
            <p>{error}</p>
          </div>
        )}
      </div>

      {/* Recipes Output Panel */}
      {recipes.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="recipes-results-holder">
          
          {/* Left panel: Recipe options list */}
          <div className="lg:col-span-1 space-y-3">
            <div className="flex items-center justify-between mb-2 px-1 select-none">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">提案されたレシピリスト</h3>
              {isCached !== null && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isCached 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-3xs animate-pulse' 
                    : 'bg-amber-50 text-amber-600 border border-amber-200'
                }`}>
                  {isCached ? '⚡ Upstash キャッシュ' : '✨ 新規 AI 生成'}
                </span>
              )}
            </div>
            <div className="space-y-3">
              {recipes.map((item, idx) => {
                const isActive = item.id === selectedRecipeId;
                return (
                  <button
                    key={item.id}
                    id={`recipe-selector-btn-${item.id}`}
                    onClick={() => {
                      setSelectedRecipeId(item.id);
                      setPlanningForMealId(null);
                    }}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-sage-600 border-sage-600 text-white shadow-md shadow-sage-600/10 scale-[1.01]'
                        : 'bg-white border-sage-100 text-gray-800 hover:border-sage-200 hover:bg-sage-50/30'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider ${
                        isActive ? 'bg-sage-800/60 text-white' : 'bg-sage-100 text-sage-800'
                      }`}>
                        レシピ {idx + 1}
                      </span>
                      <span className="flex items-center text-xs gap-1 font-bold">
                        <Clock className="h-3 w-3" /> {item.prepTime}分
                      </span>
                    </div>

                    <h4 className="font-bold text-sm leading-snug line-clamp-2">{item.title}</h4>
                    <p className={`text-[11px] mt-2 line-clamp-2 ${isActive ? 'text-sage-100' : 'text-gray-500'}`}>
                      {item.description}
                    </p>

                    <div className="mt-3 pt-3 border-t border-dashed border-current/20 flex flex-wrap gap-1">
                      {item.ingredientsUsed.map((ing) => (
                        <span
                          key={ing}
                          className={`text-[10px] px-1.5 py-0.5 rounded-sm font-semibold truncate max-w-28 ${
                            isActive ? 'bg-sage-500/50 text-white' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          ✓ {ing}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right panel: Active recipe step-by-step instructions */}
          <div className="lg:col-span-2">
            {activeRecipe ? (
              <div className="bg-white rounded-3xl p-6 shadow-xs border border-sage-100" id="active-recipe-details">
                {/* Title */}
                <div className="border-b border-sage-100 pb-5 mb-5">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="bg-apricot-100 text-apricot-700 text-xs px-2.5 py-1 rounded-lg font-bold">
                      {activeRecipe.difficulty}
                    </span>
                    <span className="bg-sage-50 text-sage-800 text-xs px-2.5 py-1 rounded-lg font-bold flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-sage-600" /> {activeRecipe.prepTime}分
                    </span>
                    <span className="text-xs text-gray-400 font-medium">
                      材料：{activeRecipe.servingSize}人前
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-sage-900 leading-snug">{activeRecipe.title}</h3>
                  <p className="text-sm text-gray-500 mt-2 leading-relaxed bg-sage-50/50 p-3 rounded-2xl border border-sage-100/50 italic">
                    「{activeRecipe.description}」
                  </p>
                </div>

                {/* Grid info: ingredients require, nutrition */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Ingredients needed */}
                  <div className="bg-orange-50/20 border border-orange-100/50 rounded-2xl p-5" id="recipe-ingredients-box">
                    <h4 className="text-sm font-bold text-orange-900 mb-3 flex items-center gap-1.5">
                      必要な食材・調味料
                    </h4>
                    <ul className="space-y-2 text-xs font-medium">
                      {activeRecipe.ingredientsRequired.map((ing, idx) => {
                        const inFridge = activeRecipe.ingredientsUsed.some(
                          u => ing.name.includes(u) || u.includes(ing.name)
                        );
                        return (
                          <li
                            key={idx}
                            className="flex justify-between items-center py-1 border-b border-orange-100/20 last:border-0"
                          >
                            <span className="flex items-center gap-1">
                              {inFridge ? (
                                <span className="bg-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0.2 rounded-sm font-bold">
                                  手元にあり
                                </span>
                              ) : (
                                <span className="bg-orange-100 text-orange-850 text-[9px] px-1.5 py-0.2 rounded-sm font-bold">
                                  用意する
                                </span>
                              )}
                              <span className="text-gray-800">{ing.name}</span>
                            </span>
                            <span className="text-gray-600 font-bold">{ing.amount}</span>
                          </li>
                        );
                      })}
                    </ul>

                    {/* Button: send missing ingredients to shopping list */}
                    <button
                      id="btn-shopping-add"
                      onClick={() => handleSendToShopping(activeRecipe)}
                      className="mt-4 w-full bg-orange-50 hover:bg-orange-100 border border-orange-200/50 text-orange-800 text-xs py-2 rounded-xl font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <PlusCircle className="h-4 w-4" />
                      <span>足りない食材をお買い物リストへ送る</span>
                    </button>
                  </div>

                  {/* Tips & Nutrition */}
                  <div className="space-y-4">
                    {/* Nutritional advice */}
                    {activeRecipe.nutritionEstimate && (
                      <div className="bg-emerald-50/20 border border-emerald-100/50 p-4 rounded-2xl">
                        <h4 className="text-xs font-bold text-emerald-800 mb-1 flex items-center gap-1.5">
                          栄養に関する特徴
                        </h4>
                        <p className="text-xs text-emerald-900 font-medium leading-relaxed">
                          {activeRecipe.nutritionEstimate}
                        </p>
                      </div>
                    )}

                    {/* Saving Points list */}
                    <div className="bg-amber-50/20 border border-amber-100/50 p-4 rounded-2xl">
                      <h4 className="text-xs font-bold text-amber-800 mb-2 flex items-center gap-1.5">
                        代用アイデアと調理のコツ
                      </h4>
                      <ul className="space-y-1.5 text-xs text-amber-900 leading-relaxed font-semibold">
                        {activeRecipe.savingPoints.map((tip, idx) => (
                          <li key={idx} className="flex items-start space-x-1">
                            <span className="text-amber-500 mt-0.5">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Cooking Instructions step-by-step */}
                <div className="mb-6 space-y-3" id="cooking-steps-box">
                  <h4 className="text-sm font-bold text-sage-800 flex items-center gap-1.5 border-b border-sage-100 pb-2">
                    調理手順
                  </h4>
                  <div className="space-y-3">
                    {activeRecipe.steps.map((step, idx) => (
                      <div key={idx} className="flex space-x-3 p-3 bg-gray-50/50 hover:bg-gray-50 rounded-xl border border-gray-100 transition-colors">
                        <div className="bg-sage-600 text-white font-black text-xs h-5 w-5 rounded-full flex items-center justify-center shrink-0">
                          {idx + 1}
                        </div>
                        <p className="text-xs text-gray-700 leading-relaxed font-medium">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add code helper to save this as scheduled meal */}
                <div className="border-t border-sage-100 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-gray-500 flex items-center gap-1.5">
                    <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />
                    <span>このレシピをカレンダーに追加する</span>
                  </div>

                  {planningForMealId !== activeRecipe.id ? (
                    <button
                      id="btn-trigger-plan"
                      onClick={() => setPlanningForMealId(activeRecipe.id)}
                      className="cursor-pointer inline-flex items-center space-x-1.5 px-4 py-2 bg-sage-600 hover:bg-sage-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs"
                    >
                      <Calendar className="h-4 w-4" />
                      <span>献立カレンダーに登録する</span>
                    </button>
                  ) : (
                    <div className="bg-sage-50 border border-sage-200 p-4 rounded-2xl w-full sm:w-auto animate-fade-in space-y-3">
                      <p className="text-xs font-bold text-sage-800">登録する日にちと食事の種類を選択</p>
                      <div className="flex flex-wrap gap-2">
                        <input
                          type="date"
                          value={planningDate}
                          onChange={(e) => setPlanningDate(e.target.value)}
                          className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-medium"
                        />
                        <select
                          value={planningMealType}
                          onChange={(e) => setPlanningMealType(e.target.value as PlannedMeal['mealType'])}
                          className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-medium"
                        >
                          <option value="breakfast">朝食</option>
                          <option value="lunch">昼食</option>
                          <option value="dinner">夕食</option>
                          <option value="snack">おやつ・夜食</option>
                        </select>
                      </div>

                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => setPlanningForMealId(null)}
                          className="px-3 py-1 bg-white border border-gray-200 text-xs text-gray-500 font-medium rounded-lg hover:bg-gray-50"
                        >
                          キャンセル
                        </button>
                        <button
                          id="btn-save-planner-event"
                          onClick={() => handlePlanMealSubmit(activeRecipe)}
                          className="px-3 py-1 bg-sage-600 hover:bg-sage-700 text-white text-xs font-semibold rounded-lg"
                        >
                          登録を確定する
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center bg-gray-50 text-gray-400 py-20 rounded-3xl border border-dashed border-gray-200">
                <p>上のリストからレシピを選択してください。</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

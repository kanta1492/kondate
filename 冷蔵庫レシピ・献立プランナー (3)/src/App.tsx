/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import FridgeManager from './components/FridgeManager';
import RecipeSuggestor from './components/RecipeSuggestor';
import MealPlanner from './components/MealPlanner';
import ShoppingList from './components/ShoppingList';
import { FridgeItem, Recipe, PlannedMeal, ShoppingItem, User, RecommendQuickItem, NotificationItem } from './types';
import { INITIAL_FRIDGE_ITEMS, RECOMMEND_QUICK_ITEMS } from './data';
import { Sparkles, Calendar, BookOpen, Clock, Lightbulb, Inbox, HelpCircle } from 'lucide-react';
import AuthModal from './components/AuthModal';
import AdminPanel from './components/AdminPanel';
import NotificationToasts from './components/NotificationToasts';
import { syncUserToDb, getAllUsersFromDb, syncUserStatesToDb, getUserStatesFromDb } from './lib/supabase.ts';

export default function App() {
  // Auth & Admin states integration (Moved to top)
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = sessionStorage.getItem('shufu_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing shufu_current_user', e);
      }
    }
    return null;
  });

  // 1. App Active Tab State
  const [activeTab, setActiveTab] = useState<'fridge' | 'recipes' | 'planner' | 'shopping'>('fridge');

  // Internal states for isolated user storage
  const [fridgeItems, setFridgeItemsInternal] = useState<FridgeItem[]>([]);
  const [selectedIngredientIds, setSelectedIngredientIds] = useState<string[]>([]);
  const [recipes, setRecipesInternal] = useState<Recipe[]>([]);
  const [plannedMeals, setPlannedMealsInternal] = useState<PlannedMeal[]>([]);
  const [shoppingItems, setShoppingItemsInternal] = useState<ShoppingItem[]>([]);
  const [notifications, setNotificationsInternal] = useState<NotificationItem[]>([]);
  const [userItemHistory, setUserItemHistoryInternal] = useState<{name: string, category: FridgeItem['category'], quantity: string}[]>([]);
  const [stateReloadVersion, setStateReloadVersion] = useState<number>(0);

  const handleRefreshData = () => {
    setStateReloadVersion(prev => prev + 1);
  };

  // Safe setter replacements that automatically sandbox to currentUser's namespace
  const setFridgeItems = (newItems: FridgeItem[] | ((prev: FridgeItem[]) => FridgeItem[])) => {
    if (!currentUser) return;
    const userId = currentUser.id;
    setFridgeItemsInternal(prev => {
      const updated = typeof newItems === 'function' ? newItems(prev) : newItems;
      localStorage.setItem(`shufu_fridge_items_${userId}`, JSON.stringify(updated));
      syncUserStatesToDb(userId, { fridge_items: updated }).catch(e => console.error("Sync error:", e));
      return updated;
    });
  };

  const setRecipes = (newRecipes: Recipe[] | ((prev: Recipe[]) => Recipe[])) => {
    if (!currentUser) return;
    const userId = currentUser.id;
    setRecipesInternal(prev => {
      const updated = typeof newRecipes === 'function' ? newRecipes(prev) : newRecipes;
      localStorage.setItem(`shufu_recipes_${userId}`, JSON.stringify(updated));
      syncUserStatesToDb(userId, { recipes: updated }).catch(e => console.error("Sync error:", e));
      return updated;
    });
  };

  const setPlannedMeals = (newMeals: PlannedMeal[] | ((prev: PlannedMeal[]) => PlannedMeal[])) => {
    if (!currentUser) return;
    const userId = currentUser.id;
    setPlannedMealsInternal(prev => {
      const updated = typeof newMeals === 'function' ? newMeals(prev) : newMeals;
      localStorage.setItem(`shufu_planned_meals_${userId}`, JSON.stringify(updated));
      syncUserStatesToDb(userId, { planned_meals: updated }).catch(e => console.error("Sync error:", e));
      return updated;
    });
  };

  const setShoppingItems = (newShopping: ShoppingItem[] | ((prev: ShoppingItem[]) => ShoppingItem[])) => {
    if (!currentUser) return;
    const userId = currentUser.id;
    setShoppingItemsInternal(prev => {
      const updated = typeof newShopping === 'function' ? newShopping(prev) : newShopping;
      localStorage.setItem(`shufu_shopping_items_${userId}`, JSON.stringify(updated));
      syncUserStatesToDb(userId, { shopping_items: updated }).catch(e => console.error("Sync error:", e));
      return updated;
    });
  };

  const setNotifications = (newNotifs: NotificationItem[] | ((prev: NotificationItem[]) => NotificationItem[])) => {
    if (!currentUser) return;
    const userId = currentUser.id;
    setNotificationsInternal(prev => {
      const updated = typeof newNotifs === 'function' ? newNotifs(prev) : newNotifs;
      localStorage.setItem(`shufu_notifications_${userId}`, JSON.stringify(updated));
      syncUserStatesToDb(userId, { notifications: updated }).catch(e => console.error("Sync error:", e));
      return updated;
    });
  };

  const setUserItemHistory = (newHistory: {name: string, category: FridgeItem['category'], quantity: string}[] | ((prev: {name: string, category: FridgeItem['category'], quantity: string}[]) => {name: string, category: FridgeItem['category'], quantity: string}[])) => {
    if (!currentUser) return;
    const userId = currentUser.id;
    setUserItemHistoryInternal(prev => {
      const updated = typeof newHistory === 'function' ? newHistory(prev) : newHistory;
      localStorage.setItem(`shufu_user_item_history_${userId}`, JSON.stringify(updated));
      syncUserStatesToDb(userId, { user_item_history: updated }).catch(e => console.error("Sync error:", e));
      return updated;
    });
  };

  // One-time deletion of previously registered food items as requested by user ("これまで登録した食材はいらないから消して")
  useEffect(() => {
    const cleared = sessionStorage.getItem('shufu_fridge_items_wiped_v1');
    if (!cleared) {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('shufu_fridge_items_') || key === 'shufu_fridge_items')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
      } catch (e) {
        console.error(e);
      }
      setFridgeItemsInternal([]);
      setSelectedIngredientIds([]);
      sessionStorage.setItem('shufu_fridge_items_wiped_v1', 'true');
    }
  }, []);

  // Synchronize users from persistent Cloud Firestore database on application startup
  useEffect(() => {
    getAllUsersFromDb()
      .then((dbUsers) => {
        if (dbUsers && dbUsers.length > 0) {
          const saved = localStorage.getItem('shufu_registered_users');
          let localUsers: User[] = [];
          if (saved) {
            try {
              localUsers = JSON.parse(saved);
            } catch (e) {
              console.error(e);
            }
          }
          const mergedMap = new Map<string, User>();
          localUsers.forEach(u => mergedMap.set(u.email.toLowerCase(), u));
          dbUsers.forEach(u => mergedMap.set(u.email.toLowerCase(), u));
          const list = Array.from(mergedMap.values());
          localStorage.setItem('shufu_registered_users', JSON.stringify(list));
        }
      })
      .catch((err) => {
        console.error("Database startup user synchronization failed:", err);
      });
  }, [stateReloadVersion]);

  // Safe user registration state loader trigger (Load / sync isolated states of current active account)
  useEffect(() => {
    if (!currentUser) {
      setFridgeItemsInternal([]);
      setRecipesInternal([]);
      setPlannedMealsInternal([]);
      setShoppingItemsInternal([]);
      setNotificationsInternal([]);
      setUserItemHistoryInternal([]);
      setSelectedIngredientIds([]);
      return;
    }

    const userId = currentUser.id;

    // Load custom states centrally from Supabase DB to ensure cross-device consistency
    getUserStatesFromDb(userId)
      .then((dbState) => {
        if (dbState) {
          const fItems = dbState.fridge_items || [];
          const sItems = dbState.shopping_items || [];
          const pMeals = dbState.planned_meals || [];
          const mNotifs = dbState.notifications || [];
          const sHist = dbState.user_item_history || [];
          const rcps = dbState.recipes || [];

          // Keep client cache in sync for safety
          localStorage.setItem(`shufu_fridge_items_${userId}`, JSON.stringify(fItems));
          localStorage.setItem(`shufu_shopping_items_${userId}`, JSON.stringify(sItems));
          localStorage.setItem(`shufu_planned_meals_${userId}`, JSON.stringify(pMeals));
          localStorage.setItem(`shufu_notifications_${userId}`, JSON.stringify(mNotifs));
          localStorage.setItem(`shufu_user_item_history_${userId}`, JSON.stringify(sHist));
          localStorage.setItem(`shufu_recipes_${userId}`, JSON.stringify(rcps));

          setFridgeItemsInternal(fItems);
          setShoppingItemsInternal(sItems);
          setPlannedMealsInternal(pMeals);
          setNotificationsInternal(mNotifs);
          setUserItemHistoryInternal(sHist);
          setRecipesInternal(rcps);
          setSelectedIngredientIds(fItems.map((item: any) => item.id));
        } else {
          // Fallback to localStorage if no DB states exist yet
          const savedFridge = localStorage.getItem(`shufu_fridge_items_${userId}`);
          if (savedFridge) {
            try { setFridgeItemsInternal(JSON.parse(savedFridge)); } catch (e) { setFridgeItemsInternal(INITIAL_FRIDGE_ITEMS); }
          } else {
            setFridgeItemsInternal(INITIAL_FRIDGE_ITEMS);
            localStorage.setItem(`shufu_fridge_items_${userId}`, JSON.stringify(INITIAL_FRIDGE_ITEMS));
          }

          const savedRecipes = localStorage.getItem(`shufu_recipes_${userId}`);
          if (savedRecipes) {
            try { setRecipesInternal(JSON.parse(savedRecipes)); } catch (e) { setRecipesInternal([]); }
          } else {
            setRecipesInternal([]);
          }

          const savedMeals = localStorage.getItem(`shufu_planned_meals_${userId}`);
          if (savedMeals) {
            try { setPlannedMealsInternal(JSON.parse(savedMeals)); } catch (e) { setPlannedMealsInternal([]); }
          } else {
            setPlannedMealsInternal([]);
          }

          const savedShopping = localStorage.getItem(`shufu_shopping_items_${userId}`);
          if (savedShopping) {
            try { setShoppingItemsInternal(JSON.parse(savedShopping)); } catch (e) { setShoppingItemsInternal([]); }
          } else {
            setShoppingItemsInternal([]);
          }

          const savedNotifications = localStorage.getItem(`shufu_notifications_${userId}`);
          if (savedNotifications) {
            try { setNotificationsInternal(JSON.parse(savedNotifications)); } catch (e) { setNotificationsInternal([]); }
          } else {
            const val: NotificationItem[] = [
              {
                id: `welcome_notice_${userId}`,
                title: '🎉 システム始動',
                message: `「AI献立」が稼働しました。${currentUser.name}様、食材の期限確認や、AIレシピ提案をいつでもご利用いただけます！`,
                type: 'info',
                timestamp: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
                read: false,
              }
            ];
            setNotificationsInternal(val);
            localStorage.setItem(`shufu_notifications_${userId}`, JSON.stringify(val));
          }

          const savedHistory = localStorage.getItem(`shufu_user_item_history_${userId}`);
          if (savedHistory) {
            try { setUserItemHistoryInternal(JSON.parse(savedHistory)); } catch (e) { setUserItemHistoryInternal([]); }
          } else {
            setUserItemHistoryInternal([]);
          }

          const finalFridge = savedFridge ? JSON.parse(savedFridge) : INITIAL_FRIDGE_ITEMS;
          setSelectedIngredientIds(finalFridge.map((item: any) => item.id));
        }
      })
      .catch((err) => {
        console.error("Failed to fetch user state from Supabase, failing back to localStorage:", err);
        const savedFridge = localStorage.getItem(`shufu_fridge_items_${userId}`);
        if (savedFridge) {
          try { setFridgeItemsInternal(JSON.parse(savedFridge)); } catch (e) { setFridgeItemsInternal(INITIAL_FRIDGE_ITEMS); }
        } else {
          setFridgeItemsInternal(INITIAL_FRIDGE_ITEMS);
        }
      });
  }, [currentUser?.id, stateReloadVersion]);

  const [toasts, setToasts] = useState<NotificationItem[]>([]);

  const addNotification = (
    title: string,
    message: string,
    type: NotificationItem['type'] = 'info'
  ) => {
    const timestampStr = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newNotif: NotificationItem = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      title,
      message,
      type,
      timestamp: timestampStr,
      read: false,
    };
    
    // Add to history (calls sandbox safe wrapper)
    setNotifications(prev => [newNotif, ...prev]);

    // Push into floating toasts rendering
    const toastId = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    setToasts(prev => [{ ...newNotif, id: toastId }, ...prev].slice(0, 5));

    // Clear after 1.5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toastId));
    }, 1500);
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => n.read ? n : { ...n, read: true }));
    addNotification('✔ 全て既読', '通知一覧のすべての未読項目を既読にしました。', 'info');
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
    addNotification('🧹 通知の全クリア', 'すべての通知履歴を消去しました。', 'info');
  };

  const handleRemoveNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const [presetItems, setPresetItems] = useState<RecommendQuickItem[]>(() => {
    const saved = localStorage.getItem('shufu_recommend_items');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing shufu_recommend_items', e);
      }
    }
    return [...RECOMMEND_QUICK_ITEMS];
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('shufu_recommend_items', JSON.stringify(presetItems));
  }, [presetItems]);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    const timestampStr = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newNotif: NotificationItem = {
      id: `notif_${Date.now()}`,
      title: '🔑 ログイン完了',
      message: `セキュリティを確立し、${user.name}様として活動のセキュアセッションを開始しました。`,
      type: 'success',
      timestamp: timestampStr,
      read: false,
    };
    
    // Write under this user's notifications slot
    setNotificationsInternal(prev => [newNotif, ...prev]);
    localStorage.setItem(`shufu_notifications_${user.id}`, JSON.stringify([newNotif, ...notifications]));
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleTriggerAdminPrivilege = () => {
    if (currentUser) {
      const updatedUser: User = {
        ...currentUser,
        role: 'admin',
      };
      
      try {
        const saved = localStorage.getItem('shufu_registered_users');
        if (saved) {
          const users = JSON.parse(saved) as any[];
          const updatedUsers = users.map(u => u.id === currentUser.id ? { ...u, role: 'admin' } : u);
          localStorage.setItem('shufu_registered_users', JSON.stringify(updatedUsers));
        }
      } catch (e) {
        console.error(e);
      }

      syncUserToDb(updatedUser).catch(err => {
        console.error("Failed to sync elevated admin profile:", err);
      });

      setCurrentUser(updatedUser);

      const timestampStr = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const newNotif: NotificationItem = {
        id: `notif_${Date.now()}`,
        title: '🛡️ 管理者権限発行',
        message: '管理者権限を自動でシステム発行しました。全登録メンバーの閲覧・監視が可能です。',
        type: 'success',
        timestamp: timestampStr,
        read: false,
      };
      setNotificationsInternal(prev => [newNotif, ...prev]);
    } else {
      const adminId = `admin_${Date.now()}`;
      const newAdmin: User = {
        id: adminId,
        name: 'システムテスト管理者',
        email: `test_admin_${Math.floor(Math.random() * 1000)}@shufu.live`,
        role: 'admin',
      };

      try {
        const saved = localStorage.getItem('shufu_registered_users');
        const users = saved ? (JSON.parse(saved) as any[]) : [];
        const isDup = users.some(u => u.email.toLowerCase() === newAdmin.email.toLowerCase());
        if (!isDup) {
          const storeUser = { ...newAdmin, password: 'password123' };
          localStorage.setItem('shufu_registered_users', JSON.stringify([...users, storeUser]));
          syncUserToDb(storeUser).catch(err => {
            console.error("Failed to sync new admin account:", err);
          });
        }
      } catch (e) {
        console.error(e);
      }

      setCurrentUser(newAdmin);

      const timestampStr = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const newNotif: NotificationItem = {
        id: `notif_${Date.now()}`,
        title: '🛡️ 管理者権限を即時発行',
        message: 'お持ちのブラウザ、スマートフォン向けに、管理者テストアカウント「システムテスト管理者」を自動で発行してログインしました。',
        type: 'success',
        timestamp: timestampStr,
        read: false,
      };
      setNotificationsInternal(prev => [newNotif, ...prev]);
    }
  };

  // (Authentication states and handlers are successfully managed at the top-level)

  // Synchronous automated consumer expiry notifications checks
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    fridgeItems.forEach(item => {
      if (item.expiryDate) {
        const expiry = new Date(item.expiryDate);
        expiry.setHours(0, 0, 0, 0);
        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Warn if expiring today or in <=3 days, and we haven't warned in notifications logs yet
        if (diffDays >= 0 && diffDays <= 3) {
          const uniqueId = `notif_expiry_${item.id}_${diffDays}`;
          setNotifications(prev => {
            const hasAlert = prev.some(n => n.id === uniqueId);
            if (!hasAlert) {
              const alertMsg = diffDays === 0
                ? `🚨 期限限界：食材「${item.name}」の賞味期限は今日までとなっています！今夜使い切りましょう！`
                : `⌛ 期限警告：食材「${item.name}」の賞味期限があと ${diffDays} 日となっています！`;
              
              const newNotif: NotificationItem = {
                id: uniqueId,
                title: '⌛ 食材期限アラート',
                message: alertMsg,
                type: 'warning',
                timestamp: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
                read: false
              };
              
              // Also trigger a transient toast
              const toastId = `toast_${Date.now()}_exp_${item.id}`;
              setToasts(toastPrev => [...toastPrev, { ...newNotif, id: toastId }].slice(0, 5));
              setTimeout(() => {
                setToasts(prevToast => prevToast.filter(t => t.id !== toastId));
              }, 1500);

              return [newNotif, ...prev];
            }
            return prev;
          });
        }
      }
    });
  }, [fridgeItems]);

  const handleUpdatePresets = (newPresets: RecommendQuickItem[]) => {
    setPresetItems(newPresets);
  };

  const handleRestorePresetsDefault = () => {
    setPresetItems([...RECOMMEND_QUICK_ITEMS]);
  };

  // (ユーザー固有の食材履歴メモリはトップレベルで安全に管理されています)

  // --- Fridge handlers ---
  const handleAddFridgeItem = (newItem: Omit<FridgeItem, 'id' | 'addedDate'>) => {
    const item: FridgeItem = {
      ...newItem,
      id: `fridge_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      addedDate: new Date().toISOString().split('T')[0],
    };
    setFridgeItems(prev => [item, ...prev]);

    // 追加した食材データを自動的に選択させ、AIが即座にレシピ提案の対象にする
    setSelectedIngredientIds(prev => [item.id, ...prev]);

    addNotification(
      '🥬 食材を登録しました',
      `冷蔵庫に［${newItem.name} (${newItem.quantity})］を新規登録しました。${newItem.expiryDate ? '（消費期限: ' + newItem.expiryDate + '）' : ''}`,
      'success'
    );

    // 追加した食材データを記憶データベース（学習履歴）に保存
    setUserItemHistory(prev => {
      const filtered = prev.filter(x => x.name.trim() !== newItem.name.trim());
      const updated = [{ name: newItem.name.trim(), category: newItem.category, quantity: newItem.quantity }, ...filtered];
      localStorage.setItem('shufu_user_item_history', JSON.stringify(updated));
      return updated;
    });
  };

  // 冷蔵庫をまっさらに空にするハンドラー
  const handleClearFridge = () => {
    setFridgeItems([]);
    setSelectedIngredientIds([]);
    addNotification(
      '🧹 冷蔵庫を取り消し・空にしました',
      '冷蔵庫の中身を空にし、選択中のすべてのスマート食材判定を解除しました。',
      'info'
    );
  };

  // 食材学習記憶（履歴）を個別に削除する
  const handleRemoveHistoryItem = (nameToRemove: string) => {
    setUserItemHistory(prev => {
      const updated = prev.filter(x => x.name !== nameToRemove);
      localStorage.setItem('shufu_user_item_history', JSON.stringify(updated));
      return updated;
    });
  };

  const handleRemoveFridgeItem = (id: string) => {
    const target = fridgeItems.find(item => item.id === id);
    setFridgeItems(prev => prev.filter(item => item.id !== id));
    setSelectedIngredientIds(prev => prev.filter(item => item !== id));

    if (target) {
      addNotification(
        '🗑 食材を削除しました',
        `［${target.name}］を冷蔵庫の保管リストから削除しました。`,
        'info'
      );
    }
  };

  const handleUpdateFridgeQty = (id: string, qty: string) => {
    const target = fridgeItems.find(item => item.id === id);
    setFridgeItems(prev => prev.map(item => item.id === id ? { ...item, quantity: qty } : item));

    if (target) {
      addNotification(
        '✏ 食材の数量を更新しました',
        `［${target.name}］の残量を「${target.quantity}」から「${qty}」へ更新しました。`,
        'success'
      );
    }
  };

  // --- Recipe handlers ---
  const handleSetRecipes = (newRecipes: Recipe[]) => {
    setRecipes(newRecipes);
    if (newRecipes.length > 0) {
      addNotification(
        '✨ AIレシピを提案しました',
        `AIが選択した食材を分析し、今日の特選献立レシピを ${newRecipes.length} 品提案しました！`,
        'success'
      );
    }
  };

  const handleAddToShopping = (ingredients: { name: string; amount: string }[], recipeTitle: string) => {
    // Generate new shopping items
    const newItems: ShoppingItem[] = ingredients.map(ing => ({
      id: `shop_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: ing.name,
      quantity: ing.amount,
      checked: false,
      relatedRecipeId: recipeTitle,
    }));
    setShoppingItems(prev => [...prev, ...newItems]);

    addNotification(
      '🛍 不足食材を買い物リストへ集約',
      `『${recipeTitle}』の調理に不足する ${newItems.length} 個の食材をお買い物リストへ追加しました。`,
      'success'
    );
  };

  const handlePlanMeal = (recipe: Recipe, date: string, mealType: PlannedMeal['mealType']) => {
    const newMeal: PlannedMeal = {
      id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      date,
      mealType,
      recipeId: recipe.id,
      customTitle: recipe.title,
      recipe,
    };
    setPlannedMeals(prev => [newMeal, ...prev]);

    const mealTypeLabels = {
      breakfast: '朝食',
      lunch: '昼食',
      dinner: '夕食',
      snack: 'おやつ'
    };
    addNotification(
      '📅 献立カレンダーに登録',
      `［${date} の${mealTypeLabels[mealType] || 'お食事'}］として『${recipe.title}』をスケジュールへ登録しました。`,
      'success'
    );
  };

  // --- Meal Planner handlers ---
  const handleAddPlannedMeal = (newMeal: Omit<PlannedMeal, 'id'>) => {
    const meal: PlannedMeal = {
      ...newMeal,
      id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    };
    setPlannedMeals(prev => [meal, ...prev]);

    const mealTypeLabels = {
      breakfast: '朝食',
      lunch: '昼食',
      dinner: '夕食',
      snack: 'おやつ'
    };
    addNotification(
      '📅 手動でのおすすめ献立登録',
      `［${meal.date} の${mealTypeLabels[meal.mealType]}］に献立『${meal.customTitle || '自由メニュー'}』を追加しました。`,
      'success'
    );
  };

  const handleRemovePlannedMeal = (id: string) => {
    const target = plannedMeals.find(pm => pm.id === id);
    setPlannedMeals(prev => prev.filter(pm => pm.id !== id));

    if (target) {
      addNotification(
        '🗑 予定のスケジュール解除',
        `［${target.date}］に登録されていた『${target.customTitle || target.recipe?.title}』の予定を削除しました。`,
        'info'
      );
    }
  };

  // --- Shopping List handlers ---
  const handleAddShoppingItem = (name: string, quantity: string) => {
    const item: ShoppingItem = {
      id: `shop_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name,
      quantity,
      checked: false,
    };
    setShoppingItems(prev => [...prev, item]);

    addNotification(
      '📝 リストに品目を追加しました',
      `買い出し品目［${name} (${quantity})］を新しくお買い物リストに登録しました。`,
      'success'
    );
  };

  const handleToggleShoppingItem = (id: string) => {
    let isChecked = false;
    let target: ShoppingItem | undefined;

    setShoppingItems(prev => prev.map(item => {
      if (item.id === id) {
        isChecked = !item.checked;
        target = item;
        return { ...item, checked: isChecked };
      }
      return item;
    }));

    if (target) {
      if (isChecked) {
        // Automatically add to Fridge when shopping item is checked (purchased)!
        const expiryDateStr = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        // Call fridge insert internally!
        const fridgeId = `fridge_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
        setFridgeItems(prev => [
          {
            id: fridgeId,
            name: target!.name,
            category: 'other',
            quantity: target!.quantity,
            addedDate: new Date().toISOString().split('T')[0],
            expiryDate: expiryDateStr
          },
          ...prev
        ]);

        // お買い物完了で冷蔵庫に入ったアイテムも自動でチェックオン（選択状態）にする
        setSelectedIngredientIds(prev => [fridgeId, ...prev]);

        addNotification(
          '🛒 買い出しを完了しました',
          `［${target.name}］の買い出しをチェック完了とし、冷蔵庫へ数量「${target.quantity}」そのまま保存しました（消費期限目安: 7日後）。`,
          'success'
        );
      } else {
        addNotification(
          '📝 チェックを外しました',
          `お買い物項目［${target.name}］を未購入状態に戻しました。`,
          'info'
        );
      }
    }
  };

  const handleRemoveShoppingItem = (id: string) => {
    const target = shoppingItems.find(item => item.id === id);
    setShoppingItems(prev => prev.filter(item => item.id !== id));

    if (target) {
      addNotification(
        '🗑 買い物リストから削除しました',
        `［${target.name}］をお買い物リストから取り除きました。`,
        'info'
      );
    }
  };

  const handleClearCheckedShopping = () => {
    setShoppingItems(prev => prev.filter(item => !item.checked));
    addNotification(
      '🧹 チェック済みの整理',
      '購入完了したお買い物アイテムをまとめてリストから消去しました。',
      'info'
    );
  };

  // Navigation action helper from Fridge screen to Recipe prompt list
  const handleNavigateToRecipes = () => {
    const targetEl = document.getElementById('recipe-suggestor-section');
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth' });
    } else {
      setActiveTab('recipes');
    }
  };

  // Quick Expiring counter calculations
  const getExpiringSoonCount = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return fridgeItems.filter(item => {
      if (!item.expiryDate) return false;
      const expiry = new Date(item.expiryDate);
      expiry.setHours(0, 0, 0, 0);
      const diffTime = expiry.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 3; // within 3 days or today
    }).length;
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center font-sans antialiased p-4 relative overflow-hidden">
        {/* Dynamic decorative blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-sage-200/30 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-100/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-full max-w-md relative z-10 flex flex-col items-center">
          {/* Logo Title Group */}
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="bg-sage-600 text-white p-3.5 rounded-2xl shadow-md flex items-center justify-center mb-3">
              <span className="text-2xl font-bold">🍳</span>
            </div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">AI献立</h1>
            <p className="text-xs text-gray-400 mt-1 font-medium">セキュリティ保護されたブラウザセッション管理</p>
          </div>

          <AuthModal
            isOpen={true}
            onClose={() => {}}
            onLoginSuccess={handleLoginSuccess}
            fullScreenMode={true}
            onTriggerAdminPrivilege={handleTriggerAdminPrivilege}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sage-50/50 flex flex-col font-sans antialiased pb-12">
      {/* Interactive header and Top navigation ribbon */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        fridgeCount={fridgeItems.length}
        expiringSoonCount={getExpiringSoonCount()}
        shoppingCount={shoppingItems.filter(i => !i.checked).length}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onOpenAdmin={() => setIsAdminPanelOpen(true)}
        onTriggerAdminPrivilege={handleTriggerAdminPrivilege}
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onClearAllNotifications={handleClearAllNotifications}
        onRemoveNotification={handleRemoveNotification}
      />

      {/* Main Container Content */}
      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-3 md:py-6 flex-1 w-full">
        {/* Simple Welcome Banner */}
        <div id="motivation-welcome-banner" className="mb-4 md:mb-6 bg-sage-600 rounded-2xl p-4 text-white shadow-3xs relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-3 text-left">
          <div className="relative z-10 max-w-2xl text-center md:text-left">
            <h2 className="text-[11px] sm:text-xs md:text-sm font-bold flex items-center justify-center md:justify-start gap-1.5 mb-1">
              冷蔵庫の食材から、今日のメニューをスマートに
            </h2>
            <p className="text-[10px] md:text-xs text-sage-100 font-medium leading-relaxed">
              今ある食材を選択して「AIレシピ提案」を呼び出すと、無駄のないレシピアイデアや食材の代案をGeminiが即座に提案します。食品ロスを減らし、日々の献立決定をスムーズに。
            </p>
          </div>

          <div className="shrink-0 flex gap-1.5 relative z-10">
            <span className="text-[9.5px] md:text-xs bg-white/10 text-white border border-white/12 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1">
              <Clock className="h-3 w-3 text-sage-100" />
              手軽な時短調理
            </span>
            <span className="text-[9.5px] md:text-xs bg-white/10 text-white border border-white/12 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1">
              <Lightbulb className="h-3 w-3 text-sage-100" />
              代用アイデア
            </span>
          </div>
        </div>

        {/* Dynamic Views Rendering based on active tabs */}
        <div className="fade-in-container" id="main-view-holder">
          {activeTab === 'fridge' && (
            <FridgeManager
              items={fridgeItems}
              onAddItem={handleAddFridgeItem}
              onRemoveItem={handleRemoveFridgeItem}
              onUpdateQuantity={handleUpdateFridgeQty}
              selectedIds={selectedIngredientIds}
              setSelectedIds={setSelectedIngredientIds}
              onNavigateToRecipes={handleNavigateToRecipes}
              userItemHistory={userItemHistory}
              onClearFridge={handleClearFridge}
              onRemoveHistoryItem={handleRemoveHistoryItem}
              presetItems={presetItems}
            />
          )}

          {activeTab === 'recipes' && (
            <RecipeSuggestor
              fridgeItems={fridgeItems}
              selectedIngredientIds={selectedIngredientIds}
              recipes={recipes}
              onSetRecipes={handleSetRecipes}
              onAddToShopping={handleAddToShopping}
              onPlanMeal={handlePlanMeal}
            />
          )}

          {activeTab === 'planner' && (
            <MealPlanner
              plannedMeals={plannedMeals}
              recipes={recipes}
              onAddPlannedMeal={handleAddPlannedMeal}
              onRemovePlannedMeal={handleRemovePlannedMeal}
            />
          )}

          {activeTab === 'shopping' && (
            <ShoppingList
              itemList={shoppingItems}
              onAddItem={handleAddShoppingItem}
              onToggleItem={handleToggleShoppingItem}
              onRemoveItem={handleRemoveShoppingItem}
              onClearChecked={handleClearCheckedShopping}
            />
          )}
        </div>
      </main>

      {/* Sweet footer */}
      <footer className="mt-16 text-center border-t border-sage-100 pt-6 text-xs text-gray-400">
        <p className="font-semibold text-gray-500">AI献立 © 2026</p>
        <p className="mt-1">今ある食材を活かす、スマートな献立づくりをサポートします。</p>
      </footer>

      {/* Auth Modal Popup Overlay */}
      <AuthModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Admin Panel Controls Overlay */}
      <AdminPanel
        isOpen={isAdminPanelOpen && currentUser?.role === 'admin'}
        onClose={() => setIsAdminPanelOpen(false)}
        presetItems={presetItems}
        onUpdatePresets={handleUpdatePresets}
        onRestorePresetsDefault={handleRestorePresetsDefault}
        fridgeItemsCount={fridgeItems.length}
        userItemHistoryCount={userItemHistory.length}
        onRefreshData={handleRefreshData}
      />

      {/* Dynamic floating notifications stack */}
      <NotificationToasts 
        toasts={toasts} 
        onDismiss={(id) => setToasts(prev => prev.filter(t => t.id !== id))} 
      />
    </div>
  );
}

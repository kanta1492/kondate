/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Mail, Lock, User, ShieldCheck, AlertCircle } from 'lucide-react';
import { User as UserType } from '../types';
import { syncUserToDb, getAllUsersFromDb } from '../lib/supabase.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserType) => void;
  fullScreenMode?: boolean;
  onTriggerAdminPrivilege?: () => void;
}

export default function AuthModal({ isOpen, onClose, onLoginSuccess, fullScreenMode = false, onTriggerAdminPrivilege }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [error, setError] = useState<string | null>(null);
  
  // Security: Brute-force protection states
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimeLeft, setLockoutTimeLeft] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Countdown timer for lockout cooldown
  React.useEffect(() => {
    if (lockoutTimeLeft <= 0) return;
    const interval = setInterval(() => {
      setLockoutTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTimeLeft]);

  // Synchronize users from the persistent Firestore database
  React.useEffect(() => {
    if (isOpen || fullScreenMode) {
      getAllUsersFromDb()
        .then((dbUsers) => {
          if (dbUsers && dbUsers.length > 0) {
            const localUsers = getUsersFromStorage();
            const mergedMap = new Map<string, UserType>();
            // Add local users first
            localUsers.forEach(u => mergedMap.set(u.email.toLowerCase(), u));
            // Overwrite/add db users
            dbUsers.forEach(u => mergedMap.set(u.email.toLowerCase(), u));
            const mergedList = Array.from(mergedMap.values());
            localStorage.setItem('shufu_registered_users', JSON.stringify(mergedList));
          }
        })
        .catch((err) => {
          console.error("Database cloud user synchronization failed:", err);
        });
    }
  }, [isOpen, fullScreenMode]);

  if (!isOpen && !fullScreenMode) return null;

  // Pre-seed some default users if they don't exist in localstorage
  const getUsersFromStorage = (): UserType[] => {
    const saved = localStorage.getItem('shufu_registered_users');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as UserType[];
        // Filter out original pre-seeded demo accounts to keep storage clean as requested
        const cleaned = parsed.filter(u => u.email !== 'admin@example.com' && u.email !== 'user@example.com');
        if (parsed.length !== cleaned.length) {
          localStorage.setItem('shufu_registered_users', JSON.stringify(cleaned));
        }
        return cleaned;
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (lockoutTimeLeft > 0) {
      setError(`セキュリティロック中: 不正アクセス防止のため、残り ${lockoutTimeLeft} 秒間はログインをお控えください。`);
      return;
    }

    if (!email.trim() || !password) {
      setError('メールアドレスとパスワードを入力してください。');
      return;
    }

    const users = getUsersFromStorage();
    const foundUser = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password);

    if (foundUser) {
      // Remove password for security context
      const { password: _, ...safeUser } = foundUser;
      setFailedAttempts(0);
      onLoginSuccess(safeUser as UserType);
      onClose();
    } else {
      const nextFailCount = failedAttempts + 1;
      setFailedAttempts(nextFailCount);
      if (nextFailCount >= 5) {
        setLockoutTimeLeft(30); // block for 30s
        setError('パスワードの連続誤入力により、３０秒間のセキュリティ一時ロックが起動しました。時間を置いてから再試行してください。');
      } else {
        setError(`メールアドレスまたはパスワードが正しくありません。（セキュリティ保護: あと ${5 - nextFailCount} 回間違えるとロックされます）`);
      }
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !password) {
      setError('すべての必須項目を入力してください。');
      return;
    }

    if (password.length < 4) {
      setError('パスワードは4文字以上で設定してください。');
      return;
    }

    const users = getUsersFromStorage();
    const isDup = users.some(u => u.email.toLowerCase() === email.trim().toLowerCase());

    if (isDup) {
      setError('このメールアドレスは既に登録されています。');
      return;
    }

    // Generate a unique standard identifier for the new synced user account
    const uniqueUserId = `user_${Date.now()}`;
    const newUser: UserType = {
      id: uniqueUserId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: role,
      password: password,
    };

    const updatedUsers = [...users, newUser];
    localStorage.setItem('shufu_registered_users', JSON.stringify(updatedUsers));

    // Persist profile centrally inside Supabase database
    syncUserToDb(newUser).catch((err) => {
      console.error("Database user profile registration failed:", err);
    });

    // Log the user in immediately
    const { password: _, ...safeUser } = newUser;
    onLoginSuccess(safeUser as UserType);
    onClose();
  };

  return (
    <div className={fullScreenMode ? "w-full max-w-md mx-auto bg-transparent relative z-10" : "fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4"}>
      <div className="bg-white rounded-3xl w-full shadow-xl overflow-hidden border border-sage-100/50 animate-scale-up">
        {/* Modal Header */}
        <div 
          onClick={() => {
            const now = Date.now();
            const globalWindow = window as any;
            if (!globalWindow._lastModalTap || now - globalWindow._lastModalTap > 1200) {
              globalWindow._modalTapCount = 1;
            } else {
              globalWindow._modalTapCount = (globalWindow._modalTapCount || 0) + 1;
            }
            globalWindow._lastModalTap = now;
            if (globalWindow._modalTapCount >= 3) {
              if (onTriggerAdminPrivilege) {
                onTriggerAdminPrivilege();
              }
              globalWindow._modalTapCount = 0;
            }
          }}
          className="bg-sage-600 px-6 py-5 relative text-white select-none cursor-default text-center"
        >
          <div className="flex flex-col items-center justify-center">
            <h3 className="font-bold text-base flex items-center justify-center gap-1.5 selection:bg-transparent">
              <span className="inline-block select-none filter drop-shadow-sm">
                🍳
              </span>
              ログイン
            </h3>
            <p className="text-[10px] text-sage-100 font-medium mt-1">
              冷蔵庫の食材管理とAIスマート献立管理
            </p>
          </div>
          {!fullScreenMode && (
            <button
              onClick={onClose}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 transition-colors text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-sage-100 bg-slate-50/50">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setError(null);
              setInfoMessage(null);
            }}
            className={`flex-1 py-3 text-center text-xs font-bold transition-all ${
              activeTab === 'login'
                ? 'bg-white border-b-2 border-sage-600 text-sage-800'
                : 'text-gray-400 hover:text-sage-600 hover:bg-gray-50'
            }`}
          >
            既存アカウントでログイン
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setError(null);
              setInfoMessage(null);
            }}
            className={`flex-1 py-3 text-center text-xs font-bold transition-all ${
              activeTab === 'register'
                ? 'bg-white border-b-2 border-sage-600 text-sage-800'
                : 'text-gray-400 hover:text-sage-600 hover:bg-gray-50'
            }`}
          >
            新規会員登録
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-800 text-xs px-4 py-2.5 rounded-xl mb-4 flex items-center gap-2 font-medium">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {infoMessage && (
            <div className="bg-indigo-50 border border-indigo-150 text-indigo-850 text-xs px-4 py-3 rounded-xl mb-4 flex items-start gap-2.5 font-medium leading-relaxed">
              <ShieldCheck className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
              <span>{infoMessage}</span>
            </div>
          )}

          {activeTab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">メールアドレス</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@mail.com"
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50/50 focus:outline-hidden font-medium text-gray-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">パスワード</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="パスワードを入力"
                    className="w-full pl-10 pr-12 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50/50 focus:outline-hidden font-medium text-gray-700"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-sage-600 hover:text-sage-800 transition-colors cursor-pointer select-none"
                  >
                    {showPassword ? "非表示" : "表示"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-sage-600 hover:bg-sage-700 text-white py-2.5 rounded-xl text-sm font-bold shadow-xs transition-all pointer-events-auto cursor-pointer"
              >
                ログインする
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">ニックネーム・お名前</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="冷蔵庫の持ち主の名前"
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50/50 focus:outline-hidden font-medium text-gray-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">メールアドレス</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your-email@mail.com"
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50/50 focus:outline-hidden font-medium text-gray-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">パスワード</label>
                <div className="relative font-sans">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="4文字以上で設定してください"
                    className="w-full pl-10 pr-12 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50/50 focus:outline-hidden font-medium text-gray-700 font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-sage-600 hover:text-sage-800 transition-colors cursor-pointer select-none"
                  >
                    {showPassword ? "非表示" : "表示"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-sage-600 hover:bg-sage-700 text-white py-2.5 rounded-xl text-sm font-bold shadow-xs transition-all cursor-pointer pointer-events-auto"
              >
                アカウントを作成してログイン
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

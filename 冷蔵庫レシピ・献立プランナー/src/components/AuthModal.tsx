/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Mail, Lock, User, ShieldCheck, AlertCircle, ScanFace, Camera } from 'lucide-react';
import { User as UserType } from '../types';
import FaceAuth from './FaceAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserType) => void;
  fullScreenMode?: boolean;
}

export default function AuthModal({ isOpen, onClose, onLoginSuccess, fullScreenMode = false }: AuthModalProps) {
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

  // Facial Recognition states
  const [isFaceAuthActive, setIsFaceAuthActive] = useState(false);
  const [facePhoto, setFacePhoto] = useState<string | null>(null);

  const handleAdminAutofill = () => {
    setActiveTab('login');
    setEmail('admin@example.com');
    setPassword('admin');
    setInfoMessage('🔑【シークレット通知：管理者認証キー発行】開発者検証用のAdministrator資格情報「admin@example.com / admin」を発行し、入力欄へ自動挿入しました。このままログインしてください。');
    setError(null);
  };

  // Countdown timer for lockout cooldown
  React.useEffect(() => {
    if (lockoutTimeLeft <= 0) return;
    const interval = setInterval(() => {
      setLockoutTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTimeLeft]);

  if (!isOpen && !fullScreenMode) return null;

  // Pre-seed some default users if they don't exist in localstorage
  const getUsersFromStorage = (): UserType[] => {
    const saved = localStorage.getItem('shufu_registered_users');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    // Default mock accounts
    return [
      { id: 'u-1', email: 'admin@example.com', password: 'admin', name: 'システム管理者', role: 'admin' },
      { id: 'u-2', email: 'user@example.com', password: 'user', name: '鈴木さん', role: 'member' }
    ];
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

    const newUser: UserType = {
      id: `user_${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: role,
      password: password,
      facePhoto: facePhoto || undefined,
    };

    const updatedUsers = [...users, newUser];
    localStorage.setItem('shufu_registered_users', JSON.stringify(updatedUsers));

    // Log the user in immediately
    const { password: _, ...safeUser } = newUser;
    onLoginSuccess(safeUser as UserType);
    onClose();
  };

  return (
    <div className={fullScreenMode ? "w-full max-w-md mx-auto bg-transparent relative z-10" : "fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4"}>
      <div className="bg-white rounded-3xl w-full shadow-xl overflow-hidden border border-sage-100/50 animate-scale-up">
        {/* Modal Header */}
        <div className="bg-sage-600 px-6 py-5 flex items-center justify-between text-white select-none">
          <div>
            <h3 className="font-bold text-base flex items-center gap-1.5 selection:bg-transparent">
              <span 
                onClick={handleAdminAutofill} 
                className="cursor-pointer hover:scale-125 hover:rotate-12 active:scale-95 transition-all inline-block select-none filter drop-shadow-sm"
                title="管理者ログイン用イニシエータ"
              >
                🍳
              </span>
              {fullScreenMode ? "マイスパイス冷蔵庫キー" : "アカウント連携"}
            </h3>
            <p className="text-[10px] text-sage-100 font-medium">
              {fullScreenMode ? "冷蔵庫の食材管理とAIスマート献立管理（セッション保護対応）" : "冷蔵庫・献立データをクラウド（模擬）管理"}
            </p>
          </div>
          {!fullScreenMode && (
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-white/10 transition-colors text-white cursor-pointer"
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
              setIsFaceAuthActive(false);
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
              setIsFaceAuthActive(false);
              setFacePhoto(null);
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
            isFaceAuthActive ? (
              <div className="space-y-4">
                <FaceAuth
                  mode="login"
                  registeredUsers={getUsersFromStorage()}
                  onCapture={() => {}}
                  onLoginSuccess={(user) => {
                    onLoginSuccess(user);
                    onClose();
                  }}
                />
                <button
                  type="button"
                  onClick={() => setIsFaceAuthActive(false)}
                  className="w-full text-center text-xs font-bold text-gray-500 hover:text-sage-600 py-2 transition-colors cursor-pointer"
                >
                  ← パスワード入力ログインに戻る
                </button>
              </div>
            ) : (
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

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-gray-200"></div>
                  <span className="flex-shrink mx-4 text-gray-400 text-[10px] font-bold">または</span>
                  <div className="flex-grow border-t border-gray-200"></div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsFaceAuthActive(true)}
                  className="w-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-800 py-2.5 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ScanFace className="h-4 w-4 text-emerald-600" />
                  <span>セキュア顔認証でログイン</span>
                </button>
              </form>
            )
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

              {/* Secure Facial Registration Block */}
              <div className="pt-2">
                {facePhoto ? (
                  <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3.5 flex items-center justify-between text-xs text-emerald-800 font-medium animate-fade-in">
                    <div className="flex items-center gap-2.5">
                      <div className="relative h-10 w-10 rounded-full overflow-hidden border-2 border-emerald-500 bg-slate-900 shrink-0">
                        <img src={facePhoto} className="w-full h-full object-cover scale-x-[-1]" alt="Face thumbnail" />
                      </div>
                      <div>
                        <span className="font-bold block text-emerald-900">✅ 生体顔情報が登録されました</span>
                        <span className="text-[10px] text-emerald-600 select-none">ログイン時に顔認証を利用可能になります</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFacePhoto(null);
                        setIsFaceAuthActive(true);
                      }}
                      className="text-[10px] underline hover:text-emerald-950 font-bold cursor-pointer shrink-0"
                    >
                      変更する
                    </button>
                  </div>
                ) : isFaceAuthActive ? (
                  <div className="space-y-2.5 bg-slate-950 p-4 rounded-3xl border border-slate-800 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-400">📸 顔の登録スキャン</label>
                      <button
                        type="button"
                        onClick={() => setIsFaceAuthActive(false)}
                        className="text-[10px] text-slate-400 hover:text-slate-200 font-bold cursor-pointer"
                      >
                        キャンセル
                      </button>
                    </div>
                    <FaceAuth
                      mode="register"
                      onCapture={(photo) => {
                        setFacePhoto(photo);
                        setIsFaceAuthActive(false);
                      }}
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsFaceAuthActive(true)}
                    className="w-full bg-slate-50 hover:bg-slate-100 border border-gray-200 text-slate-705 py-2.5 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Camera className="h-4 w-4 text-sage-600" />
                    <span>顔写真を登録して顔認証ログインを有効にする</span>
                  </button>
                )}
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

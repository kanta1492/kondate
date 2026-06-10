/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { X, User as UserIcon, Mail, Lock, Upload, Eye, EyeOff, Save, CheckCircle, Smartphone } from 'lucide-react';
import { User as UserType } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserType | null;
  onUpdateUser: (updatedUser: UserType, oldUserId?: string) => void;
}

export default function SettingsModal({ isOpen, onClose, currentUser, onUpdateUser }: SettingsModalProps) {
  const [userId, setUserId] = useState(currentUser?.id || '');
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [password, setPassword] = useState(currentUser?.password || 'password123'); // fallback or fetch from storage
  const [facePhoto, setFacePhoto] = useState(currentUser?.facePhoto || '');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state if currentUser changes
  React.useEffect(() => {
    if (currentUser) {
      setUserId(currentUser.id);
      setName(currentUser.name);
      setEmail(currentUser.email);
      setFacePhoto(currentUser.facePhoto || '');
      
      // Attempt to retrieve complete password field from local list for credentials session integrity
      const savedUsers = localStorage.getItem('shufu_registered_users');
      if (savedUsers) {
        try {
          const parsed = JSON.parse(savedUsers) as UserType[];
          const match = parsed.find(u => u.id === currentUser.id);
          if (match && match.password) {
            setPassword(match.password);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [currentUser, isOpen]);

  if (!isOpen || !currentUser) return null;

  // Handle image uploads
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('顔写真のファイルサイズは2MB以下にしてください。');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setFacePhoto(reader.result);
          setError(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('顔写真のファイルサイズは2MB以下にしてください。');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setFacePhoto(reader.result);
          setError(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaved(false);

    const targetUserId = userId.trim().toLowerCase();

    if (!targetUserId || !name.trim() || !email.trim() || !password) {
      setError('ユーザーID、お名前、メールアドレス、およびパスワードを入力してください。');
      return;
    }

    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(targetUserId)) {
      setError('ユーザーIDは3〜20文字の半角英数字、ハイフン、アンダースコアで設定してください。');
      return;
    }

    if (password.length < 4) {
      setError('パスワードは4文字以上で設定してください。');
      return;
    }

    // Check duplicate ID if ID has changed
    const oldUserId = currentUser.id;
    if (targetUserId !== oldUserId) {
      const savedUsers = localStorage.getItem('shufu_registered_users');
      if (savedUsers) {
        try {
          const parsed = JSON.parse(savedUsers) as UserType[];
          const isDup = parsed.some(u => u.id.toLowerCase() === targetUserId);
          if (isDup) {
            setError('そのユーザーIDは既に別のユーザーが使用しています。');
            return;
          }
        } catch (e) {
          console.error(e);
        }
      }
    }

    const updatedUser: UserType = {
      ...currentUser,
      id: targetUserId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password,
      facePhoto: facePhoto
    };

    onUpdateUser(updatedUser, oldUserId);
    setIsSaved(true);
    
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-xl overflow-hidden border border-sage-100/50 animate-scale-up">
        {/* Header */}
        <div className="bg-sage-600 px-6 py-5 text-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base flex items-center gap-1.5">
              ⚙️ アカウント＆個人設定
            </h3>
            <p className="text-[10px] text-sage-100 font-medium mt-1">
              プロフィールの変更とログイン資格情報の更新
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 transition-colors text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-800 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 font-medium">
              <span className="shrink-0 text-rose-600">⚠</span>
              <span>{error}</span>
            </div>
          )}

          {isSaved && (
            <div className="bg-emerald-50 border border-emerald-150 text-emerald-800 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 font-medium">
              <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>変更内容を保存し、クラウドデータベースと同期しました！</span>
            </div>
          )}

          {/* User ID (Editable text input) */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">ユーザーID（ログイン時に必要、小文字に自動変換）</label>
            <div className="relative font-sans">
              <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="半角英数字3〜20文字"
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50/50 focus:outline-hidden font-medium text-gray-700 font-sans"
              />
            </div>
            <p className="text-[9px] text-gray-400 mt-1 leading-relaxed">※ 半角英数字3〜20文字、ハイフン( - )、アンダースコア( _ )が使用できます。他の登録ユーザーと重複はできません。</p>
          </div>

          {/* Nickname / Display Name */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">ニックネーム・お名前</label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="お名前を入力"
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50/50 focus:outline-hidden font-medium text-gray-700 font-sans"
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">メールアドレス</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@mail.com"
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50/50 focus:outline-hidden font-medium text-gray-700 font-sans"
              />
            </div>
          </div>

          {/* Password (Editable with toggle) */}
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

          {/* Circular Face Photo / Upload Section */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">顔写真・アバターアイコン</label>
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                {facePhoto ? (
                  <img
                    src={facePhoto}
                    alt="Current Face"
                    className="h-16 w-16 rounded-full object-cover border-2 border-sage-500/50 shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-sage-50 border-2 border-dashed border-sage-250 flex items-center justify-center text-sage-600 font-bold text-xl select-none">
                    {name.charAt(0) || '?'}
                  </div>
                )}
                {facePhoto && (
                  <button
                    type="button"
                    onClick={() => setFacePhoto('')}
                    className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 shadow-sm text-[8px] font-bold hover:bg-rose-600 transition-colors"
                    title="写真をクリア"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Drag/Drop Box */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 border border-dashed border-gray-300 rounded-xl p-3 text-center cursor-pointer hover:bg-slate-50 transition-colors flex flex-col items-center justify-center text-[11px] text-gray-500"
              >
                <Upload className="h-4 w-4 text-gray-400 mb-1" />
                <span className="font-semibold text-sage-700">写真をアップロード</span>
                <span className="text-[9px] text-gray-400 mt-0.5">またはここにドラッグ＆ドロップ (最大2MB)</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Footer Save Action */}
          <div className="flex items-center gap-2.5 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="flex-1 bg-sage-600 hover:bg-sage-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" />
              設定を保存する
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

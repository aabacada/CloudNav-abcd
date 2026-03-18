import React, { useState } from 'react';
import { Lock, ArrowRight, Loader2, X } from 'lucide-react';
import { Category } from '../types';

interface CategoryAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  onUnlock: (categoryId: string) => void;
}

const CategoryAuthModal: React.FC<CategoryAuthModalProps> = ({ isOpen, onClose, category, onUnlock }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !category) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === category.password) {
        onUnlock(category.id);
        setPassword('');
        setError('');
        onClose();
    } else {
        setError('密碼錯誤');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-700 p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
            <X size={20} className="text-slate-400" />
        </button>

        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4 text-amber-600 dark:text-amber-400">
            <Lock size={28} />
          </div>
          <h2 className="text-lg font-bold dark:text-white">解鎖 "{category.name}"</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-2">
            該目錄受密碼保護，請輸入密碼訪問
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all text-center tracking-widest"
              placeholder="目錄密碼"
              autoFocus
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center font-medium animate-pulse">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!password}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2"
          >
            解鎖 <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};
export default CategoryAuthModal;

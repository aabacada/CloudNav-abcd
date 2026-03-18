import React, { useState } from 'react';
import { X, Lock, AlertCircle } from 'lucide-react';

interface CategoryActionAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (password: string) => Promise<boolean>;
  onVerified: () => void;
  actionType: 'edit' | 'delete';
  categoryName: string;
}

const CategoryActionAuthModal: React.FC<CategoryActionAuthModalProps> = ({ 
  isOpen, 
  onClose, 
  onVerify,
  onVerified,
  actionType,
  categoryName
}) => {
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('請輸入密碼');
      return;
    }

    setIsVerifying(true);
    setError('');
    
    try {
      const success = await onVerify(password);
      if (success) {
        setPassword('');
        onVerified();
      } else {
        setError('密碼錯誤，請重試');
      }
    } catch (err) {
      setError('驗證失敗，請重試');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    onClose();
  };

  const actionText = actionType === 'edit' ? '編輯' : '刪除';
  const colorClass = actionType === 'edit' 
    ? 'amber' 
    : 'red';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-700 p-6 relative">
        <button onClick={handleClose} className="absolute top-4 right-4 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
            <X size={20} className="text-slate-400" />
        </button>

        <div className="flex flex-col items-center mb-6">
          <div className={`w-14 h-14 bg-${colorClass}-100 dark:bg-${colorClass}-900/30 rounded-full flex items-center justify-center mb-4 text-${colorClass}-600 dark:text-${colorClass}-400`}>
            <Lock size={28} />
          </div>
          <h2 className="text-lg font-bold dark:text-white">驗證操作權限</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-2">
            您正在{actionText}分類 "<span className="font-medium">{categoryName}</span>"
          </p>
          <div className="flex items-center gap-2 mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <AlertCircle size={16} className="text-amber-600 dark:text-amber-400" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              請輸入部署時設置的密碼進行驗證
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-${colorClass}-500 outline-none transition-all text-center tracking-widest`}
              placeholder="請輸入密碼"
              autoFocus
              disabled={isVerifying}
            />
          </div>
          
          {error && (
            <div className={`p-2 bg-${colorClass}-50 dark:bg-${colorClass}-900/20 rounded-lg flex items-center gap-2`}>
              <AlertCircle size={16} className={`text-${colorClass}-600 dark:text-${colorClass}-400`} />
              <p className={`text-sm text-${colorClass}-700 dark:text-${colorClass}-300`}>{error}</p>
            </div>
          )}
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium"
              disabled={isVerifying}
            >
              取消
            </button>
            <button
              type="submit"
              className={`flex-1 px-4 py-2.5 bg-${colorClass}-600 text-white rounded-xl hover:bg-${colorClass}-700 transition-colors font-medium disabled:opacity-50`}
              disabled={isVerifying}
            >
              {isVerifying ? '驗證中...' : `確認${actionText}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default CategoryActionAuthModal;

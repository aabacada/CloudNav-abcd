import React, { useEffect, useRef } from 'react';
import { Copy, QrCode, Edit2, Trash2, Pin } from 'lucide-react';

interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onCopyLink: () => void;
  onShowQRCode: () => void;
  onEditLink: () => void;
  onDeleteLink: () => void;
  onTogglePin: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  isOpen,
  position,
  onClose,
  onCopyLink,
  onShowQRCode,
  onEditLink,
  onDeleteLink,
  onTogglePin
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      
      // 防止頁面滾動
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // 確保菜單位置不會超出螢幕邊界
  const adjustedPosition = {
    x: Math.min(position.x, window.innerWidth - 200),
    y: Math.min(position.y, window.innerHeight - 200)
  };

  const menuItems = [
    { icon: Copy, label: '複製連結', onClick: onCopyLink },
    { icon: QrCode, label: '顯示二維碼', onClick: onShowQRCode },
    { icon: Edit2, label: '編輯連結', onClick: onEditLink },
    { icon: Pin, label: '置頂/取消置頂', onClick: onTogglePin },
    { icon: Trash2, label: '刪除連結', onClick: onDeleteLink, className: 'text-red-600 dark:text-red-400' }
  ];

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1 min-w-[160px]"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y
      }}
    >
      {menuItems.map((item, index) => (
        <button
          key={index}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            item.onClick();
            onClose();
          }}
          className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${
            item.className || 'text-slate-700 dark:text-slate-300'
          }`}
        >
          <item.icon size={16} className={item.className} />
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
};
export default ContextMenu;

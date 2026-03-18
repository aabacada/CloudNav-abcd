import React from 'react';
import { X, Download } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  url,
  title
}) => {
  if (!isOpen) return null;

  const generateQRCode = () => {
    // 使用第三方QR碼生成服務
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
    return qrCodeUrl;
  };

  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.href = generateQRCode();
    link.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_qrcode.png`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-sm w-full mx-4 p-6 relative">
        {/* 關閉按鈕 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          <X size={20} />
        </button>

        {/* 標題 */}
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 text-center">
          二維碼
        </h3>

        {/* 網站資訊 */}
        <div className="text-center mb-4">
          <h4 className="font-medium text-slate-800 dark:text-slate-200 truncate" title={title}>
            {title}
          </h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 truncate" title={url}>
            {url}
          </p>
        </div>

        {/* QR碼 */}
        <div className="flex justify-center mb-4">
          <img
            src={generateQRCode()}
            alt={`${title}的二維碼`}
            className="w-48 h-48 border-4 border-white dark:border-slate-700 rounded-lg"
          />
        </div>

        {/* 操作按鈕 */}
        <div className="flex gap-2">
          <button
            onClick={downloadQRCode}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Download size={16} />
            下載二維碼
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 px-4 py-2 rounded-lg transition-colors"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
export default QRCodeModal;

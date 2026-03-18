import React, { useState, useEffect } from 'react';
import { X, Cloud, Download, Upload, CheckCircle2, AlertCircle, RefreshCw, Save } from 'lucide-react';
import { Category, LinkItem, WebDavConfig, SearchConfig, AIConfig } from '../types';
import { checkWebDavConnection, uploadBackup, uploadBackupWithTimestamp, downloadBackup } from '../services/webDavService';
import { generateBookmarkHtml, downloadHtmlFile } from '../services/exportService';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  links: LinkItem[];
  categories: Category[];
  onRestore: (links: LinkItem[], categories: Category[]) => void;
  webDavConfig: WebDavConfig;
  onSaveWebDavConfig: (config: WebDavConfig) => void;
  searchConfig: SearchConfig;
  onRestoreSearchConfig: (searchConfig: SearchConfig) => void;
  aiConfig: AIConfig;
  onRestoreAIConfig: (aiConfig: AIConfig) => void;
}

const BackupModal: React.FC<BackupModalProps> = ({ 
  isOpen, onClose, links, categories, onRestore, webDavConfig, onSaveWebDavConfig, searchConfig, onRestoreSearchConfig, aiConfig, onRestoreAIConfig 
}) => {
  const [config, setConfig] = useState<WebDavConfig>(webDavConfig);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'fail' | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'uploading' | 'downloading' | 'success' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    if(isOpen) {
        setConfig(webDavConfig);
        setTestResult(null);
        setSyncStatus('idle');
    }
  }, [isOpen, webDavConfig]);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const success = await checkWebDavConnection(config);
    setTestResult(success ? 'success' : 'fail');
    setIsTesting(false);
  };

  const handleSaveConfig = () => {
    onSaveWebDavConfig(config);
    // Automatically test upon save if enabled
    if (config.enabled) {
        handleTestConnection();
    }
  };

  const handleBackupToCloud = async () => {
    setSyncStatus('uploading');
    setStatusMsg('正在上傳...');
    const success = await uploadBackup(config, { links, categories, searchConfig, aiConfig });
    if (success) {
        setSyncStatus('success');
        setStatusMsg('備份成功！');
    } else {
        setSyncStatus('error');
        setStatusMsg('上傳失敗，請檢查配置或網路。');
    }
  };

  const handleBackupToCloudWithTimestamp = async () => {
    setSyncStatus('uploading');
    setStatusMsg('正在上傳...');
    const result = await uploadBackupWithTimestamp(config, { links, categories, searchConfig, aiConfig });
    if (result.success) {
        setSyncStatus('success');
        setStatusMsg(`備份成功！檔案名: ${result.filename}`);
    } else {
        setSyncStatus('error');
        setStatusMsg('上傳失敗，請檢查配置或網路。');
    }
  };

  const handleRestoreFromCloud = async () => {
    if (!confirm("確定要從 WebDAV 恢復嗎？這將覆蓋當前的本地數據。")) return;
    
    setSyncStatus('downloading');
    setStatusMsg('正在下載...');
    const data = await downloadBackup(config);
    
    if (data) {
        onRestore(data.links, data.categories);
        // 恢復搜索配置（如果存在）
        if (data.searchConfig) {
            onRestoreSearchConfig(data.searchConfig);
        }
        // 恢復AI配置（如果存在）
        if (data.aiConfig) {
            onRestoreAIConfig(data.aiConfig);
        }
        setSyncStatus('success');
        setStatusMsg('恢復成功！');
    } else {
        setSyncStatus('error');
        setStatusMsg('下載失敗或檔案格式錯誤。');
    }
  };

  const handleExportHtml = () => {
    const html = generateBookmarkHtml(links, categories);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadHtmlFile(html, `bookmarks_${dateStr}.html`);
  };

  const handleExportJson = () => {
    const data = { links, categories, searchConfig, aiConfig };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cloudnav_backup.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold dark:text-white flex items-center gap-2">
            <Cloud className="text-blue-500" /> 備份與恢復
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
            <X className="w-5 h-5 dark:text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* Section 1: WebDAV Configuration */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="font-medium text-slate-800 dark:text-slate-200">WebDAV 設置 (堅果雲/<a href="https://infini-cloud.net/en/modules/mypage/usage/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 underline">InfiniCloud</a>等)</h4>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={config.enabled}
                            onChange={(e) => setConfig({...config, enabled: e.target.checked})}
                            className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-600 dark:text-slate-400">啟用 WebDAV</span>
                    </label>
                </div>

                <div className={`space-y-3 transition-opacity ${!config.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">伺服器地址 (URL)</label>
                        <input 
                            type="text" 
                            value={config.url}
                            onChange={(e) => setConfig({...config, url: e.target.value})}
                            placeholder="https://dav.jianguoyun.com/dav/"
                            className="w-full p-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">使用者名稱</label>
                            <input 
                                type="text" 
                                value={config.username}
                                onChange={(e) => setConfig({...config, username: e.target.value})}
                                className="w-full p-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">應用密碼</label>
                            <input 
                                type="password" 
                                value={config.password}
                                onChange={(e) => setConfig({...config, password: e.target.value})}
                                className="w-full p-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 pt-2">
                        <button 
                            onClick={handleTestConnection}
                            disabled={isTesting}
                            className="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md transition-colors"
                        >
                            {isTesting ? '連線中...' : '測試連接'}
                        </button>
                        <button 
                            onClick={handleSaveConfig}
                            className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors flex items-center gap-1"
                        >
                            <Save size={12} /> 保存配置
                        </button>
                        {testResult === 'success' && <span className="text-xs text-green-500 flex items-center gap-1"><CheckCircle2 size={12}/> 連接成功</span>}
                        {testResult === 'fail' && <span className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12}/> 連接失敗</span>}
                    </div>
                </div>
            </section>

            <hr className="border-slate-200 dark:border-slate-700" />

            {/* Section 2: Sync Actions */}
            <section className="space-y-4">
                <h4 className="font-medium text-slate-800 dark:text-slate-200">雲端同步操作</h4>
                <div className="grid grid-cols-3 gap-4">
                    <button 
                        onClick={handleBackupToCloud}
                        disabled={!config.enabled}
                        className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        <Upload className="w-8 h-8 text-blue-500 mb-2 group-hover:-translate-y-1 transition-transform" />
                        <span className="text-sm font-medium dark:text-white">上傳備份</span>
                        <span className="text-xs text-slate-500 mt-1">覆蓋雲端數據</span>
                    </button>

                    <button 
                        onClick={handleRestoreFromCloud}
                        disabled={!config.enabled}
                        className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        <Download className="w-8 h-8 text-purple-500 mb-2 group-hover:-translate-y-1 transition-transform" />
                        <span className="text-sm font-medium dark:text-white">從 WebDAV 恢復</span>
                        <span className="text-xs text-slate-500 mt-1">覆蓋本地數據</span>
                    </button>

                    <button 
                        onClick={handleBackupToCloudWithTimestamp}
                        disabled={!config.enabled}
                        className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        <Upload className="w-8 h-8 text-green-500 mb-2 group-hover:-translate-y-1 transition-transform" />
                        <span className="text-sm font-medium dark:text-white">雙重備份</span>
                        <span className="text-xs text-slate-500 mt-1">帶時間戳</span>
                    </button>
                </div>
                
                {syncStatus !== 'idle' && (
                    <div className={`text-sm text-center p-2 rounded ${
                        syncStatus === 'success' ? 'bg-green-50 text-green-600 dark:bg-green-900/20' : 
                        syncStatus === 'error' ? 'bg-red-50 text-red-600 dark:bg-red-900/20' : 
                        'bg-blue-50 text-blue-600 dark:bg-blue-900/20'
                    }`}>
                        {statusMsg}
                    </div>
                )}
            </section>

            <hr className="border-slate-200 dark:border-slate-700" />

             {/* Section 3: HTML Export */}
             <section className="space-y-4">
                <h4 className="font-medium text-slate-800 dark:text-slate-200">本地導出</h4>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/30 flex items-center justify-between">
                    <div>
                        <h5 className="text-sm font-medium dark:text-slate-200">導出 HTML 書籤文件</h5>
                        <p className="text-xs text-slate-500 mt-1">相容 Chrome, Edge, Firefox 導入格式，保留目錄結構</p>
                    </div>
                    <button 
                        onClick={handleExportHtml}
                        className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:border-blue-500 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <Download size={16} /> 導出 HTML
                    </button>
                </div>
                
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/30 flex items-center justify-between">
                    <div>
                        <h5 className="text-sm font-medium dark:text-slate-200">導出 cloudnav_backup.json 文件</h5>
                        <p className="text-xs text-slate-500 mt-1">與 WebDAV 備份格式一致，便於數據遷移</p>
                    </div>
                    <button 
                        onClick={handleExportJson}
                        className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:border-blue-500 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <Download size={16} /> 導出 JSON
                    </button>
                </div>
             </section>

        </div>
      </div>
    </div>
  );
};
export default BackupModal;

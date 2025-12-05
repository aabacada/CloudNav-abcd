
import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Bot, Key, Globe, Sparkles, PauseCircle, Wrench, Box, Copy, Check, Settings, Clock } from 'lucide-react';
import { AIConfig, LinkItem, PasswordExpiryConfig } from '../types';
import { generateLinkDescription } from '../services/geminiService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AIConfig;
  onSave: (config: AIConfig) => void;
  links: LinkItem[];
  onUpdateLinks: (links: LinkItem[]) => void;
  passwordExpiryConfig: PasswordExpiryConfig;
  onSavePasswordExpiry: (config: PasswordExpiryConfig) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
    isOpen, onClose, config, onSave, links, onUpdateLinks, passwordExpiryConfig, onSavePasswordExpiry
}) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'tools' | 'website'>('ai');
  const [localConfig, setLocalConfig] = useState<AIConfig>(config);
  const [localPasswordExpiryConfig, setLocalPasswordExpiryConfig] = useState<PasswordExpiryConfig>(passwordExpiryConfig);
  
  // Bulk Generation State
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const shouldStopRef = useRef(false);

  // Tools State
  const [password, setPassword] = useState('');
  const [domain, setDomain] = useState('');
  const [showExtCode, setShowExtCode] = useState(true);
  
  // Copy feedback states
  const [copiedStates, setCopiedStates] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    if (isOpen) {
      setLocalConfig(config);
      setLocalPasswordExpiryConfig(passwordExpiryConfig);
      setIsProcessing(false);
      setProgress({ current: 0, total: 0 });
      shouldStopRef.current = false;
      setDomain(window.location.origin);
      const storedToken = localStorage.getItem('cloudnav_auth_token');
      if (storedToken) setPassword(storedToken);
    }
  }, [isOpen, config, passwordExpiryConfig]);

  const handleChange = (key: keyof AIConfig, value: string) => {
    setLocalConfig(prev => ({ ...prev, [key]: value }));
  };

  const handlePasswordExpiryChange = (key: keyof PasswordExpiryConfig, value: string | number) => {
    setLocalPasswordExpiryConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(localConfig);
    onSavePasswordExpiry(localPasswordExpiryConfig);
    onClose();
  };

  const getFaviconUrl = (rawUrl: string) => {
    if (!rawUrl) return '';
    try {
      let formatted = rawUrl.trim();
      if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
        formatted = 'https://' + formatted;
      }
      const url = new URL(formatted);
      return `https://www.faviconextractor.com/favicon/${url.hostname}?larger=true`;
    } catch (err) {
      console.warn('Failed to build favicon url for', rawUrl, err);
      return '';
    }
  };

  const handleBulkGenerate = async () => {
    const targets = links.filter(l => !l.description || !l.icon);
    if (targets.length === 0) {
        alert("所有链接都已有描述和图标！");
        return;
    }

    const needsDescription = targets.some(l => !l.description);
    if (needsDescription && !localConfig.apiKey) {
        alert("请先配置并保存 API Key，用于生成缺失的描述");
        return;
    }

    const missingDescCount = targets.filter(l => !l.description).length;
    const missingIconCount = targets.filter(l => !l.icon).length;
    const confirmMessage = `发现 ${targets.length} 个链接缺少信息，其中 ${missingDescCount} 个缺少描述，${missingIconCount} 个缺少图标。确定要一键补全吗？这可能需要一些时间。`;
    if (!confirm(confirmMessage)) return;

    setIsProcessing(true);
    shouldStopRef.current = false;
    setProgress({ current: 0, total: targets.length });
    
    let currentLinks = [...links];

    for (let i = 0; i < targets.length; i++) {
        if (shouldStopRef.current) break;

        const link = targets[i];
        try {
            const updates: Partial<LinkItem> = {};

            if (!link.description) {
                const desc = await generateLinkDescription(link.title, link.url, localConfig);
                updates.description = desc;
            }

            if (!link.icon) {
                const iconUrl = getFaviconUrl(link.url);
                if (iconUrl) {
                    updates.icon = iconUrl;
                }
            }

            if (Object.keys(updates).length > 0) {
                currentLinks = currentLinks.map(l => l.id === link.id ? { ...l, ...updates } : l);
                onUpdateLinks(currentLinks);
            }
        } catch (e) {
            console.error(`Failed to process ${link.title}`, e);
        } finally {
            setProgress({ current: i + 1, total: targets.length });
        }
    }

    setIsProcessing(false);
  };

  const handleStop = () => {
      shouldStopRef.current = true;
      setIsProcessing(false);
  };

  const handleCopy = (text: string, key: string) => {
      navigator.clipboard.writeText(text);
      setCopiedStates(prev => ({ ...prev, [key]: true }));
      setTimeout(() => {
          setCopiedStates(prev => ({ ...prev, [key]: false }));
      }, 2000);
  };

  // --- Chrome Extension Code Generators ---

  const extManifest = `{
  "manifest_version": 3,
  "name": "CloudNav Assistant",
  "version": "3.0",
  "permissions": ["activeTab"],
  "action": {
    "default_popup": "popup.html",
    "default_title": "保存到CloudNav"
  }
}`;

  const extPopupHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { width: 320px; padding: 16px; font-family: -apple-system, sans-serif; background: #f8fafc; }
    h3 { margin: 0 0 16px 0; font-size: 16px; color: #0f172a; }
    label { display: block; font-size: 12px; color: #64748b; margin-bottom: 4px; }
    input, select { width: 100%; margin-bottom: 12px; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; box-sizing: border-box; font-size: 14px; }
    button { width: 100%; background: #3b82f6; color: white; border: none; padding: 10px; border-radius: 6px; font-weight: 500; cursor: pointer; transition: background 0.2s; }
    button:hover { background: #2563eb; }
    button:disabled { background: #94a3b8; cursor: not-allowed; }
    #status { margin-top: 12px; text-align: center; font-size: 12px; min-height: 18px; }
    .error { color: #ef4444; }
    .success { color: #22c55e; }
  </style>
</head>
<body>
  <h3>保存到CloudNav</h3>
  
  <label>标题</label>
  <input type="text" id="title" placeholder="网站标题">
  
  <label>分类</label>
  <select id="category">
    <option value="" disabled selected>加载分类中...</option>
  </select>
  
  <button id="saveBtn">保存书签</button>
  <div id="status"></div>
  
  <script src="popup.js"></script>
</body>
</html>`;

  const extPopupJs = `const CONFIG = {
  apiBase: "${domain}",
  password: "${password}"
};

document.addEventListener('DOMContentLoaded', async () => {
  const titleInput = document.getElementById('title');
  const catSelect = document.getElementById('category');
  const saveBtn = document.getElementById('saveBtn');
  const statusDiv = document.getElementById('status');
  
  let currentTabUrl = '';

  // 1. Get Current Tab Info
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    titleInput.value = tab.title || '';
    currentTabUrl = tab.url || '';
  }

  // 2. Fetch Categories from CloudNav
  try {
    const res = await fetch(\`\${CONFIG.apiBase}/api/storage\`, {
      headers: { 'x-auth-password': CONFIG.password }
    });
    
    if (!res.ok) throw new Error('Auth failed. Check password.');
    
    const data = await res.json();
    
    catSelect.innerHTML = '';
    // Sort categories: Common first, then others
    const sorted = data.categories.sort((a,b) => {
        if(a.id === 'common') return -1;
        if(b.id === 'common') return 1;
        return 0;
    });

    sorted.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      catSelect.appendChild(opt);
    });

    // Select 'common' by default if exists
    catSelect.value = 'common';

  } catch (e) {
    statusDiv.textContent = 'Error: ' + e.message;
    statusDiv.className = 'error';
    catSelect.innerHTML = '<option>Load failed</option>';
    saveBtn.disabled = true;
  }

  // 3. Save Handler
  saveBtn.addEventListener('click', async () => {
    const catId = catSelect.value;
    const title = titleInput.value;
    
    if (!currentTabUrl) return;

    saveBtn.disabled = true;
    saveBtn.textContent = '保存中...';
    statusDiv.textContent = '';

    try {
      const res = await fetch(\`\${CONFIG.apiBase}/api/link\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-password': CONFIG.password
        },
        body: JSON.stringify({
          title: title,
          url: currentTabUrl,
          categoryId: catId
        })
      });

      if (res.ok) {
        statusDiv.textContent = '保存成功！';
        statusDiv.className = 'success';
        setTimeout(() => window.close(), 1200);
      } else {
        throw new Error(res.statusText);
      }
    } catch (e) {
      statusDiv.textContent = '保存失败：' + e.message;
      statusDiv.className = 'error';
      saveBtn.disabled = false;
      saveBtn.textContent = '保存书签';
    }
  });
});`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
        
        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <div className="flex gap-4">
              <button 
                onClick={() => setActiveTab('ai')}
                className={`text-sm font-semibold flex items-center gap-2 pb-1 transition-colors ${activeTab === 'ai' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500' : 'text-slate-500 dark:text-slate-400'}`}
              >
                <Bot size={18} /> AI 设置
              </button>
              <button 
                onClick={() => setActiveTab('tools')}
                className={`text-sm font-semibold flex items-center gap-2 pb-1 transition-colors ${activeTab === 'tools' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500' : 'text-slate-500 dark:text-slate-400'}`}
              >
                <Wrench size={18} /> 扩展工具
              </button>
              <button 
                onClick={() => setActiveTab('website')}
                className={`text-sm font-semibold flex items-center gap-2 pb-1 transition-colors ${activeTab === 'website' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500' : 'text-slate-500 dark:text-slate-400'}`}
              >
                <Settings size={18} /> 网站设置
              </button>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
            <X className="w-5 h-5 dark:text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto min-h-[300px]">
            
            {activeTab === 'ai' && (
                <>
                    {/* Provider Selection */}
                    <div>
                        <label className="block text-sm font-medium mb-2 dark:text-slate-300">API 提供商</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => handleChange('provider', 'gemini')}
                                className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                                    localConfig.provider === 'gemini'
                                    ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-300'
                                    : 'border-slate-200 dark:border-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                                }`}
                            >
                                <span className="font-semibold">Google Gemini</span>
                            </button>
                            <button
                                onClick={() => handleChange('provider', 'openai')}
                                className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                                    localConfig.provider === 'openai'
                                    ? 'bg-purple-50 border-purple-500 text-purple-700 dark:bg-purple-900/30 dark:border-purple-500 dark:text-purple-300'
                                    : 'border-slate-200 dark:border-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                                }`}
                            >
                                <span className="font-semibold">OpenAI 兼容</span>
                            </button>
                        </div>
                    </div>

                    {/* Model Config */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                                <Key size={12}/> API Key
                            </label>
                            <input
                                type="password"
                                value={localConfig.apiKey}
                                onChange={(e) => handleChange('apiKey', e.target.value)}
                                placeholder="sk-..."
                                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>

                        {localConfig.provider === 'openai' && (
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                                    <Globe size={12}/> Base URL (API 地址)
                                </label>
                                <input
                                    type="text"
                                    value={localConfig.baseUrl}
                                    onChange={(e) => handleChange('baseUrl', e.target.value)}
                                    placeholder="https://api.openai.com/v1"
                                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">
                                    例如: https://api.deepseek.com/v1 (不需要加 /chat/completions)
                                </p>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                                <Sparkles size={12}/> 模型名称
                            </label>
                            <input
                                type="text"
                                value={localConfig.model}
                                onChange={(e) => handleChange('model', e.target.value)}
                                placeholder={localConfig.provider === 'gemini' ? "gemini-2.5-flash" : "gpt-3.5-turbo"}
                                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Bulk Actions */}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <h4 className="text-sm font-medium dark:text-white mb-3 flex items-center gap-2">
                            <Sparkles className="text-amber-500" size={16} /> 批量操作
                        </h4>
                        
                        {isProcessing ? (
                            <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg space-y-3">
                                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                                    <span>正在补全描述 / 图标...</span>
                                    <span>{progress.current} / {progress.total}</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                                    <div 
                                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${progress.total ? (progress.current / progress.total) * 100 : 0}%` }}
                                    ></div>
                                </div>
                                <button 
                                    onClick={handleStop}
                                    className="w-full py-1.5 text-xs flex items-center justify-center gap-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded border border-red-200 dark:border-red-800 transition-colors"
                                >
                                    <PauseCircle size={12} /> 停止处理
                                </button>
                            </div>
                        ) : (
                            <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
                                <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                                    自动扫描所有没有描述或图标的链接，使用 AI 生成简介，并智能补全站点 favicon。
                                </div>
                                <button
                                    onClick={handleBulkGenerate}
                                    className="w-full py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:border-blue-500 hover:text-blue-500 dark:hover:text-blue-400 dark:text-slate-200 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    <Sparkles size={16} /> 一键补全描述与图标
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}

            {activeTab === 'website' && (
                <div className="space-y-6">
                    <div>
                        <h4 className="font-bold dark:text-white mb-3 text-sm flex items-center gap-2">
                            <Settings size={16} /> 浏览器标签标题设置
                        </h4>
                        <p className="text-xs text-slate-500 mb-4">
                            配置浏览器标签页显示的网站标题，让您的书签管理器更具个性化。
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">
                                    网站标题
                                </label>
                                <input
                                    type="text"
                                    value={localConfig.websiteTitle || ''}
                                    onChange={(e) => handleChange('websiteTitle', e.target.value)}
                                    placeholder="CloudNav - 我的导航"
                                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">
                                    显示在浏览器标签页上的标题
                                </p>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">
                                    网页导航名称
                                </label>
                                <input
                                    type="text"
                                    value={localConfig.navigationName || ''}
                                    onChange={(e) => handleChange('navigationName', e.target.value)}
                                    placeholder="CloudNav"
                                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">
                                    显示在网页左上角的导航名称
                                </p>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">
                                    网站图标 (Favicon URL)
                                </label>
                                <input
                                    type="text"
                                    value={localConfig.faviconUrl || ''}
                                    onChange={(e) => handleChange('faviconUrl', e.target.value)}
                                    placeholder="/favicon.ico"
                                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">
                                    网站图标的 URL 地址
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                        <h4 className="font-bold dark:text-white mb-3 text-sm flex items-center gap-2">
                            <Clock size={16} /> 密码过期时间设置
                        </h4>
                        <p className="text-xs text-slate-500 mb-4">
                            配置访问密码的过期时间，提高安全性。设置为"永久"则密码不会过期。
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">
                                    过期时间数值
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={localPasswordExpiryConfig.value}
                                    onChange={(e) => handlePasswordExpiryChange('value', parseInt(e.target.value) || 1)}
                                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">
                                    密码过期的具体数值
                                </p>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">
                                    过期时间单位
                                </label>
                                <select
                                    value={localPasswordExpiryConfig.unit}
                                    onChange={(e) => handlePasswordExpiryChange('unit', e.target.value)}
                                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                >
                                    <option value="day">天</option>
                                    <option value="week">周</option>
                                    <option value="month">月</option>
                                    <option value="year">年</option>
                                    <option value="permanent">永久</option>
                                </select>
                                <p className="text-[10px] text-slate-400 mt-1">
                                    选择密码过期的时间单位
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {activeTab === 'tools' && (
                <div className="space-y-6">
                    <div className="space-y-3">
                        <label className="block text-xs font-medium text-slate-500 mb-1">
                            第一步：输入您的访问密码 (用于生成代码)
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono tracking-widest"
                            placeholder="部署时设置的 PASSWORD"
                        />
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                        <h4 className="font-bold dark:text-white mb-2 text-sm flex items-center gap-2">
                            <Box size={16} /> Chrome 扩展 (弹窗选择版)
                        </h4>
                        <p className="text-xs text-slate-500 mb-4">
                            在本地创建一个文件夹，创建以下 3 个文件，然后使用“加载已解压的扩展程序”安装。
                            <br/>此扩展允许您点击图标后<strong>手动选择分类</strong>保存。
                        </p>
                        
                        <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                            {/* File 1: Manifest */}
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-mono font-bold text-slate-500">1. manifest.json</span>
                                    <button 
                                        onClick={() => handleCopy(extManifest, 'manifest')}
                                        className="text-[10px] flex items-center gap-1 px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-blue-100 text-slate-600 dark:text-slate-300"
                                    >
                                        {copiedStates['manifest'] ? <Check size={12}/> : <Copy size={12}/>} 复制
                                    </button>
                                </div>
                                <pre className="bg-slate-100 dark:bg-slate-900 p-3 rounded text-[10px] font-mono text-slate-600 dark:text-slate-300 overflow-x-auto border border-slate-200 dark:border-slate-700">
                                    {extManifest}
                                </pre>
                            </div>

                            {/* File 2: Popup HTML */}
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-mono font-bold text-slate-500">2. popup.html</span>
                                    <button 
                                        onClick={() => handleCopy(extPopupHtml, 'popuphtml')}
                                        className="text-[10px] flex items-center gap-1 px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-blue-100 text-slate-600 dark:text-slate-300"
                                    >
                                        {copiedStates['popuphtml'] ? <Check size={12}/> : <Copy size={12}/>} 复制
                                    </button>
                                </div>
                                <pre className="bg-slate-100 dark:bg-slate-900 p-3 rounded text-[10px] font-mono text-slate-600 dark:text-slate-300 overflow-x-auto border border-slate-200 dark:border-slate-700">
                                    {extPopupHtml}
                                </pre>
                            </div>
                            
                            {/* File 3: Popup JS */}
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-mono font-bold text-slate-500">3. popup.js</span>
                                    <button 
                                        onClick={() => handleCopy(extPopupJs, 'popupjs')}
                                        className="text-[10px] flex items-center gap-1 px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-blue-100 text-slate-600 dark:text-slate-300"
                                    >
                                        {copiedStates['popupjs'] ? <Check size={12}/> : <Copy size={12}/>} 复制
                                    </button>
                                </div>
                                <pre className="bg-slate-100 dark:bg-slate-900 p-3 rounded text-[10px] font-mono text-slate-600 dark:text-slate-300 overflow-x-auto border border-slate-200 dark:border-slate-700">
                                    {extPopupJs}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>

        {activeTab === 'ai' && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3 shrink-0">
                <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">取消</button>
                <button 
                    onClick={handleSave}
                    className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 font-medium"
                >
                    <Save size={16} /> 保存设置
                </button>
            </div>
        )}
        
        {activeTab === 'website' && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3 shrink-0">
                <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">取消</button>
                <button 
                    onClick={handleSave}
                    className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 font-medium"
                >
                    <Save size={16} /> 保存设置
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default SettingsModal;

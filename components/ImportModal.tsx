import React, { useState, useRef } from 'react';
import { X, Upload, FileText, ArrowRight, Check, AlertCircle, FolderInput, ListTree, Database } from 'lucide-react';
import { Category, LinkItem, SearchConfig, AIConfig } from '../types';
import { parseBookmarks } from '../services/bookmarkParser';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingLinks: LinkItem[];
  categories: Category[];
  onImport: (newLinks: LinkItem[], newCategories: Category[]) => void;
  onImportSearchConfig?: (searchConfig: SearchConfig) => void;
  onImportAIConfig?: (aiConfig: AIConfig) => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ 
  isOpen, 
  onClose, 
  existingLinks, 
  categories, 
  onImport,
  onImportSearchConfig,
  onImportAIConfig
}) => {
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  
  // Analysis Results
  const [newLinksCount, setNewLinksCount] = useState(0);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [newCategoriesCount, setNewCategoriesCount] = useState(0);
  
  // Staging Data
  const [parsedLinks, setParsedLinks] = useState<LinkItem[]>([]);
  const [parsedCategories, setParsedCategories] = useState<Category[]>([]);
  const [parsedSearchConfig, setParsedSearchConfig] = useState<SearchConfig | null>(null);
  const [parsedAIConfig, setParsedAIConfig] = useState<AIConfig | null>(null);
  
  // Options
  const [importMode, setImportMode] = useState<'original' | 'merge'>('original');
  const [targetCategoryId, setTargetCategoryId] = useState<string>(categories[0]?.id || 'common');
  const [importType, setImportType] = useState<'html' | 'json'>('html');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  // Parse JSON backup file
  const parseJsonBackup = async (file: File): Promise<{ links: LinkItem[], categories: Category[], searchConfig?: SearchConfig, aiConfig?: AIConfig }> => {
    const text = await file.text();
    const data = JSON.parse(text);
    
    // Validate the structure
    if (!data.links || !Array.isArray(data.links) || !data.categories || !Array.isArray(data.categories)) {
      throw new Error('Invalid backup file format');
    }
    
    return {
      links: data.links,
      categories: data.categories,
      searchConfig: data.searchConfig,
      aiConfig: data.aiConfig
    };
  };

  if (!isOpen) return null;

  const resetState = () => {
    setStep('upload');
    setFile(null);
    setParsedLinks([]);
    setParsedCategories([]);
    setParsedSearchConfig(null);
    setParsedAIConfig(null);
    setNewLinksCount(0);
    setDuplicateCount(0);
    setNewCategoriesCount(0);
    setImportType('html');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'html' | 'json') => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setAnalyzing(true);
    setImportType(type);

    try {
        let result: { links: LinkItem[], categories: Category[], searchConfig?: SearchConfig, aiConfig?: AIConfig };
        
        if (type === 'html') {
            result = await parseBookmarks(selectedFile);
        } else {
            result = await parseJsonBackup(selectedFile);
        }
        
        // 2. Diff Logic
        const existingUrls = new Set(existingLinks.map(l => l.url.trim().replace(/\/$/, ''))); // Normalize URLs slightly
        
        const uniqueNewLinks: LinkItem[] = [];
        let duplicates = 0;

        result.links.forEach(link => {
            const normalizedUrl = link.url.trim().replace(/\/$/, '');
            if (existingUrls.has(normalizedUrl)) {
                duplicates++;
            } else {
                uniqueNewLinks.push(link);
            }
        });

        // 3. Category Diff
        const existingCategoryNames = new Set(categories.map(c => c.name));
        const uniqueNewCategories = result.categories.filter(c => !existingCategoryNames.has(c.name));

        setParsedLinks(uniqueNewLinks);
        setParsedCategories(uniqueNewCategories);
        setParsedSearchConfig(result.searchConfig || null);
        setParsedAIConfig(result.aiConfig || null);
        setNewLinksCount(uniqueNewLinks.length);
        setDuplicateCount(duplicates);
        setNewCategoriesCount(uniqueNewCategories.length);
        
        setStep('preview');
    } catch (error) {
        const errorMessage = type === 'html' 
            ? "解析文件失敗，請確保是標準的 Chrome HTML 書籤文件。"
            : "解析文件失敗，請確保是有效的 cloudnav_backup.json 文件。";
        alert(errorMessage);
        console.error(error);
    } finally {
        setAnalyzing(false);
    }
  };

  const executeImport = () => {
      let finalLinks = [...parsedLinks];
      let finalCategories: Category[] = [];

      if (importMode === 'merge') {
          // Flatten all new links to the target category
          finalLinks = finalLinks.map(link => ({
              ...link,
              categoryId: targetCategoryId
          }));
          // In merge mode, we do NOT add new categories from the file
          finalCategories = []; 
      } else {
          // Keep structure mode
          // We need to merge categories carefully.
          // Since parseBookmarks generates IDs for categories, if a category name already exists in `categories`, 
          // we should remap the links to the existing category ID instead of creating a new duplicate-named category.
          
          const nameToIdMap = new Map<string, string>();
          categories.forEach(c => nameToIdMap.set(c.name, c.id));

          // Valid new categories to add
          const categoriesToAdd: Category[] = [];

          parsedCategories.forEach(pc => {
              if (nameToIdMap.has(pc.name)) {
                  // Category exists, we don't add it.
                  // But we need to know its ID to remap links.
              } else {
                  categoriesToAdd.push(pc);
                  nameToIdMap.set(pc.name, pc.id); // Add new one to map
              }
          });

          // Remap links
          finalLinks = finalLinks.map(link => {
             // Find the name of the category this link was assigned to in the parser
             const originalCat = parsedCategories.find(c => c.id === link.categoryId) 
                                 || categories.find(c => c.id === link.categoryId); // Fallback
             
             if (originalCat && nameToIdMap.has(originalCat.name)) {
                 return { ...link, categoryId: nameToIdMap.get(originalCat.name)! };
             }
             // If for some reason we can't find the map, put it in common
             return { ...link, categoryId: 'common' };
          });

          finalCategories = categoriesToAdd;
      }

      onImport(finalLinks, finalCategories);
      
      // Import search config if available
      if (parsedSearchConfig && onImportSearchConfig) {
          onImportSearchConfig(parsedSearchConfig);
      }
      
      // Import AI config if available
      if (parsedAIConfig && onImportAIConfig) {
          onImportAIConfig(parsedAIConfig);
      }
      
      handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <h3 className="text-lg font-semibold dark:text-white flex items-center gap-2">
            <Upload size={20} className="text-blue-500"/> 導入書籤
          </h3>
          <button onClick={handleClose} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
            <X className="w-5 h-5 dark:text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
            
            {step === 'upload' && (
                <div className="space-y-4">
                    {/* HTML Import Option */}
                    <div className="flex flex-col items-center justify-center space-y-4 py-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                         onClick={() => fileInputRef.current?.click()}>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept=".html" 
                            onChange={(e) => handleFileChange(e, 'html')} 
                        />
                        
                        {analyzing && importType === 'html' ? (
                            <div className="flex flex-col items-center">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-2"></div>
                                <span className="text-slate-500">正在分析書籤文件...</span>
                            </div>
                        ) : (
                            <>
                                <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                                    <FileText size={32} />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-medium dark:text-white">點擊選擇 HTML 文件</p>
                                    <p className="text-xs text-slate-500 mt-1">支持 Chrome, Edge, Firefox 導出的書籤</p>
                                </div>
                            </>
                        )}
                    </div>
                    
                    {/* JSON Import Option */}
                    <div className="flex flex-col items-center justify-center space-y-4 py-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                         onClick={() => jsonFileInputRef.current?.click()}>
                        <input 
                            type="file" 
                            ref={jsonFileInputRef} 
                            className="hidden" 
                            accept=".json" 
                            onChange={(e) => handleFileChange(e, 'json')} 
                        />
                        
                        {analyzing && importType === 'json' ? (
                            <div className="flex flex-col items-center">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500 mb-2"></div>
                                <span className="text-slate-500">正在分析備份文件...</span>
                            </div>
                        ) : (
                            <>
                                <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400">
                                    <Database size={32} />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-medium dark:text-white">導入 cloudnav_backup.json 文件</p>
                                    <p className="text-xs text-slate-500 mt-1">與 WebDAV 備份格式一致，便於數據遷移</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {step === 'preview' && (
                <div className="space-y-6">
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2">
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center border border-green-100 dark:border-green-900/30">
                            <div className="text-xl font-bold text-green-600 dark:text-green-400">{newLinksCount}</div>
                            <div className="text-xs text-green-700 dark:text-green-500">新增連結</div>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-center border border-slate-200 dark:border-slate-600">
                            <div className="text-xl font-bold text-slate-600 dark:text-slate-400">{duplicateCount}</div>
                            <div className="text-xs text-slate-500">重複跳過</div>
                        </div>
                         <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center border border-purple-100 dark:border-purple-900/30">
                            <div className="text-xl font-bold text-purple-600 dark:text-purple-400">{importMode === 'original' ? newCategoriesCount : 0}</div>
                            <div className="text-xs text-purple-700 dark:text-purple-500">新增分類</div>
                        </div>
                    </div>

                    {newLinksCount === 0 ? (
                        <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-lg text-sm">
                            <AlertCircle size={16} />
                            <span>未發現新連結，所有連結已存在。</span>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <label className="text-sm font-medium dark:text-slate-300">導入方式</label>
                            
                            <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${importMode === 'original' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-700'}`}>
                                <input type="radio" name="mode" className="mt-1" checked={importMode === 'original'} onChange={() => setImportMode('original')} />
                                <div>
                                    <div className="flex items-center gap-2 font-medium text-sm dark:text-white">
                                        <ListTree size={16} /> 保持原目錄結構
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">如果分類不存在，將自動創建。</p>
                                </div>
                            </label>

                            <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${importMode === 'merge' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-700'}`}>
                                <input type="radio" name="mode" className="mt-1" checked={importMode === 'merge'} onChange={() => setImportMode('merge')} />
                                <div className="w-full">
                                    <div className="flex items-center gap-2 font-medium text-sm dark:text-white">
                                        <FolderInput size={16} /> 全部導入到指定目錄
                                    </div>
                                    <div className="mt-2">
                                        <select 
                                            value={targetCategoryId}
                                            onChange={(e) => setTargetCategoryId(e.target.value)}
                                            disabled={importMode !== 'merge'}
                                            onClick={(e) => e.stopPropagation()}
                                            className="w-full text-sm p-2 rounded border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none"
                                        >
                                            {categories.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </label>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
            {step === 'upload' ? (
                <button onClick={handleClose} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">取消</button>
            ) : (
                <>
                    <button onClick={resetState} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">重新選擇</button>
                    <button 
                        onClick={executeImport} 
                        disabled={newLinksCount === 0}
                        className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2 font-medium"
                    >
                        <Check size={16} /> 確認導入 ({newLinksCount})
                    </button>
                </>
            )}
        </div>

      </div>
    </div>
  );
};
export default ImportModal;

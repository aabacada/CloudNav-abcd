export interface LinkItem {
  id: string;
  title: string;
  url: string;
  icon?: string;
  description?: string;
  categoryId: string;
  createdAt: number;
  pinned?: boolean; // New field for pinning
  pinnedOrder?: number; // Field for pinned link sorting order
}

export interface Category {
  id: string;
  name: string;
  icon: string; // Lucide icon name or emoji
  password?: string; // Optional password for category protection
}

export interface SiteSettings {
  title: string;
  navTitle: string;
  favicon: string;
  cardStyle: 'detailed' | 'simple';
  passwordExpiryDays: number; // 密碼過期天數，0表示永久不退出
}

export interface AppState {
  links: LinkItem[];
  categories: Category[];
  darkMode: boolean;
  settings?: SiteSettings;
}

export interface WebDavConfig {
  url: string;
  username: string;
  password: string;
  enabled: boolean;
}

export type AIProvider = 'gemini' | 'openai';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
  websiteTitle?: string; // 網站標題 (瀏覽器標籤)
  faviconUrl?: string; // 網站圖示URL
  navigationName?: string;
}



// 搜索模式類型
export type SearchMode = 'internal' | 'external';

// 外部搜索源配置
export interface ExternalSearchSource {
  id: string;
  name: string;
  url: string;
  icon?: string;
  enabled: boolean;
  createdAt: number;
}

// 搜索配置
export interface SearchConfig {
  mode: SearchMode;
  externalSources: ExternalSearchSource[];
  selectedSource?: ExternalSearchSource | null; // 選中的搜索源
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'common', name: '常用推薦', icon: 'Star' },
  { id: 'dev', name: '開發工具', icon: 'Code' },
  { id: 'design', name: '設計資源', icon: 'Palette' },
  { id: 'read', name: '閱讀資訊', icon: 'BookOpen' },
  { id: 'ent', name: '休閒娛樂', icon: 'Gamepad2' },
  { id: 'ai', name: '人工智慧', icon: 'Bot' },
];

export const INITIAL_LINKS: LinkItem[] = [
  { id: '1', title: 'GitHub', url: 'https://github.com', categoryId: 'dev', createdAt: Date.now(), description: '代碼託管平台', pinned: true, icon: 'https://www.faviconextractor.com/favicon/github.com?larger=true' },
  { id: '2', title: 'React', url: 'https://react.dev', categoryId: 'dev', createdAt: Date.now(), description: '構建Web用戶界面的庫', pinned: true, icon: 'https://www.faviconextractor.com/favicon/react.dev?larger=true' },
  { id: '3', title: 'Tailwind CSS', url: 'https://tailwindcss.com', categoryId: 'design', createdAt: Date.now(), description: '原子化CSS框架', pinned: true, icon: 'https://www.faviconextractor.com/favicon/tailwindcss.com?larger=true' },
  { id: '4', title: 'ChatGPT', url: 'https://chat.openai.com', categoryId: 'ai', createdAt: Date.now(), description: 'OpenAI聊天機器人', pinned: true, icon: 'https://www.faviconextractor.com/favicon/chat.openai.com?larger=true' },
  { id: '5', title: 'Gemini', url: 'https://gemini.google.com', categoryId: 'ai', createdAt: Date.now(), description: 'Google DeepMind AI', pinned: true, icon: 'https://www.faviconextractor.com/favicon/gemini.google.com?larger=true' },
];

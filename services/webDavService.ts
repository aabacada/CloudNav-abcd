
import { Category, LinkItem, WebDavConfig, SearchConfig, AIConfig } from "../types";

// Helper to call our Cloudflare Proxy
// This solves the CORS issue by delegating the request to the backend
const callWebDavProxy = async (operation: 'check' | 'upload' | 'download', config: WebDavConfig, payload?: any, filename?: string) => {
    try {
        const response = await fetch('/api/webdav', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                operation,
                config,
                payload,
                filename
            })
        });
        
        if (!response.ok) {
            console.error(`WebDAV Proxy Error: ${response.status}`);
            return null;
        }
        
        return await response.json();
    } catch (e) {
        console.error("WebDAV Proxy Network Error", e);
        return null;
    }
}

export const checkWebDavConnection = async (config: WebDavConfig): Promise<boolean> => {
    if (!config.url || !config.username || !config.password) return false;
    const result = await callWebDavProxy('check', config);
    return result?.success === true;
};

export const uploadBackup = async (config: WebDavConfig, data: { links: LinkItem[], categories: Category[], searchConfig?: SearchConfig, aiConfig?: AIConfig }): Promise<boolean> => {
    const result = await callWebDavProxy('upload', config, data);
    return result?.success === true;
};

export const uploadBackupWithTimestamp = async (config: WebDavConfig, data: { links: LinkItem[], categories: Category[], searchConfig?: SearchConfig, aiConfig?: AIConfig }): Promise<{ success: boolean; filename: string }> => {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').replace('T', '_').split('.')[0];
    const filename = `cloudnav_backup_${timestamp}.json`;
    const result = await callWebDavProxy('upload', config, data, filename);
    return { success: result?.success === true, filename };
};

export const downloadBackup = async (config: WebDavConfig): Promise<{ links: LinkItem[], categories: Category[], searchConfig?: SearchConfig, aiConfig?: AIConfig } | null> => {
    const result = await callWebDavProxy('download', config);
    
    // Check if the result looks like valid backup data
    if (result && Array.isArray(result.links) && Array.isArray(result.categories)) {
        return result as { links: LinkItem[], categories: Category[], searchConfig?: SearchConfig, aiConfig?: AIConfig };
    }
    return null;
};

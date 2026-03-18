import { LinkItem, Category } from '../types';
import { v4 as uuidv4 } from 'uuid'; // Assuming uuid is available or we use a simple generator

// Simple UUID generator fallback
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export interface ImportResult {
  links: LinkItem[];
  categories: Category[];
}

export const parseBookmarks = async (file: File): Promise<ImportResult> => {
  const text = await file.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'text/html');

  const links: LinkItem[] = [];
  const categories: Category[] = [];
  const categoryMap = new Map<string, string>(); // Name -> ID

  // Helper to get or create category ID
  const getCategoryId = (name: string): string => {
    if (!name) return 'common';
    // Normalize: remove generic folders like "Bookmarks Bar"
    if (['Bookmarks Bar', '書籤欄', 'Other Bookmarks', '其他書籤'].includes(name)) {
        return 'common';
    }

    if (categoryMap.has(name)) {
      return categoryMap.get(name)!;
    }
    
    // Check existing default categories could be mapped here if we had access, 
    // but for now we create new ones.
    const newId = generateId();
    categories.push({
      id: newId,
      name: name,
      icon: 'Folder' // Default icon for imported folders
    });
    categoryMap.set(name, newId);
    return newId;
  };

  // Traverse the DL/DT structure
  // Chrome structure: <DT><H3>Folder Name</H3><DL> ...items... </DL>
  
  const traverse = (element: Element, currentCategoryName: string) => {
    const children = Array.from(element.children);
    
    for (let i = 0; i < children.length; i++) {
      const node = children[i];
      const tagName = node.tagName.toUpperCase();

      if (tagName === 'DT') {
        // DT can contain an H3 (Folder) or A (Link)
        const h3 = node.querySelector('h3');
        const a = node.querySelector('a');
        const dl = node.querySelector('dl');

        if (h3 && dl) {
            // It's a folder
            const folderName = h3.textContent || 'Unknown';
            traverse(dl, folderName);
        } else if (a) {
            // It's a link
            const title = a.textContent || a.getAttribute('href') || 'No Title';
            const url = a.getAttribute('href');
            
            if (url && !url.startsWith('chrome://') && !url.startsWith('about:')) {
                links.push({
                    id: generateId(),
                    title: title,
                    url: url,
                    categoryId: getCategoryId(currentCategoryName),
                    createdAt: Date.now(),
                    icon: a.getAttribute('icon') || undefined
                });
            }
        }
      }
    }
  };

  const rootDl = doc.querySelector('dl');
  if (rootDl) {
    traverse(rootDl, 'common');
  }

  return { links, categories };
};

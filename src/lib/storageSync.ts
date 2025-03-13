
/**
 * Storage Sync Service
 * 
 * This service enables real-time data synchronization between multiple browser tabs
 * by using localStorage and the storage event.
 * 
 * When data is updated in localStorage from one tab, the storage event is fired in other tabs,
 * allowing them to update their state accordingly.
 */

type StorageSyncCallback = (data: any) => void;

interface StorageSyncListeners {
  [key: string]: StorageSyncCallback[];
}

class StorageSyncService {
  private listeners: StorageSyncListeners = {};

  constructor() {
    // Set up event listener for storage events (fired when localStorage changes in other tabs)
    window.addEventListener('storage', this.handleStorageChange);
  }

  /**
   * Handle storage change events from other tabs
   */
  private handleStorageChange = (event: StorageEvent) => {
    if (!event.key) return;
    
    // If we have listeners for this key, notify them
    if (this.listeners[event.key]) {
      try {
        const newValue = event.newValue ? JSON.parse(event.newValue) : null;
        this.listeners[event.key].forEach(callback => callback(newValue));
      } catch (error) {
        console.error(`Error parsing localStorage value for ${event.key}:`, error);
      }
    }
  };

  /**
   * Set data in localStorage and trigger updates in the current tab
   */
  setItem(key: string, data: any): void {
    const stringifiedData = JSON.stringify(data);
    localStorage.setItem(key, stringifiedData);
    
    // Also notify listeners in the current tab
    if (this.listeners[key]) {
      this.listeners[key].forEach(callback => callback(data));
    }
  }

  /**
   * Get data from localStorage
   */
  getItem<T>(key: string): T | null {
    const item = localStorage.getItem(key);
    if (!item) return null;
    
    try {
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Error parsing localStorage value for ${key}:`, error);
      return null;
    }
  }

  /**
   * Subscribe to changes for a specific key
   */
  subscribe(key: string, callback: StorageSyncCallback): () => void {
    if (!this.listeners[key]) {
      this.listeners[key] = [];
    }
    
    this.listeners[key].push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners[key] = this.listeners[key].filter(cb => cb !== callback);
      if (this.listeners[key].length === 0) {
        delete this.listeners[key];
      }
    };
  }
}

// Create a singleton instance
const storageSync = new StorageSyncService();

export default storageSync;

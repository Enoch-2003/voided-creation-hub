
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
  private storageLastUpdated: { [key: string]: number } = {};

  constructor() {
    // Set up event listener for storage events (fired when localStorage changes in other tabs)
    window.addEventListener('storage', this.handleStorageChange);
    
    // Initialize the last updated timestamps for commonly used keys
    const keysToTrack = ['outpasses', 'user', 'userRole'];
    keysToTrack.forEach(key => {
      this.storageLastUpdated[key] = Date.now();
    });
  }

  /**
   * Handle storage change events from other tabs
   */
  private handleStorageChange = (event: StorageEvent) => {
    if (!event.key) return;
    
    // Debounce the update to prevent multiple rapid changes
    const now = Date.now();
    const lastUpdate = this.storageLastUpdated[event.key] || 0;
    
    // Skip if the update is too soon after the last one (50ms debounce)
    if (now - lastUpdate < 50) return;
    
    this.storageLastUpdated[event.key] = now;
    
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
   * This method ensures proper stringification and avoids overwriting data with invalid values
   */
  setItem(key: string, data: any): void {
    try {
      // Only store valid data (prevent null or undefined from being stored as "null" or "undefined")
      const stringifiedData = data !== null && data !== undefined 
        ? JSON.stringify(data)
        : '';
      
      localStorage.setItem(key, stringifiedData);
      this.storageLastUpdated[key] = Date.now();
      
      // Also notify listeners in the current tab
      if (this.listeners[key]) {
        this.listeners[key].forEach(callback => callback(data));
      }
    } catch (error) {
      console.error(`Error setting localStorage value for ${key}:`, error);
    }
  }

  /**
   * Remove an item from localStorage and notify listeners
   */
  removeItem(key: string): void {
    localStorage.removeItem(key);
    this.storageLastUpdated[key] = Date.now();
    
    // Notify listeners that the item has been removed
    if (this.listeners[key]) {
      this.listeners[key].forEach(callback => callback(null));
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
   * When the subscription first runs, it immediately returns the current value
   */
  subscribe(key: string, callback: StorageSyncCallback): () => void {
    if (!this.listeners[key]) {
      this.listeners[key] = [];
    }
    
    this.listeners[key].push(callback);
    
    // Immediately call callback with current value
    try {
      const currentValue = this.getItem(key);
      callback(currentValue);
    } catch (error) {
      console.error(`Error getting initial value for ${key}:`, error);
    }
    
    // Return unsubscribe function
    return () => {
      this.listeners[key] = this.listeners[key].filter(cb => cb !== callback);
      if (this.listeners[key].length === 0) {
        delete this.listeners[key];
      }
    };
  }

  /**
   * Creates a broadcast channel for even faster cross-tab communication
   * This is an enhancement over the localStorage event which can sometimes be delayed
   */
  setupRealtimeSync(key: string): void {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(`amity-outpass-${key}`);
      
      // Listen for messages from other tabs
      channel.onmessage = (event) => {
        if (event.data && event.data.type === 'update' && event.data.key === key) {
          // Refresh from localStorage
          const data = this.getItem(key);
          
          // Notify listeners
          if (this.listeners[key]) {
            this.listeners[key].forEach(callback => callback(data));
          }
        }
      };
      
      // Enhance setItem to also broadcast changes
      const originalSetItem = this.setItem;
      this.setItem = (itemKey: string, data: any) => {
        originalSetItem.call(this, itemKey, data);
        
        // If this is the key we're syncing, broadcast the change
        if (itemKey === key) {
          channel.postMessage({ type: 'update', key: itemKey });
        }
      };
    }
  }
}

// Create a singleton instance
const storageSync = new StorageSyncService();

// Set up real-time sync for outpasses
storageSync.setupRealtimeSync('outpasses');

export default storageSync;

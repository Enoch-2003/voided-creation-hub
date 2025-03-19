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
  private tabId: string;
  private activeUserRoles: { [tabId: string]: string } = {};

  constructor() {
    // Generate a unique tab ID
    this.tabId = `tab_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Initialize stored tab data
    try {
      const storedTabs = localStorage.getItem('amipass_active_tabs');
      if (storedTabs) {
        this.activeUserRoles = JSON.parse(storedTabs);
      }
    } catch (error) {
      console.error('Error parsing active tabs data:', error);
      this.activeUserRoles = {};
    }
    
    // Set up event listener for storage events (fired when localStorage changes in other tabs)
    window.addEventListener('storage', this.handleStorageChange);
    
    // Initialize the last updated timestamps for commonly used keys
    const keysToTrack = ['outpasses', 'user', 'userRole'];
    keysToTrack.forEach(key => {
      this.storageLastUpdated[key] = Date.now();
    });
    
    // Register this tab on page load
    window.addEventListener('load', () => {
      this.registerTabSession();
    });
    
    // Cleanup tab data on unload
    window.addEventListener('beforeunload', () => {
      this.unregisterTabSession();
    });
    
    // Set up broadcast channel for faster real-time communication
    this.setupBroadcastChannels();
  }
  
  /**
   * Register this tab's session with user role information
   */
  private registerTabSession(): void {
    const userRole = localStorage.getItem('userRole');
    if (userRole) {
      // Store this tab's user role
      this.activeUserRoles[this.tabId] = userRole;
      localStorage.setItem('amipass_active_tabs', JSON.stringify(this.activeUserRoles));
    }
  }
  
  /**
   * Unregister this tab's session when closing
   */
  private unregisterTabSession(): void {
    delete this.activeUserRoles[this.tabId];
    localStorage.setItem('amipass_active_tabs', JSON.stringify(this.activeUserRoles));
  }
  
  /**
   * Set user authentication data for this specific tab
   */
  setUser(userData: any, userRole: string): void {
    // Store in session storage (specific to this tab)
    sessionStorage.setItem('user', JSON.stringify(userData));
    sessionStorage.setItem('userRole', userRole);
    
    // We still keep localStorage for outpass data synchronization
    localStorage.setItem('user_' + this.tabId, JSON.stringify(userData));
    localStorage.setItem('userRole_' + this.tabId, userRole);
    
    // Update active tabs registry
    this.activeUserRoles[this.tabId] = userRole;
    localStorage.setItem('amipass_active_tabs', JSON.stringify(this.activeUserRoles));
    
    // Trigger listeners in current tab
    if (this.listeners['user']) {
      this.listeners['user'].forEach(callback => callback(userData));
    }
    
    if (this.listeners['userRole']) {
      this.listeners['userRole'].forEach(callback => callback(userRole));
    }
    
    // Broadcast update about user change for outpass filtering
    if (window.BroadcastChannel) {
      const channel = new BroadcastChannel('amipass_user_changed');
      channel.postMessage({ tabId: this.tabId, userRole });
    }
  }
  
  /**
   * Get user data for this specific tab
   */
  getUser(): any {
    // Use sessionStorage to keep sessions isolated between tabs
    const userData = sessionStorage.getItem('user');
    if (!userData) return null;
    
    try {
      return JSON.parse(userData);
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }
  
  /**
   * Get user role for this specific tab
   */
  getUserRole(): string | null {
    // Use sessionStorage to keep sessions isolated between tabs
    return sessionStorage.getItem('userRole');
  }
  
  /**
   * Get tab ID 
   */
  getTabId(): string {
    return this.tabId;
  }

  /**
   * Handle storage change events from other tabs
   */
  private handleStorageChange = (event: StorageEvent) => {
    if (!event.key) return;
    
    // Skip user and userRole changes (now handled by session storage)
    if (event.key === 'user' || event.key === 'userRole') {
      return;
    }
    
    // Skip tab-specific user data
    if (event.key.startsWith('user_') || event.key.startsWith('userRole_')) {
      return;
    }
    
    // Handle outpasses and other shared data
    
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
    // Also clear from sessionStorage for user-related items
    if (key === 'user' || key === 'userRole') {
      sessionStorage.removeItem(key);
      
      // Clear from tab-specific storage too
      localStorage.removeItem('user_' + this.tabId);
      localStorage.removeItem('userRole_' + this.tabId);
      
      // Update active tabs registry
      delete this.activeUserRoles[this.tabId];
      localStorage.setItem('amipass_active_tabs', JSON.stringify(this.activeUserRoles));
    }
    
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
    // For user data, use tab-specific storage
    if (key === 'user') {
      return this.getUser() as T;
    }
    
    if (key === 'userRole') {
      return this.getUserRole() as unknown as T;
    }
    
    // For other data, use localStorage as before
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
   * Creates broadcast channels for even faster cross-tab communication
   */
  private setupBroadcastChannels(): void {
    if (typeof BroadcastChannel !== 'undefined') {
      // Channel for outpass changes
      const outpassChannel = new BroadcastChannel('amity-outpass-outpasses');
      
      // Listen for messages from other tabs
      outpassChannel.onmessage = (event) => {
        if (event.data && event.data.type === 'update' && event.data.key === 'outpasses') {
          // Refresh from localStorage
          const data = this.getItem('outpasses');
          
          // Notify listeners
          if (this.listeners['outpasses']) {
            this.listeners['outpasses'].forEach(callback => callback(data));
          }
        }
      };
      
      // User change channel
      const userChannel = new BroadcastChannel('amipass_user_changed');
      userChannel.onmessage = (event) => {
        // We don't update the user data across tabs anymore
        // Just log for debugging
        console.log('Another tab changed user:', event.data);
      };
    }
  }

  /**
   * Sets up real-time sync for a specific key
   */
  setupRealtimeSync(key: string): void {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(`amity-outpass-${key}`);
      
      // Enhance setItem to also broadcast changes
      const originalSetItem = this.setItem;
      this.setItem = function(itemKey: string, data: any) {
        originalSetItem.call(this, itemKey, data);
        
        // If this is the key we're syncing, broadcast the change
        if (itemKey === key) {
          channel.postMessage({ type: 'update', key: itemKey });
        }
        
        // Special handling for users data - notify about user updates
        if (itemKey === 'users') {
          const userChannel = new BroadcastChannel('amipass_users_changed');
          userChannel.postMessage({ type: 'update', timestamp: Date.now() });
        }
      };
    }
  }
  
  /**
   * Logout function that handles session cleanup
   */
  logout(): void {
    // Clear session storage (tab-specific)
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('userRole');
    
    // Clear tab-specific localStorage items
    localStorage.removeItem('user_' + this.tabId);
    localStorage.removeItem('userRole_' + this.tabId);
    
    // Update active tabs registry
    delete this.activeUserRoles[this.tabId];
    localStorage.setItem('amipass_active_tabs', JSON.stringify(this.activeUserRoles));
    
    // Notify listeners
    if (this.listeners['user']) {
      this.listeners['user'].forEach(callback => callback(null));
    }
    
    if (this.listeners['userRole']) {
      this.listeners['userRole'].forEach(callback => callback(null));
    }
  }
}

// Create a singleton instance
const storageSync = new StorageSyncService();

// Set up real-time sync for outpasses
storageSync.setupRealtimeSync('outpasses');
// Set up real-time sync for users
storageSync.setupRealtimeSync('users');

export default storageSync;

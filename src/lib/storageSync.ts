/**
 * Storage Sync Service
 * 
 * This service enables real-time data synchronization between multiple browser tabs
 * by using localStorage, sessionStorage and the BroadcastChannel API.
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
  private broadcastChannels: { [key: string]: BroadcastChannel } = {};

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
    const keysToTrack = ['outpasses', 'user', 'userRole', 'users'];
    keysToTrack.forEach(key => {
      this.storageLastUpdated[key] = Date.now();
    });
    
    // Register this tab on page load
    window.addEventListener('load', () => {
      this.registerTabSession();
      this.setupBroadcastChannels();
    });
    
    // Cleanup tab data on unload
    window.addEventListener('beforeunload', () => {
      this.unregisterTabSession();
      this.cleanupBroadcastChannels();
    });
  }
  
  /**
   * Register this tab's session with user role information
   */
  private registerTabSession(): void {
    const userRole = sessionStorage.getItem('userRole');
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
    sessionStorage.setItem('userId', userData.id);
    
    // We still keep localStorage for outpass data synchronization
    localStorage.setItem('user_' + this.tabId, JSON.stringify(userData));
    localStorage.setItem('userRole_' + this.tabId, userRole);
    
    // Update users array in localStorage if it exists
    const users = this.getItem<any[]>('users') || [];
    const existingUserIndex = users.findIndex(u => u.id === userData.id);
    
    if (existingUserIndex >= 0) {
      // Update existing user
      users[existingUserIndex] = userData;
      this.setItem('users', users);
    } else {
      // Add user if not found
      this.setItem('users', [...users, userData]);
    }
    
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
    
    if (this.listeners['users']) {
      this.listeners['users'].forEach(callback => this.getItem<any[]>('users'));
    }
    
    // Broadcast update about user change for outpass filtering
    this.broadcastMessage('amipass_user_changed', { 
      tabId: this.tabId, 
      userRole, 
      userId: userData.id 
    });
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
      
      // Broadcast the change to other tabs for specific important keys
      if (key === 'outpasses' || key === 'users') {
        this.broadcastMessage(`amipass_${key}_changed`, { 
          timestamp: Date.now(),
          tabId: this.tabId
        });
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
      sessionStorage.removeItem('userId');
      
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
   * Helper method to broadcast a message using BroadcastChannel API
   */
  private broadcastMessage(channel: string, data: any): void {
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const bc = new BroadcastChannel(channel);
        bc.postMessage(data);
        bc.close();
      } catch (error) {
        console.error(`Error broadcasting message on channel ${channel}:`, error);
      }
    }
  }

  /**
   * Creates broadcast channels for fast cross-tab communication
   */
  private setupBroadcastChannels(): void {
    if (typeof BroadcastChannel !== 'undefined') {
      // Close any existing channels first
      this.cleanupBroadcastChannels();
      
      try {
        // Channel for outpass changes
        const outpassChannel = new BroadcastChannel('outpass_changes');
        this.broadcastChannels['outpass_changes'] = outpassChannel;
        
        // Listen for outpass changes from other tabs
        outpassChannel.onmessage = (event) => {
          if (!event.data) return;
          
          console.log("Received outpass change broadcast:", event.data);
          const data = this.getItem('outpasses');
          
          // Get current outpasses from localStorage & update
          const outpasses = this.getItem('outpasses');
          if (outpasses && this.listeners['outpasses']) {
            this.listeners['outpasses'].forEach(callback => callback(outpasses));
          }
        };
        
        // User changes channel
        const userChangesChannel = new BroadcastChannel('amipass_user_changed');
        this.broadcastChannels['amipass_user_changed'] = userChangesChannel;
        
        userChangesChannel.onmessage = (event) => {
          if (!event.data || !event.data.userId || event.data.tabId === this.tabId) return;
          
          const currentUser = this.getUser();
          if (currentUser && currentUser.id === event.data.userId) {
            // Refresh user data from users array
            const users = this.getItem<any[]>('users') || [];
            const updatedUser = users.find(u => u.id === event.data.userId);
            
            if (updatedUser) {
              // Update session storage
              sessionStorage.setItem('user', JSON.stringify(updatedUser));
              
              // Notify user listeners
              if (this.listeners['user']) {
                this.listeners['user'].forEach(callback => callback(updatedUser));
              }
            }
          }
        };
        
        // Users changes channel
        const usersChangesChannel = new BroadcastChannel('amipass_users_changed');
        this.broadcastChannels['amipass_users_changed'] = usersChangesChannel;
        
        usersChangesChannel.onmessage = (event) => {
          if (!event.data || event.data.tabId === this.tabId) return;
          
          // Refresh users data
          const users = this.getItem('users');
          if (this.listeners['users']) {
            this.listeners['users'].forEach(callback => callback(users));
          }
          
          // Also update current user if needed
          const currentUser = this.getUser();
          if (currentUser && currentUser.id) {
            const users = this.getItem<any[]>('users') || [];
            const updatedUser = users.find(u => u.id === currentUser.id);
            
            if (updatedUser && JSON.stringify(updatedUser) !== JSON.stringify(currentUser)) {
              // Update session storage
              sessionStorage.setItem('user', JSON.stringify(updatedUser));
              
              // Notify user listeners
              if (this.listeners['user']) {
                this.listeners['user'].forEach(callback => callback(updatedUser));
              }
            }
          }
        };
        
        // Outpasses changes channel
        const outpassesChangesChannel = new BroadcastChannel('amipass_outpasses_changed');
        this.broadcastChannels['amipass_outpasses_changed'] = outpassesChangesChannel;
        
        outpassesChangesChannel.onmessage = (event) => {
          if (!event.data || event.data.tabId === this.tabId) return;
          
          // Refresh outpasses data
          const outpasses = this.getItem('outpasses');
          if (this.listeners['outpasses']) {
            this.listeners['outpasses'].forEach(callback => callback(outpasses));
          }
        };
      } catch (error) {
        console.error("Error setting up broadcast channels:", error);
      }
    }
  }
  
  /**
   * Cleanup broadcast channels when tab closes
   */
  private cleanupBroadcastChannels(): void {
    Object.values(this.broadcastChannels).forEach(channel => {
      try {
        channel.close();
      } catch (error) {
        console.error("Error closing broadcast channel:", error);
      }
    });
    
    this.broadcastChannels = {};
  }

  /**
   * Sets up real-time sync for a specific key
   */
  setupRealtimeSync(key: string): void {
    // We now use BroadcastChannel API for more reliable cross-tab communication
    this.broadcastMessage(`amipass_${key}_setup`, { tabId: this.tabId });
  }
  
  /**
   * Logout function that handles session cleanup
   */
  logout(): void {
    // Clear session storage (tab-specific)
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('userId');
    
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
    
    // Broadcast logout to other tabs
    this.broadcastMessage('amipass_user_logout', { tabId: this.tabId });
  }
}

// Create a singleton instance
const storageSync = new StorageSyncService();

// Set up real-time sync for outpasses
storageSync.setupRealtimeSync('outpasses');
// Set up real-time sync for users
storageSync.setupRealtimeSync('users');

export default storageSync;

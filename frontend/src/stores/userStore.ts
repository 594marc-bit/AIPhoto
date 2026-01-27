/* eslint-disable */
// @ts-nocheck
import { defineStore, acceptHMRUpdate } from 'pinia';
import type {
  User,
  UserType,
  UserPermissions,
  UserSettings,
  LoginCredentials,
  RegisterData,
} from '@/types/user';
import { getPermissionsByType } from '@/types/user';
import { apiClient } from '@/api/client';

/**
 * Create a guest user
 */
function createGuestUser(): User {
  return {
    id: 'guest',
    username: '访客',
    type: 'guest',
    createdAt: new Date().toISOString(),
  };
}

interface UserState {
  currentUser: User | null;
  isAuthenticated: boolean;
  userSettings: UserSettings | null;
  isLoading: boolean;
  apiConnected: boolean;
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    currentUser: null,
    isAuthenticated: false,
    userSettings: null,
    isLoading: false,
    apiConnected: false,
  }),

  getters: {
    /**
     * Get current user type
     */
    userType: (state): UserType => {
      return state.currentUser?.type ?? 'guest';
    },

    /**
     * Check if current user is guest
     */
    isGuest: (state): boolean => {
      return state.currentUser?.type === 'guest' || !state.isAuthenticated;
    },

    /**
     * Check if current user is admin
     */
    isAdmin: (state): boolean => {
      return state.currentUser?.type === 'admin';
    },

    /**
     * Get user permissions based on user type
     */
    permissions: (state): UserPermissions => {
      if (!state.currentUser) {
        return getPermissionsByType('guest');
      }
      return getPermissionsByType(state.currentUser.type);
    },

    /**
     * Check if user can save settings
     */
    canSaveSettings: (state): boolean => {
      return state.currentUser?.type === 'user' || state.currentUser?.type === 'admin';
    },

    /**
     * Check if user can use custom logo
     */
    canUseCustomLogo: (state): boolean => {
      return state.currentUser?.type === 'user' || state.currentUser?.type === 'admin';
    },

    /**
     * Check if user can batch process
     */
    canBatchProcess: (state): boolean => {
      return state.currentUser?.type === 'user' || state.currentUser?.type === 'admin';
    },

    /**
     * Get max images per batch
     */
    maxImagesPerBatch: (state): number => {
      if (!state.currentUser || state.currentUser.type === 'guest') {
        return 1; // Guest can only upload 1 image
      }
      if (state.currentUser.type === 'admin') {
        return 100;
      }
      return 50;
    },

    /**
     * Get display name
     */
    displayName: (state): string => {
      return state.currentUser?.username ?? '访客';
    },

    /**
     * Get user type label for display
     */
    userTypeLabel: (state): string => {
      if (!state.currentUser) return '访客';
      switch (state.currentUser.type) {
        case 'admin':
          return '管理员';
        case 'user':
          return '注册用户';
        case 'guest':
        default:
          return '访客';
      }
    },
  },

  actions: {
    /**
     * Initialize user store - auto login as guest by default
     */
    async initialize() {
      this.isLoading = true;

      try {
        // Check if user has a valid token
        if (apiClient.isAuthenticated()) {
          // Try to get current user from API
          const response = await apiClient.getCurrentUser();

          if (response.data) {
            // Determine user type based on response
            // For now, all API users are regular users
            // Admin status should come from the backend
            const userType: UserType = response.data.username === 'admin' ? 'admin' : 'user';

            this.currentUser = {
              id: response.data.id,
              username: response.data.username,
              email: response.data.email,
              type: userType,
              createdAt: response.data.created_at,
            };
            this.isAuthenticated = true;
            this.apiConnected = true;

            // Load user settings from API
            await this.loadSettingsFromApi();
          } else {
            // Token is invalid, fall back to guest
            apiClient.logout();
            this.loginAsGuest();
          }
        } else {
          // No token, default to guest login
          this.loginAsGuest();
        }

        // Check API connectivity
        if (!this.apiConnected) {
          const healthResponse = await apiClient.healthCheck();
          this.apiConnected = !!healthResponse.data;
        }
      } catch (error) {
        console.error('Failed to initialize user store:', error);
        // On error, default to guest login
        this.loginAsGuest();
        this.apiConnected = false;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Login as guest (default behavior)
     */
    loginAsGuest() {
      this.currentUser = createGuestUser();
      this.isAuthenticated = false;
      // Guest is "authenticated" but without API token
    },

    /**
     * Login with credentials via API
     */
    async login(credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> {
      this.isLoading = true;

      try {
        const response = await apiClient.login(
          credentials.username,
          credentials.password
        );

        if (response.data) {
          // Determine user type based on username
          const userType: UserType = response.data.user.username === 'admin' ? 'admin' : 'user';

          this.currentUser = {
            id: response.data.user.id,
            username: response.data.user.username,
            email: response.data.user.email,
            type: userType,
            createdAt: response.data.user.created_at,
          };
          this.isAuthenticated = true;
          this.apiConnected = true;

          // Load user settings
          await this.loadSettingsFromApi();

          return { success: true };
        } else {
          return { success: false, error: response.error ?? response.detail ?? '登录失败' };
        }
      } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: '登录失败，请稍后重试' };
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Register new user via API
     */
    async register(data: RegisterData): Promise<{ success: boolean; error?: string }> {
      this.isLoading = true;

      try {
        const response = await apiClient.register(
          data.username,
          data.email,
          data.password
        );

        if (response.data) {
          this.currentUser = {
            id: response.data.user.id,
            username: response.data.user.username,
            email: response.data.user.email,
            type: 'user', // Regular users are always 'user' type
            createdAt: response.data.user.created_at,
          };
          this.isAuthenticated = true;
          this.apiConnected = true;

          return { success: true };
        } else {
          return { success: false, error: response.error ?? response.detail ?? '注册失败' };
        }
      } catch (error) {
        console.error('Registration error:', error);
        return { success: false, error: '注册失败，请稍后重试' };
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Logout current user and return to guest mode
     */
    logout() {
      apiClient.logout();
      this.loginAsGuest();
    },

    /**
     * Switch to guest mode
     */
    switchToGuest() {
      this.logout();
    },

    /**
     * Load settings from API
     */
    async loadSettingsFromApi() {
      if (!this.isAuthenticated || !this.apiConnected) {
        return;
      }

      try {
        const response = await apiClient.getSettings();
        if (response.data?.settings) {
          this.userSettings = response.data.settings as UserSettings;
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    },

    /**
     * Update user settings
     */
    async updateSettings(settings: Partial<UserSettings>) {
      this.userSettings = {
        ...this.userSettings,
        ...settings,
      };

      // Save to API if authenticated and API is connected
      if (this.isAuthenticated && this.apiConnected && this.currentUser?.type !== 'guest') {
        try {
          await apiClient.saveSettings(this.userSettings);
        } catch (error) {
          console.error('Failed to save settings to API:', error);
        }
      }
    },

    /**
     * Clear user settings
     */
    async clearSettings() {
      this.userSettings = null;

      // Clear from API if authenticated and API is connected
      if (this.isAuthenticated && this.apiConnected && this.currentUser?.type !== 'guest') {
        try {
          await apiClient.deleteSettings();
        } catch (error) {
          console.error('Failed to clear settings from API:', error);
        }
      }
    },

    /**
     * Get stored settings
     */
    getSettings(): UserSettings | null {
      return this.userSettings;
    },

    /**
     * Check if API is connected
     */
    isApiConnected(): boolean {
      return this.apiConnected;
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUserStore, import.meta.hot));
}

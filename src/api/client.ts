/**
 * API client for backend communication
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  detail?: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    username: string;
    email: string;
    created_at: string;
    last_login?: string;
  };
}

interface SettingsResponse {
  settings: Record<string, unknown>;
  updated_at?: string;
}

/**
 * API Client class
 */
class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    // Load token from localStorage
    this.token = localStorage.getItem('aiphoto_token');
  }

  /**
   * Set authentication token
   */
  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('aiphoto_token', token);
    } else {
      localStorage.removeItem('aiphoto_token');
    }
  }

  /**
   * Get authentication token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Make API request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add authorization header if token exists
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.detail || data.error || 'Request failed',
          detail: data.detail,
        };
      }

      return { data };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * User registration
   */
  async register(username: string, email: string, password: string): Promise<ApiResponse<TokenResponse>> {
    const response = await this.request<TokenResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });

    // Store token if registration successful
    if (response.data?.access_token) {
      this.setToken(response.data.access_token);
    }

    return response;
  }

  /**
   * User login
   */
  async login(username: string, password: string): Promise<ApiResponse<TokenResponse>> {
    const response = await this.request<TokenResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    // Store token if login successful
    if (response.data?.access_token) {
      this.setToken(response.data.access_token);
    }

    return response;
  }

  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<ApiResponse<TokenResponse['user']>> {
    return this.request<TokenResponse['user']>('/auth/me');
  }

  /**
   * Get user settings
   */
  async getSettings(): Promise<ApiResponse<SettingsResponse>> {
    return this.request<SettingsResponse>('/settings');
  }

  /**
   * Save user settings
   */
  async saveSettings(settings: Record<string, unknown>): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>('/settings', {
      method: 'POST',
      body: JSON.stringify({ settings }),
    });
  }

  /**
   * Delete user settings
   */
  async deleteSettings(): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>('/settings', {
      method: 'DELETE',
    });
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<ApiResponse<{ status: string }>> {
    return this.request<{ status: string }>('/health');
  }

  /**
   * Logout (clear token)
   */
  logout() {
    this.setToken(null);
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.token !== null;
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

// Export types
export type { TokenResponse, SettingsResponse };

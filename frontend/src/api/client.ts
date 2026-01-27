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

// HDR Image Processing Types
interface HDRAnalysisResult {
  has_hdr: boolean;
  has_gain_map?: boolean;
  has_gcontainer?: boolean;
  metadata?: {
    hdr_version?: string;
    gain_map_min?: string;
    gain_map_max?: string;
    gamma?: string;
    has_gain_map?: boolean;
    has_gcontainer?: boolean;
  };
}

interface BorderOptions {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  color?: string;
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

    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> ?? {}),
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

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();

        if (!response.ok) {
          return {
            error: data.detail || data.error || 'Request failed',
            detail: data.detail,
          };
        }

        return { data };
      } else {
        // Non-JSON response (e.g., file download)
        if (!response.ok) {
          return {
            error: response.statusText || 'Request failed',
          };
        }
        const blob = await response.blob();
        console.log('[API Client] Response blob:', {
          type: blob.type,
          size: blob.size,
          endpoint,
        });
        // Validate blob size for HDR processing (should be > 1MB for HDR images)
        if (endpoint.includes('process-hdr') && blob.size < 100000) {
          console.error('[API Client] Suspiciously small HDR response:', blob.size, 'Expected > 100KB for HDR images');
        }
        return { data: blob as unknown as T };
      }
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
   * Analyze image for HDR Gain Map
   */
  async analyzeHDR(image: File): Promise<ApiResponse<HDRAnalysisResult>> {
    const formData = new FormData();
    formData.append('image', image);

    return this.request<HDRAnalysisResult>('/image/analyze-hdr', {
      method: 'POST',
      body: formData,
    });
  }

  /**
   * Process HDR image with border
   */
  async processHDR(
    image: File,
    options: BorderOptions,
    preserveHDR: boolean = true
  ): Promise<ApiResponse<Blob>> {
    const formData = new FormData();
    formData.append('image', image);
    formData.append('options', JSON.stringify(options));
    // Use 'true'/'false' string for Python backend compatibility
    formData.append('preserve_hdr', preserveHDR ? 'true' : 'false');

    console.log('[API Client] processHDR called with:', {
      imageName: image.name,
      imageSize: image.size,
      options,
      preserveHDR,
    });

    const response = await this.request<Blob>('/image/process-hdr', {
      method: 'POST',
      body: formData,
    });

    console.log('[API Client] processHDR response:', {
      hasError: !!response.error,
      error: response.error,
      hasData: !!response.data,
      dataType: response.data instanceof Blob ? 'Blob' : typeof response.data,
      dataSize: response.data instanceof Blob ? response.data.size : 'N/A',
    });

    return response;
  }

  /**
   * Add simple border to image (non-HDR)
   */
  async addBorder(
    image: File,
    options: BorderOptions
  ): Promise<ApiResponse<Blob>> {
    const formData = new FormData();
    formData.append('image', image);
    formData.append('top', String(options.top ?? 0));
    formData.append('bottom', String(options.bottom ?? 0));
    formData.append('left', String(options.left ?? 0));
    formData.append('right', String(options.right ?? 0));
    formData.append('color', options.color ?? '#ffffff');

    return this.request<Blob>('/image/add-border', {
      method: 'POST',
      body: formData,
    });
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
export type { TokenResponse, SettingsResponse, HDRAnalysisResult, BorderOptions };


import { config } from './config';

interface RequestOptions extends RequestInit {
  token?: string;
}

class ApiClient {
  private baseUrl: string;
  private fallbackUrl?: string;

  constructor(baseUrl: string, fallbackUrl?: string) {
    this.baseUrl = baseUrl;
    this.fallbackUrl = fallbackUrl;
  }

  private async requestOnce<T>(base: string, endpoint: string, options: RequestOptions = {}): Promise<{ ok: boolean; data?: T; error?: Error; nonJson?: boolean; preview?: string; status?: number; }>{
    const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${normalizedBase}${normalizedEndpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers as any,
    };

    // Dynamically grab token from storage to ensure we use the refreshed one
    const token = localStorage.getItem('wpm_auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, { ...options, headers });
      const contentType = response.headers.get('content-type') || '';

      if (!response.ok) {
        // Handle 401s specifically if needed, but AuthContext handles proactive refresh
        let errorMessage: string;
        if (contentType.includes('application/json')) {
          const errorBody = await response.json().catch(() => ({}));
          errorMessage = errorBody.message || `API Error: ${response.statusText}`;
        } else {
          const text = await response.text();
          errorMessage = text || `API Error: ${response.statusText}`;
        }
        console.error(`[${response.status}] ${url}:`, errorMessage);
        return { ok: false, error: new Error(errorMessage), status: response.status };
      }

      if (response.status === 204) return {} as T;

      if (contentType.includes('application/json')) {
        const data = await response.json();
        return { ok: true, data };
      }

      // Try to parse text as JSON if server forgot content-type
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        return { ok: true, data };
      } catch {
        // Non-JSON response when JSON is expected usually means wrong API_BASE_URL or server misconfigured
        return { ok: false, nonJson: true, preview: text?.slice(0, 200), status: response.status };
      }
    } catch (error: any) {
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        const networkError = `Network Error: Cannot reach backend at ${base}. Please ensure the server is running.`;
        console.error(networkError);
        return { ok: false, error: new Error(networkError) };
      }
      console.error('API Request Failed:', error);
      return { ok: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    // Try primary
    const primary = await this.requestOnce<T>(this.baseUrl, endpoint, options);
    if (primary.ok && primary.data !== undefined) return primary.data;

    // If non-JSON or network error, try fallback when available
    if (this.fallbackUrl) {
      console.warn(`Primary API failed (status ${primary.status ?? 'n/a'}). Trying fallback: ${this.fallbackUrl}`);
      const backup = await this.requestOnce<T>(this.fallbackUrl, endpoint, options);
      if (backup.ok && backup.data !== undefined) return backup.data;

      // Merge context for clearer error
      const preview = backup.preview || primary.preview;
      const status = backup.status || primary.status;
      const err = backup.error || primary.error || new Error('API request failed');
      const hint = preview ? `Response preview: ${preview.slice(0, 120)}` : '';
      throw new Error(`[API fallback failed] status=${status ?? 'n/a'} ${err.message}${hint ? ' | ' + hint : ''}`);
    }

    if (primary.nonJson) {
      const hint = `Unexpected non-JSON response from API (${primary.status ?? 'n/a'}). Check VITE_API_URL/base URL. Current base: ${this.baseUrl}`;
      console.error(hint, 'Payload preview:', primary.preview);
      throw new Error(`${hint}. Response preview: ${primary.preview?.slice(0, 120)}`);
    }

    if (primary.error) throw primary.error;
    throw new Error('API request failed with unknown error');
  }

  get<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, body: any) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  put<T>(endpoint: string, body: any) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient(config.API_BASE_URL, config.API_FALLBACK_URL);

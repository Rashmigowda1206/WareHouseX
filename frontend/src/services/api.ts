import { handleMockRequest } from './mockFallback';

const API_BASE_URL = '/api';

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('whx_auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      localStorage.removeItem('whx_auth_token');
      localStorage.removeItem('whx_user');
      if (!window.location.pathname.includes('/login')) {
        window.dispatchEvent(new Event('whx-session-expired'));
      }
    }

    if (response.headers.get('content-type')?.includes('text/csv')) {
      return (await response.text()) as unknown as T;
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return await handleMockRequest<T>(endpoint, options);
    }

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 404 || response.status === 502 || response.status === 503) {
        return await handleMockRequest<T>(endpoint, options);
      }
      throw new Error(data.error || data.message || `Request failed with code ${response.status}`);
    }

    return data;
  } catch (err) {
    // Network failure or static hosting without live backend (e.g. GitHub Pages)
    return await handleMockRequest<T>(endpoint, options);
  }
}

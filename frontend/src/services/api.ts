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

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || `Request failed with code ${response.status}`);
  }

  return data;
}

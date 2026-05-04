const BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const fetcher = (path: string) => apiFetch(path);

function storeTokens(data: { access?: string; refresh?: string }, username: string) {
  if (data.access) localStorage.setItem('access_token', data.access);
  if (data.refresh) localStorage.setItem('refresh_token', data.refresh);
  localStorage.setItem('username', username);
}

export async function login(username: string, password: string) {
  const res = await fetch(`${BASE}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  storeTokens(data, username);
  return data;
}

export async function register(username: string, password1: string, password2: string) {
  const res = await fetch(`${BASE}/auth/registration/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password1, password2 }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  storeTokens(data, username);
  return data;
}

export function logout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('username');
  localStorage.removeItem('swr-cache');
}

export function getStoredUsername(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('username') ?? '';
}

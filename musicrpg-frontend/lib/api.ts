const BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

const ERROR_MAP: Record<string, string> = {
  '提供された認証情報でログインできません。': 'ユーザー名またはパスワードが違います',
  'Unable to log in with provided credentials.': 'ユーザー名またはパスワードが違います',
  'A user with that username already exists.': 'そのユーザー名はすでに使われています',
  'このユーザー名はすでに使われています。': 'そのユーザー名はすでに使われています',
  'This password is too short.': 'パスワードは8文字以上にしてください',
  'This password is too common.': 'そのパスワードは使いやすすぎます。別のものを試してください',
  'This password is entirely numeric.': 'パスワードに数字以外の文字を含めてください',
};

async function parseError(res: Response): Promise<string> {
  const text = await res.text();
  try {
    const json = JSON.parse(text) as Record<string, unknown>;
    const candidates = [
      ...(Array.isArray(json.non_field_errors) ? json.non_field_errors : []),
      ...(typeof json.detail === 'string' ? [json.detail] : []),
      ...(typeof json.error === 'string' ? [json.error] : []),
      ...Object.values(json)
        .filter(Array.isArray)
        .flatMap((v) => v as string[]),
    ];
    for (const msg of candidates) {
      if (ERROR_MAP[msg]) return ERROR_MAP[msg];
    }
    if (candidates.length > 0) return candidates[0] as string;
  } catch {
    // not JSON
  }
  return 'エラーが発生しました。しばらくしてから再度お試しください';
}

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
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export const fetcher = (path: string) => apiFetch(path);

/**
 * ユーザーごとに分離された SWR キャッシュを全て削除する。
 * ログイン・ログアウト時に呼び出し、別アカウントのキャッシュが残らないようにする。
 */
function clearAllSWRCaches() {
  if (typeof window === 'undefined') return;
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('swr-cache-')) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
  // 旧形式のキャッシュキーも削除
  localStorage.removeItem('swr-cache');
}

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
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  // 別アカウントのキャッシュが残っている場合に備えて先にクリアする
  clearAllSWRCaches();
  storeTokens(data, username);
  return data;
}

export async function register(username: string, password1: string, password2: string) {
  const res = await fetch(`${BASE}/auth/registration/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password1, password2 }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  // 新規登録時も既存キャッシュをクリアする
  clearAllSWRCaches();
  storeTokens(data, username);
  return data;
}

export function logout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('username');
  // ユーザーごとの SWR キャッシュをすべて削除する
  clearAllSWRCaches();
}

export function getStoredUsername(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('username') ?? '';
}

// ── Admin ─────────────────────────────────────────────────────
function adminHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function adminLogin(username: string, password: string) {
  const res = await fetch(`${BASE}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json() as { access: string; refresh: string };
  localStorage.setItem('admin_token', data.access);

  const meRes = await fetch(`${BASE}/admin/me/`, { headers: adminHeaders() });
  if (!meRes.ok) {
    localStorage.removeItem('admin_token');
    throw new Error('管理者権限がありません');
  }
  const me = await meRes.json() as { is_staff: boolean; username: string };
  if (!me.is_staff) {
    localStorage.removeItem('admin_token');
    throw new Error('管理者権限がありません');
  }
  localStorage.setItem('admin_username', me.username);
  return me;
}

export function adminLogout() {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_username');
}

export function getAdminUsername(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('admin_username') ?? '';
}

export async function adminFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { ...options, headers: { ...adminHeaders(), ...options.headers } });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

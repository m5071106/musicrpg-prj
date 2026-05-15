// ── 型定義 ──────────────────────────────────────────────

export interface PartnerProfile {
  username: string;
  instruments: string[];
  songs: Array<{ title: string; stars: number; mb_id?: string }>;
  stats: {
    stat_tempo: number;
    stat_emotion: number;
    stat_range: number;
    stat_effort: number;
    stat_stage: number;
  };
  scannedAt: string;
}

export interface SessionRecord {
  id: string;
  partnerUsername: string;
  partnerInstruments: string[];
  playedSongs: string[];
  date: string;
}

// ── サーバー API レスポンス型 ────────────────────────────

interface ServerPartner {
  id: number;
  partner_username: string;
  partner_instruments: string[];
  partner_songs: Array<{ title: string; stars: number; mb_id?: string }>;
  partner_stats: {
    stat_tempo: number;
    stat_emotion: number;
    stat_range: number;
    stat_effort: number;
    stat_stage: number;
  };
  scanned_at: string;
  updated_at: string;
}

interface ServerSession {
  id: number;
  client_id: string;
  partner_username: string;
  partner_instruments: string[];
  played_songs: string[];
  session_date: string;
  created_at: string;
}

// ── ローカルストレージ: パートナー管理 ──────────────────

export function getPartners(): PartnerProfile[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('mrpg_partners') ?? '[]');
  } catch { return []; }
}

export function savePartner(p: PartnerProfile): void {
  if (typeof window === 'undefined') return;
  const existing = getPartners().filter(x => x.username !== p.username);
  localStorage.setItem('mrpg_partners', JSON.stringify([p, ...existing].slice(0, 30)));
}

// ── ローカルストレージ: セッション記録 ──────────────────

export function getSessions(): SessionRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('mrpg_sessions') ?? '[]');
  } catch { return []; }
}

export function saveSession(s: SessionRecord): void {
  if (typeof window === 'undefined') return;
  const all = getSessions();
  localStorage.setItem('mrpg_sessions', JSON.stringify([s, ...all].slice(0, 100)));
}

// ── サーバー同期: パートナー ────────────────────────────

export async function fetchPartnersFromServer(apiFetch: <T>(path: string) => Promise<T>): Promise<PartnerProfile[]> {
  try {
    const serverList = await apiFetch<ServerPartner[]>('/music/partners/');
    const profiles: PartnerProfile[] = serverList.map(s => ({
      username: s.partner_username,
      instruments: Array.isArray(s.partner_instruments) ? s.partner_instruments : [],
      songs: s.partner_songs,
      stats: s.partner_stats,
      scannedAt: s.scanned_at,
    }));
    if (typeof window !== 'undefined') {
      localStorage.setItem('mrpg_partners', JSON.stringify(profiles.slice(0, 30)));
    }
    return profiles;
  } catch {
    return getPartners();
  }
}

export async function savePartnerToServer(
  p: PartnerProfile,
  apiFetch: <T>(path: string, options?: RequestInit) => Promise<T>
): Promise<void> {
  savePartner(p);
  try {
    await apiFetch<ServerPartner>('/music/partners/', {
      method: 'POST',
      body: JSON.stringify({
        partner_username: p.username,
        partner_instruments: p.instruments,
        partner_songs: p.songs,
        partner_stats: p.stats,
        scanned_at: p.scannedAt,
      }),
    });
  } catch {
    // オフライン時はローカルデータを維持
  }
}

// ── サーバー同期: セッション履歴 ────────────────────────

export async function fetchSessionsFromServer(apiFetch: <T>(path: string) => Promise<T>): Promise<SessionRecord[]> {
  try {
    const serverList = await apiFetch<ServerSession[]>('/music/sessions/');
    const records: SessionRecord[] = serverList.map(s => ({
      id: s.client_id,
      partnerUsername: s.partner_username,
      partnerInstruments: Array.isArray(s.partner_instruments) ? s.partner_instruments : [],
      playedSongs: s.played_songs,
      date: s.session_date,
    }));
    if (typeof window !== 'undefined') {
      localStorage.setItem('mrpg_sessions', JSON.stringify(records.slice(0, 100)));
    }
    return records;
  } catch {
    return getSessions();
  }
}

export async function saveSessionToServer(
  s: SessionRecord,
  apiFetch: <T>(path: string, options?: RequestInit) => Promise<T>
): Promise<void> {
  saveSession(s);
  try {
    await apiFetch<ServerSession>('/music/sessions/', {
      method: 'POST',
      body: JSON.stringify({
        client_id: s.id,
        partner_username: s.partnerUsername,
        partner_instruments: s.partnerInstruments,
        played_songs: s.playedSongs,
        session_date: s.date,
      }),
    });
  } catch {
    // オフライン時はローカルデータを維持
  }
}

// ── QR エンコード / デコード ────────────────────────────
// フォーマット: {v:3, u:username, i:[...instruments], s:[[title,stars],...], t:[tempo,emotion,range,effort,stage]}

export function encodeQR(
  username: string,
  instruments: string[],
  songs: Array<{ title: string; stars: number; mb_id?: string }>,
  stats: {
    stat_tempo: number;
    stat_emotion: number;
    stat_range: number;
    stat_effort: number;
    stat_stage: number;
  }
): string {
  const data = {
    v: 3,
    u: username,
    i: instruments,
    s: songs.slice(0, 20).map(s =>
      s.mb_id ? [s.title, s.stars, s.mb_id] : [s.title, s.stars]
    ),
    t: [stats.stat_tempo, stats.stat_emotion, stats.stat_range, stats.stat_effort, stats.stat_stage],
  };
  const json = JSON.stringify(data);
  return btoa(
    encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    )
  );
}

export function decodeQR(encoded: string): PartnerProfile | null {
  try {
    const binary = atob(encoded);
    const json = decodeURIComponent(
      binary.split('').map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
    );
    const data = JSON.parse(json);
    if (!data.u || !data.i || !Array.isArray(data.s)) return null;

    // v1/v2（i が文字列）と v3（i が配列）の両方に対応
    const instruments: string[] = Array.isArray(data.i) ? data.i : [data.i as string];

    const t: number[] = Array.isArray(data.t) && data.t.length === 5 ? data.t : [3, 3, 3, 3, 3];

    return {
      username: data.u,
      instruments,
      songs: (data.s as Array<[string, number, string?]>).map(
        ([title, stars, mb_id]) => ({ title, stars, mb_id: mb_id ?? '' })
      ),
      stats: {
        stat_tempo: t[0],
        stat_emotion: t[1],
        stat_range: t[2],
        stat_effort: t[3],
        stat_stage: t[4],
      },
      scannedAt: new Date().toISOString(),
    };
  } catch { return null; }
}

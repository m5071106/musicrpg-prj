import type { Instrument } from '@/types';

// ── 型定義 ──────────────────────────────────────────────

export interface PartnerProfile {
  username: string;
  instrument: Instrument;
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
  partnerInstrument: Instrument;
  playedSongs: string[];
  date: string;
}

// ── サーバー API レスポンス型 ────────────────────────────

interface ServerPartner {
  id: number;
  partner_username: string;
  partner_instrument: Instrument;
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
  partner_instrument: Instrument;
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

/**
 * サーバーからパートナー一覧を取得してローカルストレージへ上書きマージする。
 * PWA・ブラウザ起動時に呼び出すことでデータを統一する。
 */
export async function fetchPartnersFromServer(apiFetch: <T>(path: string) => Promise<T>): Promise<PartnerProfile[]> {
  try {
    const serverList = await apiFetch<ServerPartner[]>('/music/partners/');
    const profiles: PartnerProfile[] = serverList.map(s => ({
      username: s.partner_username,
      instrument: s.partner_instrument,
      songs: s.partner_songs,
      stats: s.partner_stats,
      scannedAt: s.scanned_at,
    }));
    // サーバーデータでローカルストレージを上書きする
    if (typeof window !== 'undefined') {
      localStorage.setItem('mrpg_partners', JSON.stringify(profiles.slice(0, 30)));
    }
    return profiles;
  } catch {
    // オフライン時などはローカルのデータを返す
    return getPartners();
  }
}

/**
 * パートナーをサーバーへ保存する（upsert）。
 * ローカルストレージにも同時に保存する。
 */
export async function savePartnerToServer(
  p: PartnerProfile,
  apiFetch: <T>(path: string, options?: RequestInit) => Promise<T>
): Promise<void> {
  // まずローカルに保存してオフライン時でも即時反映できるようにする
  savePartner(p);
  try {
    await apiFetch<ServerPartner>('/music/partners/', {
      method: 'POST',
      body: JSON.stringify({
        partner_username: p.username,
        partner_instrument: p.instrument,
        partner_songs: p.songs,
        partner_stats: p.stats,
        scanned_at: p.scannedAt,
      }),
    });
  } catch {
    // サーバー保存失敗時はローカルデータを維持（次回オンライン時に再同期可能）
  }
}

// ── サーバー同期: セッション履歴 ────────────────────────

/**
 * サーバーからセッション履歴を取得してローカルストレージへ上書きマージする。
 * PWA・ブラウザ起動時に呼び出すことでデータを統一する。
 */
export async function fetchSessionsFromServer(apiFetch: <T>(path: string) => Promise<T>): Promise<SessionRecord[]> {
  try {
    const serverList = await apiFetch<ServerSession[]>('/music/sessions/');
    const records: SessionRecord[] = serverList.map(s => ({
      id: s.client_id,
      partnerUsername: s.partner_username,
      partnerInstrument: s.partner_instrument,
      playedSongs: s.played_songs,
      date: s.session_date,
    }));
    // サーバーデータでローカルストレージを上書きする
    if (typeof window !== 'undefined') {
      localStorage.setItem('mrpg_sessions', JSON.stringify(records.slice(0, 100)));
    }
    return records;
  } catch {
    // オフライン時などはローカルのデータを返す
    return getSessions();
  }
}

/**
 * セッションをサーバーへ保存する（冪等: 同一 id は重複保存されない）。
 * ローカルストレージにも同時に保存する。
 */
export async function saveSessionToServer(
  s: SessionRecord,
  apiFetch: <T>(path: string, options?: RequestInit) => Promise<T>
): Promise<void> {
  // まずローカルに保存してオフライン時でも即時反映できるようにする
  saveSession(s);
  try {
    await apiFetch<ServerSession>('/music/sessions/', {
      method: 'POST',
      body: JSON.stringify({
        client_id: s.id,
        partner_username: s.partnerUsername,
        partner_instrument: s.partnerInstrument,
        played_songs: s.playedSongs,
        session_date: s.date,
      }),
    });
  } catch {
    // サーバー保存失敗時はローカルデータを維持（次回オンライン時に再同期可能）
  }
}

// ── QR エンコード / デコード ────────────────────────────
// フォーマット: {v:1, u:username, i:instrument, s:[[title,stars],...], t:[tempo,emotion,range,effort,stage]}
// UTF-8 対応の base64 エンコード

export function encodeQR(
  username: string,
  instrument: Instrument,
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
    v: 2,
    u: username,
    i: instrument,
    // mb_id がある場合のみ3要素目に追加（QRデータ量を抑える）
    s: songs.slice(0, 20).map(s =>
      s.mb_id ? [s.title, s.stars, s.mb_id] : [s.title, s.stars]
    ),
    t: [stats.stat_tempo, stats.stat_emotion, stats.stat_range, stats.stat_effort, stats.stat_stage],
  };
  const json = JSON.stringify(data);
  // UTF-8 safe btoa
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
    // v:1（mb_id なし）と v:2（mb_id あり）の両方に対応

    const t: number[] = Array.isArray(data.t) && data.t.length === 5 ? data.t : [3, 3, 3, 3, 3];

    return {
      username: data.u,
      instrument: data.i as Instrument,
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

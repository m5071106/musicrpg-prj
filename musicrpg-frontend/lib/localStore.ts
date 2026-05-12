import type { Instrument } from '@/types';

// ── 型定義 ──────────────────────────────────────────────

export interface PartnerProfile {
  username: string;
  instrument: Instrument;
  songs: Array<{ title: string; stars: number }>;
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

// ── パートナー管理 ──────────────────────────────────────

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

// ── セッション記録 ──────────────────────────────────────

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

// ── QR エンコード / デコード ────────────────────────────
// フォーマット: {v:1, u:username, i:instrument, s:[[title,stars],...], t:[tempo,emotion,range,effort,stage]}
// UTF-8 対応の base64 エンコード

export function encodeQR(
  username: string,
  instrument: Instrument,
  songs: Array<{ title: string; stars: number }>,
  stats: {
    stat_tempo: number;
    stat_emotion: number;
    stat_range: number;
    stat_effort: number;
    stat_stage: number;
  }
): string {
  const data = {
    v: 1,
    u: username,
    i: instrument,
    s: songs.slice(0, 20).map(s => [s.title, s.stars] as [string, number]),
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
    if (data.v !== 1 || !data.u || !data.i || !Array.isArray(data.s)) return null;

    // t フィールドが存在すれば実際の値を使い、古いQRデータには 3 をフォールバックとして使う
    const t: number[] = Array.isArray(data.t) && data.t.length === 5 ? data.t : [3, 3, 3, 3, 3];

    return {
      username: data.u,
      instrument: data.i as Instrument,
      songs: (data.s as [string, number][]).map(([title, stars]) => ({ title, stars })),
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

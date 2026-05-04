import type { Instrument } from '@/types';

// ── 型定義 ──────────────────────────────────────────────

export interface PartnerProfile {
  username: string;
  instrument: Instrument;
  songs: Array<{ title: string; stars: number }>;
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
// フォーマット: {v:1, u:username, i:instrument, s:[[title,stars],...]}
// UTF-8 対応の base64 エンコード

export function encodeQR(
  username: string,
  instrument: Instrument,
  songs: Array<{ title: string; stars: number }>
): string {
  const data = {
    v: 1,
    u: username,
    i: instrument,
    s: songs.slice(0, 20).map(s => [s.title, s.stars] as [string, number]),
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
    return {
      username: data.u,
      instrument: data.i as Instrument,
      songs: (data.s as [string, number][]).map(([title, stars]) => ({ title, stars })),
      scannedAt: new Date().toISOString(),
    };
  } catch { return null; }
}

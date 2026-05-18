export interface MBRecording {
  id: string;
  title: string;
  artist: string;
}

const MB_API = 'https://musicbrainz.org/ws/2';
const USER_AGENT = 'MusiciansCard/1.0 (m5071106.clavier@gmail.com)';

export async function searchMusicBrainz(query: string): Promise<MBRecording[]> {
  if (!query.trim()) return [];
  const url = `${MB_API}/recording/?query=${encodeURIComponent(query)}&fmt=json&limit=8`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) return [];
    const data = await res.json() as {
      recordings?: Array<{
        id: string;
        title: string;
        'artist-credit'?: Array<{ name?: string; artist?: { name: string } }>;
      }>;
    };
    const all = (data.recordings ?? []).map(r => ({
      id: r.id,
      title: r.title,
      artist: r['artist-credit']?.[0]?.artist?.name ?? r['artist-credit']?.[0]?.name ?? '',
    }));

    // 曲名とアーティスト名の組み合わせで重複排除し、IDが最小のものを残す
    const map = new Map<string, MBRecording>();
    for (const rec of all) {
      const key = `${rec.title}\0${rec.artist}`;
      const existing = map.get(key);
      if (!existing || rec.id < existing.id) {
        map.set(key, rec);
      }
    }
    return Array.from(map.values());
  } catch {
    return [];
  }
}

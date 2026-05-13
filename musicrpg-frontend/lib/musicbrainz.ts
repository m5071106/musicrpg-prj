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
    return (data.recordings ?? []).map(r => ({
      id: r.id,
      title: r.title,
      artist: r['artist-credit']?.[0]?.artist?.name ?? r['artist-credit']?.[0]?.name ?? '',
    }));
  } catch {
    return [];
  }
}

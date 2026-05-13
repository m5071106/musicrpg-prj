'use client';

import { useState, useEffect, useRef } from 'react';
import { searchMusicBrainz, type MBRecording } from '@/lib/musicbrainz';

interface Props {
  value: string;
  mbId: string;
  onChange: (title: string, mbId: string) => void;
}

export default function SongSearch({ value, mbId, onChange }: Props) {
  const [results, setResults] = useState<MBRecording[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const hits = await searchMusicBrainz(value);
        setResults(hits);
        setOpen(hits.length > 0);
      } finally {
        setLoading(false);
      }
    }, 500);
    return () => clearTimeout(debounceRef.current);
  }, [value]);

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e.target.value, '');
    setOpen(true);
  }

  function handleSelect(rec: MBRecording) {
    onChange(rec.title, rec.id);
    setResults([]);
    setOpen(false);
  }

  return (
    <div className="relative">
      <div className="relative flex items-center">
        <input
          type="text"
          placeholder="曲名を入力（MusicBrainz で検索）..."
          value={value}
          onChange={handleInput}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onFocus={() => results.length > 0 && setOpen(true)}
          className="w-full px-4 py-2 rounded-[12px] border-2 text-sm outline-none"
          style={{
            borderColor: mbId ? 'var(--purple)' : 'var(--border)',
            color: 'var(--text)',
            background: '#fdfaff',
            paddingRight: '2.5rem',
          }}
        />
        <span className="absolute right-3 text-[10px] select-none" style={{ color: 'var(--dim)' }}>
          {loading ? '検索中...' : mbId ? '✓MB' : ''}
        </span>
      </div>

      {open && results.length > 0 && (
        <ul
          className="absolute z-50 w-full mt-1 rounded-[12px] border-2 overflow-hidden"
          style={{
            background: '#fff',
            borderColor: 'var(--border)',
            boxShadow: '0 4px 16px rgba(80,40,120,0.15)',
          }}
        >
          {results.map(rec => (
            <li key={rec.id}>
              <button
                type="button"
                onMouseDown={() => handleSelect(rec)}
                className="w-full text-left px-3 py-2.5 text-sm transition-colors"
                style={{ color: 'var(--text)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--lavender)')}
                onMouseLeave={e => (e.currentTarget.style.background = '')}
              >
                <span className="font-medium">{rec.title}</span>
                {rec.artist && (
                  <span className="ml-2 text-[11px]" style={{ color: 'var(--dim)' }}>
                    {rec.artist}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

'use client';

import StarRating from './StarRating';
import type { Song } from '@/types';

interface Props {
  songs: Song[];
  onDelete: (id: number) => void;
}

export default function SongList({ songs, onDelete }: Props) {
  if (songs.length === 0) {
    return (
      <p className="text-center py-8" style={{ color: '#9a8aaa' }}>
        まだ曲が登録されていません
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {songs.map((song) => (
        <li
          key={song.id}
          className="flex items-center justify-between px-4 py-3 rounded-[14px] border-2"
          style={{ borderColor: '#e8c9f0', background: '#fff' }}
        >
          <div className="flex flex-col gap-0.5">
            <span className="font-bold text-sm" style={{ color: '#3a2a4a' }}>
              {song.title}
            </span>
            <StarRating value={song.stars} readonly size="sm" />
          </div>
          <button
            type="button"
            onClick={() => onDelete(song.id)}
            className="text-xs px-3 py-1 rounded-[10px] border transition-all active:translate-y-0.5"
            style={{
              borderColor: '#e8c9f0',
              color: '#9a8aaa',
            }}
          >
            削除
          </button>
        </li>
      ))}
    </ul>
  );
}

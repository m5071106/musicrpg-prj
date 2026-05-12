'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { apiFetch } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import SongList from '@/components/SongList';
import StarRating from '@/components/StarRating';
import type { Song, Stars } from '@/types';

export default function SongsPage() {
  const { data: songs, mutate, isLoading } = useSWR<Song[]>('/music/songs/', (path: string) => apiFetch<Song[]>(path));
  const pendingStar = useAppStore((s) => s.pendingStar);
  const setPendingStar = useAppStore((s) => s.setPendingStar);
  const [title, setTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setAdding(true);
    setError('');
    try {
      await apiFetch('/music/songs/', {
        method: 'POST',
        body: JSON.stringify({ title: title.trim(), stars: pendingStar }),
      });
      setTitle('');
      await mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: number) {
    await apiFetch(`/music/songs/${id}/`, { method: 'DELETE' });
    await mutate();
  }

  return (
    <div className="flex flex-col gap-4">
      <h1
        className="text-xl font-bold"
        style={{ color: 'var(--purple)', fontFamily: 'var(--font-dot-gothic), monospace' }}
      >
        🎵 曲リスト
      </h1>

      {/* Add Form */}
      <form
        onSubmit={handleAdd}
        className="rounded-[18px] border-2 p-4 flex flex-col gap-3"
        style={{ background: 'var(--panel)', borderColor: 'var(--border)', boxShadow: '0 3px 0 #e8c9f0' }}
      >
        <p className="text-xs font-bold" style={{ color: 'var(--dim)' }}>
          曲を追加
        </p>
        <input
          type="text"
          placeholder="曲名を入力..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 rounded-[12px] border-2 text-sm outline-none"
          style={{ borderColor: 'var(--border)', color: 'var(--text)', background: '#fdfaff' }}
        />
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--dim)' }}>難易度</span>
          <StarRating
            value={pendingStar as Stars}
            onChange={(v) => setPendingStar(v)}
          />
        </div>
        {error && <p className="text-xs" style={{ color: '#e05555' }}>{error}</p>}
        <button
          type="submit"
          disabled={adding || !title.trim()}
          className="w-full py-2 rounded-[12px] font-bold text-white text-sm active:translate-y-0.5 disabled:opacity-50"
          style={{ background: 'var(--purple)' }}
        >
          {adding ? '追加中...' : '+ 追加する'}
        </button>
      </form>

      {/* List */}
      <div
        className="rounded-[18px] border-2 p-4"
        style={{ background: 'var(--panel)', borderColor: 'var(--border)', boxShadow: '0 3px 0 #e8c9f0' }}
      >
        <p className="text-xs font-bold mb-3" style={{ color: 'var(--dim)' }}>
          登録曲 ({songs?.length ?? 0}曲)
        </p>
        {isLoading ? (
          <p className="text-center py-4" style={{ color: 'var(--dim)' }}>Loading...</p>
        ) : (
          <SongList songs={songs ?? []} onDelete={handleDelete} />
        )}
      </div>
    </div>
  );
}

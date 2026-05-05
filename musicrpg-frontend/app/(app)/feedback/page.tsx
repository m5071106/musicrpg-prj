'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function FeedbackPage() {
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setStatus('sending');
    try {
      await apiFetch('/feedback/', {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      setContent('');
      setStatus('done');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="min-h-dvh px-4 py-6 pb-24 max-w-lg mx-auto" style={{ background: 'var(--bg)' }}>
      <h1
        className="text-xl font-bold mb-1"
        style={{ color: 'var(--purple)', fontFamily: 'var(--font-dot-gothic), monospace' }}
      >
        💬 フィードバック
      </h1>
      <p className="text-xs mb-6" style={{ color: 'var(--dim)' }}>
        気になったこと・改善してほしいことを自由に書いてください
      </p>

      {status === 'done' ? (
        <div
          className="rounded-[18px] border-2 p-6 text-center"
          style={{ background: '#f0fdf4', borderColor: '#a8e6b0', boxShadow: '0 3px 0 #a8e6b0' }}
        >
          <p className="text-3xl mb-2">🎉</p>
          <p className="font-bold text-sm mb-1" style={{ color: '#3a7d50' }}>
            送信しました！
          </p>
          <p className="text-xs mb-4" style={{ color: '#3a7d50' }}>
            フィードバックありがとうございます
          </p>
          <button
            onClick={() => setStatus('idle')}
            className="px-5 py-2 rounded-[10px] text-xs font-bold border-2 transition-all active:translate-y-0.5"
            style={{ borderColor: '#a8e6b0', color: '#3a7d50' }}
          >
            続けて送る
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div
            className="rounded-[18px] border-2 overflow-hidden"
            style={{ borderColor: 'var(--border)', boxShadow: '0 3px 0 #e8c9f0' }}
          >
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="例）比較画面でもっと曲名が見やすいといいな&#10;例）スキャンが少し遅い気がした&#10;例）新機能のアイデアがあります！"
              rows={8}
              required
              className="w-full px-4 py-3 text-sm outline-none resize-none"
              style={{
                background: 'var(--panel)',
                color: 'var(--text)',
                fontFamily: 'var(--font-noto-sans-jp), sans-serif',
              }}
            />
          </div>

          {status === 'error' && (
            <p className="text-xs text-center" style={{ color: '#e05555' }}>
              送信に失敗しました。もう一度お試しください
            </p>
          )}

          <button
            type="submit"
            disabled={status === 'sending' || !content.trim()}
            className="w-full py-3 rounded-[14px] font-bold text-white text-sm transition-all active:translate-y-0.5 disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, var(--purple), var(--pink))',
              boxShadow: '0 3px 0 #c87ee0',
              fontFamily: 'var(--font-dot-gothic), monospace',
            }}
          >
            {status === 'sending' ? '送信中...' : '送信する'}
          </button>
        </form>
      )}
    </div>
  );
}

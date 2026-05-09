'use client';

import { useEffect, useState } from 'react';

const CLIENT_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? 'dev';
const CHECK_INTERVAL_MS = 30 * 60 * 1000; // 30分

export default function UpdateBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // dev 環境では常に同じバージョンになるためスキップ
    if (CLIENT_VERSION === 'dev') return;

    async function check() {
      try {
        const res = await fetch('/api/version', { cache: 'no-store' });
        if (!res.ok) return;
        const { version } = await res.json() as { version: string };
        if (version !== CLIENT_VERSION) setShow(true);
      } catch {
        // ネットワークエラーは無視
      }
    }

    check();
    const timer = setInterval(check, CHECK_INTERVAL_MS);

    // 画面に戻ってきたときも確認
    window.addEventListener('focus', check);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', check);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      className="fixed bottom-4 left-0 right-0 z-50 flex justify-center px-4"
      style={{ pointerEvents: 'none' }}
    >
      <div
        className="flex items-center gap-3 rounded-[14px] px-4 py-3 shadow-lg"
        style={{
          background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
          color: '#ffffff',
          boxShadow: '0 4px 0 #5b21b6',
          pointerEvents: 'auto',
          maxWidth: '360px',
          width: '100%',
        }}
      >
        <span className="text-lg">🎵</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold leading-tight">アップデートがあります</p>
          <p className="text-[11px] opacity-80 leading-tight mt-0.5">タップして最新版に更新</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="text-xs font-bold px-3 py-1.5 rounded-[8px] shrink-0 transition-all active:scale-95"
          style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)' }}
        >
          更新
        </button>
        <button
          onClick={() => setShow(false)}
          className="text-xs opacity-60 hover:opacity-100 transition-opacity shrink-0"
          aria-label="閉じる"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

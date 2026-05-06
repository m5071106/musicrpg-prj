'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminFetch } from '@/lib/api';

interface LoginHistoryItem {
  id: number;
  username: string;
  logged_in_at: string;
}

export default function AdminHistoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<LoginHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminFetch<LoginHistoryItem[]>('/admin/login-history/')
      .then(setItems)
      .catch((err: Error) => {
        if (err.message.includes('403') || err.message.includes('401') || err.message.includes('権限')) {
          router.push('/admin/login');
        } else {
          setError(err.message);
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="font-bold text-sm" style={{ color: '#0c4a6e' }}>
          🕓 ユーザーログイン履歴
        </h2>
        {!loading && (
          <span
            className="text-xs font-bold px-2.5 py-0.5 rounded-full"
            style={{ background: '#e0f2fe', color: '#0284c7' }}
          >
            {items.length} 件
          </span>
        )}
      </div>

      {loading && (
        <p className="text-xs text-center py-12" style={{ color: '#94a3b8' }}>読み込み中...</p>
      )}
      {error && (
        <p className="text-xs text-center py-12" style={{ color: '#e05555' }}>{error}</p>
      )}
      {!loading && !error && items.length === 0 && (
        <p className="text-xs text-center py-12" style={{ color: '#94a3b8' }}>ログイン履歴はまだありません</p>
      )}

      {/* 横スクロール対応ラッパー */}
      <div className="overflow-x-auto w-full">
        <div
          className="rounded-[14px] border-2 overflow-hidden min-w-0"
          style={{ borderColor: '#bae6fd', boxShadow: '0 2px 0 #e0f2fe' }}
        >
          {items.map((item, i) => (
            <div
              key={item.id}
              className="flex items-center justify-between px-4 py-3 gap-4"
              style={{
                background: i % 2 === 0 ? '#ffffff' : '#f0f9ff',
                borderBottom: i < items.length - 1 ? '1px solid #e0f2fe' : 'none',
              }}
            >
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
                style={{ background: '#e0f2fe', color: '#0284c7' }}
              >
                @{item.username}
              </span>
              <span className="text-xs" style={{ color: '#64748b' }}>
                {new Date(item.logged_in_at).toLocaleString('ja-JP')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

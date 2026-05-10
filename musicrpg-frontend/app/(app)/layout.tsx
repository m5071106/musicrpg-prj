'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { SWRConfig, useSWRConfig } from 'swr';
import NavBar from '@/components/NavBar';

import type { Cache, State } from 'swr';

const SWR_CACHE_PREFIX = 'swr-cache-';

/** ログイン中ユーザーのキャッシュキーを返す */
function getCacheKey(username: string): string {
  return `${SWR_CACHE_PREFIX}${username}`;
}

/**
 * SWR キャッシュをログインユーザーごとに localStorage へ永続化する。
 * ユーザー名をキーに含めることで、別アカウントのキャッシュが混入するのを防ぐ。
 * PWA・Web どちらで起動しても同じサーバーデータを参照できるよう、
 * アプリが再表示された際（visibilitychange）に全キーを revalidate する。
 */
function useLocalSWRCache(username: string) {
  const cacheKey = getCacheKey(username);

  const [cache] = useState<Cache>(() => {
    if (typeof window === 'undefined') return new Map();
    try {
      const entries = JSON.parse(
        localStorage.getItem(cacheKey) ?? '[]'
      ) as [string, State<unknown>][];
      return new Map(entries);
    } catch {
      return new Map();
    }
  });

  useEffect(() => {
    if (!cacheKey) return;

    const save = () => {
      try {
        localStorage.setItem(
          cacheKey,
          JSON.stringify(Array.from((cache as Map<string, unknown>).entries()))
        );
      } catch {
        /* quota exceeded 等は無視 */
      }
    };
    window.addEventListener('beforeunload', save);
    return () => window.removeEventListener('beforeunload', save);
  }, [cache, cacheKey]);

  return cache;
}

/** PWA / タブ復帰時にサーバーから最新データを取り直すコンポーネント */
function RevalidateOnVisible() {
  const { mutate } = useSWRConfig();
  const mutateRef = useRef(mutate);
  mutateRef.current = mutate;

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        // すべての SWR キーを再検証してサーバーの最新データを取得する
        mutateRef.current(() => true, undefined, { revalidate: true });
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  return null;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [username, setUsername] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('access_token');
    if (!stored) {
      router.push('/login');
      return;
    }
    // キャッシュをユーザーごとに分けるためにユーザー名を取得する
    setUsername(localStorage.getItem('username') ?? 'anonymous');
  }, [router]);

  const cache = useLocalSWRCache(username);

  return (
    <SWRConfig
      value={{
        provider: () => cache as Cache,
        // フォーカス時・再接続時にサーバーから再取得してデータを最新に保つ
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
      }}
    >
      <RevalidateOnVisible />
      <div className="overflow-x-hidden w-full" style={{ background: 'var(--bg)', minHeight: '100dvh' }}>
        {/* pb-28: 大きくなったナビバー (≈72px) + safe-area-inset-bottom の余裕 */}
        <main className="pb-28 px-4 pt-4 max-w-lg mx-auto w-full">{children}</main>
        <NavBar />
      </div>
    </SWRConfig>
  );
}

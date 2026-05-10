'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SWRConfig } from 'swr';
import NavBar from '@/components/NavBar';

import type { Cache, State } from 'swr';

// オフライン対応: SWR のキャッシュを localStorage に永続化
function useLocalSWRCache() {
  const [cache] = useState<Cache>(() => {
    if (typeof window === 'undefined') return new Map();
    try {
      const entries = JSON.parse(localStorage.getItem('swr-cache') ?? '[]') as [string, State<unknown>][];
      return new Map(entries);
    } catch {
      return new Map();
    }
  });

  useEffect(() => {
    const save = () => {
      try {
        localStorage.setItem('swr-cache', JSON.stringify(Array.from((cache as Map<string, unknown>).entries())));
      } catch { /* quota exceeded 等は無視 */ }
    };
    window.addEventListener('beforeunload', save);
    return () => window.removeEventListener('beforeunload', save);
  }, [cache]);

  return cache;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const cache = useLocalSWRCache();

  useEffect(() => {
    if (!localStorage.getItem('access_token')) router.push('/login');
  }, [router]);

  return (
    <SWRConfig
      value={{
        provider: () => cache as Cache,
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
      }}
    >
      <div className="overflow-x-hidden w-full" style={{ background: 'var(--bg)', minHeight: '100dvh' }}>
        {/* pb-28: 大きくなったナビバー (≈72px) + safe-area-inset-bottom の余裕 */}
        <main className="pb-28 px-4 pt-4 max-w-lg mx-auto w-full">{children}</main>
        <NavBar />
      </div>
    </SWRConfig>
  );
}

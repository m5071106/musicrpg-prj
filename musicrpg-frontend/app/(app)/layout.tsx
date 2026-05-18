'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SWRConfig, useSWRConfig } from 'swr';
import NavBar from '@/components/NavBar';
import { apiFetch } from '@/lib/api';
import { checkPartnerUpdates } from '@/lib/localStore';
import { useAppStore } from '@/store/useAppStore';

import type { Cache, State } from 'swr';

const SWR_CACHE_PREFIX = 'swr-cache-';

function getCacheKey(username: string): string {
  return `${SWR_CACHE_PREFIX}${username}`;
}

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

function RevalidateOnVisible() {
  const { mutate } = useSWRConfig();
  const mutateRef = useRef(mutate);
  mutateRef.current = mutate;

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        mutateRef.current(() => true, undefined, { revalidate: true });
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  return null;
}

/** パートナーの曲リスト更新を検知してトースト通知を出すコンポーネント */
function PartnerUpdateChecker() {
  const addUpdatedPartners = useAppStore(s => s.addUpdatedPartners);
  const [toastNames, setToastNames] = useState<string[]>([]);
  const checkingRef = useRef(false);

  const COOLDOWN_MS = 30 * 60 * 1000; // 30分

  const runCheck = useCallback(async () => {
    if (checkingRef.current || !navigator.onLine) return;
    const lastChecked = Number(localStorage.getItem('mrpg_partner_check_at') ?? 0);
    if (Date.now() - lastChecked < COOLDOWN_MS) return;
    checkingRef.current = true;
    localStorage.setItem('mrpg_partner_check_at', String(Date.now()));
    try {
      const updated = await checkPartnerUpdates(apiFetch);
      if (updated.length > 0) {
        addUpdatedPartners(updated);
        setToastNames(updated);
        setTimeout(() => setToastNames([]), 5000);
      }
    } finally {
      checkingRef.current = false;
    }
  }, [addUpdatedPartners]);

  // マウント時（ログイン直後）に実行
  useEffect(() => {
    runCheck();
  }, [runCheck]);

  // タブ復帰時にも実行
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') runCheck();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [runCheck]);

  if (toastNames.length === 0) return null;

  const message =
    toastNames.length === 1
      ? `🎵 ${toastNames[0]} さんの曲リストが更新されました`
      : `🎵 ${toastNames.length}人の相手が曲リストを更新しました`;

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-[14px] text-sm font-bold text-white shadow-lg max-w-[90vw] text-center"
      style={{ background: 'linear-gradient(135deg, var(--purple), var(--pink))' }}
      onClick={() => setToastNames([])}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
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
    setUsername(localStorage.getItem('username') ?? 'anonymous');
  }, [router]);

  const cache = useLocalSWRCache(username);

  return (
    <SWRConfig
      value={{
        provider: () => cache as Cache,
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
      }}
    >
      <RevalidateOnVisible />
      <PartnerUpdateChecker />
      <div className="overflow-x-hidden w-full" style={{ background: 'var(--bg)', minHeight: '100dvh' }}>
        <main className="pb-28 px-4 pt-4 max-w-lg mx-auto w-full">{children}</main>
        <NavBar />
      </div>
    </SWRConfig>
  );
}

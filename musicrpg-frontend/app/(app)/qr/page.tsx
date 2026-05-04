'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { apiFetch, getStoredUsername } from '@/lib/api';
import { encodeQR, decodeQR, savePartner } from '@/lib/localStore';
import { useAppStore } from '@/store/useAppStore';
import { INSTRUMENT_EMOJIS, INSTRUMENT_LABELS } from '@/lib/constants';
import QRDisplay from '@/components/QRDisplay';
import type { MusicProfile } from '@/types';

// カメラAPIはブラウザ専用のためSSRを無効化
const QRScanner = dynamic(() => import('@/components/QRScanner'), {
  ssr: false,
  loading: () => (
    <div className="h-48 flex items-center justify-center rounded-[18px] border-2" style={{ borderColor: 'var(--border)' }}>
      <p style={{ color: 'var(--dim)' }}>カメラを準備中...</p>
    </div>
  ),
});

export default function QRPage() {
  const router = useRouter();
  const setCurrentPartner = useAppStore(s => s.setCurrentPartner);
  const { data: profile } = useSWR<MusicProfile>(
    '/music/profile/',
    (p: string) => apiFetch<MusicProfile>(p)
  );
  const [mode, setMode] = useState<'display' | 'scan'>('display');
  const [scanned, setScanned] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    setUsername(getStoredUsername());
  }, []);

  const qrData =
    profile && username
      ? encodeQR(
          username,
          profile.instrument,
          profile.songs.map(s => ({ title: s.title, stars: s.stars }))
        )
      : '';

  const handleScan = useCallback(
    (raw: string) => {
      if (scanned) return;
      const partner = decodeQR(raw);
      if (!partner) return;
      setScanned(true);
      savePartner(partner);
      setCurrentPartner(partner);
      router.push('/compare');
    },
    [scanned, setCurrentPartner, router]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1
          className="text-xl font-bold"
          style={{ color: 'var(--purple)', fontFamily: 'var(--font-dot-gothic), monospace' }}
        >
          🎴 QRコード
        </h1>
        {profile && (
          <span className="text-sm" style={{ color: 'var(--dim)' }}>
            {INSTRUMENT_EMOJIS[profile.instrument]} {INSTRUMENT_LABELS[profile.instrument]}
          </span>
        )}
      </div>

      {/* モード切替 */}
      <div
        className="flex rounded-[12px] overflow-hidden border-2"
        style={{ borderColor: 'var(--border)' }}
      >
        {(['display', 'scan'] as const).map(m => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setScanned(false); }}
            className="flex-1 py-2.5 text-sm font-bold transition-all"
            style={{
              background: mode === m ? 'var(--lavender)' : 'transparent',
              color: mode === m ? 'var(--purple)' : 'var(--dim)',
              fontFamily: 'var(--font-dot-gothic), monospace',
            }}
          >
            {m === 'display' ? '📱 自分のQR' : '📷 スキャン'}
          </button>
        ))}
      </div>

      {/* 自分のQR表示 */}
      {mode === 'display' && (
        <div
          className="rounded-[18px] border-2 p-5 flex flex-col items-center gap-4"
          style={{ background: 'var(--panel)', borderColor: 'var(--border)', boxShadow: '0 3px 0 #e8c9f0' }}
        >
          {qrData ? (
            <>
              <QRDisplay
                data={qrData}
                size={220}
                label="相手にこのQRコードを見せてください"
              />
              <div className="w-full">
                <p className="text-xs font-bold mb-2" style={{ color: 'var(--dim)' }}>
                  含まれる情報
                </p>
                <div
                  className="rounded-[12px] p-3"
                  style={{ background: 'var(--lavender)' }}
                >
                  <p className="text-xs" style={{ color: 'var(--purple)' }}>
                    {INSTRUMENT_EMOJIS[profile!.instrument]} {INSTRUMENT_LABELS[profile!.instrument]}
                    　{profile!.songs.length}曲
                  </p>
                  <p className="text-[10px] mt-1" style={{ color: 'var(--dim)' }}>
                    {profile!.songs.slice(0, 3).map(s => s.title).join('、')}
                    {profile!.songs.length > 3 ? `…ほか${profile!.songs.length - 3}曲` : ''}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="py-8 flex flex-col items-center gap-2">
              <p style={{ color: 'var(--dim)' }}>読み込み中...</p>
              <p className="text-xs" style={{ color: 'var(--dim)' }}>
                曲を登録するとQRに含まれます
              </p>
            </div>
          )}
        </div>
      )}

      {/* スキャン */}
      {mode === 'scan' && (
        <div
          className="rounded-[18px] border-2 p-4"
          style={{ background: 'var(--panel)', borderColor: 'var(--border)', boxShadow: '0 3px 0 #e8c9f0' }}
        >
          {scanned ? (
            <div className="py-8 text-center">
              <p
                className="text-xl font-bold"
                style={{ color: 'var(--green)', fontFamily: 'var(--font-dot-gothic), monospace' }}
              >
                ✓ スキャン成功！
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--dim)' }}>
                比較画面へ移動中...
              </p>
            </div>
          ) : (
            <QRScanner onScan={handleScan} />
          )}
        </div>
      )}
    </div>
  );
}

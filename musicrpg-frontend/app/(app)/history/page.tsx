'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import {
  fetchSessionsFromServer,
  fetchPartnersFromServer,
  type SessionRecord,
} from '@/lib/localStore';
import { getInstrumentInfo } from '@/lib/constants';
import { useAppStore } from '@/store/useAppStore';
import type { PartnerProfile } from '@/lib/localStore';

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function HistoryPage() {
  const router = useRouter();
  const setCurrentPartner = useAppStore(s => s.setCurrentPartner);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [partners, setPartners] = useState<PartnerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchSessionsFromServer(apiFetch),
      fetchPartnersFromServer(apiFetch),
    ]).then(([sessionList, partnerList]) => {
      if (!cancelled) {
        setSessions(sessionList);
        setPartners(partnerList);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  function handleRecompare(session: SessionRecord) {
    const p = partners.find(x => x.username === session.partnerUsername);
    if (p) {
      setCurrentPartner(p);
      router.push('/compare');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p style={{ color: 'var(--dim)' }}>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1
        className="text-xl font-bold"
        style={{ color: 'var(--purple)', fontFamily: 'var(--font-dot-gothic), monospace' }}
      >
        📋 セッション履歴
      </h1>

      {sessions.length === 0 ? (
        <div
          className="rounded-[18px] border-2 p-8 text-center"
          style={{ background: 'var(--panel)', borderColor: 'var(--border)', boxShadow: '0 3px 0 #e8c9f0' }}
        >
          <p className="text-3xl mb-2">🎵</p>
          <p className="font-bold" style={{ color: 'var(--purple)' }}>
            まだ記録がありません
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--dim)' }}>
            比較画面から曲を選んで記録しましょう
          </p>
          <button
            type="button"
            onClick={() => router.push('/qr')}
            className="mt-4 px-5 py-2 rounded-[12px] font-bold text-white text-sm active:translate-y-0.5"
            style={{ background: 'var(--purple)' }}
          >
            📷 QRスキャンへ
          </button>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {sessions.map(session => {
            const partnerKnown = partners.some(p => p.username === session.partnerUsername);
            const primaryInst = getInstrumentInfo(session.partnerInstruments[0] ?? '');
            const instLabel = session.partnerInstruments
              .map(i => getInstrumentInfo(i).emoji)
              .join(' ');
            return (
              <li
                key={session.id}
                className="rounded-[18px] border-2 p-4"
                style={{ background: 'var(--panel)', borderColor: 'var(--border)', boxShadow: '0 3px 0 #e8c9f0' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{primaryInst.emoji}</span>
                    <div>
                      <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                        {session.partnerUsername}
                      </p>
                      <p className="text-[10px]" style={{ color: 'var(--dim)' }}>
                        {instLabel}　{formatDate(session.date)}
                      </p>
                    </div>
                  </div>
                  {partnerKnown && (
                    <button
                      type="button"
                      onClick={() => handleRecompare(session)}
                      className="text-xs px-3 py-1.5 rounded-[10px] border-2 active:translate-y-0.5"
                      style={{ borderColor: 'var(--purple)', color: 'var(--purple)' }}
                    >
                      ⚔️ 再比較
                    </button>
                  )}
                </div>
                {session.playedSongs.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {session.playedSongs.map(title => (
                      <span
                        key={title}
                        className="text-xs px-2.5 py-1 rounded-full"
                        style={{ background: '#f0fdf4', color: '#2d7a3a', border: '1px solid #6dcc7f' }}
                      >
                        ✓ {title}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { apiFetch } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import {
  fetchPartnersFromServer,
  saveSessionToServer,
  type PartnerProfile,
  type SessionRecord,
} from '@/lib/localStore';
import { getInstrumentInfo } from '@/lib/constants';
import RadarChart from '@/components/RadarChart';
import BattleBars from '@/components/BattleBars';
import type { MusicProfile, Stats } from '@/types';

// ── 共通曲の判定 ──────────────────────────────────────
function normalizeSongTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s*[-–—]\s*(?:remastered?|live|acoustic|cover|instrumental|remix|edit|version|mix|\d{4}).*$/i, '')
    .replace(/\s*\([^)]*(?:remastered?|live|acoustic|cover|instrumental|remix|edit|version|mix|\d{4})[^)]*\)/gi, '')
    .replace(/[\s　]+/g, ' ')
    .trim();
}

function getCommonSongs(
  mySongs: Array<{ title: string; stars: number; mb_id?: string }>,
  partnerSongs: Array<{ title: string; stars: number; mb_id?: string }>
) {
  const partnerNormalized = new Set(partnerSongs.map(s => normalizeSongTitle(s.title)));
  return mySongs.filter(s => partnerNormalized.has(normalizeSongTitle(s.title)));
}

function instrumentsLabel(instruments: string[]): string {
  return instruments
    .map(inst => {
      const { emoji, label } = getInstrumentInfo(inst);
      return `${emoji} ${label}`;
    })
    .join(' / ');
}

// ── パートナー選択パネル ──────────────────────────────
function PartnerPicker({
  partners,
  onSelect,
}: {
  partners: PartnerProfile[];
  onSelect: (p: PartnerProfile) => void;
}) {
  const router = useRouter();
  const updatedPartners = useAppStore(s => s.updatedPartners);
  return (
    <div className="flex flex-col gap-4">
      <div
        className="rounded-[18px] border-2 p-5 text-center"
        style={{ background: 'var(--panel)', borderColor: 'var(--border)', boxShadow: '0 3px 0 #e8c9f0' }}
      >
        <p className="text-4xl mb-2">🎴</p>
        <p className="font-bold" style={{ color: 'var(--purple)', fontFamily: 'var(--font-dot-gothic), monospace' }}>
          まず相手のQRをスキャン
        </p>
        <p className="text-sm mt-1 mb-4" style={{ color: 'var(--dim)' }}>
          スキャンすると即座に比較できます
        </p>
        <button
          type="button"
          onClick={() => router.push('/qr')}
          className="w-full py-3 rounded-[12px] font-bold text-white text-sm active:translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, var(--purple), var(--cyan))' }}
        >
          📷 QRスキャン画面へ
        </button>
      </div>

      {partners.length > 0 && (
        <div
          className="rounded-[18px] border-2 p-4"
          style={{ background: 'var(--panel)', borderColor: 'var(--border)', boxShadow: '0 3px 0 #e8c9f0' }}
        >
          <p className="text-xs font-bold mb-3" style={{ color: 'var(--dim)' }}>
            過去に交換した相手
          </p>
          <ul className="flex flex-col gap-2">
            {partners.map(p => {
              const primary = getInstrumentInfo(p.instruments[0] ?? '');
              const hasUpdate = updatedPartners.includes(p.username);
              return (
                <li key={p.username}>
                  <button
                    type="button"
                    onClick={() => onSelect(p)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[12px] border-2 transition-all active:translate-y-0.5 text-left"
                    style={{
                      borderColor: hasUpdate ? '#f5a623' : 'var(--border)',
                      background: hasUpdate ? '#fffbf0' : '#fdfaff',
                    }}
                  >
                    <span className="text-xl">{primary.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate" style={{ color: 'var(--text)' }}>
                        {p.username}
                      </p>
                      <p className="text-[10px] truncate" style={{ color: 'var(--dim)' }}>
                        {instrumentsLabel(p.instruments)}　{p.songs.length}曲
                      </p>
                    </div>
                    {hasUpdate ? (
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                        style={{ background: '#f5a623', color: '#fff' }}
                      >
                        NEW
                      </span>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--purple)' }}>▶</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── 比較ビュー ────────────────────────────────────────
function CompareView({
  myProfile,
  partner,
  onBack,
}: {
  myProfile: MusicProfile;
  partner: PartnerProfile;
  onBack: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState(false);

  const commonSongs = getCommonSongs(
    myProfile.songs.map(s => ({ title: s.title, stars: s.stars })),
    partner.songs
  );

  const myStats: Stats = {
    stat_tempo: myProfile.stat_tempo,
    stat_emotion: myProfile.stat_emotion,
    stat_range: myProfile.stat_range,
    stat_effort: myProfile.stat_effort,
    stat_stage: myProfile.stat_stage,
  };

  const partnerStats: Stats = {
    stat_tempo: partner.stats.stat_tempo,
    stat_emotion: partner.stats.stat_emotion,
    stat_range: partner.stats.stat_range,
    stat_effort: partner.stats.stat_effort,
    stat_stage: partner.stats.stat_stage,
  };

  function toggleSong(title: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(title) ? next.delete(title) : next.add(title);
      return next;
    });
  }

  async function handleSaveSession() {
    const session: SessionRecord = {
      id: `${Date.now()}`,
      partnerUsername: partner.username,
      partnerInstruments: partner.instruments,
      playedSongs: Array.from(selected),
      date: new Date().toISOString(),
    };
    await saveSessionToServer(session, apiFetch);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const partnerPrimary = getInstrumentInfo(partner.instruments[0] ?? '');

  return (
    <div className="flex flex-col gap-4">
      {/* ヘッダー：相手情報 + 戻る */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-[10px] border-2 text-sm active:translate-y-0.5"
          style={{ borderColor: 'var(--border)', color: 'var(--dim)' }}
        >
          ←
        </button>
        <div
          className="flex-1 flex items-center gap-3 px-4 py-2.5 rounded-[14px] border-2"
          style={{ background: 'var(--panel)', borderColor: 'var(--border)' }}
        >
          <span className="text-2xl">{partnerPrimary.emoji}</span>
          <div className="min-w-0">
            <p className="font-bold text-sm truncate" style={{ color: 'var(--purple)' }}>
              {partner.username}
            </p>
            <p className="text-[10px] truncate" style={{ color: 'var(--dim)' }}>
              {instrumentsLabel(partner.instruments)}　{partner.songs.length}曲
            </p>
          </div>
        </div>
      </div>

      {/* レーダーチャート比較 */}
      <div
        className="rounded-[18px] border-2 p-4"
        style={{ background: 'var(--panel)', borderColor: 'var(--border)', boxShadow: '0 3px 0 #e8c9f0' }}
      >
        <p className="text-xs font-bold mb-3" style={{ color: 'var(--dim)' }}>ステータス比較</p>
        <RadarChart stats={myStats} compareStats={partnerStats} />
      </div>

      {/* バトルバー比較 */}
      <div
        className="rounded-[18px] border-2 p-4"
        style={{ background: 'var(--panel)', borderColor: 'var(--border)', boxShadow: '0 3px 0 #e8c9f0' }}
      >
        <p className="text-xs font-bold mb-3" style={{ color: 'var(--dim)' }}>ステータス詳細</p>
        <BattleBars myStats={myStats} senpaiStats={partnerStats} />
      </div>

      {/* 共通曲 */}
      <div
        className="rounded-[18px] border-2 p-4"
        style={{ background: 'var(--panel)', borderColor: 'var(--border)', boxShadow: '0 3px 0 #e8c9f0' }}
      >
        <p className="text-xs font-bold mb-3" style={{ color: 'var(--dim)' }}>
          共通の曲 ({commonSongs.length}曲)
        </p>
        {commonSongs.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: 'var(--dim)' }}>
            共通の曲はありません
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {commonSongs.map(song => (
              <li key={song.title}>
                <button
                  type="button"
                  onClick={() => toggleSong(song.title)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[12px] border-2 transition-all active:translate-y-0.5 text-left"
                  style={{
                    borderColor: selected.has(song.title) ? 'var(--green)' : 'var(--border)',
                    background: selected.has(song.title) ? '#f0fdf4' : '#fdfaff',
                  }}
                >
                  <span className="text-lg">{selected.has(song.title) ? '✅' : '🎵'}</span>
                  <span className="flex-1 text-sm font-bold" style={{ color: 'var(--text)' }}>
                    {song.title}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--dim)' }}>
                    {'★'.repeat(song.stars)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {commonSongs.length > 0 && (
          <button
            type="button"
            onClick={handleSaveSession}
            disabled={saved || selected.size === 0}
            className="mt-4 w-full py-3 rounded-[12px] font-bold text-white text-sm transition-all active:translate-y-0.5 disabled:opacity-50"
            style={{
              background: saved
                ? 'var(--green)'
                : 'linear-gradient(135deg, var(--purple), var(--cyan))',
            }}
          >
            {saved ? '✓ 記録しました！' : `🎵 ${selected.size}曲を記録する`}
          </button>
        )}
      </div>
    </div>
  );
}

// ── メインページ ──────────────────────────────────────
export default function ComparePage() {
  const currentPartner = useAppStore(s => s.currentPartner);
  const setCurrentPartner = useAppStore(s => s.setCurrentPartner);
  const clearPartnerUpdate = useAppStore(s => s.clearPartnerUpdate);
  const [partners, setPartners] = useState<PartnerProfile[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(true);

  const { data: myProfile } = useSWR<MusicProfile>(
    '/music/profile/',
    (p: string) => apiFetch<MusicProfile>(p)
  );

  useEffect(() => {
    let cancelled = false;
    fetchPartnersFromServer(apiFetch).then(profiles => {
      if (!cancelled) {
        setPartners(profiles);
        setLoadingPartners(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  if (!myProfile || loadingPartners) {
    return (
      <div className="flex items-center justify-center py-20">
        <p style={{ color: 'var(--dim)' }}>読み込み中...</p>
      </div>
    );
  }

  if (currentPartner) {
    return (
      <CompareView
        myProfile={myProfile}
        partner={currentPartner}
        onBack={() => setCurrentPartner(null)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1
        className="text-xl font-bold"
        style={{ color: 'var(--purple)', fontFamily: 'var(--font-dot-gothic), monospace' }}
      >
        ⚔️ 比較
      </h1>
      <PartnerPicker
        partners={partners}
        onSelect={p => {
          clearPartnerUpdate(p.username);
          setCurrentPartner(p);
        }}
      />
    </div>
  );
}

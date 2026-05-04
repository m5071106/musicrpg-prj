'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { apiFetch } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import {
  getPartners,
  saveSession,
  type PartnerProfile,
  type SessionRecord,
} from '@/lib/localStore';
import { INSTRUMENT_EMOJIS, INSTRUMENT_LABELS } from '@/lib/constants';
import RadarChart from '@/components/RadarChart';
import BattleBars from '@/components/BattleBars';
import type { MusicProfile, Stats } from '@/types';

// ── 共通曲の判定 ──────────────────────────────────────
function getCommonSongs(
  mySongs: Array<{ title: string; stars: number }>,
  partnerSongs: Array<{ title: string; stars: number }>
) {
  const partnerSet = new Set(partnerSongs.map(s => s.title.toLowerCase()));
  return mySongs.filter(s => partnerSet.has(s.title.toLowerCase()));
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
            {partners.map(p => (
              <li key={p.username}>
                <button
                  type="button"
                  onClick={() => onSelect(p)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[12px] border-2 transition-all active:translate-y-0.5 text-left"
                  style={{ borderColor: 'var(--border)', background: '#fdfaff' }}
                >
                  <span className="text-xl">{INSTRUMENT_EMOJIS[p.instrument]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate" style={{ color: 'var(--text)' }}>
                      {p.username}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--dim)' }}>
                      {INSTRUMENT_LABELS[p.instrument]}　{p.songs.length}曲
                    </p>
                  </div>
                  <span className="text-xs" style={{ color: 'var(--purple)' }}>▶</span>
                </button>
              </li>
            ))}
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
    stat_tempo: 3,
    stat_emotion: 3,
    stat_range: 3,
    stat_effort: 3,
    stat_stage: 3,
  };

  function toggleSong(title: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(title) ? next.delete(title) : next.add(title);
      return next;
    });
  }

  function handleSaveSession() {
    const session: SessionRecord = {
      id: `${Date.now()}`,
      partnerUsername: partner.username,
      partnerInstrument: partner.instrument,
      playedSongs: Array.from(selected),
      date: new Date().toISOString(),
    };
    saveSession(session);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

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
          <span className="text-2xl">{INSTRUMENT_EMOJIS[partner.instrument]}</span>
          <div>
            <p className="font-bold text-sm" style={{ color: 'var(--purple)' }}>
              {partner.username}
            </p>
            <p className="text-[10px]" style={{ color: 'var(--dim)' }}>
              {INSTRUMENT_LABELS[partner.instrument]}　{partner.songs.length}曲
            </p>
          </div>
        </div>
      </div>

      {/* ① 共通曲（最重要：最上部） */}
      <div
        className="rounded-[18px] border-2 p-4"
        style={{
          background: commonSongs.length > 0 ? '#f0fdf4' : 'var(--panel)',
          borderColor: commonSongs.length > 0 ? '#6dcc7f' : 'var(--border)',
          boxShadow: commonSongs.length > 0 ? '0 3px 0 #a8e6b0' : '0 3px 0 #e8c9f0',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <p
            className="text-sm font-bold"
            style={{
              color: commonSongs.length > 0 ? '#2d7a3a' : 'var(--dim)',
              fontFamily: 'var(--font-dot-gothic), monospace',
            }}
          >
            {commonSongs.length > 0
              ? `✅ 一緒にできる曲 ${commonSongs.length}曲`
              : '😢 共通の曲なし'}
          </p>
          {selected.size > 0 && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: '#6dcc7f', color: '#fff' }}
            >
              {selected.size}曲選択中
            </span>
          )}
        </div>

        {commonSongs.length > 0 ? (
          <>
            <ul className="flex flex-col gap-2 mb-3">
              {commonSongs.map(song => {
                const isSelected = selected.has(song.title);
                return (
                  <li key={song.title}>
                    <button
                      type="button"
                      onClick={() => toggleSong(song.title)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[12px] border-2 transition-all active:scale-[0.98] text-left"
                      style={{
                        borderColor: isSelected ? '#6dcc7f' : '#c8e6c9',
                        background: isSelected ? '#d4edda' : '#f8fdf8',
                      }}
                    >
                      <span className="text-lg">{isSelected ? '✅' : '🎵'}</span>
                      <span className="flex-1 font-bold text-sm" style={{ color: '#2d4a30' }}>
                        {song.title}
                      </span>
                      <span style={{ color: '#f5a623' }}>
                        {'★'.repeat(song.stars)}{'☆'.repeat(5 - song.stars)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <button
              type="button"
              onClick={handleSaveSession}
              disabled={selected.size === 0 || saved}
              className="w-full py-2.5 rounded-[12px] font-bold text-white text-sm active:translate-y-0.5 disabled:opacity-40 transition-all"
              style={{ background: saved ? '#6dcc7f' : '#2d7a3a' }}
            >
              {saved ? '✓ セッション記録済み！' : `📝 選択した${selected.size > 0 ? `${selected.size}曲を` : ''}セッション記録`}
            </button>
          </>
        ) : (
          <div className="py-4">
            <p className="text-sm text-center" style={{ color: 'var(--dim)' }}>
              曲リストを追加すると共通曲が見つかりやすくなります
            </p>
          </div>
        )}
      </div>

      {/* ② レーダーチャート */}
      <div
        className="rounded-[18px] border-2 p-4"
        style={{ background: 'var(--panel)', borderColor: 'var(--border)', boxShadow: '0 3px 0 #e8c9f0' }}
      >
        <div className="flex justify-around mb-2">
          <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: '#5bc8e8' }}>
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#5bc8e8' }} />
            自分
          </span>
          <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: '#ff7eb3' }}>
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#ff7eb3' }} />
            {partner.username}
          </span>
        </div>
        <div className="flex justify-center">
          <RadarChart stats={myStats} compareStats={partnerStats} />
        </div>
      </div>

      {/* ③ 相手の曲リスト */}
      <div
        className="rounded-[18px] border-2 p-4"
        style={{ background: 'var(--panel)', borderColor: 'var(--border)', boxShadow: '0 3px 0 #e8c9f0' }}
      >
        <p className="text-xs font-bold mb-3" style={{ color: 'var(--dim)' }}>
          {partner.username} の曲リスト（{partner.songs.length}曲）
        </p>
        {partner.songs.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--dim)' }}>曲情報なし</p>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {partner.songs.map(s => (
              <li
                key={s.title}
                className="text-xs px-2.5 py-1 rounded-full border"
                style={{
                  borderColor: myProfile.songs.some(
                    ms => ms.title.toLowerCase() === s.title.toLowerCase()
                  )
                    ? '#6dcc7f'
                    : 'var(--border)',
                  background: myProfile.songs.some(
                    ms => ms.title.toLowerCase() === s.title.toLowerCase()
                  )
                    ? '#f0fdf4'
                    : 'var(--lavender)',
                  color: myProfile.songs.some(
                    ms => ms.title.toLowerCase() === s.title.toLowerCase()
                  )
                    ? '#2d7a3a'
                    : 'var(--text)',
                }}
              >
                {s.title}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ④ バトルバー */}
      <div
        className="rounded-[18px] border-2 p-4"
        style={{ background: 'var(--panel)', borderColor: 'var(--border)', boxShadow: '0 3px 0 #e8c9f0' }}
      >
        <p className="text-xs font-bold mb-3" style={{ color: 'var(--dim)' }}>
          ステータス比較
        </p>
        <BattleBars myStats={myStats} senpaiStats={partnerStats} />
      </div>
    </div>
  );
}

// ── ページ本体 ────────────────────────────────────────
export default function ComparePage() {
  const { data: profile, isLoading } = useSWR<MusicProfile>(
    '/music/profile/',
    (p: string) => apiFetch<MusicProfile>(p)
  );
  const currentPartner = useAppStore(s => s.currentPartner);
  const setCurrentPartner = useAppStore(s => s.setCurrentPartner);
  const [partners, setPartners] = useState<PartnerProfile[]>([]);
  const [activePartner, setActivePartner] = useState<PartnerProfile | null>(null);

  useEffect(() => {
    setPartners(getPartners());
  }, []);

  useEffect(() => {
    if (currentPartner) setActivePartner(currentPartner);
  }, [currentPartner]);

  function handleBack() {
    setActivePartner(null);
    setCurrentPartner(null);
  }

  if (isLoading || !profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <p style={{ color: 'var(--dim)', fontFamily: 'var(--font-dot-gothic), monospace' }}>
          Loading...
        </p>
      </div>
    );
  }

  if (activePartner) {
    return <CompareView myProfile={profile} partner={activePartner} onBack={handleBack} />;
  }

  return (
    <div className="flex flex-col gap-2">
      <h1
        className="text-xl font-bold mb-2"
        style={{ color: 'var(--purple)', fontFamily: 'var(--font-dot-gothic), monospace' }}
      >
        ⚔️ セッション比較
      </h1>
      <PartnerPicker
        partners={partners}
        onSelect={p => { setActivePartner(p); setCurrentPartner(p); }}
      />
    </div>
  );
}

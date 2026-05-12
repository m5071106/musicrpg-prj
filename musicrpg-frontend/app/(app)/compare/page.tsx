'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { apiFetch } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import {
  getPartners,
  saveSessionToServer,
  syncPartnersFromServer,
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

  // QRコードにデコードされた相手の実際のステータスを使用する
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

  function handleSaveSession() {
    const session: SessionRecord = {
      id: `${Date.now()}`,
      partnerUsername: partner.username,
      partnerInstrument: partner.instrument,
      playedSongs: Array.from(selected),
      date: new Date().toISOString(),
    };
    saveSessionToServer(session, apiFetch);
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
          background: 'var(--panel)',
          borderColor: 'var(--border)',
          boxShadow: '0 3px 0 #e8c9f0',
        }}
      >
        <p className="text-xs font-bold mb-3" style={{ color: 'var(--dim)' }}>
          🎵 共通曲 ({commonSongs.length}曲)
        </p>
        {commonSongs.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: 'var(--dim)' }}>
            共通曲がありません
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {commonSongs.map(song => (
              <li key={song.title}>
                <button
                  type="button"
                  onClick={() => toggleSong(song.title)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-[10px] border-2 transition-all active:translate-y-0.5 text-left"
                  style={{
                    borderColor: selected.has(song.title) ? 'var(--purple)' : 'var(--border)',
                    background: selected.has(song.title) ? 'var(--lavender)' : '#fdfaff',
                  }}
                >
                  <span className="text-sm">{selected.has(song.title) ? '✓' : '○'}</span>
                  <span className="flex-1 text-sm truncate" style={{ color: 'var(--text)' }}>
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
            disabled={selected.size === 0}
            className="w-full mt-3 py-2.5 rounded-[12px] font-bold text-white text-sm active:translate-y-0.5 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, var(--purple), var(--cyan))' }}
          >
            {saved ? '✓ 保存しました！' : `🎮 ${selected.size}曲をセッション記録`}
          </button>
        )}
      </div>

      {/* ② レーダーチャート */}
      <div
        className="rounded-[18px] border-2 p-4"
        style={{ background: 'var(--panel)', borderColor: 'var(--border)', boxShadow: '0 3px 0 #e8c9f0' }}
      >
        <p className="text-xs font-bold mb-3" style={{ color: 'var(--dim)' }}>
          📊 ステータス比較
        </p>
        <RadarChart stats={myStats} compareStats={partnerStats} />
      </div>

      {/* ③ バトルバー */}
      <div
        className="rounded-[18px] border-2 p-4"
        style={{ background: 'var(--panel)', borderColor: 'var(--border)', boxShadow: '0 3px 0 #e8c9f0' }}
      >
        <p className="text-xs font-bold mb-3" style={{ color: 'var(--dim)' }}>
          ⚔️ 項目別対決
        </p>
        <BattleBars myStats={myStats} senpaiStats={partnerStats} />
      </div>

      {/* ④ 相手の曲一覧 */}
      <div
        className="rounded-[18px] border-2 p-4"
        style={{ background: 'var(--panel)', borderColor: 'var(--border)', boxShadow: '0 3px 0 #e8c9f0' }}
      >
        <p className="text-xs font-bold mb-3" style={{ color: 'var(--dim)' }}>
          🎶 {partner.username} の曲 ({partner.songs.length}曲)
        </p>
        {partner.songs.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: 'var(--dim)' }}>
            曲情報がありません
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {partner.songs.map(song => (
              <li
                key={song.title}
                className="flex items-center gap-2 px-3 py-2 rounded-[10px]"
                style={{ background: 'var(--lavender)' }}
              >
                <span className="flex-1 text-sm truncate" style={{ color: 'var(--text)' }}>
                  {song.title}
                </span>
                <span className="text-xs" style={{ color: 'var(--purple)' }}>
                  {'★'.repeat(song.stars)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ── メインページ ──────────────────────────────────────
export default function ComparePage() {
  const { data: myProfile } = useSWR<MusicProfile>(
    '/music/profile/',
    (p: string) => apiFetch<MusicProfile>(p)
  );
  const currentPartner = useAppStore(s => s.currentPartner);
  const setCurrentPartner = useAppStore(s => s.setCurrentPartner);
  const [partners, setPartners] = useState<PartnerProfile[]>([]);

  useEffect(() => {
    setPartners(getPartners());
    syncPartnersFromServer(apiFetch).then(() => {
      setPartners(getPartners());
    });
  }, []);

  const handleSelect = (p: PartnerProfile) => {
    setCurrentPartner(p);
  };

  const handleBack = () => {
    setCurrentPartner(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <h1
        className="text-xl font-bold"
        style={{ color: 'var(--purple)', fontFamily: 'var(--font-dot-gothic), monospace' }}
      >
        🆚 比較
      </h1>

      {!myProfile ? (
        <p style={{ color: 'var(--dim)' }}>読み込み中...</p>
      ) : currentPartner ? (
        <CompareView
          myProfile={myProfile}
          partner={currentPartner}
          onBack={handleBack}
        />
      ) : (
        <PartnerPicker partners={partners} onSelect={handleSelect} />
      )}
    </div>
  );
}

'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { apiFetch } from '@/lib/api';
import { INSTRUMENT_EMOJIS, INSTRUMENT_LABELS } from '@/lib/constants';
import RadarChart from '@/components/RadarChart';
import StatSlider from '@/components/StatSlider';
import InstrumentSelector from '@/components/InstrumentSelector';
import LevelUpBanner from '@/components/LevelUpBanner';
import type { MusicProfile, Stats, Instrument } from '@/types';

export default function StatusPage() {
  const { data: profile, mutate, isLoading } = useSWR<MusicProfile>('/music/profile/', (path: string) => apiFetch<MusicProfile>(path));
  const [editing, setEditing] = useState(false);
  const [localStats, setLocalStats] = useState<Stats | null>(null);
  const [localInstrument, setLocalInstrument] = useState<Instrument | null>(null);
  const [saving, setSaving] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  function startEdit() {
    if (!profile) return;
    setLocalStats({
      stat_tempo: profile.stat_tempo,
      stat_emotion: profile.stat_emotion,
      stat_range: profile.stat_range,
      stat_effort: profile.stat_effort,
      stat_stage: profile.stat_stage,
    });
    setLocalInstrument(profile.instrument);
    setEditing(true);
  }

  async function saveEdit() {
    if (!localStats || !localInstrument) return;
    setSaving(true);
    try {
      await apiFetch('/music/profile/', {
        method: 'PATCH',
        body: JSON.stringify({ ...localStats, instrument: localInstrument }),
      });
      await mutate();
      setEditing(false);
      setShowBanner(true);
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    setEditing(false);
    setLocalStats(null);
    setLocalInstrument(null);
  }

  const handleBannerDone = useCallback(() => setShowBanner(false), []);

  const displayStats = editing && localStats ? localStats : profile;
  const totalLevel = displayStats
    ? displayStats.stat_tempo +
      displayStats.stat_emotion +
      displayStats.stat_range +
      displayStats.stat_effort +
      displayStats.stat_stage
    : 0;

  if (isLoading || !profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <p style={{ color: 'var(--dim)', fontFamily: 'var(--font-dot-gothic), monospace' }}>
          Loading...
        </p>
      </div>
    );
  }

  const instrument = editing && localInstrument ? localInstrument : profile.instrument;

  return (
    <>
      <LevelUpBanner show={showBanner} onDone={handleBannerDone} />

      <div className="flex flex-col gap-4">
        {/* Header Card */}
        <div
          className="rounded-[18px] border-2 p-4 flex items-center gap-4"
          style={{ background: 'var(--panel)', borderColor: 'var(--border)', boxShadow: '0 3px 0 #e8c9f0' }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-3xl border-2"
            style={{ background: 'var(--lavender)', borderColor: 'var(--border)' }}
          >
            {INSTRUMENT_EMOJIS[instrument]}
          </div>
          <div className="flex-1">
            <h1
              className="text-lg font-bold"
              style={{ color: 'var(--purple)', fontFamily: 'var(--font-dot-gothic), monospace' }}
            >
              My Card
            </h1>
            <p className="text-sm" style={{ color: 'var(--dim)' }}>
              {INSTRUMENT_LABELS[instrument]}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs" style={{ color: 'var(--dim)' }}>TOTAL</p>
            <p
              className="text-2xl font-bold"
              style={{ color: 'var(--gold)', fontFamily: 'var(--font-dot-gothic), monospace' }}
            >
              Lv.{totalLevel}
            </p>
          </div>
        </div>

        {/* Radar Chart */}
        <div
          className="rounded-[18px] border-2 p-4 flex justify-center"
          style={{ background: 'var(--panel)', borderColor: 'var(--border)', boxShadow: '0 3px 0 #e8c9f0' }}
        >
          {displayStats && <RadarChart stats={displayStats} />}
        </div>

        {/* Stats + Edit */}
        <div
          className="rounded-[18px] border-2 p-4"
          style={{ background: 'var(--panel)', borderColor: 'var(--border)', boxShadow: '0 3px 0 #e8c9f0' }}
        >
          {editing && localStats ? (
            <>
              <p className="text-xs font-bold mb-3" style={{ color: 'var(--dim)' }}>
                楽器
              </p>
              <InstrumentSelector
                value={localInstrument!}
                onChange={setLocalInstrument}
              />
              <p className="text-xs font-bold mt-4 mb-3" style={{ color: 'var(--dim)' }}>
                ステータス
              </p>
              <StatSlider
                stats={localStats}
                onChange={(key, val) => setLocalStats((prev) => prev ? { ...prev, [key]: val } : prev)}
              />
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={saveEdit}
                  disabled={saving}
                  className="flex-1 py-2 rounded-[12px] font-bold text-white text-sm active:translate-y-0.5"
                  style={{ background: 'var(--purple)' }}
                >
                  {saving ? '保存中...' : '保存'}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="flex-1 py-2 rounded-[12px] font-bold text-sm border-2 active:translate-y-0.5"
                  style={{ borderColor: 'var(--border)', color: 'var(--dim)' }}
                >
                  キャンセル
                </button>
              </div>
            </>
          ) : (
            <>
              <StatSlider stats={profile} onChange={() => {}} disabled />
              <button
                type="button"
                onClick={startEdit}
                className="w-full mt-4 py-2 rounded-[12px] font-bold text-sm border-2 active:translate-y-0.5"
                style={{ borderColor: 'var(--purple)', color: 'var(--purple)' }}
              >
                ✏️ 編集する
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

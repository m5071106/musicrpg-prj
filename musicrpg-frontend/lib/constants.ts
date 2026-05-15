import type { Stats } from '@/types';

export const STAT_LABELS = ['TEMPO', 'EMOTION', 'RANGE', 'EFFORT', 'STAGE'] as const;

export const STAT_KEYS: (keyof Stats)[] = [
  'stat_tempo',
  'stat_emotion',
  'stat_range',
  'stat_effort',
  'stat_stage',
];

export const STAT_COLORS = {
  stat_tempo: '#f5a623',
  stat_emotion: '#ff7eb3',
  stat_range: '#5bc8e8',
  stat_effort: '#6dcc7f',
  stat_stage: '#b06ee0',
};

export const PRESET_INSTRUMENTS = [
  { key: 'piano', label: 'ピアノ', emoji: '🎹' },
  { key: 'keyboard', label: 'キーボード', emoji: '🎹' },
  { key: 'guitar', label: 'ギター', emoji: '🎸' },
  { key: 'electric_guitar', label: 'エレキギター', emoji: '🎸' },
  { key: 'bass', label: 'ベース', emoji: '🎸' },
  { key: 'violin', label: 'ヴァイオリン', emoji: '🎻' },
  { key: 'viola', label: 'ヴィオラ', emoji: '🎻' },
  { key: 'cello', label: 'チェロ', emoji: '🎻' },
  { key: 'contrabass', label: 'コントラバス', emoji: '🎻' },
  { key: 'vocal', label: 'ボーカル', emoji: '🎤' },
  { key: 'sax', label: 'サックス', emoji: '🎷' },
  { key: 'esax', label: 'エレキサックス', emoji: '🎷' },
  { key: 'trumpet', label: 'トランペット', emoji: '🎺' },
  { key: 'trombone', label: 'トロンボーン', emoji: '🎺' },
  { key: 'french_horn', label: 'フレンチホルン', emoji: '🎺' },
  { key: 'flute', label: 'フルート', emoji: '🪈' },
  { key: 'clarinet', label: 'クラリネット', emoji: '🎵' },
  { key: 'oboe', label: 'オーボエ', emoji: '🎵' },
  { key: 'drums', label: 'ドラム', emoji: '🥁' },
  { key: 'percussion', label: 'パーカッション', emoji: '🥁' },
  { key: 'ukulele', label: 'ウクレレ', emoji: '🎸' },
  { key: 'harp', label: 'ハープ', emoji: '🎵' },
] as const;

export function getInstrumentInfo(inst: string): { label: string; emoji: string } {
  const preset = PRESET_INSTRUMENTS.find(p => p.key === inst);
  return preset ? { label: preset.label, emoji: preset.emoji } : { label: inst, emoji: '🎵' };
}

export const SENPAI_DATA: Stats = {
  stat_tempo: 4,
  stat_emotion: 5,
  stat_range: 3,
  stat_effort: 4,
  stat_stage: 5,
};

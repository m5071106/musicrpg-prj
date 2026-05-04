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

export const INSTRUMENT_LABELS = {
  piano: 'ピアノ',
  esax: 'エレキサックス',
  vocal: 'ボーカル',
};

export const INSTRUMENT_EMOJIS = {
  piano: '🎹',
  esax: '🎷',
  vocal: '🎤',
};

export const SENPAI_DATA: Stats = {
  stat_tempo: 4,
  stat_emotion: 5,
  stat_range: 3,
  stat_effort: 4,
  stat_stage: 5,
};

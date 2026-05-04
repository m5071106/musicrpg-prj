export type Instrument = 'piano' | 'esax' | 'vocal';
export type Stars = 1 | 2 | 3 | 4 | 5;

export interface Stats {
  stat_tempo: number;
  stat_emotion: number;
  stat_range: number;
  stat_effort: number;
  stat_stage: number;
}

export interface Song {
  id: number;
  title: string;
  stars: Stars;
  added_at: string;
}

export interface MusicProfile extends Stats {
  id: number;
  instrument: Instrument;
  updated_at: string;
  songs: Song[];
}

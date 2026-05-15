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
  mb_id?: string;
  mb_title?: string;
}

export interface MusicProfile extends Stats {
  id: number;
  instruments: string[];
  updated_at: string;
  songs: Song[];
}

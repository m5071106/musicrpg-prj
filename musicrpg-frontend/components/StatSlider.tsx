'use client';

import { STAT_COLORS, STAT_KEYS, STAT_LABELS } from '@/lib/constants';
import type { Stats } from '@/types';

interface Props {
  stats: Stats;
  onChange: (key: keyof Stats, value: number) => void;
  disabled?: boolean;
}

export default function StatSlider({ stats, onChange, disabled }: Props) {
  return (
    <div className="flex flex-col gap-3 w-full">
      {STAT_KEYS.map((key, i) => {
        const color = STAT_COLORS[key];
        const value = stats[key];
        return (
          <div key={key} className="flex items-center gap-3">
            <span
              className="text-xs font-bold w-16 shrink-0"
              style={{ color, fontFamily: 'DotGothic16, monospace' }}
            >
              {STAT_LABELS[i]}
            </span>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={value}
              disabled={disabled}
              onChange={(e) => onChange(key, Number(e.target.value))}
              className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
              style={{
                '--stat-color': color,
                background: `linear-gradient(to right, ${color} ${(value - 1) / 4 * 100}%, #e8d5f8 ${(value - 1) / 4 * 100}%)`,
              } as React.CSSProperties}
            />
            <span
              className="text-sm font-bold w-5 text-right"
              style={{ color }}
            >
              {value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

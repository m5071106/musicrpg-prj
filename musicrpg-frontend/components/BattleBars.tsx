import { STAT_KEYS, STAT_LABELS } from '@/lib/constants';
import type { Stats } from '@/types';

interface Props {
  myStats: Stats;
  senpaiStats: Stats;
}

export default function BattleBars({ myStats, senpaiStats }: Props) {
  return (
    <div className="flex flex-col gap-3 w-full">
      {STAT_KEYS.map((key, i) => {
        const myVal = myStats[key];
        const senpaiVal = senpaiStats[key];
        const myPct = (myVal / 5) * 100;
        const senpaiPct = (senpaiVal / 5) * 100;
        const winning = myVal >= senpaiVal;
        return (
          <div key={key} className="flex flex-col gap-1">
            <div className="flex justify-between text-xs font-bold">
              <span style={{ color: '#5bc8e8', fontFamily: 'DotGothic16, monospace' }}>
                {STAT_LABELS[i]}
              </span>
              <span>
                <span style={{ color: '#5bc8e8' }}>{myVal}</span>
                <span style={{ color: '#9a8aaa' }}> / </span>
                <span style={{ color: '#ff7eb3' }}>{senpaiVal}</span>
              </span>
            </div>
            <div className="relative h-4 rounded-full overflow-hidden" style={{ background: '#ede0f8' }}>
              <div
                className="absolute top-0 left-0 h-full rounded-full transition-all duration-500"
                style={{ width: `${senpaiPct}%`, background: 'rgba(255,126,179,0.4)' }}
              />
              <div
                className="absolute top-0 left-0 h-full rounded-full transition-all duration-500"
                style={{ width: `${myPct}%`, background: winning ? '#5bc8e8' : '#aaa' }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

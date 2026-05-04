import type { Stars } from '@/types';

interface Props {
  value: Stars | number;
  onChange?: (v: Stars) => void;
  readonly?: boolean;
  size?: 'sm' | 'md';
}

export default function StarRating({ value, onChange, readonly, size = 'md' }: Props) {
  const sz = size === 'sm' ? 'text-base' : 'text-xl';
  return (
    <div className="flex gap-0.5">
      {([1, 2, 3, 4, 5] as Stars[]).map((n) => (
        <button
          key={n}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(n)}
          className={`${sz} transition-transform active:scale-90`}
          style={{ color: n <= value ? '#f5a623' : '#e8c9f0' }}
          aria-label={`${n}星`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

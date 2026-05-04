import { INSTRUMENT_EMOJIS, INSTRUMENT_LABELS } from '@/lib/constants';
import type { Instrument } from '@/types';

interface Props {
  value: Instrument;
  onChange: (v: Instrument) => void;
  disabled?: boolean;
}

const INSTRUMENTS: Instrument[] = ['piano', 'esax', 'vocal'];

export default function InstrumentSelector({ value, onChange, disabled }: Props) {
  return (
    <div className="flex gap-2">
      {INSTRUMENTS.map((inst) => (
        <button
          key={inst}
          type="button"
          disabled={disabled}
          onClick={() => onChange(inst)}
          className="flex flex-col items-center px-3 py-2 rounded-[12px] border-2 text-xs font-bold transition-all active:translate-y-0.5"
          style={{
            borderColor: value === inst ? '#b06ee0' : '#e8c9f0',
            background: value === inst ? '#e8d5f8' : '#ffffff',
            color: value === inst ? '#b06ee0' : '#9a8aaa',
          }}
        >
          <span className="text-lg">{INSTRUMENT_EMOJIS[inst]}</span>
          <span>{INSTRUMENT_LABELS[inst]}</span>
        </button>
      ))}
    </div>
  );
}
